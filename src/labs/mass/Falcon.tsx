/**
 * المحطة 2 — بصمة الكيميائي: لعبة تخمين حروف المصطلح. كل حرف خاطئ يضيف جزءًا من رسم صقر كرتوني
 * (الرأس، المنقار، العين، الجسم، الجناحان، الذيل، القدمان). اكتمال الرسم قبل كشف المصطلح = خسارة الجولة.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ARABIC_LETTERS, FALCON_PART_NAMES, FALCON_TERMS, NO_PHRASES, OK_PHRASES } from './data';
import { STATION_TASKS, type MassApi } from './state';
import { Banner, GOLD, GoldBtn, QuietBtn, StationFrame, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { shuffle } from '../../engine/shared';
import { sounds } from '../../utils/audio';

const MAX_WRONG = FALCON_PART_NAMES.length;
const BLUE = '#2f6fd6';
const NAVY = '#13265a';

/** كل جزء مرسوم بخطوط بسيطة بألوان الهوية. */
const PARTS: React.ReactNode[] = [
  <circle key="head" cx="100" cy="58" r="30" fill={BLUE} stroke={GOLD} strokeWidth="3" />,
  <path key="beak" d="M126 52 L158 62 L126 74 Z" fill={GOLD} stroke="#a87d2c" strokeWidth="2" strokeLinejoin="round" />,
  <g key="eye"><circle cx="112" cy="52" r="8" fill="#fff" /><circle cx="114" cy="52" r="3.6" fill="#0b1838" /><path d="M100 40 Q112 36 124 42" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" /></g>,
  <ellipse key="body" cx="100" cy="126" rx="34" ry="46" fill={NAVY} stroke={GOLD} strokeWidth="3" />,
  <g key="wings"><path d="M68 100 Q22 112 30 168 Q58 150 70 138 Z" fill={BLUE} stroke={GOLD} strokeWidth="3" strokeLinejoin="round" /><path d="M132 100 Q178 112 170 168 Q142 150 130 138 Z" fill={BLUE} stroke={GOLD} strokeWidth="3" strokeLinejoin="round" /></g>,
  <path key="tail" d="M82 166 L72 212 L100 200 L128 212 L118 166 Z" fill="#c8962e" stroke="#a87d2c" strokeWidth="3" strokeLinejoin="round" />,
  <g key="feet" stroke={GOLD} strokeWidth="4" strokeLinecap="round" fill="none"><path d="M88 170 V188 M88 188 l-9 6 M88 188 l0 8 M88 188 l9 6" /><path d="M112 170 V188 M112 188 l-9 6 M112 188 l0 8 M112 188 l9 6" /></g>,
];

export const FalconDrawing: React.FC<{ wrong: number }> = ({ wrong }) => (
  <svg viewBox="0 0 200 226" className="w-full h-full" role="img" aria-label={`رسم الصقر: ظهر ${wrong} من ${MAX_WRONG} أجزاء`}>
    <g opacity="0.12" stroke="#fff" strokeDasharray="3 4">{PARTS}</g>
    {PARTS.slice(0, wrong).map((p, i) => (
      <g key={i} className="mass-pop">{p}</g>
    ))}
  </svg>
);

const ROUND_COUNT = FALCON_TERMS.length;

export const Falcon: React.FC<{ api: MassApi; onBack: () => void }> = ({ api, onBack }) => {
  const doneRound = (r: number) => Boolean(api.state.awards[`falcon.${r}`]);
  const firstOpen = FALCON_TERMS.findIndex((_, r) => !doneRound(r));
  const [round, setRound] = useState(firstOpen < 0 ? ROUND_COUNT - 1 : firstOpen);
  const [attempts, setAttempts] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);

  const { term, hint } = FALCON_TERMS[round];
  const letters = useMemo(() => new Set(term.replace(/ /g, '')), [term]);
  // ترتيب لوحة الحروف يتغير بين الجولات وعند كل إعادة محاولة
  const keys = useMemo(() => shuffle(ARABIC_LETTERS), [round, attempts]); // eslint-disable-line react-hooks/exhaustive-deps
  const wrong = guessed.filter(l => !letters.has(l)).length;
  const won = [...letters].every(l => guessed.includes(l));
  const lost = !won && wrong >= MAX_WRONG;
  const over = won || lost;
  const recorded = doneRound(round);
  const allDone = FALCON_TERMS.every((_, r) => doneRound(r));

  const guess = useCallback((l: string) => {
    if (over || guessed.includes(l)) return;
    const hit = letters.has(l);
    const next = [...guessed, l];
    setGuessed(next);
    if (hit) {
      sounds.click();
      const full = [...letters].every(x => next.includes(x));
      if (full) {
        const a = api.award(`falcon.${round}`, true, attempts === 0);
        sounds.correct(); goldBurst(60);
        setMsg({ tone: 'ok', text: `${pick(OK_PHRASES.falcon)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
      } else setMsg(null);
    } else {
      sounds.wrong();
      const left = MAX_WRONG - (wrong + 1);
      setMsg({ tone: 'no', text: left > 0 ? pick(NO_PHRASES.falcon) : 'اكتمل رسم الصقر قبل أن تكشف المصطلح!' });
    }
  }, [over, guessed, letters, api, round, attempts, wrong]);

  // الكتابة من لوحة المفاتيح العربية
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key === 'أ' || e.key === 'إ' || e.key === 'آ' ? 'ا' : e.key === 'ى' ? 'ي' : e.key;
      if (ARABIC_LETTERS.includes(k)) guess(k);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guess]);

  const retry = () => { setAttempts(n => n + 1); setGuessed([]); setMsg(null); };
  const next = () => {
    if (lost && !recorded) api.award(`falcon.${round}`, false, false);
    if (round < ROUND_COUNT - 1) { setRound(round + 1); setAttempts(0); setGuessed([]); setMsg(null); }
  };

  const pts = STATION_TASKS.falcon.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);
  const words = term.split(' ');
  const lastRound = round === ROUND_COUNT - 1;
  const finished = allDone;

  return (
    <StationFrame title="بصمة الكيميائي" quote="حرف واحد قد يكشف المصطلح... فهل تستطيع إنقاذ صقر الكيمياء؟" points={pts} onBack={onBack}>
      <div className="flex justify-center gap-2 mb-4" aria-label="الجولات">
        {FALCON_TERMS.map((_, r) => (
          <span key={r} className={`h-9 px-4 rounded-full grid place-items-center text-sm border ${r === round ? 'border-amber-400 bg-amber-400/15 text-amber-200' : doneRound(r) ? 'border-amber-400/40 text-amber-300' : 'border-white/20 text-slate-300'}`}>
            الجولة {r + 1}{doneRound(r) ? (api.state.awards[`falcon.${r}`].ok ? ' ✓' : ' ✕') : ''}
          </span>
        ))}
      </div>

      <div className="grid md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-6 items-start">
        <div className="section-card rounded-3xl p-4 flex flex-col items-center">
          <div className="w-44 sm:w-56 aspect-[200/226]"><FalconDrawing wrong={Math.min(wrong, MAX_WRONG)} /></div>
          <p className="mt-2 text-slate-100" aria-live="polite">
            المحاولات المتبقية: <b className={`font-display text-2xl ${MAX_WRONG - wrong <= 2 ? 'text-rose-300' : 'text-amber-300'}`}>{Math.max(0, MAX_WRONG - wrong)}</b> من {MAX_WRONG}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5 min-h-[28px]" aria-label="أجزاء الصقر الظاهرة">
            {FALCON_PART_NAMES.map((n, i) => (
              <span key={n} className={`px-2 py-0.5 rounded-full text-[11px] ${i < wrong ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40' : 'text-slate-500 border border-white/10'}`}>{n}</span>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="section-card rounded-3xl p-5">
            <p className="text-[13px] text-amber-300">وصف المصطلح</p>
            <p className="mt-1 text-lg leading-loose text-white">«{hint}»</p>
            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3" dir="rtl" aria-label="خانات المصطلح">
              {words.map((w, wi) => (
                <div key={wi} className="flex gap-1.5">
                  {[...w].map((ch, ci) => {
                    const shown = guessed.includes(ch) || lost;
                    const miss = lost && !guessed.includes(ch);
                    return (
                      <span key={ci} className={`w-9 h-11 sm:w-11 sm:h-14 rounded-xl border-2 grid place-items-center font-display text-2xl sm:text-3xl ${shown ? (miss ? 'border-rose-400/60 text-rose-200 bg-rose-500/10' : 'border-amber-400 text-amber-200 bg-amber-400/10') : 'border-white/25 text-transparent bg-slate-950/40'}`}>
                        {shown ? ch : '·'}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2" dir="rtl" role="group" aria-label="لوحة الحروف">
            {keys.map(l => {
              const used = guessed.includes(l);
              const hit = used && letters.has(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => guess(l)}
                  disabled={used || over}
                  className={`h-11 sm:h-12 rounded-xl border font-display text-xl transition-colors ${hit ? 'border-amber-400 bg-amber-400/25 text-amber-100' : used ? 'border-rose-400/50 bg-rose-500/15 text-rose-200 line-through' : 'border-white/20 bg-slate-900/60 text-white hover:border-amber-400/70'} disabled:cursor-default`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          {msg && <Banner tone={msg.tone} className="mt-4">{msg.text}</Banner>}

          {lost && (
            <Banner tone="no" title="انتهت الجولة" className="mt-4">
              المصطلح الصحيح: <b className="text-amber-300 font-display text-xl">{term}</b>
            </Banner>
          )}

          {over && (
            <div className="mt-4 flex flex-wrap gap-3">
              {lost && !recorded && <GoldBtn onClick={retry}>إعادة المحاولة</GoldBtn>}
              {!lastRound && <QuietBtn onClick={next}>{won ? 'الجولة التالية' : 'تخطي إلى الجولة التالية'}</QuietBtn>}
              {lastRound && lost && !recorded && <QuietBtn onClick={() => api.award(`falcon.${round}`, false, false)}>إنهاء المحطة</QuietBtn>}
            </div>
          )}

          {finished && (
            <div className="mt-5 section-card rounded-3xl p-6 text-center animate-in" role="status">
              <p className="font-display text-2xl text-amber-300">🦅 انتهت المحطة!</p>
              <p className="mt-2 text-white">جمعتَ <b className="text-amber-300">{pts}</b> نقطة في بصمة الكيميائي.</p>
              <QuietBtn className="mt-4" onClick={onBack}>العودة إلى الشاشة الرئيسية للمختبر</QuietBtn>
            </div>
          )}
        </div>
      </div>
    </StationFrame>
  );
};
