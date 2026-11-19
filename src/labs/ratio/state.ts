/**
 * تقدّم الطالب ونقاطه في «مختبر النسب الثابتة».
 * النقاط مهام rt.<مهمة> في نظام مهام المنصة: تُرسل للخادم وتدخل لوحة الشرف، وكل مهمة تُحتسب مرة واحدة.
 * أسماء الفريقين ونتيجة آخر مباراة تُحفظ على الجهاز فقط (ليست نقاطًا فردية).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../../utils/storage';
import { RATIO_BONUS, RATIO_STATION_TASKS, ratioTaskId } from '../../content/ratioTasks';
import { useLab } from '../../engine/shared';
import { STATION_IDS, type StationId } from './data';

export const OK_POINTS = 10;
export const CLEAN_BONUS = 5;
export const STATION_BONUS = RATIO_BONUS;

export const STATION_TASKS: Record<StationId, string[]> = {
  wheel: [...RATIO_STATION_TASKS.wheel],
  who: [...RATIO_STATION_TASKS.who],
  teach: [...RATIO_STATION_TASKS.teach],
  vault: [...RATIO_STATION_TASKS.vault],
  match: [],
};

export interface Award { pts: number; ok: boolean }
export interface MatchResult { a: string; b: string; ga: number; gb: number }
export interface RatioState { awards: Record<string, Award>; match: MatchResult | null }

const BONUS_ID = (s: StationId) => `bonus.${s}`;
const ALL_LOCAL = [...Object.values(STATION_TASKS).flat(), ...STATION_IDS.map(BONUS_ID)];
const matchKey = (scope: string) => `shhd_ratio_v1:${scope}`;

function cleanMatch(raw: unknown): MatchResult | null {
  const m = (raw && typeof raw === 'object' ? raw : null) as Partial<MatchResult> | null;
  if (!m || typeof m.a !== 'string' || typeof m.b !== 'string') return null;
  const g = (n: unknown) => Math.max(0, Math.min(100, Number(n) | 0));
  return { a: m.a.slice(0, 30), b: m.b.slice(0, 30), ga: g(m.ga), gb: g(m.gb) };
}

/** صحيح = 10، و+5 إذا لم تُستخدم أخطاء أو تلميح؛ الخطأ = 0. */
export const pointsFor = (ok: boolean, clean: boolean) => (ok ? OK_POINTS + (clean ? CLEAN_BONUS : 0) : 0);

export function stationProgress(state: RatioState, id: StationId) {
  if (id === 'match') {
    const done = Boolean(state.awards[BONUS_ID('match')]);
    return { done: done ? 1 : 0, total: 1, complete: done };
  }
  const tasks = STATION_TASKS[id];
  const done = tasks.filter(t => state.awards[t]).length;
  return { done, total: tasks.length, complete: done === tasks.length };
}

export function summarize(state: RatioState) {
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

export function useRatioState(scope: string) {
  const { tasks, award: awardTask } = useLab();
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const key = matchKey(scope);
  const [match, setMatchState] = useState<MatchResult | null>(() => cleanMatch(readJSON<{ match?: unknown }>(key, {}).match));

  const state: RatioState = useMemo(() => {
    const awards: Record<string, Award> = {};
    for (const id of ALL_LOCAL) {
      const v = tasks[ratioTaskId(id)];
      if (v !== undefined) awards[id] = { pts: v, ok: v > 0 };
    }
    return { awards, match };
  }, [tasks, match]);

  const grant = useCallback((id: string, pts: number) => {
    const full = ratioTaskId(id);
    const granted = awardTask(full, pts);
    tasksRef.current = { ...tasksRef.current, [full]: granted };
    return granted;
  }, [awardTask]);

  /** يسجّل نتيجة مهمة مرة واحدة؛ يعيد السجل (القديم إن وُجد). */
  const award = useCallback((id: string, ok: boolean, clean: boolean): Award => {
    const existing = tasksRef.current[ratioTaskId(id)];
    if (existing !== undefined) return { pts: existing, ok: existing > 0 };
    if (!ALL_LOCAL.includes(id)) return { ok: false, pts: 0 };
    const pts = grant(id, pointsFor(ok, clean));
    return { pts, ok: pts > 0 };
  }, [grant]);

  const setMatch = useCallback((m: MatchResult) => {
    setMatchState(m);
    writeJSON(key, { match: m });
    if (tasksRef.current[ratioTaskId(BONUS_ID('match'))] === undefined) grant(BONUS_ID('match'), STATION_BONUS);
  }, [key, grant]);

  const summary = useMemo(() => summarize(state), [state]);

  // مكافأة إكمال كل محطة (مرة واحدة)
  useEffect(() => {
    for (const s of summary.stations) {
      if (s.id === 'match' || !s.complete) continue;
      if (tasksRef.current[ratioTaskId(BONUS_ID(s.id))] === undefined) grant(BONUS_ID(s.id), STATION_BONUS);
    }
  }, [summary, grant]);

  return { state, summary, award, setMatch };
}

export type RatioApi = ReturnType<typeof useRatioState>;
