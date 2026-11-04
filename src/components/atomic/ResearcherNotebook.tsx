import React, { useState, useEffect } from 'react';
import { useDialog } from '../../utils/useDialog';
import { BookOpen, X, CheckCircle2, Bookmark, Save, Sparkles, Award, FileText, Compass } from 'lucide-react';

interface NotebookProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  totalPoints: number;
  completedTasks: string[];
  deductions: { id: string; title: string; text: string; date: string }[];
  /** هوية الطالب (أو guest) حتى لا تختلط ملاحظات طالبين على جهاز واحد. */
  storageScope?: string;
}

export function ResearcherNotebook({
  isOpen,
  onClose,
  studentName = 'باحث الذرة',
  totalPoints,
  completedTasks,
  deductions,
  storageScope = 'guest'
}: NotebookProps) {
  const notesKey = `atomic_researcher_notes:${storageScope}`;
  const { dialogProps, titleId } = useDialog(onClose);
  const [activeTab, setActiveTab] = useState<'notes' | 'deductions' | 'progress'>('notes');
  const [personalNotes, setPersonalNotes] = useState<string>(() => {
    try {
      // ملاحظات النسخة القديمة (المشتركة) تظهر للزائر فقط
      return localStorage.getItem(notesKey) ?? (storageScope === 'guest' ? localStorage.getItem('atomic_researcher_notes') : null) ?? '';
    } catch {
      return '';
    }
  });
  const [savedStatus, setSavedStatus] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(notesKey, personalNotes);
    } catch {}
  }, [personalNotes, notesKey]);

  if (!isOpen) return null;

  const handleManualSave = () => {
    try {
      localStorage.setItem(notesKey, personalNotes);
      setSavedStatus('تم حفظ ملاحظاتك بنجاح في الدفتر!');
      setTimeout(() => setSavedStatus(''), 3000);
    } catch {}
  };

  const tasksList = [
    { id: 'timeline', title: 'رحلة الذرة عبر الزمن (العلماء الستة)', maxPoints: 8 },
    { id: 'infer', title: 'مختبر فكّر واستنتج (تجارب التفريغ ورذرفورد)', maxPoints: 12 },
    { id: 'explain', title: 'مختبر فسّر (الظواهر والتفسيرات المعمقة)', maxPoints: 10 },
    { id: 'errors', title: 'مختبر اكتشف الخطأ (فحص النماذج وتصحيحها)', maxPoints: 8 },
    { id: 'whatif', title: 'مختبر ماذا لو؟ (التحديات الافتراضية)', maxPoints: 6 },
    { id: 'final_challenge', title: 'مختبر التحدي الختامي (الامتحان الشامل واللقب)', maxPoints: 16 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md select-none">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-3xl max-h-[94svh] sm:max-h-[96svh] sm:h-[90vh] flex flex-col rounded-t-[28px] sm:rounded-3xl bg-slate-900 border hairline shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Notebook Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="إغلاق الدفتر"
          >
            <X className="w-5 h-5" aria-hidden="true" /><span className="sr-only">إغلاق</span>
          </button>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <h3 id={titleId} className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5 justify-end">
                <span>دفتر الباحث الكيميائي</span>
                <BookOpen className="w-5 h-5 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400">
                الباحث: <b className="text-slate-200">{studentName}</b> • رصيد النقاط: <b className="text-amber-400 font-mono">{totalPoints}</b>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'notes'
                ? 'border-amber-400 bg-slate-800/80 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ملاحظاتي وتوقعاتي
          </button>
          <button
            onClick={() => setActiveTab('deductions')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'deductions'
                ? 'border-cyan-400 bg-slate-800/80 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            سجل الاستنتاجات العلمية ({deductions.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'progress'
                ? 'border-cyan-400 bg-slate-800/80 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            المهام والتقدم المنجز
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-right space-y-4">
          
          {/* 1. Free Researcher Notes & Hypotheses */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-300">مرحباً بك في مساحتك البحثية الخاصة:</span>
                <p>
                  دوّن هنا فرضياتك قبل إجراء التجارب، وسجّل ملاحظاتك حول مشاهدات أنبوب التفريغ وتجربة رذرفورد، واكتب أي تساؤل تود مناقشته مع معلمتك أ. شهد نصير.
                </p>
              </div>

              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                placeholder="اكتب هنا توقعاتك وملاحظاتك العلمية أثناء تفحص المختبر... (يتم الحفظ التلقائي على جهازك)"
                rows={10}
                className="w-full rounded-2xl bg-slate-950 border border-slate-700 focus:border-amber-400 p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors resize-y leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-cyan-400 font-bold">{savedStatus}</span>
                <button
                  onClick={handleManualSave}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>تأكيد الحفظ في الدفتر</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Scientific Deductions Log */}
          {activeTab === 'deductions' && (
            <div className="space-y-3">
              {deductions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">لا توجد استنتاجات مسجلة بعد</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    عند إتمام الأنشطة في مختبر "فكّر واستنتج" ومختبر "فسّر"، سيتم توثيق استنتاجاتك العلمية المعتمدة هنا تلقائياً.
                  </p>
                </div>
              ) : (
                deductions.map((d, index) => (
                  <div key={d.id || index} className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 text-[11px]">{d.date}</span>
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span>{d.title}</span>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {d.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. Progress & Completed Missions */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 to-slate-900 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">إجمالي النقاط المكتسبة</span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    {totalPoints} نقطة
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-400">الرتبة البحثية</span>
                  <div className="text-sm font-black text-cyan-300">
                    {totalPoints >= 30 ? 'باحث الذرة المعتمد 🏆' : totalPoints >= 15 ? 'مستكشف متقدم 🔬' : 'باحث مبتدئ 🧪'}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400">حالة إنجاز الوجهات الست:</h4>
                {tasksList.map((task) => {
                  const isDone = completedTasks.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        isDone
                          ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-600 inline-block shrink-0" />
                        )}
                        <span className="font-bold text-slate-200">{task.title}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px] shrink-0">
                        {isDone ? 'مكتمل' : `حتى ${task.maxPoints} نقاط`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Notebook Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>صقور الكيمياء • مختبر أ. شهد نصير</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            إغلاق ومتابعة البحث
          </button>
        </div>

      </div>
    </div>
  );
}
