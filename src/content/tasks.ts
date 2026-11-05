/**
 * جدول المهام والنقاط (خفيف، بدون المحتوى الكامل) ودوال التقدّم.
 * الجدول مولَّد من المحتوى في taskTable.ts، واختبار tests/content-v5.test.ts يتأكد من تطابقهما.
 *
 * صيغة المعرّفات:
 *   at.<بوابة>.<نشاط>          أنشطة مختبر الذرة
 *   <مختبر>.<محطة>.<رقم>       أسئلة محطات العناصر (ca / su / si)
 *   su.s1m.<رقم>               أسئلة ما بعد شريحة المجهر
 *   <مختبر>.<محطة>.done        علامة إنجاز محطة عنصر (0 نقاط)
 */
import { TASK_TABLE } from './taskTable';

export const LAB_IDS = ['at', 'ca', 'su', 'si'] as const;
export type LabId = typeof LAB_IDS[number];
export type ElementLabId = Exclude<LabId, 'at'>;

/** كل المهام المعروفة ونقاطها القصوى. */
export const TASK_POINTS: Readonly<Record<string, number>> = TASK_TABLE;

export function atomItemId(gate: number, j: number) {
  return `at.${gate}.${j}`;
}

export function stationDoneId(lab: string, station: string) {
  return `${lab}.${station}.done`;
}

export function isTaskId(id: unknown): id is string {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(TASK_POINTS, id);
}

export function labOfTask(id: string): LabId | null {
  const p = id.split('.')[0];
  return (LAB_IDS as readonly string[]).includes(p) ? (p as LabId) : null;
}

const IDS = Object.keys(TASK_POINTS);
const ATOM_GATE_IDS: string[][] = [];
for (const id of IDS) {
  const m = /^at\.(\d+)\.\d+$/.exec(id);
  if (m) (ATOM_GATE_IDS[+m[1]] ||= []).push(id);
}
const STATION_DONE: Record<ElementLabId, string[]> = { ca: [], su: [], si: [] };
for (const id of IDS) {
  const m = /^(ca|su|si)\.[^.]+\.done$/.exec(id);
  if (m) STATION_DONE[m[1] as ElementLabId].push(id);
}

/** أعلى مجموع ممكن لكل مختبر. */
export const LAB_MAX: Record<LabId, number> = (() => {
  const m = { at: 0, ca: 0, su: 0, si: 0 } as Record<LabId, number>;
  for (const [id, pts] of Object.entries(TASK_POINTS)) {
    const lab = labOfTask(id);
    if (lab) m[lab] += pts;
  }
  return m;
})();

export const ATOM_TASK_COUNT = ATOM_GATE_IDS.reduce((a, g) => a + g.length, 0);
export const ELEMENT_STATION_COUNT = STATION_DONE.ca.length + STATION_DONE.su.length + STATION_DONE.si.length;

/** يجمع النقاط المكتسبة لكل مختبر من سجل المهام. */
export function labTotals(tasks: Record<string, number>) {
  const t = { at: 0, ca: 0, su: 0, si: 0 } as Record<LabId, number>;
  for (const [id, pts] of Object.entries(tasks)) {
    const lab = labOfTask(id);
    if (lab && isTaskId(id)) t[lab] += Math.max(0, Math.min(TASK_POINTS[id], Number(pts) || 0));
  }
  return { ...t, total: t.at + t.ca + t.su + t.si };
}

/** أنجز الطالب بوابة الذرة إذا جرّب كل أنشطتها. */
export function atomGateDone(tasks: Record<string, number>, gate: number) {
  const ids = ATOM_GATE_IDS[gate];
  return Boolean(ids) && ids.every(id => tasks[id] !== undefined);
}

export const ATOM_GATES_COUNT = ATOM_GATE_IDS.length;

/** التحدي الختامي لمختبر الذرة (البوابة الأخيرة) يفتح مختبر العناصر. */
export function atomFinalDone(tasks: Record<string, number>) {
  return atomGateDone(tasks, ATOM_GATE_IDS.length - 1);
}

export function elementLabDone(tasks: Record<string, number>, lab: ElementLabId) {
  return STATION_DONE[lab].every(id => tasks[id] !== undefined);
}

export function elementStationsDone(tasks: Record<string, number>, lab?: ElementLabId) {
  const labs: ElementLabId[] = lab ? [lab] : ['ca', 'su', 'si'];
  return labs.reduce((a, l) => a + STATION_DONE[l].filter(id => tasks[id] !== undefined).length, 0);
}

export function allElementsDone(tasks: Record<string, number>) {
  return (['ca', 'su', 'si'] as const).every(l => elementLabDone(tasks, l));
}

/** الألقاب حسب مجموع النقاط (كما في v5). */
export function rankTitle(total: number) {
  return total >= 150 ? 'صقر الكيمياء' : total >= 100 ? 'كيميائي ماهر' : total >= 50 ? 'باحث متقدّم' : total >= 15 ? 'باحث' : 'متدرّب';
}

export const LAB_NAMES: Record<LabId, string> = {
  at: 'مختبر الذرة',
  ca: 'مختبر الكالسيوم',
  su: 'مختبر الكبريت',
  si: 'مختبر السيليكون',
};
