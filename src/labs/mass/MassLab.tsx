/**
 * مختبر حفظ الكتلة | مختبر الأسئلة — الغلاف: شاشة الدخول، الشاشة الرئيسية (الترحيب + المحطات الخمس)،
 * المحطات، وشاشة الختام. التنقل بين الشاشات عبر الرابط (#/mass/…) فيعمل زر الرجوع في المتصفح.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { MassStage } from '../../utils/routing';
import { FINALE_QUOTE, INTRO_QUOTE, STATIONS, WELCOME_QUOTE, type StationId } from './data';
import { STATION_BONUS, useMassState } from './state';
import { Academy } from './Academy';
import { Falcon } from './Falcon';
import { Link } from './Link';
import { Stadium } from './Stadium';
import { Wheel } from './Wheel';
import { GOLD, GoldBtn, QuietBtn, Scale, StationIcon } from './ui';
import { sounds } from '../../utils/audio';
import { goldBurst } from './ui';

const STATION_STAGES: StationId[] = ['wheel', 'falcon', 'link', 'academy', 'stadium'];

const MiniAtom: React.FC<{ className: string; size: number; color?: string }> = ({ className, size, color = GOLD }) => (
  <svg viewBox="-30 -30 60 60" width={size} height={size} className={`absolute pointer-events-none ${className}`} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="1.2" opacity="0.5">
      <ellipse rx="26" ry="9" /><ellipse rx="26" ry="9" transform="rotate(60)" /><ellipse rx="26" ry="9" transform="rotate(120)" />
    </g>
    <circle r="4" fill={color} opacity="0.8" />
    <circle cx="26" r="2.6" fill="#6f9bf5" />
  </svg>
);

// ---------------- شاشة الدخول ----------------

const Intro: React.FC<{ onStart: () => void; onExit: () => void }> = ({ onStart, onExit }) => {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const first = setTimeout(() => setAngle(8), 400);
    const t = setInterval(() => setAngle(a => (a > 0 ? -8 : 8)), 2800);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);
  return (
    <section className="relative min-h-[72vh] flex flex-col items-center justify-center text-center py-6 overflow-hidden" aria-label="مختبر حفظ الكتلة">
      <MiniAtom className="chem-spin top-2 right-2 sm:right-16" size={92} />
      <MiniAtom className="chem-spin-rev bottom-10 left-0 sm:left-14" size={110} color="#6f9bf5" />
      <MiniAtom className="chem-float top-28 left-4 sm:left-28 hidden sm:block" size={54} />
      <div className="relative w-full max-w-sm sm:max-w-md stagger">
        <Scale angle={angle} leftTitle="قبل التفاعل" rightTitle="بعد التفاعل" />
      </div>
      <div className="relative stagger">
        <p className="text-[13px] text-amber-300">مختبر الأسئلة · الصف العاشر</p>
        <h1 className="mt-2 font-display text-[2.6rem] sm:text-6xl text-white leading-tight">مختبر <span className="text-amber-300">حفظ الكتلة</span></h1>
        <p className="mt-5 mx-auto max-w-2xl text-[17px] sm:text-xl leading-loose text-slate-100">«{INTRO_QUOTE}»</p>
        <GoldBtn onClick={onStart} className="mt-8 w-full max-w-xs h-14 text-lg">انطلق نحو التحدي <ArrowLeft className="w-5 h-5" aria-hidden="true" /></GoldBtn>
        <div className="mt-4">
          <button type="button" onClick={() => { sounds.click(); onExit(); }} className="text-sm text-slate-300 hover:text-amber-200 underline underline-offset-4">العودة إلى مختبرات الأسئلة</button>
        </div>
      </div>
    </section>
  );
};

// ---------------- الشاشة الرئيسية ----------------

const Hub: React.FC<{
  api: ReturnType<typeof useMassState>;
  onOpen: (s: StationId) => void;
  onFinale: () => void;
  onExit: () => void;
}> = ({ api, onOpen, onFinale, onExit }) => {
  const sum = api.summary;
  return (
    <div className="py-2 sm:py-6">
      <header className="text-center stagger">
        <p className="text-[13px] text-amber-300">مختبر الأسئلة</p>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl text-white">مختبر حفظ الكتلة</h1>
      </header>

      <section className="section-card mt-5 rounded-3xl p-5 sm:p-7 text-center max-w-4xl mx-auto" aria-label="رسالة الترحيب">
        <p className="text-[16px] sm:text-xl leading-loose text-slate-100">«{WELCOME_QUOTE}»</p>
      </section>

      <section className="mt-5 max-w-4xl mx-auto" aria-label="تقدمك في المحطات">
        <div className="flex items-center justify-between text-sm text-slate-200 mb-2">
          <span>أنجزتَ <b className="text-amber-300 font-display text-lg">{sum.completeN}</b> من {STATIONS.length} محطات</span>
          <span><b className="text-amber-300 font-display text-lg">{sum.points}</b> نقطة</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={sum.completeN}>
          {sum.stations.map(s => (
            <div key={s.id} className="h-3 rounded-full bg-white/10 overflow-hidden" title={STATIONS.find(x => x.id === s.id)?.title}>
              <div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-amber-500 transition-all duration-700" style={{ width: `${(s.done / s.total) * 100}%` }} />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-4 stagger">
        {STATIONS.map((st, i) => {
          const p = sum.stations.find(s => s.id === st.id)!;
          return (
            <article key={st.id} className="section-card rounded-[26px] p-5 flex flex-col w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)] relative">
              <span className="absolute top-4 left-4 w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-display grid place-items-center text-sm">{i + 1}</span>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 shrink-0 rounded-2xl bg-slate-950/50 border hairline p-2.5"><StationIcon id={st.id} /></div>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl text-white leading-tight">{st.title}</h2>
                  <p className="text-sm text-amber-300">{st.tag}</p>
                </div>
              </div>
              <p className="mt-3 text-[15px] leading-loose text-slate-200">{st.line}</p>
              <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                <span className={`text-[13px] ${p.complete ? 'text-amber-300' : 'text-slate-300'}`}>
                  {p.complete ? <><Check className="inline w-4 h-4 -mt-0.5" aria-hidden="true" /> مكتملة</> : st.id === 'stadium' ? 'لم تُلعب بعد' : <span dir="ltr">{p.done} / {p.total}</span>}
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

// ---------------- شاشة الختام ----------------

const Finale: React.FC<{ api: ReturnType<typeof useMassState>; studentName: string | null; onHub: () => void; onRestart: () => void }> = ({ api, studentName, onHub, onRestart }) => {
  const { summary: sum, state } = api;
  const bonus = sum.completeN * STATION_BONUS;
  const m = state.match;
  useEffect(() => { if (sum.allDone) goldBurst(80); }, [sum.allDone]);
  return (
    <section className="py-4 sm:py-8 max-w-3xl mx-auto text-center" aria-label="رحلة صقر حفظ الكتلة">
      <div className="section-card rounded-[30px] p-6 sm:p-10 animate-in">
        <p className="text-[34px]" aria-hidden="true">🦅</p>
        <h1 className="mt-1 font-display text-3xl sm:text-5xl text-white">رحلة صقر حفظ الكتلة</h1>
        <p className="mt-5 text-[16px] sm:text-lg leading-loose text-slate-100">«{FINALE_QUOTE}»</p>

        <p className="mt-6 text-slate-300 text-sm">{studentName ? 'الطالب' : 'المشارك'}</p>
        <p className="font-display text-2xl text-amber-300">{studentName ?? 'صقر الكيمياء'}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl border hairline bg-slate-950/40 p-4">
            <p className="font-display text-4xl text-amber-300">{sum.points}</p>
            <p className="text-sm text-slate-200">مجموع النقاط</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sum.points - bonus} للمهام + {bonus} مكافآت إنجاز</p>
          </div>
          <div className="rounded-2xl border hairline bg-slate-950/40 p-4">
            <p className="font-display text-4xl text-amber-300">{sum.correct}</p>
            <p className="text-sm text-slate-200">إجابات صحيحة</p>
          </div>
        </div>

        <ul className="mt-5 text-right space-y-2" aria-label="المحطات">
          {sum.stations.map(s => {
            const st = STATIONS.find(x => x.id === s.id)!;
            return (
              <li key={s.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${s.complete ? 'border-amber-400/50 text-white' : 'border-white/10 text-slate-400'}`}>
                <span>{s.complete ? '✓' : '○'} {st.title}</span>
                <span className="text-sm">{s.complete ? 'منجزة' : 'لم تكتمل'}</span>
              </li>
            );
          })}
        </ul>

        {m && (
          <div className="mt-5 rounded-2xl border hairline bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">نتيجة مباراة ملعب الصقور (مستقلة عن نقاطك)</p>
            <p className="mt-1 font-display text-xl text-white">{m.a} <span className="text-amber-300" dir="ltr">{m.gb} - {m.ga}</span> {m.b}</p>
            <p className="text-sm text-amber-200">{m.ga === m.gb ? 'مباراة متكافئة' : `الفائز: ${m.ga > m.gb ? m.a : m.b}`}</p>
          </div>
        )}

        <div className="mt-6 inline-block rounded-2xl border-2 border-amber-400 bg-amber-400/10 px-6 py-3">
          <p className="text-[12px] text-amber-200">اللقب</p>
          <p className="font-display text-2xl sm:text-3xl text-amber-300">{sum.allDone ? 'صقر حفظ الكتلة' : 'يُمنح بعد إكمال المحطات الخمس'}</p>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <GoldBtn onClick={onHub}>العودة إلى الشاشة الرئيسية</GoldBtn>
          <QuietBtn onClick={onRestart}>إعادة التجربة (دون نقاط جديدة)</QuietBtn>
        </div>
      </div>
    </section>
  );
};

// ---------------- الغلاف ----------------

export const MassLab: React.FC<{
  scope: string;
  studentName: string | null;
  stage: MassStage;
  onStage: (s: MassStage) => void;
  onExit: () => void;
}> = ({ scope, studentName, stage, onStage, onExit }) => {
  const api = useMassState(scope);
  const isStation = (STATION_STAGES as string[]).includes(stage);
  const allAtEntry = useRef(false);
  const latest = useRef(api.summary);
  latest.current = api.summary;
  useEffect(() => { if (isStation) allAtEntry.current = latest.current.allDone; }, [stage, isStation]);

  // عند إنهاء آخر محطة ناقصة ننتقل إلى شاشة الختام، وإلا نعود للشاشة الرئيسية
  const backToHub = () => onStage(!allAtEntry.current && latest.current.allDone ? 'finale' : 'hub');

  switch (stage) {
    case 'intro': return <Intro onStart={() => onStage('hub')} onExit={onExit} />;
    case 'hub': return <Hub api={api} onOpen={s => { sounds.click(); onStage(s); }} onFinale={() => onStage('finale')} onExit={onExit} />;
    case 'finale': return <Finale api={api} studentName={studentName} onHub={() => onStage('hub')} onRestart={() => onStage('intro')} />;
    case 'wheel': return <Wheel api={api} onBack={backToHub} />;
    case 'falcon': return <Falcon api={api} onBack={backToHub} />;
    case 'link': return <Link api={api} onBack={backToHub} />;
    case 'academy': return <Academy api={api} onBack={backToHub} />;
    case 'stadium': return <Stadium api={api} onBack={backToHub} />;
  }
};
