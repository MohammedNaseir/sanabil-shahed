import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AtelierBackdrop } from './AtelierBackdrop';
import { ThemeToggle } from '../ThemeToggle';
import { sounds } from '../../utils/audio';

interface ReceptionScreenProps {
  onEnterLab: () => void;
}

/**
 * شاشة الاستقبال: تكوين تحريري غير متماثل —
 * العنوان والعبارات على اليمين، والصقر داخل «محراب» ذهبي على اليسار.
 */
export const ReceptionScreen: React.FC<ReceptionScreenProps> = ({ onEnterLab }) => {
  const handleEnter = () => {
    sounds.click();
    onEnterLab();
  };

  return (
    <div className="relative min-h-[100svh] w-full flex flex-col text-slate-100 overflow-hidden" dir="rtl">
      <AtelierBackdrop />

      {/* الشريط العلوي */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/sanabil-logo.png" alt="منصة سنابل التعليمية" className="h-11 sm:h-12 w-auto object-contain" />
          <span className="hidden sm:block h-8 w-px bg-amber-400/30" aria-hidden="true" />
          <span className="hidden sm:block text-xs text-slate-400 leading-tight">
            منصة سنابل التعليمية<br />الكيمياء • الصف العاشر
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center">

        {/* النص */}
        <section className="stagger order-2 lg:order-1 text-right">
          <p className="flex items-center gap-3 text-[13px] text-amber-400 font-medium">
            <span className="h-px w-10 bg-amber-400/60" aria-hidden="true" />
            المنهاج الفلسطيني • مراجعة فصل الذرة والعناصر
          </p>

          <h1 className="mt-4 font-display text-[2.9rem] leading-[1.15] sm:text-7xl lg:text-[5.4rem] text-white">
            مختبر أ. شهد
            <span className="block text-amber-400">صقور الكيمياء</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg sm:text-2xl leading-relaxed text-slate-100 font-display font-medium">
            «كل اكتشاف يبدأ بسؤال… استعدوا لرحلة جديدة في عالم العناصر!»
          </p>
          <p className="mt-3 max-w-xl text-[15px] sm:text-base leading-loose text-slate-400">
            مرحبًا بكم يا صقور الكيمياء! اليوم مراجعة على شكل ألعاب وتحديات: نراجع فصل الذرة والعناصر كاملًا بالأنشطة والألعاب، ونجمع النقاط، ونرى من يصبح «صقر الكيمياء».
          </p>

          <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-5">
            <button
              type="button"
              onClick={handleEnter}
              className="group inline-flex items-center justify-between sm:justify-center gap-4 ps-7 pe-2 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-lg hover:bg-amber-400 active:scale-[0.98] transition-all"
            >
              <span>الدخول إلى المختبر</span>
              <span className="w-11 h-11 rounded-full bg-slate-950/90 text-amber-400 flex items-center justify-center group-hover:-translate-x-1 transition-transform" aria-hidden="true">
                <ArrowLeft className="w-5 h-5" />
              </span>
            </button>

            <div className="text-sm leading-tight">
              <span className="block text-slate-500 text-xs">إعداد وإشراف</span>
              <span className="font-display text-amber-300 text-lg">أ. شهد نصير</span>
            </div>
          </div>

          {/* أرقام المختبر */}
          <dl className="mt-12 grid grid-cols-3 max-w-md border-t hairline pt-5">
            {[
              ['٢', 'مرحلتان'],
              ['٢٧', 'محطة ولعبة'],
              ['١٠', 'الصف'],
            ].map(([n, label]) => (
              <div key={label} className="border-s hairline first:border-s-0 ps-4 first:ps-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl text-white">{n}</dd>
                <dd className="text-xs text-slate-500 mt-0.5">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* الصقر داخل محراب */}
        <section className="order-1 lg:order-2 flex justify-center animate-in">
          <figure className="relative w-[230px] sm:w-[320px] lg:w-full max-w-[400px] aspect-[4/5]">
            <div className="absolute inset-0 rounded-t-full border hairline bg-gradient-to-b from-amber-500/10 via-slate-900/40 to-transparent" />
            <div className="absolute inset-3 rounded-t-full border border-amber-400/10" />
            {/* بطاقة عنصر السيليكون في الزاوية */}
            <div className="element-tile absolute -bottom-4 -end-2 sm:-end-6 z-20 w-20 h-24 sm:w-24 sm:h-28 rounded-xl p-2.5 text-right">
              <span className="block font-mono text-[11px] text-slate-400">14</span>
              <span className="block font-display text-3xl sm:text-4xl text-amber-400 leading-none mt-1">Si</span>
              <span className="block text-[10px] text-slate-400 mt-1">سيليكون</span>
            </div>
            <img
              src="/falcon_transparent.webp"
              alt="صقر الكيمياء الملكي"
              className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[125%] max-w-none h-auto object-contain drop-shadow-2xl"
            />
            <figcaption className="sr-only">صقر الكيمياء الملكي — سنابل في الكيمياء</figcaption>
          </figure>
        </section>
      </main>

      <footer className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t hairline">
        <span>منصة سنابل التعليمية • جميع الحقوق محفوظة لأ. شهد نصير</span>
        <span>الكيمياء للصف العاشر — دولة فلسطين</span>
      </footer>
    </div>
  );
};
