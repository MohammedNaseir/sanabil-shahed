import React from 'react';

export const SiliconAtomAnimation: React.FC = () => {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center select-none">
      
      {/* Central Nucleus with 14 Protons & Neutrons */}
      <div className="relative z-20 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 shadow-xl shadow-amber-500/50 flex flex-col items-center justify-center border-2 border-amber-200 animate-pulse">
        <span className="text-xl font-black text-slate-950 font-mono leading-none">Si</span>
        <span className="text-[10px] font-black text-slate-900 font-mono mt-0.5">14</span>
      </div>

      {/* Orbit 1: Level 1 (2 electrons) */}
      <div 
        className="absolute w-24 h-24 rounded-full border border-cyan-400/40 animate-spin"
        style={{ animationDuration: '6s', animationTimingFunction: 'linear' }}
      >
        <span className="absolute -top-1 left-1/2 -ml-1 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400" />
        <span className="absolute -bottom-1 left-1/2 -ml-1 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400" />
      </div>

      {/* Orbit 2: Level 2 (8 electrons) */}
      <div 
        className="absolute w-34 h-34 sm:w-38 sm:h-38 rounded-full border border-blue-400/30 animate-spin"
        style={{ animationDuration: '10s', animationDirection: 'reverse', animationTimingFunction: 'linear' }}
      >
        <span className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-blue-300 shadow-md shadow-blue-400" />
        <span className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-blue-300 shadow-md shadow-blue-400" />
        <span className="absolute left-0 top-1/2 -mt-1 w-2 h-2 rounded-full bg-blue-300 shadow-md shadow-blue-400" />
        <span className="absolute right-0 top-1/2 -mt-1 w-2 h-2 rounded-full bg-blue-300 shadow-md shadow-blue-400" />
      </div>

      {/* Orbit 3: Valence Level 3 (4 valence electrons - key to Silicon semiconductor properties!) */}
      <div 
        className="absolute w-44 h-44 sm:w-50 sm:h-50 rounded-full border border-amber-400/50 animate-spin"
        style={{ animationDuration: '14s', animationTimingFunction: 'linear' }}
      >
        <span className="absolute top-2 left-1/4 w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400 animate-ping" style={{ animationDuration: '3s' }} />
        <span className="absolute top-2 left-1/4 w-3 h-3 rounded-full bg-amber-300 shadow-lg shadow-amber-400" />
        <span className="absolute bottom-2 right-1/4 w-3 h-3 rounded-full bg-amber-300 shadow-lg shadow-amber-400" />
        <span className="absolute top-2 right-1/4 w-3 h-3 rounded-full bg-amber-300 shadow-lg shadow-amber-400" />
        <span className="absolute bottom-2 left-1/4 w-3 h-3 rounded-full bg-amber-300 shadow-lg shadow-amber-400" />
      </div>

      {/* Outer ambient glow */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
