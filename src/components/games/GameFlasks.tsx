import React, { useState, useEffect, useRef } from 'react';
import { useGameDraft, useAutoSaveDraft, useSafeTimeouts, isPageHidden } from '../../utils/draft';
import { ResumeBanner } from '../ResumeBanner';
import { Eye, CheckCircle2, XCircle, Clock, Lightbulb, Sparkles, HelpCircle } from 'lucide-react';
import confetti from '../../utils/confetti';
import { FLASK_ITEMS, FlaskItem, getRandomCorrectPhrase, getRandomWrongPhrase } from '../../data/siliconContent';
import { sounds } from '../../utils/audio';

interface GameFlasksProps {
  onFinish: (score: number) => void;
  onExit: () => void;
}

interface FlasksDraft {
  completedFlasks: Record<number, 'ok' | 'no'>;
  activeFlaskIndex: number | null;
  timeLeft: number;
  isRevealed: boolean;
  score: number;
}

export const GameFlasks: React.FC<GameFlasksProps> = ({ onFinish, onExit }) => {
  const draft = useGameDraft<FlasksDraft>('flasks');
  const d = draft.initial;
  const later = useSafeTimeouts();
  const [completedFlasks, setCompletedFlasks] = useState<Record<number, 'ok' | 'no'>>(d?.completedFlasks ?? {});
  const [activeFlaskIndex, setActiveFlaskIndex] = useState<number | null>(d?.activeFlaskIndex ?? null);
  const [timeLeft, setTimeLeft] = useState(d?.timeLeft ?? 35);
  const [isRevealed, setIsRevealed] = useState(d?.isRevealed ?? false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(d?.score ?? 0);
  const [gameOver, setGameOver] = useState(false);

  // الدورق المُقيَّم يُعتبر مغلقاً في اللقطة حتى أثناء ظهور رسالة التغذية الراجعة
  const activeDone = activeFlaskIndex !== null && completedFlasks[activeFlaskIndex] !== undefined;
  const allDone = Object.keys(completedFlasks).length >= FLASK_ITEMS.length;
  useAutoSaveDraft<FlasksDraft>(draft.save, gameOver || allDone ? null : {
    completedFlasks,
    activeFlaskIndex: activeDone ? null : activeFlaskIndex,
    timeLeft: activeDone ? 35 : timeLeft,
    isRevealed: activeDone ? false : isRevealed,
    score,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeFlask = activeFlaskIndex !== null ? FLASK_ITEMS[activeFlaskIndex] : null;

  // Open a flask
  const handleOpenFlask = (idx: number) => {
    if (completedFlasks[idx]) return;
    sounds.click();
    setActiveFlaskIndex(idx);
    setTimeLeft(35);
    setIsRevealed(false);
    setFeedbackMsg(null);
  };

  // Timer logic for active flask
  useEffect(() => {
    if (activeFlaskIndex === null || isRevealed) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (isPageHidden()) return prev; // المؤقت يتوقف عند إخفاء الصفحة
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeFlaskIndex, isRevealed]);

  const handleReveal = () => {
    sounds.click();
    setIsRevealed(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSelfGrade = (isCorrect: boolean) => {
    if (activeFlaskIndex === null || completedFlasks[activeFlaskIndex] !== undefined) return;

    if (isCorrect) {
      sounds.correct();
      // Teacher rule: +1 point per correct!
      setScore(s => s + 1);
      setFeedbackMsg({
        text: getRandomCorrectPhrase(),
        isCorrect: true
      });
    } else {
      sounds.wrong();
      setFeedbackMsg({
        text: getRandomWrongPhrase(),
        isCorrect: false
      });
    }

    setCompletedFlasks(prev => ({
      ...prev,
      [activeFlaskIndex]: isCorrect ? 'ok' : 'no'
    }));

    later(() => {
      setFeedbackMsg(null);
      setActiveFlaskIndex(null);
      setIsRevealed(false);

      // Check if all 6 completed
      const updatedCount = Object.keys(completedFlasks).length + 1;
      if (updatedCount >= FLASK_ITEMS.length) {
        setGameOver(true);
        draft.finish();
        sounds.victory();
        confetti({ disableForReducedMotion: true, particleCount: 90, spread: 75, origin: { y: 0.6 } });
        onFinish(score + (isCorrect ? 1 : 0));
      }
    }, 1800);
  };

  // Helper to format highlighted answer
  const formatHighlighted = (text: string) => {
    const parts = text.split(/\{([^}]+)\}/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <mark
          key={i}
          className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md mx-1 shadow-sm"
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* Header HUD */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚗️</span>
          <span className="text-xs sm:text-sm font-extrabold text-white">
            المحطة 3: الدوارق الغامضة وتفسير الظواهر
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            {Object.keys(completedFlasks).length} / {FLASK_ITEMS.length} دوارق
          </span>
          <span className="text-amber-300 font-black text-base bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-400/40">
            ⭐ {score}
          </span>
        </div>
      </div>

      {!gameOver ? (
        activeFlaskIndex === null ? (
          /* Grid of 6 Flasks */
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <p className="text-sm sm:text-base font-bold text-slate-200">
                اضغط على أحد الدوارق الستة لتفسير الظاهرة الكيميائية. لديك مؤقت 35 ثانية وتلميحات إرشادية!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {FLASK_ITEMS.map((item, idx) => {
                const status = completedFlasks[idx];
                const isDone = !!status;

                return (
                  <button
                    key={idx}
                    disabled={isDone}
                    onClick={() => handleOpenFlask(idx)}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                      isDone
                        ? status === 'ok'
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 opacity-80 cursor-default'
                          : 'border-rose-500 bg-rose-950/30 text-rose-300 opacity-80 cursor-default'
                        : 'border-slate-700 bg-slate-950/80 hover:bg-slate-800/80 hover:border-amber-400 hover:scale-102 text-white shadow-lg'
                    }`}
                  >
                    <div
                      className="text-5xl group-hover:scale-110 transition-transform filter"
                      style={{ filter: `hue-rotate(${idx * 55}deg)` }}
                    >
                      ⚗️
                    </div>

                    <div className="text-center">
                      <span className="text-sm font-black block">دورق {idx + 1}</span>
                      <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">
                        {item.title}
                      </span>
                    </div>

                    {isDone && (
                      <div className="absolute top-2 right-2 text-xs font-black">
                        {status === 'ok' ? '✅' : '❌'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Flask Detail View */
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Timer Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span>الوقت المتبقي للتفكير: {timeLeft} ثانية</span>
                </span>
                <span>دورق رقم {activeFlaskIndex + 1} من 6</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 35) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-xs font-bold text-emerald-400 block mb-1">
                فسّر كيميائياً:
              </span>
              <h3 className="text-xl font-black text-white leading-relaxed">
                {activeFlask?.title}
              </h3>
            </div>

            {/* Hint 1 */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-300">
                <b className="text-amber-400 block mb-0.5">التلميح الأول:</b>
                <span>{activeFlask?.hint1}</span>
              </div>
            </div>

            {/* Hint 2 (shown when <= 17.5s or revealed) */}
            {(timeLeft <= 17.5 || isRevealed) && (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-amber-500/30 flex items-start gap-3 animate-in fade-in">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300">
                  <b className="text-amber-400 block mb-0.5">التلميح الثاني (بنية الإجابة):</b>
                  <span>
                    {activeFlask?.answerWithHighlight.replace(/\{[^}]+\}/g, ' ▁▁▁▁▁ ')}
                  </span>
                </div>
              </div>
            )}

            {/* Answer Reveal Area */}
            {!isRevealed ? (
              <div className="text-center pt-2">
                <button
                  onClick={handleReveal}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>اكشف الإجابة النموذجية الآن</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-5 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/50 text-slate-100 text-sm sm:text-base leading-relaxed">
                  <span className="text-xs font-black text-emerald-400 block mb-2">
                    ✅ الإجابة النموذجية المعتمدة:
                  </span>
                  {activeFlask && formatHighlighted(activeFlask.answerWithHighlight)}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-3">
                  <p className="text-xs sm:text-sm font-black text-slate-300">
                    قارن إجابتك بالنموذج أعلاه: هل أصبت الإجابة الكيميائية الصحيحة؟
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleSelfGrade(true)}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✅ نعم، أجبت إجابة صحيحة (+1 ⭐)</span>
                    </button>

                    <button
                      onClick={() => handleSelfGrade(false)}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs sm:text-sm font-bold transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>❌ لم أصب الإجابة بالكامل (0)</span>
                    </button>
                  </div>

                  {/* Motivational Feedback */}
                  {feedbackMsg && (
                    <div
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-black animate-in fade-in ${
                        feedbackMsg.isCorrect
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-400 text-rose-300'
                      }`}
                    >
                      {feedbackMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )
      ) : (
        /* End Screen */
        <div className="p-10 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-4xl">
            🧪
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              أنهيت جميع الدوارق الكيميائية بنجاح!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              مجموع النقاط المكتسبة في الدوارق الغامضة:{' '}
              <b className="text-amber-400 text-xl">⭐ {score}</b>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.click();
                setCompletedFlasks({});
                setActiveFlaskIndex(null);
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
