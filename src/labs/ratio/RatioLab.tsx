/**
 * مختبر النسب الثابتة | مختبر الأسئلة — الغلاف: شاشة الترحيب، خريطة المحطات الخمس، المحطات، وشاشة الختام.
 * التنقل عبر الرابط (#/ratio/…) فيعمل زر الرجوع. التنقل بين المحطات حر (لا أقفال)، والترتيب المقترح 1 → 5.
 */
import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { RatioStage } from '../../utils/routing';
import { FINALE_QUOTE, FINALE_TITLE, STATIONS, WELCOME_QUOTE, WELCOME_TITLE, type StationId } from './data';
import { useRatioState } from './state';
import { Match } from './Match';
import { Teach } from './Teach';
import { Vault } from './Vault';
import { Wheel } from './Wheel';
import { Who } from './Who';
import { GoldBtn, QuietBtn, RIcon, Scale, SoundToggle, goldBurst } from './ui';
import { sounds } from '../../utils/audio';

const STATION_STAGES: StationId[] = ['wheel', 'who', 'teach', 'vault', 'match'];
const FORMULAS: { f: string; cls: string }[] = [
  { f: 'H₂O', cls: 'top-4 right-3 sm:right-24 chem-float' },
  { f: 'NaCl', cls: 'top-24 left-3 sm:left-24 chem-float-slow' },
  { f: 'CO₂', cls: 'bottom-24 right-4 sm:right-36 chem-float-slow' },
  { f: 'NH₃', cls: 'bottom-10 left-6 sm:left-40 chem-float' },
  { f: 'C₁₂H₂₂O₁₁', cls: 'top-[46%] right-0 sm:right-6 chem-float hidden md:block' },
  { f: '8 : 1', cls: 'top-[40%] left-0 sm:left-8 chem-float-slow hidden md:block' },
];

// ---------------- الترحيب ----------------

const Welcome: React.FC<{ onStart: () => void; onExit: () => void }> = ({ onStart, onExit }) => (
  <section className="relative min-h-[72vh] flex flex-col items-center justify-center text-center py-6 overflow-hidden" aria-label="مختبر النسب الثابتة">
    {FORMULAS.map(x => (
      <span key={x.f} className={`absolute pointer-events-none font-mono text-lg sm:text-2xl text-amber-300/40 ${x.cls}`} dir="ltr" aria-hidden="true">{x.f}</span>
    ))}
    <div className="relative flex items-end gap-2 sm:gap-6 stagger">
      <div className="w-20 sm:w-32"><img src="/falcon_transparent.webp" alt="" className="w-full h-auto drop-shadow-xl" /></div>
      <div className="w-56 sm:w-80"><Scale angle={0} left="8" right="1" leftTitle="أكسجين" rightTitle="هيدروجين" glow /></div>
    </div>
    <div className="relative stagger">
      <p className="text-[13px] text-amber-300">مختبر الأسئلة · الصف العاشر</p>
      <h1 className="mt-2 font-display text-[2.4rem] sm:text-6xl text-white leading-tight">مختبر <span className="text-amber-300">النسب الثابتة</span></h1>
      <p className="mt-4 font-display text-xl sm:text-2xl text-white">{WELCOME_TITLE}</p>
      <p className="mt-4 mx-auto max-w-2xl text-[16px] sm:text-xl leading-loose text-slate-100">«{WELCOME_QUOTE}»</p>
      <GoldBtn onClick={onStart} className="mt-8 w-full max-w-xs h-14 text-lg">ابدأ التحدي <ArrowLeft className="w-5 h-5" aria-hidden="true" /></GoldBtn>
      <div className="mt-4">
        <button type="button" onClick={() => { sounds.click(); onExit(); }} className="text-sm text-slate-300 hover:text-amber-200 underline underline-offset-4">العودة إلى مختبرات الأسئلة</button>
      </div>
    </div>
  </section>
);

// ---------------- خريطة المحطات ----------------

const StationMap: React.FC<{ api: ReturnType<typeof useRatioState>; onOpen: (s: StationId) => void; onFinale: () => void; onExit: () => void }> = ({ api, onOpen, onFinale, onExit }) => {
  const sum = api.summary;
  return (
    <div className="py-2 sm:py-6">
      <header className="text-center stagger">
        <div className="flex justify-center"><SoundToggle /></div>
        <p className="mt-3 text-[13px] text-amber-300">مختبر الأسئلة</p>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl text-white">مختبر النسب الثابتة</h1>
        <p className="mt-3 text-[15px] sm:text-lg text-slate-200">خمس محطات بالترتيب المقترح، ويمكنك الانتقال بينها بحرية.</p>
      </header>

      <section className="mt-5 max-w-4xl mx-auto" aria-label="تقدمك">
        <div className="flex items-center justify-between text-sm text-slate-200 mb-2">
          <span>أنجزتَ <b className="text-amber-300 font-display text-lg">{sum.completeN}</b> من {STATIONS.length} محطات</span>
          <span><b className="text-amber-300 font-display text-lg">{sum.points}</b> نقطة</span>
        </div>
        <ol className="flex items-center" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={sum.completeN}>
          {sum.stations.map((s, i) => (
            <li key={s.id} className="flex items-center flex-1 last:flex-none">
              <button type="button" onClick={() => onOpen(s.id)} aria-label={`المحطة ${i + 1}: ${STATIONS[i].title}`}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full grid place-items-center font-display text-base shrink-0 border-2 transition-colors ${s.complete ? 'bg-amber-400 border-amber-300 text-slate-950' : s.done > 0 ? 'border-amber-300 text-amber-200 bg-amber-400/10' : 'border-white/30 text-white'}`}>
                {s.complete ? <Check className="w-5 h-5" aria-hidden="true" /> : i + 1}
              </button>
              {i < sum.stations.length - 1 && (
                <span className="flex-1 h-1 mx-1 rounded-full bg-white/10 overflow-hidden"><span className="block h-full bg-amber-400 transition-all duration-700" style={{ width: s.complete ? '100%' : '0%' }} /></span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-4 stagger">
        {STATIONS.map((st, i) => {
          const p = sum.stations[i];
          return (
            <article key={st.id} className="section-card rounded-[26px] p-5 flex flex-col w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)] relative">
              <span className="absolute top-4 left-4 w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-display grid place-items-center text-sm">{i + 1}</span>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 shrink-0 rounded-2xl bg-slate-950/50 border hairline p-2.5"><RIcon id={st.id} /></div>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl text-white leading-tight">{st.title}</h2>
                  <p className="text-sm text-amber-300">{st.tag}</p>
                </div>
              </div>
              <p className="mt-3 text-[15px] leading-loose text-slate-200">{st.line}</p>
              <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                <span className={`text-[13px] ${p.complete ? 'text-amber-300' : 'text-slate-300'}`}>
                  {p.complete ? <><Check className="inline w-4 h-4 -mt-0.5" aria-hidden="true" /> مكتملة</> : st.id === 'match' ? 'لم تُلعب بعد' : <span dir="ltr">{p.done} / {p.total}</span>}
                </span>
                <GoldBtn onClick={() => onOpen(st.id)} className="h-11 px-5 text-sm">{p.complete ? 'العب مجددًا' : p.done > 0 ? 'تابع' : 'ادخل المحطة'}</GoldBtn>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <QuietBtn onClick={onExit}><ArrowRight className="w-4 h-4" aria-hidden="true" /> العودة إلى مختبرات الأسئلة</QuietBtn>
        {sum.allDone
          ? <GoldBtn onClick={onFinale}>🏆 رحلتي في المختبر</GoldBtn>
          : <span className="text-sm text-slate-300">أنجز المحطات الخمس لتظهر رحلتك الختامية.</span>}
      </div>
    </div>
  );
};

// ---------------- الختام ----------------

const Finale: React.FC<{ api: ReturnType<typeof useRatioState>; studentName: string | null; onMap: () => void; onRestart: () => void }> = ({ api, studentName, onMap, onRestart }) => {
  const { summary: sum, state } = api;
  const m = state.match;
  useEffect(() => { if (sum.allDone) goldBurst(80); }, [sum.allDone]);
  return (
    <section className="py-4 sm:py-8 max-w-3xl mx-auto text-center" aria-label={FINALE_TITLE}>
      <div className="section-card rounded-[30px] p-6 sm:p-10 animate-in">
        <p className="text-[34px]" aria-hidden="true">🧪</p>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl text-white">{FINALE_TITLE}</h1>
        <p className="mt-5 text-[16px] sm:text-lg leading-loose text-slate-100">«{FINALE_QUOTE}»</p>
        <p className="mt-6 text-slate-300 text-sm">{studentName ? 'الطالب' : 'المشارك'}</p>
        <p className="font-display text-2xl text-amber-300">{studentName ?? 'صقر الكيمياء'}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border hairline bg-slate-950/40 p-4"><p className="font-display text-4xl text-amber-300">{sum.points}</p><p className="text-sm text-slate-200">مجموع النقاط</p></div>
          <div className="rounded-2xl border hairline bg-slate-950/40 p-4"><p className="font-display text-4xl text-amber-300">{sum.correct}</p><p className="text-sm text-slate-200">إجابات صحيحة</p></div>
        </div>
        <ul className="mt-5 text-right space-y-2" aria-label="المحطات">
          {sum.stations.map((s, i) => (
            <li key={s.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${s.complete ? 'border-amber-400/50 text-white' : 'border-white/10 text-slate-400'}`}>
              <span>{s.complete ? '✓' : '○'} {i + 1}. {STATIONS[i].title}</span>
              <span className="text-sm">{s.complete ? 'منجزة' : 'لم تكتمل'}</span>
            </li>
          ))}
        </ul>
        {m && (
          <div className="mt-5 rounded-2xl border hairline bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">نتيجة المباراة النهائية (مستقلة عن نقاطك)</p>
            <p className="mt-1 font-display text-xl text-white">{m.a} <span className="text-amber-300" dir="ltr">{m.gb} - {m.ga}</span> {m.b}</p>
            <p className="text-sm text-amber-200">{m.ga === m.gb ? 'تعادل' : `بطل مختبر النسب الثابتة: ${m.ga > m.gb ? m.a : m.b}`}</p>
          </div>
        )}
        <div className="mt-6 inline-block rounded-2xl border-2 border-amber-400 bg-amber-400/10 px-6 py-3">
          <p className="text-[12px] text-amber-200">اللقب</p>
          <p className="font-display text-2xl sm:text-3xl text-amber-300">{sum.allDone ? 'صقر النسب الثابتة' : 'يُمنح بعد إكمال المحطات الخمس'}</p>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <GoldBtn onClick={onMap}>العودة إلى خريطة المحطات</GoldBtn>
          <QuietBtn onClick={onRestart}>إعادة التجربة (دون نقاط جديدة)</QuietBtn>
        </div>
      </div>
    </section>
  );
};

// ---------------- الغلاف ----------------

export const RatioLab: React.FC<{
  scope: string;
  studentName: string | null;
  stage: RatioStage;
  onStage: (s: RatioStage) => void;
  onExit: () => void;
}> = ({ scope, studentName, stage, onStage, onExit }) => {
  const api = useRatioState(scope);
  const isStation = (STATION_STAGES as string[]).includes(stage);
  const allAtEntry = useRef(false);
  const latest = useRef(api.summary);
  latest.current = api.summary;
  useEffect(() => { if (isStation) allAtEntry.current = latest.current.allDone; }, [stage, isStation]);

  // إنهاء آخر محطة ناقصة يفتح شاشة الختام، وإلا نعود لخريطة المحطات
  const backToMap = () => onStage(!allAtEntry.current && latest.current.allDone ? 'finale' : 'map');

  switch (stage) {
    case 'welcome': return <Welcome onStart={() => onStage('map')} onExit={onExit} />;
    case 'map': return <StationMap api={api} onOpen={s => { sounds.click(); onStage(s); }} onFinale={() => onStage('finale')} onExit={onExit} />;
    case 'finale': return <Finale api={api} studentName={studentName} onMap={() => onStage('map')} onRestart={() => onStage('welcome')} />;
    case 'wheel': return <Wheel api={api} onBack={backToMap} />;
    case 'who': return <Who api={api} onBack={backToMap} />;
    case 'teach': return <Teach api={api} onBack={backToMap} />;
    case 'vault': return <Vault api={api} onBack={backToMap} />;
    case 'match': return <Match api={api} onBack={backToMap} />;
  }
};
