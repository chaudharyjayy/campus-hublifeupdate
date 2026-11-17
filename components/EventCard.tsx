import EventSaveButton from '@/components/EventSaveButton';

export type EventCardData = {
  id: string;
  kind: 'campus' | 'live';
  title: string;
  officialUrl: string | null;
  deadline: string | null;
  venue: string | null;
  eyebrow: string;
  meta: string;
};

export default function EventCard({ event }: { event: EventCardData }) {
  return (
    <article className="card">
      <p className="card__eyebrow">{event.eyebrow}</p>
      <h3>{event.title}</h3>
      <p>{event.meta}</p>
      <div className="card__foot">
        <span className="mono">{event.deadline ? `Closes ${event.deadline}` : 'No stated deadline'}</span>
        <EventSaveButton id={event.id} kind={event.kind} title={event.title} officialUrl={event.officialUrl} deadline={event.deadline} venue={event.venue} />
      </div>
      {event.officialUrl && (
        <a className="link-arrow" href={event.officialUrl} target="_blank" rel="noopener noreferrer">Open official page ↗</a>
      )}
    </article>
  );
}
