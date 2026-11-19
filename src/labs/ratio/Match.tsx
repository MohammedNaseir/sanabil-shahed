/**
 * المحطة 5 — المباراة النهائية: منافسة بين فريقين، عشرة أسئلة مستقلة تتناوب بين الفريقين،
 * ولكل سؤال 30 ثانية (المؤقت الوحيد في المختبر). المعلمة تتحكم: بدء السؤال ثم الانتقال للتالي.
 * انتهاء الوقت = صافرة حكم وبطاقة حمراء. الفوز = تصفيق وصندوق كنز يُفتح وإعلان «بطل مختبر النسب الثابتة».
 */
import React, { useEffect, useRef, useState } from 'react';
import { DRAW_PHRASE, MATCH_QUESTIONS, MATCH_SECONDS, NO_PHRASES, OK_PHRASES, TIMEOUT_PHRASE, WIN_PHRASES } from './data';
import type { RatioApi } from './state';
import { Banner, Choice, ConfirmBtn, GOLD, GoldBtn, LETTERS, QuietBtn, RFrame, Txt, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { sounds } from '../../utils/audio';

type Phase = 'setup' | 'ready' | 'ask' | 'result' | 'final';
type Outcome = 'ok' | 'no' | 'timeout';
const TEAM = ['#ddb455', '#6f9bf5'] as const;
const TURN_POINTS = 10;

const Chest: React.FC<{ open: boolean }> = ({ open }) => (
  <svg viewBox="0 0 220 190" className="w-full h-auto" role="img" aria-label={open ? 'صندوق الكنز مفتوح' : 'صندوق الكنز مغلق'}>
    <defs><radialGradient id="chest-glow"><stop offset="0" stopColor="#f6e2a8" stopOpacity="0.95" /><stop offset="1" stopColor="#ddb455" stopOpacity="0" /></radialGradient></defs>
    <g opacity={open ? 1 : 0} style={{ transition: 'opacity 0.8s 0.4s' }}>
      <circle cx="110" cy="80" r="80" fill="url(#chest-glow)" />
      {[[80, 92], [104, 84], [130, 90], [152, 94], [92, 76], [118, 72], [140, 78]].map(([x, y], i) => (
        <g key={i}><ellipse cx={x} cy={y} rx="14" ry="6" fill="#ddb455" stroke="#a87d2c" strokeWidth="2" /><ellipse cx={x} cy={y - 2} rx="9" ry="3" fill="#f6e2a8" /></g>
      ))}
      <path d="M110 40 L124 54 L110 74 L96 54 Z" fill="#6f9bf5" stroke="#fff" strokeWidth="2" />
    </g>
    <rect x="30" y="98" width="160" height="72" rx="10" fill="#1f3f99" stroke={GOLD} strokeWidth="4" />
    <rect x="30" y="118" width="160" height="12" fill="#0b1838" opacity="0.5" />
    <rect x="98" y="108" width="24" height="30" rx="5" fill={GOLD} stroke="#a87d2c" strokeWidth="2" />
    <circle cx="110" cy="120" r="4" fill="#0b1838" />
    <g style={{ transform: open ? 'rotate(-38deg)' : 'rotate(0deg)', transformOrigin: '30px 98px', transition: 'transform 0.9s cubic-bezier(0.3, 1.3, 0.5, 1)' }}>
      <path d="M30 98 V78 Q30 52 110 52 Q190 52 190 78 V98 Z" fill="#2a4fb0" stroke={GOLD} strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 80 H190" stroke={GOLD} strokeWidth="3" />
    </g>
  </svg>
);

const Ring: React.FC<{ remain: number }> = ({ remain }) => {
  const frac = Math.max(0, Math.min(1, remain / (MATCH_SECONDS * 1000)));
  const low = remain <= 8000;
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0" role="timer" aria-label={`متبقٍ ${Math.ceil(remain / 1000)} ثانية`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#ffffff22" strokeWidth="8" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={low ? '#fb7185' : GOLD} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
      </svg>
      <span className={`absolute inset-0 grid place-items-center font-display text-5xl sm:text-6xl tabular-nums ${low ? 'text-rose-300' : 'text-amber-300'}`}>{Math.ceil(remain / 1000)}</span>
    </div>
  );
};

export const Match: React.FC<{ api: RatioApi; onBack: () => void }> = ({ api, onBack }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [names, setNames] = useState<[string, string]>(['الفريق الأول', 'الفريق الثاني']);
  const [i, setI] = useState(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [line, setLine] = useState('');
  const [remain, setRemain] = useState(MATCH_SECONDS * 1000);
  const endAt = useRef(0);
  const resolved = useRef(true);

  const q = MATCH_QUESTIONS[i];
  const turn = (i % 2) as 0 | 1;
  const nm = (t: number) => names[t].trim() || (t === 0 ? 'الفريق الأول' : 'الفريق الثاني');
  const sameNames = names[0].trim() !== '' && names[0].trim() === names[1].trim();

  const resolve = (pick_: number | null) => {
    if (resolved.current) return;
    resolved.current = true;
    setChosen(pick_);
    if (pick_ === null) {
      setOutcome('timeout'); setLine(TIMEOUT_PHRASE); sounds.whistle();
    } else if (pick_ === q.a) {
      setOutcome('ok'); setLine(pick(OK_PHRASES));
      setScore(s => (turn === 0 ? [s[0] + TURN_POINTS, s[1]] : [s[0], s[1] + TURN_POINTS]));
      sounds.correct(); sounds.applause(); goldBurst(70);
    } else {
      setOutcome('no'); setLine(pick(NO_PHRASES)); sounds.wrong();
    }
    setPhase('result');
  };

  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;
  useEffect(() => {
    if (phase !== 'ask') return;
    const t = setInterval(() => {
      const rem = endAt.current - Date.now();
      setRemain(Math.max(0, rem));
      if (rem <= 0) { clearInterval(t); resolveRef.current(null); }
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  const showQuestion = () => {
    sounds.click();
    setChosen(null); setOutcome(null);
    resolved.current = false;
    endAt.current = Date.now() + MATCH_SECONDS * 1000;
    setRemain(MATCH_SECONDS * 1000);
    setPhase('ask');
  };

  const next = () => {
    sounds.click();
    if (i < MATCH_QUESTIONS.length - 1) { setI(i + 1); setPhase('ready'); return; }
    api.setMatch({ a: nm(0), b: nm(1), ga: score[0], gb: score[1] });
    if (score[0] !== score[1]) { sounds.victory(); sounds.applause(3); goldBurst(100); }
    setPhase('final');
  };

  const restart = () => {
    resolved.current = true;
    setScore([0, 0]); setI(0); setChosen(null); setOutcome(null);
    setPhase('setup');
  };

  const winner = score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1;
  const prev = api.state.match;
  const playing = phase === 'ready' || phase === 'ask' || phase === 'result';

  return (
    <RFrame title="المباراة النهائية" quote="الوقت يمضي، والتفكير الدقيق وحده يصنع البطل!" onBack={onBack}>
      {/* لوحة النقاط */}
      <div className="section-card rounded-3xl p-4 mb-5 flex items-stretch justify-between gap-3" role="status" aria-live="polite">
        {([0, 1] as const).map(t => (
          <div key={t} className={`flex-1 min-w-0 text-center rounded-2xl p-3 border-2 transition-colors ${playing && turn === t ? 'bg-white/5' : 'border-transparent'}`}
            style={playing && turn === t ? { borderColor: TEAM[t] } : undefined}>
            <p className="text-[12px] text-slate-300">{t === 0 ? 'الفريق الأول' : 'الفريق الثاني'}{playing && turn === t ? ' · الدور عليه' : ''}</p>
            <p className="font-display text-lg sm:text-2xl leading-tight break-words" style={{ color: TEAM[t] }}>{nm(t)}</p>
            <p className="font-display text-4xl sm:text-5xl text-white tabular-nums">{score[t]}</p>
          </div>
        ))}
      </div>
      {playing && (
        <div className="mb-4 flex items-center justify-center gap-2" aria-label="تقدم المباراة">
          {MATCH_QUESTIONS.map((_, k) => <span key={k} className={`h-2 w-6 rounded-full ${k < i || (k === i && phase === 'result') ? 'bg-amber-400' : k === i ? 'bg-amber-200 animate-pulse' : 'bg-white/15'}`} />)}
          <span className="ms-2 text-sm text-slate-300">السؤال {i + 1} من {MATCH_QUESTIONS.length}</span>
        </div>
      )}

      {phase === 'setup' && (
        <div className="section-card rounded-3xl p-5 sm:p-7 max-w-3xl mx-auto">
          <h3 className="font-display text-2xl text-white">قبل صافرة البداية</h3>
          <p className="mt-1 text-[15px] leading-loose text-slate-200">أدخل اسم كل متنافس أو فريق. عشرة أسئلة تتناوب بينهما، ولكل سؤال {MATCH_SECONDS} ثانية فقط.</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {([0, 1] as const).map(t => (
              <label key={t} className="block text-sm text-slate-200">
                اسم {t === 0 ? 'الفريق الأول' : 'الفريق الثاني'}
                <input value={names[t]} maxLength={24}
                  onChange={e => setNames(n => (t === 0 ? [e.target.value.slice(0, 24), n[1]] : [n[0], e.target.value.slice(0, 24)]))}
                  className="mt-1 w-full h-12 rounded-xl border bg-slate-950/60 px-4 text-white text-lg focus:outline-none focus:border-amber-400" style={{ borderColor: `${TEAM[t]}88` }} />
              </label>
            ))}
          </div>
          {sameNames && <p className="mt-2 text-sm text-rose-300">اختر اسمين مختلفين.</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <GoldBtn disabled={sameNames} onClick={() => { setNames(n => [n[0].trim() || 'الفريق الأول', n[1].trim() || 'الفريق الثاني']); setPhase('ready'); }}>🏆 ابدأ المباراة</GoldBtn>
            {prev && <span className="text-sm text-slate-300">آخر مباراة: {prev.a} <span dir="ltr">{prev.gb} - {prev.ga}</span> {prev.b}</span>}
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <div className="section-card rounded-3xl p-7 text-center max-w-3xl mx-auto animate-in">
          <p className="text-sm text-amber-300">السؤال {i + 1} من {MATCH_QUESTIONS.length}</p>
          <p className="mt-2 font-display text-3xl sm:text-4xl" style={{ color: TEAM[turn] }}>الدور على {nm(turn)}</p>
          <p className="mt-2 text-slate-200">عندما تضغط المعلمة «اعرض السؤال» يبدأ العد التنازلي: {MATCH_SECONDS} ثانية.</p>
          <GoldBtn className="mt-5" onClick={showQuestion}>اعرض السؤال</GoldBtn>
        </div>
      )}

      {(phase === 'ask' || phase === 'result') && (
        <div className="section-card rounded-3xl p-5 sm:p-7 max-w-4xl mx-auto animate-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">يجيب الآن</p>
              <p className="font-display text-2xl sm:text-3xl" style={{ color: TEAM[turn] }}>{nm(turn)}</p>
            </div>
            {phase === 'ask' ? <Ring remain={remain} /> : outcome === 'timeout' && (
              <div className="mass-pop w-16 h-24 rounded-lg bg-rose-600 border-2 border-white/80 shadow-xl rotate-6 grid place-items-center text-white text-xs font-bold" aria-label="بطاقة حمراء">بطاقة حمراء</div>
            )}
          </div>
          <h3 className="mt-3 text-xl sm:text-2xl leading-[2] text-white">{q.q}</h3>
          <div className="mt-4 grid gap-2.5">
            {q.o.map((o, k) => (
              <Choice key={k} letter={LETTERS[k]} className="text-base sm:text-lg" onClick={() => resolve(k)} disabled={phase === 'result'}
                state={phase === 'ask' ? 'idle' : k === q.a ? 'right' : k === chosen ? 'wrong' : 'dim'}>
                <Txt>{o}</Txt>
              </Choice>
            ))}
          </div>
          {phase === 'result' && outcome && (
            <>
              <Banner tone={outcome === 'ok' ? 'ok' : 'no'} className="mt-4">
                <p className="font-display text-lg">{outcome === 'ok' ? `${line} +${TURN_POINTS} لفريقكم` : line}</p>
                {outcome !== 'ok' && <p className="text-[15px] text-slate-100 mt-1">الإجابة الصحيحة: <b className="text-amber-300">{LETTERS[q.a]}. <Txt>{q.o[q.a]}</Txt></b></p>}
                <p className="text-[14px] text-slate-200 mt-1">{q.e}</p>
              </Banner>
              <GoldBtn className="mt-4" onClick={next}>{i < MATCH_QUESTIONS.length - 1 ? `السؤال التالي ← ${nm(((i + 1) % 2) as 0 | 1)}` : 'صافرة النهاية'}</GoldBtn>
            </>
          )}
        </div>
      )}

      {phase === 'final' && (
        <div className="section-card rounded-[30px] p-6 sm:p-9 text-center max-w-3xl mx-auto animate-in" role="status">
          <div className="max-w-[260px] mx-auto"><Chest open /></div>
          <p className="mt-1 text-sm text-amber-300">انتهت المباراة</p>
          <p className="mt-2 font-display text-3xl sm:text-4xl text-white">{nm(0)} <span className="text-amber-300 tabular-nums" dir="ltr">{score[1]} - {score[0]}</span> {nm(1)}</p>
          {winner === null ? (
            <p className="mt-4 font-display text-2xl text-amber-300">«{DRAW_PHRASE}»</p>
          ) : (
            <>
              <p className="mt-4 font-display text-3xl sm:text-4xl" style={{ color: TEAM[winner] }}>بطل مختبر النسب الثابتة: {nm(winner)}</p>
              <p className="mt-2 text-lg text-amber-200">«{WIN_PHRASES[(score[0] + score[1]) % WIN_PHRASES.length]}»</p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <GoldBtn onClick={restart}>مباراة جديدة</GoldBtn>
            <QuietBtn onClick={onBack}>العودة إلى خريطة المحطات</QuietBtn>
          </div>
        </div>
      )}

      {playing && (
        <div className="mt-4 flex justify-center">
          <ConfirmBtn label="إعادة المباراة من البداية" confirmLabel="اضغط مرة أخرى للتأكيد" onConfirm={restart} />
        </div>
      )}
    </RFrame>
  );
};
