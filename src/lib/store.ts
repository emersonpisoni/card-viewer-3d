import { useSyncExternalStore } from 'react';
import { buildSeed } from './seed';
import type { DB } from './types';

const KEY = 'padel-holo:db:v2';

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === 2) return db;
    }
  } catch {
    // corrupt or unavailable storage: start from the demo world
  }
  return buildSeed();
}

let db = load();
const listeners = new Set<() => void>();
let warnedFull = false;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    if (!warnedFull) {
      warnedFull = true;
      alert('O navegador ficou sem espaço para salvar. Use fotos menores.');
    }
  }
}

export const store = {
  get: () => db,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Apply a transform from db.ts and notify the UI. */
  update(fn: (db: DB) => DB) {
    db = fn(db);
    persist();
    listeners.forEach((l) => l());
  },
  reset() {
    store.update(() => buildSeed());
  },
};

export function useDB() {
  return useSyncExternalStore(store.subscribe, store.get);
}

export function useMe() {
  const db = useDB();
  return db.players.find((p) => p.id === db.currentUserId)!;
}
