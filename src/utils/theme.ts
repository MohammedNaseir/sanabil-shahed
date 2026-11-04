/**
 * الوضع الداكن/الفاتح. الافتراضي يتبع إعداد الجهاز، واختيار الطالب يُحفظ.
 * حالة واحدة مشتركة لكل أزرار التبديل في الصفحة.
 */
import { useSyncExternalStore } from 'react';
import { safeGet, safeSet } from './storage';

export type Theme = 'dark' | 'light';
const KEY = 'shhd_theme';
const listeners = new Set<() => void>();

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function read(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  const saved = safeGet(KEY);
  return saved === 'light' || saved === 'dark' ? saved : systemTheme();
}

function apply(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#f8f4ec' : '#100e0c');
  listeners.forEach(l => l());
}

export function setTheme(t: Theme) {
  safeSet(KEY, t);
  apply(t);
}

export function toggleTheme() {
  setTheme(read() === 'dark' ? 'light' : 'dark');
}

if (typeof window !== 'undefined') {
  // إن لم يختر الطالب وضعاً بنفسه نتبع تغيّر إعداد الجهاز
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (!safeGet(KEY)) apply(systemTheme());
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme);
  return { theme, toggle: toggleTheme };
}
