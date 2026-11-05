/**
 * مختبر الذرة: ست بوابات حول ذرة متحركة (حلقة على الشاشات الكبيرة، قائمة على الجوال).
 */
import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { ATOM_GATES } from '../content/atom';
import { atomItemId } from '../content/tasks';
import { img } from '../engine/shared';
import { OrbitAtom } from './OrbitAtom';
import { sounds } from '../utils/audio';

interface Props {
  tasks: Record<string, number>;
  points: number;
  onOpenGate: (index: number) => void;
}

const doneCount = (tasks: Record<string, number>, g: number) =>
  ATOM_GATES[g].items.filter((_, j) => tasks[atomItemId(g, j)] !== undefined).length;

export const AtomHub: React.FC<Props> = ({ tasks, points, onOpenGate }) => {
  const [sel, setSel] = useState<number | null>(null);
  const total = ATOM_GATES.reduce((a, g) => a + g.items.length, 0);
  const done = ATOM_GATES.reduce((a, _, i) => a + doneCount(tasks, i), 0);
  const open = (i: number) => {
    sounds.click();
    onOpenGate(i);
  };

  return (
    <div className="space-y-8">
      <header className="stagger flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 text-[13px] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400/60" aria-hidden="true" />
            المرحلة الأولى • العلماء والنماذج والتجارب الذرية
          </p>
          <h1 className="font-display text-4xl sm:text-6xl text-white mt-3">مختبر الذرة</h1>
        </div>
        <div className="text-left">
          <span className="block text-xs text-slate-500">النقاط</span>
          <span className="font-display text-3xl text-white">{points}</span>
          <span className="block text-xs text-slate-500 mt-1">{done} / {total} نشاطًا</span>
        </div>
      </header>
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="التقدّم في مختبر الذرة">
        <div className="h-full bg-gradient-to-l from-amber-400 to-cyan-400 transition-all duration-700" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {/* الحلقة: على الشاشات المتوسطة فما فوق */}
      <div className="hidden md:grid grid-cols-[1fr_minmax(0,280px)] gap-8 items-center">
        <div className="relative mx-auto w-full max-w-[560px] aspect-square">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-cyan-500)" strokeOpacity="0.3" strokeDasharray="0.6 1.6" strokeWidth="0.3" />
            {ATOM_GATES.map((_, i) => {
              const a = (i * Math.PI) / 3 - Math.PI / 2;
              return <line key={i} x1="50" y1="50" x2={50 + 38 * Math.cos(a)} y2={50 + 38 * Math.sin(a)} stroke="var(--color-amber-400)" strokeOpacity="0.35" strokeWidth="0.25" />;
            })}
          </svg>
          <OrbitAtom className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[42%]" />
          {ATOM_GATES.map((g, i) => {
            const a = (i * Math.PI) / 3 - Math.PI / 2;
            const dn = doneCount(tasks, i);
            const complete = dn === g.items.length;
            return (
              <button
                key={i}
                type="button"
                onClick={() => (sel === i ? open(i) : setSel(i))}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                className="group absolute w-[21%] -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${50 + 38 * Math.cos(a)}%`, top: `${50 + 38 * Math.sin(a)}%` }}
                aria-label={`${g.n}: ${dn} من ${g.items.length}`}
              >
                <span className={`block aspect-square rounded-full bg-cover bg-center border-2 transition-all ${sel === i ? 'border-amber-400 scale-110' : 'border-cyan-500/50 group-hover:border-amber-400'}`} style={{ backgroundImage: `url(${img(g.img, 'sm')})` }}>
                  {complete && <span className="float-left m-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-4 h-4" aria-hidden="true" /></span>}
                </span>
                <b className="block mt-1.5 text-[13px] leading-tight text-white">{g.n}</b>
                <small className="text-[11px] text-amber-300 font-mono">{dn} / {g.items.length}</small>
              </button>
            );
          })}
        </div>
        <aside className="rounded-3xl border hairline bg-slate-900/50 p-5 min-h-48" aria-live="polite">
          {sel == null ? (
            <p className="text-slate-400 leading-relaxed">اختر بوابة لتبدأ. كل بوابة لعبة مراجعة مختلفة، وتتبع ترتيبك من اليمين.</p>
          ) : (
            <>
              <span className="font-mono text-xs text-slate-500">0{sel + 1}</span>
              <h2 className="font-display text-2xl text-white mt-1">{ATOM_GATES[sel].n}</h2>
              <p className="text-amber-300/90 mt-2 leading-relaxed">{ATOM_GATES[sel].q}</p>
              <button type="button" onClick={() => open(sel)} className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                ادخل المحطة <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </aside>
      </div>

      {/* القائمة: على الجوال */}
      <ol className="md:hidden stagger grid gap-3">
        {ATOM_GATES.map((g, i) => {
          const dn = doneCount(tasks, i);
          return (
            <li key={i}>
              <button type="button" onClick={() => open(i)} className="w-full element-tile rounded-2xl overflow-hidden flex items-stretch text-right">
                <img src={img(g.img, 'sm')} alt="" loading="lazy" className="w-24 object-cover shrink-0" />
                <span className="flex-1 p-4">
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">0{i + 1}</span>
                    <span className={`text-[11px] font-mono ${dn === g.items.length ? 'text-emerald-400' : 'text-amber-300'}`}>{dn} / {g.items.length}</span>
                  </span>
                  <span className="block font-display text-lg text-white mt-0.5">{g.n}</span>
                  <span className="block text-[13px] text-slate-400 mt-1 line-clamp-2">{g.q}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
