/**
 * المحطة 3 — المعلم الصغير: محطة شرح ومناقشة بلا مؤقت ولا انتقال تلقائي.
 * لكل سؤال: يظهر السؤال على اللوح، «فكّر كيميائيًا» يعرض التلميح، وتعرض المعلمة الإجابة النموذجية
 * ثم تنتقل للسؤال التالي بنفسها. نقاط السؤال تُسجَّل عند عرض الإجابة النموذجية (مشاركة في الشرح).
 */
import React, { useState } from 'react';
import { TEACHER_SAYS, TEACH_ITEMS } from './data';
import { STATION_TASKS, type RatioApi } from './state';
import { Banner, GoldBtn, QuietBtn, RFrame } from './ui';
import { sounds } from '../../utils/audio';

export const Teach: React.FC<{ api: RatioApi; onBack: () => void }> = ({ api, onBack }) => {
  const done = (i: number) => Boolean(api.state.awards[`teach.${i}`]);
  const firstOpen = TEACH_ITEMS.findIndex((_, i) => !done(i));
  const [idx, setIdx] = useState(firstOpen < 0 ? 0 : firstOpen);
  const [hint, setHint] = useState(false);
  const [shown, setShown] = useState(() => done(idx));

  const item = TEACH_ITEMS[idx];
  const allDone = TEACH_ITEMS.every((_, i) => done(i));
  const pts = STATION_TASKS.teach.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);

  const showModel = () => {
    sounds.correct();
    api.award(`teach.${idx}`, true, false);
    setShown(true);
  };
  const go = (i: number) => { setIdx(i); setHint(false); setShown(done(i)); };

  return (
    <RFrame title="المعلم الصغير" quote="حان دوركم لتكونوا المعلم!" points={pts} onBack={onBack}>
      <div className="flex justify-center gap-2 mb-4 flex-wrap" aria-label="أسئلة المحطة">
        {TEACH_ITEMS.map((_, i) => (
          <button key={i} type="button" onClick={() => go(i)} className={`h-9 px-4 rounded-full text-sm border ${i === idx ? 'border-amber-400 bg-amber-400/15 text-amber-200' : done(i) ? 'border-amber-400/40 text-amber-300' : 'border-white/20 text-slate-300'}`}>
            السؤال {i + 1}{done(i) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {/* المعلم الصغير وعبارته */}
      <div className="flex items-end gap-3 sm:gap-5 max-w-4xl mx-auto">
        <div className="relative shrink-0 w-24 sm:w-36">
          <img src="/falcon_transparent.webp" alt="المعلم الصغير" className="w-full h-auto drop-shadow-xl" />
          <span className="absolute -top-3 right-1/2 translate-x-1/2 text-3xl" aria-hidden="true">🎓</span>
        </div>
        <div className="relative flex-1 rounded-3xl border hairline bg-slate-900/70 p-4 sm:p-5 text-[15px] sm:text-lg leading-loose text-white">
          «{TEACHER_SAYS}»
        </div>
      </div>

      {/* اللوح الكبير */}
      <section className="mt-5 max-w-4xl mx-auto rounded-[28px] p-2 sm:p-3" style={{ background: 'linear-gradient(145deg,#c8962e,#8a6420)' }} aria-label="اللوح التعليمي">
        <div className="rounded-[22px] p-5 sm:p-8" style={{ background: 'linear-gradient(160deg,#10234f,#0a1a44)' }}>
          <p className="text-[13px] text-amber-300">✏️ السؤال {idx + 1} من {TEACH_ITEMS.length}</p>
          <p className="mt-3 text-xl sm:text-3xl leading-[2.1] text-white font-display">{item.q}</p>

          <div className="mt-5 rounded-2xl border border-dashed border-white/25 p-4 text-slate-200 text-[15px]">
            💬 مساحة النقاش: ناقشوا الفكرة، ثم اشرحوا السبب العلمي لزملائكم.
          </div>

          {hint && <Banner tone="info" title="فكّر كيميائيًا" className="mt-4">{item.hint}</Banner>}

          {shown && (
            <div className="mt-5 rounded-2xl border-2 border-amber-400/70 bg-amber-400/10 p-5 animate-in" role="status" style={{ boxShadow: '0 0 24px rgba(221,180,85,0.2)' }}>
              <p className="font-display text-xl text-amber-300">✅ الإجابة النموذجية</p>
              <p className="mt-2 text-[16px] sm:text-xl leading-[2] text-white">{item.model}</p>
              {api.state.awards[`teach.${idx}`]?.pts ? <p className="mt-2 text-sm text-amber-200">+{api.state.awards[`teach.${idx}`].pts} نقطة للمشاركة في الشرح</p> : null}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!shown && !hint && <QuietBtn onClick={() => { sounds.click(); setHint(true); }}>🧠 فكّر كيميائيًا</QuietBtn>}
            {!shown && <GoldBtn onClick={showModel}>اعرض الإجابة النموذجية</GoldBtn>}
            {shown && idx < TEACH_ITEMS.length - 1 && <GoldBtn onClick={() => go(idx + 1)}>السؤال التالي</GoldBtn>}
            {shown && allDone && <QuietBtn onClick={onBack}>العودة إلى خريطة المحطات</QuietBtn>}
          </div>
        </div>
      </section>
    </RFrame>
  );
};
