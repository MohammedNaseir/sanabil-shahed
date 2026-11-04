/**
 * طابور إرسال النقاط: يحفظ كل نتيجة على الجهاز أولاً ثم يرسلها للخادم،
 * ويعيد المحاولة عند انقطاع الاتصال دون تكرار أو فقدان.
 * الطابور منفصل لكل طالب حتى لا تختلط نتائج طالبين على الجهاز نفسه.
 */
import type { Student } from '../types';
import { readJSON, safeRemove, writeJSON } from './storage';

export type QueueItem =
  | { kind: 'silicon'; gameId: string; score: number; epoch: number; createdAt: number }
  | { kind: 'atomic'; taskId: string; epoch: number; createdAt: number };

export type SyncState =
  | 'saved'            // كل النقاط وصلت للخادم
  | 'pending'          // هناك نقاط بانتظار الإرسال
  | 'offline'          // لا يوجد اتصال، سنعيد المحاولة
  | 'waiting_approval' // محفوظة وتنتظر موافقة المعلمة
  | 'local'            // وضع التدريب دون اتصال (لا ترسل للخادم)
  | 'error';           // خطأ دائم (مثلاً مفتاح غير صالح)

export function queueKey(studentId: string) {
  return `shhd_score_queue_v1:${studentId}`;
}

export function loadQueue(studentId: string): QueueItem[] {
  const q = readJSON<QueueItem[]>(queueKey(studentId), []);
  return Array.isArray(q) ? q : [];
}

function saveQueue(studentId: string, items: QueueItem[]) {
  if (items.length === 0) safeRemove(queueKey(studentId));
  else writeJSON(queueKey(studentId), items);
}

export function clearQueue(studentId: string) {
  safeRemove(queueKey(studentId));
}

/** يضيف نتيجة لعبة سيليكون، ويحتفظ بالأعلى إن وُجدت نتيجة سابقة للعبة نفسها. */
export function enqueueSilicon(studentId: string, gameId: string, score: number, epoch: number) {
  const items = loadQueue(studentId);
  const existing = items.find(i => i.kind === 'silicon' && i.gameId === gameId);
  if (existing && existing.kind === 'silicon') {
    existing.score = Math.max(existing.score, score);
    existing.epoch = epoch;
  } else {
    items.push({ kind: 'silicon', gameId, score, epoch, createdAt: Date.now() });
  }
  saveQueue(studentId, items);
}

/** يضيف مهمة ذرة محلولة (مرة واحدة فقط). */
export function enqueueAtomic(studentId: string, taskId: string, epoch: number) {
  const items = loadQueue(studentId);
  if (!items.some(i => i.kind === 'atomic' && i.taskId === taskId)) {
    items.push({ kind: 'atomic', taskId, epoch, createdAt: Date.now() });
    saveQueue(studentId, items);
  }
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
    const body = item.kind === 'silicon'
      ? { studentId, studentKey, gameId: item.gameId, score: item.score, epoch: item.epoch }
      : { studentId, studentKey, taskId: item.taskId, epoch: item.epoch };

    let res: Response;
    try {
      res = await fetchImpl('/api/student/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    items = loadQueue(studentId).filter(i => !sameItem(i, item));
    saveQueue(studentId, items);
  }

  return { state: 'saved', student: lastStudent, wasReset };
}

function sameItem(a: QueueItem, b: QueueItem) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'silicon' && b.kind === 'silicon') return a.gameId === b.gameId && a.score <= b.score;
  if (a.kind === 'atomic' && b.kind === 'atomic') return a.taskId === b.taskId;
  return false;
}
