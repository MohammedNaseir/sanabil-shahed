import React, { useState, useEffect, useRef } from 'react';
import { useGameDraft, useAutoSaveDraft, useSafeTimeouts, isPageHidden } from '../../utils/draft';
import { ResumeBanner } from '../ResumeBanner';
import { Flame, Scale, ChevronUp, ChevronDown, Sparkles, Check, AlertCircle, HelpCircle } from 'lucide-react';
import confetti from '../../utils/confetti';
import {
  FURNACE_MCQ,
  BALANCE_REACTIONS,
  MOLECULE_ATOMS,
  MYSTERY_ELEMENTS,
  FurnaceMcq,
  BalanceReaction,
  MysteryElement,
  getRandomCorrectPhrase,
  getRandomWrongPhrase
} from '../../data/siliconContent';
import { sounds } from '../../utils/audio';

interface GameFurnaceProps {
  onFinish: (score: number) => void;
  onExit: () => void;
}

type FurnaceMode = 'mcq' | 'balance' | 'whoAmI' | 'end';
interface FurnaceDraft {
  subMode: FurnaceMode;
  rxIndex: number;
  coefficients: number[];
  whoRounds: number[];
  currentWhoRound: number;
  clueCount: number;
  whoTimer: number;
  disabledWhoOptions: number[];
  score: number;
}

const BALANCE_HINT = 'اضغط على ▲ و ▼ لتعديل معاملات كل مركب حتى يتساوى عدد الذرات.';

export const GameFurnace: React.FC<GameFurnaceProps> = ({ onFinish, onExit }) => {
  const draft = useGameDraft<FurnaceDraft>('furnace');
  const d = draft.initial && draft.initial.subMode !== 'end' ? draft.initial : null;
  const later = useSafeTimeouts();
  // Game Modes: 'mcq' -> 'balance' -> 'whoAmI' -> 'end'
  const [subMode, setSubMode] = useState<FurnaceMode>(d?.subMode ?? 'mcq');
  const [rxIndex, setRxIndex] = useState(d?.rxIndex ?? 0); // 0 or 1 for the 2 equations

  // Balancing State
  const [coefficients, setCoefficients] = useState<number[]>(d?.coefficients ?? [1, 1, 1, 1]);
  const [balanceMessage, setBalanceMessage] = useState(d?.subMode === 'balance' ? BALANCE_HINT : '');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [isIgnited, setIsIgnited] = useState(false);
  const [mcqAnswered, setMcqAnswered] = useState(false);

  // Who Am I state
  const [whoRounds] = useState<number[]>(() => d?.whoRounds ?? [0, 1, 2, 0, 1, 2].sort(() => Math.random() - 0.5));
  const [currentWhoRound, setCurrentWhoRound] = useState(d?.currentWhoRound ?? 0);
  const [clueCount, setClueCount] = useState(d?.clueCount ?? 1);
  const [whoTimer, setWhoTimer] = useState(d?.whoTimer ?? 20);
  const [disabledWhoOptions, setDisabledWhoOptions] = useState<number[]>(d?.disabledWhoOptions ?? []);
  const [whoAnswerLocked, setWhoAnswerLocked] = useState(false);

  // Total Score
  const [score, setScore] = useState(d?.score ?? 0);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // لقطة الحفظ: أي خطوة أُجيب عنها تُحفظ كأنها انتقلت للخطوة التالية حتى لا تُحتسب مرتين
  const freshRound = (round: number) => ({ currentWhoRound: round, clueCount: 1, whoTimer: 20, disabledWhoOptions: [] as number[] });
  const snapshot = ((): FurnaceDraft | null => {
    const base = { subMode, rxIndex, coefficients, whoRounds, currentWhoRound, clueCount, whoTimer, disabledWhoOptions, score };
    if (subMode === 'end') return null;
    if (subMode === 'mcq' && mcqAnswered) return { ...base, subMode: 'balance', coefficients: [1, 1, 1, 1] };
    if (subMode === 'balance' && isIgnited) {
      return rxIndex + 1 < FURNACE_MCQ.length
        ? { ...base, subMode: 'mcq', rxIndex: rxIndex + 1, coefficients: [1, 1, 1, 1] }
        : { ...base, subMode: 'whoAmI', ...freshRound(0) };
    }
    if (subMode === 'whoAmI' && whoAnswerLocked) {
      return currentWhoRound + 1 < whoRounds.length ? { ...base, ...freshRound(currentWhoRound + 1) } : null;
    }
    return base;
  })();
  useAutoSaveDraft<FurnaceDraft>(draft.save, snapshot);

  const currentMcq: FurnaceMcq = FURNACE_MCQ[rxIndex];
  const currentReaction: BalanceReaction = BALANCE_REACTIONS[rxIndex];

  // ================= PHASE 1: MCQ & BALANCING =================

  const handleMcqAnswer = (chosenIndex: number) => {
    if (mcqAnswered) return;
    setMcqAnswered(true);
    sounds.click();
    if (chosenIndex === currentMcq.correctIndex) {
      sounds.correct();
      // Teacher rule: +1 point!
      setScore(s => s + 1);
      setFeedbackMsg({ text: getRandomCorrectPhrase(), isCorrect: true });
    } else {
      sounds.wrong();
      setFeedbackMsg({ text: getRandomWrongPhrase(), isCorrect: false });
    }
    // Proceed to balancing this reaction
    setCoefficients([1, 1, 1, 1]);
    setBalanceMessage(BALANCE_HINT);
    setIsIgnited(false);
    later(() => {
      setFeedbackMsg(null);
      setMcqAnswered(false);
      setSubMode('balance');
    }, 1500);
  };

  const changeCoeff = (index: number, delta: number) => {
    if (isIgnited) return;
    sounds.click();
    setCoefficients(prev => {
      const copy = [...prev];
      copy[index] = Math.min(6, Math.max(1, copy[index] + delta));
      return copy;
    });
  };

  // Calculate atom totals
  const speciesList = currentReaction ? [...currentReaction.reactants, ...currentReaction.products] : [];
  const splitIndex = currentReaction ? currentReaction.reactants.length : 2;

  const countAtoms = (start: number, end: number) => {
    const counts: Record<string, number> = {};
    for (let j = start; j < end; j++) {
      const spec = speciesList[j];
      const coeff = coefficients[j] || 1;
      const atoms = MOLECULE_ATOMS[spec] || {};
      for (const [elem, num] of Object.entries(atoms)) {
        counts[elem] = (counts[elem] || 0) + num * coeff;
      }
    }
    return counts;
  };

  const leftCounts = countAtoms(0, splitIndex);
  const rightCounts = countAtoms(splitIndex, speciesList.length);
  const allElements = Array.from(new Set([...Object.keys(leftCounts), ...Object.keys(rightCounts)]));

  const totalLeft = Object.values(leftCounts).reduce((a, b) => a + b, 0);
  const totalRight = Object.values(rightCounts).reduce((a, b) => a + b, 0);
  const scaleTilt = Math.max(-25, Math.min(25, (totalRight - totalLeft) * 4));

  const handleIgnite = () => {
    if (isIgnited) return;

    // Check if every element matches
    const isBalanced = allElements.every(el => (leftCounts[el] || 0) === (rightCounts[el] || 0));

    if (!isBalanced) {
      sounds.wrong();
      setBalanceMessage('⚖️ الميزان مائل! عدد ذرات العناصر غير متساوٍ بين المتفاعلات والنواتج.');
      setFeedbackMsg({ text: getRandomWrongPhrase(), isCorrect: false });
      return;
    }

    // Check if simplest ratio
    const matchesTarget = coefficients.every((val, idx) => val === currentReaction.balancedCoeffs[idx]);
    if (!matchesTarget) {
      sounds.wrong();
      setBalanceMessage('الذرات متساوية، لكن المعادلة ليست بأبسط نسبة — قسّم المعاملات لأبسط أعداد صحيحة.');
      return;
    }

    // Successful Ignition: +1 point
    sounds.furnaceIgnite();
    setIsIgnited(true);
    setScore(s => s + 1);
    setBalanceMessage('🔥🔥 اشتعل الفرن بنجاح! المعادلة الكيميائية موزونة تماماً.');
    setFeedbackMsg({ text: getRandomCorrectPhrase(), isCorrect: true });

    later(() => {
      setFeedbackMsg(null);
      setIsIgnited(false);
      if (rxIndex + 1 < FURNACE_MCQ.length) {
        setRxIndex(r => r + 1);
        setSubMode('mcq');
      } else {
        // Proceed to Phase 2: Who am I
        setSubMode('whoAmI');
        startWhoRound(0);
      }
    }, 2000);
  };

  // ================= PHASE 2: WHO AM I =================

  const startWhoRound = (roundIdx: number) => {
    setCurrentWhoRound(roundIdx);
    setClueCount(1);
    setWhoTimer(20);
    setDisabledWhoOptions([]);
    setWhoAnswerLocked(false);
  };

  useEffect(() => {
    if (subMode !== 'whoAmI' || whoAnswerLocked) return;

    timerRef.current = setInterval(() => {
      setWhoTimer(prev => {
        if (isPageHidden()) return prev; // المؤقت يتوقف عند إخفاء الصفحة
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleWhoTimeout();
          return 0;
        }
        const newTime = prev - 1;
        // Reveal next clue every 5 seconds elapsed
        const elapsed = 20 - newTime;
        const targetClues = Math.min(4, 1 + Math.floor(elapsed / 5));
        setClueCount(targetClues);
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [subMode, currentWhoRound, whoAnswerLocked]);

  const handleWhoTimeout = () => {
    setWhoAnswerLocked(true);
    sounds.wrong();
    later(() => {
      if (currentWhoRound + 1 < whoRounds.length) {
        startWhoRound(currentWhoRound + 1);
      } else {
        finishFurnace();
      }
    }, 1500);
  };

  const handleWhoGuess = (chosenElementIndex: number) => {
    if (whoAnswerLocked || disabledWhoOptions.includes(chosenElementIndex)) return;

    const targetElementIndex = whoRounds[currentWhoRound];

    if (chosenElementIndex === targetElementIndex) {
      sounds.correct();
      setWhoAnswerLocked(true);
      if (timerRef.current) clearInterval(timerRef.current);

      // Teacher rule: +1 point per correct answer!
      setScore(s => s + 1);
      setFeedbackMsg({ text: getRandomCorrectPhrase(), isCorrect: true });

      later(() => {
        setFeedbackMsg(null);
        if (currentWhoRound + 1 < whoRounds.length) {
          startWhoRound(currentWhoRound + 1);
        } else {
          finishFurnace();
        }
      }, 1600);
    } else {
      sounds.wrong();
      setFeedbackMsg({ text: getRandomWrongPhrase(), isCorrect: false });
      setDisabledWhoOptions(prev => [...prev, chosenElementIndex]);
    }
  };

  const finishFurnace = () => {
    setSubMode('end');
    draft.finish();
    sounds.victory();
    confetti({ disableForReducedMotion: true, particleCount: 100, spread: 80, origin: { y: 0.6 } });
    onFinish(scoreRef.current);
  };

  const currentWhoTarget = MYSTERY_ELEMENTS[whoRounds[currentWhoRound]];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* HUD Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold text-white">
            المحطة 4: فرن الاستخلاص الكيميائي
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            {subMode === 'whoAmI' ? `من أنا؟ (${currentWhoRound + 1}/6)` : `المعادلة (${rxIndex + 1}/2)`}
          </span>
          <span className="text-amber-300 font-black text-base bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-400/40">
            ⭐ {score}
          </span>
        </div>
      </div>

      {/* PHASE 1: MCQ SECTION */}
      {subMode === 'mcq' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-orange-500/40 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-orange-400 block">
              {currentMcq.prompt}
            </span>
            <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xl sm:text-2xl font-black text-amber-300 border border-slate-800" dir="ltr">
              {currentMcq.equation}
            </div>
            <p className="text-sm font-bold text-slate-300">{currentMcq.subPrompt}</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {currentMcq.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleMcqAnswer(idx)}
                className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 hover:border-orange-400 text-white font-black text-sm sm:text-base transition-all text-center"
              >
                {opt}
              </button>
            ))}
          </div>

          {feedbackMsg && (
            <div className={`p-3 rounded-xl border text-center text-xs sm:text-sm font-black animate-in fade-in ${
              feedbackMsg.isCorrect ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300' : 'bg-rose-950/80 border-rose-400 text-rose-300'
            }`}>
              {feedbackMsg.text}
            </div>
          )}
        </div>
      )}

      {/* PHASE 1: STOICHIOMETRY BALANCING SECTION */}
      {subMode === 'balance' && (
        <div className="p-4 sm:p-8 rounded-3xl bg-slate-900 border-2 border-orange-500/40 shadow-2xl space-y-5 sm:space-y-6 animate-in fade-in">
          
          <div className="text-center space-y-1">
            <span className="text-[11px] sm:text-xs font-black text-orange-400">⚖️ موازنة معادلة الاستخلاص</span>
            <h3 className="text-sm sm:text-lg font-black text-white">
              غيّر المعاملات حتى تتساوى ذرات كل عنصر في الطرفين ثم أشعل الفرن!
            </h3>
          </div>

          {/* Equation Builder */}
          <div className="flex items-center justify-center gap-1 sm:gap-3 flex-wrap p-3 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800" dir="ltr">
            {speciesList.map((spec, j) => (
              <React.Fragment key={j}>
                {j === splitIndex ? (
                  <span className="text-xl sm:text-3xl font-black text-orange-400 px-0.5 sm:px-1">→</span>
                ) : j > 0 ? (
                  <span className="text-lg sm:text-2xl font-bold text-slate-500">+</span>
                ) : null}

                <div className="flex flex-col items-center bg-slate-900 border border-slate-700 rounded-lg sm:rounded-xl p-1.5 sm:p-2 min-w-[54px] sm:min-w-[72px] shadow-md">
                  <button
                    onClick={() => changeCoeff(j, 1)}
                    disabled={isIgnited}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  <span className="text-lg sm:text-2xl font-black text-amber-300 my-0.5">
                    {coefficients[j]}
                  </span>

                  <span className="text-[11px] sm:text-sm font-bold text-slate-200 font-mono">
                    {spec}
                  </span>

                  <button
                    onClick={() => changeCoeff(j, -1)}
                    disabled={isIgnited}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Tilt Scale Graphic */}
          <div className="text-center">
            <div
              className="text-4xl inline-block transition-transform duration-300"
              style={{ transform: `rotate(${scaleTilt}deg)` }}
            >
              ⚖️
            </div>
          </div>

          {/* Atomic Count Table */}
          <div className="space-y-2">
            {allElements.map(elem => {
              const left = leftCounts[elem] || 0;
              const right = rightCounts[elem] || 0;
              const isMatch = left === right;

              return (
                <div
                  key={elem}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold ${
                    isMatch
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span>ذرات {elem}</span>
                  <div className="flex items-center gap-2">
                    <span>متفاعلات: {left} | نواتج: {right}</span>
                    <span>{isMatch ? '✅' : '❌'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback message */}
          {balanceMessage && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs sm:text-sm font-bold text-amber-300">
              {balanceMessage}
            </div>
          )}

          {/* Ignite Button */}
          <div className="text-center pt-2">
            <button
              onClick={handleIgnite}
              disabled={isIgnited}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              🔥 أشعل الفرن الكيميائي
            </button>
          </div>

        </div>
      )}

      {/* PHASE 2: WHO AM I */}
      {subMode === 'whoAmI' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-6 animate-in fade-in">
          
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="text-amber-400">⏱️ الوقت: {whoTimer} ثانية</span>
              <span>جولة {currentWhoRound + 1} من 6</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(whoTimer / 20) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <h3 className="text-lg font-black text-white">
              🎭 حزورة «من أنا؟»
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              كلما خمّنت مبكراً زادت نقاطك، والخطأ يخصم 5 نقاط.
            </p>
          </div>

          {/* Progressive Clues */}
          <div className="space-y-2.5">
            {currentWhoTarget?.clues.slice(0, clueCount).map((clue, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2 animate-in fade-in"
              >
                <span className="text-amber-400 font-black">🔎 دليل {idx + 1}:</span>
                <span>{clue}</span>
              </div>
            ))}
          </div>

          {/* 3 Choices */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            {MYSTERY_ELEMENTS.map((elem, idx) => {
              const isDisabled = disabledWhoOptions.includes(idx) || whoAnswerLocked;
              return (
                <button
                  key={idx}
                  disabled={isDisabled}
                  onClick={() => handleWhoGuess(idx)}
                  className={`p-4 rounded-2xl border-2 text-sm sm:text-base font-black transition-all ${
                    disabledWhoOptions.includes(idx)
                      ? 'bg-rose-950/40 border-rose-800 text-rose-500 opacity-40 cursor-default'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-700 hover:border-amber-400 text-white shadow-lg'
                  }`}
                >
                  {elem.name}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* END SCREEN */}
      {subMode === 'end' && (
        <div className="p-10 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center text-4xl">
            🔥
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              أتقنت موازنة الفرن واكتشاف العناصر بنجاح!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              مجموع النقاط المكتسبة في فرن الاستخلاص:{' '}
              <b className="text-amber-400 text-xl">⭐ {score}</b>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.click();
                setSubMode('mcq');
                setRxIndex(0);
                setScore(0);
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
            >
              🔄 العب مرة أخرى
            </button>
            <button
              onClick={() => {
                sounds.click();
                onExit();
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black transition-colors"
            >
              العودة لقاعة المحطات
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
