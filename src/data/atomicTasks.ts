/**
 * قائمة مهام مختبر الذرة المسموح بها ونقاط كل مهمة.
 * يستخدمها الخادم للتحقق من النقاط، وتستخدمها الواجهة لحساب المجموع.
 * الجدول في atomicTaskPoints.ts، واختبار tests/content.test.ts يتأكد أنه يطابق المحتوى.
 */
import { ATOMIC_TASK_POINTS_TABLE } from './atomicTaskPoints';

export const SILICON_GAME_IDS = ['falcon', 'cipher', 'flasks', 'furnace', 'detective', 'rescue'] as const;
export type SiliconGameId = typeof SILICON_GAME_IDS[number];

/** أعلى نتيجة ممكنة لكل لعبة سيليكون (حد أمان للتحقق في الخادم). */
export const SILICON_MAX_SCORE = 100;

export const ATOMIC_TASK_POINTS: Readonly<Record<string, number>> = ATOMIC_TASK_POINTS_TABLE;

export function isSiliconGameId(id: unknown): id is SiliconGameId {
  return typeof id === 'string' && (SILICON_GAME_IDS as readonly string[]).includes(id);
}

export function isAtomicTaskId(id: unknown): id is string {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(ATOMIC_TASK_POINTS, id);
}

export function sumAtomicPoints(taskIds: readonly string[]): number {
  let total = 0;
  for (const id of new Set(taskIds)) {
    if (isAtomicTaskId(id)) total += ATOMIC_TASK_POINTS[id];
  }
  return total;
}
