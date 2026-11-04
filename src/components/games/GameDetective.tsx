import React, { useState } from 'react';
import { useGameDraft, useAutoSaveDraft, useSafeTimeouts, isPageHidden } from '../../utils/draft';
import { ResumeBanner } from '../ResumeBanner';
import { Search, ShieldAlert, Lock, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import confetti from '../../utils/confetti';
import { DETECTIVE_CLUES, DetectiveClue, getRandomCorrectPhrase } from '../../data/siliconContent';
import { sounds } from '../../utils/audio';

interface GameDetectiveProps {
  onFinish: (score: number) => void;
  onExit: () => void;
}

interface DetectiveDraft {
  unlockedCount: number;
  activeClueIndex: number | null;
  score: number;
}

export const GameDetective: React.FC<GameDetectiveProps> = ({ onFinish, onExit }) => {
  const draft = useGameDraft<DetectiveDraft>('detective');
  const d = draft.initial;
  const later = useSafeTimeouts();
  const [unlockedCount, setUnlockedCount] = useState(d?.unlockedCount ?? 0); // 0 to 6
  const [activeClueIndex, setActiveClueIndex] = useState<number | null>(d?.activeClueIndex ?? null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [score, setScore] = useState(d?.score ?? 0);
  const [caseClosed, setCaseClosed] = useState(false);
  useAutoSaveDraft<DetectiveDraft>(draft.save, caseClosed ? null : { unlockedCount, activeClueIndex, score });

  const handleOpenClue = (idx: number) => {
    sounds.click();
    setActiveClueIndex(idx);

    if (idx === unlockedCount) {
      setUnlockedCount(prev => prev + 1);
      sounds.correct();
      // Teacher rule: +1 point per step!
      setScore(s => s + 1);
      setFeedbackMsg(getRandomCorrectPhrase());
      later(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleCloseCase = () => {
    sounds.victory();
    // Teacher rule: +1 point!
    const finalScore = score + 1;
    setScore(finalScore);
    setCaseClosed(true);
    draft.finish();
    confetti({ disableForReducedMotion: true, particleCount: 100, spread: 80, origin: { y: 0.6 } });
    onFinish(finalScore);
  };

  const activeClue: DetectiveClue | null = activeClueIndex !== null ? DETECTIVE_CLUES[activeClueIndex] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* Header HUD */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-400" />
          <span className="text-xs sm:text-sm font-extrabold text-white">
            المحطة 5: المحقق الكيميائي وتتبع العنصر الغامض
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            {unlockedCount} / {DETECTIVE_CLUES.length} أدلة
          </span>
          <span className="text-amber-300 font-black text-base bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-400/40">
            ⭐ {score}
          </span>
        </div>
      </div>

      {!caseClosed ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-purple-500/40 shadow-2xl space-y-6">
          
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
            <span className="text-xs font-black text-purple-400">🕵️ ملف التحقيق الجنائي الكيميائي</span>
            <p className="text-sm font-bold text-slate-200">
              «عنصر غامض مطلوب للعدالة» ترك آثاراً كيميائية في 6 محطات. افتح الأدلة بالترتيب لكشف هويته!
            </p>
          </div>

          {/* Dossier Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-950/90 border-2 border-slate-800">
            
            {/* Avatar / Symbol Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold mb-2">هوية المشتبه به</span>
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-purple-500/40 flex items-center justify-center font-black text-3xl shadow-inner">
                {unlockedCount >= 6 ? (
                  <span className="text-amber-400 animate-in zoom-in font-mono">Si</span>
                ) : (
                  <span className="text-slate-600">❓</span>
                )}
              </div>
              <span className="text-[11px] font-mono text-purple-300 mt-2">
                {unlockedCount >= 6 ? 'السيليكون (Z=14)' : 'عنصر مجهول'}
              </span>
            </div>

            {/* Profile Fields */}
            <div className="md:col-span-2 divide-y divide-slate-800/80 text-xs sm:text-sm font-bold">
              {DETECTIVE_CLUES.map((clue, idx) => {
                const isRevealed = idx < unlockedCount;
                return (
                  <div key={clue.id} className="flex items-center justify-between py-2 px-1">
                    <span className="text-slate-400">{clue.fieldLabel}:</span>
                    <span className={isRevealed ? 'text-amber-300 font-black' : 'text-slate-700 tracking-widest'}>
                      {isRevealed ? clue.fieldValue : '▇▇▇▇▇▇'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Clue Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DETECTIVE_CLUES.map((clue, idx) => {
              const isUnlocked = idx <= unlockedCount;
              const isCurrent = activeClueIndex === idx;

              return (
                <button
                  key={clue.id}
                  disabled={!isUnlocked}
                  onClick={() => handleOpenClue(idx)}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-between text-xs font-black transition-all ${
                    idx < unlockedCount
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                      : idx === unlockedCount
                      ? 'bg-slate-950 border-amber-400 text-amber-300 hover:scale-102 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/40 border-slate-850 text-slate-600 opacity-40 cursor-not-allowed'
                  } ${isCurrent ? 'ring-2 ring-purple-400' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {idx < unlockedCount ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : idx === unlockedCount ? (
                      <FileText className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>دليل {idx + 1}</span>
                  </div>
                  <span className="text-[10px] opacity-75">{clue.fieldLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Active Clue Content Panel */}
          {activeClue && (
            <div className="p-5 rounded-2xl bg-slate-950 border-2 border-purple-500/40 text-slate-100 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-black">
                <Search className="w-4 h-4" />
                <span>الدليل رقم {activeClueIndex! + 1}: {activeClue.title}</span>
              </div>
              <p className="text-sm leading-relaxed font-bold text-slate-200">
                {activeClue.details}
              </p>
            </div>
          )}

          {/* Motivational Feedback */}
          {feedbackMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-400 text-emerald-300 text-center text-xs sm:text-sm font-black animate-in fade-in">
              {feedbackMsg}
            </div>
          )}

          {/* Clue 6 Complete & Stamp */}
          {unlockedCount >= 6 && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border-2 border-amber-500/60 text-center space-y-4 animate-in zoom-in-95">
              <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                🔎 انـكـشـفـت الـهـويـة: الـسـيـلـيـكـون (Si)
              </div>
              <p className="text-xs text-slate-300">
                لقد جمعت الأدلة الستة وأثبتّ أن العنصر هو السيليكون! اضغط على الزر أدناه لإغلاق ملف القضية ونيل مكافأة المحقق.
              </p>
              <button
                onClick={handleCloseCase}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all hover:scale-105"
              >
                📁 إغلاق ملف القضية واعتماد المكافأة (+30 ⭐)
              </button>
            </div>
          )}

        </div>
      ) : (
        /* End Screen */
        <div className="p-10 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-4xl">
            🎖️
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              انكشف العنصر الغامض: السيليكون (Si)!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              مجموع النقاط المكتسبة في المحقق الكيميائي:{' '}
              <b className="text-amber-400 text-xl">⭐ {score}</b>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.click();
                setUnlockedCount(0);
                setActiveClueIndex(null);
                setScore(0);
                setCaseClosed(false);
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
            >
              🔄 العب مرة أخرى
            </button>
            <button
              onClick={() => {
                sounds.click();
                onExit();
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-black transition-colors"
            >
              العودة لقاعة المحطات
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
