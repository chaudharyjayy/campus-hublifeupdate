/* Devpost -> live_events normalizer. Shared with the Node sync script.
   NOTE: the Deno edge function keeps a mirrored copy; keep them in sync. */

export function stripHtml(value) {
  if (!value) return null;
  const decode = (input) => String(input)
    .replace(/&#8377;/g, '₹')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ');
  const decoded = decode(decode(String(value)));       // decode twice: double-encoded entries
  const stripped = decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  return stripped || null;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const monthOf = (name) => MONTHS[String(name).slice(0, 3).toLowerCase()];

/** Best-effort { start, end } from devpost strings like "Sep 24 - 30, 2026" or "Nov 21, 2026". */
export function extractPeriodDates(text) {
  if (!text) return { start: null, end: null };
  const input = String(text);
  const year = (input.match(/\b\d{4}\b/) || [])[0];
  if (!year) return { start: null, end: null };
  const toISO = (month, day) =>
    month === undefined || day == null ? null : new Date(Date.UTC(Number(year), month, day, 18, 0, 0)).toISOString().slice(0, 10);

  const token = /([A-Za-z]{3,9})\s+(\d{1,2})(?:\s*,\s*(\d{4}))?/g;
  const parts = input.match(token);
  if (parts && parts.length >= 2) {
    const first = parts[0].match(/([A-Za-z]{3,9})\s+(\d{1,2})/);
    const last = parts[parts.length - 1].match(/([A-Za-z]{3,9})\s+(\d{1,2})/);
    return { start: toISO(monthOf(first[1]), Number(first[2])), end: toISO(monthOf(last[1]), Number(last[2])) };
  }

  const single = input.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s*(\d{4})?/);
  if (single) {
    const day = Number(single[2]);
    return { start: toISO(monthOf(single[1]), day), end: toISO(monthOf(single[1]), day) };
  }
  return { start: null, end: null };
}

// PUNE_RE kept deliberate: strict Pune-location filter.
const ONLINE_RE = /online|remote/i;
const isHttpsUrl = (value) => typeof value === 'string' && /^https:\/\//i.test(value) && value.length <= 2048 && !value.includes('@');

export function normalizeHackathon(hackathon) {
  if (hackathon?.open_state !== 'open' && hackathon?.open_state !== 'upcoming') return null;

  const location = hackathon?.displayed_location?.location ?? '';
  const loc = String(location || hackathon?.organization_name || 'Pune').trim().slice(0, 120);
  // Strict Pune: venue or organiser must be anchored to Pune.
  if (!/pune/i.test(loc)) return null;

  const id = Number(hackathon?.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  // Registration URL: prefer the challenge's direct registration page.
  const registerUrl = isHttpsUrl(hackathon?.start_a_submission_url)
    ? String(hackathon.start_a_submission_url)
    : isHttpsUrl(hackathon?.url)
      ? String(hackathon.url)
      : null;
  if (!registerUrl) return null;

  const title = stripHtml(hackathon?.title)?.slice(0, 200);
  if (!title) return null;

  const themes = Array.isArray(hackathon?.themes)
    ? hackathon.themes.map((theme) => String(theme?.name ?? '').trim().slice(0, 40)).filter(Boolean).slice(0, 12)
    : [];

  const { start, end } = extractPeriodDates(hackathon?.submission_period_dates);
  const thumbnail = hackathon?.thumbnail_url ? String(hackathon.thumbnail_url) : null;
  const thumbnailSafe = thumbnail && /^https?:\/\//i.test(thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail)
    ? (thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail).slice(0, 512)
    : null;

  return {
    external_id: `devpost-${id}`,
    source: 'devpost',
    title,
    tagline: stripHtml(hackathon?.tagline) ?? null,
    official_url: registerUrl,
    starts_on: start,
    ends_on: end,
    deadline_on: end,
    location: loc,
    organiser: stripHtml(hackathon?.organization_name)?.slice(0, 160) ?? null,
    category: themes[0] ?? null,
    themes,
    prize_display: stripHtml(hackathon?.prize_amount)?.slice(0, 120) ?? null,
    registrations_count: Number.isFinite(Number(hackathon?.registrations_count)) ? Number(hackathon.registrations_count) : null,
    open_state: hackathon.open_state,
    mode: ONLINE_RE.test(loc) ? (PUNE_RE.test(loc) ? 'hybrid' : 'online') : 'offline',
    thumbnail_url: thumbnailSafe,
    synced_at: new Date().toISOString(),
    published: true,
  };
}

export function collectLiveEvents(hackathons) {
  const byId = new Map();
  for (const hackathon of hackathons ?? []) {
    const normalized = normalizeHackathon(hackathon);
    if (normalized) byId.set(normalized.external_id, normalized);
  }
  return [...byId.values()];
}

export async function fetchPune({ statuses = ['open', 'upcoming'], perPage = 100, fetchImpl = fetch } = {}) {
  const all = [];
  for (const status of statuses) {
    const url = `https://devpost.com/api/hackathons?search=Pune&status=${encodeURIComponent(status)}&per_page=${perPage}`;
    const response = await fetchImpl(url, {
      headers: { 'User-Agent': 'CampusHub-Pune/0.1 (event sync; contact the repo owner)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`devpost ${status}: HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 2_000_000) throw new Error(`devpost ${status}: body too large`);
    const parsed = JSON.parse(body);
    all.push(...(parsed?.hackathons ?? []));
  }
  return collectLiveEvents(all);
}
