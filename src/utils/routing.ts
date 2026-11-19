/**
 * التنقّل عبر عنوان الصفحة (hash) حتى يعمل زر الرجوع في المتصفح والجوال،
 * ويمكن مشاركة رابط مباشر لبوابة أو مختبر، ويستعيد التحديث الشاشة نفسها.
 *
 * الصيغ:
 *   #/                  شاشة الاستقبال
 *   #/labs              اختيار القسم (مختبرات الأسئلة أو مختبرات المراجعة)
 *   #/questions         قسم مختبرات الأسئلة
 *   #/review            قسم مختبرات المراجعة (الذرة والعناصر)
 *   #/atom              مختبر الذرة
 *   #/atom/1 … #/atom/6 بوابة من بوابات الذرة
 *   #/elements          مختبر العناصر
 *   #/elements/ca|su|si مختبر الكالسيوم أو الكبريت أو السيليكون
 *   #/finale            شاشة الإنجاز الختامية
 *   #/mass              مختبر حفظ الكتلة (شاشة الدخول)
 *   #/mass/hub          الشاشة الرئيسية للمختبر
 *   #/mass/wheel|falcon|link|academy|stadium   إحدى المحطات الخمس
 *   #/mass/finale       شاشة ختام المختبر
 *   #/ratio             مختبر النسب الثابتة (شاشة الترحيب)
 *   #/ratio/map         خريطة المحطات الخمس
 *   #/ratio/wheel|who|teach|vault|match   إحدى المحطات
 *   #/ratio/finale      شاشة ختام المختبر
 */

export const ELEMENT_IDS = ['ca', 'su', 'si'] as const;
export type ElementId = typeof ELEMENT_IDS[number];
export const ATOM_GATE_COUNT = 6;

export const MASS_STAGES = ['intro', 'hub', 'wheel', 'falcon', 'link', 'academy', 'stadium', 'finale'] as const;
export type MassStage = typeof MASS_STAGES[number];

export const RATIO_STAGES = ['welcome', 'map', 'wheel', 'who', 'teach', 'vault', 'match', 'finale'] as const;
export type RatioStage = typeof RATIO_STAGES[number];

export type ViewName = 'reception' | 'lab_selection' | 'questions' | 'review' | 'atom_hub' | 'atom_gate' | 'elements_hub' | 'element_lab' | 'finale' | 'mass' | 'ratio';

export interface Route {
  view: ViewName;
  /** رقم البوابة (0..5). */
  gate: number | null;
  lab: ElementId | null;
  /** شاشة مختبر حفظ الكتلة (تظهر في مسار mass فقط). */
  stage?: MassStage;
  /** شاشة مختبر النسب الثابتة (تظهر في مسار ratio فقط). */
  rstage?: RatioStage;
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
    case 'questions':
      return second ? bad(r('questions')) : ok(r('questions'));
    case 'review':
      return second ? bad(r('review')) : ok(r('review'));
    case 'finale':
      return second ? bad(r('finale')) : ok(r('finale'));
    case 'ratio': {
      const ratio = (rstage: RatioStage): Route => ({ view: 'ratio', gate: null, lab: null, rstage });
      if (!second) return ok(ratio('welcome'));
      if ((RATIO_STAGES as readonly string[]).includes(second) && second !== 'welcome') return ok(ratio(second as RatioStage));
      return bad(ratio('welcome'));
    }
    case 'mass': {
      const mass = (stage: MassStage): Route => ({ view: 'mass', gate: null, lab: null, stage });
      if (!second) return ok(mass('intro'));
      if ((MASS_STAGES as readonly string[]).includes(second) && second !== 'intro') return ok(mass(second as MassStage));
      return bad(mass('intro'));
    }
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
    case 'questions': return '#/questions';
    case 'review': return '#/review';
    case 'finale': return '#/finale';
    case 'atom_hub': return '#/atom';
    case 'atom_gate': return route.gate != null ? `#/atom/${route.gate + 1}` : '#/atom';
    case 'elements_hub': return '#/elements';
    case 'element_lab': return route.lab ? `#/elements/${route.lab}` : '#/elements';
    case 'ratio': return !route.rstage || route.rstage === 'welcome' ? '#/ratio' : `#/ratio/${route.rstage}`;
    case 'mass': return !route.stage || route.stage === 'intro' ? '#/mass' : `#/mass/${route.stage}`;
  }
}

export function sameRoute(a: Route, b: Route) {
  return a.view === b.view && a.gate === b.gate && a.lab === b.lab && a.stage === b.stage && a.rstage === b.rstage;
}
