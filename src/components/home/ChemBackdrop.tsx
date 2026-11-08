import React from 'react';

/**
 * خلفية المختبر الحيّة للواجهات الخارجية: ذرات ومدارات، روابط جزيئية، رموز وجسيمات،
 * وشبكة علمية رفيعة. الحركة بطيئة وبالتحويلات فقط، والعناصر خافتة حتى لا تنافس النص.
 */
const GOLD = '#ddb455';
const BLUE = '#6f9bf5';

const Atom: React.FC<{ x: number; y: number; r: number; spin?: string; color?: string; opacity?: number }> = ({ x, y, r, spin = 'chem-spin', color = GOLD, opacity = 0.32 }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <g className={spin}>
      <g fill="none" stroke={color} strokeWidth="1.1">
        <ellipse rx={r} ry={r * 0.36} />
        <ellipse rx={r} ry={r * 0.36} transform="rotate(60)" />
        <ellipse rx={r} ry={r * 0.36} transform="rotate(120)" />
      </g>
      <circle cx={r} cy="0" r="4" fill={BLUE} />
      <circle cx={-r * 0.5} cy={r * 0.31} r="3.5" fill={color} />
      <circle cx={-r * 0.5} cy={-r * 0.31} r="3" fill={BLUE} />
    </g>
    <circle r={r * 0.09} fill={color} opacity="0.9" />
    <circle r={r * 0.16} fill="none" stroke={color} strokeOpacity="0.5" />
  </g>
);

const SYMBOLS: [string, number, number, number][] = [
  ['H', 210, 690, 0], ['O', 1270, 210, 1.5], ['Ca', 1180, 760, 3], ['S', 520, 120, 2],
  ['Si', 90, 380, 4], ['C', 860, 820, 1], ['Na', 1370, 520, 2.5], ['e⁻', 690, 300, 3.5],
];

const PARTICLES: [number, number, number][] = [
  [120, 160, 2], [330, 260, 1.5], [460, 760, 2], [640, 640, 1.5], [780, 140, 2], [960, 420, 1.5],
  [1080, 120, 2], [1220, 380, 1.5], [1320, 660, 2], [300, 520, 1.5], [1000, 700, 2], [580, 460, 1.2],
];

export const ChemBackdrop: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden navy-stage" aria-hidden="true">
    {/* شبكة علمية رفيعة تتلاشى عند الأطراف */}
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage: `linear-gradient(to right, ${GOLD} 1px, transparent 1px), linear-gradient(to bottom, ${GOLD} 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
        maskImage: 'radial-gradient(ellipse at 50% 40%, black 10%, transparent 72%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 10%, transparent 72%)',
      }}
    />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      {/* مدار كبير خلف المحتوى */}
      <g opacity="0.12" fill="none" stroke={GOLD} strokeWidth="1">
        <circle cx="720" cy="430" r="380" strokeDasharray="2 12" />
        <circle cx="720" cy="430" r="470" />
      </g>

      <Atom x={1240} y={170} r={110} />
      <Atom x={170} y={760} r={90} spin="chem-spin-rev" color={BLUE} opacity={0.3} />
      <Atom x={110} y={150} r={46} opacity={0.22} />

      {/* حلقة جزيئية (بنزين) وروابط */}
      <g className="chem-float" opacity="0.26" fill="none" stroke={BLUE} strokeWidth="1.3">
        <polygon points="1290,560 1330,583 1330,629 1290,652 1250,629 1250,583" />
        <polygon points="1290,572 1320,589 1320,623 1290,640 1260,623 1260,589" strokeOpacity="0.5" />
        <line x1="1330" y1="583" x2="1375" y2="560" />
        <line x1="1250" y1="629" x2="1205" y2="652" />
        <circle cx="1375" cy="560" r="6" fill={GOLD} stroke="none" />
        <circle cx="1205" cy="652" r="6" fill={GOLD} stroke="none" />
      </g>

      {/* جزيء ماء H₂O */}
      <g className="chem-float-slow" opacity="0.28">
        <line x1="420" y1="360" x2="380" y2="400" stroke={GOLD} strokeWidth="1.4" />
        <line x1="420" y1="360" x2="465" y2="395" stroke={GOLD} strokeWidth="1.4" />
        <circle cx="420" cy="360" r="11" fill="none" stroke={GOLD} strokeWidth="1.4" />
        <circle cx="380" cy="400" r="6" fill={BLUE} />
        <circle cx="465" cy="395" r="6" fill={BLUE} />
      </g>

      {/* سلسلة روابط */}
      <g className="chem-float" opacity="0.2" stroke={GOLD} strokeWidth="1.2" fill="none">
        <polyline points="900,780 940,750 980,780 1020,750 1060,780" />
        {[900, 940, 980, 1020, 1060].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 750 : 780} r="4.5" fill={i % 2 ? BLUE : GOLD} stroke="none" />
        ))}
      </g>

      {/* رموز كيميائية */}
      <g fontFamily="Cairo, sans-serif" fontWeight="700" fill={GOLD}>
        {SYMBOLS.map(([s, x, y, d]) => (
          <text key={s} x={x} y={y} fontSize="26" opacity="0.18" className="chem-twinkle" style={{ animationDelay: `-${d}s` }}>{s}</text>
        ))}
      </g>

      {/* جسيمات */}
      <g fill={BLUE}>
        {PARTICLES.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity="0.5" className="chem-twinkle" style={{ animationDelay: `-${i * 0.7}s` }} />
        ))}
      </g>
    </svg>
  </div>
);
