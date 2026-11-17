// Sync open/upcoming Pune hackathons from Devpost into live_events.
// Trigger manually or by hosted cron: curl -X POST .../functions/v1/sync-live-events -H "Authorization: Bearer $SYNC_SECRET"
// Mirrors lib/devpost.mjs; keep them in sync.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const monthOf = (name: string) => MONTHS[name.slice(0, 3).toLowerCase()];

function stripHtml(value: unknown): string | null {
  if (!value) return null;
  const decode = (input: string) => String(input)
    .replace(/&#8377;/g, '₹')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ');
  const decoded = decode(decode(String(value)));
  const stripped = decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  return stripped || null;
}

function extractEndDate(text: string | null): string | null {
  if (!text) return null;
  const s = String(text);
  const yearMatch = s.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);
  const toISO = (month: number, day: number) => new Date(Date.UTC(year, month, day, 18)).toISOString().slice(0, 10);

  const cross = s.match(/([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2})[^0-9]*\d{4}/);
  if (cross) {
    const month = monthOf(cross[3]);
    return month === undefined ? null : new Date(Date.UTC(year, month, Number(cross[4]), 18)).toISOString().slice(0, 10);
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

type DevpostHackathon = {
  id: number;
  title: string;
  open_state: string;
  url: string;
  displayed_location?: { location?: string };
  organization_name?: string;
  prize_amount?: string;
  registrations_count?: number;
  submission_period_dates?: string;
  submission_period_dates_display?: string;
  themes?: Array<{ name: string }>;
  thumbnail_url?: string;
};

function normalizeHackathon(hackathon: DevpostHackathon) {
  if (hackathon.open_state !== 'open' && hackathon.open_state !== 'upcoming') return null;
  const location = hackathon.displayed_location?.location ?? '';
  if (!/pune/i.test(location)) return null;
  if (!/^https:\/\//i.test(hackathon.url) || hackathon.url.length > 2048 || hackathon.url.includes('@')) return null;
  if (!Number.isFinite(hackathon.id) || hackathon.id <= 0) return null;

  const title = stripHtml(hackathon.title)?.slice(0, 200);
  if (!title) return null;

  const loc = String(location || 'Pune').trim().slice(0, 120);
  const themes = (hackathon.themes ?? [])
    .map((theme) => String(theme?.name ?? '').trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 12);
  const end = extractEndDate(hackathon.submission_period_dates ?? hackathon.submission_period_dates_display ?? null);
  const isOnline = /online/i.test(loc);
  const thumbnail = hackathon.thumbnail_url ? String(hackathon.thumbnail_url) : null;
  const thumbnailSafe = thumbnail && /^https?:\/\//i.test(thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail)
    ? (thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail).slice(0, 512)
    : null;

  return {
    external_id: `devpost-${hackathon.id}`,
    source: 'devpost',
    title,
    tagline: null,
    official_url: hackathon.url,
    starts_on: null,
    ends_on: end,
    deadline_on: end,
    location: loc,
    organiser: stripHtml(hackathon.organization_name)?.slice(0, 160) ?? null,
    category: themes[0] ?? null,
    themes,
    prize_display: stripHtml(hackathon.prize_amount)?.slice(0, 120) ?? null,
    registrations_count: Number.isFinite(hackathon.registrations_count) ? hackathon.registrations_count : null,
    open_state: hackathon.open_state,
    mode: isOnline ? (/pune/i.test(loc) ? 'hybrid' : 'online') : 'offline',
    thumbnail_url: thumbnailSafe,
    synced_at: new Date().toISOString(),
    published: true,
  };
}

/** Constant-time comparison for the bearer secret (equal-length inputs). */
function secretsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('SYNC_SECRET');
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret ?? ''}`;
  if (!secret || !secretsEqual(auth, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rows = new Map<string, NonNullable<ReturnType<typeof normalizeHackathon>>>();
  for (const status of ['open', 'upcoming']) {
    const url = `https://devpost.com/api/hackathons?search=Pune&status=${status}&per_page=100`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CampusHub-Pune/0.1 (event sync; contact the repo owner)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return new Response('upstream error', { status: 502 });
    const body = await response.text();
    if (body.length > 2_000_000) return new Response('upstream error', { status: 502 });
    const parsed = JSON.parse(body) as { hackathons?: DevpostHackathon[] };
    for (const hackathon of parsed?.hackathons ?? []) {
      const normalized = normalizeHackathon(hackathon);
      if (normalized) rows.set(normalized.external_id, normalized);
    }
  }

  if (rows.size === 0) return Response.json({ synced: 0 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return new Response('Supabase env missing', { status: 500 });

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { error } = await client.from('live_events').upsert([...rows.values()], { onConflict: 'external_id' });
  if (error) return new Response('upsert failed', { status: 500 });

  return Response.json({ synced: rows.size });
});
