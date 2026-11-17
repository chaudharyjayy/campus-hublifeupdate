#!/usr/bin/env node
/* Sync REAL open/upcoming Pune events into live_events.
   Sources: Devpost (public JSON) + Gemini grounded in Google Search (GEMINI_API_KEY).
   Needs SUPABASE_SERVICE_ROLE_KEY (never committed). */

import { createClient } from '@supabase/supabase-js';
import { fetchPune } from '../lib/devpost.mjs';
import { fetchGeminiPune, fetchGeminiPuneOffline, geminiItemsToLiveRows } from '../lib/ai-events.mjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY || null;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Export it locally (never commit it).');
  process.exit(1);
}

const devpost = await fetchPune().catch((error) => { console.error(`devpost skipped: ${error.message}`); return []; });

let geminiRows = [];
if (geminiKey) {
  let geminiItems = [];
  try {
    geminiItems = await fetchGeminiPune({ apiKey: geminiKey }); // grounding: Google Search, free tier
  } catch (error) {
    console.error(`grounding skipped (${error.message}); trying plain mode with online link probes`);
    try {
      geminiItems = await fetchGeminiPuneOffline({ apiKey: geminiKey });
    } catch (offlineError) {
      console.error(`gemini offline skipped: ${offlineError.message}`);
    }
  }
  geminiRows = geminiItemsToLiveRows(geminiItems);
} else {
  console.error('GEMINI_API_KEY not set — running Devpost-only.');
}
const merged = new Map();
for (const row of [...devpost, ...geminiRows]) merged.set(row.official_url, row);
const rows = [...merged.values()];

if (rows.length === 0) {
  console.log('No real open or upcoming Pune events found right now. Nothing to sync.');
  process.exit(0);
}

const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const { data, error } = await client
  .from('live_events')
  .upsert(rows, { onConflict: 'external_id' })
  .select('external_id');

if (error) {
  console.error(`Sync failed: ${error.message}`);
  process.exit(1);
}

console.log(`Synced ${data.length} events (devpost: ${devpost.length}, gemini: ${geminiRows.length}).`);
