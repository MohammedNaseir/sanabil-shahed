/**
 * الذرة المتحركة في قلب مختبر الذرة (منقولة من v5) — كانفاس خفيف:
 * 30 إطاراً بالثانية (20 على الأجهزة الضعيفة)، ويتوقف خارج الشاشة أو عند إخفاء الصفحة.
 */
import React, { useEffect, useRef } from 'react';

export const OrbitAtom: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const x = cv?.getContext('2d');
    if (!cv || !x) return;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const low = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
    const frameMs = low ? 50 : 33;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = true;
    const gold = getComputedStyle(document.documentElement).getPropertyValue('--color-amber-400').trim() || '#d4ad5f';

    const draw = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = cv.clientWidth;
      if (!w) return;
      if (cv.width !== Math.round(w * d)) cv.width = cv.height = Math.round(w * d);
      x.setTransform(d, 0, 0, d, 0, 0);
      x.clearRect(0, 0, w, w);
      const c = w / 2;
      const R = w * 0.44;
      t += low ? 0.0105 : 0.007 * (frameMs / 16.7);
      const P = (a: number, k: number) => {
        const tl = (k * Math.PI) / 3;
        const r = t * 0.7 + k * 0.5;
        const X = R * Math.cos(a);
        const Y = R * 0.36 * Math.sin(a);
        let U = X * Math.cos(tl) - Y * Math.sin(tl);
        const V = X * Math.sin(tl) + Y * Math.cos(tl);
        const Z = U * Math.sin(r);
        U *= Math.cos(r);
        const s = 1 + Z / (R * 3);
        return [c + U * s, c + V * s, s] as const;
      };
      for (let k = 0; k < 3; k++) {
        x.beginPath();
        for (let i = 0; i <= 64; i++) {
          const p = P((i / 64) * 6.2832, k);
          if (i) x.lineTo(p[0], p[1]);
          else x.moveTo(p[0], p[1]);
        }
        x.strokeStyle = 'rgba(130,190,255,.45)';
        x.lineWidth = 1.2;
        x.stroke();
        const p = P(t * (2.2 - k * 0.4) + k * 2, k);
        const q = w * 0.022 * p[2];
        const e = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], q * 3);
        e.addColorStop(0, '#fff');
        e.addColorStop(0.3, '#7cc4ff');
        e.addColorStop(1, 'rgba(58,160,255,0)');
        x.fillStyle = e;
        x.beginPath();
        x.arc(p[0], p[1], q * 3, 0, 6.3);
        x.fill();
      }
      const n = x.createRadialGradient(c, c, 0, c, c, w * 0.1);
      n.addColorStop(0, '#fff');
      n.addColorStop(0.3, gold);
      n.addColorStop(1, 'rgba(212,173,95,0)');
      x.fillStyle = n;
      x.beginPath();
      x.arc(c, c, w * 0.1, 0, 6.3);
      x.fill();
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.visibilityState === 'hidden') return;
      if (now - last >= frameMs) {
        last = now;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && !still) raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
    io.observe(cv);
    const onVis = () => document.visibilityState === 'visible' && start();
    document.addEventListener('visibilitychange', onVis);
    draw();
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className={`block aspect-square ${className}`} aria-hidden="true" />;
};
