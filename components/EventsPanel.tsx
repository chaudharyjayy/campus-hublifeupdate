'use client';

import { useEffect, useRef, useState } from 'react';
import { useSavedEvents } from '@/lib/saved';
import { formatDate } from '@/lib/format';
import LiveEvents from '@/components/LiveEvents';
import EventCard from '@/components/EventCard';
import EventSaveButton from '@/components/EventSaveButton';
import type { CampusEvent } from '@/lib/data';

type Panel = 'campus' | 'pune' | 'saved';

export default function EventsPanel({ events }: { events: CampusEvent[] }) {
  const [active, setActive] = useState<Panel>('campus');
  const [campusFilter, setCampusFilter] = useState<'all' | 'event' | 'hackathon'>('all');
  const saved = useSavedEvents();
  const tabsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onChange = (event: Event & { detail?: { value?: string } }) => {
      const value = event.detail?.value;
      if (value === 'campus' || value === 'pune' || value === 'saved') setActive(value);
    };
    el.addEventListener('change', onChange as EventListener);
    return () => el.removeEventListener('change', onChange as EventListener);
  }, []);

  const filteredCampus = events.filter((event) => campusFilter === 'all' || event.type === campusFilter);

  return (
    <section className="section" id="lists">
      <sakuga-tabs ref={tabsRef} label="Event lists">
        <option value="campus">On campus</option>
        <option value="pune">Around Pune · live</option>
        <option value="saved">Saved</option>
      </sakuga-tabs>

      <div role="tabpanel" id="panel-campus" aria-label="On campus" hidden={active !== 'campus'} style={{ marginTop: '1.25rem' }}>
        <div className="pill-row" aria-label="Filter campus events">
          {(['all', 'event', 'hackathon'] as const).map((value) => (
            <button key={value} type="button" className="pill" aria-pressed={campusFilter === value} onClick={() => setCampusFilter(value)}>
              {value === 'all' ? 'All' : value === 'event' ? 'Events' : 'Hackathons'}
            </button>
          ))}
        </div>
        <div className="grid">
          {filteredCampus.map((event) => (
            <EventCard
              key={event.id}
              event={{
                id: event.id,
                kind: 'campus',
                title: event.title,
                officialUrl: null,
                deadline: formatDate(event.registrationDeadline),
                venue: event.venue,
                eyebrow: `${event.category} · ${event.venue}`,
                meta: `${formatDate(event.start) ?? ''} · ${event.capacity ? `Capacity ${event.capacity}` : 'No capacity stated'}`,
              }}
            />
          ))}
        </div>
      </div>

      <div role="tabpanel" id="panel-pune" aria-label="Around Pune, live from Devpost" hidden={active !== 'pune'} style={{ marginTop: '1.25rem' }}>
        <p className="mono" style={{ marginBottom: '1rem' }}>Open and upcoming hackathons in Pune, live from Devpost. Click <strong>Register</strong> to open the official event page.</p>
        <LiveEvents />
      </div>

      <div role="tabpanel" id="panel-saved" aria-label="Saved events" hidden={active !== 'saved'} style={{ marginTop: '1.25rem' }}>
        {saved.length === 0 ? (
          <div className="empty"><strong>Nothing saved yet.</strong><br />Tap <em>Save event</em> on campus events or live Pune hackathons — they stay here across visits.</div>
        ) : (
          <>
            <p className="mono" style={{ marginBottom: '1rem' }}>{saved.length} saved</p>
            <div className="grid">
              {saved.map((entry) => (
                <article key={entry.id} className="card">
                  <p className="card__eyebrow">{entry.kind === 'live' ? 'DEVPOST · Pune' : 'CAMPUS · SOT Pune'}</p>
                  <h3>{entry.title}</h3>
                  <p className="mono">{[formatDate(entry.deadline) ? `Closes ${formatDate(entry.deadline)}` : null, entry.venue].filter(Boolean).join(' · ')}</p>
                  <div className="card__foot">
                    {entry.officialUrl ? (
                      <a className="link-arrow" href={entry.officialUrl} target="_blank" rel="noopener noreferrer">Open official page ↗</a>
                    ) : <span />}
                    <EventSaveButton id={entry.id} kind={entry.kind} title={entry.title} officialUrl={entry.officialUrl} deadline={entry.deadline} venue={entry.venue} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
