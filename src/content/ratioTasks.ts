/**
 * مهام «مختبر النسب الثابتة» ونقاطها (للخادم والعميل معاً، دون محتوى الأسئلة).
 * المعرّف الكامل: rt.<مهمة> مثل rt.wheel.3 و rt.vault.0 و rt.bonus.match.
 *   مهمة صحيحة: 10 نقاط +5 بلا أخطاء أو تلميح = 15 كحد أقصى. مكافأة إكمال المحطة: 20.
 */
export const RATIO_TASK_MAX = 15;
export const RATIO_BONUS = 20;

export const RATIO_STATION_TASKS = {
  wheel: Array.from({ length: 10 }, (_, i) => `wheel.${i}`),
  who: ['who.0', 'who.1'],
  teach: ['teach.0', 'teach.1', 'teach.2', 'teach.3'],
  vault: ['vault.0', 'vault.1'],
  match: [] as string[],
} as const;

export type RatioStationKey = keyof typeof RATIO_STATION_TASKS;
export const RATIO_STATION_KEYS = Object.keys(RATIO_STATION_TASKS) as RatioStationKey[];

export const ratioTaskId = (local: string) => `rt.${local}`;

export function ratioTaskTable(): Record<string, number> {
  const t: Record<string, number> = {};
  for (const ids of Object.values(RATIO_STATION_TASKS)) for (const id of ids) t[ratioTaskId(id)] = RATIO_TASK_MAX;
  for (const k of RATIO_STATION_KEYS) t[ratioTaskId(`bonus.${k}`)] = RATIO_BONUS;
  return t;
}
