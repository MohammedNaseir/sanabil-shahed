/**
 * المحطة 2 — من أنا؟: لوحة المحقق الكيميائي. لغز يصف مصطلحًا، يخمّنه الطالب كتابةً أو باختياره من القائمة.
 * زر «أظهر التلميح»، وزر «اكشف الإجابة»؛ بلا مؤقت. بعد الصواب تظهر بطاقة المصطلح بتعريفه.
 */
import React, { useState } from 'react';
import { NO_PHRASES, OK_PHRASES, WHO_ITEMS, matchesWho } from './data';
import { STATION_TASKS, type RatioApi } from './state';
import { Banner, Choice, GOLD, GoldBtn, QuietBtn, RFrame, Scale, goldBurst } from './ui';
import { pick } from '../../engine/texts';
import { sounds } from '../../utils/audio';

const Molecule: React.FC<{ solved: boolean }> = ({ solved }) => (
  <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
    <g stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity={solved ? 1 : 0.35}>
      <path d="M60 60 L100 30 M60 60 L100 90 M100 30 L145 40 M100 90 L145 80" />
    </g>
    <g opacity={solved ? 1 : 0.35}>
      <circle cx="60" cy="60" r="20" fill="#2f6fd6" stroke={GOLD} strokeWidth="2" />
      <circle cx="100" cy="30" r="14" fill="#c8962e" /><circle cx="100" cy="90" r="14" fill="#c8962e" />
      <circle cx="145" cy="40" r="11" fill="#a82a3d" /><circle cx="145" cy="80" r="11" fill="#a82a3d" />
    </g>
    {!solved && <text x="100" y="68" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff" fontFamily="Cairo, sans-serif">؟</text>}
  </svg>
);

export const Who: React.FC<{ api: RatioApi; onBack: () => void }> = ({ api, onBack }) => {
  const done = (i: number) => Boolean(api.state.awards[`who.${i}`]);
  const firstOpen = WHO_ITEMS.findIndex((_, i) => !done(i));
  const [idx, setIdx] = useState(firstOpen < 0 ? 0 : firstOpen);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const [hint, setHint] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null);

  const item = WHO_ITEMS[idx];
  const rec = api.state.awards[`who.${idx}`];
  const solved = Boolean(rec);
  const allDone = WHO_ITEMS.every((_, i) => done(i));
  const pts = STATION_TASKS.who.reduce((s, t) => s + (api.state.awards[t]?.pts ?? 0), 0);

  const success = () => {
    const a = api.award(`who.${idx}`, true, wrong === 0 && !hint);
    sounds.correct(); goldBurst(60);
    setMsg({ tone: 'ok', text: `${pick(OK_PHRASES)} ${a.pts ? `+${a.pts} نقطة` : ''}` });
  };
  const fail = () => {
    sounds.wrong();
    setWrong(w => w + 1);
    setMsg({ tone: 'no', text: pick(NO_PHRASES) });
  };

  const submit = () => {
    if (solved || !text.trim()) return;
    if (matchesWho(text, item)) success(); else fail();
  };
  const choose = (i: number) => {
    if (solved || picked.includes(i)) return;
    if (i === item.a) success(); else { setPicked(p => [...p, i]); fail(); }
  };
  const reveal = () => {
    if (solved) return;
    api.award(`who.${idx}`, false, false);
    sounds.click();
    setMsg(null);
  };
  const go = (i: number) => { setIdx(i); setText(''); setPicked([]); setWrong(0); setHint(false); setMsg(null); };

  const firstLetter = item.term[0];

  return (
    <RFrame title="من أنا؟" quote="كل لغز وراءه مصطلح، وكل مصطلح وراءه فكرة." points={pts} onBack={onBack}>
      <div className="flex justify-center gap-2 mb-4" aria-label="الفوازير">
        {WHO_ITEMS.map((_, i) => (
          <button key={i} type="button" onClick={() => go(i)} className={`h-9 px-4 rounded-full text-sm border ${i === idx ? 'border-amber-400 bg-amber-400/15 text-amber-200' : done(i) ? 'border-amber-400/40 text-amber-300' : 'border-white/20 text-slate-300'}`}>
            اللغز {i + 1}{done(i) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6 items-start">
        <div className="section-card rounded-3xl p-5 text-center">
          <p className="text-[13px] text-amber-300">🕵️ لوحة المحقق الكيميائي</p>
          <div className="mt-2 max-w-[260px] mx-auto">
            {item.icon === 'law'
              ? <Scale angle={solved ? 0 : 9} left={solved ? '' : '؟'} right={solved ? '' : '؟'} glow={solved} leftTitle="تجربة 1" rightTitle="تجربة 2" />
              : <div className="h-[130px]"><Molecule solved={solved} /></div>}
          </div>
          <div className="mt-3 flex justify-center gap-1.5 flex-wrap" dir="rtl" aria-label="خانات المصطلح">
            {[...item.term].map((ch, i) => ch === ' '
              ? <span key={i} className="w-3" />
              : <span key={i} className={`w-7 h-9 rounded-lg border grid place-items-center font-display text-lg ${solved ? 'border-amber-400 text-amber-200 bg-amber-400/10 mass-pop' : i === 0 && hint ? 'border-amber-300 text-amber-200' : 'border-white/25 text-transparent'}`}>
                {solved || (i === 0 && hint) ? ch : '·'}
              </span>)}
          </div>
          {!solved && hint && <p className="mt-2 text-[12px] text-slate-300">الحرف الأول: <b className="text-amber-300">{firstLetter}</b></p>}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="section-card rounded-3xl p-5 sm:p-6">
            <p className="text-[13px] text-amber-300">اللغز {idx + 1}</p>
            <p className="mt-2 text-xl sm:text-2xl leading-[2] text-white">
              <span className="text-amber-300 tracking-widest">(........................)</span> {item.riddle}
            </p>
          </div>

          {!solved && (
            <div className="section-card rounded-3xl p-5 sm:p-6 space-y-4">
              <form className="flex gap-3 flex-wrap" onSubmit={e => { e.preventDefault(); submit(); }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, 40))}
                  placeholder="اكتب المصطلح هنا…"
                  aria-label="المصطلح العلمي"
                  className="flex-1 min-w-[180px] h-12 rounded-xl border border-white/25 bg-slate-950/60 px-4 text-lg text-white focus:outline-none focus:border-amber-400"
                />
                <GoldBtn type="submit" disabled={!text.trim()}>تحقق</GoldBtn>
              </form>
              <div>
                <p className="text-[13px] text-slate-300 mb-2">أو اختر من القائمة:</p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {item.options.map((o, i) => (
                    <Choice key={i} onClick={() => choose(i)} disabled={picked.includes(i)} state={picked.includes(i) ? 'wrong' : 'idle'}>{o}</Choice>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {!hint ? <QuietBtn onClick={() => setHint(true)}>💡 أظهر التلميح</QuietBtn> : null}
                <QuietBtn onClick={reveal}>🔓 اكشف الإجابة</QuietBtn>
              </div>
              {hint && <Banner tone="info" title="تلميح">{item.hint}</Banner>}
              <p className="text-[12px] text-slate-400">الإجابة بلا أخطاء وبلا تلميح تمنح +5 نقاط. كشف الإجابة لا يمنح نقاطًا.</p>
            </div>
          )}

          {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}

          {solved && (
            <div className="section-card rounded-3xl p-5 sm:p-6 border-amber-400/60 animate-in" style={{ boxShadow: '0 0 28px rgba(221,180,85,0.25)' }}>
              <p className="text-[13px] text-amber-300">🗂️ بطاقة المصطلح {rec && !rec.ok ? '(كُشفت الإجابة)' : ''}</p>
              <p className="mt-1 font-display text-3xl sm:text-4xl text-amber-300">{item.term}</p>
              <p className="mt-2 text-[16px] sm:text-lg leading-loose text-white">{item.def}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {idx < WHO_ITEMS.length - 1 && <GoldBtn onClick={() => go(idx + 1)}>اللغز التالي</GoldBtn>}
                {allDone && <QuietBtn onClick={onBack}>العودة إلى خريطة المحطات</QuietBtn>}
              </div>
            </div>
          )}
        </div>
      </div>
    </RFrame>
  );
};
