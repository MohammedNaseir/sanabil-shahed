/**
 * طابور إرسال النقاط: يحفظ كل نتيجة على الجهاز أولاً ثم يرسلها للخادم،
 * ويعيد المحاولة عند انقطاع الاتصال دون تكرار أو فقدان.
 * الطابور منفصل لكل طالب حتى لا تختلط نتائج طالبين على الجهاز نفسه.
 */
import type { Student } from '../types';
import { readJSON, safeRemove, writeJSON } from './storage';

export interface QueueItem {
  kind: 'task';
  taskId: string;
  points: number;
  epoch: number;
  createdAt: number;
}

export type SyncState =
  | 'saved'            // كل النقاط وصلت للخادم
  | 'pending'          // هناك نقاط بانتظار الإرسال
  | 'offline'          // لا يوجد اتصال، سنعيد المحاولة
  | 'waiting_approval' // محفوظة وتنتظر موافقة المعلمة
  | 'local'            // وضع التدريب دون اتصال (لا ترسل للخادم)
  | 'error';           // خطأ دائم (مثلاً مفتاح غير صالح)

export function queueKey(studentId: string) {
  return `shhd_score_queue_v2:${studentId}`;
}

export function loadQueue(studentId: string): QueueItem[] {
  const q = readJSON<QueueItem[]>(queueKey(studentId), []);
  return Array.isArray(q) ? q.filter(i => i && i.kind === 'task') : [];
}

function saveQueue(studentId: string, items: QueueItem[]) {
  if (items.length === 0) safeRemove(queueKey(studentId));
  else writeJSON(queueKey(studentId), items);
}

export function clearQueue(studentId: string) {
  safeRemove(queueKey(studentId));
}

/** يضيف نتيجة مهمة مرة واحدة فقط (أول محاولة هي التي تُحتسب). */
export function enqueueTask(studentId: string, taskId: string, points: number, epoch: number) {
  const items = loadQueue(studentId);
  if (items.some(i => i.taskId === taskId)) return;
  items.push({ kind: 'task', taskId, points, epoch, createdAt: Date.now() });
  saveQueue(studentId, items);
}

export interface FlushResult {
  state: SyncState;
  /** آخر نسخة من سجل الطالب كما أعادها الخادم. */
  student?: Student;
  /** حذفت المعلمة الطالب من السجل. */
  removed?: boolean;
  /** صفّرت المعلمة النقاط. */
  wasReset?: boolean;
  message?: string;
}

const inFlight = new Map<string, Promise<FlushResult>>();

/** يرسل الطابور بالترتيب. لا تعمل عمليتا إرسال للطالب نفسه في آن واحد. */
export function flushQueue(
  studentId: string,
  studentKey: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<FlushResult> {
  const running = inFlight.get(studentId);
  if (running) return running;
  const p = doFlush(studentId, studentKey, fetchImpl).finally(() => inFlight.delete(studentId));
  inFlight.set(studentId, p);
  return p;
}

async function doFlush(studentId: string, studentKey: string | null, fetchImpl: typeof fetch): Promise<FlushResult> {
  let items = loadQueue(studentId);
  let lastStudent: Student | undefined;
  let wasReset = false;

  while (items.length > 0) {
    const item = items[0];
    let res: Response;
    try {
      res = await fetchImpl('/api/student/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, studentKey, taskId: item.taskId, points: item.points, epoch: item.epoch }),
      });
    } catch {
      return { state: 'offline', student: lastStudent, wasReset };
    }

    const data = await res.json().catch(() => ({} as Record<string, unknown>));

    if (res.ok) {
      lastStudent = (data as { student?: Student }).student ?? lastStudent;
    } else if (res.status === 409) {
      // نتيجة من قبل تصفير المعلمة: نتجاهلها
      wasReset = true;
      lastStudent = (data as { student?: Student }).student ?? lastStudent;
    } else if (res.status === 404) {
      clearQueue(studentId);
      return { state: 'error', removed: true, message: 'لم يعد سجلك موجوداً لدى المعلمة.' };
    } else if (res.status === 403 && (data as { code?: string }).code === 'not_approved') {
      return { state: 'waiting_approval', student: lastStudent, wasReset };
    } else if (res.status === 403) {
      clearQueue(studentId);
      return { state: 'error', student: lastStudent, message: String((data as { error?: string }).error || 'تعذّر اعتماد النقاط') };
    } else if (res.status >= 400 && res.status < 500) {
      // طلب غير صالح بشكل دائم: نحذفه حتى لا يعلق الطابور
    } else {
      return { state: 'pending', student: lastStudent, wasReset };
    }

    // أزل العنصر المُعالَج فقط (قد تكون أضيفت عناصر جديدة أثناء الإرسال)
    items = loadQueue(studentId).filter(i => i.taskId !== item.taskId);
    saveQueue(studentId, items);
  }

  return { state: 'saved', student: lastStudent, wasReset };
}
