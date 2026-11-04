import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AtelierBackdrop } from './AtelierBackdrop';
import { ThemeToggle } from '../ThemeToggle';
import { sounds } from '../../utils/audio';

interface LabSelectionScreenProps {
  onSelectSiliconLab: () => void;
  onSelectAtomicLab: () => void;
  onBackToReception: () => void;
  studentPoints?: number;
  studentName?: string;
  chemicalId?: string;
}

interface LabDoorProps {
  index: string;
  symbol: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  facts: string[];
  accent: 'gold' | 'patina';
  onEnter: () => void;
  cta: string;
}

/** «باب» المختبر: بطاقة عنصر كبيرة بإطار رفيع بدل البطاقات المتوهجة. */
const LabDoor: React.FC<LabDoorProps> = ({ index, symbol, number, title, subtitle, description, facts, accent, onEnter, cta }) => {
  const tone = accent === 'gold'
    ? { text: 'text-amber-400', btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950', line: 'bg-amber-400' }
    : { text: 'text-cyan-400', btn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950', line: 'bg-cyan-400' };
  return (
    <article className="group element-tile rounded-[28px] p-6 sm:p-8 text-right flex flex-col gap-6 hover:-translate-y-1 focus-within:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between w-full">
        <div>
          <span className="font-mono text-xs text-slate-500">{index}</span>
          <h3 className="font-display text-3xl sm:text-4xl text-white mt-1">{title}</h3>
          <p className={`text-sm mt-1 ${tone.text}`}>{subtitle}</p>
        </div>
        <div className="shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-2xl border hairline flex flex-col justify-between p-2.5 text-right bg-slate-950/40">
          <span className="font-mono text-[11px] text-slate-400">{number}</span>
          <span className={`font-display text-4xl leading-none ${tone.text}`}>{symbol}</span>
        </div>
      </div>

      <p className="text-[15px] leading-loose text-slate-300">{description}</p>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-400">
        {facts.map(f => (
          <li key={f} className="flex items-center gap-2">
            <span className={`w-1 h-1 rounded-full ${tone.line}`} aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>

      {/* الزر يغطي البطاقة كلها بطبقة شفافة حتى تكون البطاقة كلها قابلة للنقر */}
      <button
        type="button"
        onClick={() => {
          sounds.click();
          onEnter();
        }}
        className={`mt-auto inline-flex items-center justify-between w-full ps-6 pe-2 py-2 rounded-full font-bold ${tone.btn} transition-colors after:absolute after:inset-0 after:rounded-[28px] after:content-['']`}
      >
        {cta}
        <span className="w-10 h-10 rounded-full bg-slate-950/90 flex items-center justify-center group-hover:-translate-x-1 transition-transform" aria-hidden="true">
          <ArrowLeft className={`w-5 h-5 ${tone.text}`} />
        </span>
      </button>
    </article>
  );
};

export const LabSelectionScreen: React.FC<LabSelectionScreenProps> = ({
  onSelectSiliconLab,
  onSelectAtomicLab,
  onBackToReception,
  studentPoints = 0,
  studentName,
  chemicalId,
}) => {
  return (
    <div className="relative min-h-[100svh] w-full flex flex-col text-slate-100 overflow-x-hidden" dir="rtl">
      <AtelierBackdrop />

      <header className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            sounds.click();
            onBackToReception();
          }}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          <span>الاستقبال</span>
        </button>

        <img src="/sanabil-logo.png" alt="منصة سنابل التعليمية" className="h-10 w-auto object-contain" />

        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="stagger flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <p className="flex items-center gap-3 text-[13px] text-amber-400">
              <span className="h-px w-10 bg-amber-400/60" aria-hidden="true" />
              اختر بوابتك العلمية
            </p>
            <h1 className="font-display text-4xl sm:text-6xl text-white mt-3">المختبرات</h1>
          </div>

          <div className="text-right sm:text-left">
            <span className="block text-xs text-slate-500">{studentName ? 'الباحث' : 'زائر المختبر'}</span>
            <span className="font-display text-xl text-amber-300">{studentName || 'صقر الكيمياء'}</span>
            <span className="block text-xs text-slate-400 mt-0.5">
              {chemicalId && <span className="font-mono">{chemicalId} • </span>}
              {studentPoints} نقطة
            </span>
          </div>
        </div>

        <div className="stagger grid md:grid-cols-2 gap-5 lg:gap-8">
          <LabDoor
            index="01 — المختبر الأساسي"
            symbol="Si"
            number="14"
            title="مختبر السيليكون"
            subtitle="عنصر السيليكون ومركباته • الوحدة الأولى"
            description="ست محطات: سباق صقور السيليكون، فك شيفرة السيليكا والترانزستور، الدوارق الغامضة، فرن الاستخلاص، المحقق الكيميائي، وطوق النجاة."
            facts={['6 محطات تفاعلية', 'موازنة المعادلات', 'شهادة إتقان (52 نقطة)']}
            accent="gold"
            cta="دخول مختبر السيليكون"
            onEnter={onSelectSiliconLab}
          />
          <LabDoor
            index="02 — المختبر المرافق"
            symbol="Au"
            number="79"
            title="مختبر الذرة"
            subtitle="بنية الذرة والنماذج الذرية"
            description="رحلة عبر الزمن من ديمقريطس ودالتون إلى طومسون ورذرفورد: تجارب أشعة المهبط وصفيحة الذهب، وتفسير الظواهر، والتحقيق في الأخطاء العلمية."
            facts={['قطار الزمن والعلماء', 'محاكي ذرة ثلاثي الأبعاد', 'الشهادة الذرية الذهبية']}
            accent="patina"
            cta="دخول مختبر الذرة"
            onEnter={onSelectAtomicLab}
          />
        </div>
      </main>

      <footer className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t hairline">
        <span>منصة سنابل التعليمية • إشراف أ. شهد نصير</span>
        <span>المنهاج الفلسطيني • كيمياء الصف العاشر</span>
      </footer>
    </div>
  );
};
