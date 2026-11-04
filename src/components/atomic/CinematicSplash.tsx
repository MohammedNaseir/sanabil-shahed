import React from 'react';
import { ArrowLeft, Sparkles, Atom, ShieldCheck } from 'lucide-react';
import { Interactive3DAtom } from './Interactive3DAtom';

interface CinematicSplashProps {
  onStart: () => void;
  studentName?: string;
}

export function CinematicSplash({ onStart, studentName }: CinematicSplashProps) {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden select-none">
      
      {/* Dynamic Background Energy Fields */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep radial lab glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-cyan-600/15 via-blue-900/10 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />

        {/* Floating quantum light particles */}
        <div className="absolute top-1/3 left-1/5 w-1 h-1 rounded-full bg-cyan-400 animate-ping opacity-60" />
        <div className="absolute top-2/3 right-1/5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse opacity-70" />
        <div className="absolute bottom-1/5 left-1/3 w-1 h-1 rounded-full bg-blue-300 animate-ping opacity-50" />
      </div>

      {/* Top Quiet Platform Brand */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <img
            src="/sanabil-logo.png"
            alt="منصة سنابل التعليمية"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg p-0.5 bg-slate-900 border border-slate-700 shadow-md"
          />
          <div className="text-right">
            <h1 className="text-xs sm:text-sm font-bold text-slate-200">منصة سنابل التعليمية</h1>
            <p className="text-[10px] text-slate-400">فلسطين • منهاج الكيمياء للصف العاشر</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
          <Atom className="w-4 h-4 animate-spin-slow text-cyan-400" />
          <span>مختبر الأبحاث الذرية</span>
        </div>
      </header>

      {/* Center Cinematic Stage */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center text-center max-w-4xl px-4 py-8 space-y-6 sm:space-y-8">
        
        {/* 3D Glowing Central Atom */}
        <div className="relative scale-90 sm:scale-100 transition-transform">
          <Interactive3DAtom size="hero" interactive={false} />
        </div>

        {/* Titles & Typography */}
        <div className="space-y-3 sm:space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-cyan-300 text-xs sm:text-sm font-bold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>بيئة محاكاة تفاعلية متطورة</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            مختبر أ. شهد
          </h2>

          <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-300 bg-clip-text text-transparent">
            صقور الكيمياء | منصة سنابل التعليمية
          </h3>

          <p className="text-sm sm:text-lg text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed pt-2">
            «كل اكتشاف يبدأ بسؤال... استعدوا لرحلة جديدة في عالم الذرة.»
          </p>

          {studentName && (
            <p className="text-xs sm:text-sm font-bold text-amber-300 pt-1">
              مرحباً بك مجدداً أيها الباحث: <span className="underline">{studentName}</span>
            </p>
          )}

        </div>

        {/* Primary Entrance Action */}
        <div className="pt-4">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-amber-500 hover:from-cyan-400 hover:via-blue-500 hover:to-amber-400 text-slate-950 font-black text-base sm:text-lg shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all duration-300 active:scale-95"
          >
            <span>ابدأ الرحلة</span>
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </button>
        </div>

      </main>

      {/* Footer Credentials */}
      <footer className="relative z-10 w-full max-w-6xl py-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <p>إشراف المعلمة المتميزة: <b className="text-amber-400 font-bold">أ. شهد</b> • صقور الكيمياء</p>
        <p className="text-[11px] text-slate-400 font-mono">المرجع العلمي: كتاب الكيمياء للصف العاشر - دولة فلسطين (2020)</p>
      </footer>

    </div>
  );
}
