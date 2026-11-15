/**
 * مهام «مختبر حفظ الكتلة» ونقاطها (للخادم والعميل معاً، دون محتوى الأسئلة).
 * المعرّف الكامل يبدأ بـ ms. ثم المعرّف المحلي: ms.wheel.3 ، ms.academy.eq ، ms.bonus.link …
 *   مهمة صحيحة: 10 نقاط +5 للمحاولة الأولى = 15 كحد أقصى. مكافأة إكمال المحطة: 20.
 */
export const MASS_TASK_MAX = 15;
export const MASS_BONUS = 20;

export const MASS_STATION_TASKS = {
  wheel: Array.from({ length: 10 }, (_, i) => `wheel.${i}`),
  falcon: ['falcon.0', 'falcon.1'],
  link: ['link.0', 'link.1', 'link.2'],
  academy: ['academy.eq', 'academy.bal', 'academy.c0', 'academy.c1'],
  stadium: [] as string[],
} as const;

export type MassStationKey = keyof typeof MASS_STATION_TASKS;
export const MASS_STATION_KEYS = Object.keys(MASS_STATION_TASKS) as MassStationKey[];

export const massTaskId = (local: string) => `ms.${local}`;

/** كل مهام المختبر: المعرّف الكامل ← أعلى نقاط. */
export function massTaskTable(): Record<string, number> {
  const t: Record<string, number> = {};
  for (const ids of Object.values(MASS_STATION_TASKS)) for (const id of ids) t[massTaskId(id)] = MASS_TASK_MAX;
  for (const k of MASS_STATION_KEYS) t[massTaskId(`bonus.${k}`)] = MASS_BONUS;
  return t;
}
