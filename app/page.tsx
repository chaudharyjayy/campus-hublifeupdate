import HomeEvents from '@/components/HomeEvents';

const EXPLORE = [
  { label: 'Events', href: '/events', hint: 'Workshops, meetups and hackathons' },
  { label: 'People', href: '/students', hint: 'Classmates and project teammates' },
  { label: 'Community', href: '/community', hint: 'Questions, ideas and projects' },
  { label: 'Lost & Found', href: '/lost-found', hint: 'Find or report a missing item' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="kicker">upGrad SOT · Pune</p>
          <h1>Campus life, <em>sorted.</em></h1>
          <p className="sub">Campus events, teammates and the Pune hackathon scene. Spend time contributing.</p>
          <div className="btn-row">
            <a className="btn btn--solid" href="/events">Browse events</a>
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

      <HomeEvents />
    </>
  );
}
