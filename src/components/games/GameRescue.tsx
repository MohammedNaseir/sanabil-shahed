import React, { useState, useEffect, useRef } from 'react';
import { useGameDraft, useAutoSaveDraft, useSafeTimeouts, isPageHidden } from '../../utils/draft';
import { ResumeBanner } from '../ResumeBanner';
import { LifeBuoy, PhoneCall, Snowflake, Scissors, Clock, ArrowRight } from 'lucide-react';
import confetti from '../../utils/confetti';
import { RESCUE_QUESTIONS, QuestionMCQ, getRandomCorrectPhrase, getRandomWrongPhrase } from '../../data/siliconContent';
import { sounds } from '../../utils/audio';

interface GameRescueProps {
  onFinish: (score: number) => void;
  onExit: () => void;
}

interface RescueDraft {
  questionIndex: number;
  correctCount: number;
  wrongCount: number;
  timeLeft: number;
  score: number;
  usedHalf: boolean;
  usedPhone: boolean;
  usedFreeze: boolean;
  isFrozen: boolean;
  hiddenOptions: number[];
}

export const GameRescue: React.FC<GameRescueProps> = ({ onFinish, onExit }) => {
  const draft = useGameDraft<RescueDraft>('rescue');
  const d = draft.initial && draft.initial.questionIndex < RESCUE_QUESTIONS.length && draft.initial.wrongCount < 3 ? draft.initial : null;
  const later = useSafeTimeouts();
  const [questionIndex, setQuestionIndex] = useState(d?.questionIndex ?? 0);
  const [correctCount, setCorrectCount] = useState(d?.correctCount ?? 0);
  const [wrongCount, setWrongCount] = useState(d?.wrongCount ?? 0);
  const [timeLeft, setTimeLeft] = useState(d?.timeLeft ?? 30);
  const [score, setScore] = useState(d?.score ?? 0);

  // Lifelines
  const [usedHalf, setUsedHalf] = useState(d?.usedHalf ?? false);
  const [usedPhone, setUsedPhone] = useState(d?.usedPhone ?? false);
  const [usedFreeze, setUsedFreeze] = useState(d?.usedFreeze ?? false);
  const [isFrozen, setIsFrozen] = useState(d?.isFrozen ?? false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>(d?.hiddenOptions ?? []);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  // أول تشغيل بعد الاستئناف لا يعيد ضبط المؤقت والخيارات المخفية
  const restoredRef = useRef(Boolean(d));
  const [phoneMessage, setPhoneMessage] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isCorrect: boolean } | null>(null);

  // Status
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  // لقطة الحفظ: السؤال المُجاب عليه يُحفظ كأنه انتقل للسؤال التالي
  const lastQuestion = questionIndex + 1 >= RESCUE_QUESTIONS.length;
  useAutoSaveDraft<RescueDraft>(draft.save,
    gameOver || wrongCount >= 3 || (isAnswerLocked && lastQuestion) ? null : {
      questionIndex: isAnswerLocked ? questionIndex + 1 : questionIndex,
      correctCount, wrongCount, score, usedHalf, usedPhone, usedFreeze, isFrozen,
      timeLeft: isAnswerLocked ? 30 : timeLeft,
      hiddenOptions: isAnswerLocked ? [] : hiddenOptions,
    });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQ: QuestionMCQ = RESCUE_QUESTIONS[questionIndex];

  // Visual tank levels
  const waterLevel = Math.min(100, 22 + wrongCount * 26);
  const scientistBottom = 14 + correctCount * 13;
  const isSubmerged = scientistBottom < waterLevel * 1.8 - 24;

  useEffect(() => {
    if (gameOver || !currentQ) return;

    if (restoredRef.current) {
      restoredRef.current = false;
    } else {
      setTimeLeft(30);
      setHiddenOptions([]);
    }
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setFeedbackMsg(null);
    setPhoneMessage('');

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (isPageHidden()) return prev; // المؤقت يتوقف عند إخفاء الصفحة
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(-1, true); // Timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionIndex, gameOver]);

  const handleAnswer = (chosenIndex: number, isTimeout = false) => {
    if (isAnswerLocked) return;
    setIsAnswerLocked(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(chosenIndex);

    const isCorrect = !isTimeout && chosenIndex === currentQ.correctIndex;

    if (isCorrect) {
      sounds.correct();
      // Teacher rule: +1 point per correct answer!
      setScore(s => s + 1);
      setCorrectCount(c => c + 1);
      setFeedbackMsg({ text: getRandomCorrectPhrase(), isCorrect: true });
    } else {
      sounds.wrong();
      setFeedbackMsg({ text: getRandomWrongPhrase(), isCorrect: false });
      if (isFrozen) {
        setIsFrozen(false);
        setPhoneMessage('🧊 حماك الجليد من ارتفاع منسوب الماء في هذا السؤال!');
      } else {
        const nextWrong = wrongCount + 1;
        setWrongCount(nextWrong);
        if (nextWrong >= 3) {
          later(() => endGame(false), 2000);
          return;
        }
      }
    }

    later(() => {
      setFeedbackMsg(null);
      setIsAnswerLocked(false);
      setSelectedOption(null);
      setHiddenOptions([]);
      if (questionIndex + 1 < RESCUE_QUESTIONS.length) {
        setQuestionIndex(q => q + 1);
      } else {
        endGame(true);
      }
    }, 2000);
  };

  const endGame = (isSaved: boolean) => {
    setGameOver(true);
    setVictory(isSaved);
    draft.finish();
    const score = scoreRef.current;
    if (isSaved) {
      sounds.victory();
      const finalScore = score + 1;
      setScore(finalScore);
      confetti({ disableForReducedMotion: true, particleCount: 110, spread: 80, origin: { y: 0.6 } });
      onFinish(finalScore);
    } else {
      sounds.wrong();
      onFinish(score);
    }
  };

  // Lifeline 1: 50/50
  const handleHalf = () => {
    if (usedHalf || isAnswerLocked) return;
    sounds.click();
    setUsedHalf(true);
    const wrongIndices = currentQ.options
      .map((_, idx) => idx)
      .filter(idx => idx !== currentQ.correctIndex);
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  };

  // Lifeline 2: Phone a Friend
  const handlePhone = () => {
    if (usedPhone || isAnswerLocked) return;
    sounds.click();
    setUsedPhone(true);
    const isReliable = Math.random() < 0.8;
    const suggestedIndex = isReliable
      ? currentQ.correctIndex
      : currentQ.options.map((_, i) => i).filter(i => i !== currentQ.correctIndex)[0];
    const suggestionText = currentQ.options[suggestedIndex];
    setPhoneMessage(`📞 اتصال بصديقك الباحث: «أظن أن الإجابة الصحيحة هي: ${suggestionText}»`);
  };

  // Lifeline 3: Freeze Water
  const handleFreeze = () => {
    if (usedFreeze || isAnswerLocked) return;
    sounds.iceFreeze();
    setUsedFreeze(true);
    setIsFrozen(true);
    setPhoneMessage('🧊 تجمّد الماء! لن يرتفع المنسوب إن أخطأت في هذا السؤال.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* Header HUD */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <LifeBuoy
              key={i}
              className={`w-6 h-6 transition-all ${
                i < (3 - wrongCount)
                  ? 'text-cyan-400 fill-cyan-400 scale-100'
                  : 'text-slate-800 scale-90'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            🪢 السؤال: {questionIndex + 1} / {RESCUE_QUESTIONS.length}
          </span>
          <span className="text-amber-300 font-black text-base bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-400/40">
            ⭐ {score}
          </span>
        </div>
      </div>

      {!gameOver ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-cyan-500/40 shadow-2xl space-y-6">
          
          {/* Aquatic Water Chamber Graphic */}
          <div className="relative h-48 rounded-2xl overflow-hidden border-3 border-cyan-500/50 bg-gradient-to-b from-sky-950 via-slate-950 to-blue-950 shadow-inner">
            {/* Safety Island / Sky */}
            <div className="absolute top-2 left-3 z-10 text-2xl flex items-center gap-1.5">
              <span>🏝️</span>
              {isFrozen && (
                <span className="text-xs font-black bg-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/50 animate-pulse">
                  🧊 الماء مجمّد
                </span>
              )}
            </div>

            {/* Rope */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-amber-600/70 z-0 -translate-x-1/2" />

            {/* Rising Water */}
            <div
              className={`absolute left-0 right-0 bottom-0 transition-all duration-800 z-10 ${
                isFrozen
                  ? 'bg-gradient-to-t from-cyan-400/80 to-blue-200/80 border-t-2 border-cyan-200'
                  : 'bg-gradient-to-t from-blue-700/80 to-cyan-500/80 border-t-2 border-cyan-400'
              }`}
              style={{ height: `${waterLevel}%` }}
            />

            {/* Scientist Avatar */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 text-4xl z-20 transition-all duration-800 ${
                isSubmerged ? 'opacity-60 scale-95 animate-pulse' : 'animate-bounce'
              }`}
              style={{ bottom: `${scientistBottom}px` }}
            >
              🧑‍🔬
            </div>
          </div>

          {/* Timer Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="text-cyan-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>الوقت المتاح: {timeLeft} ثانية</span>
              </span>
              <span>🌊 الماء يرتفع مع كل خطأ!</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-rose-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Box */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* 4 Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, idx) => {
              if (hiddenOptions.includes(idx)) {
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border-2 border-slate-900 bg-slate-950/20 text-transparent select-none"
                  >
                    —
                  </div>
                );
              }

              const isChosen = selectedOption === idx;
              let style = 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-100';

              if (isAnswerLocked) {
                if (idx === currentQ.correctIndex) {
                  style = 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-102';
                } else if (isChosen) {
                  style = 'bg-rose-600 border-rose-400 text-white animate-shake';
                } else {
                  style = 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswerLocked}
                  onClick={() => handleAnswer(idx)}
                  className={`p-4 rounded-2xl border-2 font-black text-sm sm:text-base text-center transition-all ${style}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Motivational Feedback */}
          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-2xl border-2 text-center text-xs sm:text-sm font-black animate-in fade-in ${
                feedbackMsg.isCorrect
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-rose-950/70 border-rose-400 text-rose-300'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* 3 Lifeline Buttons */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 flex-wrap">
            <button
              onClick={handleHalf}
              disabled={usedHalf || isAnswerLocked}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 text-xs font-bold transition-all border border-slate-700"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>½ حذف إجابتين</span>
            </button>

            <button
              onClick={handlePhone}
              disabled={usedPhone || isAnswerLocked}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 text-xs font-bold transition-all border border-slate-700"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>📞 اتصال بصديق</span>
            </button>

            <button
              onClick={handleFreeze}
              disabled={usedFreeze || isAnswerLocked}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 text-xs font-bold transition-all border border-slate-700"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>🧊 تجميد الماء</span>
            </button>
          </div>

          {/* Feedback / Lifeline message */}
          {phoneMessage && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-center text-xs font-bold text-cyan-300 animate-in fade-in">
              {phoneMessage}
            </div>
          )}

        </div>
      ) : (
        /* End Screen */
        <div className="p-10 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-4xl">
            {victory ? '🚁' : '🌊'}
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {victory ? '🚁 أنقذت العالِم ووصلت المروحية!' : '🌊 غرق العالِم… حاول مرة أخرى!'}
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              مجموع النقاط المكتسبة في طوق النجاة:{' '}
              <b className="text-amber-400 text-xl">⭐ {score}</b>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.click();
                setQuestionIndex(0);
                setCorrectCount(0);
                setWrongCount(0);
                setUsedHalf(false);
                setUsedPhone(false);
                setUsedFreeze(false);
                setIsFrozen(false);
                setPhoneMessage('');
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
