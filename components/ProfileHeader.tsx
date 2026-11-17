'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { dockersCount, dockingCount, postCount, handleOf, isDocked, toggleDock } from '@/lib/dock';
import { toast, markDone } from '@/lib/sakuga';
import type { User } from '@supabase/supabase-js';

type Props = {
  displayName: string;
  handle: string;
  bio: string;
};

/** Instagram-style profile header: photo, name, handle, Posts / Dockers / Docking. */
export default function ProfileHeader({ displayName, handle, bio }: Props) {
  const client = getSupabaseBrowserClient();
  const buttonRef = useRef<HTMLElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dockers, setDockers] = useState(0);
  const [docking, setDocking] = useState(0);
  const [posts, setPosts] = useState(0);
  const [docked, setDocked] = useState(false);

  const isOwn = Boolean(user && handleOf(user) === handle);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    client.auth.getSession().then(({ data }) => { if (alive) setUser(data.session?.user ?? null); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { if (alive) setUser(session?.user ?? null); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    const load = async () => {
      const [count, dockedCount, ownPosts, dockedState] = await Promise.all([
        dockersCount(client, handle),
        user ? dockingCount(client, user.id) : Promise.resolve(0),
        user ? postCount(client, user.id) : Promise.resolve(0),
        user && handleOf(user) !== handle ? isDocked(client, user.id, handle) : Promise.resolve(false),
      ]);
      if (!alive) return;
      setDockers(count);
      setDocking(dockedCount);
      setPosts(ownPosts);
      setDocked(dockedState);
    };
    void load();
    const channel = client
      .channel(`profile-${handle}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_follows' }, () => { void load(); })
      .subscribe();
    return () => { alive = false; client.removeChannel(channel); };
  }, [client, user, handle]);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el || isOwn) return;
    const onClick = async () => {
      if (!client) return;
      if (!user) return toast('Sign in on the board to fork.');
      try {
        const result = await toggleDock(client, user.id, handle);
        const next = result === 'forked';
        setDocked(next);
        setDockers((count) => (next ? count + 1 : Math.max(0, count - 1)));
        if (next) markDone(el as unknown as Parameters<typeof markDone>[0]);
        toast(next ? 'Docked' : 'Undocked');
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Could not update');
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [client, user, handle, isOwn]);

  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '?').join('');

  return (
    <header className="profile-hero">
      <div className="profile-photo" aria-hidden="true">{initials}</div>
      <div className="profile-copy">
        <p className="kicker">@{handle}</p>
        <h1>{displayName}</h1>
        <p className="sub">{bio}</p>
        <div className="profile-stats" aria-label="Profile stats">
          <span className="profile-stat"><strong>{posts}</strong><small>Posts</small></span>
          <span className="profile-stat"><strong>{dockers}</strong><small>Dockers</small></span>
          <span className="profile-stat"><strong>{docking}</strong><small>Docking</small></span>
        </div>
        {!isOwn && (
          <div className="btn-row" style={{ marginTop: '1rem' }}>
            <sakuga-button ref={buttonRef} variant={docked ? 'secondary' : 'primary'} type="button">
              {docked ? 'Docked' : 'Fork'}
            </sakuga-button>
          </div>
        )}
      </div>
    </header>
  );
}
