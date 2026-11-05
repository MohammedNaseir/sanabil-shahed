/**
 * يبني جدول المهام من المحتوى الكامل. يُستخدم في توليد taskTable.ts وفي الاختبارات فقط،
 * حتى لا يدخل المحتوى الكامل في تحميل الصفحة الأولى.
 */
import { ATOM_GATES } from './atom';
import { ELEMENT_LABS } from './elements';
import type { ElementStation, Item } from './types';

const itemPoints = (it: Item) => it.p ?? 1;

/** مهام محطة عنصر: [المعرّف، النقاط] */
export function stationTasks(labId: string, s: ElementStation): [string, number][] {
  const pre = `${labId}.${s.id}`;
  switch (s.kind) {
    case 'quiz':
      return s.items.map((it, k) => [`${pre}.${k}`, itemPoints(it)]);
    case 'arcade':
      return s.arcade.items.map((_, k) => [`${pre}.${k}`, 1]);
    case 'sim':
      return s.sim.post.map((it, k) => [`${pre}.${k}`, itemPoints(it)]);
    case 'elec':
      return s.elec.post.map((it, k) => [`${pre}.${k}`, itemPoints(it)]);
    case 'micro':
      return [[`${pre}.0`, 1], ...s.micro.post.map((it, k): [string, number] => [`${labId}.s1m.${k}`, itemPoints(it)])];
  }
}

export function buildTaskTable(): Record<string, number> {
  const table: Record<string, number> = {};
  ATOM_GATES.forEach(g => g.items.forEach((it, j) => { table[`at.${g.index}.${j}`] = it.p ?? 1; }));
  for (const L of ELEMENT_LABS) {
    for (const s of L.stations) {
      for (const [id, pts] of stationTasks(L.id, s)) table[id] = pts;
      table[`${L.id}.${s.id}.done`] = 0;
    }
  }
  return table;
}
