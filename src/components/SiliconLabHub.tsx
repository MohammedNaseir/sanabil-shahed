import React from 'react';
import { Award, Trophy, ArrowLeft, Check, UserRound } from 'lucide-react';
import { GAME_STATIONS, GameStationInfo } from '../data/siliconContent';
import { SiliconAtomAnimation } from './SiliconAtomAnimation';
import { Student } from '../types';
import { sounds } from '../utils/audio';

interface SiliconLabHubProps {
  currentStudent: Student | null;
  totalPoints: number;
  completedGames: string[];
  scores: Record<string, number>;
  onSelectStation: (stationId: string) => void;
  onOpenIdCard: () => void;
  onOpenRegister: () => void;
  onOpenCertificate: () => void;
  onOpenLeaderboard: () => void;
  onSwitchToAtomicLab?: () => void;
}

/** رمز «عنصر» لكل محطة، على طريقة الجدول الدوري. */
const STATION_SYMBOL: Record<string, string> = {
  falcon: 'Fa', cipher: 'Ci', flasks: 'Fk', furnace: 'Fu', detective: 'De', rescue: 'Re',
};

const TOTAL_POSSIBLE_POINTS = 52;

function StatusBadge({ student }: { student: Student }) {
  const [label, cls] = student.isLocal
    ? ['تدريب دون اتصال', 'text-sky-400 border-sky-500/30']
    : student.status === 'approved'
      ? ['صقر معتمد', 'text-emerald-400 border-emerald-500/30']
      : student.status === 'rejected'
        ? ['الطلب مرفوض', 'text-rose-400 border-rose-500/30']
        : ['بانتظار الاعتماد', 'text-amber-400 border-amber-500/30'];
  return <span className={`px-2.5 py-0.5 rounded-full border text-[11px] ${cls}`}>{label}</span>;
}

const StationTile: React.FC<{ station: GameStationInfo; done: boolean; score: number; onOpen: () => void }> = ({ station, done, score, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group element-tile rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-right flex flex-col min-h-[168px] sm:min-h-[230px] hover:-translate-y-1 focus-visible:-translate-y-1 transition-transform duration-300"
  >
    <span className="flex items-start justify-between w-full">
      <span className="font-mono text-xs text-slate-500">{String(station.number).padStart(2, '0')}</span>
      {done ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-mono">{score}</span>
          <span className="hidden sm:inline">نقطة</span>
        </span>
      ) : (
        <span className="text-[11px] text-slate-500">جديدة</span>
      )}
    </span>

    <span className="mt-3 sm:mt-4 font-display text-[2.6rem] sm:text-6xl leading-none text-amber-400 group-hover:text-amber-300 transition-colors" aria-hidden="true">
      {STATION_SYMBOL[station.id] ?? station.icon}
    </span>

    <span className="mt-auto pt-4 block">
      <span className="block font-display text-[17px] sm:text-xl text-white">{station.title}</span>
      <span className="block text-[12px] sm:text-[13px] text-slate-400 mt-0.5 line-clamp-1">{station.subtitle}</span>
      <span className="hidden sm:block text-[13px] text-slate-500 mt-3 leading-relaxed line-clamp-2">{station.description}</span>
    </span>

    <span className="mt-4 hidden sm:flex items-center justify-between w-full border-t hairline pt-3 text-[13px]">
      <span className="text-slate-500 truncate">{station.badge}</span>
      <span className="inline-flex items-center gap-1.5 text-amber-300">
        {done ? 'إعادة التحدي' : 'ابدأ'}
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
      </span>
    </span>
  </button>
);

export const SiliconLabHub: React.FC<SiliconLabHubProps> = ({
  currentStudent,
  totalPoints,
  completedGames,
  scores,
  onSelectStation,
  onOpenIdCard,
  onOpenRegister,
  onOpenCertificate,
  onOpenLeaderboard,
  onSwitchToAtomicLab,
}) => {
  const pointsPercent = Math.min(100, Math.round((totalPoints / TOTAL_POSSIBLE_POINTS) * 100));

  return (
    <div className="space-y-10 sm:space-y-14">

      {/* المقدّمة */}
      <section className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center">
        <div className="stagger text-right">
          <p className="flex items-center gap-3 text-[13px] text-amber-400">
            <span className="h-px w-10 bg-amber-400/60" aria-hidden="true" />
            المختبر الأساسي • عنصر السيليكون <span className="font-mono">Si 14</span>
          </p>
          <h1 className="font-display text-4xl sm:text-6xl text-white mt-3 leading-tight">مختبر السيليكون</h1>
          <p className="mt-4 max-w-2xl text-[15px] sm:text-base leading-loose text-slate-400">
            ست محطات لاكتشاف أسرار أشباه الموصلات واستخلاص السيليكون وفك الشيفرات الكيميائية. كل إجابة صحيحة نقطة، ومجموعها يقودك إلى الشهادة الرسمية ولوحة الشرف.
          </p>

          {/* بطاقة الباحث والتقدّم */}
          <div className="mt-7 rounded-2xl border hairline bg-slate-900/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 shrink-0 rounded-full bg-amber-500/15 text-amber-300 font-display text-lg flex items-center justify-center" aria-hidden="true">
                  {currentStudent ? currentStudent.fullName.trim().charAt(0) : <UserRound className="w-5 h-5" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg text-white truncate">{currentStudent ? currentStudent.fullName : 'زائر المختبر'}</span>
                    {currentStudent && <StatusBadge student={currentStudent} />}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{currentStudent?.chemicalId || 'سجّل لتُحتسب نقاطك'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    if (currentStudent) onOpenIdCard();
                    else onOpenRegister();
                  }}
                  className="h-9 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors"
                >
                  {currentStudent ? 'بطاقتي' : 'سجّل هويتك'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    onOpenCertificate();
                  }}
                  aria-label="الشهادة"
                  className="h-9 px-3 rounded-full border hairline text-slate-300 hover:text-amber-300 text-sm inline-flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">الشهادة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    onOpenLeaderboard();
                  }}
                  aria-label="لوحة الشرف"
                  className="h-9 px-3 rounded-full border hairline text-slate-300 hover:text-amber-300 text-sm inline-flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">لوحة الشرف</span>
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-slate-500">النقاط</span>
                <span className="font-display text-3xl text-white">{totalPoints}</span>
                <span className="text-sm text-slate-500"> / {TOTAL_POSSIBLE_POINTS}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">المحطات المنجزة</span>
                <span className="font-display text-3xl text-white">{completedGames.length}</span>
                <span className="text-sm text-slate-500"> / 6</span>
              </div>
            </div>
            <div
              className="mt-4 h-1 rounded-full bg-slate-800 overflow-hidden"
              role="progressbar"
              aria-label="التقدّم نحو الشهادة"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pointsPercent}
            >
              <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${pointsPercent}%` }} />
            </div>
          </div>
        </div>

        <figure className="hidden sm:flex flex-col items-center justify-center">
          <div className="rounded-full border hairline p-4">
            <SiliconAtomAnimation />
          </div>
          <figcaption className="mt-3 text-xs text-slate-500 font-mono">2 · 8 · 4 — أربعة إلكترونات تكافؤ</figcaption>
        </figure>
      </section>

      {/* المحطات */}
      <section aria-labelledby="stations-title">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h2 id="stations-title" className="font-display text-2xl sm:text-3xl text-white">المحطات الست</h2>
            <p className="text-[13px] text-slate-500 mt-1">نقطة لكل إجابة صحيحة • يُحفظ تقدّمك تلقائياً</p>
          </div>
          {onSwitchToAtomicLab && (
            <button
              type="button"
              onClick={() => {
                sounds.click();
                onSwitchToAtomicLab();
              }}
              className="hidden sm:inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              مختبر الذرة
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="stagger grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {GAME_STATIONS.map(station => (
            <StationTile
              key={station.id}
              station={station}
              done={completedGames.includes(station.id)}
              score={scores[station.id] || 0}
              onOpen={() => {
                sounds.click();
                onSelectStation(station.id);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
