'use client';

import { useEffect, useRef, useState } from 'react';
import { useSavedEvents } from '@/lib/saved';
import { formatDate } from '@/lib/format';
import LiveEvents from '@/components/LiveEvents';
import EventCard from '@/components/EventCard';
import EventDetailsDialog, { type DetailsData } from '@/components/EventDetailsDialog';

type Panel = 'pune' | 'saved';

export default function EventsPanel() {
  const [active, setActive] = useState<Panel>('pune');
  const [details, setDetails] = useState<DetailsData | null>(null);
  const saved = useSavedEvents();
  const tabsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onChange = (event: Event & { detail?: { value?: string } }) => {
      const value = event.detail?.value;
      if (value === 'pune' || value === 'saved') setActive(value);
    };
    el.addEventListener('change', onChange as EventListener);
    return () => el.removeEventListener('change', onChange as EventListener);
  }, []);

  return (
    <section className="section" id="lists">
      {details && <EventDetailsDialog event={details} onClose={() => setDetails(null)} />}

      <sakuga-tabs ref={tabsRef} label="Event lists">
        <option value="pune">Around Pune · live</option>
        <option value="saved">Saved</option>
      </sakuga-tabs>

      <div role="tabpanel" id="panel-pune" aria-label="Around Pune, live from Devpost" hidden={active !== 'pune'} style={{ marginTop: '1.25rem' }}>
        <p className="mono" style={{ marginBottom: '1rem' }}>Open and upcoming hackathons and tech events in Pune. Hit <strong>Register</strong> to open the organiser&rsquo;s page.</p>
        <LiveEvents onOpen={setDetails} />
      </div>

      <div role="tabpanel" id="panel-saved" aria-label="Saved events" hidden={active !== 'saved'} style={{ marginTop: '1.25rem' }}>
        {saved.length === 0 ? (
          <div className="empty"><strong>Nothing saved yet.</strong><br />Tap <em>Save event</em> on the live Pune list. Saved events stay here across visits.</div>
        ) : (
          <>
            <p className="mono" style={{ marginBottom: '1rem' }}>{saved.length} saved</p>
            <div className="grid">
              {saved.map((entry) => (
                <EventCard
                  key={entry.id}
                  onOpen={setDetails}
                  event={{
                    id: entry.id,
                    kind: entry.kind,
                    title: entry.title,
                    officialUrl: entry.officialUrl,
                    deadline: entry.deadline ? formatDate(entry.deadline) : null,
                    venue: entry.venue,
                    eyebrow: entry.kind === 'live' ? 'Live · Pune' : 'Campus',
                    meta: '',
                    blurb: undefined,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
