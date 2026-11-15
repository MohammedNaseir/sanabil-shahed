/**
 * المحطة 3 — مختبر التحدي: توصيل كل موقف بتفسيره. بطاقات التفسير قابلة للسحب والإفلات على الموقف،
 * أو باختيار البطاقة ثم الموقف (للأجهزة الصغيرة). التوصيل الصحيح يرسم خطًا ذهبيًا، والخاطئ يعود مكانه.
 */
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NO_PHRASES, OK_PHRASES, SITUATIONS, type Situation } from './data';
import { STATION_TASKS, type MassApi } from './state';
import { Banner, GOLD, QuietBtn, StationFrame, Txt, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { shuffle } from '../../engine/shared';
import { sounds } from '../../utils/audio';
import { useSafeTimeouts } from '../../utils/draft';

const SitIcon: React.FC<{ kind: Situation['icon'] }> = ({ kind }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
    {kind === 'flask' && (
      <g fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M26 8h12M28 8v16L14 50a5 5 0 0 0 4 8h28a5 5 0 0 0 4-8L36 24V8" fill="#2f6fd6" fillOpacity="0.25" />
        <path d="M20 44h24" /><circle cx="30" cy="50" r="2" fill={GOLD} stroke="none" /><circle cx="37" cy="48" r="1.6" fill={GOLD} stroke="none" />
        <path d="M24 4h16" />
      </g>
    )}
    {kind === 'wood' && (
      <g strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="42" width="48" height="12" rx="6" fill="#c8962e" stroke="#a87d2c" strokeWidth="2.5" />
        <circle cx="12" cy="48" r="3" fill="none" stroke="#a87d2c" strokeWidth="2" />
        <path d="M32 40 C22 32 30 24 28 12 C38 18 44 30 38 40 Z" fill="#a82a3d" stroke="#f6e2a8" strokeWidth="2.5" />
        <path d="M32 40 C28 34 34 30 33 24 C38 28 38 34 35 40 Z" fill="#ddb455" />
      </g>
    )}
    {kind === 'candle' && (
      <g strokeLinecap="round" strokeLinejoin="round">
        <rect x="24" y="26" width="16" height="30" rx="3" fill="#f3e6c4" stroke={GOLD} strokeWidth="2.5" />
        <path d="M32 26 V20" stroke={GOLD} strokeWidth="2.5" />
        <path d="M32 18 C26 14 31 8 32 4 C37 8 40 14 32 18 Z" fill="#a82a3d" stroke="#f6e2a8" strokeWidth="2" />
        <path d="M18 58 H46" stroke="#6f9bf5" strokeWidth="3" />
      </g>
    )}
  </svg>
);

interface Seg { x1: number; y1: number; x2: number; y2: number }

export const Link: React.FC<{ api: MassApi; onBack: () => void }> = ({ api, onBack }) => {
  const later = useSafeTimeouts();
  const N = SITUATIONS.length;
  const order = useMemo(() => shuffle(SITUATIONS.map((_, i) => i)), []);
  const matched = (i: number) => Boolean(api.state.awards[`link.${i}`]);
  const doneN = SITUATIONS.filter((_, i) => matched(i)).length;
  const allDone = doneN === N;

  const [selExp, setSelExp] = useState<number | null>(null);
  const [selSit, setSelSit] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ sit: number; exp: number } | null>(null);
  const tries = useRef<Record<number, number>>({});

  const wrap = useRef<HTMLDivElement>(null);
  const sitEls = useRef<(HTMLElement | null)[]>([]);
  const expEls = useRef<(HTMLElement | null)[]>([]);
  const [segs, setSegs] = useState<Record<string, Seg>>({});

  const measure = useCallback(() => {
    const box = wrap.current;
    if (!box) return;
    const c = box.getBoundingClientRect();
    const out: Record<string, Seg> = {};
    const want: [string, number, number][] = SITUATIONS.map((_, i) => [`ok${i}`, i, i] as [string, number, number]).filter(([, i]) => matched(i));
    if (flash) want.push(['no', flash.sit, flash.exp]);
    for (const [key, s, e] of want) {
      const a = sitEls.current[s]?.getBoundingClientRect();
      const b = expEls.current[e]?.getBoundingClientRect();
      if (!a || !b) continue;
      // العمودان جنبًا إلى جنب فقط (الشاشات العريضة)
      if (a.left < b.right - 1) continue;
      out[key] = { x1: a.left - c.left, y1: a.top + a.height / 2 - c.top, x2: b.right - c.left, y2: b.top + b.height / 2 - c.top };
    }
    setSegs(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.state.awards, flash]);

  useLayoutEffect(() => {
    measure();
    const box = wrap.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure]);

  const attempt = (sit: number, exp: number) => {
    if (matched(sit) || matched(exp)) return;
    setSelExp(null); setSelSit(null);
    if (sit === exp) {
      const a = api.award(`link.${sit}`, true, !tries.current[sit]);
      sounds.correct(); goldBurst(40);
      setMsg({ tone: 'ok', text: `${pick(OK_PHRASES.link)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
    } else {
      tries.current[sit] = (tries.current[sit] ?? 0) + 1;
      sounds.wrong();
      setMsg({ tone: 'no', text: pick(NO_PHRASES.link) });
      setShake(exp);
      setFlash({ sit, exp });
      later(() => { setShake(null); setFlash(null); }, 800);
    }
  };

  const pickExp = (exp: number) => {
    if (matched(exp)) return;
    sounds.click();
    if (selSit != null) attempt(selSit, exp);
    else setSelExp(selExp === exp ? null : exp);
  };
  const pickSit = (sit: number) => {
    if (matched(sit)) return;
    sounds.click();
    if (selExp != null) attempt(sit, selExp);
    else setSelSit(selSit === sit ? null : sit);
  };

  const pts = STATION_TASKS.link.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);

  return (
    <StationFrame title="مختبر التحدي" quote="راقب ما يحدث، وفكّر في السبب... فكل ظاهرة وراءها تفسير!" points={pts} onBack={onBack}>
      <Banner tone="info" className="mb-4">
        🎮 صِل كل موقف بتفسيره: اسحب بطاقة التفسير وأفلتها على الموقف، أو اضغط البطاقة ثم اضغط الموقف. ({doneN} من {N})
      </Banner>

      <div ref={wrap} className="relative grid md:grid-cols-[1fr_88px_1fr] gap-4 md:gap-0 items-start">
        <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
          {Object.entries(segs).map(([k, s]) => (
            <g key={k}>
              <path
                d={`M${s.x1} ${s.y1} C ${(s.x1 + s.x2) / 2} ${s.y1}, ${(s.x1 + s.x2) / 2} ${s.y2}, ${s.x2} ${s.y2}`}
                fill="none"
                stroke={k === 'no' ? '#fb7185' : GOLD}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={k === 'no' ? '8 8' : undefined}
                className={k === 'no' ? '' : 'mass-draw'}
                style={k === 'no' ? undefined : ({ ['--len' as string]: '700' } as React.CSSProperties)}
                filter={k === 'no' ? undefined : 'drop-shadow(0 0 5px rgba(221,180,85,0.7))'}
              />
              <circle cx={s.x1} cy={s.y1} r="6" fill={k === 'no' ? '#fb7185' : GOLD} />
              <circle cx={s.x2} cy={s.y2} r="6" fill={k === 'no' ? '#fb7185' : GOLD} />
            </g>
          ))}
        </svg>

        {/* المواقف */}
        <div className="space-y-3">
          <p className="text-sm text-amber-300">المواقف</p>
          {SITUATIONS.map((s, i) => (
            <div
              key={i}
              ref={el => { sitEls.current[i] = el; }}
              role="button"
              tabIndex={0}
              aria-pressed={selSit === i}
              onClick={() => pickSit(i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSit(i); } }}
              onDragOver={e => { if (!matched(i)) e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); const d = Number(e.dataTransfer.getData('text/plain')); if (Number.isInteger(d)) attempt(i, d); }}
              className={`relative flex items-center gap-3 rounded-2xl border-2 p-3.5 cursor-pointer transition-colors ${matched(i) ? 'border-amber-400 bg-amber-400/10' : selSit === i ? 'border-amber-300 bg-amber-300/10' : 'border-white/15 bg-slate-900/60 hover:border-amber-400/60'}`}
            >
              <span className="shrink-0 w-14 h-14 rounded-xl bg-slate-950/60 border hairline p-1.5"><SitIcon kind={s.icon} /></span>
              <span className="text-[15px] leading-loose text-white"><Txt>{s.text}</Txt></span>
              {matched(i) && <span className="absolute -top-2.5 -start-2.5 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-display grid place-items-center text-sm">{i + 1}</span>}
            </div>
          ))}
        </div>

        <div className="hidden md:block" aria-hidden="true" />

        {/* التفسيرات بترتيب عشوائي */}
        <div className="space-y-3">
          <p className="text-sm text-amber-300">التفسيرات</p>
          {order.map(e => (
            <div
              key={e}
              ref={el => { expEls.current[e] = el; }}
              role="button"
              tabIndex={matched(e) ? -1 : 0}
              draggable={!matched(e)}
              aria-pressed={selExp === e}
              onClick={() => pickExp(e)}
              onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickExp(e); } }}
              onDragStart={ev => { ev.dataTransfer.setData('text/plain', String(e)); ev.dataTransfer.effectAllowed = 'move'; setSelExp(e); }}
              className={`relative rounded-2xl border-2 p-3.5 text-[14px] leading-loose text-white select-none transition-colors ${matched(e) ? 'border-amber-400 bg-amber-400/10 cursor-default' : selExp === e ? 'border-amber-300 bg-amber-300/10 cursor-grab' : 'border-white/15 bg-slate-900/60 hover:border-amber-400/60 cursor-grab'}`}
              style={shake === e ? { animation: 'shake 0.4s' } : undefined}
            >
              {SITUATIONS[e].explain}
              {matched(e) && <span className="absolute -top-2.5 -start-2.5 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-display grid place-items-center text-sm">{e + 1}</span>}
            </div>
          ))}
        </div>
      </div>

      {msg && <Banner tone={msg.tone} className="mt-5">{msg.text}</Banner>}

      {allDone && (
        <div className="mt-5 section-card rounded-3xl p-6 text-center animate-in" role="status">
          <p className="font-display text-2xl text-amber-300">🔗 وصلتَ المواقف كلها بتفسيراتها!</p>
          <p className="mt-2 text-white">جمعتَ <b className="text-amber-300">{pts}</b> نقطة في مختبر التحدي.</p>
          <QuietBtn className="mt-4" onClick={onBack}>العودة إلى الشاشة الرئيسية للمختبر</QuietBtn>
        </div>
      )}
    </StationFrame>
  );
};
