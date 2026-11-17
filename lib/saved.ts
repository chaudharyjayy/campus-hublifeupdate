/* Client-side saved list (localStorage) with a useSyncExternalStore hook. */

import { useSyncExternalStore } from 'react';

export type SavedEntry = {
  id: string;
  kind: 'campus' | 'live';
  title: string;
  officialUrl: string | null;
  deadline: string | null;
  venue: string | null;
};

const KEY = 'campushub:saved';
const CHANGED = 'campushub:saved-changed';
const EMPTY: SavedEntry[] = [];

let cachedRaw: string | null = null;
let cachedList: SavedEntry[] = EMPTY;

function parse(raw: string): SavedEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((item): item is SavedEntry =>
      typeof item === 'object' && item !== null &&
      typeof (item as SavedEntry).id === 'string' &&
      typeof (item as SavedEntry).title === 'string' &&
      ((item as SavedEntry).officialUrl === null || /^https:\/\//i.test(String((item as SavedEntry).officialUrl))));
  } catch {
    return EMPTY;
  }
}

export function readSaved(): SavedEntry[] {
  if (typeof window === 'undefined') return EMPTY;
  const raw = localStorage.getItem(KEY) ?? '[]';
  if (raw !== cachedRaw) cachedList = parse(raw);
  cachedRaw = raw;
  return cachedList;
}

function writeSaved(entries: SavedEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* storage blocked */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED));
}

export function toggleSaved(entry: SavedEntry): SavedEntry[] {
  const current = readSaved();
  const exists = current.some((item) => item.id === entry.id);
  const next = exists ? current.filter((item) => item.id !== entry.id) : [entry, ...current];
  writeSaved(next);
  return next;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGED, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGED, callback);
  };
}

const getServerSnapshot = () => EMPTY;

export function useSavedEvents(): SavedEntry[] {
  return useSyncExternalStore(subscribe, readSaved, getServerSnapshot);
}
