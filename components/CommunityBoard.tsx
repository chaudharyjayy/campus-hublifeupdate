'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import { toast } from '@/lib/sakuga';
import type { User } from '@supabase/supabase-js';

const MAX_CHARS = 500;
const MAX_FILE = 5 * 1024 * 1024;

type Post = {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  media_path: string | null;
  media_type: 'photo' | 'video' | null;
  created_at: string;
};

type AuthMode = 'signin' | 'signup';

function displayNameOf(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const name = typeof meta?.full_name === 'string' && meta.full_name.trim() ? meta.full_name.trim() : null;
  return name ?? (user.email?.split('@')[0] ?? 'student');
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function publicUrl(client: ReturnType<typeof getSupabaseBrowserClient>, path: string | null): string | null {
  if (!client || !path) return null;
  return client.storage.from('community-media').getPublicUrl(path).data.publicUrl;
}

export default function CommunityBoard() {
  const configured = isSupabaseConfigured();
  const client = getSupabaseBrowserClient();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [user, setUser] = useState<User | null>(null);
  const authTabsRef = useRef<HTMLElement | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const isPhoto = file ? file.type.startsWith('image/') : false;
  const mediaType = file ? (isPhoto ? 'photo' : 'video') : null;

  const reloadPosts = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!client) return;
    let alive = true;
    const load = async () => {
      const { data, error } = await client
        .from('community_posts')
        .select('id,author_id,author_name,body,media_path,media_type,created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!alive) return;
      if (!error) setPosts((data as Post[]) ?? []);
      setLoadingPosts(false);
    };
    reloadPosts.current = load;
    client.auth.getSession().then(({ data }) => {
      if (alive) setUser(data.session?.user ?? null);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    void load();
    const channel = client
      .channel('community-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => { void load(); })
      .subscribe();
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
      client.removeChannel(channel);
    };
  }, [client]);

  useEffect(() => {
    const el = authTabsRef.current;
    if (!el) return;
    const onChange = (event: Event & { detail?: { value?: string } }) => {
      const value = event.detail?.value;
      if (value === 'signin' || value === 'signup') { setAuthMode(value); setAuthError(null); }
    };
    el.addEventListener('change', onChange as EventListener);
    return () => el.removeEventListener('change', onChange as EventListener);
  }, []);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setAuthError(null);
    const trimmedEmail = email.trim().toLowerCase();
    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) throw new Error('Those passwords do not match.');
        const { error } = await client.auth.signUp({
          email: trimmedEmail,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
      } else {
        const { error } = await client.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    toast('Signed out');
  };

  const onPickFile = (chosen: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (!chosen) { setFile(null); setPreview(null); return; }
    const isImage = chosen.type.startsWith('image/');
    const isVideo = chosen.type.startsWith('video/');
    if (!isImage && !isVideo) return toast('Photos and videos only.');
    if (chosen.size > MAX_FILE) return toast('Keep files under 5 MB.');
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const submitPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !user) return;
    const text = body.trim();
    if (!text && !file) return toast('Write something first.');
    setBusy(true);

    let media_path: string | null = null;
    let media_type: 'photo' | 'video' | null = null;
    try {
      if (file) {
        media_type = mediaType;
        const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_').slice(-60);
        media_path = `${user.id}/${Date.now()}-${safe}`;
        const { error } = await client.storage
          .from('community-media')
          .upload(media_path, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
      }
      const { error } = await client.from('community_posts').insert({
        author_id: user.id,
        author_name: displayNameOf(user),
        body: text,
        media_path,
        media_type,
      });
      if (error) throw error;
      setBody('');
      setFile(null);
      setPreview(null);
      toast('Posted');
      void reloadPosts.current();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not post.');
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async (post: Post) => {
    if (!client || post.author_id !== user?.id) return;
    const { error } = await client.from('community_posts').delete().eq('id', post.id).eq('author_id', user.id);
    if (error) return toast(error.message);
    if (post.media_path) await client.storage.from('community-media').remove([post.media_path]);
    void reloadPosts.current();
    toast('Deleted');
  };

  const initialsOf = useMemo(
    () => (nameOrEmail: string) => nameOrEmail.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '?').join(''),
    [],
  );

  if (!configured) {
    return (
      <div className="empty">
        <p><strong>The board needs a database first.</strong></p>
        <p className="mono">Copy <code>.env.example</code> to <code>.env.local</code>, fill in<br /><code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {!user ? (
        <form onSubmit={submitAuth} className="card composer">
          <p className="card__eyebrow">Sign in to post</p>
          <sakuga-tabs ref={authTabsRef} label="Account">
            <option value="signin">Sign in</option>
            <option value="signup">Create account</option>
          </sakuga-tabs>
          {authMode === 'signup' && (
            <label className="field">
              <span className="field__label">Full name</span>
              <input className="input" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Aarav Patil" required />
            </label>
          )}
          <label className="field">
            <span className="field__label">Email</span>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="field">
            <span className="field__label">Password</span>
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" minLength={6} required />
          </label>
          {authMode === 'signup' && (
            <label className="field">
              <span className="field__label">Confirm password</span>
              <input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" minLength={6} required />
            </label>
          )}
          {authError && <p className="form-error" role="alert">{authError}</p>}
          <sakuga-button type="submit" variant="primary" disabled={busy ? 'true' : undefined}>
            {busy ? 'One moment…' : authMode === 'signup' ? 'Create account' : 'Sign in'}
          </sakuga-button>
        </form>
      ) : (
        <form onSubmit={submitPost} className="card composer">
          <p className="card__eyebrow">Signed in as {displayNameOf(user)}</p>
          <label className="field" htmlFor="post-body">
            <span className="field__label">What&rsquo;s on?</span>
            <textarea id="post-body" className="textarea" value={body} onChange={(event) => setBody(event.target.value.slice(0, MAX_CHARS))} maxLength={MAX_CHARS} rows={3} placeholder="Ask, share, or brag a little." />
          </label>
          <div className="composer__foot">
            <label className="chip-button" htmlFor="post-media" style={{ cursor: 'pointer' }}>Attach photo or video</label>
            <input id="post-media" className="sr-only" type="file" accept="image/*,video/*" onChange={(event) => onPickFile(event.target.files?.[0] ?? null)} />
            <span className="mono">{body.length}/{MAX_CHARS}</span>
            <sakuga-button type="submit" variant="primary" disabled={busy || (!body.trim() && !file) ? 'true' : undefined}>
              {busy ? (file ? 'Uploading…' : 'Posting…') : 'Post'}
            </sakuga-button>
          </div>
          {file && preview && (
            <div className="composer__media">
              {mediaType === 'photo' ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-generated content, not optimisable at build
                <img src={preview} alt="Attachment preview" className="media-embed" />
              ) : (
                <video src={preview} controls className="media-embed" />
              )}
              <button type="button" className="chip-button" onClick={() => onPickFile(null)}>Remove media</button>
            </div>
          )}
        </form>
      )}

      <div className="section__head" style={{ marginTop: '0.5rem' }}>
        <h2>The board</h2>
        {user && <button type="button" className="chip-button" onClick={signOut}>Sign out</button>}
      </div>
      {loadingPosts ? (
        <div className="empty">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="empty">The board is empty. Be the first to post.</div>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <article key={post.id} className="card post-card">
              <header className="post-card__head">
                <span className="avatar-inline" aria-hidden="true">{initialsOf(post.author_name)}</span>
                <span className="post-card__meta"><strong>{post.author_name}</strong> · <span className="mono">{relativeTime(post.created_at)}</span></span>
              </header>
              {post.body && <p className="post-card__body">{post.body}</p>}
              {post.media_path && post.media_type === 'photo' && (
                // eslint-disable-next-line @next/next/no-img-element -- user-generated content, not optimisable at build
                <img className="media-embed" src={publicUrl(client, post.media_path) ?? ''} alt="Post photo" loading="lazy" />
              )}
              {post.media_path && post.media_type === 'video' && (
                <video className="media-embed" src={publicUrl(client, post.media_path) ?? ''} controls preload="metadata" />
              )}
              {post.author_id === user?.id && (
                <button type="button" className="chip-button link-arrow" onClick={() => deletePost(post)} style={{ alignSelf: 'flex-start' }}>Delete</button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
