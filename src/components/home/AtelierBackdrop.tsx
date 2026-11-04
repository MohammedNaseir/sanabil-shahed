import React from 'react';

/**
 * خلفية هادئة: مدارات ذرية رفيعة بخط ذهبي وشبكة دقيقة، بدل الفقاعات والتوهجات.
 */
export const AtelierBackdrop: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <svg className="absolute -left-40 top-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.22] text-amber-400" viewBox="0 0 900 900" fill="none">
      <g stroke="currentColor" strokeWidth="0.8">
        <ellipse cx="450" cy="450" rx="420" ry="150" />
        <ellipse cx="450" cy="450" rx="420" ry="150" transform="rotate(60 450 450)" />
        <ellipse cx="450" cy="450" rx="420" ry="150" transform="rotate(120 450 450)" />
        <circle cx="450" cy="450" r="300" strokeDasharray="2 10" />
        <circle cx="450" cy="450" r="440" strokeOpacity="0.5" />
      </g>
      <circle cx="450" cy="450" r="10" fill="currentColor" fillOpacity="0.7" />
      <circle cx="870" cy="450" r="5" fill="currentColor" className="origin-center" />
    </svg>
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          'linear-gradient(to right, var(--color-amber-400) 1px, transparent 1px), linear-gradient(to bottom, var(--color-amber-400) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse at 70% 40%, black, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black, transparent 70%)',
      }}
    />
  </div>
);
