'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProfileHeader from '@/components/ProfileHeader';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import { handleOf } from '@/lib/dock';
import { toast } from '@/lib/sakuga';
import { useSavedEvents } from '@/lib/saved';
import { formatDate } from '@/lib/format';

type OwnPost = {
  id: string;
  body: string;
  media_path: string | null;
  media_type: 'photo' | 'video' | null;
  created_at: string;
};

export default function ProfilePage() {
  const saved = useSavedEvents();
  const client = getSupabaseBrowserClient();
  const signOutRef = useRef<HTMLElement | null>(null);
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [posts, setPosts] = useState<OwnPost[]>([]);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    client.auth.getSession().then(({ data }) => { if (alive) setUser(data.session?.user ?? null); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { if (alive) setUser(session?.user ?? null); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!client || !user) return;
    let alive = true;
    const load = async () => {
      const [list, count] = await Promise.all([
        client.from('community_posts').select('id,body,media_path,media_type,created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(12),
        client.from('community_posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
      ]);
      if (!alive) return;
      if (!list.error) setPosts((list.data as OwnPost[]) ?? []);
      if (!count.error) setPostCount(count.count ?? 0);
    };
    void load();
    return () => { alive = false; };
  }, [client, user]);

  useEffect(() => {
    const el = signOutRef.current;
    if (!el) return;
    const onClick = async () => { if (client) { await client.auth.signOut(); toast('Signed out'); } };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [client]);

  if (!isSupabaseConfigured()) {
    return (
      <section className="hero container" style={{ paddingTop: '2rem' }}>
        <p className="kicker">My space</p>
        <h1>Your space.</h1>
        <div className="empty" style={{ marginTop: '1rem' }}><strong>Your space needs the database first.</strong><br />Copy <code>.env.example</code> to <code>.env.local</code> and fill in your Supabase values.</div>
      </section>
    );
  }

  const myDisplayName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() || user?.email?.split('@')[0] || 'You';
  const myHandle = user ? handleOf(user) : 'you';
  const mediaUrl = (path: string | null) => (path && client ? client.storage.from('community-media').getPublicUrl(path).data.publicUrl : null);

  return (
    <>
      <section className="section container" style={{ paddingTop: '1rem' }}>
        {user ? (
          <ProfileHeader displayName={myDisplayName} handle={myHandle} bio="From upGrad SOT Pune" />
        ) : (
          <div className="empty" style={{ marginTop: '1rem' }}>
            <p><strong>Sign in on the community board to see your profile here.</strong></p>
            <Link href="/community" className="link-arrow">Go to the board →</Link>
          </div>
        )}
        {user && (
          <div className="btn-row" style={{ marginTop: '0.5rem' }}>
            <sakuga-button ref={signOutRef} variant="secondary" type="button">Sign out</sakuga-button>
          </div>
        )}
      </section>

      {user && (
        <section className="section container" aria-labelledby="my-posts-title">
          <div className="section__head">
            <h2 id="my-posts-title">Your posts ({postCount})</h2>
            <Link href="/community">Create one →</Link>
          </div>
          {posts.length === 0 ? (
            <div className="empty"><strong>Nothing posted yet.</strong><br />Your posts will appear here, like Instagram.</div>
          ) : (
            <div className="profile-grid">
              {posts.map((post) => {
                const media = mediaUrl(post.media_path);
                return post.media_type === 'photo' && media ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-generated content, not optimisable at build
                  <span key={post.id} className="post-tile"><img src={media} alt="Post photo" loading="lazy" /></span>
                ) : post.media_type === 'video' ? (
                  <span key={post.id} className="post-tile"><video src={media ?? ''} className="media-embed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} preload="metadata" /><span className="post-tile__play">▶</span></span>
                ) : (
                  <span key={post.id} className="post-tile post-tile--text"><p>{post.body}</p></span>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="section container" aria-labelledby="saved-title">
        <div className="section__head">
          <h2 id="saved-title">Saved events ({saved.length})</h2>
          <Link href="/events">Browse events →</Link>
        </div>
        {saved.length === 0 ? (
          <div className="empty"><strong>Nothing saved yet.</strong><br />Save events from the events page.</div>
        ) : (
          <div className="grid">
            {saved.map((entry) => (
              <Link key={entry.id} href={entry.officialUrl ?? '/events'} target={entry.officialUrl ? '_blank' : undefined} rel={entry.officialUrl ? 'noopener noreferrer' : undefined} className="card" style={{ textDecoration: 'none' }}>
                <p className="card__eyebrow">{entry.kind === 'live' ? 'Live · Pune' : 'Campus'}</p>
                <h3>{entry.title}</h3>
                <p className="mono">{[formatDate(entry.deadline) ? `Closes ${formatDate(entry.deadline)}` : null, entry.venue].filter(Boolean).join(' · ')}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
