/**
 * اختبارات تكامل لواجهة الخادم.
 * كل اختبار يشغّل الخادم في مجلد بيانات مؤقت ومنفذ عشوائي، فلا تُلمس بيانات data/ الحقيقية.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const ROOT = path.resolve(import.meta.dirname, '..');
const children: ChildProcess[] = [];
const tempDirs: string[] = [];

after(() => {
  for (const c of children) c.kill();
  for (const d of tempDirs) fs.rmSync(d, { recursive: true, force: true });
});

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function startServer(env: Record<string, string> = {}, seed?: unknown) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shhd-lab-test-'));
  tempDirs.push(dataDir);
  if (seed) fs.writeFileSync(path.join(dataDir, 'lab-store.json'), JSON.stringify(seed), 'utf-8');
  const port = await freePort();
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts', '--production'], {
    cwd: ROOT,
    env: { ...process.env, TEACHER_CODE: '', ...env, PORT: String(port), LAB_DATA_DIR: dataDir, DOTENV_CONFIG_QUIET: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);
  let output = '';
  child.stdout?.on('data', d => { output += d; });
  child.stderr?.on('data', d => { output += d; });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 300; i++) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) break;
    } catch {
      // لم يبدأ بعد
    }
    if (child.exitCode !== null) throw new Error(`الخادم توقف:\n${output}`);
    await new Promise(r => setTimeout(r, 100));
  }

  const call = async (method: string, url: string, body?: unknown, token?: string) => {
    const res = await fetch(base + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };
  return { call, dataDir, stop: () => child.kill() };
}

const CODE = 'test-secret-1234';

test('دخول المعلمة معطّل عند عدم ضبط TEACHER_CODE', async () => {
  const srv = await startServer({ TEACHER_CODE: '' });
  const r = await srv.call('POST', '/api/teacher/login', { code: 'shahd2026' });
  assert.equal(r.status, 503);
  srv.stop();
});

test('دورة الطالب الكاملة: تسجيل، اعتماد، نقاط، تصفير، حذف', async () => {
  const srv = await startServer({ TEACHER_CODE: CODE });

  // أخطاء التحقق تُعاد كما هي
  let r = await srv.call('POST', '/api/student/register', { fullName: 'ab', pin: '1234' });
  assert.equal(r.status, 400);
  r = await srv.call('POST', '/api/student/register', { fullName: 'سارة أحمد علي', pin: '12' });
  assert.equal(r.status, 400);
  assert.equal(r.data.code, 'invalid_pin');

  r = await srv.call('POST', '/api/student/register', { fullName: 'سارة أحمد علي', pin: '4821' });
  assert.equal(r.status, 200);
  const student = r.data.student;
  const key = r.data.studentKey as string;
  assert.equal(student.status, 'pending');
  assert.ok(key && key.length >= 16);
  assert.equal(student.key, undefined, 'المفتاح لا يظهر داخل سجل الطالب');
  assert.equal(student.pinHash, undefined, 'الرقم السري لا يظهر أبداً');
  assert.equal(student.chemicalId, student.id, 'رقم الطالب يولّده الخادم');
  const stored = JSON.parse(fs.readFileSync(path.join(srv.dataDir, 'lab-store.json'), 'utf-8'));
  assert.ok(!JSON.stringify(stored).includes('4821'), 'الرقم السري لا يُحفظ نصاً');

  // لا تُقبل النقاط قبل الاعتماد
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.0.0', points: 1, epoch: 0 });
  assert.equal(r.status, 403);
  assert.equal(r.data.code, 'not_approved');

  // لا يمكن الدخول لحساب طالب آخر بكتابة اسمه ورقم خاطئ
  r = await srv.call('POST', '/api/student/register', { fullName: 'سارة أحمد علي', pin: '0000' });
  assert.equal(r.status, 401);
  assert.equal(r.data.studentKey, undefined);
  // الاسم والرقم الصحيح (حتى بأرقام عربية ومسافات زائدة) يستعيدان السجل نفسه
  r = await srv.call('POST', '/api/student/register', { fullName: 'سارة  أحمد علي', pin: '٤٨٢١' });
  assert.equal(r.status, 200);
  assert.equal(r.data.student.id, student.id);

  // رمز خاطئ ثم صحيح
  r = await srv.call('POST', '/api/teacher/login', { code: 'wrong' });
  assert.equal(r.status, 401);
  r = await srv.call('POST', '/api/teacher/login', { code: CODE });
  assert.equal(r.status, 200);
  const token = r.data.token as string;
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.ok(r.data.expiresAt > Date.now());

  r = await srv.call('POST', '/api/teacher/approve', { studentId: student.id }, token);
  assert.equal(r.status, 200);

  r = await srv.call('GET', `/api/student/status/${student.id}`);
  assert.equal(r.data.student.status, 'approved');

  // مفتاح خاطئ
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: 'nope', taskId: 'at.0.0', points: 1, epoch: 0 });
  assert.equal(r.status, 403);
  assert.equal(r.data.code, 'bad_key');

  // مهمة مجهولة أو نقاط غير صالحة (أكثر من نقاط المهمة، سالبة، كسرية، نص)
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'quiz_hacker', points: 1, epoch: 0 });
  assert.equal(r.status, 400);
  for (const points of [-1, 99, 1.5, 'x', null]) {
    r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.0.0', points, epoch: 0 });
    assert.equal(r.status, 400, `points=${points}`);
  }

  // أول محاولة فقط تُحتسب: صفر ثم محاولة بنقطة لا تغيّر شيئاً
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.0.0', points: 0, epoch: 0 });
  assert.equal(r.status, 200);
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.0.0', points: 1, epoch: 0 });
  assert.equal(r.status, 200);
  assert.equal(r.data.student.tasks['at.0.0'], 0, 'المحاولة الأولى هي التي تبقى');

  // نقاط لكل مختبر
  await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.3.9' , points: 2, epoch: 0 });
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.1.0', points: 2, epoch: 0 });
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'ca.g4.0', points: 1, epoch: 0 });
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'ca.c2.done', points: 0, epoch: 0 });
  assert.deepEqual(r.data.student.labPoints, { at: 2, ca: 1, su: 0, si: 0 });
  assert.equal(r.data.student.totalPoints, 3);
  assert.equal(r.data.student.summary.elementStations, 1);

  r = await srv.call('GET', '/api/leaderboard');
  const entry = r.data.leaderboard.find((e: { id: string }) => e.id === student.id);
  assert.equal(entry.totalPoints, 3);
  assert.deepEqual(entry.labPoints, { at: 2, ca: 1, su: 0, si: 0 });
  assert.equal(entry.tasks, undefined, 'لوحة الشرف لا تكشف سجل المهام');

  // المعلمة تفتح مختبر العناصر للجميع
  r = await srv.call('GET', '/api/session');
  assert.equal(r.data.session.elementsUnlocked, false);
  await srv.call('POST', '/api/teacher/session', { elementsUnlocked: true }, token);
  r = await srv.call('GET', `/api/student/status/${student.id}`);
  assert.equal(r.data.elementsUnlocked, true);

  // التصفير يرفع epoch ويرفض النتائج القديمة
  r = await srv.call('POST', '/api/teacher/reset-scores', undefined, token);
  assert.equal(r.status, 200);
  const backups = fs.readdirSync(path.join(srv.dataDir, 'backups'));
  assert.ok(backups.some(f => f.includes('before-reset')), 'نسخة احتياطية قبل التصفير');
  assert.ok(backups.some(f => f.includes('daily')), 'نسخة يومية');
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.0.1', points: 1, epoch: 0 });
  assert.equal(r.status, 409);
  assert.equal(r.data.student.scoreEpoch, 1);
  assert.equal(r.data.student.totalPoints, 0);
  r = await srv.call('POST', '/api/student/score', { studentId: student.id, studentKey: key, taskId: 'at.0.1', points: 1, epoch: 1 });
  assert.equal(r.status, 200);
  assert.equal(r.data.student.totalPoints, 1);

  // المعلمة تعيد تعيين الرقم السري
  r = await srv.call('POST', '/api/teacher/reset-pin', { studentId: student.id }, token);
  assert.equal(r.status, 200);
  assert.match(r.data.pin, /^\d{4}$/);
  const newPin = r.data.pin;
  r = await srv.call('POST', '/api/student/register', { fullName: 'سارة أحمد علي', pin: '4821' });
  assert.equal(r.status === 401 || newPin === '4821', true, 'الرقم القديم لم يعد يعمل');
  r = await srv.call('POST', '/api/student/register', { fullName: 'سارة أحمد علي', pin: newPin });
  assert.equal(r.status, 200);

  // تسجيل الخروج يلغي الرمز
  r = await srv.call('POST', '/api/teacher/logout', undefined, token);
  assert.equal(r.status, 200);
  r = await srv.call('GET', '/api/teacher/students', undefined, token);
  assert.equal(r.status, 401);

  // الحذف: الطالب يتلقى 404
  r = await srv.call('POST', '/api/teacher/login', { code: CODE });
  const token2 = r.data.token;
  r = await srv.call('POST', '/api/teacher/delete-student', { studentId: student.id }, token2);
  assert.equal(r.status, 200);
  r = await srv.call('GET', `/api/student/status/${student.id}`);
  assert.equal(r.status, 404);

  // إغلاق المختبر يمنع التسجيل برسالة واضحة
  await srv.call('POST', '/api/teacher/session', { isOpen: false }, token2);
  r = await srv.call('POST', '/api/student/register', { fullName: 'طالب جديد هنا', pin: '1111' });
  assert.equal(r.status, 403);
  assert.equal(r.data.code, 'lab_closed');

  // الملف محفوظ في المجلد المؤقت فقط
  assert.ok(fs.existsSync(path.join(srv.dataDir, 'lab-store.json')));
  srv.stop();
});

test('دفتر الباحث يُحفظ على الخادم ويعود عند الدخول من جهاز آخر', async () => {
  const srv = await startServer({ TEACHER_CODE: CODE });
  let r = await srv.call('POST', '/api/student/register', { fullName: 'ليان سامي حسن', pin: '2468' });
  const { id } = r.data.student;
  const key = r.data.studentKey as string;

  // المفتاح مطلوب
  r = await srv.call('POST', '/api/student/journal', { studentId: id, studentKey: 'wrong', notebook: {} });
  assert.equal(r.status, 403);

  // الجهاز الأول يكتب في مختبر الذرة (مسموح قبل الاعتماد)
  r = await srv.call('POST', '/api/student/journal', {
    studentId: id, studentKey: key,
    notebook: { at: { p: 'توقعت أن الإلكترونات تدور', o: '', c: '' }, xx: { p: 'مختبر غير معروف', o: '', c: '' } },
    conclusions: { at: { t1: 'الذرة متعادلة' } },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.journal.notebook.xx, undefined, 'المختبرات غير المعروفة تُهمل');

  // جهاز ثانٍ بدفتر فارغ لا يمسح ما كُتب، ويضيف مختبره
  r = await srv.call('POST', '/api/student/journal', {
    studentId: id, studentKey: key,
    notebook: { at: { p: '', o: '', c: '' }, ca: { p: '', o: 'فقاعات غاز', c: '' } },
    conclusions: {},
  });
  assert.equal(r.data.journal.notebook.at.p, 'توقعت أن الإلكترونات تدور');
  assert.equal(r.data.journal.notebook.ca.o, 'فقاعات غاز');

  // الدفتر لا يظهر في الاستعلام العام ولا في لوحة الشرف، ويعود عند الدخول بالرقم السري
  r = await srv.call('GET', `/api/student/status/${id}`);
  assert.equal(r.data.student.journal, undefined);
  r = await srv.call('POST', '/api/student/register', { fullName: 'ليان سامي حسن', pin: '2468' });
  assert.equal(r.data.student.journal.conclusions.at.t1, 'الذرة متعادلة');
  assert.equal(r.data.student.journal.notebook.ca.o, 'فقاعات غاز');
  srv.stop();
});

test('حد محاولات الرقم السري الخاطئة للطالب', async () => {
  const srv = await startServer({ TEACHER_CODE: CODE });
  await srv.call('POST', '/api/student/register', { fullName: 'أحمد محمد خالد', pin: '5555' });
  for (let i = 0; i < 5; i++) {
    const r = await srv.call('POST', '/api/student/register', { fullName: 'أحمد محمد خالد', pin: `100${i}` });
    assert.equal(r.status, 401);
  }
  const blocked = await srv.call('POST', '/api/student/register', { fullName: 'أحمد محمد خالد', pin: '5555' });
  assert.equal(blocked.status, 429);
  srv.stop();
});

test('حد محاولات دخول المعلمة الخاطئة', async () => {
  const srv = await startServer({ TEACHER_CODE: CODE });
  for (let i = 0; i < 5; i++) {
    const r = await srv.call('POST', '/api/teacher/login', { code: `bad-${i}` });
    assert.equal(r.status, 401);
  }
  const blocked = await srv.call('POST', '/api/teacher/login', { code: CODE });
  assert.equal(blocked.status, 429, 'حتى الرمز الصحيح يُرفض مؤقتاً بعد 5 محاولات خاطئة');
  srv.stop();
});

test('انتهاء صلاحية رمز المعلمة', async () => {
  // 0.0005 ساعة ≈ 1.8 ثانية
  const srv = await startServer({ TEACHER_CODE: CODE, TEACHER_TOKEN_HOURS: '0.0005' });
  const { data } = await srv.call('POST', '/api/teacher/login', { code: CODE });
  let r = await srv.call('GET', '/api/teacher/students', undefined, data.token);
  assert.equal(r.status, 200);
  await new Promise(res => setTimeout(res, 2200));
  r = await srv.call('GET', '/api/teacher/students', undefined, data.token);
  assert.equal(r.status, 401);
  srv.stop();
});

test('ترحيل بيانات النسخة القديمة: تُحفظ ولا تُحتسب', async () => {
  const seed = {
    students: {
      'SQR-Si-1111': {
        id: 'SQR-Si-1111', fullName: 'طالب قديم جداً', chemicalId: 'OLD-1', createdAt: 1, status: 'approved',
        falconTitle: 't', affiliation: 'a',
        scores: { falcon: 5, cipher: 2 }, completedGames: ['falcon', 'cipher'], atomicTasks: ['quiz_dalton'], totalPoints: 8, lastActive: 1,
      },
    },
    session: { isOpen: true, announcement: 'إعلان قديم', lessonName: 'l', teacherName: 'n', organization: 'o' },
  };
  const srv = await startServer({ TEACHER_CODE: CODE }, seed);
  let r = await srv.call('GET', '/api/leaderboard');
  const s = r.data.leaderboard[0];
  assert.equal(s.totalPoints, 0, 'نقاط المحتوى القديم لا تُحتسب في المحتوى الجديد');
  assert.equal(s.legacy, undefined, 'لا تُكشف للعامة');
  // سجل قديم بلا مفتاح يبقى قادراً على الإرسال
  r = await srv.call('POST', '/api/student/score', { studentId: 'SQR-Si-1111', taskId: 'at.0.0', points: 1, epoch: 0 });
  assert.equal(r.status, 200);
  assert.equal(r.data.student.totalPoints, 1);
  r = await srv.call('GET', '/api/session');
  assert.equal(r.data.session.announcement, 'إعلان قديم');
  assert.equal(r.data.session.elementsUnlocked, false);
  srv.stop();
  // النقاط القديمة ما زالت في الملف
  const stored = JSON.parse(fs.readFileSync(path.join(srv.dataDir, 'lab-store.json'), 'utf-8'));
  assert.deepEqual(stored.students['SQR-Si-1111'].legacy.scores, { falcon: 5, cipher: 2 });
});

test('عجلة الصقور: نقطتان أو نقطة لكل سؤال، تُحتسب مرة واحدة ومستقلة لكل مختبر', async () => {
  const srv = await startServer({ TEACHER_CODE: CODE });
  let r = await srv.call('POST', '/api/student/register', { fullName: 'ليان محمد خالد', pin: '2468' });
  const id = r.data.student.id as string;
  const key = r.data.studentKey as string;
  r = await srv.call('POST', '/api/teacher/login', { code: CODE });
  const token = r.data.token as string;
  await srv.call('POST', '/api/teacher/approve', { studentId: id }, token);

  const score = (taskId: string, points: number) => srv.call('POST', '/api/student/score', { studentId: id, studentKey: key, taskId, points, epoch: 0 });
  assert.equal((await score('ca.wheel.0', 3)).status, 400, 'أعلى من نقطتين مرفوض');
  assert.equal((await score('at.wheel.0', 2)).status, 400, 'لا عجلة في مختبر الذرة');
  assert.equal((await score('ca.wheel.0', 2)).status, 200);
  assert.equal((await score('ca.wheel.1', 1)).status, 200);
  r = await score('ca.wheel.1', 2);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.student.labPoints, { at: 0, ca: 3, su: 0, si: 0 }, 'السؤال لا يُحتسب مرتين');
  r = await score('su.wheel.0', 2);
  assert.deepEqual(r.data.student.labPoints, { at: 0, ca: 3, su: 2, si: 0 });
});

test('توجيه أ. شهد: النص السابق يُستبدل بالجديد، ونص المعلمة الخاص يبقى', async () => {
  const OLD = 'مرحبًا بكم يا صقور الكيمياء! اليوم مراجعة على شكل ألعاب وتحديات: نراجع فصل الذرة والعناصر ونجمع النقاط، ونرى من يصبح «صقر الكيمياء».';
  let srv = await startServer({}, { students: {}, session: { isOpen: true, announcement: OLD } });
  let r = await srv.call('GET', '/api/session');
  assert.match(r.data.session.announcement, /^مرحبًا بكم يا صقور الكيمياء في منصة سنابل التعليمية، في مختبر أ\. شهد نصير!\nهنا تبدأ التحديات/);
  srv = await startServer({}, { students: {}, session: { isOpen: true, announcement: 'نص خاص' } });
  r = await srv.call('GET', '/api/session');
  assert.equal(r.data.session.announcement, "نص خاص");
});
