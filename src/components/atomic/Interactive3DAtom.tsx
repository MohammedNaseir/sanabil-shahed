import React, { useState, useEffect, useRef } from 'react';
import { Eye, RotateCw, ZoomIn, ZoomOut, Layers, Shield, Sparkles, X, Info } from 'lucide-react';

interface Interactive3DAtomProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  interactive?: boolean;
  onCoreClick?: () => void;
  accentColor?: string;
}

export function Interactive3DAtom({
  size = 'md',
  interactive = true,
  onCoreClick,
  accentColor = '#38bdf8'
}: Interactive3DAtomProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Size dimensions
  const dimensions = {
    sm: { width: 220, height: 220, nucleusR: 14, electronR: 4 },
    md: { width: 360, height: 360, nucleusR: 22, electronR: 5 },
    lg: { width: 520, height: 520, nucleusR: 30, electronR: 6 },
    hero: { width: 440, height: 440, nucleusR: 26, electronR: 5.5 }
  }[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let angle = 0;
    let lastFrame = 0;
    let visible = true;
    // الأجهزة الضعيفة: 24 إطاراً بالثانية بدون ظلال متوهجة؛ وإلا 30 إطاراً (الحركة بطيئة أصلاً)
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 768;
    const frameMs = lowPower ? 1000 / 24 : 1000 / 30;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // نوقف الرسم عندما يكون المجسم خارج الشاشة أو الصفحة مخفية
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible && !animationFrameId) animationFrameId = requestAnimationFrame(loop);
        })
      : null;
    io?.observe(canvas);
    if (lowPower) {
      // الظلال (shadowBlur) أغلى عملية في الرسم على الجوال: نعطّلها
      Object.defineProperty(ctx, 'shadowBlur', { configurable: true, set() {}, get() { return 0; } });
    }

    // Fixed 3 distinct orbital planes at different 3D tilt angles
    const orbits = [
      { rx: 110, ry: 45, tilt: -35, speed: 0.025, phase: 0, color: '#38bdf8' },
      { rx: 125, ry: 48, tilt: 40, speed: 0.02, phase: Math.PI / 3, color: '#60a5fa' },
      { rx: 140, ry: 50, tilt: 85, speed: 0.018, phase: (2 * Math.PI) / 3, color: '#818cf8' },
      { rx: 155, ry: 52, tilt: -75, speed: 0.022, phase: Math.PI, color: '#fbbf24' }
    ];

    // Nucleus nucleons (protons & neutrons)
    const nucleons = [
      { x: 0, y: 0, z: 0, type: 'p' },
      { x: -7, y: -6, z: 4, type: 'n' },
      { x: 7, y: 5, z: -3, type: 'p' },
      { x: -5, y: 7, z: -4, type: 'p' },
      { x: 6, y: -7, z: 5, type: 'n' },
      { x: 8, y: -1, z: -5, type: 'p' },
      { x: -8, y: 1, z: 5, type: 'n' },
      { x: 1, y: 8, z: 4, type: 'n' },
      { x: -2, y: -8, z: -4, type: 'p' }
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoomLevel, zoomLevel);

      // 1. Draw Subtle Background Energy Halo
      const haloGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 180);
      haloGradient.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      haloGradient.addColorStop(0.4, 'rgba(251, 191, 36, 0.08)');
      haloGradient.addColorStop(0.8, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw 3D Orbital Rings with Depth
      orbits.forEach((orb) => {
        ctx.save();
        ctx.rotate((orb.tilt * Math.PI) / 180);

        // Ring stroke
        ctx.beginPath();
        ctx.ellipse(0, 0, orb.rx, orb.ry, 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = isHovered ? 'rgba(56, 189, 248, 0.65)' : 'rgba(56, 189, 248, 0.35)';
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.stroke();

        // Secondary inner dash ring for quantum look
        ctx.beginPath();
        ctx.setLineDash([4, 8]);
        ctx.ellipse(0, 0, orb.rx - 4, orb.ry - 2, 0, 0, Math.PI * 2);
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.stroke();

        ctx.restore();
      });

      // 3. Draw Nucleus (Protons + Neutrons Cluster with Glow)
      const nucGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, dimensions.nucleusR * 1.5);
      nucGlow.addColorStop(0, '#fef08a');
      nucGlow.addColorStop(0.3, '#f59e0b');
      nucGlow.addColorStop(0.7, '#b45309');
      nucGlow.addColorStop(1, 'rgba(180, 83, 9, 0)');

      ctx.fillStyle = nucGlow;
      ctx.beginPath();
      ctx.arc(0, 0, dimensions.nucleusR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Individual nucleons arranged in cluster
      nucleons.forEach((nuc) => {
        const nr = dimensions.nucleusR * 0.38;
        const nx = nuc.x;
        const ny = nuc.y;

        const isProton = nuc.type === 'p';
        const grad = ctx.createRadialGradient(nx - 2, ny - 2, 1, nx, ny, nr);
        if (isProton) {
          // Proton: Golden Red (+)
          grad.addColorStop(0, '#fde047');
          grad.addColorStop(0.5, '#ea580c');
          grad.addColorStop(1, '#9a3412');
        } else {
          // Neutron: Deep Cyan (0)
          grad.addColorStop(0, '#bae6fd');
          grad.addColorStop(0.5, '#0284c7');
          grad.addColorStop(1, '#075985');
        }

        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = isProton ? '#f59e0b' : '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();

        // Proton plus symbol if labels on
        if (showLabels && isProton && size !== 'sm') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px Tajawal, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', nx, ny);
        }
      });

      // 4. Draw Orbiting Electrons
      orbits.forEach((orb, idx) => {
        const currentAngle = angle * orb.speed * speedMultiplier + orb.phase;
        // Position on 2D ellipse before tilt
        const rawX = Math.cos(currentAngle) * orb.rx;
        const rawY = Math.sin(currentAngle) * orb.ry;

        // Apply tilt rotation matrix
        const tiltRad = (orb.tilt * Math.PI) / 180;
        const ex = rawX * Math.cos(tiltRad) - rawY * Math.sin(tiltRad);
        const ey = rawX * Math.sin(tiltRad) + rawY * Math.cos(tiltRad);

        // Electron glow and body
        const eleGrad = ctx.createRadialGradient(ex, ey, 1, ex, ey, dimensions.electronR * 2);
        eleGrad.addColorStop(0, '#ffffff');
        eleGrad.addColorStop(0.3, orb.color);
        eleGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.beginPath();
        ctx.arc(ex, ey, dimensions.electronR * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = eleGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ex, ey, dimensions.electronR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 10;
        ctx.fill();

        // Minus sign for electron
        if (showLabels && size !== 'sm') {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px Tajawal, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('-', ex, ey);
        }
      });

      ctx.restore();

      angle += 2; // نصف عدد الإطارات، فنضاعف الخطوة لتبقى السرعة نفسها
    };

    const loop = (t: number) => {
      animationFrameId = 0;
      if (!visible || document.visibilityState === 'hidden') return;
      if (t - lastFrame >= frameMs) {
        lastFrame = t;
        render();
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    render();
    if (!reduceMotion) animationFrameId = requestAnimationFrame(loop);
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && visible && !animationFrameId && !reduceMotion) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(animationFrameId);
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dimensions, zoomLevel, speedMultiplier, showLabels, isHovered, size]);

  const handleCenterCoreClick = () => {
    if (onCoreClick) {
      onCoreClick();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none group">
      
      {/* 3D Canvas Atom */}
      <div 
        className="relative cursor-pointer transition-transform duration-300 active:scale-95"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCenterCoreClick}
        title="انقر لتشريح الذرة وفحص بنيتها النووية والإلكترونية"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="max-w-full h-auto drop-"
        />

        {/* Pulse Ring Indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-amber-400/30 animate-ping opacity-30" />
        </div>

        {/* Interactive Badge Hover */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shadow-lg backdrop-blur-md">
            انقر لاستكشاف تشريح النواة والمدارات
          </span>
        </div>
      </div>

      {/* Floating Micro Controls (if interactive) */}
      {interactive && (
        <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md text-xs">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="تكبير الذرة"
            aria-label="تكبير الذرة"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.7))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="تصغير الذرة"
            aria-label="تصغير الذرة"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => setSpeedMultiplier(prev => (prev === 1 ? 2 : prev === 2 ? 0.5 : 1))}
            className="px-2 py-1 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors font-mono font-bold text-[11px]"
            title="تعديل سرعة دوران الإلكترونات"
          >
            {speedMultiplier}x
          </button>
          <span className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => setShowLabels(prev => !prev)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              showLabels ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
            title="إظهار/إخفاء رموز الشحنات (+ / -)"
          >
            الشحنات
          </button>
          <button
            onClick={handleCenterCoreClick}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 transition-colors flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>التشريح</span>
          </button>
        </div>
      )}

      {/* Atomic Anatomy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-cyan-500/40 p-6 shadow-2xl text-right overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-cyan-400">فحص البنية الذرية</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Atomic Core Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>النواة المركزية (Nucleus)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  تتوسط الذرة، وتتركز فيها معظم كتلة الذرة. مشحونة بشحنة موجبة لاحتوائها على بروتونات موجبة (+)، ونيوترونات متعادلة (0).
                </p>
                <div className="pt-1 text-[11px] font-mono text-amber-400/90 font-bold">
                  نسبة نصف قطر النواة لقطر الذرة: 1 / 100,000
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-300 text-sm">
                  <RotateCw className="w-4 h-4" />
                  <span>سحابة الإلكترونات (Electrons)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  جسيمات سالبة الشحنة (-) متناهية الصغر تدور بسرعة هائلة في الفراغ المحيط بالنواة. تكافئ كتلة الإلكترون 1 / 360,000 من كتلة نواة الذهب.
                </p>
                <div className="pt-1 text-[11px] font-mono text-blue-400/90 font-bold">
                  شحنة الذرة الإجمالية: متعادلة كهربائياً
                </div>
              </div>

            </div>

            {/* Crucial Curriculum Principle */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
              <span className="font-bold text-amber-400">الحقيقة الكبرى التي كشفتها تجربة رذرفورد:</span>
              <p>
                الذرة ليست كرة مصمتة كما اعتقد دالتون وثومسون! بل هي فراغ شاسع بنسبة تتجاوز 99.9%، تسبح فيه الإلكترونات حول نواة مركزية ثقيلة وموجبة.
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                متابعة الاستكشاف في المختبر
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
