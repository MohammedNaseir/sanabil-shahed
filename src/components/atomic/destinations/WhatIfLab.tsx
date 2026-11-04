import React, { useState } from 'react';
import { 
  ArrowRight, HelpCircle, CheckCircle2, RotateCcw, Play, 
  Sparkles, Sliders, Layers, Flame, Compass
} from 'lucide-react';
import { WHAT_IF_SCENARIOS, WhatIfScenario } from '../../../data/atomicLabContent';

interface WhatIfLabProps {
  onBack: () => void;
  onAwardPoints: (points: number, taskId: string) => void;
  onRecordDeduction: (title: string, text: string) => void;
  solvedQuizzes: string[];
}

export function WhatIfLab({
  onBack,
  onAwardPoints,
  onRecordDeduction,
  solvedQuizzes
}: WhatIfLabProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(WHAT_IF_SCENARIOS[0].id);
  const currentScenario = WHAT_IF_SCENARIOS.find(s => s.id === selectedScenarioId) || WHAT_IF_SCENARIOS[0];
  
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const activeOption = currentScenario.paramOptions[selectedOptionIndex] || currentScenario.paramOptions[0];

  const handleApplyScenario = () => {
    if (!solvedQuizzes.includes(`whatif_${currentScenario.id}`)) {
      onAwardPoints(2, `whatif_${currentScenario.id}`);
      onRecordDeduction(
        `تحدي ماذا لو: ${currentScenario.title}`,
        activeOption.result
      );
    }
  };

  return (
    <div 
      className="max-w-6xl w-full mx-auto space-y-6 select-none animate-in fade-in duration-200 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'var(--veil), url(/assets/aistudio/image_82a6bb5b.webp)',
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
          <h2 className="text-lg sm:text-2xl font-black text-indigo-300 flex items-center gap-2 justify-end">
            <span>مختبر ماذا لو؟</span>
            <Sliders className="w-6 h-6 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-400">
            تجارب المحاكاة الافتراضية واختبار السيناريوهات الفيزيائية البديلة
          </p>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Scenarios List */}
        <div className="space-y-2.5 text-right">
          <span className="text-xs font-bold text-slate-400 block px-1">
            اختر السيناريو الافتراضي للاختبار:
          </span>

          <div className="space-y-2">
            {WHAT_IF_SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              const hasSolved = solvedQuizzes.includes(`whatif_${sc.id}`);
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setSelectedOptionIndex(0);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">+2</span>
                    {hasSolved && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black block">{sc.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Simulation Sandbox Deck */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
              +2 نقاط تحليل افتراضي
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {currentScenario.title}
              </h3>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          {/* Hypothesis intro */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1 text-xs">
            <span className="font-bold text-indigo-300 block">الفرضية النظرية المطروحة للاختبار:</span>
            <p className="text-slate-200 leading-relaxed font-sans sm:text-sm">
              {currentScenario.hypothesis}
            </p>
          </div>

          {/* Interactive Parameter Control */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-300 block">
              تحكم بالمعامل الفيزيائي: [{currentScenario.simParamName}]
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentScenario.paramOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIndex(idx)}
                  className={`p-4 rounded-2xl border-2 text-right transition-all space-y-1.5 ${
                    selectedOptionIndex === idx
                      ? 'bg-indigo-600/20 border-indigo-400 shadow-lg text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black block text-indigo-200">
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>زاوية الانحراف: {opt.deflectionAngle}°</span>
                    <span>•</span>
                    <span>نسبة الارتداد: {opt.bouncePercent}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Physical Outcome Visual Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-indigo-400 font-bold">محاكاة المخرجات التجريبية</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>النتيجة الفيزيائية المباشرة للسيناريو:</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-cyan-200 leading-relaxed font-medium bg-slate-900/80 p-4 rounded-xl border border-cyan-500/30">
              {activeOption.result}
            </p>

            <div className="pt-2 text-xs text-slate-400 border-t border-slate-800 flex items-center justify-between">
              <span>{currentScenario.lessonTieIn}</span>
              <button
                onClick={handleApplyScenario}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                توثيق النتيجة في دفتر الباحث (+2 نقطة)
              </button>
            </div>
          </div>

          {/* Scientific Context */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <b className="text-amber-400 ml-1">الخلاصة العلمية:</b>
            <span>{currentScenario.scientificAnalysis}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
