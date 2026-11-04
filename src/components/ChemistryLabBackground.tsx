import React from 'react';

export const ChemistryLabBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep laboratory gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#081226] to-[#040816] opacity-95" />

      {/* Laboratory grid blueprint pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Glowing ambient laboratory light spots */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: '7s' }} />

      {/* Floating chemical molecules and formulas in the background */}
      <div className="absolute top-20 left-12 opacity-15 font-mono text-cyan-400 text-sm animate-bounce" style={{ animationDuration: '7s' }}>
        SiO₂ + 2C → Si + 2CO
      </div>

      <div className="absolute top-1/2 right-16 opacity-15 font-mono text-amber-400 text-base animate-pulse" style={{ animationDuration: '5s' }}>
        [Ne] 3s² 3p²
      </div>

      <div className="absolute bottom-28 left-20 opacity-15 font-mono text-blue-300 text-sm animate-bounce" style={{ animationDuration: '9s' }}>
        Z = 14 (Silicon)
      </div>

      <div className="absolute bottom-16 right-24 opacity-15 font-mono text-cyan-300 text-sm animate-pulse" style={{ animationDuration: '6s' }}>
        SiO₂ + 2CO → Si + 2CO₂
      </div>

      {/* Rising lab bubbles */}
      <div className="bubble absolute bottom-0 left-[15%] w-3 h-3 rounded-full bg-cyan-400/20 blur-[0.5px] animate-ping" style={{ animationDuration: '4s' }} />
      <div className="bubble absolute bottom-0 left-[35%] w-2 h-2 rounded-full bg-amber-400/25 blur-[0.5px] animate-ping" style={{ animationDuration: '6s' }} />
      <div className="bubble absolute bottom-0 right-[25%] w-4 h-4 rounded-full bg-blue-400/20 blur-[0.5px] animate-ping" style={{ animationDuration: '5s' }} />
      <div className="bubble absolute bottom-0 right-[10%] w-2.5 h-2.5 rounded-full bg-sky-400/20 blur-[0.5px] animate-ping" style={{ animationDuration: '7s' }} />
    </div>
  );
};
