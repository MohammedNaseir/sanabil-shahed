import React from 'react';
import { ChemBackdrop } from './ChemBackdrop';
import { SanabilLogo } from './SanabilLogo';
import { sounds } from '../../utils/audio';

interface ReceptionScreenProps {
  onEnterLab: () => void;
}

/**
 * الواجهة الرئيسية: الشريط العلوي، العنوان، الشعار، الصقر، عبارات الترحيب، زر الدخول، والتذييل.
 */
export const ReceptionScreen: React.FC<ReceptionScreenProps> = ({ onEnterLab }) => {
  const handleEnter = () => {
    sounds.click();
    onEnterLab();
  };

  return (
    <div className="navy-shell relative min-h-[100svh] w-full flex flex-col overflow-hidden" dir="rtl">
      <ChemBackdrop />

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8 pb-6 flex flex-col items-center text-center stagger">
        {/* 1. الشريط العلوي */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <span className="gold-pill rounded-xl px-4 py-2 text-[13px] sm:text-sm text-white">المنهاج الفلسطيني | كيمياء الصف العاشر</span>
          <span className="gold-pill rounded-xl px-4 py-2 text-[13px] sm:text-sm text-white">مختبرات صقور الكيمياء في سنابل</span>
        </div>

        {/* 2. العنوان */}
        <h1 className="mt-8 sm:mt-10 font-display text-[2.6rem] leading-[1.2] sm:text-6xl lg:text-7xl text-white">
          مختبرات <span className="text-amber-300">صقور الكيمياء</span>
        </h1>

        {/* 3. الشعار والإشراف */}
        <SanabilLogo size="lg" className="mt-7" />
        <p className="mt-3 text-[15px] text-slate-200">
          إعداد وإشراف: <span className="font-display text-amber-300">أ. شهد نصير</span>
        </p>

        {/* 4. الصقر الكيميائي */}
        <figure className="relative mt-4 w-[250px] sm:w-[330px] lg:w-[360px] aspect-square">
          <div className="absolute inset-[12%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(74,123,230,0.28), transparent 68%)' }} aria-hidden="true" />
          <img
            src="/falcon_transparent.webp"
            alt="الصقر الكيميائي — شعار مختبرات صقور الكيمياء"
            className="relative w-full h-full object-contain drop-shadow-2xl"
          />
        </figure>

        {/* 5. عبارات الترحيب */}
        <p className="mt-2 max-w-2xl font-display text-xl sm:text-2xl leading-relaxed text-white">
          «مرحبًا بكم في عالم مختبرات صقور الكيمياء… حيث تبدأ مغامرة الأسئلة والتحديات!»
        </p>
        <p className="mt-3 max-w-2xl text-[15px] sm:text-lg leading-loose text-slate-200">
          «من سنابل، وبشغف الكيمياء، نفتح أبواب الأسئلة، ونفكّر كيميائيًا، ونتحدى عقولنا لنصل إلى الإجابة!»
        </p>

        {/* 6. زر الدخول */}
        <button
          type="button"
          onClick={handleEnter}
          className="gold-cta mt-8 w-full max-w-xs h-14 rounded-2xl font-display text-lg sm:text-xl"
        >
          الدخول إلى المختبر
        </button>
        <p className="mt-2.5 text-xs text-slate-300">اضغط للانتقال إلى شاشة اختيار المختبرات</p>
      </main>

      {/* 7. التذييل */}
      <footer className="relative z-10 w-full px-5 pb-6 pt-2 text-center text-[12px] leading-relaxed text-white/85">
        <p>منصة سنابل التعليمية | أ. شهد عارف نصير</p>
        <p>الكيمياء للصف العاشر | دولة فلسطين</p>
      </footer>
    </div>
  );
};
