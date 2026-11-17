import EventsPanel from '@/components/EventsPanel';
import { campusEvents } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Campus events and the live Pune hackathon scene — pulled from Devpost, straight to this page.',
};

export default function EventsPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">Events</p>
          <h1>What&rsquo;s on.</h1>
          <p className="sub">Workshops, meetups and hackathons from the campus team — plus the live Pune scene, synced from Devpost.</p>
        </div>
      </section>
      <div className="container">
        <EventsPanel events={campusEvents} />
      </div>
    </>
  );
}
