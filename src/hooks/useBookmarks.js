import { useCallback, useEffect, useState } from 'react';

// Bookmarks are stored in localStorage by default — zero setup, works
// per-device immediately. If you want them synced across devices,
// swap the two functions below for Supabase calls (see README —
// "Optional: Supabase sync" section has the table schema + snippet).
const STORAGE_KEY = 'sarkari-paper:bookmarks';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode etc.) — fail silently
  }
}

export function useBookmarks() {
  const [items, setItems] = useState(readAll);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(readAll());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isSaved = useCallback((slug) => items.some((i) => i.slug === slug), [items]);

  const toggle = useCallback((item) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.slug === item.slug);
      const next = exists ? prev.filter((i) => i.slug !== item.slug) : [...prev, item];
      writeAll(next);
      return next;
    });
  }, []);

  return { bookmarks: items, isSaved, toggle };
}
