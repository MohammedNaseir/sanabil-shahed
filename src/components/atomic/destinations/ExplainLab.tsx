import React, { useState } from 'react';
import { 
  ArrowRight, HelpCircle, Check, Sparkles, Lightbulb, CheckCircle2, 
  AlertCircle, BookOpen, Compass
} from 'lucide-react';
import { EXPLAIN_CHALLENGES, ExplainChallenge } from '../../../data/atomicLabContent';

interface ExplainLabProps {
  onBack: () => void;
  onAwardPoints: (points: number, taskId: string) => void;
  onRecordDeduction: (title: string, text: string) => void;
  solvedQuizzes: string[];
}

export function ExplainLab({
  onBack,
  onAwardPoints,
  onRecordDeduction,
  solvedQuizzes
}: ExplainLabProps) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(EXPLAIN_CHALLENGES[0].id);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const currentChallenge = EXPLAIN_CHALLENGES.find(c => c.id === selectedChallengeId) || EXPLAIN_CHALLENGES[0];
  const isSolved = solvedQuizzes.includes(`explain_${currentChallenge.id}`);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    const isCorrect = selectedOption === currentChallenge.correctIndex;
    if (isCorrect && !isSolved) {
      onAwardPoints(currentChallenge.points, `explain_${currentChallenge.id}`);
      onRecordDeduction(
        `تفسير علمي: ${currentChallenge.phenomenon}`,
        currentChallenge.scientificDeduction
      );
    }
  };

  return (
    <div 
      className="max-w-6xl w-full mx-auto space-y-6 select-none animate-in fade-in duration-200 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'var(--veil), url(/assets/aistudio/image_b9782493.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      
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
            <span>مختبر فسّر</span>
            <Lightbulb className="w-6 h-6 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">
            تحليل الظواهر الذرية وصياغة التعليلات العلمية المحكمة وفق الكتاب
          </p>
        </div>
      </div>

      {/* Main Grid: Challenge Selector & Active Work Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Challenge Navigator */}
        <div className="space-y-2.5 text-right">
          <span className="text-xs font-bold text-slate-400 block px-1">
            اختر القضية العلمية المراد تفسيرها:
          </span>
          
          <div className="space-y-2">
            {EXPLAIN_CHALLENGES.map((ch) => {
              const isSelected = ch.id === selectedChallengeId;
              const hasSolved = solvedQuizzes.includes(`explain_${ch.id}`);
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChallengeId(ch.id);
                    setSelectedOption(null);
                    setSubmitted(false);
                    setShowHint(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">+{ch.points}</span>
                    {hasSolved && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black block">{ch.phenomenon}</span>
                    <span className="text-[10px] text-slate-400 block">{ch.sourcePage}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Challenge Workbench */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-mono text-xs font-bold w-fit">
              +{currentChallenge.points} نقاط بحثية
            </span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {currentChallenge.phenomenon}
              </h3>
              <span className="text-[11px] text-slate-400 font-bold block">{currentChallenge.sourcePage}</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-cyan-300 block">المسألة العلمية:</span>
            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
              {currentChallenge.challengeText}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-300 block">
              اختر التفسير العلمي الدقيق والمطابق لحقائق المنهاج:
            </span>

            {currentChallenge.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentChallenge.correctIndex;
              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full p-3.5 rounded-2xl border text-right text-xs transition-all flex items-start justify-between gap-3 ${
                    submitted && isCorrect
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 font-bold'
                      : submitted && isSelected && !isCorrect
                      ? 'bg-red-950/40 border-red-500 text-red-200'
                      : isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                  {submitted && isCorrect && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          {/* Progressive Hint Drawer */}
          <div className="space-y-2">
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>أحتاج تلميحاً علمياً لمساعدتي في التفكير</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1 animate-in fade-in">
                <b className="block text-amber-300 font-black">تلميح المختبر:</b>
                <ul className="list-disc list-inside space-y-1">
                  {currentChallenge.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action or Result */}
          {!submitted ? (
            <div className="flex justify-end pt-2">
              <button
                disabled={selectedOption === null}
                onClick={handleSubmit}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95"
              >
                اعتماد التفسير واحتساب النقاط
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-300">التفسير العلمي المعتمد:</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {currentChallenge.scientificDeduction}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
