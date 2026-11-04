/**
 * حفظ التقدّم داخل الألعاب واستئنافه.
 * كل لعبة تحفظ «لقطة» من حالتها بعد كل خطوة مهمة، وتُمسح اللقطة عند الإنهاء أو البدء من جديد.
 * المفتاح مرتبط بهوية الطالب (أو guest) حتى لا يختلط تقدّم طالبين على الجهاز نفسه.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { readJSON, safeKeys, safeRemove, writeJSON } from './storage';

const DRAFT_PREFIX = 'shhd_draft_v1';

export function draftKey(scope: string, gameId: string) {
  return `${DRAFT_PREFIX}:${scope}:${gameId}`;
}

export function clearDraft(scope: string, gameId: string) {
  safeRemove(draftKey(scope, gameId));
}

export function clearAllDrafts(scope: string) {
  for (const k of safeKeys(`${DRAFT_PREFIX}:${scope}:`)) safeRemove(k);
}

interface DraftContextValue {
  scope: string;
  /** يمسح المسودة ويعيد تركيب اللعبة من البداية. */
  restart: (gameId: string) => void;
}

export const DraftContext = createContext<DraftContextValue>({ scope: 'guest', restart: () => {} });

interface StoredDraft<T> {
  v: number;
  savedAt: number;
  data: T;
}

/**
 * يعيد المسودة المحفوظة (مرة واحدة عند التركيب) ودوال للحفظ والمسح.
 * `version` يُرفع عند تغيير شكل البيانات لتجاهل المسودات القديمة.
 */
export function useGameDraft<T>(gameId: string, version = 1) {
  const { scope, restart } = useContext(DraftContext);
  const key = draftKey(scope, gameId);
  const [initial] = useState<T | null>(() => {
    const stored = readJSON<StoredDraft<T> | null>(key, null);
    return stored && stored.v === version ? stored.data : null;
  });
  const finishedRef = useRef(false);

  const save = useCallback((data: T | null) => {
    if (finishedRef.current) return;
    if (data == null) {
      safeRemove(key);
      return;
    }
    writeJSON(key, { v: version, savedAt: Date.now(), data } satisfies StoredDraft<T>);
  }, [key, version]);

  /** يُستدعى عند انتهاء اللعبة: يمسح المسودة ويمنع أي حفظ لاحق من مؤقت متأخر. */
  const finish = useCallback(() => {
    finishedRef.current = true;
    safeRemove(key);
  }, [key]);

  return {
    initial,
    wasRestored: initial != null,
    save,
    finish,
    restart: () => restart(gameId),
  };
}

/** يحفظ اللقطة تلقائياً كلما تغيّرت (snapshot = null يعني لا شيء يستحق الحفظ). */
export function useAutoSaveDraft<T>(save: (d: T | null) => void, snapshot: T | null) {
  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    save(snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, save]);
}

/**
 * setTimeout يُلغى تلقائياً عند مغادرة اللعبة، حتى لا يُستدعى onFinish
 * أو يتغيّر شيء بعد خروج الطالب من المحطة.
 */
export function useSafeTimeouts() {
  const ids = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);
}

/** هل الصفحة ظاهرة؟ تُستخدم لإيقاف المؤقتات عند إخفاء التبويب. */
export function isPageHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}
