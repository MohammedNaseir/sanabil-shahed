/**
 * محطة «عجلة الصقور 🦅»: عجلة SVG بخمسة قطاعات، كل قطاع سؤال اختيار من ثلاثة.
 * - تدور نحو 4 ثوانٍ وتتوقف عشوائياً على قطاع لم يُحلّ بعد.
 * - صحيح من المحاولة الأولى = نقطتان، بعد خطأ = نقطة واحدة؛ والنقاط تُسجَّل مرة واحدة عبر award.
 * - السؤال الحالي وعدد المحاولات الخاطئة وزاوية العجلة تُحفظ في مسودة الطالب للاستئناف.
 * - شرح كل سؤال محلول يُضاف إلى تقرير الإنجاز (conclude) ودفتر الباحث (note).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WheelQuestion } from '../content/types';
import { WHEEL_POINTS } from '../content/wheel';
import { Feedback, Option, shuffle, useLab } from './shared';
import { okPhrase, pick } from './texts';
import { useAutoSaveDraft, useGameDraft, useSafeTimeouts } from '../utils/draft';
import { sounds } from '../utils/audio';
import confetti from '../utils/confetti';

const SPIN_MS = 4000;
const SECTOR = 72;
const COLORS = ['#1f3f99', '#c8962e', '#2f6fd6', '#5b3fa8', '#0f6c8f'];
const TEXT_ON = ['#ffffff', '#0b1838', '#ffffff', '#ffffff', '#ffffff'];
const DONE_FILL = '#6b7280';

const SOFT_NO = [
  'محاولة جيدة! فكّر مرة أخرى، أنت قريب 💪',
  'لا بأس، كل صقر يتعلّم من محاولته… جرّب ثانية!',
  'اقتربت! راجع التلميح وحاول من جديد 🦅',
  'العلماء يعيدون المحاولة دائمًا، فحاول مرة أخرى!',
];

interface Draft {
  cur: number | null;
  wrong: Record<number, number>;
  rot: number;
}

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
};

function sectorPath(k: number, r: number) {
  const [x0, y0] = polar(k * SECTOR, r);
  const [x1, y1] = polar((k + 1) * SECTOR, r);
  return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

const WheelSvg: React.FC<{ questions: WheelQuestion[]; solved: boolean[] }> = ({ questions, solved }) => (
  <svg viewBox="-112 -112 224 224" className="w-full h-full" role="img" aria-label="عجلة الصقور">
    <circle r="110" fill="#0b1838" />
    {questions.map((q, k) => {
      const mid = k * SECTOR + SECTOR / 2;
      const done = solved[k];
      const fill = done ? DONE_FILL : COLORS[k % COLORS.length];
      const ink = done ? '#f3f4f6' : TEXT_ON[k % TEXT_ON.length];
      return (
        <g key={k}>
          <path d={sectorPath(k, 104)} fill={fill} stroke="#0b1838" strokeWidth="1.5" />
          <g transform={`rotate(${mid})`}>
            <text y="-74" textAnchor="middle" fontSize={done ? 22 : 20} fontWeight="900" fill="#ffffff" dominantBaseline="central">{done ? '✓' : q.emoji}</text>
            {/* الموضوع الطويل يُقسم على سطرين ليبقى داخل القطاع */}
            {(q.topic.length > 10 && q.topic.includes(' ') ? [q.topic.slice(0, q.topic.indexOf(' ')), q.topic.slice(q.topic.indexOf(' ') + 1)] : [q.topic]).map((line, i, all) => (
              <text key={i} y={all.length > 1 ? -55 + i * 13 : -50} textAnchor="middle" fontSize={all.length > 1 ? 10.5 : 11} fontWeight="700" fill={ink} fontFamily="Cairo, Tajawal, sans-serif" dominantBaseline="central">{line}</text>
            ))}
          </g>
        </g>
      );
    })}
    <circle r="104" fill="none" stroke="#ddb455" strokeWidth="4" />
    {questions.map((_, k) => {
      const [x, y] = polar(k * SECTOR, 104);
      return <circle key={k} cx={x} cy={y} r="3.2" fill="#f5d98a" />;
    })}
    <circle r="22" fill="#0b1838" stroke="#ddb455" strokeWidth="3" />
    <text textAnchor="middle" dominantBaseline="central" fontSize="20">🦅</text>
  </svg>
);

export const FalconWheel: React.FC<{
  lab: string;
  idPrefix: string;
  questions: WheelQuestion[];
  onEnd: () => void;
}> = ({ lab, idPrefix, questions, onEnd }) => {
  const { tasks, award, note, conclude } = useLab();
  const draft = useGameDraft<Draft>(idPrefix, 1);
  const later = useSafeTimeouts();
  const idOf = (k: number) => `${idPrefix}.${k}`;
  const solved = questions.map((_, k) => tasks[idOf(k)] !== undefined);
  const solvedN = solved.filter(Boolean).length;
  const allDone = solvedN === questions.length;

  const init = draft.initial;
  const [rot, setRot] = useState(init?.rot ?? 0);
  const [cur, setCur] = useState<number | null>(init && init.cur != null && !solved[init.cur] ? init.cur : null);
  const [wrong, setWrong] = useState<Record<number, number>>(init?.wrong ?? {});
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState<{ granted: number; title: string } | null>(null);

  // ترتيب عشوائي جديد لخيارات كل سؤال عند عرضه
  const order = useMemo(() => (cur == null ? [] : shuffle([0, 1, 2])), [cur]);

  useAutoSaveDraft(draft.save, allDone ? null : { cur: won ? null : cur, wrong, rot });

  const spin = () => {
    if (spinning || allDone) return;
    const open = questions.map((_, k) => k).filter(k => !solved[k]);
    if (!open.length) return;
    const k = open[Math.floor(Math.random() * open.length)];
    const jitter = (Math.random() - 0.5) * (SECTOR - 18);
    const target = (((-(k * SECTOR + SECTOR / 2) + jitter) % 360) + 360) % 360;
    const delta = ((target - (rot % 360)) + 360) % 360;
    sounds.click();
    setCur(null);
    setWon(null);
    setMsg(null);
    setPicked([]);
    setSpinning(true);
    setRot(rot + 360 * 5 + delta);
    spun.current = true;
    later(() => {
      setSpinning(false);
      setCur(k);
    }, SPIN_MS);
  };

  const answer = (k: number, opt: number) => {
    if (won || picked.includes(opt)) return;
    if (opt !== 0) {
      sounds.wrong();
      setPicked(p => [...p, opt]);
      setWrong(w => ({ ...w, [k]: (w[k] ?? 0) + 1 }));
      setMsg(pick(SOFT_NO));
      return;
    }
    sounds.correct();
    const q = questions[k];
    const pts = (wrong[k] ?? 0) > 0 ? WHEEL_POINTS - 1 : WHEEL_POINTS;
    const granted = award(idOf(k), pts);
    conclude(lab, `عجلة الصقور: ${q.topic}`, q.e);
    note(lab, 'c', `(عجلة الصقور — ${q.topic}) ${q.e}`);
    setPicked(p => [...p, opt]);
    setMsg(null);
    setWon({ granted, title: okPhrase('elements') });
    if (solvedN + 1 === questions.length) {
      draft.finish();
      confetti({ particleCount: 60, spread: 70 });
    }
  };

  const q = cur != null ? questions[cur] : null;

  // على الجوال يظهر السؤال تحت العجلة: نمرّر إليه بعد توقفها
  const cardRef = useRef<HTMLDivElement>(null);
  const spun = useRef(false);
  useEffect(() => {
    if (cur == null || !spun.current) return;
    const el = cardRef.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [cur]);

  return (
    <div className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6 items-start">
      <div className="flex flex-col items-center md:sticky md:top-20">
        <div className="relative w-full max-w-[340px] aspect-square">
          {/* المؤشر الثابت */}
          <svg viewBox="0 0 40 44" className="absolute left-1/2 -translate-x-1/2 -top-2 w-9 h-10 z-10 drop-shadow" aria-hidden="true">
            <path d="M20 42 L4 6 Q20 -2 36 6 Z" fill="#ddb455" stroke="#0b1838" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
          <div
            className="w-full h-full rounded-full shadow-2xl"
            style={{ transform: `rotate(${rot}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.12, 1)` : 'none' }}
          >
            <WheelSvg questions={questions} solved={solved} />
          </div>
        </div>
        <p className="mt-4 font-display text-lg text-slate-200" aria-live="polite">
          أجبتَ عن <span className="text-amber-300">{solvedN}</span> من {questions.length}
        </p>
        {!allDone && (
          <button
            type="button"
            onClick={spin}
            disabled={spinning || (q != null && !won)}
            className="mt-3 h-12 px-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spinning ? 'العجلة تدور…' : '🦅 أدِر العجلة'}
          </button>
        )}
      </div>

      <div className="min-w-0">
        {q && cur != null && (
          <div ref={cardRef} className="scroll-mt-20 rounded-2xl border hairline bg-slate-900/50 p-4 sm:p-5 animate-in">
            <p className="text-[13px] text-amber-300">{q.emoji} {q.topic}</p>
            <h3 className="mt-2 text-lg leading-relaxed text-white">{q.q}</h3>
            <div className="mt-4 space-y-2.5">
              {order.map(i => (
                <Option
                  key={i}
                  onClick={() => answer(cur, i)}
                  disabled={won != null || picked.includes(i)}
                  state={won && i === 0 ? 'right' : picked.includes(i) ? 'wrong' : 'idle'}
                >
                  {q.o[i]}
                </Option>
              ))}
            </div>
            {msg && !won && (
              <Feedback tone="no" title={msg}>
                <b className="text-amber-300">💡 تلميح:</b> {q.h}
              </Feedback>
            )}
            {won && (
              <Feedback tone="ok" title={`${won.title} ${won.granted ? `+${won.granted} نقطة` : '(دون نقاط جديدة)'}`}>
                {q.e}
              </Feedback>
            )}
          </div>
        )}

        {!q && !allDone && !spinning && (
          <div className="rounded-2xl border hairline bg-slate-900/40 p-5 text-[15px] leading-relaxed text-slate-300">
            اضغط «🦅 أدِر العجلة» لتتوقف العجلة عند موضوع، ثم أجب عن سؤاله.
          </div>
        )}
        {spinning && (
          <div className="rounded-2xl border hairline bg-slate-900/40 p-5 text-[15px] text-slate-300" aria-live="polite">العجلة تدور… أين ستتوقف؟</div>
        )}

        {allDone && (
          <div className="mt-4 rounded-2xl border border-amber-400/50 bg-amber-500/10 p-5 animate-in" role="status">
            <p className="font-display text-xl text-amber-300">🎉 أحسنت يا صقر الكيمياء! أنهيتَ عجلة الصقور.</p>
            <p className="mt-2 text-[15px] text-slate-300">أجبتَ عن الأسئلة الخمسة، والآن إلى تجارب المختبر.</p>
            <button type="button" onClick={onEnd} className="mt-4 h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
              إنهاء المحطة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
