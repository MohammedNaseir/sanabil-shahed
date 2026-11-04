/**
 * وصول آمن إلى localStorage: لا يرمي أخطاء في الوضع الخاص أو عند امتلاء التخزين.
 */
export function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // التخزين غير متاح أو ممتلئ: نتجاهل بهدوء
  }
}

export function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // تجاهل
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  safeSet(key, JSON.stringify(value));
}

export function safeKeys(prefix: string): string[] {
  try {
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
    return out;
  } catch {
    return [];
  }
}
