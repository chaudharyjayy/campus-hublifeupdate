import { communityPosts } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Questions, ideas and projects from the campus.',
};

export default function CommunityPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">Community</p>
          <h1>Questions & projects.</h1>
          <p className="sub">The campus board — ask for teammates, debugging help, or what to pick up next. Posting opens with the account phase.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="grid">
            {communityPosts.map((post) => (
              <article key={post.id} className="card">
                <div><span className="tag">{post.tag}</span></div>
                <h3 style={{ marginTop: '0.25rem' }}>{post.title}</h3>
                <p className="mono">{post.author} · {post.replies} {post.replies === 1 ? 'reply' : 'replies'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
