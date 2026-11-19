/**
 * مكونات مختبر النسب الثابتة: إطار المحطة (مع زر كتم الأصوات)، وأيقونات المحطات.
 * تعيد استخدام مكونات مختبر حفظ الكتلة المشتركة دون تعديلها.
 */
import React, { useState } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../../utils/audio';
import { GOLD } from '../mass/ui';
import type { StationId } from './data';

export { Banner, Choice, ConfirmBtn, GOLD, GoldBtn, QuietBtn, Scale, Txt, goldBurst } from '../mass/ui';

export const LETTERS = ['أ', 'ب', 'ج', 'د'];

/** زر كتم/تشغيل الأصوات (الصوت مطفأ افتراضيًا ولا يعمل شيء تلقائيًا). */
export const SoundToggle: React.FC = () => {
  const [on, setOn] = useState(() => sounds.isEnabled());
  return (
    <button
      type="button"
      onClick={() => setOn(sounds.setEnabled(!sounds.isEnabled()))}
      aria-pressed={on}
      aria-label={on ? 'كتم الأصوات' : 'تشغيل الأصوات'}
      className="gold-pill inline-flex items-center gap-2 h-10 px-3.5 rounded-2xl text-sm text-white hover:text-amber-200 transition-colors"
    >
      {on ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
      <span className="hidden sm:inline">{on ? 'الأصوات تعمل' : 'الأصوات مكتومة'}</span>
    </button>
  );
};

export const RFrame: React.FC<{
  title: string;
  quote?: string;
  points?: number;
  onBack: () => void;
  backLabel?: string;
  children: React.ReactNode;
}> = ({ title, quote, points, onBack, backLabel = 'خريطة المحطات', children }) => (
  <div className="py-2 sm:py-6">
    <div className="flex items-center justify-between gap-2">
      <button type="button" onClick={() => { sounds.click(); onBack(); }} className="gold-pill inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm text-white hover:text-amber-200 transition-colors">
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
        {backLabel}
      </button>
      <div className="flex items-center gap-2">
        <SoundToggle />
        {points !== undefined && (
          <span className="gold-pill rounded-2xl h-10 px-4 inline-flex items-center gap-2 text-sm text-white" aria-live="polite">
            <span className="text-amber-300 font-display text-lg leading-none">{points}</span> نقطة
          </span>
        )}
      </div>
    </div>
    <header className="mt-5 text-center">
      <h1 className="font-display text-3xl sm:text-5xl text-white">{title}</h1>
      {quote && <p className="mt-3 mx-auto max-w-2xl text-[15px] sm:text-lg leading-loose text-amber-200">«{quote}»</p>}
    </header>
    <div className="mt-6">{children}</div>
  </div>
);

export const RIcon: React.FC<{ id: StationId }> = ({ id }) => {
  const st = { stroke: GOLD, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
      {id === 'wheel' && (
        <g>
          <circle cx="40" cy="42" r="28" fill="#1f3f99" {...st} />
          <path d="M40 42 V14 M40 42 L66 33 M40 42 L56 64 M40 42 L24 64 M40 42 L14 33" {...st} strokeWidth="2" />
          <circle cx="40" cy="42" r="6" fill="#0b1838" {...st} />
          <path d="M40 4 L34 14 H46 Z" fill={GOLD} stroke="none" />
        </g>
      )}
      {id === 'who' && (
        <g>
          <circle cx="34" cy="34" r="20" fill="#13265a" {...st} />
          <path d="M49 49 L68 68" {...st} strokeWidth="5" />
          <text x="34" y="43" textAnchor="middle" fontSize="26" fontWeight="800" fill={GOLD} stroke="none" fontFamily="Cairo, sans-serif">؟</text>
        </g>
      )}
      {id === 'teach' && (
        <g>
          <rect x="8" y="12" width="64" height="40" rx="5" fill="#13265a" {...st} />
          <path d="M18 26 H46 M18 36 H34" {...st} strokeWidth="2.5" />
          <path d="M20 66 L40 58 L60 66" {...st} />
          <path d="M26 68 V76 M54 68 V76" {...st} />
          <circle cx="62" cy="30" r="5" fill={GOLD} stroke="none" />
        </g>
      )}
      {id === 'vault' && (
        <g>
          <rect x="10" y="12" width="60" height="56" rx="7" fill="#1f3f99" {...st} />
          <circle cx="40" cy="40" r="15" fill="#0b1838" {...st} />
          <path d="M40 40 V28 M40 40 L50 46" {...st} strokeWidth="2.5" />
          <path d="M16 72 V76 M64 72 V76" {...st} />
        </g>
      )}
      {id === 'match' && (
        <g>
          <path d="M22 14 H58 V34 A18 18 0 0 1 22 34 Z" fill="#c8962e" {...st} />
          <path d="M22 20 H12 A9 9 0 0 0 22 36 M58 20 H68 A9 9 0 0 1 58 36" {...st} />
          <path d="M40 52 V62 M28 68 H52" {...st} />
          <circle cx="40" cy="30" r="5" fill="#fff6dc" stroke="none" />
        </g>
      )}
    </svg>
  );
};
