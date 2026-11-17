'use client';

import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="hub-footer">
      <div className="container">
        <div className="hub-footer__top">
          <p><strong>CampusHub.</strong> · upGrad SOT Pune — the student hub for your events, people and communities.</p>
          <nav aria-label="Secondary">
            <Link href="/">Overview</Link> · <Link href="/events">Events</Link> · <Link href="/profile">My space</Link> ·{' '}
            <a href="https://sot.upgrad.com/university/adypu" target="_blank" rel="noopener noreferrer">upGrad SOT Pune ↗</a>
          </nav>
        </div>
        <p className="mono" style={{ marginTop: '1rem' }}>Campus events, listed by the campus team. Hackathons around Pune are live from Devpost. Sample student data; nothing here collects passwords.</p>
      </div>
    </footer>
  );
}
