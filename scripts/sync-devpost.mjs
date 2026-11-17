#!/usr/bin/env node
/* Sync open/upcoming Pune hackathons from Devpost into live_events.
   Requires the service role key (local or hosted Supabase). Never prints it. */

import { createClient } from '@supabase/supabase-js';
import { fetchPune } from '../lib/devpost.mjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Export it locally (never commit it).');
  process.exit(1);
}

const events = await fetchPune();
const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

if (events.length === 0) {
  console.log('No open or upcoming Pune hackathons found on Devpost. Nothing to sync.');
  process.exit(0);
}

const { data, error } = await client
  .from('live_events')
  .upsert(events, { onConflict: 'external_id' })
  .select('external_id');

if (error) {
  console.error(`Sync failed: ${error.message}`);
  process.exit(1);
}

const open = events.filter((event) => event.open_state === 'open').length;
const upcoming = events.length - open;
console.log(`Synced ${data.length} live events from Devpost (open: ${open}, upcoming: ${upcoming}).`);
