import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  TASK_POINTS,
  isTaskId,
  labTotals,
  atomFinalDone,
  atomGateDone,
  stationDoneId,
  LAB_IDS,
} from './src/content/tasks';
import { ATOM_GATES } from './src/content/atom';
import { ELEMENT_LABS } from './src/content/elements';

// يُشغَّل الخادم دائماً من مجلد المشروع، فنعتمد عليه كجذر.
const ROOT = process.cwd();
dotenv.config({ path: [path.join(ROOT, '.env.local'), path.join(ROOT, '.env')], quiet: true });

const IS_PRODUCTION = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
if (IS_PRODUCTION) process.env.NODE_ENV = 'production';

const PORT = Number(process.env.PORT) || 3000;
const ONLINE_WINDOW_MS = 45_000;

const app = express();
app.disable('x-powered-by');
// لا نثق بترويسة X-Forwarded-For إلا إذا كان الخادم فعلاً خلف بروكسي (مثلاً TRUST_PROXY=1)،
// وإلا يستطيع أي أحد تغييرها لتجاوز حد محاولات الدخول.
const TRUST_PROXY = (process.env.TRUST_PROXY || '').trim();
app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY === 'true' ? 1 : false);
// دفتر الباحث أكبر قليلاً من باقي الطلبات، فنعطيه حداً خاصاً
const jsonSmall = express.json({ limit: '32kb' });
const jsonJournal = express.json({ limit: '128kb' });
app.use((req, res, next) => (req.path === '/api/student/journal' ? jsonJournal : jsonSmall)(req, res, next));

// =================== TEACHER AUTH ===================

// لا يوجد رمز افتراضي: يجب ضبط TEACHER_CODE في البيئة أو في ملف .env.local
const TEACHER_CODE = (process.env.TEACHER_CODE || '').trim();
const TOKEN_TTL_MS = (Number(process.env.TEACHER_TOKEN_HOURS) || 8) * 60 * 60 * 1000;
const teacherTokens = new Map<string, number>(); // token -> expiresAt

function hashSecret(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function isTeacherCodeValid(code: unknown): boolean {
  if (!TEACHER_CODE || typeof code !== 'string') return false;
  return crypto.timingSafeEqual(hashSecret(code.trim()), hashSecret(TEACHER_CODE));
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expiresAt] of teacherTokens) {
    if (expiresAt <= now) teacherTokens.delete(token);
  }
}
setInterval(cleanupExpiredTokens, 10 * 60 * 1000).unref();

// حد بسيط لمحاولات الدخول الخاطئة: 5 محاولات لكل عنوان كل 15 دقيقة
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const loginFailures = new Map<string, { count: number; firstAt: number }>();

function getClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function isLoginBlocked(key: string): number {
  const entry = loginFailures.get(key);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.firstAt;
  if (elapsed > LOGIN_WINDOW_MS) {
    loginFailures.delete(key);
    return 0;
  }
  return entry.count >= LOGIN_MAX_FAILURES ? LOGIN_WINDOW_MS - elapsed : 0;
}

function recordLoginFailure(key: string) {
  const entry = loginFailures.get(key);
  if (!entry || Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
    loginFailures.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count++;
  }
}

function readBearer(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

function requireTeacher(req: Request, res: Response, next: NextFunction): void {
  const token = readBearer(req);
  if (!token) {
    res.status(401).json({ error: 'غير مصرح: يرجى تسجيل دخول المعلمة أولاً' });
    return;
  }
  const expiresAt = teacherTokens.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    teacherTokens.delete(token);
    res.status(401).json({ error: 'انتهت صلاحية جلسة المعلمة، يرجى تسجيل الدخول من جديد' });
    return;
  }
  next();
}

// =================== DATA STORE ===================

const DATA_DIR = path.resolve(process.env.LAB_DATA_DIR || path.join(ROOT, 'data'));
const DB_FILE = path.join(DATA_DIR, 'lab-store.json');

type LabPoints = { at: number; ca: number; su: number; si: number };

export interface Journal {
  notebook: Record<string, { p: string; o: string; c: string }>;
  conclusions: Record<string, Record<string, string>>;
}

const NOTE_MAX = 3000;
const CONCLUSION_MAX = 400;
const CONCLUSIONS_PER_LAB = 30;

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

/** ينظّف الدفتر القادم من الطالب: مختبرات معروفة فقط ونصوص بطول محدود. */
function cleanJournal(raw: unknown): Journal {
  const out: Journal = { notebook: {}, conclusions: {} };
  const r = (raw && typeof raw === 'object' ? raw : {}) as { notebook?: unknown; conclusions?: unknown };
  const nb = (r.notebook && typeof r.notebook === 'object' ? r.notebook : {}) as Record<string, unknown>;
  const cs = (r.conclusions && typeof r.conclusions === 'object' ? r.conclusions : {}) as Record<string, unknown>;
  for (const lab of LAB_IDS) {
    const page = nb[lab] as Record<string, unknown> | undefined;
    if (page && typeof page === 'object') {
      const pg = { p: clip(page.p, NOTE_MAX), o: clip(page.o, NOTE_MAX), c: clip(page.c, NOTE_MAX) };
      if (pg.p || pg.o || pg.c) out.notebook[lab] = pg;
    }
    const m = cs[lab] as Record<string, unknown> | undefined;
    if (m && typeof m === 'object') {
      const entries = Object.entries(m).filter(([k, v]) => k.length <= 60 && typeof v === 'string').slice(0, CONCLUSIONS_PER_LAB);
      if (entries.length) out.conclusions[lab] = Object.fromEntries(entries.map(([k, v]) => [k, clip(v, CONCLUSION_MAX)]));
    }
  }
  return out;
}

function mergeJournal(base: Journal | undefined, incoming: Journal): Journal {
  const out: Journal = { notebook: { ...(base?.notebook ?? {}) }, conclusions: { ...(base?.conclusions ?? {}) } };
  for (const [lab, pg] of Object.entries(incoming.notebook)) {
    const cur = out.notebook[lab] ?? { p: '', o: '', c: '' };
    out.notebook[lab] = { p: pg.p || cur.p, o: pg.o || cur.o, c: pg.c || cur.c };
  }
  for (const [lab, m] of Object.entries(incoming.conclusions)) {
    out.conclusions[lab] = Object.fromEntries(Object.entries({ ...out.conclusions[lab], ...m }).slice(0, CONCLUSIONS_PER_LAB));
  }
  return out;
}

export interface StudentRecord {
  id: string;
  /** مفتاح سري يُعطى للطالب عند التسجيل ويُطلب عند إرسال النقاط. */
  key?: string;
  /** الرقم السري مُجزّأً: salt:hash */
  pinHash?: string;
  fullName: string;
  chemicalId: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  falconTitle: string;
  affiliation: string;
  /** نقاط كل مهمة (وجود المفتاح = حاول الطالب، والقيمة نقاط أول محاولة). */
  tasks: Record<string, number>;
  labPoints: LabPoints;
  totalPoints: number;
  /** نقاط النسخة السابقة من المختبر (محفوظة للرجوع إليها، لا تُحتسب). */
  legacy?: Record<string, unknown>;
  /** دفتر الباحث واستنتاجات التجارب، ليعود للطالب من أي جهاز. */
  journal?: Journal;
  /** يزيد عند تصفير المعلمة للنقاط حتى ترفض الإرسالات القديمة. */
  scoreEpoch: number;
  lastActive: number;
}

export interface LabSessionConfig {
  isOpen: boolean;
  announcement: string;
  lessonName: string;
  teacherName: string;
  organization: string;
  /** المعلمة فتحت مختبر العناصر للصف كله. */
  elementsUnlocked: boolean;
}

interface DBStore {
  students: Record<string, StudentRecord>;
  session: LabSessionConfig;
}

const DEFAULT_ANNOUNCEMENT = 'مرحبًا بكم يا صقور الكيمياء في منصة سنابل التعليمية، في مختبر أ. شهد نصير!\nهنا تبدأ التحديات، ونخوض الأسئلة، ونختبر معلوماتنا وتفكيرنا الكيميائي بكل حماس! 🦅💙';
/** نص التوجيه السابق: يُستبدل تلقائياً بالجديد ما دامت المعلمة لم تكتب نصاً خاصاً بها. */
const PREVIOUS_ANNOUNCEMENT = 'مرحبًا بكم يا صقور الكيمياء! اليوم مراجعة على شكل ألعاب وتحديات: نراجع فصل الذرة والعناصر ونجمع النقاط، ونرى من يصبح «صقر الكيمياء».';

const DEFAULT_SESSION: LabSessionConfig = {
  isOpen: true,
  announcement: DEFAULT_ANNOUNCEMENT,
  lessonName: 'مراجعة فصل الذرة والعناصر — الكيمياء الصف العاشر',
  teacherName: 'أ. شهد نصير',
  organization: 'منصة سنابل التعليمية',
  elementsUnlocked: false,
};

function recalcTotals(s: StudentRecord) {
  const t = labTotals(s.tasks);
  s.labPoints = { at: t.at, ca: t.ca, su: t.su, si: t.si };
  s.totalPoints = t.total;
}

function cleanTasks(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (isTaskId(id) && Number.isFinite(n)) out[id] = Math.max(0, Math.min(TASK_POINTS[id], Math.floor(n)));
  }
  return out;
}

/** ملخّص الإنجاز للوحة المعلمة ولوحة الشرف. */
function progressSummary(s: StudentRecord) {
  return {
    atomGates: ATOM_GATES.filter((_, i) => atomGateDone(s.tasks, i)).length,
    atomFinal: atomFinalDone(s.tasks),
    elementStations: ELEMENT_LABS.reduce((a, L) => a + L.stations.filter(st => s.tasks[stationDoneId(L.id, st.id)] !== undefined).length, 0),
    attempted: Object.keys(s.tasks).length,
  };
}

/** يحوّل السجلات القديمة إلى الشكل الجديد دون فقدان بيانات. */
function normalizeStudent(raw: Partial<StudentRecord> & { id: string }): StudentRecord {
  const old = raw as Record<string, unknown>;
  // نقاط النسخة السابقة (ألعاب السيليكون ووجهات الذرة القديمة) نحفظها كما هي دون احتسابها
  const legacy = raw.legacy ?? (old.scores || old.atomicTasks || old.completedGames
    ? { scores: old.scores, completedGames: old.completedGames, atomicTasks: old.atomicTasks, totalPoints: old.totalPoints }
    : undefined);
  const s: StudentRecord = {
    id: raw.id,
    key: raw.key,
    pinHash: raw.pinHash,
    fullName: String(raw.fullName || ''),
    chemicalId: String(raw.chemicalId || ''),
    createdAt: Number(raw.createdAt) || Date.now(),
    status: raw.status === 'approved' || raw.status === 'rejected' ? raw.status : 'pending',
    rejectionReason: raw.rejectionReason,
    falconTitle: raw.falconTitle || 'صقر كيميائي - باحث مختبر',
    affiliation: raw.affiliation || 'صقور أ. شهد في منصة سنابل',
    tasks: cleanTasks(raw.tasks),
    labPoints: { at: 0, ca: 0, su: 0, si: 0 },
    totalPoints: 0,
    ...(legacy ? { legacy } : {}),
    ...(raw.journal ? { journal: cleanJournal(raw.journal) } : {}),
    scoreEpoch: Number(raw.scoreEpoch) || 0,
    lastActive: Number(raw.lastActive) || 0,
  };
  recalcTotals(s);
  return s;
}

let store: DBStore = { students: {}, session: { ...DEFAULT_SESSION } };

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Partial<DBStore>;
    const students: Record<string, StudentRecord> = {};
    for (const [id, rec] of Object.entries(parsed.students || {})) {
      students[id] = normalizeStudent({ ...rec, id });
    }
    store = { students, session: { ...DEFAULT_SESSION, ...(parsed.session || {}) } };
    if (store.session.announcement === PREVIOUS_ANNOUNCEMENT) store.session.announcement = DEFAULT_ANNOUNCEMENT;
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('تعذّر تحميل قاعدة البيانات، لن يُكتب فوقها حتى يُصلح الملف:', err);
  // نوقف الحفظ حتى لا نمسح ملفاً تالفاً قد يحتوي بيانات حقيقية
  process.exitCode = 1;
  throw err;
}

function saveDB() {
  try {
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('Failed to persist DB:', err);
  }
}

// ---------- النسخ الاحتياطي ----------
// نسخة يومية + نسخة قبل كل تصفير أو حذف، داخل data/backups، ونحتفظ بآخر 30 نسخة.
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_KEEP = 30;

function backupDB(reason: 'daily' | 'before-reset' | 'before-delete') {
  try {
    if (!fs.existsSync(DB_FILE)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = reason === 'daily'
      ? new Date().toISOString().slice(0, 10)
      : new Date().toISOString().replace(/[:.]/g, '-');
    const target = path.join(BACKUP_DIR, `lab-store-${stamp}-${reason}.json`);
    if (reason === 'daily' && fs.existsSync(target)) return;
    fs.copyFileSync(DB_FILE, target);
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('lab-store-')).sort();
    for (const old of files.slice(0, Math.max(0, files.length - BACKUP_KEEP))) fs.rmSync(path.join(BACKUP_DIR, old));
  } catch (err) {
    console.error('تعذّر إنشاء نسخة احتياطية:', err);
  }
}
backupDB('daily');
setInterval(() => backupDB('daily'), 60 * 60 * 1000).unref();

/** نسخة الطالب الآمنة للإرسال (بدون المفتاح السري). */
function publicStudent(s: StudentRecord) {
  const { key: _key, pinHash: _pin, legacy: _legacy, journal: _journal, ...rest } = s;
  return { ...rest, summary: progressSummary(s) };
}

/** للطالب نفسه فقط (بعد التحقق من الرقم السري أو المفتاح): مع الدفتر. */
function ownStudent(s: StudentRecord) {
  return { ...publicStudent(s), journal: s.journal ?? { notebook: {}, conclusions: {} } };
}

function isOnline(s: StudentRecord, now = Date.now()) {
  return s.status === 'approved' && now - s.lastActive < ONLINE_WINDOW_MS;
}

/** يتحقق من مفتاح الطالب. السجلات القديمة بلا مفتاح تبقى مقبولة. */
function checkStudentKey(s: StudentRecord, key: unknown): boolean {
  if (!s.key) return true;
  return typeof key === 'string' && key.length === s.key.length &&
    crypto.timingSafeEqual(Buffer.from(key), Buffer.from(s.key));
}

function newStudentId(): string {
  for (let i = 0; i < 50; i++) {
    const id = `SQR-${crypto.randomInt(1000, 10000)}`;
    if (!store.students[id]) return id;
  }
  return `SQR-${crypto.randomUUID().slice(0, 8)}`;
}

// =================== API ENDPOINTS ===================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, teacherLoginEnabled: Boolean(TEACHER_CODE) });
});

app.get('/api/session', (_req: Request, res: Response) => {
  const now = Date.now();
  res.json({
    session: store.session,
    totalRegistered: Object.keys(store.students).length,
    activeCount: Object.values(store.students).filter(s => isOnline(s, now)).length,
  });
});

// ---------- الرقم السري للطالب ----------
// يختاره الطالب عند التسجيل (4 إلى 6 أرقام) ويُحفظ مُجزّأً (hash) لا نصاً.
const PIN_RE = /^\d{4,6}$/;

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === test.length && crypto.timingSafeEqual(test, expected);
}

/** يحوّل الأرقام العربية/الفارسية إلى أرقام لاتينية (الطلاب يكتبون بلوحة عربية). */
function normalizeDigits(v: string): string {
  return v.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0)).trim();
}

// حد المحاولات الخاطئة للرقم السري: 5 محاولات لكل اسم كل 15 دقيقة (4 أرقام = 10000 احتمال فقط)
const pinFailures = new Map<string, { count: number; firstAt: number }>();
function pinBlockedMs(nameKey: string): number {
  const e = pinFailures.get(nameKey);
  if (!e) return 0;
  const elapsed = Date.now() - e.firstAt;
  if (elapsed > LOGIN_WINDOW_MS) {
    pinFailures.delete(nameKey);
    return 0;
  }
  return e.count >= LOGIN_MAX_FAILURES ? LOGIN_WINDOW_MS - elapsed : 0;
}
function recordPinFailure(nameKey: string) {
  const e = pinFailures.get(nameKey);
  if (!e || Date.now() - e.firstAt > LOGIN_WINDOW_MS) pinFailures.set(nameKey, { count: 1, firstAt: Date.now() });
  else e.count++;
}

/**
 * تسجيل طالب جديد أو الدخول لسجل موجود: الاسم الثلاثي + رقم سري يختاره الطالب.
 * الهوية الكيميائية يولّدها الخادم تلقائياً.
 */
app.post('/api/student/register', (req: Request, res: Response): void => {
  const { fullName } = req.body || {};
  const pin = typeof req.body?.pin === 'string' || typeof req.body?.pin === 'number' ? normalizeDigits(String(req.body.pin)) : '';

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3 || fullName.length > 80) {
    res.status(400).json({ error: 'يرجى إدخال اسم الطالب كاملاً.', code: 'invalid_name' });
    return;
  }
  if (!PIN_RE.test(pin)) {
    res.status(400).json({ error: 'الرقم السري يجب أن يكون من 4 إلى 6 أرقام.', code: 'invalid_pin' });
    return;
  }

  const cleanName = fullName.trim().replace(/\s+/g, ' ');
  const nameKey = cleanName.toLowerCase();
  const existing = Object.values(store.students).find(s => s.fullName.replace(/\s+/g, ' ').toLowerCase() === nameKey);

  if (existing) {
    const blocked = pinBlockedMs(nameKey);
    if (blocked > 0) {
      res.setHeader('Retry-After', String(Math.ceil(blocked / 1000)));
      res.status(429).json({ error: `محاولات خاطئة كثيرة. حاول بعد ${Math.ceil(blocked / 60000)} دقيقة أو اطلب من المعلمة إعادة تعيين رقمك السري.`, code: 'rate_limited' });
      return;
    }
    if (existing.pinHash && !verifyPin(pin, existing.pinHash)) {
      recordPinFailure(nameKey);
      res.status(401).json({ error: 'هذا الاسم مسجّل من قبل، والرقم السري غير صحيح. إن نسيته اطلب من المعلمة إعادة تعيينه.', code: 'bad_pin' });
      return;
    }
    // سجل قديم بلا رقم سري: أول من يدخل يحدده
    if (!existing.pinHash) existing.pinHash = hashPin(pin);
    pinFailures.delete(nameKey);
    if (!existing.key) existing.key = crypto.randomBytes(16).toString('hex');
    existing.lastActive = Date.now();
    saveDB();
    res.json({ success: true, student: ownStudent(existing), studentKey: existing.key, isExisting: true });
    return;
  }

  if (!store.session.isOpen) {
    res.status(403).json({ error: 'عذراً، المختبر مغلق حالياً من قِبل المعلمة.', code: 'lab_closed' });
    return;
  }

  const studentId = newStudentId();
  const newStudent = normalizeStudent({
    id: studentId,
    key: crypto.randomBytes(16).toString('hex'),
    pinHash: hashPin(pin),
    fullName: cleanName,
    chemicalId: studentId,
    createdAt: Date.now(),
    status: 'pending',
    lastActive: Date.now(),
  });

  store.students[studentId] = newStudent;
  saveDB();
  res.json({ success: true, student: publicStudent(newStudent), studentKey: newStudent.key, isExisting: false });
});

// متابعة حالة الطالب (تُستدعى دورياً من الواجهة وتعمل كنبضة حضور)
app.get('/api/student/status/:id', (req: Request, res: Response): void => {
  const student = store.students[req.params.id];
  if (!student) {
    res.status(404).json({ error: 'لم يتم العثور على سجل هذا الصقر.', code: 'not_found' });
    return;
  }
  student.lastActive = Date.now();
  res.json({ student: publicStudent(student), sessionIsOpen: store.session.isOpen, announcement: store.session.announcement, elementsUnlocked: store.session.elementsUnlocked });
});

app.post('/api/student/heartbeat', (req: Request, res: Response): void => {
  const { id } = req.body || {};
  if (id && store.students[id]) {
    store.students[id].lastActive = Date.now();
    res.json({ ok: true });
    return;
  }
  res.status(404).json({ ok: false });
});

/**
 * حفظ دفتر الباحث: { studentId, studentKey, notebook, conclusions }
 * يُدمج مع المحفوظ: الحقل الفارغ لا يمسح ما كُتب من جهاز آخر، ويعود الدفتر المدمج للجهاز.
 * مسموح قبل اعتماد المعلمة أيضاً، فالدفتر ليس نقاطاً.
 */
app.post('/api/student/journal', (req: Request, res: Response): void => {
  const { studentId, studentKey } = req.body || {};
  const student = typeof studentId === 'string' ? store.students[studentId] : undefined;
  if (!student) {
    res.status(404).json({ error: 'الصقر غير موجود', code: 'not_found' });
    return;
  }
  if (!checkStudentKey(student, studentKey)) {
    res.status(403).json({ error: 'مفتاح الطالب غير صحيح', code: 'bad_key' });
    return;
  }
  student.journal = mergeJournal(student.journal, cleanJournal(req.body));
  student.lastActive = Date.now();
  saveDB();
  res.json({ ok: true, journal: student.journal });
});

/**
 * إرسال نتيجة مهمة: { studentId, studentKey, taskId, points, epoch }
 * - المهمة يجب أن تكون من جدول المحتوى، والنقاط بين 0 وأقصى نقاطها.
 * - أول محاولة فقط تُحتسب (كما في المختبر): الإرسال المكرر يُقبل ولا يغيّر شيئاً.
 */
app.post('/api/student/score', (req: Request, res: Response): void => {
  const { studentId, studentKey, taskId, points, epoch } = req.body || {};
  const student = typeof studentId === 'string' ? store.students[studentId] : undefined;
  if (!student) {
    res.status(404).json({ error: 'الصقر غير موجود', code: 'not_found' });
    return;
  }
  if (!checkStudentKey(student, studentKey)) {
    res.status(403).json({ error: 'مفتاح الطالب غير صحيح', code: 'bad_key' });
    return;
  }
  if (student.status !== 'approved') {
    res.status(403).json({ error: 'يجب موافقة المعلمة أولاً لاعتماد النقاط', code: 'not_approved', status: student.status });
    return;
  }
  if (typeof epoch === 'number' && epoch !== student.scoreEpoch) {
    res.status(409).json({ error: 'صفّرت المعلمة النقاط، لن تُحتسب هذه النتيجة القديمة', code: 'stale_epoch', student: publicStudent(student) });
    return;
  }

  if (!isTaskId(taskId)) {
    res.status(400).json({ error: 'معرّف المهمة غير معروف', code: 'unknown_task' });
    return;
  }
  if (typeof points !== 'number' || !Number.isInteger(points) || points < 0 || points > TASK_POINTS[taskId]) {
    res.status(400).json({ error: 'قيمة النقاط غير صالحة', code: 'invalid_points' });
    return;
  }
  if (student.tasks[taskId] === undefined) student.tasks[taskId] = points;

  recalcTotals(student);
  student.lastActive = Date.now();
  saveDB();
  res.json({ success: true, student: publicStudent(student) });
});

app.get('/api/leaderboard', (_req: Request, res: Response) => {
  const now = Date.now();
  const list = Object.values(store.students)
    .filter(s => s.status === 'approved')
    .sort((a, b) => (b.totalPoints - a.totalPoints) || (Object.keys(b.tasks).length - Object.keys(a.tasks).length))
    .map(s => ({
      id: s.id,
      fullName: s.fullName,
      chemicalId: s.chemicalId || s.id,
      falconTitle: s.falconTitle,
      labPoints: s.labPoints,
      totalPoints: s.totalPoints,
      summary: progressSummary(s),
      isOnline: isOnline(s, now),
    }));
  res.json({ leaderboard: list });
});

// =================== TEACHER ENDPOINTS ===================

app.post('/api/teacher/login', (req: Request, res: Response): void => {
  if (!TEACHER_CODE) {
    res.status(503).json({ error: 'لم يُضبط رمز المعلمة على الخادم (TEACHER_CODE). راجعي ملف README.', code: 'not_configured' });
    return;
  }
  const clientKey = getClientKey(req);
  const blockedMs = isLoginBlocked(clientKey);
  if (blockedMs > 0) {
    res.setHeader('Retry-After', String(Math.ceil(blockedMs / 1000)));
    res.status(429).json({ error: `محاولات كثيرة خاطئة. حاولي بعد ${Math.ceil(blockedMs / 60000)} دقيقة.`, code: 'rate_limited' });
    return;
  }
  if (!isTeacherCodeValid(req.body?.code)) {
    recordLoginFailure(clientKey);
    res.status(401).json({ error: 'رمز الدخول غير صحيح', code: 'bad_code' });
    return;
  }
  loginFailures.delete(clientKey);
  cleanupExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  teacherTokens.set(token, expiresAt);
  res.json({ success: true, token, expiresAt, teacherName: store.session.teacherName });
});

app.post('/api/teacher/logout', (req: Request, res: Response) => {
  const token = readBearer(req);
  if (token) teacherTokens.delete(token);
  res.json({ success: true });
});

app.get('/api/teacher/students', requireTeacher, (_req: Request, res: Response) => {
  const now = Date.now();
  const enhanced = Object.values(store.students)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(s => {
      const { tasks: _t, ...pub } = publicStudent(s);
      return { ...pub, isOnline: isOnline(s, now) };
    });
  res.json({
    students: enhanced,
    session: store.session,
    counts: {
      total: enhanced.length,
      pending: enhanced.filter(s => s.status === 'pending').length,
      approved: enhanced.filter(s => s.status === 'approved').length,
      online: enhanced.filter(s => s.isOnline).length,
    },
  });
});

function findStudentOr404(req: Request, res: Response): StudentRecord | null {
  const { studentId } = req.body || {};
  const s = typeof studentId === 'string' ? store.students[studentId] : undefined;
  if (!s) {
    res.status(404).json({ error: 'الصقر غير موجود' });
    return null;
  }
  return s;
}

app.post('/api/teacher/approve', requireTeacher, (req: Request, res: Response): void => {
  const s = findStudentOr404(req, res);
  if (!s) return;
  s.status = 'approved';
  s.rejectionReason = undefined;
  saveDB();
  res.json({ success: true, student: publicStudent(s) });
});

app.post('/api/teacher/approve-all', requireTeacher, (_req: Request, res: Response) => {
  let count = 0;
  for (const s of Object.values(store.students)) {
    if (s.status === 'pending') {
      s.status = 'approved';
      count++;
    }
  }
  saveDB();
  res.json({ success: true, count });
});

app.post('/api/teacher/reject', requireTeacher, (req: Request, res: Response): void => {
  const s = findStudentOr404(req, res);
  if (!s) return;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 200) : '';
  s.status = 'rejected';
  s.rejectionReason = reason || 'يرجى مراجعة المعلمة وإعادة إدخال الاسم الثلاثي بدقة.';
  saveDB();
  res.json({ success: true, student: publicStudent(s) });
});

// المعلمة تعيد تعيين الرقم السري لطالب نسيه: يُولَّد رقم جديد من 4 أرقام ويظهر لها مرة واحدة
app.post('/api/teacher/reset-pin', requireTeacher, (req: Request, res: Response): void => {
  const s = findStudentOr404(req, res);
  if (!s) return;
  const pin = String(crypto.randomInt(0, 10000)).padStart(4, '0');
  s.pinHash = hashPin(pin);
  pinFailures.delete(s.fullName.replace(/\s+/g, ' ').toLowerCase());
  saveDB();
  res.json({ success: true, pin });
});

app.post('/api/teacher/session', requireTeacher, (req: Request, res: Response) => {
  const { isOpen, announcement, elementsUnlocked } = req.body || {};
  if (typeof isOpen === 'boolean') store.session.isOpen = isOpen;
  if (typeof elementsUnlocked === 'boolean') store.session.elementsUnlocked = elementsUnlocked;
  if (typeof announcement === 'string') store.session.announcement = announcement.trim().slice(0, 500);
  saveDB();
  res.json({ success: true, session: store.session });
});

app.post('/api/teacher/delete-student', requireTeacher, (req: Request, res: Response): void => {
  const s = findStudentOr404(req, res);
  if (!s) return;
  backupDB('before-delete');
  delete store.students[s.id];
  saveDB();
  res.json({ success: true });
});

app.post('/api/teacher/reset-scores', requireTeacher, (_req: Request, res: Response) => {
  backupDB('before-reset');
  for (const s of Object.values(store.students)) {
    s.tasks = {};
    s.scoreEpoch = (s.scoreEpoch || 0) + 1;
    recalcTotals(s);
  }
  saveDB();
  res.json({ success: true });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' });
});

// =================== FRONTEND SERVING ===================

async function startServer() {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT, 'dist');
    const MIME: Record<string, string> = {
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.json': 'application/json; charset=utf-8',
      '.woff': 'font/woff',
    };
    // نرسل النسخة المضغوطة مسبقاً (brotli ثم gzip) إن كان المتصفح يدعمها — توفير كبير على الشبكات الضعيفة
    app.use((req: Request, res: Response, next: NextFunction) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api/')) return next();
      let rel: string;
      try {
        rel = decodeURIComponent(req.path);
      } catch {
        return next();
      }
      if (rel === '/' || !path.extname(rel)) rel = '/index.html'; // مسارات الواجهة تعيد index.html
      const file = path.join(distPath, rel);
      if (!file.startsWith(distPath + path.sep)) return next();
      const type = MIME[path.extname(file)];
      if (!type) return next();
      const accept = String(req.headers['accept-encoding'] || '');
      for (const [enc, suffix] of [['br', '.br'], ['gzip', '.gz']] as const) {
        if (accept.includes(enc) && fs.existsSync(file + suffix)) {
          res.setHeader('Content-Encoding', enc);
          res.setHeader('Content-Type', type);
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Cache-Control', rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
          res.sendFile(file + suffix);
          return;
        }
      }
      next();
    });
    app.use(express.static(distPath, {
      setHeaders(res, filePath) {
        // الملفات ذات الأسماء المجزّأة تُخزَّن طويلاً، أما index.html فلا
        if (filePath.includes(`${path.sep}assets${path.sep}`) && /-[\w-]{8,}\.(js|css|woff2?|webp|png|svg)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!TEACHER_CODE) {
    console.warn('⚠️  TEACHER_CODE غير مضبوط: دخول لوحة المعلمة معطّل. أضيفيه إلى .env.local ثم أعيدي التشغيل.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧪 مختبر الأسئلة شغال على http://localhost:${PORT} (${IS_PRODUCTION ? 'إنتاج' : 'تطوير'})`);
  });
}

startServer();


