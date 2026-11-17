import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <section className="hero">
      <div className="container">
        <p className="kicker">404</p>
        <h1>That page isn&rsquo;t here.</h1>
        <p className="sub">The link may be old, or the page moved. Try the hub from the top.</p>
        <div className="btn-row">
          <Link className="btn btn--solid" href="/">Back to Overview</Link>
        </div>
      </div>
    </section>
  );
}
