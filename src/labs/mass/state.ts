/**
 * تقدّم الطالب ونقاطه في «مختبر حفظ الكتلة».
 * كل مهمة تُسجَّل مرة واحدة فقط (معرّف ثابت)، والمجموع يُحسب منها، فلا يتكرر احتساب النقاط عند التحديث.
 * يُحفظ على الجهاز مرتبطًا بهوية الطالب (أو guest)، ونقاطه مستقلة عن نقاط مختبرات المراجعة.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, safeRemove, writeJSON } from '../../utils/storage';
import { STATION_IDS, type StationId } from './data';

export const OK_POINTS = 10;
export const FIRST_TRY_BONUS = 5;
export const STATION_BONUS = 20;

/** المهام التي تُكمل كل محطة. */
export const STATION_TASKS: Record<StationId, string[]> = {
  wheel: Array.from({ length: 10 }, (_, i) => `wheel.${i}`),
  falcon: ['falcon.0', 'falcon.1'],
  link: ['link.0', 'link.1', 'link.2'],
  academy: ['academy.eq', 'academy.bal', 'academy.c0', 'academy.c1'],
  stadium: [],
};

export interface Award { pts: number; ok: boolean }
export interface MatchResult { a: string; b: string; ga: number; gb: number }
export interface MassState { v: 1; awards: Record<string, Award>; match: MatchResult | null }

const EMPTY: MassState = { v: 1, awards: {}, match: null };
const ALL_TASKS = new Set(Object.values(STATION_TASKS).flat());

export const keyFor = (scope: string) => `shhd_mass_v1:${scope}`;

function clean(raw: unknown): MassState {
  const out: MassState = { v: 1, awards: {}, match: null };
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<MassState>;
  for (const [id, a] of Object.entries(r.awards ?? {})) {
    if (!ALL_TASKS.has(id) || !a || typeof a !== 'object') continue;
    const ok = Boolean((a as Award).ok);
    const max = OK_POINTS + FIRST_TRY_BONUS;
    const pts = ok ? Math.max(0, Math.min(max, Math.floor(Number((a as Award).pts) || 0))) : 0;
    out.awards[id] = { ok, pts };
  }
  const m = r.match as Partial<MatchResult> | null | undefined;
  if (m && typeof m.a === 'string' && typeof m.b === 'string') {
    out.match = { a: m.a.slice(0, 30), b: m.b.slice(0, 30), ga: Math.max(0, Math.min(8, Number(m.ga) | 0)), gb: Math.max(0, Math.min(8, Number(m.gb) | 0)) };
  }
  return out;
}

export function pointsFor(ok: boolean, firstTry: boolean) {
  return ok ? OK_POINTS + (firstTry ? FIRST_TRY_BONUS : 0) : 0;
}

export function stationProgress(state: MassState, id: StationId) {
  const tasks = STATION_TASKS[id];
  if (id === 'stadium') return { done: state.match ? 1 : 0, total: 1, complete: Boolean(state.match) };
  const done = tasks.filter(t => state.awards[t]).length;
  return { done, total: tasks.length, complete: done === tasks.length };
}

export function summarize(state: MassState) {
  const stations = STATION_IDS.map(id => ({ id, ...stationProgress(state, id) }));
  const completeN = stations.filter(s => s.complete).length;
  const taskPts = Object.values(state.awards).reduce((a, x) => a + x.pts, 0);
  return {
    stations,
    completeN,
    allDone: completeN === STATION_IDS.length,
    points: taskPts + completeN * STATION_BONUS,
    correct: Object.values(state.awards).filter(a => a.ok).length,
  };
}

export function useMassState(scope: string) {
  const key = keyFor(scope);
  const [state, setState] = useState<MassState>(() => clean(readJSON<unknown>(key, EMPTY)));
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => { writeJSON(key, state); }, [key, state]);

  /** يسجّل نتيجة مهمة مرة واحدة؛ يعيد السجل (القديم إن وُجد). */
  const award = useCallback((id: string, ok: boolean, firstTry: boolean): Award => {
    const existing = ref.current.awards[id];
    if (existing || !ALL_TASKS.has(id)) return existing ?? { ok: false, pts: 0 };
    const a: Award = { ok, pts: pointsFor(ok, firstTry) };
    ref.current = { ...ref.current, awards: { ...ref.current.awards, [id]: a } };
    setState(ref.current);
    return a;
  }, []);

  const setMatch = useCallback((m: MatchResult) => {
    ref.current = { ...ref.current, match: m };
    setState(ref.current);
  }, []);

  const reset = useCallback(() => {
    safeRemove(key);
    ref.current = { ...EMPTY, awards: {} };
    setState(ref.current);
  }, [key]);

  const summary = useMemo(() => summarize(state), [state]);

  return { state, summary, award, setMatch, reset };
}

export type MassApi = ReturnType<typeof useMassState>;
