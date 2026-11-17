/* Fork system: Dockers (followers) / Docking (following). Instagram, for engineers. */

import type { SupabaseClient, User } from '@supabase/supabase-js';

export const handleOf = (user: User): string => {
  const email = user.email ?? 'someone@example.com';
  return slugify(email.split('@')[0] ?? 'student');
};

export const slugify = (value: string): string =>
  String(value).toLowerCase().replace(/[^a-z0-9_.-]/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'student';

export async function dockersCount(client: SupabaseClient, handle: string): Promise<number> {
  const { count, error } = await client
    .from('community_follows')
    .select('*', { count: 'exact', head: true })
    .eq('target_handle', handle);
  if (error) return 0;
  return count ?? 0;
}

export async function dockingCount(client: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await client
    .from('community_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function postCount(client: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await client
    .from('community_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function isDocked(client: SupabaseClient, myId: string, handle: string): Promise<boolean> {
  const { count, error } = await client
    .from('community_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', myId)
    .eq('target_handle', handle);
  if (error) return false;
  return (count ?? 0) > 0;
}

export type DockResult = 'forked' | 'unforked';

export async function toggleDock(client: SupabaseClient, myId: string, handle: string): Promise<DockResult> {
  const { count } = await client
    .from('community_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', myId)
    .eq('target_handle', handle);
  const currentlyDocked = (count ?? 0) > 0;
  if (currentlyDocked) {
    const { error } = await client.from('community_follows').delete().eq('follower_id', myId).eq('target_handle', handle);
    if (error) throw error;
    return 'unforked';
  }
  const { error } = await client.from('community_follows').insert({ follower_id: myId, target_handle: handle });
  if (error) throw error;
  return 'forked';
}
