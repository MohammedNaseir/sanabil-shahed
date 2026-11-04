import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, Sparkles, CheckCircle2, RotateCcw, Zap, Compass, 
  Layers, ShieldAlert, Award, Play, Pause, Flame, Eye
} from 'lucide-react';
import { CathodeRayExperimentState, RutherfordSimulationState } from '../../../data/atomicLabContent';

interface InferConcludeLabProps {
  onBack: () => void;
  onAwardPoints: (points: number, taskId: string) => void;
  onRecordDeduction: (title: string, text: string) => void;
  solvedQuizzes: string[];
}

export function InferConcludeLab({
  onBack,
  onAwardPoints,
  onRecordDeduction,
  solvedQuizzes
}: InferConcludeLabProps) {
  const [activeSimulation, setActiveSimulation] = useState<'cathode' | 'rutherford' | 'scientific_method'>('cathode');

  // --- 1. Cathode Ray Tube Simulation State ---
  const [hasVoltage, setHasVoltage] = useState<boolean>(true);
  const [gasPressure, setGasPressure] = useState<number>(0.01); // atm
  const [barrier, setBarrier] = useState<'none' | 'shadow_cross' | 'wheel'>('none');
  const [magnetPole, setMagnetPole] = useState<'none' | 'north' | 'south'>('none');
  const [cathodeMetal, setCathodeMetal] = useState<'copper' | 'iron' | 'aluminum'>('copper');
  const [wheelPosition, setWheelPosition] = useState<number>(30); // 0% to 100%

  // Wheel animation when voltage on & low pressure
  useEffect(() => {
    let interval: number;
    if (hasVoltage && gasPressure < 0.05 && barrier === 'wheel') {
      interval = window.setInterval(() => {
        setWheelPosition(prev => (prev >= 85 ? 85 : prev + 1.5));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [hasVoltage, gasPressure, barrier]);

  // Handle Cathode Deductions
  const handleCathodeDeduction = (type: 'straight' | 'mass' | 'negative' | 'universal') => {
    if (type === 'straight') {
      onAwardPoints(2, 'deduction_straight');
      onRecordDeduction(
        'استنتاج مسار الأشعة المهبطية',
        'تكون ظل خلف الحاجز يثبت أن الأشعة المهبطية تسير في خطوط مستقيمة من المهبط إلى المصعد.'
      );
    } else if (type === 'mass') {
      onAwardPoints(2, 'deduction_mass');
      onRecordDeduction(
        'طبيعة الأشعة المهبطية',
        'دوران المروحة الدولابية وحركتها يثبت أن للأشعة المهبطية طبيعة مادية وكتلة وكمية حركة.'
      );
    } else if (type === 'negative') {
      onAwardPoints(2, 'deduction_negative');
      onRecordDeduction(
        'شحنة الإلكترونات',
        'انحراف الأشعة المهبطية بالمجال المغناطيسي والكهربائي يثبت أنها مشحونة بشحنة سالبة.'
      );
    } else if (type === 'universal') {
      onAwardPoints(2, 'deduction_universal');
      onRecordDeduction(
        'عالمية الإلكترون في المادة',
        'عدم تغير خواص الأشعة بتغير مادة المهبط يبرهن أن الإلكترون مكون أساسي لكل ذرات المواد.'
      );
    }
  };

  // --- 2. Rutherford Simulation State ---
  const rutherfordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFiringAlpha, setIsFiringAlpha] = useState<boolean>(true);
  const [stats, setStats] = useState({ straight: 0, deflected: 0, bounced: 0, total: 0 });

  useEffect(() => {
    if (activeSimulation !== 'rutherford') return;
    const canvas = rutherfordCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      state: 'straight' | 'deflected' | 'bounced';
      life: number;
    }
    const particles: Particle[] = [];

    const foilX = canvas.width / 2;
    const foilY = canvas.height / 2;

    const render = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Gold Foil & Circular ZnS Fluorescent Screen
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(foilX, foilY, 130, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.stroke();

      // Lead box on the right
      ctx.fillStyle = '#475569';
      ctx.fillRect(canvas.width - 60, foilY - 20, 45, 40);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(canvas.width - 38, foilY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Gold Nucleus at Center (Heavy Dense +)
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.beginPath();
      ctx.arc(foilX, foilY, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(foilX, foilY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px Tajawal, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+79 Au', foilX, foilY);

      // Thin Gold Foil Vertical Line
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(foilX, foilY - 90);
      ctx.lineTo(foilX, foilY + 90);
      ctx.stroke();

      // Emit new alpha particles if firing
      if (isFiringAlpha && Math.random() < 0.6) {
        const startY = foilY + (Math.random() - 0.5) * 80;
        particles.push({
          x: canvas.width - 60,
          y: startY,
          vx: -4.5,
          vy: 0,
          state: 'straight',
          life: 0
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Interaction near gold nucleus
        const dx = p.x - foilX;
        const dy = p.y - foilY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 32 && p.state === 'straight') {
          // Direct hit -> Bounce back (rare 1 : 12000)
          if (dist < 6) {
            p.vx = 4.0;
            p.vy = (Math.random() - 0.5) * 2;
            p.state = 'bounced';
            setStats(s => ({ ...s, bounced: s.bounced + 1, total: s.total + 1 }));
          } else {
            // Near hit -> Repelled / Deflected by positive coulomb force
            const force = 18 / (dist * dist);
            p.vy += (dy / dist) * force * 15;
            p.vx += (dx / dist) * force * 5;
            p.state = 'deflected';
            setStats(s => ({ ...s, deflected: s.deflected + 1, total: s.total + 1 }));
          }
        }

        // Particle reached outer screen
        if (p.x < 30 || p.x > canvas.width || p.y < 20 || p.y > canvas.height - 20) {
          if (p.state === 'straight') {
            setStats(s => ({ ...s, straight: s.straight + 1, total: s.total + 1 }));
          }
          // Flash on ZnS screen
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
          particles.splice(i, 1);
          continue;
        }

        // Draw Alpha particle (Dual + charge glow)
        ctx.fillStyle = p.state === 'bounced' ? '#ef4444' : p.state === 'deflected' ? '#f59e0b' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeSimulation, isFiringAlpha]);

  return (
    <div 
      className="max-w-6xl w-full mx-auto space-y-6 select-none animate-in fade-in duration-200 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: 'var(--veil), url(/assets/aistudio/image_c2f1b931.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition-colors w-fit"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقاعة مختبر الذرة</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg sm:text-2xl font-black text-cyan-300 flex items-center gap-2 justify-end">
            <span>مختبر فكّر واستنتج</span>
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">
            تجارب التفريغ الكهربائي ومحاكاة تجربة رذرفورد للذهب وتطبيق المنهج العلمي
          </p>
        </div>
      </div>

      {/* Simulator Switcher */}
      <div className="flex items-center justify-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 gap-1 text-xs font-bold max-w-lg mx-auto">
        <button
          onClick={() => setActiveSimulation('cathode')}
          className={`flex-1 py-2 px-3 rounded-xl transition-colors ${
            activeSimulation === 'cathode'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          أنبوب التفريغ الكهربائي
        </button>
        <button
          onClick={() => setActiveSimulation('rutherford')}
          className={`flex-1 py-2 px-3 rounded-xl transition-colors ${
            activeSimulation === 'rutherford'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          تجربة رذرفورد لصفيحة الذهب
        </button>
        <button
          onClick={() => setActiveSimulation('scientific_method')}
          className={`flex-1 py-2 px-3 rounded-xl transition-colors ${
            activeSimulation === 'scientific_method'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          خطوات المنهج العلمي
        </button>
      </div>

      {/* 1. CATHODE RAY TUBE SIMULATOR */}
      {activeSimulation === 'cathode' && (
        <div className="space-y-6 text-right">
          
          <div className="rounded-3xl bg-slate-900 border-2 border-cyan-500/30 p-6 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
              <span className="text-xs text-slate-400">الكتاب ص 5 - 6 (نشاط 2: تجارب التفريغ الكهربائي)</span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                محاكي أنبوب التفريغ الكهربائي والأشعة المهبطية
              </h3>
            </div>

            {/* Interactive Tube Chamber Canvas / Graphic */}
            <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
              
              {/* Glass Tube Container */}
              <div className="relative w-full max-w-2xl h-44 rounded-full border-4 border-cyan-500/20 bg-gradient-to-b from-blue-950/20 via-slate-950/60 to-blue-950/20 flex items-center justify-between px-8 shadow-inner overflow-hidden">
                
                {/* Cathode (-) on Left */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="w-5 h-24 rounded-lg bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-300 shadow-md flex items-center justify-center text-xs font-black text-white">
                    -
                  </div>
                  <span className="text-[10px] text-cyan-300 font-bold mt-1">المهبط (كاثود)</span>
                  <span className="text-[9px] text-slate-400 font-mono">{cathodeMetal}</span>
                </div>

                {/* Ray Beam Channel */}
                <div className="relative z-10 flex-1 h-full flex items-center justify-center">
                  {hasVoltage && gasPressure < 0.05 ? (
                    <div className="relative w-full flex items-center">
                      
                      {/* Laser-like ray with magnet deflection */}
                      <div
                        className="h-3 w-full transition-all duration-300 relative"
                        style={{
                          background: 'linear-gradient(90deg, rgba(56,189,248,0.9), rgba(96,165,250,0.8), rgba(56,189,248,0.9))',
                          boxShadow: '0 0 20px #38bdf8, 0 0 35px #60a5fa',
                          transform:
                            magnetPole === 'north'
                              ? 'translateY(-28px)'
                              : magnetPole === 'south'
                              ? 'translateY(28px)'
                              : 'translateY(0)'
                        }}
                      />

                      {/* Barrier Element Inside */}
                      {barrier === 'shadow_cross' && (
                        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <div className="w-8 h-16 bg-slate-800 border-2 border-slate-500 rounded flex items-center justify-center text-[10px] text-white font-bold shadow-lg">
                            صليب
                          </div>
                          {/* Shadow cast on Anode side */}
                          <div className="absolute left-24 w-12 h-20 bg-slate-950/90 rounded-full blur-xs opacity-85 pointer-events-none" />
                        </div>
                      )}

                      {/* Paddle Wheel inside */}
                      {barrier === 'wheel' && (
                        <div
                          className="absolute transition-all duration-75 flex flex-col items-center"
                          style={{ left: `${wheelPosition}%` }}
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-300 font-black animate-spin">
                            ⚙️
                          </div>
                          <span className="text-[9px] text-amber-300 font-mono">مروحة متحركة</span>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-500 font-bold">
                      {hasVoltage ? 'الضغط مرتفع جداً! فرغ الأنبوب لسريان التيار' : 'فرق الجهد مفصول! شغّل مصدر الجهد'}
                    </div>
                  )}
                </div>

                {/* Anode (+) on Right */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="w-5 h-24 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 border border-amber-300 shadow-md flex items-center justify-center text-xs font-black text-slate-950">
                    +
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold mt-1">المصعد (أنود)</span>
                </div>

              </div>

              {/* External Magnet Tool Floating Over Tube */}
              {magnetPole !== 'none' && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl border font-bold text-xs shadow-xl flex items-center gap-2 ${
                  magnetPole === 'north'
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'bg-blue-950/80 border-blue-500 text-blue-200'
                }`}>
                  <Compass className="w-4 h-4" />
                  <span>المجال المغناطيسي: القطب {magnetPole === 'north' ? 'الشمالي (N)' : 'الجنوبي (S)'}</span>
                </div>
              )}

            </div>

            {/* Micro Controls Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Voltage Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">مصدر فرق الجهد العالي:</span>
                <button
                  onClick={() => setHasVoltage(v => !v)}
                  className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                    hasVoltage
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{hasVoltage ? 'جهد عالي متصل (10,000V)' : 'مفصول'}</span>
                </button>
              </div>

              {/* Pressure Slider */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-cyan-400 font-bold">{gasPressure} ض.ج</span>
                  <span className="text-slate-400">ضغط الغاز:</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.2"
                  step="0.005"
                  value={gasPressure}
                  onChange={(e) => setGasPressure(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <span className="text-[10px] text-slate-500 block">
                  {gasPressure < 0.05 ? 'تفريغ كافٍ لسريان الأشعة' : 'ضغط غاز عالٍ يعيق السريان'}
                </span>
              </div>

              {/* Barrier Tool */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">الأجسام المعترضة:</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setBarrier('none')}
                    className={`py-1 rounded-lg text-[11px] font-bold ${barrier === 'none' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    بدون
                  </button>
                  <button
                    onClick={() => {
                      setBarrier('shadow_cross');
                      handleCathodeDeduction('straight');
                    }}
                    className={`py-1 rounded-lg text-[11px] font-bold ${barrier === 'shadow_cross' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    حاجز ظل
                  </button>
                  <button
                    onClick={() => {
                      setBarrier('wheel');
                      setWheelPosition(25);
                      handleCathodeDeduction('mass');
                    }}
                    className={`py-1 rounded-lg text-[11px] font-bold ${barrier === 'wheel' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    مروحة
                  </button>
                </div>
              </div>

              {/* Magnet Field Tool */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">المجال المغناطيسي:</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setMagnetPole('none')}
                    className={`py-1 rounded-lg text-[11px] font-bold ${magnetPole === 'none' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    بدون
                  </button>
                  <button
                    onClick={() => {
                      setMagnetPole('north');
                      handleCathodeDeduction('negative');
                    }}
                    className={`py-1 rounded-lg text-[11px] font-bold ${magnetPole === 'north' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    قطب N
                  </button>
                  <button
                    onClick={() => {
                      setMagnetPole('south');
                      handleCathodeDeduction('negative');
                    }}
                    className={`py-1 rounded-lg text-[11px] font-bold ${magnetPole === 'south' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    قطب S
                  </button>
                </div>
              </div>

            </div>

            {/* 4 Interactive Scientific Conclusions (Question from Textbook ص 6) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-black text-amber-300 block">
                استنتاجاتك المخبرية المعتمدة وفق سؤال الكتاب ص 6:
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <b className="text-cyan-300">1. تكون ظل للأجسام:</b>
                  <p className="text-slate-300">
                    يدل على أن الأشعة المهبطية تسير في خطوط مستقيمة من المهبط إلى المصعد.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <b className="text-cyan-300">2. تحرك دولاب أو مروحة صغيرة:</b>
                  <p className="text-slate-300">
                    يدل على أن للأشعة طبيعة مادية ودقائق ذات كتلة وكمية حركة تكفي لتدوير العجلة.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <b className="text-cyan-300">3. الانحراف بالمغناطيس والألواح:</b>
                  <p className="text-slate-300">
                    يدل على أنها جسيمات مشحونة بشحنة سالبة، سُميت لاحقاً الإلكترونات.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <b className="text-cyan-300">4. ثبات الخصائص بتغير مادة المهبط:</b>
                  <p className="text-slate-300">
                    يدل على أن الإلكترونات مكون أساسي وأصيل يدخل في تركيب جميع المواد.
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. RUTHERFORD GOLD FOIL SIMULATOR */}
      {activeSimulation === 'rutherford' && (
        <div className="space-y-6 text-right">
          
          <div className="rounded-3xl bg-slate-900 border-2 border-amber-500/30 p-6 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
              <span className="text-xs text-slate-400">الكتاب ص 8 (نشاط 4: تجربة رذرفورد)</span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                محاكي تجربة رذرفورد لصفيحة الذهب الحقيقية (1911)
              </h3>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 p-2 overflow-hidden flex flex-col items-center">
              <canvas
                ref={rutherfordCanvasRef}
                width={680}
                height={340}
                className="w-full max-w-full h-auto drop-shadow-xl"
              />

              {/* Legend & Real-time Counter */}
              <div className="w-full p-3 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>نفذت على استقامتها: <b className="text-white font-mono">{stats.straight}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>انحرفت بزاوية: <b className="text-white font-mono">{stats.deflected}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span>ارتدت للخلف: <b className="text-white font-mono">{stats.bounced}</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFiringAlpha(f => !f)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors flex items-center gap-1.5"
                  >
                    {isFiringAlpha ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isFiringAlpha ? 'إيقاف مؤقت للقذف' : 'متابعة إطلاق ألفا'}</span>
                  </button>
                  <button
                    onClick={() => setStats({ straight: 0, deflected: 0, bounced: 0, total: 0 })}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="تصفير العداد"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

            {/* Crucial Rutherford Findings (Book ص 8) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                <span className="font-bold text-cyan-300 block text-sm">1. نفاذ المعظم (99%):</span>
                <p className="text-slate-300 leading-relaxed">
                  الغالبية العظمى من دقائق ألفا نفذت دون أي انحراف، وهذا برهان قاطع على أن <b className="text-white">معظم حجم الذرة فراغ</b>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                <span className="font-bold text-amber-300 block text-sm">2. انحراف القلة:</span>
                <p className="text-slate-300 leading-relaxed">
                  انحرفت نسبة ضئيلة من دقائق ألفا بزوايا متفاوتة، ما دل على اقترابها من <b className="text-white">شحنة موجبة متمركزة</b> سببت التنافر.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-1.5">
                <span className="font-bold text-red-300 block text-sm">3. ارتداد النادر (1 : 12000):</span>
                <p className="text-slate-300 leading-relaxed">
                  ارتداد هذا الجزء الضئيل جداً أثبت وجود <b className="text-white">جسم شديد الكثافة وصغير جداً</b> تتجمع فيه معظم كتلة الذرة هو النواة.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 3. SCIENTIFIC METHOD STEPS */}
      {activeSimulation === 'scientific_method' && (
        <div className="rounded-3xl bg-slate-900 border-2 border-slate-800 p-6 sm:p-8 space-y-6 text-right">
          
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-white">
              مخطط خطوات المنهج العلمي لبناء المعرفة الكيميائية
            </h3>
            <p className="text-xs text-slate-300">
              وفق نص النشاط الأول من كتاب الكيمياء ص 4: كيف نصل إلى المعرفة العلمية؟
            </p>
          </div>

          <div className="relative border-r-2 border-cyan-500/40 pr-6 mr-3 space-y-6 text-xs">
            
            <div className="relative space-y-1">
              <span className="absolute -right-[31px] top-1 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-slate-900" />
              <span className="font-bold text-cyan-300 text-sm block">الخطوة 1: الملاحظة والمشاهدة</span>
              <p className="text-slate-300 leading-relaxed">
                تبدأ بالمشاهدة المباشرة بالعين المجردة، أو الملاحظة غير المباشرة باستخدام الأدوات والأجهزة المناسبة.
              </p>
            </div>

            <div className="relative space-y-1">
              <span className="absolute -right-[31px] top-1 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-slate-900" />
              <span className="font-bold text-cyan-300 text-sm block">الخطوة 2: جمع المعلومات وتسجيلها</span>
              <p className="text-slate-300 leading-relaxed">
                تدوين المشاهدات بدقة والبحث عما بينها من علاقات وروابط منتظمة.
              </p>
            </div>

            <div className="relative space-y-1">
              <span className="absolute -right-[31px] top-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-slate-900" />
              <span className="font-bold text-amber-300 text-sm block">الخطوة 3: صياغة التعميمات والقوانين</span>
              <p className="text-slate-300 leading-relaxed">
                التوصل إلى تعميمات علمية تأخذ شكل قوانين تصف العلاقات الرياضية والتجريبية.
              </p>
            </div>

            <div className="relative space-y-1">
              <span className="absolute -right-[31px] top-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-slate-900" />
              <span className="font-bold text-amber-300 text-sm block">الخطوة 4: الفرضيات واختبارها</span>
              <p className="text-slate-300 leading-relaxed">
                السعي لتفسير المشاهدات بتقديم افتراضات علمية تخضع لمزيد من الاختبارات والتجارب الحاسمة.
              </p>
            </div>

            <div className="relative space-y-1">
              <span className="absolute -right-[31px] top-1 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-slate-900" />
              <span className="font-bold text-cyan-300 text-sm block">الخطوة 5: صمود الفرضيات وتكوين النظريات</span>
              <p className="text-slate-300 leading-relaxed">
                إذا صمدت الفرضيات أمام الاختبارات تصبح نظريات تفتح الباب أمام تجارب واكتشافات جديدة.
              </p>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                onAwardPoints(2, 'scientific_method_mastered');
                onRecordDeduction(
                  'خطوات المنهج العلمي لبناء المعرفة',
                  'استوعب الباحث دور المشاهدة وجمع البيانات ثم القوانين والفرضيات حتى تصبح نظريات علمية.'
                );
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              توثيق المنهج العلمي في دفتر الباحث (+2 نقطة)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
