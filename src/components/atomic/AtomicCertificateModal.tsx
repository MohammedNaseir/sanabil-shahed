import React, { useRef } from 'react';
import { useDialog } from '../../utils/useDialog';
import { Award, Download, Printer, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface CertificateProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  chemicalId?: string;
  score: number;
  dateStr?: string;
}

export function AtomicCertificateModal({
  isOpen,
  onClose,
  studentName,
  chemicalId = 'FALCON-ATOM-2026',
  score,
  dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
}: CertificateProps) {
  const { dialogProps, titleId } = useDialog(onClose);
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md select-none overflow-y-auto">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-4xl sm:my-auto flex flex-col rounded-t-[28px] sm:rounded-3xl bg-slate-900 border hairline overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة الشهادة</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" aria-hidden="true" /><span className="sr-only">إغلاق</span>
          </button>
        </div>

        {/* Certificate Printable Area */}
        <div className="p-4 sm:p-8 flex justify-center bg-slate-950">
          <div
            ref={certificateRef}
            className="relative w-full max-w-3xl rounded-3xl p-6 sm:p-10 border-4 border-double border-amber-500/60 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-center space-y-6 shadow-2xl overflow-hidden"
          >
            {/* Elegant Corner Motifs */}
            <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-amber-400/80 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-amber-400/80 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-amber-400/80 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-amber-400/80 rounded-br-xl pointer-events-none" />

            {/* Platform & School Top Lockup */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
              <div className="flex items-center gap-2 text-right">
                <img
                  src="/sanabil-logo.png"
                  alt="سنابل"
                  className="w-10 h-10 object-contain p-1 bg-white/10 rounded-xl border border-amber-400/40"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-300">منصة سنابل التعليمية</h4>
                  <p className="text-[10px] text-slate-400">فلسطين • صرح الكيمياء الرقمي</p>
                </div>
              </div>

              <div className="text-left">
                <span className="text-[10px] font-mono text-slate-400 block">رقم الاعتماد البحثي</span>
                <span className="text-xs font-mono font-bold text-amber-400">{chemicalId}</span>
              </div>
            </div>

            {/* Certificate Core Titles */}
            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black">
                <Award className="w-4 h-4 text-amber-400" />
                <span>شهادة استحقاق واجتياز علمي معتمد</span>
              </div>

              <h2 id={titleId} className="text-2xl sm:text-4xl font-black text-white tracking-wide pt-1">
                وسام باحث الذرة المعتمد
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                تشهد إدارة مختبر الكيمياء التفاعلي ومنصة سنابل التعليمية بأن الباحث/ـة:
              </p>
            </div>

            {/* Recipient Full Name */}
            <div className="py-2">
              <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-blue-900/40 to-amber-500/20 border-b-2 border-amber-400">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide">
                  {studentName}
                </span>
              </div>
            </div>

            {/* Citation */}
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
              قد أتم بنجاح واقتدار متطلبات البحث والاستكشاف في <b className="text-cyan-300 font-bold">مختبر الذرة</b>، وتعمق في تسلسل النماذج الذرية (ديموقريطس، أرسطو، بويل، دالتون، فاراداي، ثومسون، بيكوريل، رذرفورد)، وأجرى محاكاة تجارب التفريغ الكهربائي وصفيحة الذهب، واجتاز بنك التحديات العلمية الختامية برصيد:
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-base font-black text-amber-400 font-mono">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الرصيد العلمي: {score} نقطة بحثية</span>
            </div>

            {/* Signatures & Seal */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-amber-500/30 text-xs">
              <div className="text-right space-y-1">
                <span className="text-slate-400 block text-[11px]">معلمة المادة ومشرفة المختبر:</span>
                <span className="text-sm font-black text-amber-300 block">أ. شهد نصير</span>
                <span className="text-[10px] text-slate-400 font-mono">صقور الكيمياء • فلسطين</span>
              </div>

              <div className="text-left space-y-1">
                <span className="text-slate-400 block text-[11px]">تاريخ المنح والاعتماد:</span>
                <span className="text-xs font-mono font-bold text-slate-200 block">{dateStr}</span>
                <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 justify-start">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>معتمد رسمياً في منصة سنابل</span>
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400">مبارك إنجازك الاستثنائي في عالم الذرة!</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all active:scale-95"
          >
            إغلاق ومواصلة التميز
          </button>
        </div>

      </div>
    </div>
  );
}
