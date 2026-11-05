import React, { useState } from 'react';
import {
  Trophy, ShieldCheck, Atom, Share2, BookOpen, FlaskConical, Volume2, VolumeX,
  Cloud, CloudOff, CloudUpload, Clock, WifiOff, AlertCircle, LayoutGrid, MoreHorizontal, UserRound, X,
} from 'lucide-react';
import { Student, LabSession } from '../types';
import type { SyncState } from '../utils/scoreQueue';
import { ThemeToggle } from './ThemeToggle';
import { useDialog } from '../utils/useDialog';

interface NavbarProps {
  currentStudent: Student | null;
  session: LabSession | null;
  currentView: string;
  syncState: SyncState | null;
  soundOn: boolean;
  onToggleSound: () => void;
  onNavigateHome: () => void;
  onNavigateSelection: () => void;
  onNavigateAtom: () => void;
  onNavigateElements: () => void;
  onOpenNotebook: () => void;
  onOpenIdCard: () => void;
  onOpenRegister: () => void;
  onOpenLeaderboard: () => void;
  onOpenTeacher: () => void;
  onOpenShare: () => void;
}

const SYNC_LABELS: Record<SyncState, { text: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
  saved: { text: 'تم الحفظ', cls: 'text-emerald-400', Icon: Cloud },
  pending: { text: 'جاري الحفظ…', cls: 'text-sky-400', Icon: CloudUpload },
  offline: { text: 'غير متصل', cls: 'text-amber-400', Icon: CloudOff },
  waiting_approval: { text: 'بانتظار الاعتماد', cls: 'text-amber-400', Icon: Clock },
  local: { text: 'تدريب دون اتصال', cls: 'text-sky-400', Icon: WifiOff },
  error: { text: 'تعذّر الاعتماد', cls: 'text-rose-400', Icon: AlertCircle },
};

function useActive(currentView: string) {
  return {
    selection: currentView === 'lab_selection' || currentView === 'finale',
    atom: currentView === 'atom_hub' || currentView === 'atom_gate',
    elements: currentView === 'elements_hub' || currentView === 'element_lab',
  };
}

/** زر نصّي في الشريط العلوي مع خط ذهبي تحت العنصر النشط. */
const TopLink: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`relative h-full px-1 text-sm whitespace-nowrap transition-colors ${active ? 'text-amber-300' : 'text-slate-400 hover:text-slate-100'}`}
  >
    {children}
    <span className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-all ${active ? 'bg-amber-400' : 'bg-transparent'}`} aria-hidden="true" />
  </button>
);

const IconButton: React.FC<{ label: string; onClick: () => void; pressed?: boolean; children: React.ReactNode; className?: string }> = ({ label, onClick, pressed, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    aria-pressed={pressed}
    className={`inline-flex items-center justify-center w-9 h-9 rounded-full border hairline transition-colors ${pressed ? 'bg-amber-500/15 text-amber-300' : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'} ${className}`}
  >
    {children}
  </button>
);

/** بطاقة الطالب الصغيرة: الاسم والنقاط وحالة الحفظ. */
const StudentChip: React.FC<{ student: Student | null; sync: typeof SYNC_LABELS[SyncState] | null; onOpenIdCard: () => void; onOpenRegister: () => void }> = ({ student, sync, onOpenIdCard, onOpenRegister }) => {
  if (!student) {
    return (
      <button
        type="button"
        onClick={onOpenRegister}
        className="inline-flex items-center gap-2 h-9 ps-4 pe-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors"
      >
        <UserRound className="w-4 h-4" aria-hidden="true" />
        هويتي الكيميائية
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpenIdCard}
      aria-label={`بطاقة الهوية الكيميائية: ${student.fullName}، ${student.totalPoints} نقطة${sync ? `، ${sync.text}` : ''}`}
      className="inline-flex items-center gap-2.5 h-10 ps-1 pe-3.5 rounded-full border hairline hover:bg-amber-500/10 transition-colors"
    >
      <span className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-300 font-display text-sm flex items-center justify-center" aria-hidden="true">
        {student.fullName.trim().charAt(0)}
      </span>
      <span className="text-right leading-tight" aria-hidden="true">
        <span className="block text-[13px] text-slate-100 max-w-[110px] truncate">{student.fullName.split(' ')[0]}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="font-mono text-amber-300">{student.totalPoints}</span> نقطة
          {sync && (
            <span className={`flex items-center gap-0.5 ${sync.cls}`}>
              <sync.Icon className="w-3 h-3" />
              <span className="hidden lg:inline">{sync.text}</span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
};

/** قائمة «المزيد» على الجوال: لوحة سفلية. */
const MoreSheet: React.FC<NavbarProps & { onClose: () => void }> = (props) => {
  const { dialogProps, titleId } = useDialog(props.onClose);
  const run = (fn: () => void) => () => {
    props.onClose();
    fn();
  };
  const sync = props.syncState ? SYNC_LABELS[props.syncState] : null;
  const items: { label: string; Icon: React.FC<{ className?: string }>; onClick: () => void }[] = [
    { label: 'دفتر الباحث', Icon: BookOpen, onClick: run(props.onOpenNotebook) },
    { label: 'مشاركة رابط المختبر', Icon: Share2, onClick: run(props.onOpenShare) },
    { label: 'لوحة المعلمة', Icon: ShieldCheck, onClick: run(props.onOpenTeacher) },
  ];
  return (
    <div className="fixed inset-0 z-[55] md:hidden" dir="rtl">
      <button type="button" aria-label="إغلاق القائمة" onClick={props.onClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div {...dialogProps} className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-slate-900 border-t hairline p-5 pb-safe animate-in focus:outline-none">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" aria-hidden="true" />
        <div className="flex items-center justify-between mb-3">
          <h2 id={titleId} className="font-display text-lg text-white">المزيد</h2>
          <button type="button" onClick={props.onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full border hairline flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {sync && (
          <p className={`flex items-center gap-2 text-sm mb-3 ${sync.cls}`}>
            <sync.Icon className="w-4 h-4" aria-hidden="true" /> {sync.text}
          </p>
        )}
        <ul className="divide-y divide-slate-800">
          {items.map(({ label, Icon, onClick }) => (
            <li key={label}>
              <button type="button" onClick={onClick} className="w-full flex items-center gap-3 py-3.5 text-slate-100 text-[15px]">
                <Icon className="w-5 h-5 text-amber-400" aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={props.onToggleSound} aria-pressed={props.soundOn} className="w-full flex items-center gap-3 py-3.5 text-slate-100 text-[15px]">
              {props.soundOn ? <Volume2 className="w-5 h-5 text-amber-400" aria-hidden="true" /> : <VolumeX className="w-5 h-5 text-amber-400" aria-hidden="true" />}
              {props.soundOn ? 'إيقاف المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = (props) => {
  const { currentStudent, currentView, syncState, soundOn, onToggleSound } = props;
  const active = useActive(currentView);
  const sync = syncState ? SYNC_LABELS[syncState] : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b hairline" dir="rtl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-amber-400 focus:text-slate-950 focus:font-bold">
        تخطَّ إلى المحتوى
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        <button type="button" onClick={props.onNavigateHome} className="flex items-center gap-3 shrink-0" aria-label="الرئيسية — مختبرات صقور الكيمياء">
          <img src="/sanabil-logo.png" alt="" className="h-9 w-auto object-contain" />
          <span className="hidden sm:block text-right leading-tight" aria-hidden="true">
            <span className="block font-display text-[15px] text-white">صقور الكيمياء</span>
            <span className="block text-[11px] text-slate-500">إشراف أ. شهد نصير</span>
          </span>
        </button>

        <nav aria-label="التنقل بين المختبرات" className="hidden md:flex items-stretch gap-4 lg:gap-6 h-full">
          <TopLink active={active.selection} onClick={props.onNavigateSelection}>المختبرات</TopLink>
          <TopLink active={active.atom} onClick={props.onNavigateAtom}>مختبر الذرة</TopLink>
          <TopLink active={active.elements} onClick={props.onNavigateElements}>مختبر العناصر</TopLink>
          <span className="hidden lg:contents">
            <TopLink onClick={props.onOpenLeaderboard}>لوحة الشرف</TopLink>
            <TopLink onClick={props.onOpenNotebook}>دفتر الباحث</TopLink>
          </span>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:block">
            <StudentChip student={currentStudent} sync={sync} onOpenIdCard={props.onOpenIdCard} onOpenRegister={props.onOpenRegister} />
          </div>
          {/* على الجوال: مؤشر الحفظ فقط بجانب زر الوضع */}
          {sync && (
            <span className={`md:hidden inline-flex items-center gap-1 text-[11px] ${sync.cls}`} role="status">
              <sync.Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {sync.text}
            </span>
          )}
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            <IconButton
              label={soundOn ? 'إيقاف المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
              onClick={onToggleSound}
              pressed={soundOn}
            >
              {soundOn ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
            </IconButton>
            <IconButton label="لوحة الشرف" onClick={props.onOpenLeaderboard} className="lg:hidden">
              <Trophy className="w-4 h-4" aria-hidden="true" />
            </IconButton>
            <IconButton label="مشاركة رابط المختبر مع الطلاب" onClick={props.onOpenShare}>
              <Share2 className="w-4 h-4" aria-hidden="true" />
            </IconButton>
            <IconButton label="لوحة تحكم المعلمة" onClick={props.onOpenTeacher}>
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * شريط التنقل السفلي للجوال: كل الوجهات الأساسية بإبهام واحد.
 */
export const MobileTabBar: React.FC<NavbarProps> = (props) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const active = useActive(props.currentView);
  const student = props.currentStudent;

  const tabs = [
    { key: 'labs', label: 'المختبرات', Icon: LayoutGrid, onClick: props.onNavigateSelection, active: active.selection },
    { key: 'atom', label: 'الذرة', Icon: Atom, onClick: props.onNavigateAtom, active: active.atom },
    { key: 'el', label: 'العناصر', Icon: FlaskConical, onClick: props.onNavigateElements, active: active.elements },
    { key: 'board', label: 'الشرف', Icon: Trophy, onClick: props.onOpenLeaderboard, active: false },
    {
      key: 'me',
      label: student ? student.fullName.split(' ')[0] : 'هويتي',
      Icon: UserRound,
      onClick: student ? props.onOpenIdCard : props.onOpenRegister,
      active: false,
      badge: student ? String(student.totalPoints) : undefined,
    },
  ];

  return (
    <>
      <nav aria-label="التنقل الرئيسي" className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-950/92 backdrop-blur-xl border-t hairline pb-safe" dir="rtl">
        <ul className="grid grid-cols-6 max-w-lg mx-auto">
          {tabs.map(({ key, label, Icon, onClick, active: isActive, badge }) => (
            <li key={key}>
              <button
                type="button"
                onClick={onClick}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex flex-col items-center gap-1 pt-2.5 pb-1.5 text-[10.5px] transition-colors ${isActive ? 'text-amber-300' : 'text-slate-400'}`}
              >
                <span className={`absolute top-0 h-0.5 w-8 rounded-full ${isActive ? 'bg-amber-400' : 'bg-transparent'}`} aria-hidden="true" />
                <span className="relative">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {badge && (
                    <span className="absolute -top-1.5 -start-3 min-w-[18px] px-1 h-[15px] rounded-full bg-amber-500 text-slate-950 text-[9px] font-mono font-semibold leading-[15px] text-center">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="max-w-[60px] truncate">{label}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className="w-full flex flex-col items-center gap-1 pt-2.5 pb-1.5 text-[10.5px] text-slate-400"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              المزيد
            </button>
          </li>
        </ul>
      </nav>
      {moreOpen && <MoreSheet {...props} onClose={() => setMoreOpen(false)} />}
    </>
  );
};
