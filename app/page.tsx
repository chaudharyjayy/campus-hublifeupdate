import EventCard from '@/components/EventCard';
import { campusEvents } from '@/lib/data';
import { formatDate } from '@/lib/format';

const EXPLORE = [
  { label: 'Events', href: '/events', hint: 'Workshops, meetups and hackathons' },
  { label: 'People', href: '/students', hint: 'Classmates and project teammates' },
  { label: 'Community', href: '/community', hint: 'Questions, ideas and projects' },
  { label: 'Lost & Found', href: '/lost-found', hint: 'Find or report a missing item' },
];

export default function Home() {
  const upcoming = campusEvents.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="kicker">upGrad SOT · Pune</p>
          <h1>Campus life, <em>in one place.</em></h1>
          <p className="sub">Find a workshop, meet a teammate, and see what&rsquo;s happening around your campus — plus the open-source and hackathon programs around Pune, live from Devpost.</p>
          <div className="btn-row">
            <a className="btn btn--solid" href="/events">Browse events</a>
            <a className="btn btn--ghost" href="#explore">Explore the hub</a>
          </div>
        </div>
      </section>

      <section id="explore" className="section" aria-labelledby="explore-title">
        <div className="container">
          <div className="section__head">
            <h2 id="explore-title">Explore CampusHub</h2>
          </div>
          <div className="grid">
            {EXPLORE.map(({ label, href, hint }) => (
              <a key={href} href={href} className="card" style={{ textDecoration: 'none', gap: '0.25rem' }}>
                <p className="card__eyebrow">{label}</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>{hint}</p>
                <span className="link-arrow" style={{ marginTop: '0.5rem' }}>Open {label.toLowerCase()} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="upnext-title">
        <div className="container">
          <div className="section__head">
            <h2 id="upnext-title">Up next on campus</h2>
            <a href="/events">All events →</a>
          </div>
          <div className="grid">
            {upcoming.map((event) => (
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
      </section>

      <section className="section" aria-labelledby="beyond-title">
        <div className="container">
          <div className="section__head">
            <h2 id="beyond-title">Beyond campus</h2>
          </div>
          <p style={{ color: 'var(--muted)', maxWidth: '60ch' }}>Open-source programs, hackathons and fellowships — check dates and eligibility with the organizer. The live Pune list is kept fresh by a Supabase sync, piped straight from Devpost.</p>
          <div className="btn-row">
            <a className="btn btn--dark" href="/events">Explore live Pune hackathons</a>
          </div>
        </div>
      </section>
    </>
  );
}
