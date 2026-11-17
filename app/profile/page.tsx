'use client';

import Link from 'next/link';
import { useSavedEvents, toggleSaved } from '@/lib/saved';
import { formatDate } from '@/lib/format';
import { toast } from '@/lib/sakuga';

export default function ProfilePage() {
  const saved = useSavedEvents();

  const remove = (entry: (typeof saved)[number]) => {
    toggleSaved(entry); // the hook re-renders from localStorage automatically
    toast('Removed from your list');
  };

  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">My space</p>
          <h1>Your space.</h1>
          <p className="sub">Everything you&rsquo;ve saved across campus events and the live Pune feed.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Saved events ({saved.length})</h2>
            <Link href="/events">Browse events →</Link>
          </div>
          {saved.length === 0 ? (
            <div className="empty"><strong>Nothing saved yet.</strong><br />Save events from the Events page and they will appear here.</div>
          ) : (
            <div className="grid">
              {saved.map((entry) => (
                <article key={entry.id} className="card">
                  <p className="card__eyebrow">{entry.kind === 'live' ? 'DEVPOST · Pune' : 'CAMPUS'}</p>
                  <h3>{entry.title}</h3>
                  <p className="mono">{[formatDate(entry.deadline) ? `Closes ${formatDate(entry.deadline)}` : null, entry.venue].filter(Boolean).join(' · ')}</p>
                  <div className="card__foot">
                    {entry.officialUrl ? <a className="link-arrow" href={entry.officialUrl} target="_blank" rel="noopener noreferrer">Official page ↗</a> : <span />}
                    <button type="button" className="chip-button" onClick={() => remove(entry)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="mono" style={{ marginTop: '2rem' }}>Sign-in and cross-device sync arrive with the Supabase backend phase — see the project README once published.</p>
        </div>
      </section>
    </>
  );
}
