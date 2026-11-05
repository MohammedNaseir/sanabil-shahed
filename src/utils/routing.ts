/**
 * التنقّل عبر عنوان الصفحة (hash) حتى يعمل زر الرجوع في المتصفح والجوال،
 * ويمكن مشاركة رابط مباشر لبوابة أو مختبر، ويستعيد التحديث الشاشة نفسها.
 *
 * الصيغ:
 *   #/                  شاشة الاستقبال
 *   #/labs              اختيار المختبر
 *   #/atom              مختبر الذرة
 *   #/atom/1 … #/atom/6 بوابة من بوابات الذرة
 *   #/elements          مختبر العناصر
 *   #/elements/ca|su|si مختبر الكالسيوم أو الكبريت أو السيليكون
 *   #/finale            شاشة الإنجاز الختامية
 */

export const ELEMENT_IDS = ['ca', 'su', 'si'] as const;
export type ElementId = typeof ELEMENT_IDS[number];
export const ATOM_GATE_COUNT = 6;

export type ViewName = 'reception' | 'lab_selection' | 'atom_hub' | 'atom_gate' | 'elements_hub' | 'element_lab' | 'finale';

export interface Route {
  view: ViewName;
  /** رقم البوابة (0..5). */
  gate: number | null;
  lab: ElementId | null;
}

export const HOME_ROUTE: Route = { view: 'reception', gate: null, lab: null };
const r = (view: ViewName, gate: number | null = null, lab: ElementId | null = null): Route => ({ view, gate, lab });

export function parseHash(hash: string): { route: Route; valid: boolean } {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const [first = '', second, ...rest] = clean.split('/').map(p => decodeURIComponent(p));
  const ok = (route: Route) => ({ route, valid: rest.length === 0 });
  const bad = (route: Route) => ({ route, valid: false });

  switch (first) {
    case '':
      return ok(HOME_ROUTE);
    case 'labs':
      return second ? bad(r('lab_selection')) : ok(r('lab_selection'));
    case 'finale':
      return second ? bad(r('finale')) : ok(r('finale'));
    case 'atom': {
      if (!second) return ok(r('atom_hub'));
      const n = Number(second);
      if (Number.isInteger(n) && n >= 1 && n <= ATOM_GATE_COUNT) return ok(r('atom_gate', n - 1));
      return bad(r('atom_hub'));
    }
    case 'elements':
      if (!second) return ok(r('elements_hub'));
      if ((ELEMENT_IDS as readonly string[]).includes(second)) return ok(r('element_lab', null, second as ElementId));
      return bad(r('elements_hub'));
    default:
      return bad(HOME_ROUTE);
  }
}

export function formatHash(route: Route): string {
  switch (route.view) {
    case 'reception': return '#/';
    case 'lab_selection': return '#/labs';
    case 'finale': return '#/finale';
    case 'atom_hub': return '#/atom';
    case 'atom_gate': return route.gate != null ? `#/atom/${route.gate + 1}` : '#/atom';
    case 'elements_hub': return '#/elements';
    case 'element_lab': return route.lab ? `#/elements/${route.lab}` : '#/elements';
  }
}

export function sameRoute(a: Route, b: Route) {
  return a.view === b.view && a.gate === b.gate && a.lab === b.lab;
}
