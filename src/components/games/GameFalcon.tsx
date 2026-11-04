import React, { useState, useEffect, useRef } from 'react';
import { useGameDraft, useAutoSaveDraft, useSafeTimeouts, isPageHidden } from '../../utils/draft';
import { ResumeBanner } from '../ResumeBanner';
import { RotateCw, Heart, Flame, Clock, Award, ArrowRight, Sparkles } from 'lucide-react';
import confetti from '../../utils/confetti';
import { FALCON_QUESTIONS, QuestionMCQ, getRandomCorrectPhrase, getRandomWrongPhrase } from '../../data/siliconContent';
import { sounds } from '../../utils/audio';

interface GameFalconProps {
  onFinish: (score: number) => void;
  onExit: () => void;
}

interface FalconDraft {
  lives: number;
  streak: number;
  rotation: number;
  answeredIds: number[];
  score: number;
  current: { qIdx: number; options: { text: string; isCorrect: boolean }[]; timeLeft: number } | null;
}

export const GameFalcon: React.FC<GameFalconProps> = ({ onFinish, onExit }) => {
  const draft = useGameDraft<FalconDraft>('falcon');
  const d = draft.initial;
  const later = useSafeTimeouts();
  const [lives, setLives] = useState(d?.lives ?? 3);
  const [streak, setStreak] = useState(d?.streak ?? 0);
  const [rotation, setRotation] = useState(d?.rotation ?? 0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<number[]>(d?.answeredIds ?? []);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionMCQ | null>(d?.current ? FALCON_QUESTIONS[d.current.qIdx] ?? null : null);
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; isCorrect: boolean }[]>(d?.current?.options ?? []);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(d?.current?.timeLeft ?? 12);
  const [score, setScore] = useState(d?.score ?? 0);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  // لقطة الحفظ: السؤال المُجاب عليه يُعتبر منتهياً حتى لو كانت رسالة التغذية الراجعة ما زالت ظاهرة
  const currentIdx = currentQuestion ? FALCON_QUESTIONS.indexOf(currentQuestion) : -1;
  const isTerminal = gameOver || lives <= 0;
  useAutoSaveDraft<FalconDraft>(draft.save, isTerminal ? null : {
    lives, streak, rotation, answeredIds, score,
    current: currentIdx >= 0 && !isAnswerLocked ? { qIdx: currentIdx, options: shuffledOptions, timeLeft } : null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalQuestions = FALCON_QUESTIONS.length;

  const colors = [
    '#6366f1', '#ec4899', '#10b981', '#0ea5e9',
    '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6',
    '#3b82f6', '#f97316', '#a855f7', '#84cc16'
  ];

  // Spin the wheel
  const handleSpin = () => {
    if (isSpinning || currentQuestion || lives <= 0) return;

    sounds.click();
    setIsSpinning(true);

    const remaining = FALCON_QUESTIONS.map((_, idx) => idx).filter(
      idx => !answeredIds.includes(idx)
    );

    if (remaining.length === 0) {
      handleGameEnd(true);
      return;
    }

    const selectedIdx = remaining[Math.floor(Math.random() * remaining.length)];
    const segmentAngle = 360 / totalQuestions;
    const targetAngle = 360 - (selectedIdx * segmentAngle + segmentAngle / 2);
    const newRotation = rotation + 1440 + targetAngle + (Math.random() * 10 - 5);

    setRotation(newRotation);

    // Audio ticking simulation
    let ticks = 0;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      sounds.wheelTick();
      ticks++;
      if (ticks > 25 && tickRef.current) clearInterval(tickRef.current);
    }, 120);

    later(() => {
      setIsSpinning(false);
      loadQuestion(selectedIdx);
    }, 4000);
  };

  const loadQuestion = (qIdx: number) => {
    const q = FALCON_QUESTIONS[qIdx];
    setCurrentQuestion(q);
    setAnsweredIds(prev => [...prev, qIdx]);

    const opts = q.options.map((text, idx) => ({
      text,
      isCorrect: idx === q.correctIndex
    }));
    // Shuffle options
    setShuffledOptions([...opts].sort(() => Math.random() - 0.5));
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setTimeLeft(12);
  };

  // Timer effect for question
  useEffect(() => {
    if (!currentQuestion || isAnswerLocked || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (isPageHidden()) return prev; // المؤقت يتوقف عند إخفاء الصفحة
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(-1, true); // Time out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, isAnswerLocked, gameOver]);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isCorrect: boolean } | null>(null);

  const handleAnswer = (optionIndex: number, isTimeout = false) => {
    if (isAnswerLocked) return;
    setIsAnswerLocked(true);
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    const isCorrect = !isTimeout && optionIndex >= 0 && shuffledOptions[optionIndex]?.isCorrect;

    if (isCorrect) {
      sounds.correct();
      // Teacher rule: +1 point only per correct answer!
      setScore(s => s + 1);
      setStreak(st => st + 1);
      setFeedbackMsg({
        text: getRandomCorrectPhrase(),
        isCorrect: true
      });
    } else {
      sounds.wrong();
      setStreak(0);
      setFeedbackMsg({
        text: getRandomWrongPhrase(),
        isCorrect: false
      });
      setLives(l => {
        const remaining = l - 1;
        if (remaining <= 0) {
          later(() => handleGameEnd(false), 2200);
        }
        return remaining;
      });
    }

    later(() => {
      setFeedbackMsg(null);
      setCurrentQuestion(null);
      if (answeredIds.length >= totalQuestions && lives > 0) {
        handleGameEnd(true);
      }
    }, 2400);
  };

  const handleGameEnd = (isVictory: boolean) => {
    setGameOver(true);
    setVictory(isVictory);
    draft.finish();
    if (isVictory) {
      sounds.victory();
      confetti({ disableForReducedMotion: true, particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
    // نقرأ النتيجة من المرجع لأن هذه الدالة قد تُستدعى من مؤقت قديم
    onFinish(scoreRef.current);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* HUD Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all ${
                i < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-700 scale-90'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>سلسلة: {streak}</span>
          </div>

          <div className="text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
            🦅 {answeredIds.length} / {totalQuestions}
          </div>

          <div className="text-amber-300 font-black text-base bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-400/40">
            ⭐ {score}
          </div>
        </div>
      </div>

      {/* Main Wheel View or Question View */}
      {!gameOver ? (
        !currentQuestion ? (
          /* Wheel Section */
          <div className="p-4 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-6 sm:space-y-8 relative overflow-hidden">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
              
              {/* Pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-rose-500 text-2xl sm:text-3xl filter drop-shadow">
                ▼
              </div>

              {/* The Wheel */}
              <div
                className="w-full h-full rounded-full border-4 border-slate-700 shadow-2xl relative transition-transform ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? '4000ms' : '0ms',
                  background: `conic-gradient(${FALCON_QUESTIONS.map(
                    (_, k) => `${answeredIds.includes(k) ? '#334155' : colors[k % colors.length]} ${k * 30}deg ${(k + 1) * 30}deg`
                  ).join(', ')})`
                }}
              >
                {/* Numbers */}
                {FALCON_QUESTIONS.map((_, idx) => {
                  const angle = idx * 30 + 15;
                  return (
                    <span
                      key={idx}
                      className="absolute left-1/2 top-1/2 -ml-3 -mt-3 w-6 h-6 text-center font-black text-white text-[11px] sm:text-xs select-none"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-95px)`
                      }}
                    >
                      {idx + 1}
                    </span>
                  );
                })}
              </div>

              {/* Wheel Center Falcon Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-2xl sm:text-3xl shadow-xl z-10">
                🦅
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSpin}
                disabled={isSpinning || lives <= 0}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95"
              >
                {isSpinning ? '🦅 العجلة تدور...' : '🎡 دوّر عجلة الصقور'}
              </button>
              <p className="text-xs text-slate-400">
                أجب بسرعة للحصول على نقاط المؤقت الإضافية وسلسلة النجاح!
              </p>
            </div>
          </div>
        ) : (
          /* Active Question Section */
          <div className="p-4 sm:p-8 rounded-3xl bg-slate-900 border-2 border-blue-500/40 shadow-2xl space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Progress bar timer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>الوقت المتبقي: {timeLeft} ثانية</span>
                </span>
                <span>سؤال {currentQuestion.id} من {totalQuestions}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 12) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* 4 Shuffled Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {shuffledOptions.map((opt, idx) => {
                const isChosen = selectedOption === idx;
                let btnStyle = 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-100';

                if (isAnswerLocked) {
                  if (opt.isCorrect) {
                    btnStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-102';
                  } else if (isChosen && !opt.isCorrect) {
                    btnStyle = 'bg-rose-600 border-rose-400 text-white animate-shake';
                  } else {
                    btnStyle = 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-40';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerLocked}
                    onClick={() => handleAnswer(idx)}
                    className={`p-4 rounded-2xl border-2 text-sm sm:text-base font-extrabold transition-all text-center leading-normal ${btnStyle}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {/* Motivational Feedback */}
            {feedbackMsg && (
              <div
                className={`p-3.5 rounded-2xl border-2 text-center text-xs sm:text-sm font-black animate-in fade-in zoom-in-95 ${
                  feedbackMsg.isCorrect
                    ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : 'bg-rose-950/70 border-rose-400 text-rose-300'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}
          </div>
        )
      ) : (
        /* End Screen */
        <div className="p-10 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-4xl">
            {victory ? '🦅' : '🌪️'}
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {victory ? '🦅 حلّق الصقر إلى القمة!' : '🌪️ سقط الصقر في المحاولة!'}
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              مجموع النقاط المكتسبة في سباق الصقور:{' '}
              <b className="text-amber-400 text-xl">⭐ {score}</b>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.click();
                setLives(3);
                setStreak(0);
                setAnsweredIds([]);
                setScore(0);
                setGameOver(false);
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
