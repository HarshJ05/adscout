'use client';

import * as React from 'react';

/**
 * A tiny browser-storage store that several pages can read at once.
 * Values live in localStorage (this browser only), are cached in memory so
 * React always gets the same object back, and stay in sync across tabs.
 */
export interface LocalStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: () => void) => () => void;
  fallback: T;
}

export function createLocalStore<T>(key: string, fallback: T): LocalStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };

  const emit = () => listeners.forEach((fn) => fn());

  return {
    fallback,
    get: read,
    set(next) {
      const value = typeof next === 'function' ? (next as (p: T) => T)(read()) : next;
      cache = value;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage full or blocked: keep the in-memory value for this visit */
      }
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cache = undefined;
          fn();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(fn);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return React.useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
}
