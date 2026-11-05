/**
 * أدوات مشتركة لمحرّك الأنشطة: الصور، النص المنسّق، الخلط، والسياق.
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Variant } from './texts';

/** مسار صورة من محتوى v5 (sm = نسخة مصغّرة للبطاقات والشريط). */
export function img(key: string, size: 'full' | 'sm' = 'full') {
  return `/assets/v5/${key}${size === 'sm' ? '-sm' : ''}.webp`;
}

/** خلط Fisher–Yates. */
export function shuffle<T>(a: readonly T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** ترتيب عشوائي ثابت طوال عمر المكوّن. */
export function useShuffled<T>(a: readonly T[], keep = false): T[] {
  const [s] = useState(() => (keep ? [...a] : shuffle(a)));
  return s;
}

/** ترتيب عشوائي لفهارس مصفوفة (0..n-1). */
export function useOrder(n: number, keep = false): number[] {
  return useShuffled(useMemo(() => Array.from({ length: n }, (_, i) => i), [n]), keep);
}

/**
 * نص المحتوى قد يحوي <br> و <b> فقط؛ نعرضهما دون innerHTML.
 */
export const Rich: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(<br\s*\/?>|<\/?b>)/g);
  const out: React.ReactNode[] = [];
  let bold = false;
  parts.forEach((p, i) => {
    if (/^<br/.test(p)) out.push(<br key={i} />);
    else if (p === '<b>') bold = true;
    else if (p === '</b>') bold = false;
    else if (p) out.push(bold ? <b key={i}>{p}</b> : <React.Fragment key={i}>{p}</React.Fragment>);
  });
  return <>{out}</>;
};

/** واجهة كل نشاط: يُبلغ عن كل محاولة خاطئة، وعن الحل مع «هل خُصمت النقاط؟». */
export interface QProps<T> {
  item: T;
  variant: Variant;
  /** النشاط مقفل (انتهى الوقت أو حُلّ). */
  locked: boolean;
  /** محاولة خاطئة: رسالة التغذية الراجعة. */
  onWrong: (message: string) => void;
  /** إشارة نجاح جزئي/كامل للوحات اللعب (سلسلة، غرق). */
  onHit?: () => void;
  /** حُلّ النشاط؛ penalized=true يعني دون نقاط. */
  onSolved: (penalized: boolean) => void;
}

// ---------------- سياق التقدّم ----------------

export type NoteKind = 'p' | 'o' | 'c';

export interface LabRuntime {
  /** نقاط المهام المسجّلة (وجود المفتاح = حاول الطالب، حتى لو 0). */
  tasks: Record<string, number>;
  /** يسجّل نقاط مهمة مرة واحدة فقط؛ يعيد النقاط الممنوحة فعلاً. */
  award: (taskId: string, points: number) => number;
  /** يضيف سطراً لدفتر الباحث: توقعاتي / ملاحظاتي / استنتاجاتي. */
  note: (lab: string, kind: NoteKind, line: string) => void;
  /** استنتاج تجربة يظهر في تقرير الإنجاز. */
  conclude: (lab: string, tag: string, sum: string) => void;
}

export const LabContext = createContext<LabRuntime>({
  tasks: {},
  award: () => 0,
  note: () => {},
  conclude: () => {},
});

export const useLab = () => useContext(LabContext);

/** صندوق التغذية الراجعة: نجاح أو خطأ مع شرح. */
export const Feedback: React.FC<{ tone: 'ok' | 'no' | 'info'; title?: string; children?: React.ReactNode }> = ({ tone, title, children }) => {
  const cls = tone === 'ok'
    ? 'border-emerald-500/40 bg-emerald-500/10'
    : tone === 'no' ? 'border-rose-500/40 bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/5';
  const titleCls = tone === 'ok' ? 'text-emerald-400' : tone === 'no' ? 'text-rose-400' : 'text-amber-300';
  return (
    <div role={tone === 'no' ? 'alert' : 'status'} className={`mt-3 rounded-2xl border p-3.5 animate-in ${cls}`}>
      {title && <p className={`font-display text-[15px] ${titleCls}`}>{tone === 'ok' ? '✓ ' : tone === 'no' ? '✗ ' : ''}{title}</p>}
      {children && <div className="mt-1 text-[14px] leading-relaxed text-slate-300">{children}</div>}
    </div>
  );
};

/** زر خيار موحّد لكل الأنشطة. */
export const Option: React.FC<React.ComponentProps<'button'> & { state?: 'idle' | 'right' | 'wrong' | 'selected' }> = ({ state = 'idle', className = '', children, ...rest }) => {
  const cls = {
    idle: 'border-slate-700 bg-slate-900/60 hover:border-amber-400/60 hover:bg-amber-500/5',
    selected: 'border-amber-400 bg-amber-500/15',
    right: 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
    wrong: 'border-rose-500/60 bg-rose-500/10 text-rose-300 line-through decoration-rose-400/60',
  }[state];
  return (
    <button
      type="button"
      {...rest}
      className={`w-full text-right rounded-2xl border px-4 py-3 text-[15px] leading-relaxed text-slate-100 transition-colors disabled:cursor-default ${cls} ${className}`}
    >
      {children}
    </button>
  );
};

/** شريط المؤقت (ينكمش خلال tm ثانية). */
export const TimerBar: React.FC<{ seconds: number; paused?: boolean }> = ({ seconds, paused }) => (
  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3" role="timer" aria-label={`مؤقت ${seconds} ثانية`}>
    <div className="h-full bg-amber-400 timer-shrink" style={{ animationDuration: `${seconds}s`, animationPlayState: paused ? 'paused' : 'running' }} />
  </div>
);
