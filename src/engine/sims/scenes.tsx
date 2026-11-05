/**
 * مشاهد التجارب (SVG) — منقولة من دوال vessel / stube / semis / furn في v5.
 * المشهد يأخذ حالة s (تتغير مع كل خطوة صحيحة) ويرسم الأدوات والتغيرات.
 */
import React from 'react';

export type SceneState = Record<string, any>;

const Bubbles: React.FC<{ n: number; x0: number; x1: number; y: number }> = ({ n, x0, x1, y }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <circle key={i} className="bubble" cx={x0 + (x1 - x0) * (((i * 37) % n) / n)} cy={y} r={3 + (i % 3)} fill="rgba(255,255,255,.7)" style={{ animationDelay: `${(i * 0.35).toFixed(2)}s` }} />
    ))}
  </>
);

/** كأس زجاجية أو أنبوب: سائل، عكارة، قطعة فلز، فقاعات، ورقتا دوّار الشمس، ميزان حرارة. */
export const Vessel: React.FC<{ s: SceneState }> = ({ s }) => {
  const tube = s.k === 'tube';
  const x1 = tube ? 174 : 104, x2 = tube ? 246 : 316, top = tube ? 130 : 150, bot = tube ? 272 : 282, cx = (x1 + x2) / 2;
  const lvl = 40 + (s.t || 0) * 45;
  return (
    <svg viewBox="0 0 420 330" className="w-full h-full" role="img" aria-label="مشهد التجربة: كأس زجاجية">
      {s.hot && <ellipse cx={cx} cy={bot} rx={(x2 - x1) / 2 + 10} ry="14" fill="rgba(255,150,60,.5)" />}
      {s.liq && <rect x={x1} y={top} width={x2 - x1} height={bot - top} fill={s.col || 'rgba(110,185,255,.5)'} />}
      {s.turb && <rect x={x1} y={top} width={x2 - x1} height={bot - top} fill="#fff" opacity={0.78 * s.turb} style={{ transition: 'opacity 2s' }} />}
      {s.solid && <ellipse cx={cx} cy={bot - (s.liq ? 6 : 8)} rx={(x2 - x1) / 3} ry={s.liq ? 7 : 10} fill={s.liq ? '#eee' : '#f3f3ee'} opacity={s.liq ? 0.8 : 1} />}
      {s.piece && <rect x={cx - 9} y={top + 30} width="18" height="12" rx="5" fill="#dfe6ee" style={{ filter: 'drop-shadow(0 0 6px #fff)' }} />}
      {s.bub && <Bubbles n={10} x0={x1 + 10} x1={x2 - 10} y={bot - 20} />}
      <path d={tube ? 'M170 40V250Q170 278 210 278T250 250V40' : 'M100 60V256Q100 286 130 286H290Q320 286 320 256V60'} fill="rgba(255,255,255,.06)" stroke="#bfe0ff" strokeWidth="3" />
      {s.pap && (
        <>
          <g transform={`rotate(-10 ${cx} 40)`}><rect x={cx - 34} y="30" width="22" height={top - 10} fill={s.rc || '#3d6ee0'} style={{ transition: 'fill 1.2s' }} /></g>
          <g transform={`rotate(10 ${cx} 40)`}><rect x={cx + 12} y="30" width="22" height={top - 10} fill="#3d6ee0" /></g>
        </>
      )}
      {s.papr && (
        <>
          <g transform={`rotate(-8 ${cx} 40)`}><rect x={cx - 34} y="30" width="22" height={top - 10} fill={s.rc2 || '#d6454a'} style={{ transition: 'fill 1.2s' }} /></g>
          <g transform={`rotate(8 ${cx} 40)`}><rect x={cx + 12} y="30" width="22" height={top - 10} fill={s.bc2 || '#3d6ee0'} /></g>
        </>
      )}
      {s.straw && (
        <>
          <line x1={x2 + 30} y1="14" x2={cx + 8} y2={bot - 30} stroke="#ddd" strokeWidth="7" strokeLinecap="round" />
          <Bubbles n={6} x0={cx - 6} x1={cx + 14} y={bot - 30} />
        </>
      )}
      {s.t ? (
        <>
          <rect x="356" y="44" width="16" height="210" rx="8" fill="rgba(255,255,255,.12)" stroke="#9cc" />
          <rect x="360" y={250 - lvl} width="8" height={lvl} rx="4" fill={s.t >= 3 ? '#ff5a3c' : '#ff9a8a'} style={{ transition: '.8s' }} />
          <text x="364" y="276" fontSize="13" fill="#ffd9a0" textAnchor="middle">{s.tl || ''}</text>
        </>
      ) : null}
      {s.sample && (
        <g>
          <rect x="20" y="238" width="44" height="30" rx="8" fill="#d9dee6" />
          <text x="42" y="288" fontSize="12" fill="#cfe2ff" textAnchor="middle">عينة Ca</text>
        </g>
      )}
    </svg>
  );
};

/** أنبوب اختبار فوق لهب، مع مؤشر اللزوجة وورقتي الكاشف. */
export const Stube: React.FC<{ s: SceneState }> = ({ s }) => {
  const c = s.c || '#f3d52b';
  const v = s.v || 0;
  return (
    <svg viewBox="0 0 420 330" className="w-full h-full" role="img" aria-label="مشهد التجربة: أنبوب اختبار">
      {s.flame && (
        <g className="flame">
          <path d="M196 304q-16-30 0-56q8 20 16 0q16 24 0 56z" fill="#ff9a2e" />
          <path d="M200 300q-8-18 0-34q8 14 8 34z" fill={s.blue ? '#6cf' : '#ffe28a'} />
        </g>
      )}
      <path d="M170 30V230Q170 262 204 262T238 230V30" fill="rgba(255,255,255,.06)" stroke="#bfe0ff" strokeWidth="3" />
      {s.l ? <path d="M171 150H237V230Q237 261 204 261T171 230z" fill={c} /> : <path d="M180 214H228V232Q228 255 204 255T180 232z" fill={c} />}
      {s.gas && <Bubbles n={6} x0={185} x1={225} y={140} />}
      <text x="300" y="70" fill="#cfe2ff" fontSize="14">اللزوجة</text>
      <rect x="300" y="80" width="16" height="140" rx="8" fill="rgba(255,255,255,.12)" />
      <rect x="302" y={218 - v * 1.34} width="12" height={v * 1.34} rx="6" fill="#f5c14b" style={{ transition: '.5s' }} />
      {s.pap && (
        <>
          <g transform="rotate(14 214 40)"><rect x="196" y="20" width="18" height="90" fill={s.rc || '#d6454a'} style={{ transition: 'fill 1.2s' }} /></g>
          <g transform="rotate(-6 214 40)"><rect x="224" y="20" width="18" height="90" fill={s.bc || '#3d6ee0'} style={{ transition: 'fill 1.2s' }} /></g>
        </>
      )}
    </svg>
  );
};

/** دارة: بطارية + قطعة + مصباح يزداد سطوعه. */
export const Semis: React.FC<{ s: SceneState }> = ({ s }) => {
  const b = s.b || 0;
  return (
    <svg viewBox="0 0 420 300" className="w-full h-full" role="img" aria-label="مشهد التجربة: دارة كهربائية">
      <rect x="40" y="150" width="50" height="60" fill="#334" stroke="#9cf" />
      <text x="65" y="185" fill="#ffd27a" fontSize="13" textAnchor="middle">بطارية</text>
      <path d="M65 150V70H340V120M340 190V250H65V210" fill="none" stroke="#cfe2ff" strokeWidth="3" />
      {s.si && (
        <>
          <rect x="150" y="50" width="90" height="40" rx="6" fill="#6b7280" stroke="#e5e7eb" />
          <text x="195" y="76" fill="#fff" fontSize="15" textAnchor="middle">{s.mat || 'قطعة'}</text>
        </>
      )}
      <circle cx="340" cy="155" r={28 + b * 18} fill={`rgba(255,220,100,${b})`} style={{ transition: '.6s' }} />
      <circle cx="340" cy="155" r="26" fill="none" stroke="#fff" strokeWidth="3" />
      <text x="340" y="160" fill="#fff" fontSize="12" textAnchor="middle">مصباح</text>
      {s.tl && <text x="195" y="120" fill="#ffb27a" fontSize="14" textAnchor="middle">الحرارة: {s.tl}</text>}
    </svg>
  );
};

/** فرن الاستخلاص. */
export const Furn: React.FC<{ s: SceneState }> = ({ s }) => (
  <svg viewBox="0 0 420 300" className="w-full h-full" role="img" aria-label="مشهد التجربة: فرن">
    <path d="M120 80H300L330 250H90z" fill="#3b4256" stroke="#9aa" strokeWidth="3" />
    {s.rx && <rect x="130" y="170" width="160" height="60" fill={s.hot ? '#ff8a2e' : '#d9c9a0'} style={{ transition: '1s' }} />}
    {s.hot && (
      <>
        <ellipse cx="210" cy="150" rx="70" ry="20" fill="rgba(255,150,60,.5)" />
        <Bubbles n={7} x0={150} x1={270} y={170} />
      </>
    )}
    <text x="210" y="60" fill="#cfe2ff" fontSize="14" textAnchor="middle">{s.fn || 'فرن'}</text>
    <text x="210" y="280" fill="#ffd27a" fontSize="13" textAnchor="middle">{s.rx || ''}</text>
    {s.si && <rect x="150" y="238" width="120" height="10" fill="#c9ced8" />}
  </svg>
);

export const SCENES = { vessel: Vessel, stube: Stube, semis: Semis, furn: Furn } as const;
