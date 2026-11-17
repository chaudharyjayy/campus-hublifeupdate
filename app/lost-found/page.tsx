import { lostFoundItems } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lost & Found',
  description: 'Missing something on campus? Check the noticeboard.',
};

export default function LostFoundPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">Lost &amp; Found</p>
          <h1>The noticeboard.</h1>
          <p className="sub">Found something or lost something? Check the library desk, or ask there.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="grid">
            {lostFoundItems.map((item) => (
              <article key={item.id} className="card">
                <p className="card__eyebrow">{item.kind} · {item.date}</p>
                <h3>{item.item}</h3>
                <p>{item.where}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
