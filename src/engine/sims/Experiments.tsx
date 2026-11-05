/**
 * محرّكات التجارب (منقولة من sim / elec / micro في v5):
 *   توقّع ← جرّب خطوة خطوة ← لاحظ (شاشة الملاحظات) ← استنتج (سؤالان) ← اكتشف (الخلاصة).
 * كل توقّع وملاحظة واستنتاج يُكتب تلقائياً في دفتر الباحث.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { ElecDef, MicroDef, Prediction, SimDef } from '../../content/types';
import { ItemCard, QuizSequence } from '../ItemCard';
import { Feedback, Option, img, useLab, useOrder } from '../shared';
import { noPhrase } from '../texts';
import { PanZoom } from './PanZoom';
import { SCENES, SceneState } from './scenes';
import { sounds } from '../../utils/audio';

const ObservationLog: React.FC<{ lines: string[] }> = ({ lines }) => (
  <div className="mt-4 rounded-2xl border hairline bg-slate-950/40 p-3.5" aria-live="polite">
    <b className="text-amber-300 text-[14px]">شاشة الملاحظات:</b>
    {lines.length === 0 ? <p className="text-[13px] text-slate-500 mt-1">لا توجد ملاحظات بعد.</p> : (
      <ul className="mt-1 space-y-1 text-[14px] text-slate-300">{lines.map((l, i) => <li key={i}>• {l}</li>)}</ul>
    )}
  </div>
);

const Task: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-[14px] leading-relaxed text-slate-200 mb-3">{children}</div>
);

/** «توقّع»: لا توجد إجابة خاطئة، نسجّل التوقع ثم نبدأ التجربة. */
const PredictStep: React.FC<{ lab: string; tag: string; intro: string; pre: Prediction; onDone: () => void }> = ({ lab, tag, intro, pre, onDone }) => {
  const { note } = useLab();
  const order = useOrder(pre.o.length);
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div>
      <Task><b className="text-cyan-300">المهمة:</b> {intro}</Task>
      {chosen == null ? (
        <>
          <h3 className="font-display text-lg text-white mb-3"><b className="text-amber-300">توقّع:</b> {pre.q}</h3>
          <div className="grid gap-2">
            {order.map(i => (
              <Option key={i} onClick={() => { sounds.click(); setChosen(i); note(lab, 'p', `توقّعي (${tag}): ${pre.o[i]}`); }}>{pre.o[i]}</Option>
            ))}
          </div>
        </>
      ) : (
        <>
          <Feedback tone="ok" title="سُجّل توقّعك. الآن جرّب بنفسك!" />
          <button type="button" onClick={onDone} autoFocus className="mt-4 h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">ابدأ التجربة</button>
        </>
      )}
    </div>
  );
};

const Finished: React.FC<{ sum: string; image?: string; onEnd: () => void }> = ({ sum, image, onEnd }) => (
  <div className="animate-in">
    <Feedback tone="ok" title="أحسنت! أنهيت التجربة 🎉"><p>{sum}</p></Feedback>
    {image && <img src={img(image)} alt="" loading="lazy" className="mt-3 w-full rounded-xl bg-white" />}
    <button type="button" onClick={onEnd} autoFocus className="mt-4 h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">إنهاء المحطة</button>
  </div>
);

// ---------------- التجربة العامة ----------------

/** خطوة تجربة: خيارات بترتيب عشوائي ثابت لهذه الخطوة فقط. */
const StepChoices: React.FC<{
  step: SimDef['steps'][number];
  index: number;
  total: number;
  onRight: () => void;
  onWrong: (sceneChange?: Record<string, unknown>) => void;
}> = ({ step, index, total, onRight, onWrong }) => {
  const order = useOrder(step.o.length);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [fb, setFb] = useState<{ title: string; text: string } | null>(null);
  const choose = (i: number) => {
    const o = step.o[i];
    if (!o[1]) {
      sounds.wrong();
      onWrong(o[3]);
      setFb({ title: noPhrase('elements'), text: o[2] || '' });
      setWrong(w => new Set(w).add(i));
      return;
    }
    onRight();
  };
  return (
    <div>
      <Task><b className="text-cyan-300">جرّب ({index + 1}/{total}):</b> {step.say}</Task>
      <div className="grid gap-2">
        {order.map(i => (
          <Option key={i} onClick={() => choose(i)} disabled={wrong.has(i)} state={wrong.has(i) ? 'wrong' : 'idle'}>{step.o[i][0]}</Option>
        ))}
      </div>
      {fb && <Feedback tone="no" title={fb.title}>{fb.text}</Feedback>}
    </div>
  );
};

export const SimExperiment: React.FC<{ def: SimDef; idPrefix: string; onEnd: () => void }> = ({ def, idPrefix, onEnd }) => {
  const { note, conclude } = useLab();
  const [phase, setPhase] = useState<'pre' | 'steps' | 'post' | 'done'>('pre');
  const [k, setK] = useState(0);
  const [s, setS] = useState<SceneState>({ ...def.init });
  const [logs, setLogs] = useState<string[]>([]);
  const Scene = SCENES[def.scene];
  const step = def.steps[k];

  const onWrongOption = (extra?: Record<string, unknown>) => {
    if (extra) setS(prev => ({ ...prev, ...extra }));
  };

  const onRightOption = () => {
    sounds.correct();
    setS(prev => ({ ...prev, ...step.set }));
    setLogs(l => [...l, step.obs]);
    note(def.lab, 'o', `(${def.tag}) ${step.obs}`);
    if (k + 1 < def.steps.length) setK(k + 1);
    else setPhase('post');
  };

  const finish = () => {
    conclude(def.lab, def.tag, def.sum);
    note(def.lab, 'c', `(${def.tag}) ${def.sum}`);
    setPhase('done');
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
      <div className="lg:sticky lg:top-20">
        <PanZoom label={`مشهد تجربة ${def.tag}`}><Scene s={s} /></PanZoom>
      </div>
      <div className="min-w-0">
        <span className="inline-block mb-2 rounded-full bg-amber-500/15 text-amber-300 text-[12px] px-3 py-1">{def.tag}</span>
        {phase === 'pre' && <PredictStep lab={def.lab} tag={def.tag} intro={def.intro} pre={def.pre} onDone={() => setPhase('steps')} />}
        {phase === 'steps' && step && (
          <StepChoices key={k} step={step} index={k} total={def.steps.length} onRight={onRightOption} onWrong={onWrongOption} />
        )}
        {phase === 'post' && (
          <div>
            <Task><b className="text-cyan-300">لاحظ ثم استنتج:</b> راجع شاشة الملاحظات ثم أجب.</Task>
            <QuizSequence items={def.post} idPrefix={idPrefix} variant="elements" onFinish={finish} />
          </div>
        )}
        {phase === 'done' && <Finished sum={def.sum} onEnd={onEnd} />}
        {phase !== 'pre' && <ObservationLog lines={logs} />}
      </div>
    </div>
  );
};

// ---------------- التحليل الكهربائي ----------------

interface Particle { c: boolean; x: number; y: number; hx: number; hy: number; vx: number; vy: number }

const ElecCanvas: React.FC<{ mol: boolean; pwr: boolean; pol: boolean }> = ({ mol, pwr, pol }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ mol, pwr, pol });
  state.current = { mol, pwr, pol };
  useEffect(() => {
    const cv = ref.current;
    const x = cv?.getContext('2d');
    if (!cv || !x) return;
    const W = 420, H = 300;
    const P: Particle[] = Array.from({ length: 18 }, (_, i) => {
      const c = i < 6;
      const px = 150 + (i % 6) * 24 + (c ? 12 : 0), py = 150 + Math.floor(i / 6) * 26;
      return { c, x: px, y: py, hx: px, hy: py, vx: 0, vy: 0 };
    });
    let dep = 0, gas = 0, raf = 0, last = 0, visible = true;
    const draw = () => {
      const { mol, pwr, pol } = state.current;
      x.clearRect(0, 0, W, H);
      x.fillStyle = '#1c2e5c'; x.fillRect(40, 20, 340, 30);
      x.fillStyle = '#f5c14b'; x.font = '15px Tajawal, sans-serif'; x.textAlign = 'center';
      x.fillText(pol ? 'مصدر الطاقة  ( − ) المهبط    المصعد ( + )' : 'مصدر الطاقة', 210, 40);
      x.strokeStyle = '#bfe0ff'; x.lineWidth = 3; x.strokeRect(70, 90, 280, 180);
      x.fillStyle = mol ? 'rgba(255,170,90,.28)' : 'rgba(120,170,255,.18)'; x.fillRect(72, 120, 276, 148);
      x.fillStyle = '#7d8ab0'; x.fillRect(110, 50, 16, 170); x.fillRect(294, 50, 16, 170);
      x.fillStyle = '#cfe2ff'; x.font = '13px Tajawal, sans-serif'; x.fillText('المهبط (−)', 118, 85); x.fillText('المصعد (+)', 302, 85);
      if (dep) { x.fillStyle = '#e8eef8'; x.fillRect(100, 120 + Math.max(0, 60 - dep * 3), 10, Math.min(100, dep * 3 + 8)); }
      const now = Date.now();
      for (const p of P) {
        if (!mol) { p.x = p.hx + Math.sin(now / 200 + p.hy) * 1.5; p.y = p.hy + Math.cos(now / 230 + p.hx) * 1.5; }
        else {
          p.vx += (Math.random() - 0.5) * 0.8; p.vy += (Math.random() - 0.5) * 0.8;
          if (pwr && pol) p.vx += p.c ? -0.18 : 0.18;
          p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx; p.y += p.vy;
          if (p.x < 84) { p.x = 84; p.vx = Math.abs(p.vx); }
          if (p.x > 336) { p.x = 336; p.vx = -Math.abs(p.vx); }
          if (p.y < 130) { p.y = 130; p.vy = 1; }
          if (p.y > 256) { p.y = 256; p.vy = -1; }
          if (pwr && pol && p.c && p.x <= 118) { dep++; p.x = 200 + Math.random() * 60; p.y = 170; }
          if (pwr && pol && !p.c && p.x >= 290) { gas++; p.x = 160 + Math.random() * 60; p.y = 170; }
        }
        x.beginPath(); x.arc(p.x, p.y, p.c ? 9 : 7, 0, 6.3); x.fillStyle = p.c ? '#5aa9ff' : '#ffd25a'; x.fill();
        x.fillStyle = '#04102c'; x.font = '10px sans-serif'; x.fillText(p.c ? '2+' : '−', p.x, p.y + 3);
      }
      if (pwr && pol && mol && gas) {
        for (let i = 0; i < 4; i++) {
          const yy = 250 - ((now / 8 + i * 60) % 150);
          x.beginPath(); x.arc(302 + Math.sin(yy) * 6, yy, 4, 0, 6.3); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill();
        }
      }
    };
    const loop = (t: number) => {
      raf = 0;
      if (!visible || document.visibilityState === 'hidden') return;
      if (t - last >= 33) { last = t; draw(); }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });
    io.observe(cv);
    const onVis = () => document.visibilityState === 'visible' && start();
    document.addEventListener('visibilitychange', onVis);
    draw();
    start();
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  return <canvas ref={ref} width={420} height={300} className="w-full h-full" role="img" aria-label="محاكاة أيونات Ca²⁺ و Cl⁻ في خلية التحليل الكهربائي" />;
};

export const ElecExperiment: React.FC<{ def: ElecDef; idPrefix: string; onEnd: () => void }> = ({ def, idPrefix, onEnd }) => {
  const { note, conclude } = useLab();
  const [phase, setPhase] = useState<'pre' | 'lab' | 'post' | 'done'>('pre');
  const [mol, setMol] = useState(false);
  const [pwr, setPwr] = useState(false);
  const [pol, setPol] = useState(false);
  const [t1, setT1] = useState(false);
  const [t2, setT2] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no' | 'info'; title: string; text?: string } | null>(null);
  const say = (m: string) => { setLogs(l => [...l, m]); note(def.lab, 'o', `(${def.tag}) ${m}`); };

  const togglePower = () => {
    if (!pol) {
      sounds.wrong();
      setMsg({ tone: 'no', title: noPhrase('elements'), text: 'وصّل الأقطاب أولًا: ما القطب الذي يتصل بالطرف الموجب للمصدر؟' });
      return;
    }
    const on = !pwr;
    setPwr(on);
    if (on && !mol) { setT1(true); say('التيار مشغّل والمادة صلبة: لا حركة للأيونات ولا نواتج.'); setMsg({ tone: 'info', title: 'لاحظ: لا يحدث شيء. فكّر لماذا؟' }); }
    else if (on && mol) { setT2(true); say('الأيونات الموجبة Ca²⁺ تتجه إلى المهبط والسالبة Cl⁻ إلى المصعد؛ يتكوّن فلز الكالسيوم عند المهبط ويتصاعد غاز الكلور عند المصعد.'); setMsg(null); }
    else setMsg(null);
  };

  const finish = () => {
    conclude(def.lab, def.tag, def.sum);
    note(def.lab, 'c', `(${def.tag}) ${def.sum}`);
    setPhase('done');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      <div className="lg:sticky lg:top-20">
        <PanZoom label="خلية التحليل الكهربائي"><ElecCanvas mol={mol} pwr={pwr} pol={pol} /></PanZoom>
      </div>
      <div className="min-w-0">
        <span className="inline-block mb-2 rounded-full bg-amber-500/15 text-amber-300 text-[12px] px-3 py-1">{def.tag}</span>
        {phase === 'pre' && <PredictStep lab={def.lab} tag={def.tag} intro={def.intro} pre={def.pre} onDone={() => setPhase('lab')} />}
        {phase === 'lab' && (
          <div>
            <Task><b className="text-cyan-300">جرّب:</b> اربط المصدر، ثم اختبر الحالتين الصلبة والمنصهرة، وشغّل التيار.</Task>
            <div className="grid gap-2">
              <Option state={pol ? 'right' : 'idle'} onClick={() => { if (!pol) { sounds.correct(); setPol(true); setMsg({ tone: 'ok', title: 'تم توصيل الأقطاب كما في المخطط: المصعد (+) والمهبط (−).' }); say('المصعد متصل بالقطب الموجب والمهبط بالسالب.'); } }}>
                {pol ? '✓ ' : ''}وصّل القطب (+) بالمصعد والقطب (−) بالمهبط
              </Option>
              <Option onClick={() => { sounds.click(); const m = !mol; setMol(m); say(m ? 'عند الانصهار تصبح الأيونات حرة الحركة.' : 'في الحالة الصلبة الأيونات مرتبة في شبكة بلورية ولا تتحرك بحرية.'); }}>
                {mol ? 'إيقاف التسخين (العودة إلى الحالة الصلبة)' : 'سخّن CaCl₂ حتى ينصهر'}
              </Option>
              <Option onClick={togglePower}>{pwr ? 'افصل التيار' : 'شغّل التيار الكهربائي'}</Option>
            </div>
            {msg && <Feedback tone={msg.tone} title={msg.title}>{msg.text}</Feedback>}
            {t1 && t2 && (
              <button type="button" onClick={() => setPhase('post')} className="mt-4 h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold animate-in">سجّلت ملاحظاتي… استنتج</button>
            )}
          </div>
        )}
        {phase === 'post' && (
          <div>
            <Task><b className="text-cyan-300">استنتج:</b> اعتمد على ما لاحظته.</Task>
            <QuizSequence items={def.post} idPrefix={idPrefix} variant="elements" onFinish={finish} />
          </div>
        )}
        {phase === 'done' && <Finished sum={def.sum} image="cell" onEnd={onEnd} />}
        {phase !== 'pre' && <ObservationLog lines={logs} />}
      </div>
    </div>
  );
};

// ---------------- المجهر الرقمي ----------------

const Lens: React.FC<{ image: string | null }> = ({ image }) => {
  const [z, setZ] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  return (
    <div
      className="relative h-[min(36vh,280px)] rounded-2xl bg-black bg-contain bg-no-repeat bg-center overflow-hidden border hairline cursor-zoom-in touch-none"
      style={image ? { backgroundImage: `url(${img(image)})` } : undefined}
      onPointerMove={e => {
        if (!image) return;
        const r = e.currentTarget.getBoundingClientRect();
        setZ({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
      }}
      onPointerLeave={() => setZ(null)}
      role="img"
      aria-label={image ? 'العينة تحت العدسة' : 'اختر عينة'}
    >
      {!image && <p className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">اختر عينة لتضعها تحت العدسة</p>}
      {image && z && (
        <i
          className="absolute w-[110px] h-[110px] rounded-full border-[3px] border-amber-400 shadow-lg pointer-events-none bg-no-repeat"
          style={{ left: z.x - 55, top: z.y - 55, backgroundImage: `url(${img(image)})`, backgroundSize: `${z.w * 3}px ${z.h * 3}px`, backgroundPosition: `${-(z.x * 3 - 55)}px ${-(z.y * 3 - 55)}px` }}
        />
      )}
    </div>
  );
};

export const MicroExperiment: React.FC<{ def: MicroDef; lab: string; stationId: string; onEnd: () => void }> = ({ def, lab, stationId, onEnd }) => {
  const { note, conclude } = useLab();
  const [phase, setPhase] = useState<'intro' | 'scope' | 'post' | 'done'>('intro');
  const [sel, setSel] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const inspect = (i: number) => {
    sounds.click();
    setSel(i);
    if (!seen.has(i)) {
      note(lab, 'o', `(المجهر) عينة ${i + 1}: ${def.forms[i].d}`);
      setSeen(s => new Set(s).add(i));
    }
  };

  const finish = () => {
    conclude(lab, 'المجهر الرقمي', def.sum);
    note(lab, 'c', def.sum);
    setPhase('done');
  };

  if (phase === 'intro') {
    return (
      <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-4 items-start">
        <img src={img(def.img)} alt="" className="w-full rounded-2xl border hairline" />
        <div>
          <span className="inline-block mb-2 rounded-full bg-amber-500/15 text-amber-300 text-[12px] px-3 py-1">استكشف</span>
          <ItemCard item={{ ...def.intro, e: def.introFeedback }} taskId={`${lab}.${stationId}.0`} variant="elements" nextLabel="افتح المجهر الرقمي" onNext={() => setPhase('scope')} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      <div>
        <Lens image={sel == null ? null : def.forms[sel].img} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {def.forms.map((f, i) => (
            <button key={i} type="button" onClick={() => inspect(i)} aria-pressed={sel === i}
              className={`h-20 rounded-xl bg-cover bg-center border-2 relative overflow-hidden ${sel === i ? 'border-amber-400' : seen.has(i) ? 'border-emerald-500/60' : 'border-slate-700'}`}
              style={{ backgroundImage: `url(${img(f.img, 'sm')})` }}>
              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[12px] py-0.5">عينة {i + 1}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <span className="inline-block mb-2 rounded-full bg-amber-500/15 text-amber-300 text-[12px] px-3 py-1">المجهر الرقمي</span>
        {phase === 'scope' && (
          <>
            <Task>{sel == null ? <><b className="text-cyan-300">المهمة:</b> {def.task}</> : <><b className="text-amber-300">عينة {sel + 1}</b><br />{def.forms[sel].d}</>}</Task>
            {seen.size === def.forms.length && (
              <button type="button" onClick={() => setPhase('post')} className="h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold animate-in">اكتشف ما يجمعها</button>
            )}
          </>
        )}
        {phase === 'post' && <QuizSequence items={def.post} idPrefix={`${lab}.s1m`} variant="elements" onFinish={finish} />}
        {phase === 'done' && <Finished sum={def.sum} onEnd={onEnd} />}
      </div>
    </div>
  );
};
