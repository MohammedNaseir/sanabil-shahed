/**
 * استدعاء دوري يتوقف عندما تكون الصفحة مخفية ويعود فوراً عند ظهورها أو عودة الاتصال.
 * لا يبدأ طلب جديد قبل انتهاء السابق.
 */
import { useEffect, useRef } from 'react';

export function usePolling(task: () => Promise<unknown> | unknown, intervalMs: number, enabled = true) {
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;
    let disposed = false;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (!disposed && document.visibilityState === 'visible') {
        timer = setTimeout(run, intervalMs);
      }
    };

    const run = async () => {
      if (disposed || running || document.visibilityState !== 'visible') return;
      running = true;
      try {
        await taskRef.current();
      } catch {
        // الأخطاء تعالجها المهمة نفسها
      } finally {
        running = false;
        schedule();
      }
    };

    const onWake = () => {
      if (document.visibilityState === 'visible') run();
      else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    run();
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
    };
  }, [intervalMs, enabled]);
}
