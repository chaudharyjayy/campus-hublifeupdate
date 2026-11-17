import type { LiveEvent } from '@/lib/live-events';
import { formatDate } from '@/lib/format';
import type { DetailsData } from '@/components/EventDetailsDialog';

export const LIVE_SELECT = 'id,external_id,source,title,tagline,official_url,starts_on,ends_on,deadline_on,location,organiser,category,themes,prize_display,registrations_count,open_state,mode,thumbnail_url,synced_at';

export const liveEventToCard = (event: LiveEvent): DetailsData => ({
  id: event.external_id,
  kind: 'live',
  title: event.title,
  officialUrl: event.official_url,
  deadline: event.deadline_on ? formatDate(event.deadline_on) : null,
  start: event.starts_on ? formatDate(event.starts_on) : null,
  finish: event.ends_on ? formatDate(event.ends_on) : null,
  source: event.source,
  venue: null,
  organiser: event.organiser,
  location: event.location,
  prize: event.prize_display,
  registrationsCount: event.registrations_count,
  themes: event.themes,
  blurb: event.tagline ?? undefined,
  eyebrow: `Live · ${event.open_state === 'open' ? 'Open now' : 'Upcoming'}${event.mode === 'online' ? ' · Online' : ''}`,
  meta: [
    event.organiser,
    event.location,
    event.prize_display ? `Prize: ${event.prize_display}` : null,
    event.registrations_count != null ? `${event.registrations_count} registered` : null,
  ].filter(Boolean).join(' · '),
});
