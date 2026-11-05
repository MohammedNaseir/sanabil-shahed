/**
 * بطاقة نشاط واحد: الصورة الجانبية، بطاقة العالِم، المؤقت، النشاط نفسه، التغذية الراجعة، والنقاط.
 * النقاط تُمنح للمحاولة الأولى فقط وبدون أخطاء (أو ضمن الأخطاء المسموحة لكل لعبة).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Item } from '../content/types';
import { ItemBody } from './questions';
import { Feedback, Rich, TimerBar, img, useLab } from './shared';
import { HOW_T, ENC, GAMEHOW, VAULT_HOW, Variant, noPhrase, okPhrase, pick } from './texts';
import { useSafeTimeouts } from '../utils/draft';

export interface ItemCardProps {
  item: Item;
  taskId: string;
  variant: Variant;
  /** نص فوق النشاط (مثل «2 / 5»). */
  counter?: string;
  /** لعبة المختبر (للذرة) لعرض فكرتها. */
  game?: keyof typeof GAMEHOW;
  showHow?: boolean;
  nextLabel: string;
  onNext: () => void;
  /** كل محاولة: صحيحة أو خاطئة (للوحات اللعب). */
  onEvent?: (ok: boolean) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, taskId, variant, counter, game, showHow, nextLabel, onNext, onEvent }) => {
  const { tasks, award } = useLab();
  const [fb, setFb] = useState<{ title: string; text: string } | null>(null);
  const [okTitle, setOkTitle] = useState('');
  const [result, setResult] = useState<{ granted: number; penalized: boolean; repeat: boolean } | 'timeout' | null>(null);
  const later = useSafeTimeouts();
  const doneRef = useRef(false);
  const [enc] = useState(() => pick(ENC));

  const finish = useCallback((penalized: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const repeat = tasks[taskId] !== undefined;
    const granted = award(taskId, penalized ? 0 : item.p ?? 1);
    setFb(null);
    setOkTitle(okPhrase(variant));
    setResult({ granted, penalized, repeat });
  }, [award, item.p, taskId, tasks, variant]);

  const onWrong = useCallback((message: string) => {
    onEvent?.(false);
    if (message) setFb({ title: noPhrase(variant), text: message });
  }, [onEvent, variant]);

  // المؤقت: عند انتهائه تُسجَّل المحاولة دون نقاط
  useEffect(() => {
    if (!item.tm) return;
    const id = later(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      award(taskId, 0);
      setResult('timeout');
    }, item.tm * 1000);
    return () => clearTimeout(id);
  }, [item.tm, taskId, award, later]);

  const locked = result !== null;
  const how = item.how || (item.t === 'fill' && item.skin === 'vault' ? VAULT_HOW : HOW_T[item.t]);
  const media = item.m;
  const sci = item.sci;

  const pointsNote = result && result !== 'timeout'
    ? variant === 'atom'
      ? result.granted ? `+${result.granted} نقطة` : result.repeat ? '(تدريب دون نقاط جديدة)' : result.penalized ? '(دون نقاط لتكرار المحاولة)' : ''
      : result.granted ? `+${result.granted}` : result.penalized ? '(دون نقاط لتكرار المحاولة)' : '(تدريب دون نقاط جديدة)'
    : '';

  return (
    <div className={media ? 'grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 md:gap-6 items-start' : ''}>
      {media && (
        <figure className="rounded-2xl overflow-hidden border hairline bg-slate-950 md:sticky md:top-20">
          <img src={img(media)} alt="" loading="lazy" decoding="async" className="w-full max-h-[26vh] md:max-h-[60vh] object-contain bg-white/5" />
        </figure>
      )}
      <div className="min-w-0">
        {counter && <span className="inline-block mb-2 text-[12px] font-mono text-slate-500">{counter}</span>}
        {showHow && how && (
          <div className="mb-3 rounded-2xl border hairline bg-slate-900/40 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-400">
            <b className="text-amber-300">🎮 فكرة اللعبة:</b> {how}
            {game && <><br />{GAMEHOW[game]}</>}
            <div className="mt-1 text-cyan-400">{enc}</div>
          </div>
        )}
        {sci && (
          <div className="mb-3 rounded-2xl border hairline bg-slate-900/50 p-3 flex gap-3 items-start">
            {sci.portrait && <img src={img(sci.portrait, 'sm')} alt="" className="w-16 h-20 object-cover rounded-xl bg-white shrink-0" />}
            <div>
              <p className="font-display text-lg text-white">{sci.name}</p>
              {sci.period && <p className="text-xs text-slate-500">{sci.period}</p>}
              {sci.key && <p className="text-[14px] text-slate-300 mt-1 leading-relaxed"><b className="text-amber-300">تذكّر:</b> {sci.key}</p>}
            </div>
          </div>
        )}
        {item.cs && <div className="mb-3 rounded-xl bg-slate-900/50 p-3 text-sm"><Rich text={item.cs} /></div>}
        {item.hdr && <div className="mb-3 rounded-xl bg-slate-900/50 p-3 text-center text-lg font-mono" dir="ltr">{item.hdr}</div>}
        {item.tm && !locked && <TimerBar seconds={item.tm} />}

        <div className={result === 'timeout' ? 'pointer-events-none opacity-60' : ''}>
          <ItemBody item={item} variant={variant} locked={locked} onWrong={onWrong} onHit={() => onEvent?.(true)} onSolved={finish} />
        </div>

        {fb && !locked && <Feedback tone="no" title={fb.title}>{fb.text}</Feedback>}
        {result === 'timeout' && <Feedback tone="no" title="انتهى الوقت! حتى التفاعلات تحتاج إلى زمن مناسب.">{item.e}</Feedback>}
        {result && result !== 'timeout' && (
          <Feedback tone="ok" title={`${okTitle} ${pointsNote}`}>
            <Rich text={item.e} />
            {item.fi && <img src={img(item.fi)} alt="" loading="lazy" className="mt-2 w-full max-h-64 object-contain rounded-xl bg-white/5" />}
          </Feedback>
        )}
        {locked && (
          <button type="button" onClick={onNext} autoFocus className="mt-4 h-11 px-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold animate-in">
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
};

/** سلسلة أنشطة تُعرض بالتتابع (محطات العناصر وأسئلة ما بعد التجربة). */
export const QuizSequence: React.FC<{
  items: Item[];
  idPrefix: string;
  variant: Variant;
  onFinish: () => void;
  showHow?: boolean;
  /** معرّف مخصص لكل نشاط (مثل أسئلة المجهر). */
  idFor?: (k: number) => string;
}> = ({ items, idPrefix, variant, onFinish, showHow, idFor }) => {
  const [k, setK] = useState(0);
  const it = items[k];
  return (
    <ItemCard
      key={k}
      item={it}
      variant={variant}
      taskId={idFor ? idFor(k) : `${idPrefix}.${k}`}
      counter={`${k + 1} / ${items.length}`}
      showHow={showHow}
      nextLabel={k < items.length - 1 ? 'التالي' : 'متابعة'}
      onNext={() => (k < items.length - 1 ? setK(k + 1) : onFinish())}
    />
  );
};
