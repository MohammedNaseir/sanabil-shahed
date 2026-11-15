/**
 * المحطة 4 — أكاديمية العلماء: ثلاث ألعاب قصيرة: ورشة المعادلات، ميزان الأدلة، وتحدي الحساب السريع.
 * كل مهمة تُحتسب مرة واحدة، وبعد ثلاث محاولات خاطئة يمكن عرض الحل (دون نقاط) حتى لا يعلق الطالب.
 */
import React, { useEffect, useRef, useState } from 'react';
import { BALANCE, CALC, EQUATION, NO_PHRASES, OK_PHRASES } from './data';
import { STATION_TASKS, type MassApi } from './state';
import { Banner, GoldBtn, QuietBtn, Scale, StationFrame, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { sounds } from '../../utils/audio';

type Tab = 'eq' | 'bal' | 'calc';
const GIVE_UP_AFTER = 3;

// ---------------- 1) ورشة المعادلات ----------------

type SlotId = 'cKI' | 'cPb' | 'p1' | 'c1' | 'p2' | 'c2';
type Card = { kind: 'coef' | 'form'; value: string };
const SLOT_KIND: Record<SlotId, Card['kind']> = { cKI: 'coef', cPb: 'coef', c1: 'coef', c2: 'coef', p1: 'form', p2: 'form' };

const EquationWorkshop: React.FC<{ api: MassApi }> = ({ api }) => {
  const rec = api.state.awards['academy.eq'];
  const [slots, setSlots] = useState<Record<SlotId, string | null>>({ cKI: null, cPb: null, p1: null, c1: null, p2: null, c2: null });
  const [sel, setSel] = useState<Card | null>(null);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);

  const placed = [slots.p1, slots.p2];
  const full = (Object.values(slots) as (string | null)[]).every(Boolean);

  const put = (id: SlotId, card: Card) => {
    if (rec || SLOT_KIND[id] !== card.kind) return;
    setSlots(s => {
      const next = { ...s };
      // البطاقة الصيغية لا تُستخدم إلا مرة
      if (card.kind === 'form') (['p1', 'p2'] as const).forEach(k => { if (next[k] === card.value) next[k] = null; });
      next[id] = card.value;
      return next;
    });
    setSel(null); setMsg(null);
  };
  const slotClick = (id: SlotId) => {
    if (rec) return;
    sounds.click();
    if (sel) put(id, sel);
    else if (slots[id]) setSlots(s => ({ ...s, [id]: null }));
  };
  const onDrop = (id: SlotId, e: React.DragEvent) => {
    e.preventDefault();
    const [kind, ...rest] = e.dataTransfer.getData('text/plain').split(':');
    if (kind === 'coef' || kind === 'form') put(id, { kind, value: rest.join(':') });
  };

  const check = () => {
    const prod: Record<string, string> = {};
    if (slots.p1 && slots.c1) prod[slots.p1] = slots.c1;
    if (slots.p2 && slots.c2) prod[slots.p2] = slots.c2;
    const ok = slots.cKI === EQUATION.coef.ki && slots.cPb === EQUATION.coef.pb
      && Object.keys(EQUATION.right).length === Object.keys(prod).length
      && Object.entries(EQUATION.right).every(([f, c]) => prod[f] === c);
    if (ok) {
      const a = api.award('academy.eq', true, wrong === 0);
      sounds.correct(); goldBurst(60);
      setMsg({ tone: 'ok', text: `${pick(OK_PHRASES.equation)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
    } else {
      sounds.wrong();
      setWrong(w => w + 1);
      setMsg({ tone: 'no', text: `${pick(NO_PHRASES.equation)} راجع الصيغ والمعاملات: يجب أن يتساوى عدد ذرات كل عنصر في الطرفين.` });
    }
  };

  const slot = (id: SlotId) => {
    const v = slots[id];
    const isForm = SLOT_KIND[id] === 'form';
    return (
      <button
        type="button"
        onClick={() => slotClick(id)}
        onDragOver={e => { if (!rec) e.preventDefault(); }}
        onDrop={e => onDrop(id, e)}
        aria-label={isForm ? 'خانة ناتج' : 'خانة معامل'}
        className={`h-12 ${isForm ? 'min-w-[96px] px-3' : 'w-11'} rounded-xl border-2 border-dashed font-mono text-lg grid place-items-center transition-colors ${v ? 'border-amber-400 bg-amber-400/15 text-amber-100' : sel && sel.kind === SLOT_KIND[id] ? 'border-amber-300 bg-amber-300/10 animate-pulse' : 'border-white/30 text-slate-400'} ${rec ? 'cursor-default' : ''}`}
      >
        {v ?? '؟'}
      </button>
    );
  };

  const card = (c: Card) => {
    const on = sel?.kind === c.kind && sel.value === c.value;
    return (
      <button
        key={`${c.kind}:${c.value}`}
        type="button"
        draggable={!rec}
        disabled={Boolean(rec)}
        onDragStart={e => { e.dataTransfer.setData('text/plain', `${c.kind}:${c.value}`); setSel(c); }}
        onClick={() => { sounds.click(); setSel(on ? null : c); }}
        className={`h-11 ${c.kind === 'form' ? 'px-4' : 'w-11'} rounded-xl border font-mono text-base cursor-grab transition-colors ${on ? 'border-amber-300 bg-amber-300/20 text-amber-100' : 'border-white/20 bg-slate-900/70 text-white hover:border-amber-400/70'}`}
      >
        {c.value}
      </button>
    );
  };

  return (
    <div className="section-card rounded-3xl p-5 sm:p-6">
      <h3 className="font-display text-2xl text-white">ورشة المعادلات</h3>
      <p className="mt-1 text-[15px] text-slate-200">أكمل المعادلة ووازنها: اسحب البطاقات إلى الخانات، أو اضغط البطاقة ثم الخانة. اضغط خانة ممتلئة لإفراغها.</p>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex flex-wrap items-center justify-center gap-2 text-lg sm:text-xl font-mono text-white" dir="ltr">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">{slot('cKI')}<span>{EQUATION.left[0]}</span><span className="text-amber-300">+</span></span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">{slot('cPb')}<span>{EQUATION.left[1]}</span><span className="text-amber-300 text-2xl">→</span></span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">{slot('c1')}{slot('p1')}<span className="text-amber-300">+</span></span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">{slot('c2')}{slot('p2')}</span>
        </div>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div><p className="text-[13px] text-amber-300 mb-2">المعاملات</p><div className="flex gap-2">{['1', '2', '3'].map(v => card({ kind: 'coef', value: v }))}</div></div>
        <div><p className="text-[13px] text-amber-300 mb-2">النواتج</p><div className="flex flex-wrap gap-2" dir="ltr">{EQUATION.products.filter(p => !placed.includes(p)).map(v => card({ kind: 'form', value: v }))}</div></div>
      </div>
      {!rec && (
        <div className="mt-5 flex flex-wrap gap-3">
          <GoldBtn onClick={check} disabled={!full}>تحقق من المعادلة</GoldBtn>
          <QuietBtn onClick={() => { setSlots({ cKI: null, cPb: null, p1: null, c1: null, p2: null, c2: null }); setSel(null); setMsg(null); }}>إفراغ الخانات</QuietBtn>
          {wrong >= GIVE_UP_AFTER && <QuietBtn onClick={() => { api.award('academy.eq', false, false); setMsg({ tone: 'no', text: 'لا بأس، تعلّم من الحل وانتقل للمهمة التالية.' }); }}>أظهر الحل</QuietBtn>}
        </div>
      )}
      {msg && <Banner tone={msg.tone} className="mt-4">{msg.text}</Banner>}
      {rec && (
        <Banner tone={rec.ok ? 'ok' : 'info'} title="المعادلة الموزونة" className="mt-4">
          <p className="font-mono text-lg" dir="ltr">{EQUATION.answer}</p>
        </Banner>
      )}
    </div>
  );
};

// ---------------- 2) ميزان الأدلة ----------------

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))));

const BalanceGame: React.FC<{ api: MassApi }> = ({ api }) => {
  const rec = api.state.awards['academy.bal'];
  const [v, setV] = useState({ s: '', o: '', p: '' });
  const [stage, setStage] = useState<1 | 2>(rec ? 2 : 1);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);

  const L = (Number.isFinite(num(v.s)) ? num(v.s) : 0) + (Number.isFinite(num(v.o)) ? num(v.o) : 0);
  const R = Number.isFinite(num(v.p)) ? num(v.p) : 0;
  const typed = v.s !== '' || v.o !== '' || v.p !== '';
  const angle = rec || stage === 2 ? 0 : typed ? ((L - R) / Math.max(L, R, 1)) * 16 : 0;

  const setField = (k: 'o' | 's' | 'p', val: string) => { if (stage === 1 && !rec) { setV(x => ({ ...x, [k]: val.slice(0, 6) })); setMsg(null); } };

  const weigh = () => {
    const s = num(v.s), o = num(v.o), p = num(v.p);
    const masses = [s, o].sort((x, y) => x - y);
    const ok = masses[0] === BALANCE.s && masses[1] === BALANCE.o && p === BALANCE.so2;
    if (ok) {
      sounds.correct();
      setStage(2);
      setMsg({ tone: 'ok', text: pick(OK_PHRASES.balance) });
    } else {
      sounds.wrong();
      setWrong(w => w + 1);
      setMsg({ tone: 'no', text: `${pick(NO_PHRASES.balance)} أعد قراءة معطيات المسألة وأدخل الكتل الصحيحة في الكفتين.` });
    }
  };

  const answer = (yes: boolean) => {
    if (rec) return;
    if (yes) {
      const a = api.award('academy.bal', true, wrong === 0);
      sounds.correct(); goldBurst(60);
      setMsg({ tone: 'ok', text: `${pick(OK_PHRASES.balance)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
    } else {
      sounds.wrong();
      setWrong(w => w + 1);
      setMsg({ tone: 'no', text: `${pick(NO_PHRASES.balance)} قارن بين كتلة المتفاعلات وكتلة النواتج.` });
    }
  };

  const field = (k: 'o' | 's' | 'p', label: string) => (
    <label className="flex flex-col items-center gap-1 text-[13px] text-slate-200">
      {label}
      <input
        value={v[k]}
        onChange={e => setField(k, e.target.value)}
        inputMode="decimal"
        dir="ltr"
        disabled={stage === 2 || Boolean(rec)}
        placeholder="0"
        className="w-24 h-11 rounded-xl border border-white/25 bg-slate-950/60 text-center font-mono text-lg text-white focus:outline-none focus:border-amber-400 disabled:opacity-70"
      />
      <span className="text-[11px] text-slate-400">غم</span>
    </label>
  );

  return (
    <div className="section-card rounded-3xl p-5 sm:p-6">
      <h3 className="font-display text-2xl text-white">ميزان الأدلة</h3>
      <p className="mt-1 text-amber-200">«اجعل الميزان يتزن، وأثبت صحة القانون!»</p>
      <p className="mt-3 text-[15px] leading-loose text-white">{BALANCE.q}</p>
      <div className="mt-2 max-w-md mx-auto">
        <Scale angle={angle} left={typed || rec ? `${L || 0} غم` : undefined} right={typed || rec ? `${R || 0} غم` : undefined} leftTitle="المتفاعلات" rightTitle="النواتج" glow={Boolean(rec) || stage === 2} />
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-center gap-5">
        {field('s', 'كتلة الكبريت S')}
        {field('o', 'كتلة الأكسجين O₂')}
        <span className="hidden sm:block h-11 w-px bg-white/20" aria-hidden="true" />
        {field('p', 'كتلة الناتج SO₂')}
      </div>

      {stage === 1 && !rec && (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <GoldBtn onClick={weigh} disabled={!v.s || !v.o || !v.p}>ثبّت الميزان</GoldBtn>
          {wrong >= GIVE_UP_AFTER && <QuietBtn onClick={() => { api.award('academy.bal', false, false); setStage(2); setV({ s: '8', o: '8', p: '16' }); }}>أظهر الحل</QuietBtn>}
        </div>
      )}

      {(stage === 2 || rec) && (
        <div className="mt-5">
          <p className="text-center text-white mb-3">اتزن الميزان! هل يتفق ذلك مع قانون حفظ الكتلة؟</p>
          {!rec && (
            <div className="flex justify-center gap-3">
              <GoldBtn onClick={() => answer(true)}>نعم</GoldBtn>
              <QuietBtn className="h-12 px-8" onClick={() => answer(false)}>لا</QuietBtn>
            </div>
          )}
          {rec && <Banner tone={rec.ok ? 'ok' : 'info'} title="الإجابة النموذجية">{BALANCE.model}</Banner>}
        </div>
      )}
      {msg && !rec && <Banner tone={msg.tone} className="mt-4">{msg.text}</Banner>}
      {msg && rec && rec.ok && <Banner tone="ok" className="mt-4">{msg.text}</Banner>}
    </div>
  );
};

// ---------------- 3) تحدي الحساب السريع ----------------

const parseAnswer = (s: string) => {
  const t = s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٫,،]/g, '.').replace(/[^0-9.]/g, '');
  return t === '' || t === '.' ? NaN : Number(t);
};

const CalcQuestion: React.FC<{ api: MassApi; idx: number }> = ({ api, idx }) => {
  const item = CALC[idx];
  const id = `academy.c${idx}`;
  const rec = api.state.awards[id];
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(item.secs);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(rem);
      if (rem <= 0) {
        clearInterval(t);
        setRunning(false);
        api.award(id, false, false);
        sounds.wrong();
        setMsg({ tone: 'no', text: 'انتهى الوقت! تعلّم من الحل ثم تابع.' });
      }
    }, 200);
    return () => clearInterval(t);
  }, [running, api, id]);

  const start = () => { endAt.current = Date.now() + item.secs * 1000; setLeft(item.secs); setRunning(true); setMsg(null); setText(''); };

  const submit = () => {
    if (!running || text.trim() === '') return;
    if (Math.abs(parseAnswer(text) - item.ans) < 1e-9) {
      const a = api.award(id, true, wrong === 0);
      setRunning(false);
      sounds.correct(); goldBurst(60);
      setMsg({ tone: 'ok', text: `${pick(OK_PHRASES.calc)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
    } else {
      sounds.wrong();
      setWrong(w => w + 1);
      setMsg({ tone: 'no', text: pick(NO_PHRASES.calc) });
    }
  };

  const pct = (left / item.secs) * 100;

  return (
    <div className="rounded-2xl border hairline bg-slate-950/40 p-4">
      <p className="text-[13px] text-amber-300">المسألة {idx + 1}</p>
      {!rec && !running && (
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-slate-200">مؤقت من {item.secs} ثانية يبدأ عند الضغط.</p>
          <GoldBtn onClick={start}>ابدأ المسألة</GoldBtn>
        </div>
      )}
      {(running || rec) && (
        <>
          <p className="mt-2 text-[15px] leading-loose text-white">{item.q}</p>
          {running && (
            <>
              <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden" role="timer" aria-label={`متبقٍ ${left} ثانية`}>
                <div className={`h-full transition-[width] duration-200 ${left <= 8 ? 'bg-rose-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`mt-1 text-sm font-mono ${left <= 8 ? 'text-rose-300' : 'text-slate-300'}`}>{left} ث</p>
              <form className="mt-3 flex gap-3 flex-wrap items-center" onSubmit={e => { e.preventDefault(); submit(); }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, 10))}
                  inputMode="decimal"
                  dir="ltr"
                  autoFocus
                  placeholder="الناتج"
                  aria-label="إجابتك بالغرام"
                  className="w-32 h-12 rounded-xl border border-white/25 bg-slate-950/60 text-center font-mono text-lg text-white focus:outline-none focus:border-amber-400"
                />
                <span className="text-slate-300">غم</span>
                <GoldBtn type="submit" disabled={text.trim() === ''}>أجب</GoldBtn>
              </form>
            </>
          )}
          {rec && <Banner tone={rec.ok ? 'ok' : 'info'} title="الحل" className="mt-3">{item.sol}</Banner>}
        </>
      )}
      {msg && <Banner tone={msg.tone} className="mt-3">{msg.text}</Banner>}
    </div>
  );
};

const QuickCalc: React.FC<{ api: MassApi }> = ({ api }) => (
  <div className="section-card rounded-3xl p-5 sm:p-6">
    <h3 className="font-display text-2xl text-white">تحدي الحساب السريع</h3>
    <p className="mt-1 text-amber-200">«ثوانٍ قليلة تفصل بينك وبين الإجابة... احسب بدقة!»</p>
    <div className="mt-4 space-y-4">
      {CALC.map((_, i) => <CalcQuestion key={i} api={api} idx={i} />)}
    </div>
  </div>
);

// ---------------- المحطة ----------------

export const Academy: React.FC<{ api: MassApi; onBack: () => void }> = ({ api, onBack }) => {
  const done = (ids: string[]) => ids.every(i => api.state.awards[i]);
  const tabs: { id: Tab; label: string; ids: string[] }[] = [
    { id: 'eq', label: 'ورشة المعادلات', ids: ['academy.eq'] },
    { id: 'bal', label: 'ميزان الأدلة', ids: ['academy.bal'] },
    { id: 'calc', label: 'تحدي الحساب السريع', ids: ['academy.c0', 'academy.c1'] },
  ];
  const [tab, setTab] = useState<Tab>(() => tabs.find(t => !done(t.ids))?.id ?? 'eq');
  const allDone = STATION_TASKS.academy.every(t => api.state.awards[t]);
  const pts = STATION_TASKS.academy.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);

  return (
    <StationFrame title="أكاديمية العلماء" quote="هنا تتحول معرفتك إلى إنجاز... أثبت دقتك في كل مهمة!" points={pts} onBack={onBack}>
      <div className="flex flex-wrap justify-center gap-2 mb-5" role="tablist" aria-label="ألعاب الأكاديمية">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { sounds.click(); setTab(t.id); }}
            className={`h-11 px-4 rounded-full border text-sm transition-colors ${tab === t.id ? 'border-amber-400 bg-amber-400/15 text-amber-200' : done(t.ids) ? 'border-amber-400/40 text-amber-300' : 'border-white/20 text-slate-200 hover:border-amber-400/50'}`}
          >
            {i + 1}. {t.label}{done(t.ids) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {tab === 'eq' && <EquationWorkshop api={api} />}
      {tab === 'bal' && <BalanceGame api={api} />}
      {tab === 'calc' && <QuickCalc api={api} />}

      {allDone && (
        <div className="mt-5 section-card rounded-3xl p-6 text-center animate-in" role="status">
          <p className="font-display text-2xl text-amber-300">🎓 أنجزتَ مهام الأكاديمية!</p>
          <p className="mt-2 text-white">جمعتَ <b className="text-amber-300">{pts}</b> نقطة.</p>
          <QuietBtn className="mt-4" onClick={onBack}>العودة إلى الشاشة الرئيسية للمختبر</QuietBtn>
        </div>
      )}
      {!allDone && tab !== 'calc' && (
        <div className="mt-4 flex justify-center">
          <QuietBtn onClick={() => setTab(tab === 'eq' ? 'bal' : 'calc')}>اللعبة التالية</QuietBtn>
        </div>
      )}
    </StationFrame>
  );
};
