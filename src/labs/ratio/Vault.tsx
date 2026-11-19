/**
 * المحطة 4 — خزنة الكيمياء: مسألتان بلا مؤقت. يجيب الطالب ويتحقق (فيحصل على نقاطه وتُفتح القفل)،
 * ولا يظهر الحل إلا بعد أن تضغط المعلمة «كشف الحل» ثم تتقدم خطوة خطوة. حل المسألة الثانية بنجاح يفتح الخزنة.
 */
import React, { useState } from 'react';
import { SUGAR_TABLE, VAULT_PROBLEMS, NO_PHRASES, OK_PHRASES, type VaultProblem } from './data';
import { STATION_TASKS, type RatioApi } from './state';
import { Banner, Choice, GOLD, GoldBtn, QuietBtn, RFrame, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { sounds } from '../../utils/audio';

const VaultSvg: React.FC<{ locks: [boolean, boolean]; open: boolean }> = ({ locks, open }) => (
  <svg viewBox="0 0 240 230" className="w-full h-auto" role="img" aria-label={open ? 'الخزنة مفتوحة والكنز ظاهر' : 'خزنة مغلقة'}>
    <defs>
      <linearGradient id="vault-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a4fb0" /><stop offset="1" stopColor="#10234f" /></linearGradient>
      <radialGradient id="vault-glow"><stop offset="0" stopColor="#f6e2a8" stopOpacity="0.95" /><stop offset="1" stopColor="#ddb455" stopOpacity="0" /></radialGradient>
    </defs>
    <rect x="22" y="22" width="196" height="186" rx="16" fill="#0b1838" stroke={GOLD} strokeWidth="5" />
    {/* الكنز داخل الخزنة */}
    <g opacity={open ? 1 : 0} style={{ transition: 'opacity 0.8s 0.5s' }}>
      <circle cx="120" cy="150" r="70" fill="url(#vault-glow)" />
      <ellipse cx="120" cy="188" rx="62" ry="12" fill="#a87d2c" />
      {[[88, 176], [108, 180], [130, 178], [150, 182], [100, 166], [124, 164], [142, 168]].map(([x, y], i) => (
        <g key={i}><ellipse cx={x} cy={y} rx="14" ry="6" fill="#ddb455" stroke="#a87d2c" strokeWidth="2" /><ellipse cx={x} cy={y - 2} rx="9" ry="3" fill="#f6e2a8" /></g>
      ))}
      <path d="M120 112 L136 128 L120 150 L104 128 Z" fill="#6f9bf5" stroke="#fff" strokeWidth="2" />
      <path d="M104 128 H136 M120 112 V150" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      <path d="M60 80 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z M180 100 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#f6e2a8" />
    </g>
    {/* باب الخزنة: ينطوي نحو المفصلة عند الفتح */}
    <g style={{ transform: open ? 'scaleX(0.1)' : 'scaleX(1)', transformOrigin: '34px 115px', transition: 'transform 1s cubic-bezier(0.5, 0, 0.2, 1)' }}>
      <rect x="34" y="34" width="172" height="162" rx="12" fill="url(#vault-body)" stroke={GOLD} strokeWidth="3" />
      <rect x="48" y="48" width="144" height="134" rx="8" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      <circle cx="120" cy="115" r="34" fill="#0b1838" stroke={GOLD} strokeWidth="4" />
      <circle cx="120" cy="115" r="22" fill="none" stroke={GOLD} strokeWidth="2" strokeDasharray="3 5" />
      <path d="M120 115 L120 94 M120 115 L134 124" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="120" cy="115" r="6" fill={GOLD} />
      {[0, 1].map(i => (
        <g key={i} transform={`translate(${i === 0 ? 62 : 178} 58)`}>
          <rect x="-12" y="-4" width="24" height="20" rx="4" fill={locks[i] ? GOLD : '#13265a'} stroke={GOLD} strokeWidth="2" />
          <path d={locks[i] ? 'M-6 -4 V-12 A6 6 0 0 1 6 -12' : 'M-6 -4 V-10 A6 6 0 0 1 6 -10 V-4'} fill="none" stroke={GOLD} strokeWidth="3" />
        </g>
      ))}
    </g>
  </svg>
);

const parseNum = (s: string) => {
  const t = s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٫,،]/g, '.').replace(/[^0-9.]/g, '');
  return t === '' || t === '.' ? NaN : Number(t);
};

const SugarTable: React.FC<{ filled: boolean }> = ({ filled }) => (
  <div className="overflow-x-auto rounded-2xl border hairline">
    <table className="w-full min-w-[420px] text-center text-[15px]" dir="rtl">
      <thead className="bg-slate-950/60 text-amber-300">
        <tr><th className="p-3 text-right">المصدر</th><th className="p-3">الكربون</th><th className="p-3">الهيدروجين</th><th className="p-3">الأكسجين</th></tr>
      </thead>
      <tbody>
        {SUGAR_TABLE.map(r => {
          const target = r.o === '؟';
          const cell = (v: string, full: string) => (filled ? full : v);
          return (
            <tr key={r.img} className="border-t border-white/10">
              <td className="p-2.5 text-right">
                <div className="flex items-center gap-3">
                  <img src={`/assets/ratio/${r.img}.webp`} alt={r.src} loading="lazy" className="w-14 h-14 rounded-xl object-cover border hairline" />
                  <div><p className="text-white font-bold">{r.src}</p><p className="text-[10px] text-slate-400 leading-tight">{r.credit}</p></div>
                </div>
              </td>
              <td className="p-2.5 text-white font-mono" dir="ltr">{cell(r.c, '42%')}</td>
              <td className="p-2.5 text-white font-mono" dir="ltr">{cell(r.h, '6.5%')}</td>
              <td className={`p-2.5 font-mono font-bold ${target ? 'bg-amber-400/20 text-amber-200 ring-2 ring-inset ring-amber-400/70 animate-pulse' : 'text-white'}`} dir="ltr">
                {filled ? '51.5%' : r.o}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Problem: React.FC<{ api: RatioApi; idx: number; p: VaultProblem }> = ({ api, idx, p }) => {
  const id = `vault.${idx}`;
  const rec = api.state.awards[id];
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState(0);
  const [hint, setHint] = useState(false);
  const [steps, setSteps] = useState(0);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);

  const finalReached = steps >= p.steps.length;

  const check = (ok: boolean) => {
    if (rec) return;
    if (ok) {
      const a = api.award(id, true, wrong === 0 && !hint);
      sounds.correct(); goldBurst(70);
      if (idx === 1) sounds.vaultOpen();
      setMsg({ tone: 'ok', text: `${pick(OK_PHRASES)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
    } else {
      sounds.wrong();
      setWrong(w => w + 1);
      setMsg({ tone: 'no', text: pick(NO_PHRASES) });
    }
  };

  const submitNum = () => {
    if (rec || !text.trim()) return;
    check(typeof p.answer === 'number' && Math.abs(parseNum(text) - p.answer) < 1e-9);
  };

  const nextStep = () => {
    sounds.click();
    const n = steps + 1;
    setSteps(n);
    // اكتمال كشف الحل دون حل الطالب = تسجيل المهمة بلا نقاط
    if (n >= p.steps.length && !rec) api.award(id, false, false);
  };

  return (
    <div className="section-card rounded-3xl p-5 sm:p-6 space-y-4">
      <h3 className="font-display text-2xl text-white">{p.title}</h3>
      <p className="text-[16px] sm:text-lg leading-[2] text-white whitespace-pre-line">{p.text}</p>
      {idx === 0 && <SugarTable filled={finalReached} />}
      <p className="text-[16px] sm:text-lg leading-loose font-bold text-amber-300">{p.ask}</p>

      {!rec && (
        <div className="space-y-3">
          {p.kind === 'number' ? (
            <form className="flex gap-3 items-center flex-wrap" onSubmit={e => { e.preventDefault(); submitNum(); }}>
              <input value={text} onChange={e => setText(e.target.value.slice(0, 8))} inputMode="decimal" dir="ltr" placeholder="النسبة"
                aria-label="نسبة الأكسجين" className="w-32 h-12 rounded-xl border border-white/25 bg-slate-950/60 text-center font-mono text-lg text-white focus:outline-none focus:border-amber-400" />
              <span className="text-slate-200">%</span>
              <GoldBtn type="submit" disabled={!text.trim()}>تحقق من القفل</GoldBtn>
            </form>
          ) : (
            <div className="flex gap-3">
              <Choice className="w-36 justify-center" onClick={() => check(true)}>نعم، تتفق</Choice>
              <Choice className="w-36 justify-center" onClick={() => check(false)}>لا، لا تتفق</Choice>
            </div>
          )}
          {!hint && <QuietBtn onClick={() => setHint(true)}>💡 تلميح</QuietBtn>}
          {hint && <Banner tone="info" title="تلميح">{p.hint}</Banner>}
        </div>
      )}

      {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}

      <div className="border-t border-white/10 pt-4">
        {steps === 0 ? (
          <QuietBtn onClick={nextStep}>🔓 كشف الحل (المعلمة)</QuietBtn>
        ) : (
          <div className="space-y-2" aria-label="خطوات الحل">
            {p.steps.slice(0, steps).map((s, i) => (
              <p key={i} className={`rounded-xl border px-4 py-2.5 text-[15px] sm:text-[17px] leading-loose animate-in ${i === p.steps.length - 1 ? 'border-amber-400/70 bg-amber-400/10 text-amber-100' : 'border-white/15 bg-slate-950/40 text-white'}`}>
                <b className="text-amber-300">الخطوة {i + 1}: </b>{s}
              </p>
            ))}
            {!finalReached && <QuietBtn onClick={nextStep}>الخطوة التالية ←</QuietBtn>}
          </div>
        )}
      </div>
    </div>
  );
};

export const Vault: React.FC<{ api: RatioApi; onBack: () => void }> = ({ api, onBack }) => {
  const rec = (i: number) => api.state.awards[`vault.${i}`];
  const [tab, setTab] = useState(() => (rec(0) ? (rec(1) ? 0 : 1) : 0));
  const allDone = VAULT_PROBLEMS.every((_, i) => rec(i));
  const pts = STATION_TASKS.vault.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);
  const locks: [boolean, boolean] = [Boolean(rec(0)?.ok), Boolean(rec(1)?.ok)];
  const open = locks[1];

  return (
    <RFrame title="خزنة الكيمياء" quote="قفل رقمي وكنز من النقاط… والمفتاح هو حلّك الدقيق." points={pts} onBack={onBack}>
      <div className="grid lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] gap-6 items-start">
        <div className="lg:sticky lg:top-24">
          <div className="max-w-[300px] mx-auto"><VaultSvg locks={locks} open={open} /></div>
          <p className="mt-2 text-center text-[14px] text-slate-200">
            {open ? '🎉 انفتحت الخزنة! الكنز لك.' : `الأقفال المفتوحة: ${locks.filter(Boolean).length} من 2`}
          </p>
          {open && <p className="text-center font-display text-xl text-amber-300">كنزك: {pts} نقطة</p>}
        </div>

        <div className="min-w-0">
          <div className="flex gap-2 mb-4 flex-wrap" role="tablist" aria-label="مسائل الخزنة">
            {VAULT_PROBLEMS.map((p, i) => (
              <button key={i} type="button" role="tab" aria-selected={tab === i} onClick={() => { sounds.click(); setTab(i); }}
                className={`h-10 px-4 rounded-full text-sm border ${tab === i ? 'border-amber-400 bg-amber-400/15 text-amber-200' : rec(i) ? 'border-amber-400/40 text-amber-300' : 'border-white/20 text-slate-200'}`}>
                {p.title.split(':')[0]}{rec(i) ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <Problem key={tab} api={api} idx={tab} p={VAULT_PROBLEMS[tab]} />
          {allDone && (
            <div className="mt-5 section-card rounded-3xl p-6 text-center animate-in" role="status">
              <p className="font-display text-2xl text-amber-300">🔐 أنجزتَ مسائل الخزنة!</p>
              <p className="mt-2 text-white">جمعتَ <b className="text-amber-300">{pts}</b> نقطة.</p>
              <QuietBtn className="mt-4" onClick={onBack}>العودة إلى خريطة المحطات</QuietBtn>
            </div>
          )}
        </div>
      </div>
    </RFrame>
  );
};
