/* Gemini-grounding pipeline: real open/upcoming Pune events via Google Search.
   Mirrors the Deno edge function; keep them in sync. */

import { createHash } from 'node:crypto';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const ENDPOINT = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export function buildPrompt(todayISO) {
  return [
    `Today is ${todayISO}.`,
    'List open or upcoming hackathons, student tech fests, workshops and open-source programs physically in Pune, India (as of today).',
    'Return ONLY real events you can verify online. Prefer the registration page from the organiser (Devpost, Unstop, Eventbrite, the college site).',
    'OfficialLink must be the DIRECT REGISTRATION page, not an announcement, gallery, social post or blog.',
    'If you cannot confirm a registration page, omit the event entirely.',
    'Never invent: dates, deadlines, prizes, stipends, capacities, registration counts. Unknown fields must be null.',
    'Venue must mention Pune (district, city or a college in Pune). Online-only events with no Pune anchor must be omitted.',
    'Concluded events must be omitted.',
    'Return strict JSON with exactly this shape — no prose, no markdown fences:',
    '{"events":[{"title":string,"officialLink":string,"organiser":string|null,"startDate":"YYYY-MM-DD"|null,"endDate":"YYYY-MM-DD"|null,"venue":string|null,"mode":"online"|"offline"|"hybrid"|null,"prize":string|null,"themes":string[]|null}]}',
    'Return {"events":[]} if there are no real ones right now.',
  ].join('\n');
}

export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    events: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          officialLink: { type: 'STRING' },
          organiser: { type: 'STRING' },
          startDate: { type: 'STRING' },
          endDate: { type: 'STRING' },
          venue: { type: 'STRING' },
          mode: { type: 'STRING' },
          prize: { type: 'STRING' },
          themes: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['title', 'officialLink'],
      },
    },
  },
  required: ['events'],
};

const isHttps = (value) => typeof value === 'string' && /^https:\/\//i.test(value) && value.length <= 2048 && !value.includes('@');
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const cleanText = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : null);
const PUNE_RE = /pune/i;
const ONLINE_RE = /online|remote/i;

export function parseGeminiEventsJson(text) {
  const cleaned = String(text ?? '').replace(/```(?:json)?|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const items = Array.isArray(parsed?.events) ? parsed.events : [];
  const accepted = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const title = cleanText(item.title, 200);
    const link = String(item.officialLink ?? '').trim();
    if (!title || !isHttps(link)) continue;

    const venue = cleanText(item.venue, 120);
    if (!PUNE_RE.test(String(venue ?? ''))) continue; // strict Pune

    const today = new Date().toISOString().slice(0, 10);
    const start = isDate(item.startDate) ? item.startDate : null;
    const end = isDate(item.endDate) ? item.endDate : (start ?? null);

    let open_state = 'upcoming';
    if (start && start <= today && (end ?? start) >= today) open_state = 'open';
    if (end && end < today) continue; // concluded
    if (start && start > today) open_state = 'upcoming';

    const themes = Array.isArray(item.themes)
      ? item.themes.map((theme) => cleanText(String(theme), 40)).filter(Boolean).slice(0, 12)
      : [];

    accepted.push({ title, link, organiser: cleanText(item.organiser, 160), start, end, location: venue, mode: ONLINE_RE.test(venue) ? 'hybrid' : 'offline', prize: cleanText(item.prize, 120), themes, open_state });
  }
  return accepted;
}

export function geminiItemsToLiveRows(items) {
  return items.map((item) => ({
    external_id: `gemini-${createHash('sha256').update(item.link).digest('hex').slice(0, 16)}`,
    source: 'gemini',
    title: item.title,
    tagline: null,
    official_url: item.link,
    starts_on: item.start,
    ends_on: item.end,
    deadline_on: item.end,
    location: String(item.location ?? 'Pune').slice(0, 120),
    organiser: item.organiser ?? null,
    category: item.themes[0] ?? null,
    themes: item.themes,
    prize_display: item.prize ?? null,
    registrations_count: null,
    open_state: item.open_state,
    mode: item.mode,
    thumbnail_url: null,
    synced_at: new Date().toISOString(),
    published: true,
  }));
}

/** Quick existence check for a candidate URL (offline quota has no grounding). */
async function urlExists(url, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36' },
    });
    const finalUrl = response.url;
    if (!/^https:\/\//i.test(finalUrl)) return false;
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

/** Plain generation + online link probes — works even when grounding quota is exhausted. */
export async function fetchGeminiPuneOffline({ apiKey, model = GEMINI_MODEL, fetchImpl = fetch, todayISO = new Date().toISOString().slice(0, 10) } = {}) {
  if (!apiKey) return [];
  const response = await fetchImpl(ENDPOINT(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: buildOfflinePrompt(todayISO),
        }],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
        maxOutputTokens: 2048,
      },
    }),
  });
  if (!response.ok) throw new Error(`gemini: HTTP ${response.status}`);
  const raw = await response.text();
  if (raw.length > 400_000) throw new Error('gemini: response too large');
  const body = JSON.parse(raw);
  const text = body?.candidates?.[0]?.content?.parts?.map((part) => part?.text ?? '').join('') ?? '';
  const items = parseGeminiEventsJson(text);

  // Second line of defense: every candidate link must resolve online right now.
  const batch = items.slice(0, 24);
  const outcomes = await Promise.allSettled(batch.map((item) => urlExists(item.link, fetchImpl)));
  return batch.filter((_, index) => outcomes[index].status === 'fulfilled' && outcomes[index].value);
}

export function buildOfflinePrompt(todayISO) {
  return [
    `Today is ${todayISO}. I need real hackathons, student tech fests, workshops and open-source programs physically in Pune, India happening in the next 60 days (open now or upcoming).`,
    'Only include events you know exist with a working registration page — Devpost, Unstop, Eventbrite, organiser sites.',
    'If you are not sure an event is happening, leave it out.',
    'Return strict JSON with exactly this shape — no prose:',
    '{"events":[{"title":string,"officialLink":string,"organiser":string|null,"startDate":"YYYY-MM-DD"|null,"endDate":"YYYY-MM-DD"|null,"venue":string|null,"mode":"online"|"offline"|"hybrid"|null,"prize":string|null,"themes":string[]|null}]}',
    'Return {"events":[]} if you cannot name any real ones.',
  ].join('\n');
}

export async function fetchGeminiPune({ apiKey, model = GEMINI_MODEL, fetchImpl = fetch, todayISO = new Date().toISOString().slice(0, 10) } = {}) {
  if (!apiKey) return [];
  const response = await fetchImpl(ENDPOINT(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(todayISO) }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
        maxOutputTokens: 2048,
      },
    }),
  });
  if (!response.ok) throw new Error(`gemini: HTTP ${response.status}`);
  const raw = await response.text();
  if (raw.length > 400_000) throw new Error('gemini: response too large');
  const body = JSON.parse(raw);
  const text = body?.candidates?.[0]?.content?.parts?.map((part) => part?.text ?? '').join('') ?? '';
  return parseGeminiEventsJson(text);
}
