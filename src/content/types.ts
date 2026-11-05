/**
 * أنواع محتوى المختبر (منقولة من محرّك lab_shahd_v5.html).
 * كل نشاط له نوع t وحقول تخصّه، وحقول مشتركة: p نقاط، m صورة، e شرح، h تلميح، tm مؤقت بالثواني.
 */

interface ItemBase {
  /** نقاط النشاط (المحاولة الأولى الصحيحة فقط). */
  p?: number;
  /** مفتاح صورة جانبية من public/assets/v5. */
  m?: string;
  /** صورة تظهر مع الشرح بعد الإجابة. */
  fi?: string;
  /** صورة مصغرة في شريط الخطوات. */
  av?: string;
  /** عنوان قصير في شريط الخطوات. */
  tag?: string;
  /** الشرح العلمي بعد الإجابة. */
  e: string;
  /** تلميح عند الخطأ. */
  h?: string;
  /** رسالة بديلة عند الخطأ. */
  wm?: string;
  /** مؤقت بالثواني. */
  tm?: number;
  /** نص فكرة اللعبة الخاص بهذا النشاط. */
  how?: string;
  /** سطر معلومة أعلى السؤال. */
  hdr?: string;
  cs?: string;
  /** بطاقة العالِم في «رحلة الذرة عبر الزمن». */
  sci?: { name: string; period?: string; key?: string; portrait?: string };
}

export interface McqItem extends ItemBase { t: 'mcq'; q: string; o: string[]; a: number; fixed?: number }
export interface OrderItem extends ItemBase { t: 'ord'; q: string; o: string[] }
export interface MatchItem extends ItemBase { t: 'mat'; q: string; o: [string, string][] }
export interface ErrorItem extends ItemBase { t: 'err'; s: string[]; f: string[] }
export interface FillItem extends ItemBase { t: 'fill'; q: string; tpl: string; ans: string[]; chips: string[]; skin?: 'vault' }
export interface ReportItem extends ItemBase { t: 'rep'; title: string; s: string[]; bad: number[]; q?: string }
export interface RelayItem extends ItemBase { t: 'relay'; q: string; o: string[] }
export interface MemoItem extends ItemBase { t: 'memo'; q: string; o: [string, string][] }
export interface LinkItem extends ItemBase { t: 'link'; q: string; o: [string, string][] }
export interface BalloonItem extends ItemBase { t: 'balloon'; q: string; o: string[] }
export interface WhoAmIItem extends ItemBase { t: 'whoami'; q: string; clues: string[]; o: string[] }

export type Item =
  | McqItem | OrderItem | MatchItem | ErrorItem | FillItem | ReportItem
  | RelayItem | MemoItem | LinkItem | BalloonItem | WhoAmIItem;

export type ItemType = Item['t'];

// ---------------- مختبر الذرة ----------------

export interface AtomGate {
  index: number;
  n: string;
  q: string;
  ex: string;
  img: string;
  /** لوحة اللعب: الغرق، سلسلة التوقعات، لوحة الأدلة. */
  game?: 'sink' | 'streak' | 'case';
  items: Item[];
}

// ---------------- مختبر العناصر ----------------

/** خيار خطوة تجربة: [النص، صحيح؟، تلميح الخطأ، تغييرات المشهد عند الخطأ] */
export type SimOption = [string, number, string?, Record<string, unknown>?];

export interface SimStep {
  say: string;
  o: SimOption[];
  set: Record<string, unknown>;
  obs: string;
}

export interface Prediction {
  q: string;
  o: string[];
  a?: number;
}

export interface SimDef {
  lab: string;
  tag: string;
  intro: string;
  pre: Prediction;
  init: Record<string, unknown>;
  scene: 'vessel' | 'stube' | 'semis' | 'furn';
  steps: SimStep[];
  post: Item[];
  sum: string;
}

export interface ElecDef {
  lab: string;
  tag: string;
  intro: string;
  pre: Prediction;
  post: Item[];
  sum: string;
}

export interface MicroDef {
  img: string;
  intro: McqItem;
  introFeedback: string;
  task: string;
  forms: { img: string; d: string }[];
  post: Item[];
  sum: string;
}

export interface ArcadeDef {
  tm: number;
  theme: 'rocket' | 'flask' | 'volcano';
  lives: number;
  items: McqItem[];
}

interface StationBase {
  id: string;
  n: string;
  mode: string;
  how: string;
}

export type ElementStation =
  | (StationBase & { kind: 'sim'; sim: SimDef })
  | (StationBase & { kind: 'elec'; elec: ElecDef })
  | (StationBase & { kind: 'micro'; micro: MicroDef })
  | (StationBase & { kind: 'quiz'; items: Item[] })
  | (StationBase & { kind: 'arcade'; arcade: ArcadeDef });

export interface ElementLab {
  id: 'ca' | 'su' | 'si';
  n: string;
  mission: string;
  q: string;
  ex: string;
  /** اللقب عند إنجاز المختبر كاملاً. */
  title: string;
  gate: string;
  bg: string;
  stations: ElementStation[];
}
