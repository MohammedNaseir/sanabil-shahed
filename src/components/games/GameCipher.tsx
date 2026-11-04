import React, { useState, useEffect, useRef } from 'react';
import { useGameDraft, useAutoSaveDraft, useSafeTimeouts, isPageHidden } from '../../utils/draft';
import { ResumeBanner } from '../ResumeBanner';
import { KeyRound, Lightbulb, Heart, RotateCcw, Sparkles } from 'lucide-react';
import confetti from '../../utils/confetti';
import { CIPHER_ITEMS, CipherItem, getRandomCorrectPhrase, getRandomWrongPhrase } from '../../data/siliconContent';
import { sounds } from '../../utils/audio';

interface GameCipherProps {
  onFinish: (score: number) => void;
  onExit: () => void;
}

interface CipherDraft {
  currentIndex: number;
  guessed: string[];
  wrongGuesses: number;
  hintsUsed: number;
  score: number;
}

export const GameCipher: React.FC<GameCipherProps> = ({ onFinish, onExit }) => {
  const draft = useGameDraft<CipherDraft>('cipher');
  const d = draft.initial && draft.initial.currentIndex < CIPHER_ITEMS.length ? draft.initial : null;
  const later = useSafeTimeouts();
  const [items] = useState<CipherItem[]>(() => [...CIPHER_ITEMS]);
  const [currentIndex, setCurrentIndex] = useState(d?.currentIndex ?? 0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(() => new Set(d?.guessed ?? []));
  const [wrongGuesses, setWrongGuesses] = useState(d?.wrongGuesses ?? 0);
  const [hintsUsed, setHintsUsed] = useState(d?.hintsUsed ?? 0);
  const [score, setScore] = useState(d?.score ?? 0);
  const [isWordDone, setIsWordDone] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const scoreRef = useRef(score);
  scoreRef.current = score;

  // عند انتهاء الكلمة نحفظ مباشرة بداية الكلمة التالية حتى لا تُحتسب مرتين
  const isLastWord = currentIndex + 1 >= items.length;
  useAutoSaveDraft<CipherDraft>(draft.save, gameOver || (isWordDone && isLastWord) ? null : isWordDone
    ? { currentIndex: currentIndex + 1, guessed: [], wrongGuesses: 0, hintsUsed: 0, score }
    : { currentIndex, guessed: Array.from(guessedLetters), wrongGuesses, hintsUsed, score });

  const ARABIC_ALPHABET = "ابتثجحخدذرزسشصضطظعغفقكلمنهويةى".split("");
  const currentItem = items[currentIndex];

  const wordLetters = currentItem ? currentItem.word.split("") : [];
  const uniqueLettersInWord = new Set(wordLetters.filter(ch => ch !== ' '));

  // Check if current word is solved
  const isWordSolved = wordLetters.every(ch => ch === ' ' || guessedLetters.has(ch));

  useEffect(() => {
    if (!currentItem || isWordDone) return;

    if (isWordSolved) {
      setIsWordDone(true);
      sounds.correct();
      // Teacher rule: +1 point per correct answer!
      setScore(s => s + 1);
      setFeedbackMsg({
        text: getRandomCorrectPhrase(),
        isCorrect: true
      });

      later(() => {
        setFeedbackMsg(null);
        if (currentIndex + 1 < items.length) {
          nextWord();
        } else {
          finishGame();
        }
      }, 2000);
    } else if (wrongGuesses >= 6) {
      setIsWordDone(true);
      sounds.wrong();
      setFeedbackMsg({
        text: getRandomWrongPhrase(),
        isCorrect: false
      });

      later(() => {
        setFeedbackMsg(null);
        if (currentIndex + 1 < items.length) {
          nextWord();
        } else {
          finishGame();
        }
      }, 2200);
    }
  }, [guessedLetters, wrongGuesses, isWordSolved, isWordDone]);

  const nextWord = () => {
    setCurrentIndex(i => i + 1);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setHintsUsed(0);
    setIsWordDone(false);
  };

  const finishGame = () => {
    setGameOver(true);
    draft.finish();
    sounds.victory();
    confetti({ disableForReducedMotion: true, particleCount: 90, spread: 70, origin: { y: 0.6 } });
    onFinish(scoreRef.current);
  };

  const handleLetterClick = (letter: string) => {
    if (isWordDone || guessedLetters.has(letter) || wrongGuesses >= 6) return;
    sounds.click();

    setGuessedLetters(prev => new Set(prev).add(letter));

    if (!currentItem.word.includes(letter)) {
      setWrongGuesses(w => w + 1);
      sounds.wrong();
    }
  };

  const handleHint = () => {
    if (isWordDone || wrongGuesses >= 6) return;
    // Find unrevealed letter
    const unrevealed = wordLetters.find(ch => ch !== ' ' && !guessedLetters.has(ch));
    if (unrevealed) {
      sounds.click();
      setGuessedLetters(prev => new Set(prev).add(unrevealed));
      setHintsUsed(h => h + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <ResumeBanner show={draft.wasRestored} onRestart={draft.restart} />
      
      {/* Header HUD */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 transition-all ${
                i < (6 - wrongGuesses)
                  ? 'text-rose-500 fill-rose-500 scale-100'
                  : 'text-slate-800 scale-90'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
          <span className="text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
            المصطلح: {currentIndex + 1} / {items.length}
          </span>
          <span className="text-amber-300 font-black text-base bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-400/40">
            ⭐ {score}
          </span>
        </div>
      </div>

      {!gameOver ? (
        <div className="p-4 sm:p-8 rounded-3xl bg-slate-900 border-2 border-blue-500/30 shadow-2xl space-y-5 sm:space-y-8">
          
          {/* Scientific Clue */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
            <span className="text-[11px] sm:text-xs font-black text-blue-400 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>الدليل العلمي للمصطلح الكيميائي</span>
            </span>
            <p className="text-base sm:text-xl font-black text-white leading-relaxed">
              «{currentItem?.clue}»
            </p>
          </div>

          {/* Letter Slots */}
          <div className="flex items-center justify-center gap-1 sm:gap-2.5 flex-wrap py-2 sm:py-4 min-h-[70px] sm:min-h-[90px]">
            {wordLetters.map((ch, idx) => {
              if (ch === ' ') {
                return <span key={idx} className="w-4 sm:w-8" />;
              }
              const isRevealed = guessedLetters.has(ch) || (isWordDone && wrongGuesses >= 6);
              const isMissed = isWordDone && wrongGuesses >= 6 && !guessedLetters.has(ch);

              return (
                <div
                  key={idx}
                  className={`w-7 h-10 sm:w-11 sm:h-14 md:w-13 md:h-16 rounded-lg sm:rounded-xl border-2 flex items-center justify-center text-base sm:text-2xl font-black transition-all shadow-inner ${
                    isRevealed
                      ? isMissed
                        ? 'border-rose-500 bg-rose-950/40 text-rose-300 animate-shake'
                        : 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-700 bg-slate-950 text-transparent'
                  }`}
                >
                  {isRevealed ? ch : ''}
                </div>
              );
            })}
          </div>

          {/* Hint Trigger */}
          <div className="flex justify-center">
            <button
              onClick={handleHint}
              disabled={isWordDone || wrongGuesses >= 6}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all disabled:opacity-40"
            >
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>كشف حرف بمساعدة التلميح</span>
            </button>
          </div>

          {/* Motivational Feedback */}
          {feedbackMsg && (
            <div
              className={`p-3 sm:p-3.5 rounded-2xl border-2 text-center text-xs sm:text-sm font-black animate-in fade-in zoom-in-95 ${
                feedbackMsg.isCorrect
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-950/70 border-rose-400 text-rose-300'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* Virtual Arabic Keyboard */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-xl mx-auto pt-1 sm:pt-2">
            {ARABIC_ALPHABET.map(letter => {
              const isUsed = guessedLetters.has(letter);
              const isInWord = currentItem.word.includes(letter);

              let style = 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-100';
              if (isUsed) {
                style = isInWord
                  ? 'bg-emerald-700/60 border-emerald-500 text-emerald-100 opacity-80 cursor-default'
                  : 'bg-slate-900 border-slate-800 text-slate-600 opacity-30 cursor-default';
              }

              return (
                <button
                  key={letter}
                  disabled={isUsed || isWordDone}
                  onClick={() => handleLetterClick(letter)}
                  className={`w-7.5 h-8.5 sm:w-11 sm:h-12 rounded-lg sm:rounded-xl border font-black text-xs sm:text-base transition-all active:scale-95 ${style}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

        </div>
      ) : (
        /* End Screen */
        <div className="p-10 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-4xl">
            🔓
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              فككت جميع الشيفرات الكيميائية بنجاح!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              مجموع النقاط المكتسبة في فك الشيفرة:{' '}
              <b className="text-amber-400 text-xl">⭐ {score}</b>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.click();
                setCurrentIndex(0);
                setGuessedLetters(new Set());
                setWrongGuesses(0);
                setHintsUsed(0);
                setScore(0);
                setIsWordDone(false);
                setGameOver(false);
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
