'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EventSaveButton from '@/components/EventSaveButton';
import type { DetailsData } from '@/components/EventDetailsDialog';

export type EventCardData = DetailsData;

export default function EventCard({ event, onOpen }: { event: EventCardData; onOpen?: (event: EventCardData) => void }) {
  const router = useRouter();
  const infoRef = useRef<HTMLElement | null>(null);
  const registerRef = useRef<HTMLElement | null>(null);

  const isHttps = typeof event.officialUrl === 'string' && /^https:\/\//i.test(event.officialUrl);

  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    const onClick = () => (onOpen ? onOpen(event) : router.push('/events'));
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, onOpen]);

  useEffect(() => {
    const el = registerRef.current;
    if (!el) return;
    const onClick = () => {
      if (isHttps && event.officialUrl) {
        window.open(event.officialUrl, '_blank', 'noopener,noreferrer');
      } else if (onOpen) {
        onOpen(event);
      } else {
        router.push('/events');
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, event.officialUrl, onOpen]);

  return (
    <article className="card">
      <p className="card__eyebrow">{event.eyebrow}</p>
      <h3><button type="button" className="card__title-btn" onClick={() => (onOpen ? onOpen(event) : router.push('/events'))}>{event.title}</button></h3>
      {event.blurb && <p>{event.blurb}</p>}
      <p className="mono">{event.meta}</p>
      <div className="card__foot">
        <span className="mono">{event.deadline ? `Closes ${event.deadline}` : 'No stated deadline'}</span>
      </div>
      <div className="card-actions">
        <sakuga-button ref={infoRef} variant="secondary" type="button">Info</sakuga-button>
        <sakuga-button ref={registerRef} variant="secondary" type="button">Register</sakuga-button>
        <EventSaveButton id={event.id} kind={event.kind} title={event.title} officialUrl={event.officialUrl} deadline={event.deadline} venue={event.venue} />
      </div>
    </article>
  );
}
