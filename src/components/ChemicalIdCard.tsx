import React from 'react';
import { X, Award, Shield, CheckCircle2, Clock, Printer, Sparkles, Flame, Atom } from 'lucide-react';
import { Student } from '../types';
import { sounds } from '../utils/audio';
import { useDialog } from '../utils/useDialog';
import { rankTitle } from '../content/tasks';

interface ChemicalIdCardProps {
  student: Student;
  onClose: () => void;
  onOpenCertificate: () => void;
  onSwitchStudent?: () => void;
}

export const ChemicalIdCard: React.FC<ChemicalIdCardProps> = ({ student, onClose, onOpenCertificate, onSwitchStudent }) => {
  const { dialogProps, titleId } = useDialog(onClose);
  const isApproved = student.status === 'approved';

  const handlePrint = () => {
    sounds.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-lg bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl p-4 sm:p-8 shadow-2xl max-h-[94svh] sm:max-h-[96svh] sm:h-[90vh] overflow-y-auto">
        
        {/* Decorative laboratory elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.click();
            onClose();
          }}
          aria-label="إغلاق البطاقة"
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <Atom className="w-3.5 h-3.5 animate-spin-slow" />
            <span>البطاقة الرسمية المعتمدة للمختبر</span>
          </div>
          <h2 id={titleId} className="text-2xl font-black text-white">بطاقة الهوية الكيميائية</h2>
          <p className="text-xs text-slate-400 mt-1">صقور أ. شهد — منصة سنابل التعليمية</p>
        </div>

        {/* The Holographic Card */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950/80 to-slate-900 border-2 border-amber-400/50 p-6 shadow-xl overflow-hidden group">
          {/* Subtle metallic sheen */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400 text-2xl font-black shadow-inner">
                🦅
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 tracking-wider uppercase block">
                  جمهورية الكيمياء الرقمية
                </span>
                <span className="text-sm font-black text-slate-100">
                  مختبرا الذرة والعناصر
                </span>
              </div>
            </div>

            <div className="text-left font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">رقم الطالب</span>
              <span className="text-amber-300 font-extrabold tracking-wider bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/30 text-sm">
                {student.chemicalId || student.id}
              </span>
            </div>
          </div>

          {/* Body Information */}
          <div className="space-y-3.5 text-sm">
            
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">اسم الباحث / الباحثة</span>
              <span className="text-lg font-black text-white tracking-wide block">
                {student.fullName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">اللقب الكيميائي</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  {rankTitle(student.totalPoints)}
                </span>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">الرصيد الكيميائي</span>
                <span className="text-xs sm:text-sm font-black text-yellow-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-yellow-400" />
                  ⭐ {student.totalPoints} نقطة
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">الانتماء الأكاديمي</span>
                <span className="text-xs font-bold text-blue-200">
                  {student.affiliation}
                </span>
              </div>
              <img
                src="/sanabil-logo.png"
                alt="شعار منصة سنابل"
                className="w-10 h-10 object-contain rounded-lg bg-white/10 p-0.5 border border-amber-400/30"
              />
            </div>

            {/* Approval Status */}
            <div className="pt-2">
              {isApproved ? (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>معتمد رسمياً من قِبل أ. شهد نصير</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    نشط في المختبر
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>قيد المراجعة والاعتماد من المعلمة</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">
                    انتظار الموافقة
                  </span>
                </div>
              )}
            </div>

            {/* Micro Stations Progress */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">نقاط المختبرات:</span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {([['at', '⚛️', 'الذرة'], ['ca', '🧪', 'الكالسيوم'], ['su', '🔥', 'الكبريت'], ['si', '💡', 'السيليكون']] as const).map(([k, icon, name]) => {
                  const pts = student.labPoints?.[k] ?? 0;
                  return (
                    <div key={k} className={`p-1.5 rounded-lg border text-[10px] flex flex-col items-center justify-center ${pts ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      <span className="text-base" aria-hidden="true">{icon}</span>
                      <span>{name}</span>
                      <b className="font-mono">{pts}</b>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer security chip visual */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-mono tracking-wider">SANABIL · CHEM-10</span>
            <span className="text-amber-400 font-bold">✨ صقر معتمد</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-2 flex-wrap">
          {isApproved && (
            <button
              onClick={() => {
                sounds.click();
                onOpenCertificate();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-blue-900/30 to-amber-500/20 hover:from-amber-500/30 hover:to-blue-900/50 border border-amber-400 text-amber-300 text-xs font-black transition-all shadow-md"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>📜 شهادة رحلة البحث</span>
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {onSwitchStudent && (
              <button
                type="button"
                onClick={onSwitchStudent}
                className="px-3 py-2.5 rounded-xl text-slate-400 hover:text-white text-[11px] font-bold underline"
              >
                تبديل الطالب
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة البطاقة</span>
            </button>
            
            <button
              onClick={() => {
                sounds.click();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
