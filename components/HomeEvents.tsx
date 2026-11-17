'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import EventCard from '@/components/EventCard';
import EventDetailsDialog, { type DetailsData } from '@/components/EventDetailsDialog';
import { LIVE_SELECT, liveEventToCard } from '@/lib/cards';
import type { LiveEvent } from '@/lib/live-events';

const OPEN_STATES = ['open', 'upcoming'];
const isHttpsUrl = (value: unknown): value is string => typeof value === 'string' && /^https:\/\//i.test(value);

export default function HomeEvents() {
  const configured = isSupabaseConfigured();
  const [rows, setRows] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<DetailsData | null>(null);

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
        .limit(3);
      if (!alive || error) return setLoading(false);
      const next = (data ?? []).filter((row) => isHttpsUrl(row.official_url)) as LiveEvent[];
      setRows(next);
      setLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, [configured]);

  return (
    <section className="section" aria-labelledby="home-events-title">
      {details && <EventDetailsDialog event={details} onClose={() => setDetails(null)} />}
      <div className="container">
        <div className="section__head">
          <h2 id="home-events-title">What&rsquo;s on</h2>
          <Link href="/events">All events →</Link>
        </div>

        {!configured && (
          <div className="empty">The live feed is not configured. See <code>.env.example</code>.</div>
        )}
        {configured && loading && <div className="empty">Loading…</div>}
        {configured && !loading && rows.length === 0 && (
          <div className="empty">No open events in Pune right now. Check back after the next sync.</div>
        )}
        {configured && !loading && rows.length > 0 && (
          <div className="grid">
            {rows.map((event) => <EventCard key={event.id} onOpen={setDetails} event={liveEventToCard(event)} />)}
          </div>
        )}
      </div>
    </section>
  );
}
