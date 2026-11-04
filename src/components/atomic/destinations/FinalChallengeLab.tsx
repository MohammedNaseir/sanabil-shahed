import React, { useState } from 'react';
import { 
  ArrowRight, Trophy, Award, CheckCircle2, AlertCircle, Sparkles, 
  Check, ArrowLeft, BookOpen, Printer
} from 'lucide-react';
import { FINAL_EXAM_QUESTIONS, FinalExamQuestion } from '../../../data/atomicLabContent';
import { useGameDraft, useAutoSaveDraft } from '../../../utils/draft';
import { ResumeBanner } from '../../ResumeBanner';

interface FinalDraft {
  currentIdx: number;
  selectedAnswers: Record<string, number>;
  submittedQuestions: Record<string, boolean>;
}

interface FinalChallengeLabProps {
  onBack: () => void;
  onAwardPoints: (points: number, taskId: string) => void;
  onRecordDeduction: (title: string, text: string) => void;
  onOpenCertificate: () => void;
  solvedQuizzes: string[];
  totalScore: number;
}

export function FinalChallengeLab({
  onBack,
  onAwardPoints,
  onRecordDeduction,
  onOpenCertificate,
  solvedQuizzes,
  totalScore
}: FinalChallengeLabProps) {
  const draft = useGameDraft<FinalDraft>('atomic_final');
  const d = draft.initial;
  const [currentIdx, setCurrentIdx] = useState<number>(() => Math.min(d?.currentIdx ?? 0, FINAL_EXAM_QUESTIONS.length - 1));
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(d?.selectedAnswers ?? {});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>(d?.submittedQuestions ?? {});
  const [showSummary, setShowSummary] = useState<boolean>(false);
  useAutoSaveDraft<FinalDraft>(draft.save, showSummary ? null : { currentIdx, selectedAnswers, submittedQuestions });

  const currentQ = FINAL_EXAM_QUESTIONS[currentIdx];
  const isCurrentSubmitted = !!submittedQuestions[currentQ.id];
  const selectedChoice = selectedAnswers[currentQ.id] ?? null;

  const handleSelectChoice = (choiceIdx: number) => {
    if (isCurrentSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: choiceIdx }));
  };

  const handleSubmitCurrent = () => {
    if (selectedChoice === null || isCurrentSubmitted) return;
    setSubmittedQuestions(prev => ({ ...prev, [currentQ.id]: true }));
    const isCorrect = selectedChoice === currentQ.correctIndex;

    if (isCorrect && !solvedQuizzes.includes(`final_${currentQ.id}`)) {
      onAwardPoints(currentQ.points, `final_${currentQ.id}`);
      onRecordDeduction(
        `إجابة التحدي الختامي #${currentQ.questionNumber}`,
        currentQ.explanation
      );
    }
  };

  const handleNext = () => {
    if (currentIdx < FINAL_EXAM_QUESTIONS.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setShowSummary(true);
      draft.finish();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
    }
  };

  // Stats
  const totalCorrect = Object.entries(submittedQuestions).filter(([qId, sub]) => {
    if (!sub) return false;
    const qObj = FINAL_EXAM_QUESTIONS.find(q => q.id === qId);
    return qObj && selectedAnswers[qId] === qObj.correctIndex;
  }).length;

  return (
    <div 
      className="max-w-4xl w-full mx-auto space-y-6 select-none animate-in fade-in duration-200 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'var(--veil), url(/assets/aistudio/image_10319527.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition-colors w-fit"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقاعة مختبر الذرة</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg sm:text-2xl font-black text-amber-300 flex items-center gap-2 justify-end">
            <span>مختبر التحدي الختامي</span>
            <Trophy className="w-6 h-6 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">
            التقييم الشامل لباحث الذرة المعتمد • الكتاب ص 4 - 13 و 27 - 28
          </p>
        </div>
      </div>

      {!showSummary ? (
        /* Active Question Card */
        <div className="rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
          
          {/* Progress Strip */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs">
            <span className="font-mono text-amber-400 font-bold">
              +{currentQ.points} {currentQ.points === 1 ? 'نقطة (مباشر)' : 'نقاط (تحليلي)'}
            </span>

            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-400">
                السؤال {currentQ.questionNumber} من {FINAL_EXAM_QUESTIONS.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-cyan-300 font-bold">
                {currentQ.bookSource}
              </span>
            </div>
          </div>

          {/* Question Body */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <p className="text-sm sm:text-base text-slate-100 font-bold leading-relaxed">
              {currentQ.questionText}
            </p>
          </div>

          {/* Choices */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedChoice === idx;
              const isCorrect = idx === currentQ.correctIndex;
              return (
                <button
                  key={idx}
                  disabled={isCurrentSubmitted}
                  onClick={() => handleSelectChoice(idx)}
                  className={`w-full p-3.5 rounded-2xl border text-right text-xs transition-all flex items-start justify-between gap-3 ${
                    isCurrentSubmitted && isCorrect
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 font-bold'
                      : isCurrentSubmitted && isSelected && !isCorrect
                      ? 'bg-red-950/40 border-red-500 text-red-200'
                      : isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                  {isCurrentSubmitted && isCorrect && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isCurrentSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1 animate-in fade-in">
              <b className="text-amber-400 block font-bold">التفسير والتوثيق العلمي المعتمد:</b>
              <p className="text-slate-300 leading-relaxed font-sans">{currentQ.explanation}</p>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              disabled={currentIdx === 0}
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs"
            >
              السؤال السابق
            </button>

            {!isCurrentSubmitted ? (
              <button
                disabled={selectedChoice === null}
                onClick={handleSubmitCurrent}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                تأكيد الإجابة
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <span>{currentIdx === FINAL_EXAM_QUESTIONS.length - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      ) : (
        /* Summary Screen */
        <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 p-6 sm:p-10 space-y-8 text-center backdrop-blur-md">
          
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              نهاية مسار التحدي الختامي
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white">
              تهانينا! لقد استحققت لقب «باحث الذرة»
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              أتممت الإجابة على أسئلة الفصل والوحدة المقررة لمنهاج الكيمياء للصف العاشر بدقة واستيعاب علمي رفيع.
            </p>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[11px] text-slate-400 block">الإجابات الصحيحة</span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                {totalCorrect} / {FINAL_EXAM_QUESTIONS.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[11px] text-slate-400 block">إجمالي رصيد النقاط</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                {totalScore} نقطة
              </span>
            </div>
          </div>

          {/* Certificate Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenCertificate}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all active:scale-95"
            >
              <Award className="w-5 h-5 fill-slate-950" />
              <span>استلام وسام وشهادة «باحث الذرة» الرسمية</span>
            </button>
            <button
              onClick={() => {
                setShowSummary(false);
                setCurrentIdx(0);
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              مراجعة الأسئلة
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
