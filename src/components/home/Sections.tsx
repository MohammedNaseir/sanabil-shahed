import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sounds } from '../../utils/audio';

/* ============================== أيقونات Vector مخصّصة ============================== */

/** دورق مخروطي بسائل ذهبي وفقاعات. */
const FlaskIcon: React.FC = () => (
  <svg viewBox="0 0 96 96" className="w-full h-full" aria-hidden="true">
    <defs>
      <linearGradient id="flask-liquid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3d892" />
        <stop offset="1" stopColor="#c08f33" />
      </linearGradient>
      <linearGradient id="flask-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9dbcff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#4a7be6" stopOpacity="0.12" />
      </linearGradient>
    </defs>
    <path d="M38 12h20M41 12v24L20 74a8 8 0 0 0 7 12h42a8 8 0 0 0 7-12L55 36V12" fill="url(#flask-glass)" stroke="#e8c876" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M28.5 62h39l7.6 13.6A4.5 4.5 0 0 1 71.2 82H24.8a4.5 4.5 0 0 1-3.9-6.4z" fill="url(#flask-liquid)" />
    <circle cx="42" cy="70" r="3.2" fill="#fff6dc" opacity="0.85" />
    <circle cx="54" cy="74" r="2.2" fill="#fff6dc" opacity="0.7" />
    <circle cx="48" cy="52" r="2.4" fill="#e8c876" opacity="0.8" />
    <circle cx="52" cy="44" r="1.6" fill="#e8c876" opacity="0.6" />
    <path d="M70 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f3d892" />
  </svg>
);

/** كأس إنجاز بمقبضين وقاعدة ونجمة. */
const TrophyIcon: React.FC = () => (
  <svg viewBox="0 0 96 96" className="w-full h-full" aria-hidden="true">
    <defs>
      <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6e2a8" />
        <stop offset="0.5" stopColor="#ddb455" />
        <stop offset="1" stopColor="#a87d2c" />
      </linearGradient>
    </defs>
    <path d="M30 14h36v20a18 18 0 0 1-36 0z" fill="url(#trophy-gold)" />
    <path d="M30 20H18a10 10 0 0 0 12 16M66 20h12a10 10 0 0 1-12 16" fill="none" stroke="#e8c876" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M48 23l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L48 37.8l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" fill="#fff6dc" opacity="0.9" />
    <path d="M44 52h8v12h-8z" fill="#c08f33" />
    <rect x="32" y="64" width="32" height="8" rx="2.5" fill="url(#trophy-gold)" />
    <rect x="26" y="74" width="44" height="9" rx="3" fill="#4a7be6" stroke="#e8c876" strokeWidth="1.5" />
    <path d="M18 10l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#f3d892" />
  </svg>
);

/* ============================== مكونات مشتركة ============================== */

const PageHead: React.FC<{ kicker?: string; title: string; sub: string }> = ({ kicker, title, sub }) => (
  <header className="text-center stagger">
    {kicker && <p className="text-[13px] text-amber-300">{kicker}</p>}
    <h1 className="mt-2 font-display text-[2rem] leading-tight sm:text-5xl text-white">{title}</h1>
    <p className="mt-3 text-[15px] sm:text-lg text-slate-200">{sub}</p>
  </header>
);

const GoldButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={() => {
      sounds.click();
      onClick();
    }}
    className={`gold-cta group inline-flex items-center justify-center gap-3 h-12 px-6 rounded-2xl font-bold ${className}`}
  >
    {children}
    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
  </button>
);

const QuietButton: React.FC<{ onClick: () => void; children: React.ReactNode; back?: boolean }> = ({ onClick, children, back }) => (
  <button
    type="button"
    onClick={() => {
      sounds.click();
      onClick();
    }}
    className="gold-pill inline-flex items-center gap-2 h-11 px-5 rounded-2xl text-sm text-white hover:text-amber-200 transition-colors"
  >
    {back && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
    {children}
    {!back && <ArrowLeft className="w-4 h-4" aria-hidden="true" />}
  </button>
);

/* ============================== شاشة اختيار الأقسام ============================== */

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  motto: string;
  description: string;
  cta: string;
  onEnter: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ icon, title, motto, description, cta, onEnter }) => (
  <article className="section-card rounded-[28px] p-6 sm:p-8 flex flex-col items-center text-center h-full">
    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-4 bg-slate-950/50 border hairline">{icon}</div>
    <h2 className="mt-5 font-display text-3xl sm:text-4xl text-white">{title}</h2>
    <p className="mt-3 font-display text-lg sm:text-xl text-amber-300 leading-relaxed">«{motto}»</p>
    <p className="mt-3 text-[15px] leading-loose text-slate-200 max-w-md">{description}</p>
    <div className="mt-auto pt-7 w-full flex justify-center">
      <GoldButton onClick={onEnter} className="w-full max-w-sm">{cta}</GoldButton>
    </div>
  </article>
);

export const SectionsScreen: React.FC<{ onQuestions: () => void; onReview: () => void }> = ({ onQuestions, onReview }) => (
  <div className="py-4 sm:py-8">
    <PageHead title="إلى أيّ مختبر ستنطلق اليوم؟" sub="اختر وجهتك، واستعد لخوض تجربة كيميائية مختلفة!" />
    <div className="mt-8 sm:mt-12 grid md:grid-cols-2 gap-5 lg:gap-8 items-stretch stagger">
      <SectionCard
        icon={<FlaskIcon />}
        title="مختبرات الأسئلة"
        motto="فكّر، حلّل، واكتشف طريق الإجابة!"
        description="هنا تتحول أسئلة الكيمياء إلى تجارب تفكير وتحديات، تختبر فهمك وتدفعك لاستخدام مهاراتك الكيميائية."
        cta="الدخول إلى مختبرات الأسئلة"
        onEnter={onQuestions}
      />
      <SectionCard
        icon={<TrophyIcon />}
        title="مختبرات المراجعة"
        motto="راجع معلوماتك، وتحدَّ عقلك، وحلّق نحو التميّز!"
        description="هنا تتحول مراجعة الدروس إلى ألعاب ومنافسات وتحديات كيميائية، تجمع فيها النقاط وتثبت تميّزك."
        cta="الدخول إلى مختبرات المراجعة"
        onEnter={onReview}
      />
    </div>
  </div>
);

/* ============================== قسم مختبرات الأسئلة ============================== */

/**
 * مختبرات الأسئلة الخاصة بالدروس تُضاف هنا (لكل درس مختبره).
 * القسم منفصل تماماً عن مختبرات المراجعة، فلا يظهر فيه مختبر الذرة ولا مختبر العناصر.
 */
export const QUESTION_LABS: { id: string; title: string; description: string; onOpen: () => void }[] = [];

export const QuestionsSection: React.FC<{ onSections: () => void; onReview: () => void }> = ({ onSections, onReview }) => (
  <div className="py-4 sm:py-8">
    <PageHead kicker="القسم الأول" title="مختبرات الأسئلة" sub="فكّر، حلّل، واكتشف طريق الإجابة!" />

    {QUESTION_LABS.length > 0 ? (
      <div className="mt-10 grid md:grid-cols-2 gap-5 lg:gap-8">
        {QUESTION_LABS.map(l => (
          <article key={l.id} className="section-card rounded-[28px] p-6 sm:p-8 flex flex-col text-right">
            <h2 className="font-display text-2xl text-white">{l.title}</h2>
            <p className="mt-2 text-[15px] leading-loose text-slate-200">{l.description}</p>
            <GoldButton onClick={l.onOpen} className="mt-6 self-start">ادخل المختبر</GoldButton>
          </article>
        ))}
      </div>
    ) : (
      <section className="section-card mt-10 rounded-[28px] p-8 sm:p-12 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 mx-auto rounded-3xl p-3.5 bg-slate-950/50 border hairline"><FlaskIcon /></div>
        <h2 className="mt-5 font-display text-2xl sm:text-3xl text-white">مختبرات الدروس قيد التجهيز</h2>
        <p className="mt-3 text-[15px] leading-loose text-slate-200">
          هنا ستجد مختبر أسئلة خاصًا بكل درس، بتطبيقات وتحديات مرتبطة بمحتواه. تُضاف المختبرات تباعًا مع الدروس التي نعمل عليها.
        </p>
        <p className="mt-2 text-sm text-slate-300">إلى أن تُضاف، يمكنك التدرّب في مختبرات المراجعة.</p>
      </section>
    )}

    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <QuietButton onClick={onSections} back>العودة إلى اختيار المختبرات</QuietButton>
      <QuietButton onClick={onReview}>الانتقال إلى مختبرات المراجعة</QuietButton>
    </div>
  </div>
);

/* ============================== قسم مختبرات المراجعة ============================== */

interface ReviewLabCardProps {
  symbol: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  facts: string[];
  progress: string;
  cta: string;
  onEnter: () => void;
}

const ReviewLabCard: React.FC<ReviewLabCardProps> = ({ symbol, number, title, subtitle, description, facts, progress, cta, onEnter }) => (
  <article className="section-card rounded-[28px] p-6 sm:p-8 text-right flex flex-col gap-5 h-full">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl text-white">{title}</h2>
        <p className="text-sm mt-1.5 text-amber-300">{subtitle}</p>
      </div>
      <div className="shrink-0 w-20 h-24 rounded-2xl border hairline flex flex-col justify-between p-2.5 bg-slate-950/50">
        <span className="font-mono text-[11px] text-slate-300">{number}</span>
        <span className="font-display text-4xl leading-none text-amber-300">{symbol}</span>
      </div>
    </div>
    <p className="text-[15px] leading-loose text-slate-200">{description}</p>
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-300">
      {facts.map(f => (
        <li key={f} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          {f}
        </li>
      ))}
    </ul>
    <p className="text-[13px] font-mono text-sky-300">{progress}</p>
    <GoldButton onClick={onEnter} className="mt-auto w-full">{cta}</GoldButton>
  </article>
);

export const ReviewSection: React.FC<{
  atomProgress: string;
  elementsProgress: string;
  onAtom: () => void;
  onElements: () => void;
  onSections: () => void;
  onQuestions: () => void;
}> = ({ atomProgress, elementsProgress, onAtom, onElements, onSections, onQuestions }) => (
  <div className="py-4 sm:py-8">
    <PageHead kicker="القسم الثاني" title="مختبرات المراجعة" sub="راجع معلوماتك، وتحدَّ عقلك، وحلّق نحو التميّز!" />
    <div className="mt-8 sm:mt-12 grid md:grid-cols-2 gap-5 lg:gap-8 items-stretch stagger">
      <ReviewLabCard
        symbol="He"
        number="2"
        title="مختبر الذرة"
        subtitle="العلماء والنماذج والتجارب الذرية"
        description="ست بوابات حول ذرة دوّارة: رحلة الذرة عبر الزمن، فكّر واستنتج، فسّر، اكتشف الخطأ، ماذا لو؟، والتحقيق النهائي."
        facts={['سباق تتابع وذاكرة', 'بالونات وتقارير', 'لوحات الغرق والسلسلة والأدلة']}
        progress={atomProgress}
        cta="ادخل مختبر الذرة"
        onEnter={onAtom}
      />
      <ReviewLabCard
        symbol="Ca"
        number="20"
        title="مختبر العناصر"
        subtitle="الكالسيوم والكبريت والسيليكون"
        description="تجربتان تنفّذهما بنفسك لكل عنصر (الماء، التحليل الكهربائي، المجهر، الاحتراق، شبه الموصل، الاستخلاص) ثم خمس ألعاب مراجعة."
        facts={['6 تجارب افتراضية', 'صاروخ السرعة', 'دفتر الباحث']}
        progress={elementsProgress}
        cta="ادخل مختبر العناصر"
        onEnter={onElements}
      />
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <QuietButton onClick={onSections} back>العودة إلى اختيار المختبرات</QuietButton>
      <QuietButton onClick={onQuestions}>الانتقال إلى مختبرات الأسئلة</QuietButton>
    </div>
  </div>
);
