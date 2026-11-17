'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@/lib/sakuga';

export type DetailsData = {
  id: string;
  kind: 'campus' | 'live';
  title: string;
  officialUrl: string | null;
  deadline: string | null;
  venue: string | null;
  eyebrow: string;
  meta: string;
  blurb?: string;
  capacity?: number | null;
  organiser?: string | null;
  location?: string | null;
  prize?: string | null;
  registrationsCount?: number | null;
  themes?: string[];
  start?: string | null;
  finish?: string | null;
  source?: string | null;
};

export default function EventDetailsDialog({ event, onClose }: { event: DetailsData; onClose: () => void }) {
  const registerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLElement | null>(null);
  const isHttps = (value: string | null) => Boolean(value && /^https:\/\//i.test(value));

  useEffect(() => {
    closeRef.current?.focus?.();
    const onKey = (keyboard: KeyboardEvent) => { if (keyboard.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  useEffect(() => {
    const el = registerRef.current;
    if (!el) return;
    const onClick = () => {
      if (isHttps(event.officialUrl)) {
        window.open(event.officialUrl as string, '_blank', 'noopener,noreferrer');
      } else {
        toast('RSVP at the campus desk. Mention the event name.');
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [event]);

  useEffect(() => {
    const el = closeRef.current;
    if (!el) return;
    const onClick = () => onClose();
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [onClose]);

  const isLive = event.kind === 'live';

  return (
    <div className="details-overlay" role="dialog" aria-modal="true" aria-labelledby="details-title" onClick={onClose}>
      <div className="details-card" onClick={(mouse) => mouse.stopPropagation()}>
        <p className="card__eyebrow">{event.eyebrow}</p>
        <h2 id="details-title" style={{ marginTop: '0.35rem' }}>{event.title}</h2>
        <p className="mono" style={{ marginTop: '0.35rem' }}>{event.meta}</p>
        {event.blurb && <p className="details-blurb">{event.blurb}</p>}

        {(event.start || event.finish) && (
          <p className="mono" style={{ marginTop: '0.6rem' }}>
            {event.start ? `Starts ${event.start}` : 'Start unconfirmed'}{event.finish ? `  →  Ends ${event.finish}` : ''}
          </p>
        )}
        {event.source && <p className="mono" style={{ marginTop: '0.35rem', textTransform: 'uppercase' }}>Source: {event.source}</p>}

        {isLive && (
          <div className="campus-strip" style={{ marginTop: '0.75rem' }}>
            {event.organiser && <span className="campus-strip__item">{event.organiser}</span>}
            {event.location && <span className="campus-strip__item">{event.location}</span>}
            {event.prize && <span className="campus-strip__item">{`Prize: ${event.prize}`}</span>}
            {typeof event.registrationsCount === 'number' && <span className="campus-strip__item">{event.registrationsCount} registered</span>}
          </div>
        )}

        {event.capacity != null && (
          <div className="campus-strip" style={{ marginTop: '0.5rem' }}>
            <span className="campus-strip__item">Capacity {event.capacity}</span>
            {event.venue && <span className="campus-strip__item">{event.venue}</span>}
          </div>
        )}

        {Array.isArray(event.themes) && event.themes.length > 0 && (
          <div className="campus-strip" style={{ marginTop: '0.5rem' }}>
            {event.themes.map((theme) => <span key={theme} className="tag">{theme}</span>)}
          </div>
        )}

        {!isLive && (
          <p className="mono" style={{ marginTop: '0.75rem' }}>RSVP at the campus desk. Mention the event name.</p>
        )}

        <div className="details-actions">
          <sakuga-button ref={registerRef} variant="primary" type="button">Register</sakuga-button>
          <sakuga-button ref={closeRef} variant="secondary" type="button">Close</sakuga-button>
        </div>
      </div>
    </div>
  );
}
