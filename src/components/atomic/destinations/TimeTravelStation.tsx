import React, { useState } from 'react';
import { 
  History, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Award, 
  RotateCcw, Compass, ArrowLeft, HelpCircle, Check, Eye
} from 'lucide-react';
import { SCIENTISTS_TIMELINE, ScientistEra } from '../../../data/atomicLabContent';

interface TimeTravelStationProps {
  onBack: () => void;
  onAwardPoints: (points: number, taskId: string) => void;
  onRecordDeduction: (title: string, text: string) => void;
  solvedQuizzes: string[];
}

export function TimeTravelStation({
  onBack,
  onAwardPoints,
  onRecordDeduction,
  solvedQuizzes
}: TimeTravelStationProps) {
  const [selectedScientistId, setSelectedScientistId] = useState<string>('democritus');
  const [activeTab, setActiveTab] = useState<'gallery' | 'match_models' | 'timeline_order'>('gallery');

  // Matching game state
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [matchingFeedback, setMatchingFeedback] = useState<string>('');

  // Ordering game state (8 scientists in scrambled order)
  const [userOrder, setUserOrder] = useState<string[]>([
    'rutherford', 'aristotle', 'dalton', 'democritus', 'boyle', 'becquerel', 'faraday', 'thomson'
  ]);
  const [orderChecked, setOrderChecked] = useState<boolean>(false);
  const [isOrderCorrect, setIsOrderCorrect] = useState<boolean>(false);

  // Selected Scientist
  const currentScientist = SCIENTISTS_TIMELINE.find(s => s.id === selectedScientistId) || SCIENTISTS_TIMELINE[0];

  // Quiz Handling
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleQuizSubmit = (scientist: ScientistEra) => {
    if (quizAnswer === null) return;
    setQuizSubmitted(true);
    const isCorrect = quizAnswer === scientist.quiz.correctIndex;
    if (isCorrect && !solvedQuizzes.includes(`quiz_${scientist.id}`)) {
      onAwardPoints(scientist.quiz.points, `quiz_${scientist.id}`);
      onRecordDeduction(
        `إنجاز محطة ${scientist.name}`,
        `تم استيعاب إسهام العالم ${scientist.name} ونموذجه: ${scientist.modelName} وفق المنهاج.`
      );
    }
  };

  // Model Match Check
  const handleModelClick = (modelKey: string) => {
    setSelectedModel(modelKey);
  };

  const handleScientistMatch = (scientistId: string) => {
    if (!selectedModel) return;
    const isCorrectMatch = 
      (scientistId === 'dalton' && selectedModel === 'sphere') ||
      (scientistId === 'thomson' && selectedModel === 'plum_pudding') ||
      (scientistId === 'rutherford' && selectedModel === 'nuclear_planetary') ||
      (scientistId === 'aristotle' && selectedModel === 'continuous_elements') ||
      (scientistId === 'boyle' && selectedModel === 'gas_experiment');

    if (isCorrectMatch) {
      setMatchedPairs(prev => ({ ...prev, [scientistId]: selectedModel }));
      setSelectedModel(null);
      setMatchingFeedback('إجابة مطابقة ممتازة وصحيحة علمياً!');
      onAwardPoints(2, `match_${scientistId}`);
    } else {
      setMatchingFeedback('تطابق غير صحيح! راجع بدقة مواصفات النموذج والخصائص المقررة في الكتاب.');
    }
  };

  // Move in ordering
  const moveOrderItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= userOrder.length) return;
    const newArr = [...userOrder];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setUserOrder(newArr);
    setOrderChecked(false);
  };

  const checkChronologicalOrder = () => {
    const correctIds = ['democritus', 'aristotle', 'boyle', 'dalton', 'faraday', 'thomson', 'becquerel', 'rutherford'];
    const isCorrect = userOrder.every((id, idx) => id === correctIds[idx]);
    setOrderChecked(true);
    setIsOrderCorrect(isCorrect);
    if (isCorrect && !solvedQuizzes.includes('timeline_order_complete')) {
      onAwardPoints(3, 'timeline_order_complete');
      onRecordDeduction(
        'التسلسل التاريخي لتطور مفهوم الذرة',
        'تمكن الباحث من ترتيب العلماء الثمانية زمنياً بدقة: ديموقريطس -> أرسطو -> بويل -> دالتون -> فاراداي -> ثومسون -> بيكوريل -> رذرفورد.'
      );
    }
  };

  return (
    <div 
      className="max-w-6xl w-full mx-auto space-y-6 select-none animate-in fade-in duration-200 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'var(--veil), url(/assets/aistudio/image_af24453e.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      
      {/* Top Header */}
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
            <span>رحلة الذرة عبر الزمن</span>
            <History className="w-6 h-6 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">
            المعرض التاريخي التفاعلي للعلماء وتطور النماذج الذرية • الكتاب ص 4 - 13
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 gap-1 text-xs font-bold max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-2 px-3 rounded-xl transition-colors ${
            activeTab === 'gallery'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          معرض العلماء والنماذج (8 محطات)
        </button>
        <button
          onClick={() => setActiveTab('match_models')}
          className={`flex-1 py-2 px-3 rounded-xl transition-colors ${
            activeTab === 'match_models'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          مطابقة النماذج
        </button>
        <button
          onClick={() => setActiveTab('timeline_order')}
          className={`flex-1 py-2 px-3 rounded-xl transition-colors ${
            activeTab === 'timeline_order'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ترتيب الخط الزمني
        </button>
      </div>

      {/* TAB 1: SCIENTISTS GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          
          {/* Horizontal Scientist Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {SCIENTISTS_TIMELINE.map((scientist) => {
              const isSelected = scientist.id === selectedScientistId;
              const hasSolved = solvedQuizzes.includes(`quiz_${scientist.id}`);
              return (
                <button
                  key={scientist.id}
                  onClick={() => {
                    setSelectedScientistId(scientist.id);
                    setQuizAnswer(null);
                    setQuizSubmitted(false);
                  }}
                  className={`px-4 py-3 rounded-2xl border text-right transition-all shrink-0 flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                    {scientist.order}
                  </span>
                  <div>
                    <span className="text-xs font-black block">{scientist.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{scientist.period}</span>
                  </div>
                  {hasSolved && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailed Scientist Station Card */}
          <div className="rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
            
            {/* Header Lockup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                  {currentScientist.period}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  المحطة #{currentScientist.order}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {currentScientist.name}
                </h3>
                <p className="text-xs sm:text-sm text-cyan-400 font-bold mt-0.5">
                  {currentScientist.discovery}
                </p>
              </div>
            </div>

            {/* Split Visual & Model Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              
              {/* Scientific Visual Box (Real Model Drawing) */}
              <div className="rounded-2xl bg-slate-950 p-6 border border-slate-800 flex flex-col items-center justify-center min-h-[260px] text-center space-y-3 relative overflow-hidden">
                
                {/* 1. Democritus Philosophical Atom */}
                {currentScientist.modelVisualType === 'philosophical' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-2 border-dashed border-cyan-400/60 flex items-center justify-center bg-cyan-950/20">
                      <span className="text-xs font-black text-cyan-300">Atomos<br />غير قابلة للتجزئة</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-3">فكرة فلسفية: المادة تنتهي لدقائق دقيقة مصمتة صلبة</span>
                  </div>
                )}

                {/* 2. Aristotle Continuous 4 Elements */}
                {currentScientist.modelVisualType === 'continuous_elements' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 w-48 p-2 rounded-2xl bg-slate-900 border border-slate-700">
                      <div className="p-2 rounded-xl bg-blue-950/50 border border-blue-500/40 text-[11px] text-blue-300 font-bold">ماء (Water)</div>
                      <div className="p-2 rounded-xl bg-sky-950/50 border border-sky-500/40 text-[11px] text-sky-300 font-bold">هواء (Air)</div>
                      <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-300 font-bold">تراب (Earth)</div>
                      <div className="p-2 rounded-xl bg-red-950/50 border border-red-500/40 text-[11px] text-red-300 font-bold">نار (Fire)</div>
                    </div>
                    <span className="text-[11px] text-amber-300 mt-3 font-bold">أرسطو: رفض الذرات وافترض المادة متصلة من العناصر الأربعة</span>
                  </div>
                )}

                {/* 3. Robert Boyle Experimental Gas */}
                {currentScientist.modelVisualType === 'gas_experiment' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-44 h-32 rounded-xl bg-slate-900 border border-amber-500/40 p-3 flex flex-col items-center justify-center space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-300 font-bold font-mono">P ∝ 1/V</span>
                        <div className="w-8 h-12 border-2 border-slate-400 rounded-b-md relative flex items-end justify-center">
                          <div className="w-full h-5 bg-sky-500/40" />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-300">المنهج التجريبي والقياس المخبري</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-3">بويل: إرساء المنهج العلمي وإثبات وجود فراغ بين جسيمات الغاز</span>
                  </div>
                )}

                {/* 4. Dalton Solid Sphere Model (كرة مصمتة) */}
                {currentScientist.modelVisualType === 'sphere' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-900 border-2 border-amber-400/50 flex items-center justify-center relative">
                      <div className="w-12 h-12 rounded-full bg-white/10 blur-sm absolute top-3 left-4" />
                      <span className="text-xs font-black text-slate-100 bg-slate-950/60 px-2 py-1 rounded-lg">
                        كرة مصمتة متجانسة
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-300 mt-3 font-bold">
                      نموذج دالتون: الذرة كرة دقيقة مصمتة غير قابلة للانقسام
                    </span>
                  </div>
                )}

                {/* 5. Faraday Electrolysis */}
                {currentScientist.modelVisualType === 'electrolysis' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-48 h-32 rounded-xl bg-blue-950/40 border border-blue-500/40 p-3 flex justify-between items-center relative">
                      <div className="w-4 h-24 bg-red-500/80 rounded-md flex items-center justify-center text-[10px] text-white font-bold" title="قطب موجب (+)">+</div>
                      <div className="flex-1 flex flex-col items-center justify-center text-[11px] text-cyan-300 space-y-1">
                        <span>محلول أيوني</span>
                        <span className="text-[9px] text-slate-400">تفاعلات كيميائية عند الأقطاب</span>
                        <div className="flex gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-[10px] text-blue-200">سالب (-)</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-[10px] text-amber-200">موجب (+)</span>
                        </div>
                      </div>
                      <div className="w-4 h-24 bg-blue-600/80 rounded-md flex items-center justify-center text-[10px] text-white font-bold" title="قطب سالب (-)">-</div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-3">فاراداي: المادة تحوي شحنات موجبة وسالبة ترتبط بالكهرباء</span>
                  </div>
                )}

                {/* 6. Thomson Plum Pudding Model (كرة موجبة مطمور بها إلكترونات سالبة) */}
                {currentScientist.modelVisualType === 'plum_pudding' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-red-500/30 via-orange-500/20 to-red-600/30 border-2 border-red-500/60 relative flex items-center justify-center">
                      <span className="absolute top-2 text-[10px] font-bold text-red-300">كرة متجانسة موجبة (+)</span>
                      <span className="absolute top-8 left-8 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md border border-blue-400">-</span>
                      <span className="absolute top-10 right-9 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md border border-blue-400">-</span>
                      <span className="absolute bottom-9 left-11 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md border border-blue-400">-</span>
                      <span className="absolute bottom-10 right-10 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md border border-blue-400">-</span>
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md border border-blue-400">-</span>
                    </div>
                    <span className="text-[11px] text-amber-300 mt-3 font-bold">
                      نموذج ثومسون (فطيرة الزبيب): كرة موجبة بداخلها شحنات سالبة مطمورة
                    </span>
                  </div>
                )}

                {/* 7. Becquerel Radioactivity */}
                {currentScientist.modelVisualType === 'radiation' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-44 h-32 rounded-xl bg-purple-950/30 border border-purple-500/40 p-4 flex flex-col items-center justify-center relative space-y-2">
                      <div className="w-12 h-12 rounded-lg bg-yellow-500/40 border border-yellow-400 flex items-center justify-center text-xs font-black text-yellow-300 shadow-lg">
                        ²³⁸₉₂ U
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-purple-300 font-mono">
                        <span>إطلاق جسيمات ألفا (α)</span>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ²³⁴₉₀ Th + ⁴₂ α
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-3">بيكوريل: النشاط الإشعاعي الطبيعي وانبعاث دقائق ألفا (أنوية هيليوم +2)</span>
                  </div>
                )}

                {/* 8. Rutherford Nuclear Planetary Model */}
                {currentScientist.modelVisualType === 'nuclear_planetary' && (
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-40 h-40 rounded-full border border-cyan-500/30 flex items-center justify-center relative">
                      <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 rotate-45" />
                      <div className="absolute inset-2 rounded-full border border-dashed border-amber-400/40 -rotate-45" />
                      
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-lg border border-amber-300">
                        + النواة
                      </div>

                      <span className="absolute top-1 right-6 w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-bold flex items-center justify-center">-</span>
                      <span className="absolute bottom-2 left-8 w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-bold flex items-center justify-center">-</span>
                    </div>
                    <span className="text-[11px] text-amber-300 mt-3 font-bold">
                      نموذج رذرفورد: نواة مركزية موجبة صغيرة وإلكترونات تدور في الفراغ
                    </span>
                  </div>
                )}

              </div>

              {/* Textual Science Breakdown */}
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">{currentScientist.modelName}</h4>
                  <p className="mt-1">{currentScientist.modelConcept}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-cyan-300 block">البنود العلمية المعتمدة في المنهاج:</span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {currentScientist.keyPrinciples.map((principle, idx) => (
                      <li key={idx}>{principle}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200">
                  <span className="font-bold block text-red-300">نقد النموذج وحدوده العلمية:</span>
                  <p className="mt-0.5">{currentScientist.critique}</p>
                </div>
              </div>

            </div>

            {/* Micro-Quiz for this scientist */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold">+{currentScientist.quiz.points} نقطة</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>نشاط الفهم السريع: محطة {currentScientist.name}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed">
                {currentScientist.quiz.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentScientist.quiz.options.map((opt, idx) => {
                  const isSelected = quizAnswer === idx;
                  const isCorrect = idx === currentScientist.quiz.correctIndex;
                  return (
                    <button
                      key={idx}
                      disabled={quizSubmitted}
                      onClick={() => setQuizAnswer(idx)}
                      className={`p-3 rounded-xl border text-right text-xs transition-all flex items-start gap-2 ${
                        quizSubmitted && isCorrect
                          ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 font-bold'
                          : quizSubmitted && isSelected && !isCorrect
                          ? 'bg-red-950/40 border-red-500 text-red-200'
                          : isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <div className="flex justify-end pt-1">
                  <button
                    disabled={quizAnswer === null}
                    onClick={() => handleQuizSubmit(currentScientist)}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-all"
                  >
                    تأكيد الإجابة واحتساب النقاط
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <b className="text-amber-400 ml-1">التوضيح العلمي:</b>
                  <span>{currentScientist.quiz.explanation}</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: MATCH SCIENTIST WITH MODEL */}
      {activeTab === 'match_models' && (
        <div className="rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
          
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-white">
              نشاط المطابقة: اربط كل نموذج ذري بالعالم الذي اقترحه
            </h3>
            <p className="text-xs text-slate-300">
              اختر أولاً أحد النماذج الذرية بالأسفل، ثم انقر على اسم العالم المناسب له.
            </p>
          </div>

          {matchingFeedback && (
            <div className="p-3 rounded-xl bg-blue-950/60 border border-cyan-500/40 text-xs text-cyan-200 font-bold">
              {matchingFeedback}
            </div>
          )}

          {/* Atomic Models to select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div
              onClick={() => handleModelClick('sphere')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between text-center space-y-3 ${
                selectedModel === 'sphere'
                  ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-slate-600 border border-slate-400 shadow-md flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">كرة مصمتة</span>
              </div>
              <div>
                <span className="text-xs font-black text-white block">نموذج الكرة المصمتة</span>
                <span className="text-[11px] text-slate-400">ذرة متجانسة صلبة غير قابلة للانقسام</span>
              </div>
              {matchedPairs['dalton'] === 'sphere' && (
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم التطابق مع دالتون
                </span>
              )}
            </div>

            <div
              onClick={() => handleModelClick('plum_pudding')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between text-center space-y-3 ${
                selectedModel === 'plum_pudding'
                  ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-red-900/60 border border-red-400 flex items-center justify-center relative">
                <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center absolute top-2 right-2">-</span>
                <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center absolute bottom-2 left-2">-</span>
                <span className="text-[9px] text-red-200 font-bold">+ متجانسة</span>
              </div>
              <div>
                <span className="text-xs font-black text-white block">فطيرة الزبيب / بودينج</span>
                <span className="text-[11px] text-slate-400">كرة موجبة مطمور بداخلها إلكترونات سالبة</span>
              </div>
              {matchedPairs['thomson'] === 'plum_pudding' && (
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم التطابق مع ثومسون
                </span>
              )}
            </div>

            <div
              onClick={() => handleModelClick('nuclear_planetary')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between text-center space-y-3 ${
                selectedModel === 'nuclear_planetary'
                  ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="w-16 h-16 rounded-full border border-cyan-400/50 flex items-center justify-center relative">
                <div className="w-4 h-4 rounded-full bg-amber-400 text-[8px] font-bold text-slate-950 flex items-center justify-center">+</div>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 text-slate-950 text-[7px] flex items-center justify-center absolute top-1 right-2">-</span>
              </div>
              <div>
                <span className="text-xs font-black text-white block">النموذج النووي الكوكبي</span>
                <span className="text-[11px] text-slate-400">نواة مركزية موجبة والذرة معظمها فراغ</span>
              </div>
              {matchedPairs['rutherford'] === 'nuclear_planetary' && (
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم التطابق مع رذرفورد
                </span>
              )}
            </div>

          </div>

          {/* Scientists clickable target list */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 block">انقر على العالم لتأكيد ربطه بالنموذج المحدد:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dalton', name: 'جون دالتون' },
                { id: 'thomson', name: 'جوزيف جون ثومسون' },
                { id: 'rutherford', name: 'إرنست رذرفورد' }
              ].map(sc => (
                <button
                  key={sc.id}
                  onClick={() => handleScientistMatch(sc.id)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <span>{sc.name}</span>
                  {matchedPairs[sc.id] ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CHRONOLOGICAL ORDERING CHALLENGE */}
      {activeTab === 'timeline_order' && (
        <div className="rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right backdrop-blur-md">
          
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-white">
              تحدي الترتيب الزمني لتطور مفهوم وبنية الذرة
            </h3>
            <p className="text-xs text-slate-300">
              استخدم أزرار الأسهم لإعادة ترتيب العلماء الثمانية حسب تسلسلهم التاريخي الصحيح وفق كتاب سنابل.
            </p>
          </div>

          {orderChecked && (
            <div className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
              isOrderCorrect
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200'
                : 'bg-red-950/40 border-red-500 text-red-200'
            }`}>
              {isOrderCorrect ? (
                <span>أحسنت صنعاً يا بطل الكيمياء! الترتيب الزمني للعلماء الثمانية صحيح ومتقن تماماً (3 نقاط مكتسبة).</span>
              ) : (
                <span>الترتيب غير صحيح بعد. تذكر: ديموقريطس (الفلسفة القديمة) ثم أرسطو (المادة المتصلة) ثم بويل (المنهج التجريبي) ثم دالتون (النظرية الأولى) ثم فاراداي (الكهرباء والمادة) ثم ثومسون (الإلكترون) ثم بيكوريل (النشاط الإشعاعي) وأخيراً رذرفورد (النواة).</span>
              )}
            </div>
          )}

          {/* Order List */}
          <div className="space-y-2.5">
            {userOrder.map((scId, idx) => {
              const scObj = SCIENTISTS_TIMELINE.find(s => s.id === scId);
              return (
                <div
                  key={scId}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveOrderItem(idx, 'up')}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                      title="تحريك لأعلى"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === userOrder.length - 1}
                      onClick={() => moveOrderItem(idx, 'down')}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                      title="تحريك لأسفل"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold text-white block text-sm">{scObj?.name}</span>
                      <span className="text-[11px] text-slate-400">{scObj?.discovery}</span>
                    </div>
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={checkChronologicalOrder}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              فحص الترتيب الزمني
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
