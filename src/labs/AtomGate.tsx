/**
 * بوابة من بوابات مختبر الذرة: مقدّمة ← أنشطة بالتتابع (مع شريط خطوات ولوحة لعب) ← ملخّص.
 */
import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ATOM_GATES } from '../content/atom';
import { atomItemId } from '../content/tasks';
import { ItemCard } from '../engine/ItemCard';
import { img, useLab } from '../engine/shared';
import type { AtomGate as Gate } from '../content/types';
import { sounds } from '../utils/audio';

// ---------------- لوحات اللعب ----------------

interface BoardState { depth: number; streak: number; best: number }

const SinkBoard: React.FC<{ depth: number }> = ({ depth }) => (
  <div className="rounded-2xl overflow-hidden border hairline mb-4" aria-label="عالِم في الماء">
    <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" className="block w-full h-32 sm:h-36 bg-gradient-to-b from-sky-950 via-sky-800 to-sky-950">
      <g className="sink-char" style={{ transform: `translate(150px, ${22 + depth * 11}px)` }}>
        <circle cx="0" cy="22" r="26" fill="none" stroke="var(--color-amber-400)" strokeWidth="7" />
        <circle cx="0" cy="0" r="11" fill="#f1c9a5" />
        <path d="M-11 -2Q0 -14 11 -2" fill="#2a1a10" />
        <rect x="-14" y="11" width="28" height="42" rx="6" fill="#fff" stroke="#9bd" />
        <path d="M-14 16L-26 4M14 16L26 4" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      </g>
      <path className="wave" d="M-60 72Q-35 62 -10 72T40 72T90 72T140 72T190 72T240 72T290 72T340 72V150H-60Z" fill="rgba(40,150,255,.55)" />
    </svg>
    <p className="px-3 py-2 text-[13px] text-center text-slate-300" role="status">
      {depth <= 2 ? 'العالم يطفو بأمان… استمر!' : depth <= 5 ? 'الماء يرتفع! أجب بدقة لتنقذه.' : 'العالم يكاد يغرق!'}
    </p>
  </div>
);

const StreakBoard: React.FC<{ streak: number; best: number }> = ({ streak, best }) => (
  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 mb-4" role="status">
    <p className="text-[14px]">سلسلة التوقعات الصحيحة: <b className="text-amber-300">{streak}</b> · أفضل سلسلة: <b>{best}</b></p>
    <div className="h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
      <div className="h-full bg-amber-400 transition-all" style={{ width: `${(Math.min(streak, 6) / 6) * 100}%` }} />
    </div>
  </div>
);

const CaseBoard: React.FC<{ gate: Gate; tasks: Record<string, number> }> = ({ gate, tasks }) => (
  <div className="rounded-2xl border hairline px-4 py-3 mb-4 flex flex-wrap items-center gap-1.5">
    <span className="text-amber-300 text-[14px] me-1">الأدلة المجموعة:</span>
    {gate.items.map((_, j) => {
      const on = tasks[atomItemId(gate.index, j)] !== undefined;
      return <span key={j} className={`w-7 h-7 rounded-full border-2 text-[12px] flex items-center justify-center ${on ? 'bg-amber-400 border-white text-slate-950' : 'border-slate-600 text-slate-500'}`}>{j + 1}</span>;
    })}
  </div>
);

// ---------------- الصفحة ----------------

export const AtomGatePage: React.FC<{ gateIndex: number; onBack: () => void; onToast: (m: string) => void }> = ({ gateIndex, onBack, onToast }) => {
  const gate = ATOM_GATES[gateIndex];
  const { tasks } = useLab();
  const firstOpen = gate.items.findIndex((_, j) => tasks[atomItemId(gateIndex, j)] === undefined);
  const [phase, setPhase] = useState<'intro' | 'play' | 'summary'>('intro');
  const [k, setK] = useState(Math.max(0, firstOpen));
  const [board, setBoard] = useState<BoardState>({ depth: 4, streak: 0, best: 0 });
  const stepsRef = useRef<HTMLOListElement>(null);

  const onEvent = (ok: boolean) => {
    setBoard(b => {
      if (gate.game === 'sink') {
        let depth = Math.max(0, Math.min(8, b.depth + (ok ? -1 : 1)));
        if (depth >= 8) {
          depth = 5;
          onToast('غرق العالم! أنقذه بإجابة صحيحة');
        }
        return { ...b, depth };
      }
      if (gate.game === 'streak') {
        if (!ok) return { ...b, streak: 0 };
        const streak = b.streak + 1;
        if (streak === 3) onToast('عين خبير!');
        if (streak === 5) onToast('عبقري التنبؤ!');
        return { ...b, streak, best: Math.max(b.best, streak) };
      }
      return b;
    });
  };

  const go = (j: number) => {
    sounds.click();
    setK(j);
    setPhase('play');
    requestAnimationFrame(() => {
      stepsRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const header = (
    <nav aria-label="مسار التنقل" className="flex items-center justify-between gap-3 mb-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 h-9 ps-3 pe-4 rounded-full border hairline text-sm text-slate-300 hover:text-amber-300">
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
        مختبر الذرة
      </button>
      <span className="text-[13px] text-cyan-400 truncate">{gate.n}</span>
    </nav>
  );

  if (phase === 'intro') {
    return (
      <div>
        {header}
        <section className="relative overflow-hidden rounded-3xl border hairline min-h-[52vh] flex items-end">
          <img src={img(gate.img)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" aria-hidden="true" />
          <div className="relative p-6 sm:p-10 max-w-2xl stagger">
            <span className="font-mono text-xs text-slate-400">البوابة 0{gateIndex + 1} من 06</span>
            <h1 className="font-display text-3xl sm:text-5xl text-white mt-2">{gate.n}</h1>
            <p className="font-display text-lg sm:text-xl text-amber-300 mt-3">{gate.q}</p>
            <p className="text-[15px] leading-loose text-slate-300 mt-3">{gate.ex}</p>
            <button type="button" onClick={() => go(Math.max(0, firstOpen))} autoFocus className="mt-6 h-12 px-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              {firstOpen > 0 ? 'تابع من حيث توقفت' : firstOpen < 0 ? 'أعد التدرب' : 'ابدأ المهمة'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (phase === 'summary') {
    const got = gate.items.reduce((a, _, j) => a + (tasks[atomItemId(gateIndex, j)] || 0), 0);
    const mx = gate.items.reduce((a, x) => a + (x.p ?? 1), 0);
    const r = got / mx;
    const last = gateIndex === ATOM_GATES.length - 1;
    const msg = last
      ? r >= 0.8 ? 'أداء يليق بالصقور! جمعت الأدلة والمعلومات وحلّقت عاليًا، وبلغت حالة الاستقرار العلمي.' : r >= 0.5 ? 'أداء جيد يا صقور! راجع ما فاتك وأعد التدرب لتصل إلى القمة.' : 'بداية طيبة. أعد التدرب على الأنشطة، فالقمة تُبنى بالمثابرة.'
      : r >= 0.8 ? 'أتقنت هذه المحطة، وتفاعلك وصل إلى ناتجه الصحيح!' : 'أنجزت المحطة. يمكنك إعادة التدرب لتحسين فهمك.';
    return (
      <div>
        {header}
        <section className="max-w-xl mx-auto text-center rounded-3xl border hairline bg-slate-900/50 p-8 animate-in">
          <h2 className="font-display text-3xl text-white">{last ? 'اكتملت رحلتك!' : 'أنجزت هذه المحطة'}</h2>
          <p className="font-display text-5xl text-amber-300 mt-4" dir="ltr">{got} / {mx}</p>
          <p className="text-slate-300 mt-4 leading-relaxed">{msg}</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button type="button" onClick={onBack} autoFocus className="h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">العودة إلى المختبر الرئيسي</button>
            <button type="button" onClick={() => go(0)} className="text-sm text-slate-400 hover:text-white underline">إعادة التدرب (دون نقاط جديدة)</button>
          </div>
        </section>
      </div>
    );
  }

  const item = gate.items[k];
  return (
    <div>
      {header}
      <ol ref={stepsRef} className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1" aria-label="أنشطة البوابة">
        {gate.items.map((x, j) => {
          const dn = tasks[atomItemId(gateIndex, j)] !== undefined;
          return (
            <li key={j} className="shrink-0">
              <button
                type="button"
                onClick={() => go(j)}
                aria-current={j === k ? 'step' : undefined}
                className={`flex items-center gap-1.5 h-9 ps-1.5 pe-3 rounded-full border text-[12px] whitespace-nowrap ${j === k ? 'border-amber-400 bg-amber-500/15 text-amber-200' : dn ? 'border-emerald-500/40 text-emerald-300' : 'border-slate-700 text-slate-400'}`}
              >
                {x.av ? <img src={img(x.av, 'sm')} alt="" className="w-6 h-6 rounded-full object-cover bg-white" /> : <span className="w-6 text-center font-mono">{j + 1}</span>}
                {x.tag || `النشاط ${j + 1}`}
              </button>
            </li>
          );
        })}
      </ol>

      {gate.game === 'sink' && <SinkBoard depth={board.depth} />}
      {gate.game === 'streak' && <StreakBoard streak={board.streak} best={board.best} />}
      {gate.game === 'case' && <CaseBoard gate={gate} tasks={tasks} />}

      <ItemCard
        key={`${gateIndex}-${k}`}
        item={item}
        variant="atom"
        taskId={atomItemId(gateIndex, k)}
        game={gate.game}
        showHow
        counter={`${k + 1} / ${gate.items.length}`}
        nextLabel={k < gate.items.length - 1 ? 'النشاط التالي' : 'إنهاء المحطة'}
        onNext={() => (k < gate.items.length - 1 ? go(k + 1) : setPhase('summary'))}
        onEvent={onEvent}
      />
    </div>
  );
};
