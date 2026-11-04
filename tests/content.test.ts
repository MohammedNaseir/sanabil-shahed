/**
 * يتأكد أن جدول نقاط مختبر الذرة الخفيف يطابق المحتوى التعليمي الكامل.
 * إذا أضفتِ سؤالاً أو مهمة في atomicLabContent.ts ولم تحدّثي atomicTaskPoints.ts يفشل هذا الاختبار.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCIENTISTS_TIMELINE, EXPLAIN_CHALLENGES, ERROR_DETECTIVE_CASES, WHAT_IF_SCENARIOS, FINAL_EXAM_QUESTIONS,
} from '../src/data/atomicLabContent';
import { ATOMIC_TASK_POINTS_TABLE } from '../src/data/atomicTaskPoints';

test('جدول نقاط الذرة يطابق المحتوى', () => {
  const expected: Record<string, number> = {};
  for (const s of SCIENTISTS_TIMELINE) {
    expected[`quiz_${s.id}`] = s.quiz.points;
    expected[`match_${s.id}`] = 2;
  }
  expected.timeline_order_complete = 3;
  for (const id of ['deduction_straight', 'deduction_mass', 'deduction_negative', 'deduction_universal', 'scientific_method_mastered']) expected[id] = 2;
  for (const c of EXPLAIN_CHALLENGES) expected[`explain_${c.id}`] = c.points;
  for (const c of ERROR_DETECTIVE_CASES) expected[`error_${c.id}`] = 2;
  for (const s of WHAT_IF_SCENARIOS) expected[`whatif_${s.id}`] = 2;
  for (const q of FINAL_EXAM_QUESTIONS) expected[`final_${q.id}`] = q.points;
  assert.deepEqual({ ...ATOMIC_TASK_POINTS_TABLE }, expected);
});
