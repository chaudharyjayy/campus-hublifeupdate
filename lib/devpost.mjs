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

/** Best-effort end date from devpost strings like "Sep 24 - 30, 2026" or "Nov 21, 2026". */
export function extractEndDate(text) {
  if (!text) return null;
  const s = String(text);
  const yearMatch = s.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);
  const toISO = (month, day, yr = year) => new Date(Date.UTC(yr, month, day, 18, 0, 0)).toISOString().slice(0, 10);

  const cross = s.match(/([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2})[^0-9]*\d{4}/);
  if (cross) {
    const month = monthOf(cross[3]);
    return month === undefined ? null : toISO(month, Number(cross[4]));
  }

  const sameMonth = s.match(/([A-Za-z]{3,9})\s+(\d{1,2})[^,;]*?-\s*(\d{1,2})\b/);
  if (sameMonth) {
    const month = monthOf(sameMonth[1]);
    return month === undefined ? null : toISO(month, Number(sameMonth[3]));
  }

  const single = s.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s*(\d{4})/);
  if (single) {
    const month = monthOf(single[1]);
    return month === undefined ? null : toISO(month, Number(single[2]));
  }
  return null;
}

const PUNE = /pune/i;

export function isPune(hackathon) {
  const location = hackathon?.displayed_location?.location;
  return typeof location === 'string' && PUNE.test(location);
}

export function normalizeHackathon(hackathon) {
  const state = hackathon?.open_state;
  if (state !== 'open' && state !== 'upcoming') return null;
  if (!isPune(hackathon)) return null;

  const url = String(hackathon?.url ?? '');
  if (!/^https:\/\//i.test(url) || url.length > 2048 || url.includes('@')) return null;

  const id = Number(hackathon?.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const title = stripHtml(hackathon?.title)?.slice(0, 200);
  if (!title) return null;

  const loc = String(hackathon?.displayed_location?.location ?? 'Pune').trim().slice(0, 120);
  const themes = Array.isArray(hackathon?.themes)
    ? hackathon.themes.map((theme) => String(theme?.name ?? '').trim().slice(0, 40)).filter(Boolean).slice(0, 12)
    : [];
  const thumbnail = hackathon?.thumbnail_url ? String(hackathon.thumbnail_url) : null;
  const end = extractEndDate(hackathon?.submission_period_dates);
  return {
    external_id: `devpost-${id}`,
    source: 'devpost',
    title,
    tagline: null,
    official_url: url,
    starts_on: null,
    ends_on: end,
    deadline_on: end,
    location: loc || 'Pune',
    organiser: stripHtml(hackathon?.organization_name)?.slice(0, 160) ?? null,
    category: themes[0] ?? null,
    themes,
    prize_display: stripHtml(hackathon?.prize_amount)?.slice(0, 120) ?? null,
    registrations_count: Number.isFinite(Number(hackathon?.registrations_count)) ? Number(hackathon.registrations_count) : null,
    open_state: state,
    mode: /online/i.test(loc) ? (PUNE.test(loc) ? 'hybrid' : 'online') : 'offline',
    thumbnail_url: thumbnail && /^https?:\/\//i.test(thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail)
      ? (thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail).slice(0, 512)
      : null,
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
