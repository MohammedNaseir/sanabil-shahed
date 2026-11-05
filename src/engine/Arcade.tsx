/**
 * «صاروخ السرعة» و«التحدي الختامي»: أسئلة سريعة بمؤقت، 3 قلوب، وكومبو.
 * كل إجابة صحيحة نقطة واحدة (مرة واحدة لكل سؤال)، وعند نفاد القلوب يعيد الطالب المحاولة.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ArcadeDef } from '../content/types';
import { Feedback, Option, Rich, TimerBar, img, shuffle, useLab } from './shared';
import { noPhrase, okPhrase } from './texts';
import { useSafeTimeouts } from '../utils/draft';
import { sounds } from '../utils/audio';
import confetti from '../utils/confetti';

const THEMES = { rocket: ['🚀', '🌌'], flask: ['⚗️', '🏆'], volcano: ['🌋', '💎'] } as const;

export const Arcade: React.FC<{ def: ArcadeDef; idPrefix: string; onEnd: () => void }> = ({ def, idPrefix, onEnd }) => {
  const { award } = useLab();
  const N = def.items.length;
  const LV = def.lives;
  const [run, setRun] = useState(0);
  const [k, setK] = useState(0);
  const [lives, setLives] = useState(LV);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [answer, setAnswer] = useState<{ i: number; ok: boolean; title: string } | null>(null);
  const later = useSafeTimeouts();
  const busy = useRef(false);
  const [icon, goal] = THEMES[def.theme] ?? THEMES.flask;

  const it = def.items[k];
  // الترتيب يُحسب مع السؤال نفسه حتى لا يُستخدم ترتيب سؤال سابق بعدد خيارات مختلف
  const order = useMemo(() => {
    if (!it) return [];
    const idx = it.o.map((_, i) => i);
    return it.fixed ? idx : shuffle(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, run]);

  const respond = (i: number) => {
    if (busy.current || !it) return;
    busy.current = true;
    const ok = i === it.a;
    if (ok) {
      sounds.correct();
      setCombo(c => c + 1);
      setHits(h => h + 1);
      setScore(s => s + (combo + 1 >= 3 ? 2 : 1));
      award(`${idPrefix}.${k}`, 1);
    } else {
      sounds.wrong();
      setLives(l => l - 1);
      setCombo(0);
    }
    setAnswer({ i, ok, title: ok ? okPhrase('elements') : i < 0 ? 'انتهى الوقت! بعض التفاعلات تحتاج سرعة 😉' : noPhrase('elements') });
    later(() => {
      busy.current = false;
      setAnswer(null);
      if (!ok && lives - 1 <= 0) return setK(-1); // انتهت الفرص
      setK(x => x + 1);
    }, ok ? 1500 : 2300);
  };

  // مؤقت كل سؤال
  useEffect(() => {
    if (!it || answer) return;
    const id = later(() => respond(-1), def.tm * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, run, answer]);

  const restart = () => {
    busy.current = false;
    setAnswer(null);
    setRun(r => r + 1);
    setK(0);
    setLives(LV);
    setCombo(0);
    setScore(0);
    setHits(0);
  };

  const progress = Math.max(0, Math.min(k, N)) / N * 100;
  const hud = (
    <div className="mb-4">
      <div className="relative h-2.5 rounded-full bg-slate-800 mx-2 mt-6 mb-3">
        <div className="h-full rounded-full bg-gradient-to-l from-amber-400 to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        <span className="absolute -top-6 text-2xl transition-all duration-500" style={{ right: `calc(${progress}% - 14px)` }} aria-hidden="true">{icon}</span>
        <span className="absolute -top-6 -left-1 text-2xl" aria-hidden="true">{goal}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span aria-label={`القلوب: ${lives} من ${LV}`}>{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(Math.max(0, LV - lives))}</span>
        <b className="text-amber-300">🔥 كومبو ×{combo}</b>
        <span>⭐ {score}</span>
      </div>
    </div>
  );

  if (k === -1) {
    return (
      <div className="text-center">
        {hud}
        <h2 className="font-display text-2xl text-white">💥 انتهت الفرص!</h2>
        <p className="text-slate-400 mt-2">لا بأس… الكيميائيون يعيدون التجربة حتى تنجح. أجبت {hits} من {N}.</p>
        <button type="button" onClick={restart} className="mt-4 h-11 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">🔁 أعد المحاولة</button>
      </div>
    );
  }

  if (k >= N) {
    const stars = lives === LV && hits === N ? 3 : hits >= N * 0.7 ? 2 : 1;
    if (stars === 3) confetti({ particleCount: 70, spread: 70 });
    return (
      <div className="text-center">
        {hud}
        <div className="text-4xl" aria-label={`${stars} نجوم`}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
        <h2 className="font-display text-2xl text-white mt-2">{['أنجزت التحدي!', 'أداء قوي يا كيميائي!', 'أداء أسطوري! ناتج التفاعل 100%'][stars - 1]}</h2>
        <p className="text-slate-400 mt-2">أجبت {hits} من {N} · نقاط الكومبو {score}</p>
        <button type="button" onClick={onEnd} autoFocus className="mt-4 h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">متابعة ▶</button>
      </div>
    );
  }

  return (
    <div>
      {hud}
      {!answer && <TimerBar key={`${run}-${k}`} seconds={def.tm} />}
      <div className={it.m ? 'grid md:grid-cols-[0.8fr_1.2fr] gap-4 items-start' : ''}>
        {it.m && <img src={img(it.m)} alt="" loading="lazy" className="w-full max-h-56 object-contain rounded-2xl border hairline bg-white/5" />}
        <div>
          <span className="text-[12px] font-mono text-slate-500">{k + 1} / {N}</span>
          <h3 className="font-display text-lg sm:text-xl text-white leading-relaxed my-2"><Rich text={it.q} /></h3>
          <div className={it.fixed && it.o.length === 2 ? 'grid grid-cols-2 gap-3' : 'grid gap-2'}>
            {order.map(i => (
              <Option
                key={`${k}-${i}`}
                onClick={() => respond(i)}
                disabled={Boolean(answer)}
                state={answer ? (i === it.a ? 'right' : i === answer.i ? 'wrong' : 'idle') : 'idle'}
                className={it.fixed && it.o.length === 2 ? 'text-center text-xl py-4' : ''}
              >
                {it.o[i]}
              </Option>
            ))}
          </div>
          {answer && <Feedback tone={answer.ok ? 'ok' : 'no'} title={answer.title}>{it.e}</Feedback>}
        </div>
      </div>
    </div>
  );
};
