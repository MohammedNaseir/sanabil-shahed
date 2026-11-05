/**
 * لوحة المشهد: تكبير/تصغير بالأزرار أو العجلة أو إصبعين، وسحب للتحريك (مثل pz في v5).
 * خلفيتها داكنة دائماً لأن المشهد مرسوم بألوان مختبر مضيئة.
 */
import React, { useRef, useState } from 'react';

export const PanZoom: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => {
  const [v, setV] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const clamp = (k: number) => Math.min(3, Math.max(0.5, k));

  return (
    <div
      className="relative overflow-hidden rounded-2xl border hairline aspect-[42/33] touch-none select-none"
      style={{ background: 'radial-gradient(circle at 50% 40%, #16284a, #0a1326)' }}
      aria-label={label}
      onWheel={e => setV(s => ({ ...s, k: clamp(s.k * (e.deltaY < 0 ? 1.1 : 0.9)) }))}
      onPointerDown={e => {
        if ((e.target as HTMLElement).closest('button')) return;
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, ox: v.x, oy: v.y };
      }}
      onPointerMove={e => {
        if (!pts.current.has(e.pointerId)) return;
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.current.size === 2) {
          const [a, b] = [...pts.current.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinch.current) setV(s => ({ ...s, k: clamp(s.k * (dist / pinch.current!)) }));
          pinch.current = dist;
          return;
        }
        const d = drag.current;
        if (d) setV(s => ({ ...s, x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
      }}
      onPointerUp={e => {
        pts.current.delete(e.pointerId);
        pinch.current = null;
        drag.current = null;
      }}
      onPointerCancel={e => {
        pts.current.delete(e.pointerId);
        pinch.current = null;
        drag.current = null;
      }}
    >
      <div className="w-full h-full transition-transform duration-150" style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.k})` }}>
        {children}
      </div>
      <div className="absolute top-2 left-2 flex gap-1" dir="ltr">
        {[
          ['+', 'تكبير', () => setV(s => ({ ...s, k: clamp(s.k * 1.25) }))],
          ['−', 'تصغير', () => setV(s => ({ ...s, k: clamp(s.k / 1.25) }))],
          ['⟲', 'إعادة الضبط', () => setV({ k: 1, x: 0, y: 0 })],
        ].map(([t, l, fn]) => (
          <button key={l as string} type="button" onClick={fn as () => void} aria-label={l as string} className="w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white text-lg leading-none">
            {t as string}
          </button>
        ))}
      </div>
    </div>
  );
};
