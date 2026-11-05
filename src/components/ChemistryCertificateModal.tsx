import React from 'react';
import { useDialog } from '../utils/useDialog';
import { X, Printer, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { sounds } from '../utils/audio';
import { LAB_MAX, rankTitle } from '../content/tasks';

interface ChemistryCertificateModalProps {
  student: Student;
  onClose: () => void;
}

export const ChemistryCertificateModal: React.FC<ChemistryCertificateModalProps> = ({
  student,
  onClose,
}) => {
  const { dialogProps, titleId } = useDialog(onClose);
  const TOTAL_POINTS = LAB_MAX.at + LAB_MAX.ca + LAB_MAX.su + LAB_MAX.si; // مجموع نقاط المختبرات الأربعة

  const handlePrint = () => {
    sounds.click();
    window.print();
  };

  const percentage = Math.round((student.totalPoints / TOTAL_POINTS) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-3xl bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl shadow-2xl p-4 sm:p-8 flex flex-col max-h-[94svh] sm:max-h-[96svh] sm:h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.click();
            onClose();
          }}
          className="print:hidden absolute top-4 left-4 p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" aria-hidden="true" /><span className="sr-only">إغلاق</span>
        </button>

        {/* Certificate Container (Styled for Screen & High-Res Print) */}
        <div
          id="certificate-print-area"
          className="relative rounded-2xl bg-slate-950 border-4 border-amber-400/80 p-6 sm:p-10 shadow-2xl overflow-hidden text-center text-slate-100"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(30, 58, 138, 0.25) 0%, rgba(2, 6, 23, 0.95) 100%)`
          }}
        >
          {/* Inner Golden Border */}
          <div className="absolute inset-2 sm:inset-3 border border-amber-500/40 rounded-xl pointer-events-none" />
          
          {/* Corner Decorative Falcon Flourishes */}
          <div className="absolute top-4 right-4 text-amber-400 text-xs font-serif font-bold opacity-60">⚜️</div>
          <div className="absolute top-4 left-4 text-amber-400 text-xs font-serif font-bold opacity-60">⚜️</div>
          <div className="absolute bottom-4 right-4 text-amber-400 text-xs font-serif font-bold opacity-60">⚜️</div>
          <div className="absolute bottom-4 left-4 text-amber-400 text-xs font-serif font-bold opacity-60">⚜️</div>

          {/* Official Sanabil Logo & Header */}
          <div className="flex flex-col items-center justify-center space-y-2 mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 p-1.5 border-2 border-amber-400/50 shadow-lg shadow-amber-500/10 mb-1">
              <img
                src="/sanabil-logo.png"
                alt="شعار منصة سنابل التعليمية"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-amber-400 tracking-wider">
              مـنـصـة سـنـابـل الـتـعـلـيـمـيـة • مـخـتـبـر الـكـيـمـيـاء
            </span>
            <h2 id={titleId} className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 bg-clip-text text-transparent">
              شهادة رحلة البحث والاكتشاف
            </h2>
            <div className="h-0.5 w-32 sm:w-48 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-1" />
          </div>

          {/* Body Text */}
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto my-6">
            <p className="text-slate-300 font-medium">
              تُمنح هذه الشهادة بكل فخر واعتزاز من قِبل المعلمة: <b className="text-amber-400 text-sm sm:text-base font-black">أ. شهد نصير</b> في <b className="text-blue-300">منصة سنابل التعليمية</b>
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/70 border-2 border-amber-500/40 my-3">
              <span className="text-xs text-slate-400 block mb-1">إلى صقر الكيمياء الباحث / الباحثة:</span>
              <span className="text-xl sm:text-2xl font-black text-white tracking-wide block text-amber-300">
                {student.fullName}
              </span>
              <div className="flex items-center justify-center gap-2 mt-2 font-mono text-xs text-slate-300">
                <span className="text-slate-400">رقم الطالب:</span>
                <span className="bg-amber-500/20 px-2.5 py-0.5 rounded text-amber-300 font-black border border-amber-500/30">
                  {student.chemicalId || student.id}
                </span>
              </div>
            </div>

            <p className="text-slate-200 text-xs sm:text-sm">
              تقديراً لإنجازه مختبرَي <b className="text-amber-300">«الذرة» و«العناصر: الكالسيوم والكبريت والسيليكون» — الصف العاشر</b>، ونيله لقب <b className="text-amber-300">«{rankTitle(student.totalPoints)}»</b> برصيد:
            </p>

            {/* Score Highlight Box */}
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 via-blue-900/40 to-amber-500/20 border border-amber-400/60 shadow-inner">
              <span className="text-base sm:text-lg font-black text-amber-300">
                ⭐ {student.totalPoints} نقطة
              </span>
              <span className="text-slate-400 text-xs font-bold">
                من أصل {TOTAL_POINTS} نقطة مكتملة
              </span>
              {percentage > 0 && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  نسبة الإنجاز: {percentage}%
                </span>
              )}
            </div>

            {/* Falcon & Chemistry Appreciation Message */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-right mt-4 space-y-1.5 shadow-sm">
              <span className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                <span>🦅 تحية فخر واعتزاز بلغة الصقور والكيمياء:</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-bold">
                خرجتَ من مختبر أ. شهد وقد عشتَ تجربة كيميائية واكتشفتَ بنفسك. فضولك هو بداية كل اكتشاف جديد!
              </p>
            </div>
          </div>

          {/* Footer Seals & Signatures */}
          <div className="pt-6 border-t border-amber-500/30 grid grid-cols-2 gap-4 items-end mt-6">
            
            {/* Golden Seal */}
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center text-slate-950 font-black text-xs shrink-0">
                <div className="w-full h-full rounded-full border border-slate-900/60 flex flex-col items-center justify-center text-[8px] font-extrabold leading-tight">
                  <span>ختم رسمي</span>
                  <span>معتمد 🦅</span>
                </div>
              </div>
              <div className="text-[11px]">
                <span className="font-extrabold text-amber-300 block">وسام صقور الكيمياء</span>
                <span className="text-slate-400 block text-[10px]">منصة سنابل التعليمية</span>
              </div>
            </div>

            {/* Teacher Signature */}
            <div className="text-left space-y-0.5">
              <span className="text-[11px] text-slate-400 block">المعلمة المشرفة:</span>
              <span className="text-sm sm:text-base font-black text-amber-300 block">أ. شهد نصير</span>
              <span className="text-[10px] text-slate-400 block">منصة سنابل التعليمية</span>
            </div>

          </div>

        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="print:hidden mt-6 flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors shadow-md"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة أو حفظ الشهادة (PDF)</span>
          </button>

          <button
            onClick={() => {
              sounds.click();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
