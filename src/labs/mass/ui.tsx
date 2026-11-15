/**
 * مكونات مشتركة لمحطات «مختبر حفظ الكتلة»: إطار المحطة، لافتات التغذية الراجعة، الخيارات، والميزان.
 * الألوان كحلية وزرقاء وذهبية؛ الأحمر للتنبيه فقط، ولا أخضر.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import confetti from '../../utils/confetti';
import { sounds } from '../../utils/audio';
import type { StationId } from './data';

export const GOLD = '#ddb455';

export function goldBurst(count = 50) {
  confetti({ particleCount: count, spread: 70, origin: { y: 0.65 }, colors: ['#ddb455', '#f6e2a8', '#6f9bf5', '#ffffff'] });
}

/** يكتب النص بالاتجاه المناسب: اللاتيني والرموز من اليسار، والعربي من اليمين. */
export const Txt: React.FC<{ children: string; className?: string }> = ({ children, className = '' }) => (
  <span dir={/[؀-ۿ]/.test(children) ? 'rtl' : 'ltr'} className={`inline-block ${className}`}>{children}</span>
);

// ---------------- إطار المحطة ----------------

export const StationFrame: React.FC<{
  title: string;
  quote: string;
  points?: number;
  onBack: () => void;
  children: React.ReactNode;
}> = ({ title, quote, points, onBack, children }) => (
  <div className="py-2 sm:py-6">
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={() => { sounds.click(); onBack(); }} className="gold-pill inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-sm text-white hover:text-amber-200 transition-colors">
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
        الشاشة الرئيسية للمختبر
      </button>
      {points !== undefined && (
        <span className="gold-pill rounded-2xl h-10 px-4 inline-flex items-center gap-2 text-sm text-white" aria-live="polite">
          <span className="text-amber-300 font-display text-lg leading-none">{points}</span> نقطة
        </span>
      )}
    </div>
    <header className="mt-5 text-center">
      <h1 className="font-display text-3xl sm:text-5xl text-white">{title}</h1>
      <p className="mt-3 mx-auto max-w-2xl text-[15px] sm:text-lg leading-loose text-amber-200">«{quote}»</p>
    </header>
    <div className="mt-6">{children}</div>
  </div>
);

// ---------------- لافتات وأزرار ----------------

export const Banner: React.FC<{ tone: 'ok' | 'no' | 'info'; title?: string; children?: React.ReactNode; className?: string }> = ({ tone, title, children, className = '' }) => {
  const cls = tone === 'ok'
    ? 'border-amber-400/70 bg-amber-400/10'
    : tone === 'no' ? 'border-rose-400/60 bg-rose-500/10' : 'border-sky-300/30 bg-sky-400/10';
  const tcls = tone === 'ok' ? 'text-amber-300' : tone === 'no' ? 'text-rose-300' : 'text-sky-200';
  return (
    <div role={tone === 'no' ? 'alert' : 'status'} className={`rounded-2xl border p-4 animate-in ${cls} ${className}`}>
      {title && <p className={`font-display text-[17px] ${tcls}`}>{tone === 'ok' ? '✦ ' : tone === 'no' ? '✗ ' : ''}{title}</p>}
      {children && <div className="mt-1.5 text-[15px] leading-loose text-slate-100">{children}</div>}
    </div>
  );
};

export const GoldBtn: React.FC<React.ComponentProps<'button'>> = ({ className = '', onClick, children, ...rest }) => (
  <button
    type="button"
    {...rest}
    onClick={e => { sounds.click(); onClick?.(e); }}
    className={`gold-cta inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const QuietBtn: React.FC<React.ComponentProps<'button'>> = ({ className = '', onClick, children, ...rest }) => (
  <button
    type="button"
    {...rest}
    onClick={e => { sounds.click(); onClick?.(e); }}
    className={`gold-pill inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl text-sm text-white hover:text-amber-200 transition-colors disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

/** زر خيار إجابة بأربع حالات؛ الصحيح ذهبي والخاطئ أحمر. */
export const Choice: React.FC<React.ComponentProps<'button'> & { state?: 'idle' | 'right' | 'wrong' | 'dim'; letter?: string }> = ({ state = 'idle', letter, className = '', children, ...rest }) => {
  const cls = {
    idle: 'border-white/15 bg-slate-900/60 hover:border-amber-400/70 hover:bg-amber-400/10',
    right: 'border-amber-400 bg-amber-400/20 text-amber-100 shadow-[0_0_18px_rgba(221,180,85,0.35)]',
    wrong: 'border-rose-400/70 bg-rose-500/15 text-rose-200',
    dim: 'border-white/10 bg-slate-900/40 opacity-60',
  }[state];
  return (
    <button type="button" {...rest} className={`w-full flex items-center gap-3 text-right rounded-2xl border px-4 py-3 text-[15px] sm:text-base leading-relaxed text-white transition-colors disabled:cursor-default ${cls} ${className}`}>
      {letter && <span className="shrink-0 w-8 h-8 rounded-full border border-current/40 grid place-items-center font-display text-sm text-amber-300">{letter}</span>}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
};

/** زر بخطوتين (للإعادة أو الحذف) دون نافذة تأكيد. */
export const ConfirmBtn: React.FC<{ label: string; confirmLabel: string; onConfirm: () => void; className?: string }> = ({ label, confirmLabel, onConfirm, className = '' }) => {
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <QuietBtn className={`${armed ? 'border-rose-400/70 text-rose-200' : ''} ${className}`} onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>
      {armed ? confirmLabel : label}
    </QuietBtn>
  );
};

// ---------------- الميزان ----------------

const PIVOT = { x: 200, y: 70 };
const HALF = 140;

/**
 * ميزان بكفتين. angle>0 يعني أن الكفة اليسرى أثقل فتهبط.
 * الشعاع يدور حول محوره، وتتبع الكفتان طرفيه، فتبقيان أفقيتين.
 */
export const Scale: React.FC<{
  angle: number;
  left?: string;
  right?: string;
  leftTitle?: string;
  rightTitle?: string;
  glow?: boolean;
  className?: string;
}> = ({ angle, left, right, leftTitle, rightTitle, glow, className = '' }) => {
  const a = (Math.max(-16, Math.min(16, angle)) * Math.PI) / 180;
  const lx = PIVOT.x - HALF * Math.cos(a);
  const ly = PIVOT.y + HALF * Math.sin(a);
  const rx = PIVOT.x + HALF * Math.cos(a);
  const ry = PIVOT.y - HALF * Math.sin(a);
  const ease = 'transform 1s cubic-bezier(0.3, 1.3, 0.5, 1)';
  const pan = (x: number, y: number, label: string | undefined, title: string | undefined) => (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: ease }}>
      <path d="M0 0 L-46 78 M0 0 L46 78" stroke={GOLD} strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M-58 78 H58 Q54 100 0 102 Q-54 100 -58 78 Z" fill="#13265a" stroke={GOLD} strokeWidth="2.2" />
      {label && (
        <g>
          <rect x="-36" y="46" width="72" height="30" rx="8" fill={glow ? '#ddb455' : '#2f6fd6'} opacity="0.95" />
          <text y="62" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="800" fill={glow ? '#0b1838' : '#fff'} fontFamily="Cairo, sans-serif">{label}</text>
        </g>
      )}
      {title && <text y="124" textAnchor="middle" fontSize="12" fill="#cbd5ef" fontFamily="Cairo, sans-serif">{title}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 400 250" className={`w-full ${className}`} role="img" aria-label="ميزان بكفتين">
      <path d="M200 70 L200 200" stroke="#6f9bf5" strokeWidth="6" strokeLinecap="round" />
      <path d="M150 214 H250 L238 200 H162 Z" fill="#13265a" stroke={GOLD} strokeWidth="2.2" />
      <g style={{ transform: `rotate(${-angle}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transition: ease }}>
        <rect x={PIVOT.x - HALF} y={PIVOT.y - 5} width={HALF * 2} height="10" rx="5" fill={GOLD} />
      </g>
      {pan(lx, ly, left, leftTitle)}
      {pan(rx, ry, right, rightTitle)}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="9" fill="#0b1838" stroke={GOLD} strokeWidth="3" />
    </svg>
  );
};

// ---------------- أيقونات المحطات ----------------

export const StationIcon: React.FC<{ id: StationId }> = ({ id }) => {
  const stroke = { stroke: GOLD, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" aria-hidden="true">
      {id === 'wheel' && (
        <g>
          <circle cx="40" cy="42" r="28" fill="#1f3f99" {...stroke} />
          <path d="M40 42 V14 M40 42 L66 33 M40 42 L56 64 M40 42 L24 64 M40 42 L14 33" {...stroke} strokeWidth="2" />
          <circle cx="40" cy="42" r="6" fill="#0b1838" {...stroke} />
          <path d="M40 4 L34 14 H46 Z" fill={GOLD} stroke="none" />
        </g>
      )}
      {id === 'falcon' && (
        <g>
          <circle cx="38" cy="32" r="18" fill="#2f6fd6" {...stroke} />
          <path d="M54 30 L70 36 L54 42 Z" fill={GOLD} stroke="none" />
          <circle cx="44" cy="28" r="4" fill="#fff" stroke="none" /><circle cx="45" cy="28" r="1.8" fill="#0b1838" stroke="none" />
          <path d="M22 48 Q38 74 54 48" {...stroke} />
          <path d="M26 16 L20 6 L34 12" {...stroke} strokeWidth="2.4" />
        </g>
      )}
      {id === 'link' && (
        <g>
          <rect x="6" y="14" width="22" height="18" rx="5" fill="#1f3f99" {...stroke} />
          <rect x="6" y="48" width="22" height="18" rx="5" fill="#1f3f99" {...stroke} />
          <rect x="52" y="14" width="22" height="18" rx="5" fill="#13265a" {...stroke} />
          <rect x="52" y="48" width="22" height="18" rx="5" fill="#13265a" {...stroke} />
          <path d="M28 23 L52 57 M28 57 L52 23" {...stroke} strokeDasharray="1 6" />
          <circle cx="40" cy="40" r="5" fill={GOLD} stroke="none" />
        </g>
      )}
      {id === 'academy' && (
        <g>
          <path d="M40 14 L74 30 L40 46 L6 30 Z" fill="#1f3f99" {...stroke} />
          <path d="M20 40 V56 Q40 70 60 56 V40" {...stroke} />
          <path d="M74 30 V52" {...stroke} />
          <circle cx="74" cy="56" r="4" fill={GOLD} stroke="none" />
        </g>
      )}
      {id === 'stadium' && (
        <g>
          <rect x="6" y="18" width="68" height="44" rx="8" fill="#13265a" {...stroke} />
          <path d="M40 18 V62" {...stroke} strokeWidth="2" /><circle cx="40" cy="40" r="9" {...stroke} strokeWidth="2" />
          <circle cx="40" cy="40" r="5" fill="#fff" stroke="none" />
          <path d="M6 30 H16 V50 H6 M74 30 H64 V50 H74" {...stroke} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};
