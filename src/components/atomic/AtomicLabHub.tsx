import React from 'react';
import { ArrowLeft, BookOpen, Award, Check } from 'lucide-react';
import { Interactive3DAtom } from './Interactive3DAtom';
import { sounds } from '../../utils/audio';

export type DestinationId = 'timeline' | 'infer' | 'explain' | 'error_detective' | 'whatif' | 'final_challenge';

interface AtomicLabHubProps {
  onSelectDestination: (dest: DestinationId) => void;
  onOpenNotebook: () => void;
  onOpenCertificate: () => void;
  onBackToGateway: () => void;
  totalPoints: number;
  completedTasks: string[];
  studentName?: string;
}

// الوجهات الست بأسمائها المعتمدة وصورها من كتاب سنابل
const STATIONS: {
  id: DestinationId;
  name: string;
  subtitle: string;
  bgImage: string;
  badge: string;
  bookConcept: string;
}[] = [
  {
    id: 'timeline',
    name: 'رحلة عبر الزمن',
    subtitle: 'رحلة اكتشاف الذرة وتطور نماذجها التاريخية',
    bgImage: '/assets/aistudio/image_af24453e-thumb.webp',
    badge: 'العلماء والتاريخ',
    bookConcept: 'ديموقريطس • أرسطو • بويل • دالتون • فاراداي • ثومسون • بيكوريل • رذرفورد',
  },
  {
    id: 'infer',
    name: 'فكّر واستنتج',
    subtitle: 'تحليل المشاهدات واستخلاص النتائج العلمية',
    bgImage: '/assets/aistudio/image_c2f1b931-thumb.webp',
    badge: 'الاستدلال والتحليل',
    bookConcept: 'أشعة المهبط • الدولاب • ارتداد وانحراف ألفا ص 16-35',
  },
  {
    id: 'explain',
    name: 'مختبر فسّر',
    subtitle: 'التفسير الكيميائي الدقيق للظواهر والتجارب',
    bgImage: '/assets/aistudio/image_b9782493-thumb.webp',
    badge: 'فسّر كيميائياً',
    bookConcept: 'تفريغ الهواء • فرق الجهد العالي • كبريتيد الخارصين ZnS',
  },
  {
    id: 'error_detective',
    name: 'مختبر اكتشف الخطأ',
    subtitle: 'غرفة التحقيق العلمي وتصويب المغالطات',
    bgImage: '/assets/aistudio/image_e5336e6f-thumb.webp',
    badge: 'التحقيق العلمي',
    bookConcept: 'تصويب النماذج • اتجاه الأشعة • شحنة ألفا • أبعاد النواة',
  },
  {
    id: 'whatif',
    name: 'مختبر ماذا لو؟',
    subtitle: 'محاكاة افتراضية للسيناريوهات والفرضيات البديلة',
    bgImage: '/assets/aistudio/image_82a6bb5b-thumb.webp',
    badge: 'المحاكاة والتوقع',
    bookConcept: 'لو كان الهواء موصلاً • لو كانت الذرة مصمتة • لو تغيرت الشحنات',
  },
  {
    id: 'final_challenge',
    name: 'مختبر التحدي الختامي',
    subtitle: 'قاعة التقييم الذري النهائي والتتويج بالوسام',
    bgImage: '/assets/aistudio/image_10319527-thumb.webp',
    badge: 'التحدي والتتويج',
    bookConcept: 'اختبار شامل من أسئلة كتاب سنابل • وسام صقور الذرة',
  },
];

export function AtomicLabHub({
  onSelectDestination,
  onOpenNotebook,
  onOpenCertificate,
  onBackToGateway,
  totalPoints,
  completedTasks,
  studentName = 'صقر الكيمياء',
}: AtomicLabHubProps) {
  return (
    <div className="space-y-10 sm:space-y-14" dir="rtl">

      {/* المقدّمة */}
      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8 items-center">
        <div className="stagger text-right">
          <p className="flex items-center gap-3 text-[13px] text-cyan-400">
            <span className="h-px w-10 bg-cyan-400/60" aria-hidden="true" />
            المختبر المرافق • بنية الذرة والنماذج الذرية
          </p>
          <h1 className="font-display text-4xl sm:text-6xl text-white mt-3 leading-tight">مختبر الذرة</h1>
          <p className="font-display text-xl sm:text-2xl text-amber-300 mt-5">مرحبًا بكم في مختبر الذرة!</p>
          <p className="mt-2 max-w-xl text-[15px] sm:text-base leading-loose text-slate-400">
            هنا لا نكتفي بمعرفة ما اكتشفه العلماء… بل نفكر، ونحلل، ونستنتج كما يفعل العلماء.
          </p>

          <div className="mt-7 rounded-2xl border hairline bg-slate-900/50 p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="min-w-0">
                <span className="block text-xs text-slate-500">الباحث</span>
                <span className="block font-display text-lg text-white truncate">{studentName}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">النقاط</span>
                <span className="font-display text-2xl text-white">{totalPoints}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">الوجهات</span>
                <span className="font-display text-2xl text-white">{completedTasks.length}</span>
                <span className="text-sm text-slate-500"> / {STATIONS.length}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  onOpenCertificate();
                }}
                className="flex-1 sm:flex-none h-9 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Award className="w-4 h-4" aria-hidden="true" />
                وسام باحث الذرة
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  onOpenNotebook();
                }}
                className="flex-1 sm:flex-none h-9 px-4 rounded-full border hairline text-slate-300 hover:text-amber-300 text-sm inline-flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                دفتر الباحث
              </button>
            </div>
          </div>
        </div>

        <figure className="hidden sm:flex flex-col items-center justify-center">
          <Interactive3DAtom size="hero" interactive={true} />
          <figcaption className="mt-2 text-xs text-slate-500">مجسم الذرة التفاعلي — النواة والمدارات</figcaption>
        </figure>
      </section>

      {/* الوجهات */}
      <section aria-labelledby="destinations-title">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h2 id="destinations-title" className="font-display text-2xl sm:text-3xl text-white">الوجهات الست</h2>
            <p className="text-[13px] text-slate-500 mt-1">من ديمقريطس إلى رذرفورد • نقاط لكل مهمة تنجزها</p>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.click();
              onBackToGateway();
            }}
            className="hidden sm:inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
          >
            مختبر السيليكون
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {STATIONS.map((st, i) => {
            const isDone = completedTasks.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  sounds.click();
                  onSelectDestination(st.id);
                }}
                className="group element-tile rounded-2xl sm:rounded-3xl overflow-hidden text-right flex sm:flex-col min-h-[112px] hover:-translate-y-1 focus-visible:-translate-y-1 transition-transform duration-300"
              >
                <span className="relative block w-28 sm:w-full shrink-0 sm:h-36 overflow-hidden">
                  <img src={st.bgImage} alt="" loading="lazy" decoding="async" width={480} height={270} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <span className="absolute inset-0 bg-gradient-to-l sm:bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" aria-hidden="true" />
                  <span className="absolute top-2.5 start-2.5 font-mono text-[11px] text-white">{String(i + 1).padStart(2, '0')}</span>
                </span>
                <span className="flex-1 p-4 sm:p-5 flex flex-col">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-cyan-400">{st.badge}</span>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" /> مكتملة
                      </span>
                    )}
                  </span>
                  <span className="block font-display text-lg sm:text-xl text-white mt-1">{st.name}</span>
                  <span className="block text-[13px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{st.subtitle}</span>
                  <span className="mt-auto pt-3 hidden sm:flex items-center justify-between gap-2 border-t hairline text-[13px]">
                    <span className="text-slate-500 truncate">{st.bookConcept}</span>
                    <span className="inline-flex items-center gap-1.5 text-amber-300 shrink-0">
                      دخول
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
