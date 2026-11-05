/**
 * الأنشطة الإحدى عشرة — نفس قواعد lab_shahd_v5.html:
 * متى يُعدّ الحل «دون نقاط» (عدد الأخطاء المسموح)، ورسائل الخطأ، والتوقيت.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
  BalloonItem, ErrorItem, FillItem, Item, LinkItem, MatchItem, McqItem, MemoItem, OrderItem, RelayItem, ReportItem, WhoAmIItem,
} from '../content/types';
import { Option, QProps, Rich, shuffle, useOrder } from './shared';
import { useSafeTimeouts } from '../utils/draft';
import { sounds } from '../utils/audio';

const Q: React.FC<{ text: string }> = ({ text }) => (
  <h3 className="font-display text-lg sm:text-xl text-white leading-relaxed mb-3"><Rich text={text} /></h3>
);

// ---------------- اختيار من متعدد ----------------
export const Mcq: React.FC<QProps<McqItem> & { penaltyStart?: number }> = ({ item, variant, locked, onWrong, onHit, onSolved, penaltyStart = 0 }) => {
  const order = useOrder(item.o.length, Boolean(item.fixed));
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [right, setRight] = useState(false);
  const tries = useRef(penaltyStart);
  const pick = (k: number) => {
    if (locked || right || wrong.has(k)) return;
    if (k === item.a) {
      setRight(true);
      sounds.correct();
      onHit?.();
      onSolved(tries.current > 0);
    } else {
      tries.current++;
      sounds.wrong();
      setWrong(w => new Set(w).add(k));
      onWrong(item.wm || (variant === 'atom' ? item.e : item.h || 'تلميح: ' + item.e));
    }
  };
  const twoCol = item.fixed && item.o.length === 2;
  return (
    <div>
      {item.q && <Q text={item.q} />}
      <div className={twoCol ? 'grid grid-cols-2 gap-3' : 'grid gap-2'}>
        {order.map(k => (
          <Option
            key={k}
            onClick={() => pick(k)}
            disabled={locked || right || wrong.has(k)}
            state={right && k === item.a ? 'right' : wrong.has(k) ? 'wrong' : 'idle'}
            className={twoCol ? 'text-center text-xl py-4' : ''}
          >
            <Rich text={item.o[k]} />
          </Option>
        ))}
      </div>
    </div>
  );
};

// ---------------- صائد الأخطاء (مرحلتان) ----------------
export const ErrorHunt: React.FC<QProps<ErrorItem>> = props => {
  const { item, variant } = props;
  const [stage, setStage] = useState<{ n: 1 } | { n: 2; t: number }>({ n: 1 });
  if (stage.n === 1) {
    return (
      <Mcq
        {...props}
        item={{ t: 'mcq', q: 'إحدى العبارات الآتية تحتوي خطأً علميًا. حدّدها:', o: item.s, a: 0, e: '', wm: variant === 'atom' ? 'هذه العبارة سليمة علميًا. أعد القراءة بتمعّن.' : 'هذه العبارة تبدو سليمة علميًا. أعد القراءة بتمعّن.' }}
        onSolved={penalized => setStage({ n: 2, t: penalized ? 1 : 0 })}
      />
    );
  }
  return (
    <Mcq
      key="stage2"
      {...props}
      penaltyStart={stage.t}
      item={{ t: 'mcq', q: `«${item.s[0]}»<br>${variant === 'atom' ? 'اختر التصحيح العلمي المناسب لهذه العبارة:' : 'اختر التصحيح العلمي المناسب:'}`, o: item.f, a: 0, e: item.e }}
    />
  );
};

// ---------------- الترتيب ----------------
export const Order: React.FC<QProps<OrderItem>> = ({ item, variant, locked, onWrong, onSolved }) => {
  const [P] = useState(() => shuffle(item.o));
  const [seq, setSeq] = useState<number[]>([]);
  const tries = useRef(0);
  const later = useSafeTimeouts();
  const press = (i: number) => {
    if (locked) return;
    sounds.click();
    const next = [...seq, i];
    setSeq(next);
    if (next.length === P.length) {
      if (next.every((s, j) => P[s] === item.o[j])) onSolved(tries.current > 0);
      else {
        tries.current++;
        sounds.wrong();
        onWrong(variant === 'atom' ? item.e : item.h || 'الترتيب غير صحيح. فكّر في تسلسل الأحداث كما لاحظته في التجربة وأعد المحاولة.');
        later(() => setSeq([]), variant === 'atom' ? 1300 : 1400);
      }
    }
  };
  return (
    <div>
      <Q text={item.q} />
      <ol className="min-h-12 flex flex-wrap gap-2 mb-3 rounded-2xl border border-dashed border-slate-700 p-2.5">
        {seq.length === 0 && <li className="text-sm text-slate-500 self-center">اضغط العناصر بالترتيب الذي تراه صحيحًا</li>}
        {seq.map((s, j) => <li key={j} className="rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200">{j + 1}. {P[s]}</li>)}
      </ol>
      <div className="grid gap-2">
        {P.map((p, i) => !seq.includes(i) && <Option key={i} onClick={() => press(i)} disabled={locked}>{p}</Option>)}
      </div>
      <button type="button" onClick={() => !locked && setSeq([])} className="mt-3 h-9 px-4 rounded-full border hairline text-sm text-slate-300">إعادة الترتيب</button>
    </div>
  );
};

// ---------------- المطابقة (والربط بخطوط) ----------------
function usePairs(n: number) {
  const right = useOrder(n);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  return { right, sel, setSel, done, setDone };
}

export const Match: React.FC<QProps<MatchItem>> = ({ item, variant, locked, onWrong, onSolved }) => {
  const { right, sel, setSel, done, setDone } = usePairs(item.o.length);
  const tries = useRef(0);
  const [hint, setHint] = useState('');
  const pickRight = (r: number) => {
    if (locked || done.has(r)) return;
    if (sel == null) { setHint('اختر العنصر من العمود الأيمن أولًا.'); return; }
    setHint('');
    if (r === sel) {
      sounds.correct();
      const d = new Set(done).add(r);
      setDone(d);
      setSel(null);
      if (d.size === item.o.length) onSolved(tries.current > 0);
    } else {
      tries.current++;
      sounds.wrong();
      onWrong(variant === 'atom' ? 'هذه المطابقة غير صحيحة. ' + item.e : 'هذه المطابقة تحتاج إلى مراجعة. ارجع إلى ملاحظاتك في التجربة.');
    }
  };
  return (
    <div>
      <Q text={item.q} />
      {hint && <p className="text-sm text-amber-300 mb-2">{hint}</p>}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="grid gap-2 content-start">
          {item.o.map((p, i) => (
            <Option key={i} disabled={locked || done.has(i)} state={done.has(i) ? 'right' : sel === i ? 'selected' : 'idle'} onClick={() => { setSel(i); setHint(''); sounds.click(); }}>
              {p[0]}
            </Option>
          ))}
        </div>
        <div className="grid gap-2 content-start">
          {right.map(i => (
            <Option key={i} disabled={locked || done.has(i)} state={done.has(i) ? 'right' : 'idle'} onClick={() => pickRight(i)}>
              {item.o[i][1]}
            </Option>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LinkPairs: React.FC<QProps<LinkItem>> = ({ item, locked, onWrong, onHit, onSolved }) => {
  const { right, sel, setSel, done, setDone } = usePairs(item.o.length);
  const tries = useRef(0);
  const later = useSafeTimeouts();
  const wrap = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<{ a: number; b: number; bad?: boolean }[]>([]);
  const [hint, setHint] = useState('');
  const [, force] = useState(0);
  // نعيد رسم الخطوط عند تغيّر حجم الشاشة
  useEffect(() => {
    const on = () => force(n => n + 1);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useLayoutEffect(() => { force(n => n + 1); }, [lines.length]);

  const pickRight = (r: number) => {
    if (locked || done.has(r)) return;
    if (sel == null) { setHint('اختر العنصر من العمود الأيمن أولًا.'); return; }
    setHint('');
    if (r === sel) {
      sounds.correct();
      setLines(l => [...l, { a: sel, b: r }]);
      const d = new Set(done).add(r);
      setDone(d);
      setSel(null);
      if (d.size === item.o.length) onSolved(tries.current > 2);
    } else {
      tries.current++;
      sounds.wrong();
      const bad = { a: sel, b: r, bad: true };
      setLines(l => [...l, bad]);
      later(() => setLines(l => l.filter(x => x !== bad)), 600);
      onWrong('هذا السبب لا يناسب هذه الظاهرة. راجع العلاقة بين السبب والنتيجة.');
    }
  };

  const coords = (a: number, b: number) => {
    const w = wrap.current?.getBoundingClientRect();
    const x = leftRefs.current[a]?.getBoundingClientRect();
    const y = rightRefs.current[right.indexOf(b)]?.getBoundingClientRect();
    if (!w || !x || !y) return null;
    // RTL: العمود الأيمن (العناصر) على اليمين، والأسباب على اليسار
    return { x1: x.left - w.left, y1: x.top - w.top + x.height / 2, x2: y.right - w.left, y2: y.top - w.top + y.height / 2 };
  };

  return (
    <div>
      <Q text={item.q} />
      {hint && <p className="text-sm text-amber-300 mb-2">{hint}</p>}
      <div ref={wrap} className="relative grid grid-cols-[1fr_36px_1fr] sm:grid-cols-[1fr_72px_1fr]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
          {lines.map((l, i) => {
            const c = coords(l.a, l.b);
            return c && <line key={i} {...c} stroke={l.bad ? 'var(--color-rose-400)' : 'var(--color-amber-400)'} strokeWidth="3" strokeLinecap="round" />;
          })}
        </svg>
        <div className="grid gap-2 content-start">
          {item.o.map((p, i) => (
            <Option key={i} ref={el => { leftRefs.current[i] = el; }} disabled={locked || done.has(i)} state={done.has(i) ? 'right' : sel === i ? 'selected' : 'idle'} onClick={() => { setSel(i); setHint(''); sounds.click(); }}>
              {p[0]}
            </Option>
          ))}
        </div>
        <div />
        <div className="grid gap-2 content-start">
          {right.map((i, j) => (
            <Option key={i} ref={el => { rightRefs.current[j] = el; }} disabled={locked || done.has(i)} state={done.has(i) ? 'right' : 'idle'} onClick={() => pickRight(i)}>
              {item.o[i][1]}
            </Option>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- الإكمال (والخزنة) ----------------
export const Fill: React.FC<QProps<FillItem>> = ({ item, variant, locked, onWrong, onSolved }) => {
  const [C] = useState(() => shuffle(item.chips));
  const [seq, setSeq] = useState<number[]>([]);
  const tries = useRef(0);
  const later = useSafeTimeouts();
  const press = (i: number) => {
    if (locked) return;
    sounds.click();
    const next = [...seq, i];
    setSeq(next);
    if (next.length === item.ans.length) {
      if (next.every((s, j) => C[s] === item.ans[j])) onSolved(variant === 'atom' ? tries.current > 1 : tries.current > 0);
      else {
        tries.current++;
        sounds.wrong();
        onWrong(item.h || (variant === 'atom' ? 'ليست الإجابة الصحيحة بعد، فكّر في المعطيات وأعد المحاولة.' : 'راجع المتفاعلات والنواتج وتذكّر أن المعادلة يجب أن تكون موزونة.'));
        later(() => setSeq([]), variant === 'atom' ? 1200 : 1400);
      }
    }
  };
  let n = 0;
  const parts = item.tpl.split('___');
  const vault = item.skin === 'vault';
  return (
    <div>
      <Q text={item.q} />
      <div
        dir={vault || /[A-Za-z0-9→]/.test(item.tpl) ? 'ltr' : 'rtl'}
        className={`flex flex-wrap items-center justify-center gap-2 mb-4 rounded-2xl p-3 text-lg ${vault ? 'bg-slate-950 border-2 border-slate-600 font-mono text-2xl' : 'border border-dashed border-slate-700'}`}
      >
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {p && <span className="text-slate-200">{p}</span>}
            {i < parts.length - 1 && (
              <span className="inline-block min-w-14 text-center rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-amber-200">
                {seq[n] != null ? C[seq[n++]] : (n++, '؟')}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center" dir="ltr">
        {C.map((c, i) => !seq.includes(i) && (
          <button key={i} type="button" disabled={locked} onClick={() => press(i)} className="min-w-14 h-11 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:border-amber-400/60 text-slate-100 font-medium">
            {c}
          </button>
        ))}
      </div>
      <div className="text-center mt-3">
        <button type="button" onClick={() => !locked && setSeq([])} className="h-9 px-4 rounded-full border hairline text-sm text-slate-300">مسح</button>
      </div>
    </div>
  );
};

// ---------------- تقرير تحت التحقيق ----------------
export const Report: React.FC<QProps<ReportItem>> = ({ item, locked, onWrong, onHit, onSolved }) => {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState('');
  const tries = useRef(0);
  const toggle = (i: number) => {
    if (locked || solved) return;
    sounds.click();
    setHint('');
    setSel(s => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };
  const submit = () => {
    if (locked || solved) return;
    if (!sel.size) { setHint('حدّد العبارات التي تظن أنها خاطئة أولًا.'); return; }
    const ok = sel.size === item.bad.length && item.bad.every(i => sel.has(i));
    if (ok) {
      setSolved(true);
      sounds.correct();
      onHit?.();
      onSolved(tries.current > 0);
    } else {
      tries.current++;
      sounds.wrong();
      const w = [...sel].some(i => !item.bad.includes(i));
      onWrong(`عدد الأخطاء في التقرير ${item.bad.length}. ${w ? 'بعض العبارات التي حددتها سليمة علميًا، أعد فحص الأدلة.' : 'ما زال في التقرير خطأ لم تكتشفه.'}`);
    }
  };
  return (
    <div>
      <Q text={item.q || 'حدّد العبارات الخاطئة علميًا'} />
      <div className="rounded-2xl border hairline bg-slate-950/50 p-3 mb-3">
        <p className="font-display text-amber-300 mb-2">{item.title}</p>
        <div className="grid gap-2">
          {item.s.map((x, i) => (
            <Option key={i} onClick={() => toggle(i)} disabled={locked || solved} aria-pressed={sel.has(i)}
              state={solved && item.bad.includes(i) ? 'wrong' : sel.has(i) ? 'selected' : 'idle'}>
              {i + 1}. {x}
            </Option>
          ))}
        </div>
      </div>
      {hint && <p className="text-sm text-amber-300 mb-2">{hint}</p>}
      {!solved && <button type="button" onClick={submit} disabled={locked} className="h-11 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">سلّم التقرير</button>}
    </div>
  );
};

// ---------------- سباق التتابع ----------------
export const Relay: React.FC<QProps<RelayItem>> = ({ item, locked, onWrong, onSolved }) => {
  const order = useOrder(item.o.length);
  const [pos, setPos] = useState(0);
  const [lives, setLives] = useState(3);
  const tries = useRef(0);
  const press = (i: number) => {
    if (locked || pos >= item.o.length) return;
    if (i === pos) {
      sounds.correct();
      const p = pos + 1;
      setPos(p);
      if (p === item.o.length) onSolved(tries.current > 2);
    } else {
      tries.current++;
      sounds.wrong();
      if (lives - 1 <= 0) {
        setPos(0);
        setLives(3);
        onWrong('سقطت العصا! عُد إلى خط البداية وأعد الترتيب.');
      } else {
        setLives(lives - 1);
        onWrong('هذا ليس العالم التالي في الترتيب، فكّر في التسلسل الزمني.');
      }
    }
  };
  return (
    <div>
      <Q text={item.q} />
      <p className="text-sm text-amber-300 mb-2" aria-label={`فرص العصا: ${lives} من 3`}>فرص العصا: {'●'.repeat(lives)}{'○'.repeat(3 - lives)}</p>
      <div className="flex gap-1.5 rounded-2xl border hairline p-2 mb-3 overflow-x-auto">
        {item.o.map((x, i) => (
          <div key={i} className={`flex-1 min-w-[72px] min-h-14 rounded-xl border-2 flex items-center justify-center text-center text-[13px] p-1 transition-all ${i < pos ? 'border-amber-400 bg-amber-500/20 text-amber-100 relay-run' : 'border-dashed border-slate-700 text-slate-500'}`}>
            {i < pos ? x : `المحطة ${i + 1}`}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {order.map(i => i >= pos && <Option key={i} onClick={() => press(i)} disabled={locked}>{item.o[i]}</Option>)}
      </div>
    </div>
  );
};

// ---------------- الذاكرة ----------------
export const Memo: React.FC<QProps<MemoItem>> = ({ item, locked, onWrong, onSolved }) => {
  const n = item.o.length;
  const [cards] = useState(() => shuffle(item.o.flatMap((p, i) => [{ i, x: p[0] }, { i, x: p[1] }])));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [miss, setMiss] = useState(0);
  const lock = useRef(false);
  const later = useSafeTimeouts();
  const flip = (j: number) => {
    if (locked || lock.current || open.includes(j) || matched.has(cards[j].i)) return;
    sounds.click();
    const o = [...open, j];
    setOpen(o);
    if (o.length === 2) {
      const [a, b] = o;
      if (cards[a].i === cards[b].i) {
        sounds.correct();
        const m = new Set(matched).add(cards[a].i);
        setMatched(m);
        setOpen([]);
        if (m.size === n) onSolved(miss > n);
      } else {
        setMiss(x => x + 1);
        onWrong('');
        lock.current = true;
        later(() => { setOpen([]); lock.current = false; }, 900);
      }
    }
  };
  return (
    <div>
      <Q text={item.q} />
      <p className="text-sm text-amber-300 mb-2">المحاولات الخاطئة: <b>{miss}</b> — الأزواج: <b>{matched.size}</b> / {n}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {cards.map((c, j) => {
          const face = open.includes(j) || matched.has(c.i);
          return (
            <button
              key={j}
              type="button"
              onClick={() => flip(j)}
              aria-label={face ? c.x : 'بطاقة مقلوبة'}
              className={`h-20 rounded-2xl border-2 p-1.5 text-[13px] leading-snug transition-all ${matched.has(c.i) ? 'border-amber-300 bg-amber-400 text-slate-950 memo-pulse' : face ? 'border-slate-500 bg-slate-100 text-slate-950' : 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 font-display text-2xl'}`}
              style={face ? { backgroundColor: matched.has(c.i) ? undefined : 'var(--color-white)', color: 'var(--color-slate-950)' } : undefined}
            >
              {face ? c.x : '؟'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------------- البالونات ----------------
export const Balloon: React.FC<QProps<BalloonItem>> = ({ item, locked, onWrong, onSolved }) => {
  const order = useOrder(item.o.length);
  const n = order.length;
  const [round, setRound] = useState(0);
  const [disabled, setDisabled] = useState<Set<number>>(new Set());
  const [popped, setPopped] = useState(false);
  const tries = useRef(0);
  const later = useSafeTimeouts();
  const wrongRef = useRef(onWrong);
  wrongRef.current = onWrong;
  // البالونات تطير؛ إن طارت كلها نعيد الجولة
  useEffect(() => {
    if (popped || locked) return;
    const id = later(() => {
      tries.current++;
      wrongRef.current('طارت البالونات! حاول مرة أخرى.');
      setDisabled(new Set());
      setRound(r => r + 1);
    }, (15 + (n - 1) * 1.2 + n * 0.5 + 2) * 1000);
    return () => clearTimeout(id);
  }, [round, popped, locked, n, later]);

  const press = (k: number) => {
    if (locked || popped || disabled.has(k)) return;
    if (k === 0) {
      sounds.correct();
      setPopped(true);
      onSolved(tries.current > 1);
    } else {
      tries.current++;
      sounds.wrong();
      setDisabled(d => new Set(d).add(k));
      onWrong(item.h || 'هذا ليس التفسير الصحيح، جرّب بالونًا آخر.');
    }
  };
  return (
    <div>
      <Q text={item.q} />
      <div key={round} className="relative h-[min(46vh,320px)] overflow-hidden rounded-2xl border hairline bg-gradient-to-b from-sky-950 to-sky-800/60">
        {order.map((k, j) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            disabled={disabled.has(k)}
            className={`balloon absolute w-[min(30%,150px)] min-h-[84px] rounded-[50%_50%_46%_46%] border-2 border-white/70 px-2 py-2 text-[12px] leading-snug text-white ${popped && k === 0 ? 'balloon-pop' : ''} ${disabled.has(k) ? 'grayscale opacity-40' : ''}`}
            style={{ right: `${3 + j * (94 / n) * 0.75}%`, animationDuration: `${15 + j * 1.2}s`, animationDelay: `${(j * 0.5).toFixed(1)}s`, background: `hsl(${215 + j * 40} 55% 40%)` }}
          >
            {item.o[k]}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-slate-400 mt-2 text-center">فجّر البالون الذي يحمل التفسير الصحيح قبل أن يطير!</p>
    </div>
  );
};

// ---------------- من أنا؟ ----------------
export const WhoAmI: React.FC<QProps<WhoAmIItem>> = ({ item, locked, onWrong, onSolved }) => {
  const order = useOrder(item.o.length);
  const [shown, setShown] = useState(1);
  const [dis, setDis] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);
  const tries = useRef(0);
  const press = (k: number) => {
    if (locked || solved || dis.has(k)) return;
    if (k === 0) {
      sounds.correct();
      setSolved(true);
      setShown(item.clues.length);
      onSolved(tries.current > 1);
    } else {
      tries.current++;
      sounds.wrong();
      setDis(d => new Set(d).add(k));
      setShown(s => Math.min(item.clues.length, s + 1));
      onWrong('ليس هو! كُشف دليل جديد، تفحّصه جيدًا.');
    }
  };
  return (
    <div>
      <Q text={item.q} />
      <div className="grid gap-1.5 mb-3">
        {item.clues.slice(0, shown).map((c, i) => (
          <div key={i} className="border-s-4 border-amber-400 bg-amber-500/10 rounded-lg px-3 py-2 text-[14px] animate-in">دليل {i + 1}: {c}</div>
        ))}
        {shown < item.clues.length && <div className="border-s-4 border-slate-600 rounded-lg px-3 py-2 text-[14px] text-slate-500">دليل مخفي… يُكشف عند الخطأ</div>}
      </div>
      <div className="grid gap-2">
        {order.map(k => (
          <Option key={k} onClick={() => press(k)} disabled={locked || solved || dis.has(k)} state={solved && k === 0 ? 'right' : dis.has(k) ? 'wrong' : 'idle'}>
            {item.o[k]}
          </Option>
        ))}
      </div>
    </div>
  );
};

/** يعرض النشاط المناسب حسب نوعه. */
export const ItemBody: React.FC<QProps<Item>> = props => {
  const it = props.item;
  switch (it.t) {
    case 'mcq': return <Mcq {...props} item={it} />;
    case 'err': return <ErrorHunt {...props} item={it} />;
    case 'ord': return <Order {...props} item={it} />;
    case 'mat': return <Match {...props} item={it} />;
    case 'link': return <LinkPairs {...props} item={it} />;
    case 'fill': return <Fill {...props} item={it} />;
    case 'rep': return <Report {...props} item={it} />;
    case 'relay': return <Relay {...props} item={it} />;
    case 'memo': return <Memo {...props} item={it} />;
    case 'balloon': return <Balloon {...props} item={it} />;
    case 'whoami': return <WhoAmI {...props} item={it} />;
  }
};
