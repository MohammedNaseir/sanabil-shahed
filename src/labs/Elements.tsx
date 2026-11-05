/**
 * مختبر العناصر: الكالسيوم والكبريت والسيليكون — 7 محطات لكل عنصر (تجربتان وخمس ألعاب).
 */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import { ELEMENT_LABS } from '../content/elements';
import type { ElementLab, ElementStation } from '../content/types';
import { ATOM_GATES } from '../content/atom';
import { LAB_NAMES, labTotals, rankTitle, stationDoneId, elementLabDone, atomFinalDone } from '../content/tasks';
import { QuizSequence } from '../engine/ItemCard';
import { Arcade } from '../engine/Arcade';
import { ElecExperiment, MicroExperiment, SimExperiment } from '../engine/sims/Experiments';
import { img, useLab } from '../engine/shared';
import { sounds } from '../utils/audio';
import confetti from '../utils/confetti';

const SYMBOL: Record<ElementLab['id'], [string, string]> = { ca: ['Ca', '20'], su: ['S', '16'], si: ['Si', '14'] };

const doneN = (tasks: Record<string, number>, L: ElementLab) => L.stations.filter(s => tasks[stationDoneId(L.id, s.id)] !== undefined).length;

// ---------------- الواجهة: اختيار العنصر ----------------

export const ElementsHub: React.FC<{
  tasks: Record<string, number>;
  unlocked: boolean;
  onOpenLab: (id: ElementLab['id']) => void;
  onBackToAtom: () => void;
  onFinale: () => void;
}> = ({ tasks, unlocked, onOpenLab, onBackToAtom, onFinale }) => {
  const t = labTotals(tasks);
  if (!unlocked) {
    return (
      <section className="max-w-xl mx-auto text-center rounded-3xl border hairline bg-slate-900/50 p-8 animate-in">
        <Lock className="w-10 h-10 mx-auto text-amber-400" aria-hidden="true" />
        <h1 className="font-display text-3xl text-white mt-3">مختبر العناصر</h1>
        <p className="text-slate-300 mt-3 leading-relaxed">يُفتح بعد إنجاز «{ATOM_GATES[ATOM_GATES.length - 1].n}» في مختبر الذرة، أو عندما تفتحه المعلمة للصف.</p>
        <button type="button" onClick={onBackToAtom} className="mt-6 h-11 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">اذهب إلى مختبر الذرة</button>
      </section>
    );
  }
  const all = ELEMENT_LABS.every(L => elementLabDone(tasks, L.id));
  return (
    <div className="space-y-8">
      <header className="stagger">
        <p className="flex items-center gap-3 text-[13px] text-amber-400">
          <span className="h-px w-10 bg-amber-400/60" aria-hidden="true" />
          المرحلة الثانية • مراجعة
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-white mt-3">مختبر العناصر</h1>
        <p className="text-slate-400 mt-3 max-w-2xl leading-loose">الكالسيوم والكبريت والسيليكون: تجربتان تنفّذهما بنفسك في كل مختبر، ثم ذاكرة وبالونات وتحقيق وصاروخ سرعة وتحدٍ ختامي.</p>
      </header>
      <div className="stagger grid md:grid-cols-3 gap-4">
        {ELEMENT_LABS.map(L => {
          const dn = doneN(tasks, L);
          const [sym, num] = SYMBOL[L.id];
          return (
            <button key={L.id} type="button" onClick={() => { sounds.click(); onOpenLab(L.id); }} className="group element-tile rounded-3xl overflow-hidden text-right flex flex-col hover:-translate-y-1 transition-transform">
              <span className="relative block h-36 overflow-hidden">
                <img src={img(L.gate, 'sm')} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" aria-hidden="true" />
                <span className="absolute bottom-3 start-4 w-16 h-20 rounded-xl border hairline bg-slate-950/70 p-2 flex flex-col justify-between">
                  <span className="font-mono text-[10px] text-slate-400">{num}</span>
                  <span className="font-display text-3xl text-amber-400 leading-none">{sym}</span>
                </span>
              </span>
              <span className="p-5 flex-1 flex flex-col">
                <span className="font-display text-2xl text-white">{L.n}</span>
                <span className="text-[13px] text-slate-400 mt-1">{L.mission}</span>
                <span className="mt-auto pt-4 flex items-center justify-between text-[13px]">
                  <span className={dn === L.stations.length ? 'text-emerald-400' : 'text-slate-500'}>{dn} / {L.stations.length} مهمات</span>
                  <span className="font-mono text-amber-300">{t[L.id]} نقطة</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {all && (
        <div className="text-center">
          <button type="button" onClick={onFinale} className="h-12 px-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">شاشة الإنجاز 🏆</button>
        </div>
      )}
    </div>
  );
};

// ---------------- مختبر عنصر ----------------

const StationRunner: React.FC<{ lab: ElementLab; station: ElementStation; onEnd: () => void }> = ({ lab, station, onEnd }) => {
  const pre = `${lab.id}.${station.id}`;
  switch (station.kind) {
    case 'sim': return <SimExperiment def={station.sim} idPrefix={pre} onEnd={onEnd} />;
    case 'elec': return <ElecExperiment def={station.elec} idPrefix={pre} onEnd={onEnd} />;
    case 'micro': return <MicroExperiment def={station.micro} lab={lab.id} stationId={station.id} onEnd={onEnd} />;
    case 'quiz': return <QuizSequence items={station.items} idPrefix={pre} variant="elements" showHow onFinish={onEnd} />;
    case 'arcade': return <Arcade def={station.arcade} idPrefix={pre} onEnd={onEnd} />;
  }
};

export const ElementLabPage: React.FC<{
  labId: ElementLab['id'];
  conclusions: Record<string, string>;
  onBack: () => void;
  onFinale: () => void;
}> = ({ labId, conclusions, onBack, onFinale }) => {
  const lab = ELEMENT_LABS.find(l => l.id === labId)!;
  const { tasks, award } = useLab();
  const firstOpen = lab.stations.findIndex(s => tasks[stationDoneId(lab.id, s.id)] === undefined);
  const [view, setView] = useState<{ v: 'intro' } | { v: 'station'; j: number } | { v: 'report' }>({ v: 'intro' });

  const open = (j: number) => {
    sounds.click();
    setView({ v: 'station', j });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stationDone = (j: number) => {
    const s = lab.stations[j];
    award(stationDoneId(lab.id, s.id), 0);
    confetti({ particleCount: 40, spread: 60 });
    const after = { ...tasks, [stationDoneId(lab.id, s.id)]: 0 };
    if (j < lab.stations.length - 1) open(j + 1);
    else if (ELEMENT_LABS.every(L => elementLabDone(after, L.id)) && atomFinalDone(after)) onFinale();
    else setView({ v: 'report' });
  };

  const header = (
    <nav aria-label="مسار التنقل" className="flex items-center justify-between gap-3 mb-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 h-9 ps-3 pe-4 rounded-full border hairline text-sm text-slate-300 hover:text-amber-300">
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
        مختبر العناصر
      </button>
      <span className="text-[13px] text-amber-300 truncate">{lab.n}</span>
    </nav>
  );

  const steps = (
    <ol className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1" aria-label="مهمات المختبر">
      {lab.stations.map((s, j) => {
        const dn = tasks[stationDoneId(lab.id, s.id)] !== undefined;
        const cur = view.v === 'station' && view.j === j;
        return (
          <li key={s.id} className="shrink-0">
            <button type="button" onClick={() => open(j)} aria-current={cur ? 'step' : undefined}
              className={`h-9 px-3 rounded-full border text-[12px] whitespace-nowrap ${cur ? 'border-amber-400 bg-amber-500/15 text-amber-200' : dn ? 'border-emerald-500/40 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
              {dn && <Check className="inline w-3.5 h-3.5 me-1" aria-hidden="true" />}{j + 1}. {s.n}
            </button>
          </li>
        );
      })}
      <li className="shrink-0">
        <button type="button" onClick={() => setView({ v: 'report' })} className={`h-9 px-3 rounded-full border text-[12px] ${view.v === 'report' ? 'border-amber-400 text-amber-200' : 'border-slate-700 text-slate-400'}`}>تقرير الإنجاز</button>
      </li>
    </ol>
  );

  if (view.v === 'intro') {
    return (
      <div>
        {header}
        <section className="relative overflow-hidden rounded-3xl border hairline min-h-[52vh] flex items-end">
          <img src={img(lab.bg)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" aria-hidden="true" />
          <div className="relative p-6 sm:p-10 max-w-2xl stagger">
            <span className="text-[13px] text-amber-300">مراجعة — مهمتك: {lab.mission}</span>
            <h1 className="font-display text-3xl sm:text-5xl text-white mt-2">{lab.n}</h1>
            <p className="font-display text-lg text-amber-300 mt-3">{lab.q}</p>
            <p className="text-[15px] leading-loose text-slate-300 mt-3">{lab.ex}</p>
            <button type="button" onClick={() => open(Math.max(0, firstOpen))} autoFocus className="mt-6 h-12 px-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              {firstOpen > 0 ? 'تابع من حيث توقفت' : firstOpen < 0 ? 'أعد التدرب' : 'ابدأ المهمة'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (view.v === 'report') {
    const dn = doneN(tasks, lab);
    const all = dn === lab.stations.length;
    const points = labTotals(tasks)[lab.id];
    const lg = Object.entries(conclusions);
    return (
      <div>
        {header}
        {steps}
        <section className="rounded-3xl border hairline bg-slate-900/50 p-6 sm:p-8 animate-in">
          <h2 className="font-display text-3xl text-white">{all ? `لقب: ${lab.title}` : 'تقرير الإنجاز'}</h2>
          <p className="font-display text-4xl text-amber-300 mt-2">{points} نقطة</p>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <b className="text-slate-200">المهمات ({dn}/{lab.stations.length}):</b>
              <ul className="mt-2 space-y-1.5 text-[14px]">
                {lab.stations.map(s => <li key={s.id} className={tasks[stationDoneId(lab.id, s.id)] !== undefined ? 'text-emerald-300' : 'text-slate-500'}>{tasks[stationDoneId(lab.id, s.id)] !== undefined ? '✓' : '○'} {s.n}</li>)}
              </ul>
            </div>
            <div>
              <b className="text-slate-200">الاستنتاجات:</b>
              <ul className="mt-2 space-y-2 text-[14px] text-slate-300 leading-relaxed">
                {lg.length ? lg.map(([k, v]) => <li key={k}><b className="text-amber-300">{k}:</b> {v}</li>) : <li className="text-slate-500">أنجز التجارب لتظهر هنا.</li>}
              </ul>
            </div>
          </div>
          <button type="button" onClick={onBack} className="mt-6 h-11 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">العودة</button>
        </section>
      </div>
    );
  }

  const s = lab.stations[view.j];
  return (
    <div>
      {header}
      {steps}
      <p className="text-[13px] text-slate-500 mb-2">{s.mode} · المهمة {view.j + 1} من {lab.stations.length}</p>
      <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">{s.n}</h2>
      {s.how && (
        <div className="mb-5 rounded-2xl border hairline bg-slate-900/40 px-4 py-3 text-[14px] leading-relaxed text-slate-400">
          <b className="text-amber-300">🎮 فكرة اللعبة:</b> {s.how}
        </div>
      )}
      <StationRunner key={`${lab.id}.${s.id}`} lab={lab} station={s} onEnd={() => stationDone(view.j)} />
    </div>
  );
};

// ---------------- شاشة الإنجاز الختامية ----------------

export const Finale: React.FC<{ tasks: Record<string, number>; onBack: () => void; onCertificate: () => void }> = ({ tasks, onBack, onCertificate }) => {
  const t = labTotals(tasks);
  const atomDone = atomFinalDone(tasks);
  const ok = atomDone && ELEMENT_LABS.every(L => elementLabDone(tasks, L.id));
  return (
    <section className="max-w-2xl mx-auto text-center rounded-3xl border hairline bg-slate-900/60 p-8 sm:p-10 animate-in">
      <h1 className="font-display text-3xl sm:text-4xl text-white">رحلة البحث والاكتشاف</h1>
      <p className="font-display text-xl text-amber-300 mt-3">لقبك: {rankTitle(t.total)} · نقاطك: {t.total}</p>
      <ul className="mt-5 space-y-2 text-[15px]">
        <li className={atomDone ? 'text-emerald-300' : 'text-slate-500'}>{atomDone ? '✓' : '○'} باحث الذرة ({t.at} نقطة)</li>
        {ELEMENT_LABS.map(L => (
          <li key={L.id} className={elementLabDone(tasks, L.id) ? 'text-emerald-300' : 'text-slate-500'}>
            {elementLabDone(tasks, L.id) ? '✓' : '○'} {L.title} ({t[L.id]} نقطة)
          </li>
        ))}
      </ul>
      <p className="mt-5 leading-loose text-slate-300">
        {ok ? 'خرجتَ من مختبر أ. شهد وقد عشتَ تجربة كيميائية واكتشفتَ بنفسك. فضولك هو بداية كل اكتشاف جديد!' : 'أكمل بقية المهمات لتكتمل رحلتك.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {ok && <button type="button" onClick={onCertificate} className="h-11 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">شهادتي</button>}
        <button type="button" onClick={onBack} className="h-11 px-6 rounded-full border hairline text-slate-200">العودة إلى المختبر الرئيسي <ArrowLeft className="inline w-4 h-4" aria-hidden="true" /></button>
      </div>
      <p className="sr-only">{LAB_NAMES.at}</p>
    </section>
  );
};

/** شاشة «فُتح مختبر العناصر!» (تظهر مرة واحدة). */
export const UnlockFx: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const doneRef = React.useRef(onDone);
  doneRef.current = onDone;
  React.useEffect(() => {
    confetti({ particleCount: 70, spread: 90 });
    const id = setTimeout(() => doneRef.current(), 3800);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 text-center unlock-fx" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-amber-500) 25%, var(--surface)), var(--surface) 70%)' }} role="alertdialog" aria-label="فُتح مختبر العناصر">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl text-amber-300">فُتح مختبر العناصر!</h1>
        <p className="mt-4 text-lg text-slate-200 max-w-lg leading-loose">أنجزتَ التحدي الختامي لمختبر الذرة… والمرحلة الثانية بانتظارك: الكالسيوم والكبريت والسيليكون.</p>
        <button type="button" onClick={onDone} className="mt-6 h-11 px-6 rounded-full bg-amber-500 text-slate-950 font-bold">إلى مختبر العناصر</button>
      </div>
    </div>
  );
};
