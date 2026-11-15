/**
 * المحطة 5 — ملعب الصقور: مباراة كرة قدم بين قسمين، 8 جولات، سؤال مختلف لكل قسم في كل جولة،
 * ومؤقت 5 ثوانٍ لكل دور. الإجابة الصحيحة تحرّك الكرة نحو مرمى المنافس وتُسجَّل هدفًا.
 * سؤال القسم الثاني لا يظهر إلا بعد انتهاء دور القسم الأول وضغط «اعرض السؤال».
 * أهداف القسمين مستقلة عن نقاط الطالب الفردية.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DRAW_PHRASE, GOAL_PHRASES, MATCH_ROUNDS, MATCH_SECONDS, MISS_PHRASES, TIMEOUT_PHRASE, WIN_PHRASE } from './data';
import type { MassApi } from './state';
import { Banner, Choice, ConfirmBtn, GOLD, GoldBtn, QuietBtn, StationFrame, Txt, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { shuffle } from '../../engine/shared';
import { sounds } from '../../utils/audio';

type Phase = 'setup' | 'ready' | 'ask' | 'result' | 'final';
type Outcome = 'goal' | 'miss' | 'timeout';

const ROUNDS = MATCH_ROUNDS.length;
const TEAM_COLOR = ['#ddb455', '#6f9bf5'] as const;
const CENTER = 400;
// الكرة تتجه إلى مرمى المنافس: مرمى القسم الأول على اليمين فيهاجم اليسار، ومرمى الثاني على اليسار فيهاجم اليمين
const GOAL_X = [40, 760] as const;

const Ball: React.FC = () => (
  <g>
    <circle r="16" fill="#fff" stroke="#0b1838" strokeWidth="2" />
    <path d="M0 -7 L7 -2 L4 6 H-4 L-7 -2 Z" fill="#0b1838" />
    <path d="M0 -7 V-16 M7 -2 L15 -5 M4 6 L10 13 M-4 6 L-10 13 M-7 -2 L-15 -5" stroke="#0b1838" strokeWidth="1.6" />
  </g>
);

const Pitch: React.FC<{ ballX: number; goalSide: 'L' | 'R' | null; kick: number }> = ({ ballX, goalSide, kick }) => {
  const line = { stroke: '#fff', strokeOpacity: 0.85, strokeWidth: 3, fill: 'none' } as const;
  const net = (x: number) => (
    <g stroke="#fff" strokeOpacity="0.35" strokeWidth="1">
      {Array.from({ length: 7 }, (_, i) => <path key={`h${i}`} d={`M${x} ${172 + i * 13} h26`} />)}
      {Array.from({ length: 3 }, (_, i) => <path key={`v${i}`} d={`M${x + 8 + i * 8} 168 v84`} />)}
    </g>
  );
  return (
    <svg viewBox="0 0 800 420" className="w-full h-auto rounded-3xl border hairline" role="img" aria-label="ملعب كرة القدم">
      <defs>
        <linearGradient id="pitch-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0f3080" /><stop offset="1" stopColor="#0a1a44" /></linearGradient>
        <radialGradient id="goal-glow"><stop offset="0" stopColor="#f6e2a8" stopOpacity="0.9" /><stop offset="1" stopColor="#ddb455" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="420" fill="url(#pitch-bg)" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 100} y="0" width="100" height="420" fill={i % 2 ? '#ffffff' : '#000000'} opacity="0.035" />)}
      <rect x="30" y="24" width="740" height="372" rx="6" {...line} />
      <path d="M400 24 V396" {...line} />
      <circle cx="400" cy="210" r="58" {...line} /><circle cx="400" cy="210" r="4" fill="#fff" />
      <path d="M30 120 H140 V300 H30 M30 170 H72 V250 H30" {...line} />
      <path d="M770 120 H660 V300 H770 M770 170 H728 V250 H770" {...line} />
      {/* المرميان */}
      <g>
        <rect x="6" y="168" width="24" height="84" rx="3" fill="#13265a" stroke={TEAM_COLOR[1]} strokeWidth="4" />
        {net(4)}
        <rect x="770" y="168" width="24" height="84" rx="3" fill="#13265a" stroke={TEAM_COLOR[0]} strokeWidth="4" />
        {net(770)}
      </g>
      {goalSide !== null && (
        <circle key={kick} className="mass-burst" cx={goalSide === 'L' ? 18 : 782} cy="210" r="90" fill="url(#goal-glow)" />
      )}
      {/* لاعبان رمزيان */}
      <circle cx="540" cy="150" r="10" fill={TEAM_COLOR[0]} opacity="0.85" /><circle cx="560" cy="270" r="10" fill={TEAM_COLOR[0]} opacity="0.85" />
      <circle cx="260" cy="150" r="10" fill={TEAM_COLOR[1]} opacity="0.85" /><circle cx="240" cy="270" r="10" fill={TEAM_COLOR[1]} opacity="0.85" />
      <g style={{ transform: `translate(${ballX}px, 210px)`, transition: 'transform 0.8s cubic-bezier(0.25, 0.8, 0.35, 1)' }}>
        <Ball />
      </g>
    </svg>
  );
};

const Ring: React.FC<{ remain: number }> = ({ remain }) => {
  const frac = Math.max(0, Math.min(1, remain / (MATCH_SECONDS * 1000)));
  const low = remain <= 2000;
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-16 h-16 shrink-0" role="timer" aria-label={`متبقٍ ${Math.ceil(remain / 1000)} ثانية`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" stroke="#ffffff22" strokeWidth="6" />
        <circle cx="32" cy="32" r={R} fill="none" stroke={low ? '#fb7185' : GOLD} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
      </svg>
      <span className={`absolute inset-0 grid place-items-center font-display text-2xl ${low ? 'text-rose-300' : 'text-amber-300'}`}>{Math.ceil(remain / 1000)}</span>
    </div>
  );
};

export const Stadium: React.FC<{ api: MassApi; onBack: () => void }> = ({ api, onBack }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [names, setNames] = useState<[string, string]>(['القسم الأول', 'القسم الثاني']);
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [ballX, setBallX] = useState(CENTER);
  const [order, setOrder] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [line, setLine] = useState('');
  const [remain, setRemain] = useState(MATCH_SECONDS * 1000);
  const [goalSide, setGoalSide] = useState<'L' | 'R' | null>(null);
  const [kick, setKick] = useState(0);
  const endAt = useRef(0);
  const resolved = useRef(true);

  const q = MATCH_ROUNDS[round][turn];
  const nm = (t: number) => names[t].trim() || (t === 0 ? 'القسم الأول' : 'القسم الثاني');
  const sameNames = names[0].trim() !== '' && names[0].trim() === names[1].trim();

  const resolve = (di: number | null) => {
    if (resolved.current) return;
    resolved.current = true;
    setChosen(di);
    sounds.click();
    if (di === null) {
      setOutcome('timeout'); setLine(TIMEOUT_PHRASE); sounds.wrong();
    } else if (order[di] === q.a) {
      setOutcome('goal'); setLine(pick(GOAL_PHRASES));
      setScore(s => (turn === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
      setBallX(GOAL_X[turn]); setGoalSide(turn === 0 ? 'L' : 'R'); setKick(k => k + 1);
      sounds.correct(); goldBurst(70);
    } else {
      setOutcome('miss'); setLine(pick(MISS_PHRASES)); sounds.wrong();
    }
    setPhase('result');
  };

  // المؤقت: 5 ثوانٍ لكل دور
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;
  useEffect(() => {
    if (phase !== 'ask') return;
    const t = setInterval(() => {
      const rem = endAt.current - Date.now();
      setRemain(Math.max(0, rem));
      if (rem <= 0) { clearInterval(t); resolveRef.current(null); }
    }, 50);
    return () => clearInterval(t);
  }, [phase]);

  const showQuestion = () => {
    sounds.click();
    setOrder(q.fixed ? q.o.map((_, i) => i) : shuffle(q.o.map((_, i) => i)));
    setChosen(null); setOutcome(null);
    resolved.current = false;
    endAt.current = Date.now() + MATCH_SECONDS * 1000;
    setRemain(MATCH_SECONDS * 1000);
    setPhase('ask');
  };

  const next = () => {
    sounds.click();
    setBallX(CENTER); setGoalSide(null);
    if (turn === 0) { setTurn(1); setPhase('ready'); return; }
    if (round < ROUNDS - 1) { setRound(round + 1); setTurn(0); setPhase('ready'); return; }
    api.setMatch({ a: nm(0), b: nm(1), ga: score[0], gb: score[1] });
    if (score[0] !== score[1]) goldBurst(90);
    setPhase('final');
  };

  const restart = () => {
    setScore([0, 0]); setRound(0); setTurn(0); setBallX(CENTER); setGoalSide(null); setOutcome(null); setChosen(null);
    resolved.current = true;
    setPhase('setup');
  };

  const winner = useMemo(() => (score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1), [score]);
  const prevMatch = api.state.match;

  return (
    <StationFrame title="ملعب الصقور" quote="صافرة البداية! قسمان في مواجهة كيميائية... من يسجل الأهداف ويحسم المباراة؟" onBack={onBack}>
      {/* لوحة النتائج */}
      <div className="section-card rounded-3xl p-4 mb-4 flex items-center justify-between gap-3" role="status" aria-live="polite">
        <div className={`flex-1 min-w-0 text-center rounded-2xl p-2 border-2 transition-colors ${phase !== 'setup' && phase !== 'final' && turn === 0 ? 'border-amber-400 bg-amber-400/10' : 'border-transparent'}`}>
          <p className="text-[12px] text-slate-300">القسم الأول</p>
          <p className="font-display text-base sm:text-xl leading-tight break-words" style={{ color: TEAM_COLOR[0] }}>{nm(0)}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="font-display text-4xl sm:text-5xl text-white tabular-nums" dir="ltr">{score[1]} : {score[0]}</p>
          <p className="text-[12px] text-slate-300">{phase === 'setup' ? 'قبل المباراة' : phase === 'final' ? 'النتيجة النهائية' : `الجولة ${round + 1} من ${ROUNDS}`}</p>
        </div>
        <div className={`flex-1 min-w-0 text-center rounded-2xl p-2 border-2 transition-colors ${phase !== 'setup' && phase !== 'final' && turn === 1 ? 'border-sky-300 bg-sky-300/10' : 'border-transparent'}`}>
          <p className="text-[12px] text-slate-300">القسم الثاني</p>
          <p className="font-display text-base sm:text-xl leading-tight break-words" style={{ color: TEAM_COLOR[1] }}>{nm(1)}</p>
        </div>
      </div>

      <div className="relative">
        <Pitch ballX={ballX} goalSide={goalSide} kick={kick} />
        <span className="absolute top-2 right-3 sm:right-6 text-[11px] sm:text-sm font-display px-2 py-0.5 rounded-lg bg-slate-950/70 max-w-[38%] truncate" style={{ color: TEAM_COLOR[0] }}>مرمى {nm(0)}</span>
        <span className="absolute top-2 left-3 sm:left-6 text-[11px] sm:text-sm font-display px-2 py-0.5 rounded-lg bg-slate-950/70 max-w-[38%] truncate" style={{ color: TEAM_COLOR[1] }}>مرمى {nm(1)}</span>
        {outcome === 'goal' && phase === 'result' && (
          <div key={kick} className="mass-goal absolute inset-0 grid place-items-center pointer-events-none" aria-hidden="true">
            <span className="font-display text-5xl sm:text-7xl text-amber-300" style={{ textShadow: '0 0 28px rgba(221,180,85,0.9), 0 4px 0 #0b1838' }}>هدف! ⚽</span>
          </div>
        )}
      </div>

      <div className="mt-5">
        {phase === 'setup' && (
          <div className="section-card rounded-3xl p-5 sm:p-6">
            <h3 className="font-display text-2xl text-white">قبل صافرة البداية</h3>
            <p className="mt-1 text-slate-200 text-[15px] leading-loose">أدخل اسم كل قسم. ثماني جولات؛ في كل جولة يجيب كل قسم عن سؤال مختلف خلال {MATCH_SECONDS} ثوانٍ.</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {([0, 1] as const).map(t => (
                <label key={t} className="block text-sm text-slate-200">
                  اسم {t === 0 ? 'القسم الأول' : 'القسم الثاني'}
                  <input
                    value={names[t]}
                    onChange={e => setNames(n => (t === 0 ? [e.target.value.slice(0, 24), n[1]] : [n[0], e.target.value.slice(0, 24)]))}
                    maxLength={24}
                    className="mt-1 w-full h-12 rounded-xl border bg-slate-950/60 px-4 text-white text-base focus:outline-none focus:border-amber-400"
                    style={{ borderColor: `${TEAM_COLOR[t]}88` }}
                  />
                </label>
              ))}
            </div>
            {sameNames && <p className="mt-2 text-sm text-rose-300">اختر اسمين مختلفين للقسمين.</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <GoldBtn disabled={sameNames} onClick={() => { setNames(n => [n[0].trim() || 'القسم الأول', n[1].trim() || 'القسم الثاني']); setPhase('ready'); }}>🏟️ صافرة البداية</GoldBtn>
              {prevMatch && <span className="text-sm text-slate-300">آخر مباراة: {prevMatch.a} <span dir="ltr">{prevMatch.gb} - {prevMatch.ga}</span> {prevMatch.b}</span>}
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <div className="section-card rounded-3xl p-6 text-center animate-in">
            <p className="text-sm text-amber-300">الجولة {round + 1} من {ROUNDS}</p>
            <p className="mt-2 font-display text-3xl" style={{ color: TEAM_COLOR[turn] }}>دور {nm(turn)}</p>
            <p className="mt-2 text-slate-200">جهّزوا إجابتكم؛ سيظهر السؤال ولديكم {MATCH_SECONDS} ثوانٍ فقط.</p>
            <GoldBtn className="mt-5" onClick={showQuestion}>اعرض السؤال</GoldBtn>
          </div>
        )}

        {(phase === 'ask' || phase === 'result') && (
          <div className="section-card rounded-3xl p-5 sm:p-6 animate-in">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">الجولة {round + 1} · دور</p>
                <p className="font-display text-2xl" style={{ color: TEAM_COLOR[turn] }}>{nm(turn)}</p>
              </div>
              {phase === 'ask' && <Ring remain={remain} />}
            </div>
            <h3 className="mt-3 text-lg sm:text-xl leading-loose text-white">{q.q}</h3>
            <div className="mt-4 grid gap-2.5">
              {order.map((oi, di) => (
                <Choice
                  key={di}
                  onClick={() => resolve(di)}
                  disabled={phase === 'result'}
                  state={phase === 'ask' ? 'idle' : oi === q.a ? 'right' : di === chosen ? 'wrong' : 'dim'}
                >
                  <Txt>{q.o[oi]}</Txt>
                </Choice>
              ))}
            </div>
            {phase === 'result' && outcome && (
              <>
                <Banner tone={outcome === 'goal' ? 'ok' : 'no'} className="mt-4">
                  <p className="font-display text-lg">{line}</p>
                  {outcome !== 'goal' && <p className="text-[14px] text-slate-200">الإجابة الصحيحة: <b className="text-amber-300"><Txt>{q.o[q.a]}</Txt></b></p>}
                </Banner>
                <GoldBtn className="mt-4" onClick={next}>{turn === 0 ? `دور ${nm(1)}` : round < ROUNDS - 1 ? 'الجولة التالية' : 'صافرة النهاية'}</GoldBtn>
              </>
            )}
          </div>
        )}

        {phase === 'final' && (
          <div className="section-card rounded-3xl p-6 sm:p-8 text-center animate-in" role="status">
            <p className="text-sm text-amber-300">انتهت المباراة</p>
            <p className="mt-2 font-display text-4xl text-white tabular-nums">{nm(0)} <span className="text-amber-300" dir="ltr">{score[1]} - {score[0]}</span> {nm(1)}</p>
            {winner === null ? (
              <p className="mt-4 font-display text-2xl text-amber-300">«{DRAW_PHRASE}»</p>
            ) : (
              <>
                <p className="mt-4 font-display text-2xl" style={{ color: TEAM_COLOR[winner] }}>🏆 الفائز: {nm(winner)}</p>
                <p className="mt-2 text-lg leading-loose text-amber-200">«{WIN_PHRASE}»</p>
              </>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <GoldBtn onClick={restart}>مباراة جديدة</GoldBtn>
              <QuietBtn onClick={onBack}>العودة إلى الشاشة الرئيسية للمختبر</QuietBtn>
            </div>
          </div>
        )}

        {(phase === 'ready' || phase === 'ask' || phase === 'result') && (
          <div className="mt-4 flex justify-center">
            <ConfirmBtn label="إعادة المباراة من البداية" confirmLabel="اضغط مرة أخرى للتأكيد" onConfirm={restart} />
          </div>
        )}
      </div>
    </StationFrame>
  );
};
