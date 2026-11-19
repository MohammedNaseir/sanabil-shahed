/**
 * المحطة 1 — عجلة الصقور: عجلة بعشرة قطاعات مرقّمة تتوقف على سؤال لم يُحلّ بعد.
 * بلا مؤقت؛ زر «تلميح» لا يكشف الإجابة؛ بعد الاختيار يظهر التصحيح والتفسير ولا ينتقل شيء تلقائيًا.
 */
import React, { useEffect, useRef, useState } from 'react';
import { NO_PHRASES, OK_PHRASES, WHEEL_QUESTIONS } from './data';
import { STATION_TASKS, type RatioApi } from './state';
import { Banner, Choice, GOLD, GoldBtn, LETTERS, QuietBtn, RFrame, Txt, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { sounds } from '../../utils/audio';
import { useSafeTimeouts } from '../../utils/draft';

const N = WHEEL_QUESTIONS.length;
const SECTOR = 360 / N;
const SPIN_MS = 4000;
const COLORS = ['#1f3f99', '#c8962e', '#2f6fd6', '#a82a3d', '#3b4fb8'];

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
};
const sectorPath = (k: number, r: number) => {
  const [x0, y0] = polar(k * SECTOR, r);
  const [x1, y1] = polar((k + 1) * SECTOR, r);
  return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
};

const WheelSvg: React.FC<{ res: Record<number, boolean | undefined> }> = ({ res }) => (
  <svg viewBox="-112 -112 224 224" className="w-full h-full" role="img" aria-label="عجلة الصقور">
    <circle r="111" fill="#0b1838" />
    {WHEEL_QUESTIONS.map((_, k) => {
      const done = res[k] !== undefined;
      const mid = k * SECTOR + SECTOR / 2;
      const [tx, ty] = polar(mid, 80);
      return (
        <g key={k}>
          <path d={sectorPath(k, 104)} fill={done ? (res[k] ? '#55607a' : '#4a3340') : COLORS[k % COLORS.length]} stroke="#0b1838" strokeWidth="1.5" />
          <g transform={`translate(${tx} ${ty}) rotate(${mid})`}>
            <text textAnchor="middle" dominantBaseline="central" fontSize="18" fontWeight="900" fill={k % 5 === 1 && !done ? '#0b1838' : '#fff'} fontFamily="Cairo, sans-serif">
              {done ? (res[k] ? '✓' : '✕') : k + 1}
            </text>
          </g>
        </g>
      );
    })}
    <circle r="104" fill="none" stroke={GOLD} strokeWidth="4" />
    {WHEEL_QUESTIONS.map((_, k) => {
      const [x, y] = polar(k * SECTOR, 104);
      return <circle key={k} cx={x} cy={y} r="3" fill="#f5d98a" />;
    })}
    <circle r="22" fill="#0b1838" stroke={GOLD} strokeWidth="3" />
    <text textAnchor="middle" dominantBaseline="central" fontSize="20">🧪</text>
  </svg>
);

export const Wheel: React.FC<{ api: RatioApi; onBack: () => void }> = ({ api, onBack }) => {
  const later = useSafeTimeouts();
  const res: Record<number, boolean | undefined> = {};
  WHEEL_QUESTIONS.forEach((_, k) => { const a = api.state.awards[`wheel.${k}`]; if (a) res[k] = a.ok; });
  const answered = Object.keys(res).length;
  const allDone = answered === N;

  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [cur, setCur] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [fb, setFb] = useState<{ ok: boolean; title: string; pts: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const spun = useRef(false);

  useEffect(() => {
    if (cur == null || !spun.current) return;
    const el = cardRef.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [cur]);

  const spin = () => {
    if (spinning || allDone || (cur != null && chosen == null)) return;
    const open = WHEEL_QUESTIONS.map((_, k) => k).filter(k => res[k] === undefined);
    if (!open.length) return;
    const k = open[Math.floor(Math.random() * open.length)];
    const jitter = (Math.random() - 0.5) * (SECTOR - 12);
    const target = (((-(k * SECTOR + SECTOR / 2) + jitter) % 360) + 360) % 360;
    const delta = (target - (rot % 360) + 360) % 360;
    sounds.click(); sounds.spin(SPIN_MS);
    spun.current = true;
    setCur(null); setChosen(null); setFb(null); setHintShown(false);
    setSpinning(true);
    setRot(rot + 360 * 5 + delta);
    later(() => { setSpinning(false); setCur(k); }, SPIN_MS);
  };

  const answer = (i: number) => {
    if (cur == null || chosen != null) return;
    const ok = i === WHEEL_QUESTIONS[cur].a;
    const a = api.award(`wheel.${cur}`, ok, !hintShown);
    setChosen(i);
    if (ok) { sounds.correct(); goldBurst(); } else sounds.wrong();
    setFb({ ok, title: pick(ok ? OK_PHRASES : NO_PHRASES), pts: a.pts });
  };

  const q = cur != null ? WHEEL_QUESTIONS[cur] : null;
  const pts = STATION_TASKS.wheel.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);
  const correctN = Object.values(res).filter(Boolean).length;

  return (
    <RFrame title="عجلة الصقور" quote="أدر العجلة، واستعد للسؤال! خذ وقتك، فالدقة أهم من السرعة." points={pts} onBack={onBack}>
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
        <div className="flex flex-col items-center lg:sticky lg:top-24">
          <div className="relative w-full max-w-[360px] aspect-square">
            <svg viewBox="0 0 40 44" className="absolute left-1/2 -translate-x-1/2 -top-2 w-9 h-10 z-10 drop-shadow" aria-hidden="true">
              <path d="M20 42 L4 6 Q20 -2 36 6 Z" fill={GOLD} stroke="#0b1838" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
            <div className="w-full h-full rounded-full" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.12, 1)` : 'none', boxShadow: '0 0 40px rgba(221,180,85,0.25)' }}>
              <WheelSvg res={res} />
            </div>
            {fb?.ok && <div key={cur} className="mass-burst absolute inset-6 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(246,226,168,0.7), transparent 65%)' }} aria-hidden="true" />}
          </div>
          <div className="mt-4 flex items-center gap-4 text-slate-100" aria-live="polite">
            <span>حُلّ <b className="text-amber-300 font-display text-xl">{answered}</b> من {N}</span>
            <span className="text-slate-400">·</span>
            <span>صحيح <b className="text-amber-300 font-display text-xl">{correctN}</b></span>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5" aria-label="مؤشر الأسئلة المحلولة">
            {WHEEL_QUESTIONS.map((_, k) => (
              <span key={k} className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${res[k] === undefined ? 'border border-white/25 text-slate-300' : res[k] ? 'bg-amber-400 text-slate-950' : 'bg-rose-500/80 text-white'}`}>{k + 1}</span>
            ))}
          </div>
          {!allDone && (
            <GoldBtn onClick={spin} disabled={spinning || (q != null && chosen == null)} className="mt-4 min-w-[200px]">
              {spinning ? 'العجلة تدور…' : '🎡 أدر العجلة'}
            </GoldBtn>
          )}
        </div>

        <div className="min-w-0">
          {spinning && <Banner tone="info">العجلة تدور… أين ستتوقف؟</Banner>}
          {!spinning && !q && !allDone && <Banner tone="info">اضغط «أدر العجلة» لتتوقف عند رقم سؤال. لا يوجد مؤقت، فاقرأ وناقش وخذ وقتك.</Banner>}

          {q && cur != null && (
            <div ref={cardRef} className="scroll-mt-24 section-card rounded-3xl p-5 sm:p-7 animate-in">
              <p className="text-[13px] text-amber-300">السؤال رقم {cur + 1}{cur === N - 1 ? ' · تحدي المحقق 🔎' : ''}</p>
              <h3 className="mt-2 text-xl sm:text-2xl leading-[2] text-white">{q.q}</h3>
              {q.ctx && <p className="mt-2 inline-block rounded-xl bg-slate-950/50 border hairline px-4 py-1.5 font-mono text-xl text-white" dir="ltr">{q.ctx}</p>}
              <div className="mt-4 space-y-2.5">
                {q.o.map((o, i) => (
                  <Choice key={i} letter={LETTERS[i]} onClick={() => answer(i)} disabled={chosen != null}
                    className="text-base sm:text-lg"
                    state={chosen == null ? 'idle' : i === q.a ? 'right' : i === chosen ? 'wrong' : 'dim'}>
                    <Txt>{o}</Txt>
                  </Choice>
                ))}
              </div>

              {chosen == null && (
                <div className="mt-4">
                  {!hintShown
                    ? <QuietBtn onClick={() => setHintShown(true)}>💡 تلميح</QuietBtn>
                    : <Banner tone="info" title="تلميح">{q.hint}</Banner>}
                  {!hintShown && <p className="mt-1.5 text-[12px] text-slate-400">التلميح لا يكشف الإجابة، لكن الإجابة بلا تلميح تمنح +5 نقاط.</p>}
                </div>
              )}

              {fb && (
                <Banner tone={fb.ok ? 'ok' : 'no'} title={`${fb.title} ${fb.pts ? `+${fb.pts} نقطة` : ''}`} className="mt-4">
                  {!fb.ok && <p>الإجابة الصحيحة: <b className="text-amber-300">{LETTERS[q.a]}. <Txt>{q.o[q.a]}</Txt></b></p>}
                  {!fb.ok && <p className="text-slate-200">💡 {q.hint}</p>}
                  <p>{q.e}</p>
                </Banner>
              )}
            </div>
          )}

          {allDone && (
            <div className="mt-4 section-card rounded-3xl p-6 sm:p-8 text-center animate-in" role="status">
              <p className="font-display text-3xl text-amber-300">🏁 اكتملت العجلة!</p>
              <p className="mt-3 text-lg text-white">أجبتَ عن {correctN} من {N} بشكل صحيح، وجمعتَ <b className="text-amber-300">{pts}</b> نقطة.</p>
              <QuietBtn className="mt-5" onClick={onBack}>العودة إلى خريطة المحطات</QuietBtn>
            </div>
          )}
        </div>
      </div>
    </RFrame>
  );
};
