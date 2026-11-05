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

const { enqueueTask, loadQueue, flushQueue } = await import('../src/utils/scoreQueue');
const { applyServerStudent, emptyProgress, loadProgress, saveProgress, mergeProgress } = await import('../src/utils/studentStore');

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

test('أول محاولة فقط تدخل الطابور لكل مهمة', () => {
  enqueueTask('A', 'at.0.0', 1, 0);
  enqueueTask('A', 'at.0.0', 0, 0);
  enqueueTask('A', 'ca.g4.0', 1, 0);
  const q = loadQueue('A');
  assert.equal(q.length, 2);
  assert.equal(q[0].points, 1);
});

test('الطوابير منفصلة لكل طالب', () => {
  enqueueTask('A', 'at.0.0', 1, 0);
  enqueueTask('B', 'at.0.1', 1, 0);
  assert.equal(loadQueue('A').length, 1);
  assert.equal(loadQueue('B')[0].taskId, 'at.0.1');
});

test('انقطاع الاتصال يبقي النقاط في الطابور ثم ترسل لاحقاً', async () => {
  enqueueTask('A', 'at.0.0', 1, 0);
  let f = fakeFetch(['network']);
  let r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'offline');
  assert.equal(loadQueue('A').length, 1);

  f = fakeFetch([{ status: 200, body: { student: { id: 'A' } } }]);
  r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'saved');
  assert.equal(loadQueue('A').length, 0);
  assert.deepEqual(f.calls[0], { studentId: 'A', studentKey: 'k', taskId: 'at.0.0', points: 1, epoch: 0 });
});

test('قبل الاعتماد تبقى النقاط محفوظة بانتظار المعلمة', async () => {
  enqueueTask('A', 'at.0.0', 1, 0);
  const f = fakeFetch([{ status: 403, body: { code: 'not_approved' } }]);
  const r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.state, 'waiting_approval');
  assert.equal(loadQueue('A').length, 1);
});

test('خطأ الخادم المؤقت (5xx) يعيد المحاولة لاحقاً، والطلب غير الصالح (400) يُحذف', async () => {
  enqueueTask('A', 'at.0.0', 1, 0);
  enqueueTask('A', 'at.0.1', 1, 0);
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
  enqueueTask('A', 'at.0.0', 1, 0);
  let f = fakeFetch([{ status: 409, body: { code: 'stale_epoch', student: { id: 'A', scoreEpoch: 1 } } }]);
  let r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.wasReset, true);
  assert.equal(loadQueue('A').length, 0);

  enqueueTask('A', 'at.0.0', 1, 1);
  f = fakeFetch([{ status: 404, body: {} }]);
  r = await flushQueue('A', 'k', f.impl);
  assert.equal(r.removed, true);
  assert.equal(loadQueue('A').length, 0);
});

test('إرسالان متزامنان للطالب نفسه لا يكرران الطلب', async () => {
  enqueueTask('A', 'at.0.0', 1, 0);
  const f = fakeFetch([{ status: 200, body: {} }]);
  const [a, b] = await Promise.all([flushQueue('A', 'k', f.impl), flushQueue('A', 'k', f.impl)]);
  assert.equal(a, b);
  assert.equal(f.calls.length, 1);
});

test('دمج نسخة الخادم: نتيجة أول محاولة على الجهاز لا تتغير، ويُضاف ما سُجّل من جهاز آخر', () => {
  const p = { ...emptyProgress(), tasks: { 'at.0.0': 0 } };
  let r = applyServerStudent(p, { id: 'A', tasks: { 'at.0.0': 1, 'at.0.1': 1, 'bogus.1': 5 }, scoreEpoch: 0 } as never);
  assert.equal(r.wasReset, false);
  assert.deepEqual(r.progress.tasks, { 'at.0.0': 0, 'at.0.1': 1 });

  // تصفير: epoch أكبر يمسح المهام المحلية القديمة
  r = applyServerStudent(r.progress, { id: 'A', tasks: {}, scoreEpoch: 1 } as never);
  assert.equal(r.wasReset, true);
  assert.deepEqual(r.progress.tasks, {});
  assert.equal(r.progress.epoch, 1);
});

test('التقدّم مخزّن لكل هوية، والدفتر يُدمج دون فقدان', () => {
  saveProgress('guest', { ...emptyProgress(), tasks: { 'at.0.0': 1 }, notebook: { ca: { p: 'توقعي', o: '', c: '' } } });
  saveProgress('SQR-Si-2', { ...emptyProgress(), tasks: { 'at.0.1': 1 } });
  assert.deepEqual(loadProgress('guest').tasks, { 'at.0.0': 1 });
  assert.deepEqual(loadProgress('SQR-Si-2').tasks, { 'at.0.1': 1 });
  const merged = mergeProgress(loadProgress('SQR-Si-2'), loadProgress('guest'));
  assert.deepEqual(merged.tasks, { 'at.0.0': 1, 'at.0.1': 1 });
  assert.equal(merged.notebook.ca.p, 'توقعي');
});
