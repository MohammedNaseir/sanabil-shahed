import React from 'react';
import { Atom, FlaskConical, ArrowLeft, Sparkles, BookOpen, Layers, Award, Flame } from 'lucide-react';

interface DualLabGatewayProps {
  onEnterSiliconLab: () => void;
  onEnterAtomicLab: () => void;
  onOpenNotebook: () => void;
  studentPoints?: number;
}

export const DualLabGateway: React.FC<DualLabGatewayProps> = ({
  onEnterSiliconLab,
  onEnterAtomicLab,
  onOpenNotebook,
  studentPoints = 0
}) => {
  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 sm:space-y-8 py-3 sm:py-6 select-none">
      
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/40 text-amber-400 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>بوابة المختبرات العلمية الكبرى • صقور أ. شهد في منصة سنابل</span>
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          اختر مختبرك العلمي للبحث والتجربة
        </h2>
        
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          صُمم هذا الصرح التعليمي التفاعلي ليمنحك تجربة بحثية عميقة تحاكي مختبرات الكيمياء الحقيقية وفق المنهاج الفلسطيني للصف العاشر.
        </p>
      </div>

      {/* Dual Laboratory Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        
        {/* Lab 1: مختبر السيليكون (المختبر الأساسي - مفتوح ونشط) */}
        <div 
          onClick={onEnterSiliconLab}
          className="group relative rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/60 hover:border-amber-400 shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1.5"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition-all" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill / Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>المختبر الأساسي • متاح ونشط للبحث</span>
            </span>
            <span className="text-xs font-mono text-amber-400/90 font-bold">عنصر السيليكون (Si)</span>
          </div>

          {/* Center Graphic & Title */}
          <div className="relative z-10 my-6 space-y-4 text-right">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
              <FlaskConical className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-300 transition-colors">
                مختبر السيليكون ومركباته
              </h3>
              <p className="text-xs sm:text-sm font-bold text-amber-400/90 mt-1">
                المحطات الست: سباق الصقور • فك الشيفرة • الدوارق • فرن الاستخلاص • المحقق • طوق النجاة
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              المختبر التفاعلي الشامل لدرس السيليكون: استخلاص السيليكون واختزال السيليكا، أشباه الموصلات والترانزستورات، والتوزيع الإلكتروني 2,8,4 وحصد النقاط (+1 لكل إجابة).
            </p>

            {/* Feature List */}
            <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>عجلة الحظ لسباق الصقور بـ 12 سؤالاً دقيقاً</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>مختبر الاكتشاف: فك شيفرة المفاهيم الكيميائية الستة</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>فرن الاستخلاص، ميزان المعادلات، وطوق نجاة العالم الغارق</span>
              </li>
            </ul>
          </div>

          {/* Action Trigger */}
          <div className="relative z-10 pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {studentPoints > 0 ? `نقاطك المكتسبة: ${studentPoints} نقطة` : 'المحطات الست بانتظارك'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEnterSiliconLab();
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all"
            >
              <span>ادخل مختبر السيليكون</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        </div>

        {/* Lab 2: مختبر الذرة (المختبر الإضافي) */}
        <div 
          onClick={onEnterAtomicLab}
          className="group relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1.5"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill / Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>متاح أيضاً • استكشاف بنية الذرة</span>
            </span>
            <span className="text-xs font-mono text-cyan-400/80">الوحدة 1 • الفصل الأول</span>
          </div>

          {/* Center Graphic & Title */}
          <div className="relative z-10 my-6 space-y-4 text-right">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
              <Atom className="w-9 h-9 animate-spin-slow" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-cyan-300 transition-colors">
                مختبر بنية الذرة
              </h3>
              <p className="text-xs sm:text-sm font-bold text-cyan-400/90 mt-1">
                رحلة استكشاف أسرار البناء الذري والنماذج العلمية
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              انطلق في رحلة ملحمية عبر 6 وجهات: من فرضيات ديمقريطس ودالتون، وتجارب التفريغ الكهربائي لفاراداي وثومسون، وصولاً إلى اكتشاف النشاط الإشعاعي وتجربة رذرفورد للذهب.
            </p>

            {/* Feature List */}
            <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>الذرة المركزية التفاعلية ثلاثية الأبعاد والوجهات الست</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>محاكاة أنبوب التفريغ وتجربة صفيحة الذهب الحقيقية</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>تحديات علمية وشهادة رسمية بلقب «باحث الذرة»</span>
              </li>
            </ul>
          </div>

          {/* Action Trigger */}
          <div className="relative z-10 pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              جاهز للاستكشاف
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEnterAtomicLab();
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition-all"
            >
              <span>ادخل مختبر الذرة</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick Action Bar for Researcher Notebook */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span>دفتر الباحث الكيميائي الرقمي مرافق لك يسجل توقعاتك واستنتاجاتك ونتائجك في أي وقت.</span>
        </div>
        <button
          onClick={onOpenNotebook}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold transition-colors shrink-0"
        >
          فتح دفتر الباحث الرقمي
        </button>
      </div>

    </div>
  );
};
