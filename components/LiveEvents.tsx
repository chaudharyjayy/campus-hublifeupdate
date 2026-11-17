'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import EventCard from '@/components/EventCard';
import { LIVE_SELECT, liveEventToCard } from '@/lib/cards';
import type { LiveEvent } from '@/lib/live-events';
import type { DetailsData } from '@/components/EventDetailsDialog';

const OPEN_STATES = ['open', 'upcoming'];
const isHttpsUrl = (value: unknown): value is string => typeof value === 'string' && /^https:\/\//i.test(value);

export default function LiveEvents({ onOpen }: { onOpen?: (event: DetailsData) => void }) {
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
        .select(LIVE_SELECT)
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
        <p className="mono">Copy <code>.env.example</code> to <code>.env.local</code>, fill in<br /><code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>,<br />then run <code>npm run sync:events</code>.</p>
      </div>
    );
  }

  if (state === 'loading') return <div className="empty">Loading the live list…</div>;
  if (state === 'error') return <div className="empty"><strong>Couldn&rsquo;t reach the live feed.</strong><br />Check that the sync has run and your env values are set.</div>;

  return (
    <div>
      <p className="mono" data-testid="live-sync-stamp">
        <span className="live-pill" data-fresh={lastSync ? 'true' : 'false'}><span className="live-dot" aria-hidden="true" /> Live · Pune</span>
        {lastSync ? ` · synced ${new Date(lastSync).toLocaleTimeString('en-GB')}` : ''}
      </p>
      {events.length === 0 ? (
        <div className="empty">No open or upcoming events in Pune right now. Check back after the next sync.</div>
      ) : (
        <div className="grid" style={{ marginTop: '1rem' }}>
          {events.map((event) => <EventCard key={event.id} onOpen={onOpen} event={liveEventToCard(event)} />)}
        </div>
      )}
    </div>
  );
}
