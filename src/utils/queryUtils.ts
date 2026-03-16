"use client";

/**
 * Wraps a promise with a timeout to prevent infinite hangs.
 * Increased default timeout to 60s for better resilience.
 */
export async function withTimeout<T = any>(
  promise: Promise<T>, 
  timeoutMs: number = 60000, 
  label?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out${label ? `: ${label}` : ''}`)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Simple in-memory cache for frequently accessed data.
 */
const cache = new Map<string, { data: any; expiry: number }>();

export const queryCache = {
  get: <T>(key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    return item.data as T;
  },
  set: (key: string, data: any, ttlMs: number = 30000) => {
    cache.set(key, { data, expiry: Date.now() + ttlMs });
  },
  invalidate: (key: string) => {
    cache.delete(key);
  },
  clear: () => {
    cache.clear();
  }
};