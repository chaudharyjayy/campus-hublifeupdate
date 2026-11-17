/* Shared types for the live Pune events feed (stored in Supabase). */

export type OpenState = 'open' | 'upcoming';

export type LiveEvent = {
  id: string;
  external_id: string;
  source: 'devpost' | string;
  title: string;
  tagline: string | null;
  official_url: string;
  starts_on: string | null;
  ends_on: string | null;
  deadline_on: string | null;
  location: string;
  organiser: string | null;
  category: string | null;
  themes: string[];
  prize_display: string | null;
  registrations_count: number | null;
  open_state: OpenState;
  mode: 'online' | 'offline' | 'hybrid' | 'unknown';
  thumbnail_url: string | null;
  synced_at: string;
};

export type SavedLiveEvent = Pick<LiveEvent, 'external_id' | 'title' | 'official_url' | 'deadline_on'>;
