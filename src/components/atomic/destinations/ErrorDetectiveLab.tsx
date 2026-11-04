import React, { useState } from 'react';
import { 
  ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Check, 
  HelpCircle, Eye, Search, Sparkles
} from 'lucide-react';
import { ERROR_DETECTIVE_CASES, ErrorDetectiveCase } from '../../../data/atomicLabContent';

interface ErrorDetectiveLabProps {
  onBack: () => void;
  onAwardPoints: (points: number, taskId: string) => void;
  onRecordDeduction: (title: string, text: string) => void;
  solvedQuizzes: string[];
}

export function ErrorDetectiveLab({
  onBack,
  onAwardPoints,
  onRecordDeduction,
  solvedQuizzes
}: ErrorDetectiveLabProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(ERROR_DETECTIVE_CASES[0].id);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const currentCase = ERROR_DETECTIVE_CASES.find(c => c.id === selectedCaseId) || ERROR_DETECTIVE_CASES[0];
  const isSolved = solvedQuizzes.includes(`error_${currentCase.id}`);

  const handleCorrect = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    const isCorrect = selectedOption === currentCase.correctIndex;
    if (isCorrect && !isSolved) {
      onAwardPoints(2, `error_${currentCase.id}`);
      onRecordDeduction(
        `تصويب مغالطة: ${currentCase.title}`,
        currentCase.correctExplanation
      );
    }
  };

  return (
    <div 
      className="max-w-6xl w-full mx-auto space-y-6 select-none animate-in fade-in duration-200 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'var(--veil), url(/assets/aistudio/image_e5336e6f.webp)',
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
          <h2 className="text-lg sm:text-2xl font-black text-rose-300 flex items-center gap-2 justify-end">
            <span>مختبر اكتشف الخطأ</span>
            <Search className="w-6 h-6 text-rose-400" />
          </h2>
          <p className="text-xs text-slate-400">
            فحص النماذج والمخططات الكيميائية المغلوطة واكتشاف الأخطاء وتصويبها
          </p>
        </div>
      </div>

      {/* Case Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Cases List */}
        <div className="space-y-2.5 text-right">
          <span className="text-xs font-bold text-slate-400 block px-1">
            ملفات القضايا العلمية المشبوهة:
          </span>

          <div className="space-y-2">
            {ERROR_DETECTIVE_CASES.map((cs) => {
              const isSelected = cs.id === selectedCaseId;
              const hasSolved = solvedQuizzes.includes(`error_${cs.id}`);
              return (
                <button
                  key={cs.id}
                  onClick={() => {
                    setSelectedCaseId(cs.id);
                    setSelectedOption(null);
                    setSubmitted(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400">+2</span>
                    {hasSolved && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black block">{cs.title}</span>
                    <span className="text-[10px] text-slate-400 block">{cs.errorLocation}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Inspection Desk */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold">
              +2 نقاط تصويب
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {currentCase.title}
              </h3>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
          </div>

          {/* Flawed Report Box */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 justify-end">
              <span>النص المخبري الذي يحتوي على مغالطة علمية:</span>
              <ShieldAlert className="w-4 h-4" />
            </span>
            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-rose-500/20">
              "{currentCase.flawedDescription}"
            </p>
            <span className="text-[11px] text-slate-400 block">
              <b>وصف المخطط المرفق:</b> {currentCase.flawedImageLabel}
            </span>
          </div>

          {/* Correction Selection */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-300 block">
              ما هو التصويب العلمي الصحيح والدقيق وفق كتاب الكيمياء؟
            </span>

            {currentCase.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentCase.correctIndex;
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
                      ? 'bg-rose-950/40 border-rose-400 text-white font-bold'
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

          {/* Action or Result */}
          {!submitted ? (
            <div className="flex justify-end pt-2">
              <button
                disabled={selectedOption === null}
                onClick={handleCorrect}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95"
              >
                اعتماد التصحيح العلمي (+2 نقطة)
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-300">التصويب العلمي المعتمد:</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {currentCase.correctExplanation}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
