import CommunityBoard from '@/components/CommunityBoard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Post to the campus board: text, photos and video. Signed-in students can post and delete their own posts.',
};

export default function CommunityPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">Community</p>
          <h1>The board.</h1>
          <p className="sub">Text, photos and videos from the campus. Sign in to post. Posts sync live.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CommunityBoard />
        </div>
      </section>
    </>
  );
}
