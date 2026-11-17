import EventsPanel from '@/components/EventsPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Open and upcoming hackathons and tech events in Pune.',
};

export default function EventsPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">Events</p>
          <h1>What&rsquo;s on.</h1>
          <p className="sub">Open and upcoming hackathons and tech events in Pune.</p>
        </div>
      </section>
      <div className="container">
        <EventsPanel />
      </div>
    </>
  );
}
