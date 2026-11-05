/**
 * حفظ هوية الطالب وتقدّمه على الجهاز.
 * التقدّم مخزّن لكل هوية على حدة (أو guest للزائر) حتى لا يختلط طالبان على جهاز واحد.
 */
import type { Student } from '../types';
import { readJSON, safeGet, safeRemove, safeSet, writeJSON } from './storage';
import { TASK_POINTS, isTaskId } from '../content/tasks';

const STUDENT_KEY = 'shhd_student_session';
const STUDENT_SECRET_KEY = 'shhd_student_key';
// النسخة 2: مختبر v5 (مهام بمعرّفات ثابتة). تقدّم النسخة السابقة لا يُنقل لأن المحتوى تغيّر.
const PROGRESS_PREFIX = 'shhd_progress_v2:';

export const GUEST_SCOPE = 'guest';

export interface NotebookPage {
  /** توقعاتي */
  p: string;
  /** ملاحظاتي */
  o: string;
  /** استنتاجاتي */
  c: string;
}

export interface Progress {
  /** نقاط كل مهمة (وجود المفتاح = حاول الطالب). */
  tasks: Record<string, number>;
  /** دفتر الباحث لكل مختبر (at / ca / su / si). */
  notebook: Record<string, NotebookPage>;
  /** استنتاجات التجارب لكل مختبر: الوسم ← الخلاصة. */
  conclusions: Record<string, Record<string, string>>;
  /** رقم آخر تصفير معروف من المعلمة. */
  epoch: number;
  /** رأى الطالب شاشة «فُتح مختبر العناصر». */
  unlockSeen?: boolean;
}

export function emptyProgress(): Progress {
  return { tasks: {}, notebook: {}, conclusions: {}, epoch: 0 };
}

// ---------- الهوية ----------

export function loadStudent(): Student | null {
  const s = readJSON<Student | null>(STUDENT_KEY, null);
  return s && typeof s.id === 'string' ? s : null;
}

export function saveStudent(student: Student | null) {
  if (student) writeJSON(STUDENT_KEY, student);
  else safeRemove(STUDENT_KEY);
}

export function loadStudentKey(): string | null {
  return safeGet(STUDENT_SECRET_KEY);
}

export function saveStudentKey(key: string | null) {
  if (key) safeSet(STUDENT_SECRET_KEY, key);
  else safeRemove(STUDENT_SECRET_KEY);
}

export function createLocalStudent(fullName: string): Student {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    id: `LOCAL-${rand}`,
    fullName,
    chemicalId: 'تدريب محلي',
    createdAt: Date.now(),
    status: 'pending',
    falconTitle: 'صقر كيميائي - باحث مختبر',
    affiliation: 'صقور أ. شهد في منصة سنابل',
    totalPoints: 0,
    lastActive: Date.now(),
    isLocal: true,
  };
}

// ---------- التقدّم ----------

export function cleanTasks(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (isTaskId(id) && Number.isFinite(n)) out[id] = Math.max(0, Math.min(TASK_POINTS[id], Math.floor(n)));
  }
  return out;
}

function sanitize(p: Partial<Progress> | null | undefined): Progress {
  if (!p) return emptyProgress();
  return {
    tasks: cleanTasks(p.tasks),
    notebook: p.notebook && typeof p.notebook === 'object' ? p.notebook : {},
    conclusions: p.conclusions && typeof p.conclusions === 'object' ? p.conclusions : {},
    epoch: Number(p.epoch) || 0,
    unlockSeen: Boolean(p.unlockSeen),
  };
}

export function loadProgress(scope: string): Progress {
  return sanitize(readJSON<Partial<Progress> | null>(PROGRESS_PREFIX + scope, null));
}

export function saveProgress(scope: string, p: Progress) {
  writeJSON(PROGRESS_PREFIX + scope, p);
}

export function removeProgress(scope: string) {
  safeRemove(PROGRESS_PREFIX + scope);
}

const longer = (a = '', b = '') => (b.length > a.length ? b : a);

/** يدمج تقدّماً في آخر: أول محاولة لكل مهمة تبقى كما هي، والدفتر يأخذ الأطول. */
export function mergeProgress(into: Progress, from: Progress): Progress {
  const tasks = { ...from.tasks, ...into.tasks };
  const notebook = { ...into.notebook };
  for (const [lab, page] of Object.entries(from.notebook)) {
    const cur = notebook[lab] || { p: '', o: '', c: '' };
    notebook[lab] = { p: longer(cur.p, page.p), o: longer(cur.o, page.o), c: longer(cur.c, page.c) };
  }
  const conclusions = { ...into.conclusions };
  for (const [lab, m] of Object.entries(from.conclusions)) conclusions[lab] = { ...m, ...(conclusions[lab] || {}) };
  return { tasks, notebook, conclusions, epoch: Math.max(into.epoch, from.epoch), unlockSeen: into.unlockSeen || from.unlockSeen };
}

/**
 * يحدّث التقدّم المحلي بما يعرفه الخادم.
 * إذا صفّرت المعلمة النقاط (epoch أكبر) تُمسح المهام المحلية القديمة أولاً.
 */
export function applyServerStudent(p: Progress, s: Student): { progress: Progress; wasReset: boolean } {
  const serverEpoch = Number(s.scoreEpoch) || 0;
  let base = p;
  let wasReset = false;
  if (serverEpoch > p.epoch) {
    wasReset = Object.keys(p.tasks).length > 0;
    base = { ...p, tasks: {}, epoch: serverEpoch, unlockSeen: false };
  }
  // المحلي أولاً: نتيجة أول محاولة على هذا الجهاز لا تتغير، ونضيف ما سجّله الخادم من أجهزة أخرى
  return { progress: { ...base, tasks: { ...cleanTasks(s.tasks), ...base.tasks } }, wasReset };
}
