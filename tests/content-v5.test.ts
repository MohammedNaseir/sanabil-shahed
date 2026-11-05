/**
 * مطابقة المحتوى مع lab_shahd_v5.html: الأرقام هنا مأخوذة من تشغيل v5 نفسه
 * (عدد الأنشطة والنقاط لكل بوابة، وشكل كل محطة). إن تغيّر المحتوى بالخطأ يفشل الاختبار.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ATOM_GATES } from '../src/content/atom';
import { ELEMENT_LABS } from '../src/content/elements';
import { TASK_POINTS, LAB_MAX } from '../src/content/tasks';
import { buildTaskTable, stationTasks } from '../src/content/buildTasks';
import type { Item } from '../src/content/types';

test('بوابات الذرة الست: العدد والنقاط كما في v5', () => {
  assert.deepEqual(ATOM_GATES.map(g => g.n), [
    'رحلة الذرة عبر الزمن', 'مختبر فكّر واستنتج', 'مختبر فسّر', 'مختبر اكتشف الخطأ', 'مختبر ماذا لو؟', 'مختبر التحقيق النهائي',
  ]);
  assert.deepEqual(ATOM_GATES.map(g => g.items.length), [8, 7, 7, 7, 6, 8]);
  assert.deepEqual(ATOM_GATES.map(g => g.items.reduce((a, x) => a + (x.p ?? 1), 0)), [10, 11, 14, 14, 6, 15]);
  assert.deepEqual(ATOM_GATES.map(g => g.game ?? null), [null, null, null, 'sink', 'streak', 'case']);
});

test('مختبرات العناصر: سبع محطات لكل عنصر بالترتيب نفسه', () => {
  const shape = ELEMENT_LABS.map(L => [L.id, L.stations.map(s => `${s.id}:${s.kind}`)]);
  assert.deepEqual(shape, [
    ['ca', ['c2:sim', 'c4:elec', 'g1:quiz', 'g2:quiz', 'g3:quiz', 'g4:arcade', 'g5:arcade']],
    ['su', ['s1:micro', 's6:sim', 'g1:quiz', 'g2:quiz', 'g3:quiz', 'g4:arcade', 'g5:arcade']],
    ['si', ['i3:sim', 'i4:sim', 'g1:quiz', 'g2:quiz', 'g3:quiz', 'g4:arcade', 'g5:arcade']],
  ]);
  const counts = ELEMENT_LABS.map(L => L.stations.map(s => stationTasks(L.id, s).length));
  assert.deepEqual(counts, [[2, 2, 1, 3, 2, 7, 6], [3, 2, 1, 3, 2, 6, 6], [2, 2, 1, 3, 2, 6, 6]]);
  assert.deepEqual(LAB_MAX, { at: 70, ca: 33, su: 33, si: 32 });
  assert.equal(Object.keys(TASK_POINTS).length, 132);
});

test('جدول المهام الخفيف (taskTable.ts) يطابق المحتوى', () => {
  assert.deepEqual({ ...TASK_POINTS }, buildTaskTable(), 'شغّلي: npx tsx scripts/v5/4-generate-task-table.ts');
});

test('كل نشاط صالح: الإجابة موجودة والصور الموجودة فعلاً', () => {
  const imgDir = path.resolve(import.meta.dirname, '../public/assets/v5');
  const imgs = new Set(fs.readdirSync(imgDir).map(f => f.replace('.webp', '')));
  const check = (it: Item, where: string) => {
    for (const k of ['m', 'fi', 'av'] as const) if (it[k]) assert.ok(imgs.has(it[k]!), `${where}: صورة مفقودة ${it[k]}`);
    if (it.sci?.portrait) assert.ok(imgs.has(it.sci.portrait), `${where}: صورة العالم`);
    if (it.t === 'mcq' || it.t === 'balloon') assert.ok(it.o.length >= 2, where);
    if (it.t === 'mcq') assert.ok(it.a >= 0 && it.a < it.o.length, where);
    if (it.t === 'fill') for (const a of it.ans) assert.ok(it.chips.includes(a), `${where}: ${a} ليس من الخيارات`);
    if (it.t === 'rep') for (const b of it.bad) assert.ok(b < it.s.length, where);
    if (it.t === 'whoami') assert.ok(it.clues.length >= 2, where);
  };
  ATOM_GATES.forEach(g => g.items.forEach((it, j) => check(it, `at.${g.index}.${j}`)));
  for (const L of ELEMENT_LABS) {
    assert.ok(imgs.has(L.gate) && imgs.has(L.bg), `${L.id}: صورة البوابة`);
    for (const s of L.stations) {
      const items: Item[] = s.kind === 'quiz' ? s.items : s.kind === 'arcade' ? s.arcade.items
        : s.kind === 'sim' ? s.sim.post : s.kind === 'elec' ? s.elec.post : [s.micro.intro, ...s.micro.post];
      items.forEach((it, j) => check(it, `${L.id}.${s.id}.${j}`));
    }
  }
});
