/**
 * اختبارات طابور النقاط وتخزين التقدّم (بتخزين وهمي في الذاكرة و fetch وهمي).
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const storage = new MemoryStorage();
(globalThis as unknown as { window: unknown }).window = { localStorage: storage };

const { enqueueSilicon, enqueueAtomic, loadQueue, flushQueue } = await import('../src/utils/scoreQueue');
const { applyServerStudent, emptyProgress, loadProgress, saveProgress } = await import('../src/utils/studentStore');

type Reply = { status: number; body?: unknown } | 'network';
function fakeFetch(replies: Reply[]) {
  const calls: unknown[] = [];
  const impl = (async (_url: string, init?: RequestInit) => {
    calls.push(JSON.parse(String(init?.body)));
    const r = replies.shift() ?? { status: 200, body: {} };
    if (r === 'network') throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status });
  }) as typeof fetch;
  return { impl, calls };
}

beforeEach(() => storage.clear());

test('السيليكون: يحتفظ الطابور بأعلى نتيجة فقط، والذرة دون تكرار', () => {
  enqueueSilicon('A', 'falcon', 3, 0);
  enqueueSilicon('A', 'falcon', 7, 0);
  enqueueSilicon('A', 'falcon', 5, 0);
  enqueueAtomic('A', 'quiz_dalton', 0);
  enqueueAtomic('A', 'quiz_dalton', 0);
  const q = loadQueue('A');
  assert.equal(q.length, 2);
  assert.equal(q.find(i => i.kind === 'silicon')?.kind === 'silicon' && (q[0] as { score: number }).score, 7);
});

test('الطوابير منفصلة لكل طالب', () => {
  enqueueSilicon('A', 'falcon', 3, 0);
  enqueueSilicon('B', 'cipher', 2, 0);
  assert.equal(loadQueue('A').length, 1);
  assert.equal(loadQueue('B').length, 1);
  assert.equal(loadQueue('A')[0].kind === 'silicon' && (loadQueue('A')[0] as { gameId: string }).gameId, 'falcon');
});

test('انقطاع الاتصال يبقي النقاط في الطابور ثم ترسل لاحقاً', async () => {
  enqueueSilicon('A', 'falcon', 3, 0);
  let f = fakeFetch(['network']);
  let r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'offline');
  assert.equal(loadQueue('A').length, 1);

  f = fakeFetch([{ status: 200, body: { student: { id: 'A' } } }]);
  r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'saved');
  assert.equal(loadQueue('A').length, 0);
  assert.deepEqual(f.calls[0], { studentId: 'A', studentKey: 'k', gameId: 'falcon', score: 3, epoch: 0 });
});

test('قبل الاعتماد تبقى النقاط محفوظة بانتظار المعلمة', async () => {
  enqueueAtomic('A', 'quiz_dalton', 0);
  const f = fakeFetch([{ status: 403, body: { code: 'not_approved' } }]);
  const r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'waiting_approval');
  assert.equal(loadQueue('A').length, 1);
});

test('خطأ الخادم المؤقت (5xx) يعيد المحاولة لاحقاً، والطلب غير الصالح (400) يُحذف', async () => {
  enqueueSilicon('A', 'falcon', 3, 0);
  enqueueAtomic('A', 'bad_task', 0);
  let f = fakeFetch([{ status: 503 }]);
  let r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'pending');
  assert.equal(loadQueue('A').length, 2);

  f = fakeFetch([{ status: 200, body: {} }, { status: 400, body: { code: 'unknown_task' } }]);
  r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'saved');
  assert.equal(loadQueue('A').length, 0);
});

test('تصفير المعلمة (409) يُسقط النتائج القديمة، والحذف (404) يمسح الطابور', async () => {
  enqueueSilicon('A', 'falcon', 3, 0);
  let f = fakeFetch([{ status: 409, body: { code: 'stale_epoch', student: { id: 'A', scoreEpoch: 1 } } }]);
  let r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.wasReset, true);
  assert.equal(loadQueue('A').length, 0);

  enqueueSilicon('A', 'falcon', 3, 1);
  f = fakeFetch([{ status: 404, body: {} }]);
  r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.removed, true);
  assert.equal(loadQueue('A').length, 0);
});

test('إرسالان متزامنان للطالب نفسه لا يكرران الطلب', async () => {
  enqueueSilicon('A', 'falcon', 3, 0);
  const f = fakeFetch([{ status: 200, body: {} }]);
  const [a, b] = await Promise.all([flushQueue('A', 'k', f.impl), flushQueue('A', 'k', f.impl)]);
  assert.equal(a, b);
  assert.equal(f.calls.length, 1);
});

test('دمج نسخة الخادم والتصفير في التقدّم المحلي', () => {
  const p = { ...emptyProgress(), siliconScores: { falcon: 5 }, completedGames: ['falcon'], solvedTasks: ['quiz_dalton'] };
  // الخادم يعرف نتيجة أعلى من جهاز آخر
  let r = applyServerStudent(p, { id: 'A', scores: { falcon: 2, cipher: 4 }, completedGames: ['falcon', 'cipher'], atomicTasks: ['match_dalton'], scoreEpoch: 0 } as never);
  assert.equal(r.wasReset, false);
  assert.deepEqual(r.progress.siliconScores, { falcon: 5, cipher: 4 });
  assert.deepEqual(new Set(r.progress.solvedTasks), new Set(['quiz_dalton', 'match_dalton']));

  // تصفير: epoch أكبر يمسح التقدّم المحلي القديم
  r = applyServerStudent(r.progress, { id: 'A', scores: {}, completedGames: [], atomicTasks: [], scoreEpoch: 1 } as never);
  assert.equal(r.wasReset, true);
  assert.deepEqual(r.progress.siliconScores, {});
  assert.equal(r.progress.epoch, 1);
});

test('التقدّم مخزّن لكل هوية على حدة، والترحيل من المفاتيح القديمة مرة واحدة', () => {
  storage.setItem('shhd_silicon_scores', JSON.stringify({ falcon: 6, junk: 99 }));
  storage.setItem('atomic_solved_tasks', JSON.stringify(['quiz_dalton']));
  const first = loadProgress('guest');
  assert.deepEqual(first.siliconScores, { falcon: 6 });
  const other = loadProgress('SQR-Si-2');
  assert.deepEqual(other.siliconScores, {}, 'الترحيل لا يتكرر لهوية أخرى');
  saveProgress('SQR-Si-2', { ...other, siliconScores: { cipher: 1 } });
  assert.deepEqual(loadProgress('guest').siliconScores, { falcon: 6 });
  assert.deepEqual(loadProgress('SQR-Si-2').siliconScores, { cipher: 1 });
});
