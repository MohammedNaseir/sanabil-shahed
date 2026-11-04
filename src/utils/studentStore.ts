/**
 * حفظ هوية الطالب وتقدّمه على الجهاز.
 * التقدّم مخزّن لكل هوية على حدة (أو guest للزائر) حتى لا يختلط طالبان على جهاز واحد.
 */
import type { DeductionRecord, Student } from '../types';
import { readJSON, safeGet, safeRemove, safeSet, writeJSON } from './storage';
import { isAtomicTaskId, isSiliconGameId } from '../data/atomicTasks';

const STUDENT_KEY = 'shhd_student_session';
const STUDENT_SECRET_KEY = 'shhd_student_key';
const PROGRESS_PREFIX = 'shhd_progress_v1:';
const LEGACY_MIGRATED_KEY = 'shhd_legacy_progress_migrated';

export const GUEST_SCOPE = 'guest';

export interface Progress {
  siliconScores: Record<string, number>;
  completedGames: string[];
  solvedTasks: string[];
  deductions: DeductionRecord[];
  /** رقم آخر تصفير معروف من المعلمة. */
  epoch: number;
}

export const DEFAULT_DEDUCTIONS: DeductionRecord[] = [
  {
    id: 'init_1',
    title: 'المنهج العلمي في الكيمياء',
    text: 'تبدأ المعرفة العلمية بالملاحظة وتدوين البيانات، وتستمر عبر صياغة القوانين والفرضيات حتى تصبح نظريات راسخة.',
    date: 'اليوم الأول',
  },
];

export function emptyProgress(): Progress {
  return { siliconScores: {}, completedGames: [], solvedTasks: [], deductions: [...DEFAULT_DEDUCTIONS], epoch: 0 };
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
    scores: {},
    completedGames: [],
    totalPoints: 0,
    lastActive: Date.now(),
    isLocal: true,
  };
}

// ---------- التقدّم ----------

function sanitize(p: Partial<Progress> | null | undefined): Progress {
  const base = emptyProgress();
  if (!p) return base;
  const scores: Record<string, number> = {};
  for (const [k, v] of Object.entries(p.siliconScores || {})) {
    const n = Number(v);
    if (isSiliconGameId(k) && Number.isFinite(n) && n > 0) scores[k] = Math.floor(n);
  }
  return {
    siliconScores: scores,
    completedGames: Array.from(new Set((p.completedGames || []).filter(isSiliconGameId))),
    solvedTasks: Array.from(new Set((p.solvedTasks || []).filter(t => typeof t === 'string'))),
    deductions: Array.isArray(p.deductions) ? p.deductions : base.deductions,
    epoch: Number(p.epoch) || 0,
  };
}

export function loadProgress(scope: string): Progress {
  const stored = readJSON<Partial<Progress> | null>(PROGRESS_PREFIX + scope, null);
  if (stored) return sanitize(stored);
  return migrateLegacy(scope);
}

export function saveProgress(scope: string, p: Progress) {
  writeJSON(PROGRESS_PREFIX + scope, p);
}

export function removeProgress(scope: string) {
  safeRemove(PROGRESS_PREFIX + scope);
}

/**
 * يحمّل التقدّم من مفاتيح النسخة القديمة (المشتركة على مستوى الجهاز) مرة واحدة فقط،
 * ولا يحذف المفاتيح القديمة.
 */
function migrateLegacy(scope: string): Progress {
  if (safeGet(LEGACY_MIGRATED_KEY)) return emptyProgress();
  const legacy = sanitize({
    siliconScores: readJSON<Record<string, number>>('shhd_silicon_scores', {}),
    completedGames: readJSON<string[]>('shhd_completed_silicon_games', []),
    solvedTasks: readJSON<string[]>('atomic_solved_tasks', []),
    deductions: readJSON<DeductionRecord[] | undefined>('atomic_student_deductions', undefined),
  });
  safeSet(LEGACY_MIGRATED_KEY, String(Date.now()));
  saveProgress(scope, legacy);
  return legacy;
}

/** يدمج تقدّماً في آخر (أعلى نتيجة لكل لعبة واتحاد المهام). */
export function mergeProgress(into: Progress, from: Progress): Progress {
  const siliconScores = { ...into.siliconScores };
  for (const [k, v] of Object.entries(from.siliconScores)) siliconScores[k] = Math.max(siliconScores[k] || 0, v);
  const seenDeductions = new Set(into.deductions.map(d => d.id));
  return {
    siliconScores,
    completedGames: Array.from(new Set([...into.completedGames, ...from.completedGames])),
    solvedTasks: Array.from(new Set([...into.solvedTasks, ...from.solvedTasks])),
    deductions: [...into.deductions, ...from.deductions.filter(d => !seenDeductions.has(d.id))],
    epoch: Math.max(into.epoch, from.epoch),
  };
}

/**
 * يحدّث التقدّم المحلي بما يعرفه الخادم.
 * إذا صفّرت المعلمة النقاط (epoch أكبر) تُمسح النقاط المحلية القديمة أولاً.
 */
export function applyServerStudent(p: Progress, s: Student): { progress: Progress; wasReset: boolean } {
  const serverEpoch = Number(s.scoreEpoch) || 0;
  let base = p;
  let wasReset = false;
  if (serverEpoch > p.epoch) {
    wasReset = p.completedGames.length > 0 || p.solvedTasks.length > 0;
    base = { ...p, siliconScores: {}, completedGames: [], solvedTasks: [], epoch: serverEpoch };
  }
  const serverScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.scores || {})) if (isSiliconGameId(k) && v > 0) serverScores[k] = v;
  const merged = mergeProgress(base, {
    siliconScores: serverScores,
    completedGames: s.completedGames || [],
    solvedTasks: (s.atomicTasks || []).filter(isAtomicTaskId),
    deductions: [],
    epoch: serverEpoch,
  });
  return { progress: merged, wasReset };
}
