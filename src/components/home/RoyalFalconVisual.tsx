import React from 'react';

interface RoyalFalconVisualProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RoyalFalconVisual: React.FC<RoyalFalconVisualProps> = ({ 
  className = '',
}) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      
      {/* Dynamic Ambient Glow Behind Falcon */}
      <div className="absolute -inset-8 bg-gradient-to-t from-blue-600/30 via-amber-500/20 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Futuristic Energy Rings behind the Falcon */}
      <div className="absolute top-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 rounded-full border border-sky-400/20 animate-spin pointer-events-none" style={{ animationDuration: '35s' }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-60 h-60 md:w-80 md:h-80 rounded-full border border-dashed border-amber-400/25 animate-spin pointer-events-none" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />

      {/* The Official Royal Falcon Image from Teacher Shahd */}
      <div className="relative z-10 w-full flex justify-center">
        <img
          src="/falcon_transparent.webp"
          alt="صقر الكيمياء الملكي - سنابل في الكيمياء"
          className="w-full max-w-[460px] sm:max-w-[540px] md:max-w-[620px] h-auto object-contain drop-shadow-[0_20px_45px_rgba(0,140,255,0.4)] hover:scale-105 transition-transform duration-700 filter brightness-105 contrast-105"
          onError={(e) => {
            // Fallback to original uploaded asset if needed
            (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/image_6559aedd.webp';
          }}
        />
      </div>

      {/* Floating Atomic Rings */}
      <div className="absolute -bottom-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 shadow-xl shadow-amber-500/10 backdrop-blur-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-xs font-black text-amber-300 font-mono tracking-wide">
          صقر الكيمياء الملكي • سنابل في الكيمياء
        </span>
      </div>
    </div>
  );
};
