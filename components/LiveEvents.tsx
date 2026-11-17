'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import type { LiveEvent } from '@/lib/live-events';

const OPEN_STATES = ['open', 'upcoming'];
const isHttpsUrl = (value: unknown): value is string => typeof value === 'string' && /^https:\/\//i.test(value);
const formatDeadline = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SELECT = 'id,external_id,source,title,tagline,official_url,starts_on,ends_on,deadline_on,location,organiser,category,themes,prize_display,registrations_count,open_state,mode,thumbnail_url,synced_at';

function LiveCard({ event }: { event: LiveEvent }) {
  return (
    <article className="card">
      <p className="card__eyebrow">
        DEVPOST · {event.open_state === 'open' ? 'Open now' : 'Upcoming'}{event.mode === 'online' ? ' · Online' : ''}
      </p>
      <h3><a href={event.official_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{event.title}</a></h3>
      {event.tagline && <p>{event.tagline}</p>}
      <p className="mono">
        {[event.organiser, event.location, event.prize_display ? `Prize: ${event.prize_display}` : null, event.registrations_count != null ? `${event.registrations_count} registered` : null].filter(Boolean).join(' · ')}
      </p>
      <div className="card__foot">
        <span className="mono">{event.deadline_on ? `Closes ${formatDeadline(event.deadline_on)}` : 'No stated deadline'}</span>
        <a className="btn btn--dark" href={event.official_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
          Register ↗
        </a>
      </div>
    </article>
  );
}

export default function LiveEvents() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let alive = true;

    const load = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await client
        .from('live_events')
        .select(SELECT)
        .eq('published', true)
        .in('open_state', OPEN_STATES)
        .or(`deadline_on.is.null,deadline_on.gte.${today}`)
        .order('deadline_on', { ascending: true, nullsFirst: false })
        .limit(40);
      if (!alive) return;
      if (error) { setState('error'); return; }
      const rows = (data ?? [])
        .filter((row) => isHttpsUrl(row.official_url))
        .map((row) => row as LiveEvent);
      setEvents(rows);
      setLastSync(rows.length ? rows.reduce((latest, row) => (row.synced_at > latest ? row.synced_at : latest), rows[0].synced_at) : null);
      setState('ready');
    };

    void load();

    const client = getSupabaseBrowserClient();
    if (!client) return;
    const channel = client
      .channel('live-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_events' }, () => { void load(); })
      .subscribe();

    return () => {
      alive = false;
      client.removeChannel(channel);
    };
  }, [configured]);

  if (!configured) {
    return (
      <div className="empty">
        <p><strong>Live feed unavailable.</strong></p>
        <p className="mono">Copy <code>.env.example</code> to <code>.env.local</code>, fill in<br /><code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>,<br />then run <code>npm run sync:devpost</code>.</p>
      </div>
    );
  }

  if (state === 'loading') return <div className="empty">Loading live Pune events from Devpost…</div>;
  if (state === 'error') return <div className="empty"><strong>Couldn&rsquo;t reach the live feed.</strong><br />Check that the sync has run and your env values are set.</div>;

  return (
    <div>
      <p className="mono" data-testid="live-sync-stamp">
        <span className="live-pill" data-fresh={lastSync ? 'true' : 'false'}><span className="live-dot" aria-hidden="true" /> LIVE from Devpost · Pune</span>
        {lastSync ? ` · synced ${new Date(lastSync).toLocaleTimeString('en-GB')}` : ''}
      </p>
      {events.length === 0 ? (
        <div className="empty">No open or upcoming Pune hackathons on Devpost right now. Check back after the next sync.</div>
      ) : (
        <div className="grid" style={{ marginTop: '1rem' }}>{events.map((event) => <LiveCard key={event.id} event={event} />)}</div>
      )}
    </div>
  );
}
