/**
 * تقدّم الطالب ونقاطه في «مختبر حفظ الكتلة».
 * النقاط تُسجَّل في نظام مهام المنصة نفسه (ms.<مهمة>)، فتُرسل للخادم عبر الطابور وتدخل لوحة الشرف
 * ومجموع الطالب، وتُحفظ مع تقدّمه على كل أجهزته. كل مهمة تُحتسب مرة واحدة فقط.
 * أسماء القسمين ونتيجة آخر مباراة تُحفظ على الجهاز فقط (ليست نقاطًا).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../../utils/storage';
import { MASS_BONUS, MASS_STATION_TASKS, MASS_TASK_MAX, massTaskId } from '../../content/massTasks';
import { useLab } from '../../engine/shared';
import { STATION_IDS, type StationId } from './data';

export const OK_POINTS = 10;
export const FIRST_TRY_BONUS = 5;
export const STATION_BONUS = MASS_BONUS;

/** المهام التي تُكمل كل محطة (المحلية، بلا البادئة ms.). */
export const STATION_TASKS: Record<StationId, string[]> = {
  wheel: [...MASS_STATION_TASKS.wheel],
  falcon: [...MASS_STATION_TASKS.falcon],
  link: [...MASS_STATION_TASKS.link],
  academy: [...MASS_STATION_TASKS.academy],
  stadium: [],
};

export interface Award { pts: number; ok: boolean }
export interface MatchResult { a: string; b: string; ga: number; gb: number }
export interface MassState { awards: Record<string, Award>; match: MatchResult | null }

const BONUS_ID = (s: StationId) => `bonus.${s}`;
const ALL_LOCAL = [...Object.values(STATION_TASKS).flat(), ...STATION_IDS.map(BONUS_ID)];

export const matchKey = (scope: string) => `shhd_mass_v1:${scope}`;

function cleanMatch(raw: unknown): MatchResult | null {
  const m = (raw && typeof raw === 'object' ? raw : null) as Partial<MatchResult> | null;
  if (!m || typeof m.a !== 'string' || typeof m.b !== 'string') return null;
  const g = (n: unknown) => Math.max(0, Math.min(8, Number(n) | 0));
  return { a: m.a.slice(0, 30), b: m.b.slice(0, 30), ga: g(m.ga), gb: g(m.gb) };
}

export function pointsFor(ok: boolean, firstTry: boolean) {
  return ok ? OK_POINTS + (firstTry ? FIRST_TRY_BONUS : 0) : 0;
}

export function stationProgress(state: MassState, id: StationId) {
  if (id === 'stadium') {
    const done = Boolean(state.awards[BONUS_ID('stadium')]);
    return { done: done ? 1 : 0, total: 1, complete: done };
  }
  const tasks = STATION_TASKS[id];
  const done = tasks.filter(t => state.awards[t]).length;
  return { done, total: tasks.length, complete: done === tasks.length };
}

export function summarize(state: MassState) {
  const stations = STATION_IDS.map(id => ({ id, ...stationProgress(state, id) }));
  const completeN = stations.filter(s => s.complete).length;
  const entries = Object.entries(state.awards);
  return {
    stations,
    completeN,
    allDone: completeN === STATION_IDS.length,
    points: entries.reduce((a, [, x]) => a + x.pts, 0),
    correct: entries.filter(([id, x]) => x.ok && !id.startsWith('bonus.')).length,
  };
}

export function useMassState(scope: string) {
  const { tasks, award: awardTask } = useLab();
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const key = matchKey(scope);
  const [match, setMatchState] = useState<MatchResult | null>(() => cleanMatch(readJSON<{ match?: unknown }>(key, {}).match));

  // نقاط من النسخة السابقة المحفوظة على الجهاز فقط تُنقل مرة واحدة إلى نظام المهام
  useEffect(() => {
    const old = readJSON<{ awards?: Record<string, { pts?: number }> }>(key, {});
    // مباراة سابقة محفوظة على الجهاز تعني أن محطة الملعب أُنجزت
    const sFull = massTaskId(BONUS_ID('stadium'));
    if (cleanMatch((old as { match?: unknown }).match) && tasksRef.current[sFull] === undefined) {
      tasksRef.current = { ...tasksRef.current, [sFull]: STATION_BONUS };
      awardTask(sFull, STATION_BONUS);
    }
    if (!old.awards) return;
    for (const [id, a] of Object.entries(old.awards)) {
      if (!ALL_LOCAL.includes(id) || tasksRef.current[massTaskId(id)] !== undefined) continue;
      const pts = Math.max(0, Math.min(MASS_TASK_MAX, Math.floor(Number(a?.pts) || 0)));
      tasksRef.current = { ...tasksRef.current, [massTaskId(id)]: pts };
      awardTask(massTaskId(id), pts);
    }
    writeJSON(key, { match: cleanMatch(readJSON<{ match?: unknown }>(key, {}).match) });
  }, [key, awardTask]);

  const state: MassState = useMemo(() => {
    const awards: Record<string, Award> = {};
    for (const id of ALL_LOCAL) {
      const v = tasks[massTaskId(id)];
      if (v !== undefined) awards[id] = { pts: v, ok: v > 0 };
    }
    return { awards, match };
  }, [tasks, match]);

  /** يسجّل نتيجة مهمة مرة واحدة؛ يعيد السجل (القديم إن وُجد). */
  const award = useCallback((id: string, ok: boolean, firstTry: boolean): Award => {
    const full = massTaskId(id);
    const existing = tasksRef.current[full];
    if (existing !== undefined) return { pts: existing, ok: existing > 0 };
    if (!ALL_LOCAL.includes(id)) return { ok: false, pts: 0 };
    const pts = awardTask(full, pointsFor(ok, firstTry));
    tasksRef.current = { ...tasksRef.current, [full]: pts };
    return { pts, ok: pts > 0 };
  }, [awardTask]);

  const setMatch = useCallback((m: MatchResult) => {
    setMatchState(m);
    writeJSON(key, { match: m });
    const full = massTaskId(BONUS_ID('stadium'));
    if (tasksRef.current[full] === undefined) {
      awardTask(full, STATION_BONUS);
      tasksRef.current = { ...tasksRef.current, [full]: STATION_BONUS };
    }
  }, [key, awardTask]);

  const summary = useMemo(() => summarize(state), [state]);

  // مكافأة إكمال كل محطة (مرة واحدة)
  useEffect(() => {
    for (const s of summary.stations) {
      if (s.id === 'stadium' || !s.complete) continue;
      const full = massTaskId(BONUS_ID(s.id));
      if (tasksRef.current[full] === undefined) {
        awardTask(full, STATION_BONUS);
        tasksRef.current = { ...tasksRef.current, [full]: STATION_BONUS };
      }
    }
  }, [summary, awardTask]);

  return { state, summary, award, setMatch };
}

export type MassApi = ReturnType<typeof useMassState>;
