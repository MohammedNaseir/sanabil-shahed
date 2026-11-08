import React from 'react';

/**
 * شعار سنابل بالنسخة المعتمدة ذات التفاصيل البيضاء على خلفية كحلية.
 * الصورة نفسها لا تُعدَّل (لا تلوين ولا قصّ للنسب)؛ الخلفية الكحلية إطار حولها فقط.
 */
export const SanabilLogo: React.FC<{ size?: 'sm' | 'lg'; className?: string }> = ({ size = 'sm', className = '' }) => {
  const box = size === 'lg'
    ? 'w-[124px] h-[136px] sm:w-[148px] sm:h-[162px] p-3.5 rounded-[26px]'
    : 'w-11 h-12 p-1.5 rounded-xl';
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${box} ${className}`}
      style={{ background: 'linear-gradient(160deg, #13265a, #0a1a44)', boxShadow: '0 0 0 1px rgba(221,180,85,0.35)' }}
    >
      <img src="/sanabil-logo-white.webp" alt="منصة سنابل التعليمية" className="w-full h-full object-contain" />
    </span>
  );
};
