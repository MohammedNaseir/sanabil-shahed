/**
 * مختبر أ. شهد | صقور الكيمياء — منصة سنابل التعليمية
 * مراجعة فصل الذرة والعناصر (الكيمياء، الصف العاشر) بالألعاب والتجارب:
 *   المرحلة الأولى: مختبر الذرة (6 بوابات)
 *   المرحلة الثانية: مختبر العناصر — الكالسيوم والكبريت والسيليكون (7 محطات لكل عنصر)
 * المحتوى من lab_shahd_v5.html (src/content)، والتسجيل والنقاط ولوحة المعلمة من المنصة.
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';

import { Navbar, MobileTabBar } from './components/Navbar';
import { ChemicalIdCard } from './components/ChemicalIdCard';
import { StudentRegisterModal } from './components/StudentRegisterModal';
import { AtelierBackdrop } from './components/home/AtelierBackdrop';
import { ReceptionScreen } from './components/home/ReceptionScreen';
import { SectionsScreen, QuestionsSection, ReviewSection } from './components/home/Sections';
import { ChemBackdrop } from './components/home/ChemBackdrop';
import { LazyBoundary, LoadingPanel } from './components/LazyBoundary';
import { NoticeToast, type Notice } from './components/NoticeToast';

import { Student, LabSession } from './types';
import { sounds } from './utils/audio';
import confetti from './utils/confetti';
import { type Route, type ElementId, HOME_ROUTE, formatHash, parseHash, sameRoute } from './utils/routing';
import { usePolling } from './utils/usePolling';
import {
  GUEST_SCOPE, type Progress, type NotebookPage, applyServerStudent, emptyProgress, loadProgress, loadStudent, loadStudentKey,
  mergeJournal, mergeProgress, removeProgress, saveProgress, saveStudent, saveStudentKey,
} from './utils/studentStore';
import { type SyncState, clearQueue, enqueueTask, flushQueue, loadQueue } from './utils/scoreQueue';
import { TASK_POINTS, isTaskId, labTotals, ATOM_TASK_COUNT, ELEMENT_STATION_COUNT, elementStationsDone, type LabId } from './content/tasks';
import { LabContext, type LabRuntime, type NoteKind } from './engine/shared';

// تحميل كسول: كل مختبر ونافذة كبيرة يُحمَّل عند فتحه فقط
const AtomHub = lazy(() => import('./labs/AtomHub').then(m => ({ default: m.AtomHub })));
const AtomGatePage = lazy(() => import('./labs/AtomGate').then(m => ({ default: m.AtomGatePage })));
const ElementsHub = lazy(() => import('./labs/Elements').then(m => ({ default: m.ElementsHub })));
const ElementLabPage = lazy(() => import('./labs/Elements').then(m => ({ default: m.ElementLabPage })));
const Finale = lazy(() => import('./labs/Elements').then(m => ({ default: m.Finale })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const LeaderboardModal = lazy(() => import('./components/LeaderboardModal').then(m => ({ default: m.LeaderboardModal })));
const ShareLabModal = lazy(() => import('./components/ShareLabModal').then(m => ({ default: m.ShareLabModal })));
const CertificateModal = lazy(() => import('./components/ChemistryCertificateModal').then(m => ({ default: m.ChemistryCertificateModal })));
const NotebookModal = lazy(() => import('./components/Notebook').then(m => ({ default: m.NotebookModal })));

const DEFAULT_SESSION: LabSession = {
  isOpen: true,
  announcement: 'مرحبًا بكم يا صقور الكيمياء! اليوم مراجعة على شكل ألعاب وتحديات: نراجع فصل الذرة والعناصر ونجمع النقاط.',
  lessonName: 'مراجعة فصل الذرة والعناصر — الكيمياء الصف العاشر',
  teacherName: 'أ. شهد',
  organization: 'منصة سنابل التعليمية',
  elementsUnlocked: false,
};

const STATUS_POLL_MS = 7000;
const SESSION_POLL_MS = 30000;

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export default function App() {
  // =================== التنقّل عبر الرابط ===================
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash).route);

  useEffect(() => {
    const sync = () => {
      const { route: r, valid } = parseHash(window.location.hash);
      if (!valid) window.history.replaceState(window.history.state, '', formatHash(r));
      setRoute(prev => (sameRoute(prev, r) ? prev : r));
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const navigate = useCallback((r: Route, opts: { replace?: boolean } = {}) => {
    const target = formatHash(r);
    const current = window.location.hash || '#/';
    if (current !== target) {
      if (opts.replace) window.history.replaceState(window.history.state, '', target);
      else window.location.hash = target;
    }
    setRoute(r);
    scrollTop();
  }, []);

  const go = useMemo(() => ({
    reception: () => navigate(HOME_ROUTE),
    labs: () => navigate({ view: 'lab_selection', gate: null, lab: null }),
    questions: () => navigate({ view: 'questions', gate: null, lab: null }),
    review: () => navigate({ view: 'review', gate: null, lab: null }),
    atom: () => navigate({ view: 'atom_hub', gate: null, lab: null }),
    gate: (g: number) => navigate({ view: 'atom_gate', gate: g, lab: null }),
    elements: () => navigate({ view: 'elements_hub', gate: null, lab: null }),
    lab: (lab: ElementId) => navigate({ view: 'element_lab', gate: null, lab }),
    finale: () => navigate({ view: 'finale', gate: null, lab: null }),
  }), [navigate]);

  const currentView = route.view;

  // =================== هوية الطالب وتقدّمه ===================
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(loadStudent);
  const [studentKey, setStudentKeyState] = useState<string | null>(loadStudentKey);
  const studentRef = useRef(currentStudent);
  const keyRef = useRef(studentKey);
  studentRef.current = currentStudent;
  keyRef.current = studentKey;

  const setCurrentStudent = useCallback((s: Student | null) => {
    studentRef.current = s;
    saveStudent(s);
    setCurrentStudentState(s);
  }, []);

  const setStudentKey = useCallback((k: string | null) => {
    keyRef.current = k;
    saveStudentKey(k);
    setStudentKeyState(k);
  }, []);

  const scope = currentStudent?.id ?? GUEST_SCOPE;

  // التقدّم مع نطاقه في حالة واحدة حتى لا يُكتب تقدّم طالب في سجل طالب آخر عند التبديل
  const [progressState, setProgressState] = useState<{ scope: string; progress: Progress }>(() => ({ scope, progress: loadProgress(scope) }));
  const progressStateRef = useRef(progressState);
  progressStateRef.current = progressState;
  const progress = progressState.scope === scope ? progressState.progress : emptyProgress();

  useEffect(() => {
    if (progressState.scope !== scope) setProgressState({ scope, progress: loadProgress(scope) });
  }, [scope, progressState.scope]);

  useEffect(() => {
    saveProgress(progressState.scope, progressState.progress);
  }, [progressState]);

  const updateProgress = useCallback((fn: (p: Progress) => Progress) => {
    setProgressState(prev => ({ scope: prev.scope, progress: fn(prev.progress) }));
  }, []);

  const totals = labTotals(progress.tasks);

  // =================== الجلسة والإشعارات ===================
  const [session, setSession] = useState<LabSession | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(() => (currentStudent?.isLocal ? 'local' : 'saved'));
  const [notice, setNotice] = useState<Notice | null>(null);

  const fetchSessionData = useCallback(async () => {
    try {
      const res = await fetch('/api/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setServerReachable(true);
        return;
      }
      setServerReachable(false);
    } catch {
      setServerReachable(false);
    }
    setSession(prev => prev || DEFAULT_SESSION);
  }, []);

  usePolling(fetchSessionData, SESSION_POLL_MS);

  // =================== المزامنة مع الخادم ===================

  const handleStudentRemoved = useCallback(() => {
    const s = studentRef.current;
    if (s) clearQueue(s.id);
    setCurrentStudent(null);
    setStudentKey(null);
    setSyncState('saved');
    setNotice({ tone: 'error', text: 'لم يعد سجلك موجوداً لدى المعلمة. سجّل هويتك من جديد لمتابعة إرسال النقاط.' });
  }, [setCurrentStudent, setStudentKey]);

  /** يطبّق نسخة الخادم من سجل الطالب: الحالة والنقاط والتصفير. */
  const applyServer = useCallback((server: Student) => {
    const prev = studentRef.current;
    if (!prev || prev.id !== server.id) return; // ردّ قديم لطالب آخر
    const next: Student = { ...prev, ...server, isLocal: false };
    if (prev.status !== server.status) {
      if (server.status === 'approved') {
        sounds.victory();
        confetti({ particleCount: 80, spread: 75 });
        setNotice({ tone: 'success', text: `🎉 اعتمدتك المعلمة يا ${server.fullName.split(' ')[0]}! نقاطك تُحتسب الآن في لوحة الشرف.` });
      } else if (server.status === 'rejected') {
        setNotice({ tone: 'error', text: `لم تعتمد المعلمة طلبك: ${server.rejectionReason || 'يرجى مراجعة المعلمة'}.` });
      }
    }
    setCurrentStudent(next);
    const current = progressStateRef.current;
    const reset = current.scope === server.id && applyServerStudent(current.progress, server).wasReset;
    setProgressState(ps => (ps.scope !== server.id ? ps : { scope: ps.scope, progress: applyServerStudent(ps.progress, server).progress }));
    if (reset) setNotice({ tone: 'info', text: 'صفّرت المعلمة النقاط لبدء جولة جديدة. بالتوفيق!' });
  }, [setCurrentStudent]);

  const syncNow = useCallback(async () => {
    const s = studentRef.current;
    if (!s || s.isLocal) return;
    if (loadQueue(s.id).length === 0) {
      setSyncState(s.status === 'approved' ? 'saved' : 'waiting_approval');
      return;
    }
    setSyncState('pending');
    const result = await flushQueue(s.id, keyRef.current);
    if (studentRef.current?.id !== s.id) return;
    if (result.removed) {
      handleStudentRemoved();
      return;
    }
    if (result.student) applyServer(result.student);
    if (result.message) setNotice({ tone: 'error', text: result.message });
    setSyncState(result.state);
  }, [applyServer, handleStudentRemoved]);

  const pollStatus = useCallback(async () => {
    const s = studentRef.current;
    if (!s || s.isLocal) return;
    try {
      const res = await fetch(`/api/student/status/${encodeURIComponent(s.id)}`);
      if (studentRef.current?.id !== s.id) return;
      if (res.status === 404) {
        handleStudentRemoved();
        return;
      }
      if (!res.ok) {
        setServerReachable(false);
        return;
      }
      const data = await res.json();
      setServerReachable(true);
      applyServer(data.student);
      if (typeof data.announcement === 'string') {
        setSession(prev => ({ ...(prev || DEFAULT_SESSION), isOpen: data.sessionIsOpen, announcement: data.announcement, elementsUnlocked: Boolean(data.elementsUnlocked) }));
      }
      if (data.student.status === 'approved' && loadQueue(s.id).length > 0) await syncNow();
      else if (loadQueue(s.id).length > 0) setSyncState('waiting_approval');
      else setSyncState(data.student.status === 'approved' ? 'saved' : 'waiting_approval');
    } catch {
      if (studentRef.current?.id === s.id) {
        setServerReachable(false);
        if (loadQueue(s.id).length > 0) setSyncState('offline');
      }
    }
  }, [applyServer, handleStudentRemoved, syncNow]);

  usePolling(pollStatus, STATUS_POLL_MS, Boolean(currentStudent && !currentStudent.isLocal));

  // =================== سياق المختبر: النقاط والدفتر ===================

  const tasksRef = useRef(progress.tasks);
  tasksRef.current = progress.tasks;

  const award = useCallback((taskId: string, points: number) => {
    if (!isTaskId(taskId) || tasksRef.current[taskId] !== undefined) return 0;
    const pts = Math.max(0, Math.min(TASK_POINTS[taskId], Math.floor(points)));
    tasksRef.current = { ...tasksRef.current, [taskId]: pts };
    updateProgress(p => (p.tasks[taskId] !== undefined ? p : { ...p, tasks: { ...p.tasks, [taskId]: pts } }));
    const s = studentRef.current;
    if (s && !s.isLocal) {
      enqueueTask(s.id, taskId, pts, progressStateRef.current.progress.epoch);
      void syncNow();
    }
    return pts;
  }, [updateProgress, syncNow]);

  const note = useCallback((lab: string, kind: NoteKind, line: string) => {
    updateProgress(p => {
      const page = p.notebook[lab] || { p: '', o: '', c: '' };
      if (page[kind].includes(line)) return p;
      return { ...p, notebook: { ...p.notebook, [lab]: { ...page, [kind]: `${page[kind]}\n• ${line}`.trim() } } };
    });
  }, [updateProgress]);

  const conclude = useCallback((lab: string, tag: string, sum: string) => {
    updateProgress(p => ({ ...p, conclusions: { ...p.conclusions, [lab]: { ...(p.conclusions[lab] || {}), [tag]: sum } } }));
  }, [updateProgress]);

  // =================== حفظ دفتر الباحث على الخادم ===================
  // يُرسل بعد ثوانٍ من آخر تعديل، ويعود الدفتر المدمج من كل الأجهزة.
  const journalSent = useRef<string | null>(null);
  const pushJournal = useCallback(async () => {
    const s = studentRef.current;
    const key = keyRef.current;
    const ps = progressStateRef.current;
    if (!s || s.isLocal || !key || ps.scope !== s.id) return;
    const sig = JSON.stringify([ps.progress.notebook, ps.progress.conclusions]);
    if (sig === journalSent.current) return;
    try {
      const res = await fetch('/api/student/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: s.id, studentKey: key, notebook: ps.progress.notebook, conclusions: ps.progress.conclusions }),
      });
      if (!res.ok || studentRef.current?.id !== s.id) return;
      const data = await res.json().catch(() => null) as { journal?: Student['journal'] } | null;
      journalSent.current = sig;
      if (data?.journal) {
        setProgressState(cur => {
          if (cur.scope !== s.id) return cur;
          const merged = mergeJournal(cur.progress, data.journal);
          const mergedSig = JSON.stringify([merged.notebook, merged.conclusions]);
          if (mergedSig === JSON.stringify([cur.progress.notebook, cur.progress.conclusions])) return cur;
          saveProgress(s.id, merged);
          return { scope: cur.scope, progress: merged };
        });
      }
    } catch {
      // دون اتصال: نعيد المحاولة مع التعديل التالي أو الاستعلام الدوري
    }
  }, []);
  const journalSig = useMemo(() => JSON.stringify([progress.notebook, progress.conclusions]), [progress.notebook, progress.conclusions]);
  useEffect(() => {
    const id = setTimeout(() => void pushJournal(), 2500);
    return () => clearTimeout(id);
  }, [journalSig, currentStudent?.id, studentKey, serverReachable, pushJournal]);

  const labRuntime: LabRuntime = useMemo(() => ({ tasks: progress.tasks, award, note, conclude }), [progress.tasks, award, note, conclude]);

  // كل المختبرات مفتوحة دائماً: التنقّل حرّ دون تسلسل إجباري بين الذرة والعناصر.

  // =================== التسجيل وتبديل الطالب ===================

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  const handleRegistered = (student: Student, key: string | null) => {
    const prev = studentRef.current;
    const prevScope = prev?.id ?? GUEST_SCOPE;
    // ننقل تقدّم الزائر أو وضع التدريب إلى الهوية الجديدة، ولا ننقل بين طالبين مسجّلين
    const carryOver = !prev || prev.isLocal || prev.id === student.id;
    let nextProgress = loadProgress(student.id);
    if (carryOver && prevScope !== student.id) {
      const prevProgress = progressState.scope === prevScope ? progressState.progress : loadProgress(prevScope);
      nextProgress = mergeProgress(nextProgress, prevProgress);
      removeProgress(prevScope);
    }
    nextProgress = { ...nextProgress, epoch: Math.max(nextProgress.epoch, Number(student.scoreEpoch) || 0) };

    // الدفتر المحفوظ على الخادم (من جهاز آخر) يُدمج هنا ولا يُخزَّن مع الهوية
    const { journal, ...studentInfo } = student;
    nextProgress = mergeJournal(nextProgress, journal);
    student = studentInfo;

    if (prev && prev.id !== student.id) clearQueue(prev.id);
    setCurrentStudent(student);
    setStudentKey(student.isLocal ? null : key);
    saveProgress(student.id, nextProgress);
    setProgressState({ scope: student.id, progress: nextProgress });

    if (student.isLocal) {
      setSyncState('local');
      setIsRegisterOpen(false);
      setNotice({ tone: 'info', text: 'بدأت وضع التدريب دون اتصال. نتائجك محفوظة على هذا الجهاز فقط.' });
      return;
    }

    // نضع التقدّم المنقول في الطابور؛ لن يقبله الخادم إلا بعد اعتماد المعلمة
    if (carryOver) {
      for (const [t, pts] of Object.entries(nextProgress.tasks)) enqueueTask(student.id, t, pts, nextProgress.epoch);
    }
    setSyncState(student.status === 'approved' ? 'pending' : 'waiting_approval');
    if (student.status === 'approved') {
      setIsRegisterOpen(false);
      setIsIdCardOpen(true);
      void syncNow();
    }
  };

  const handleSwitchStudent = () => {
    if (!confirm('هل تريد تسجيل الخروج من هذا الجهاز؟ سيبقى تقدّمك محفوظاً ويعود عند الدخول باسمك ورقمك السري.')) return;
    setCurrentStudent(null);
    setStudentKey(null);
    setSyncState('saved');
    setIsIdCardOpen(false);
    setIsRegisterOpen(true);
  };

  const openIdOrRegister = () => {
    if (currentStudent && !currentStudent.isLocal && currentStudent.status === 'approved') setIsIdCardOpen(true);
    else setIsRegisterOpen(true);
  };

  // =================== الصوت ===================
  const [soundOn, setSoundOn] = useState(() => sounds.isEnabled());
  const toggleSound = () => setSoundOn(sounds.setEnabled(!sounds.isEnabled()));

  // =================== قيم العرض ===================

  const displayStudent: Student | null = currentStudent
    ? { ...currentStudent, totalPoints: totals.total, labPoints: { at: totals.at, ca: totals.ca, su: totals.su, si: totals.si } }
    : null;

  const atomAttempted = Object.keys(progress.tasks).filter(t => t.startsWith('at.')).length;
  const elDone = elementStationsDone(progress.tasks);

  const isSectionView = currentView === 'lab_selection' || currentView === 'questions' || currentView === 'review';

  const notebookLab: LabId = route.view === 'element_lab' && route.lab ? route.lab : 'at';

  const navProps = {
    currentStudent: displayStudent,
    session,
    currentView,
    syncState: currentStudent ? syncState : null,
    soundOn,
    onToggleSound: toggleSound,
    onNavigateHome: () => { sounds.click(); go.reception(); },
    onNavigateSelection: () => { sounds.click(); go.labs(); },
    onNavigateQuestions: () => { sounds.click(); go.questions(); },
    onNavigateReview: () => { sounds.click(); go.review(); },
    onNavigateAtom: () => { sounds.click(); go.atom(); },
    onNavigateElements: () => { sounds.click(); go.elements(); },
    onOpenNotebook: () => setIsNotebookOpen(true),
    onOpenIdCard: openIdOrRegister,
    onOpenRegister: () => setIsRegisterOpen(true),
    onOpenLeaderboard: () => setIsLeaderboardOpen(true),
    onOpenTeacher: () => setIsTeacherOpen(true),
    onOpenShare: () => setIsShareOpen(true),
  };

  const certificateStudent: Student = displayStudent || {
    id: 'GUEST', fullName: 'صقر الكيمياء المتألق', chemicalId: '—', createdAt: Date.now(), status: 'approved',
    falconTitle: 'صقر كيميائي - باحث مختبر', affiliation: 'صقور أ. شهد في منصة سنابل', totalPoints: totals.total, lastActive: Date.now(),
  };

  return (
    <LabContext.Provider value={labRuntime}>
    <div className="min-h-[100svh] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 relative overflow-x-clip font-sans">

      {currentView === 'reception' && (
        <ReceptionScreen onEnterLab={() => { sounds.click(); go.labs(); }} />
      )}

      {isSectionView && (
        <div className="navy-shell relative flex-1 flex flex-col">
          <ChemBackdrop />
          <Navbar {...navProps} />
          <MobileTabBar {...navProps} />
          <main id="main" className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-28 md:py-8">
            {currentView === 'lab_selection' && <SectionsScreen onQuestions={go.questions} onReview={go.review} />}
            {currentView === 'questions' && <QuestionsSection onSections={go.labs} onReview={go.review} />}
            {currentView === 'review' && (
              <ReviewSection
                atomProgress={`${atomAttempted} / ${ATOM_TASK_COUNT} نشاطًا · ${totals.at} نقطة`}
                elementsProgress={`${elDone} / ${ELEMENT_STATION_COUNT} مهمة · ${totals.ca + totals.su + totals.si} نقطة`}
                onAtom={go.atom}
                onElements={go.elements}
                onSections={go.labs}
                onQuestions={go.questions}
              />
            )}
          </main>
        </div>
      )}

      {currentView !== 'reception' && !isSectionView && (
        <>
          <AtelierBackdrop />
          <Navbar {...navProps} />
          <MobileTabBar {...navProps} />

          <main id="main" className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-28 md:py-8 space-y-6">

            {currentStudent?.isLocal && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border hairline bg-slate-900/50 px-4 py-3 text-[13px] text-slate-300" role="status">
                <span className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                  وضع التدريب دون اتصال: نتائجك محفوظة على هذا الجهاز فقط ولم تصل للمعلمة.
                </span>
                {serverReachable && (
                  <button type="button" onClick={() => setIsRegisterOpen(true)} className="h-8 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                    الخادم متاح الآن — سجّل لإرسال طلبك
                  </button>
                )}
              </div>
            )}

            {session?.announcement && (currentView === 'atom_hub' || currentView === 'elements_hub') && (
              <aside className="flex items-start gap-4 border-s-2 border-amber-400 ps-4 py-1 animate-in" aria-label="توجيه المعلمة">
                <p className="text-[15px] leading-relaxed text-slate-300">
                  <span className="font-display text-amber-300 me-2">توجيه أ. شهد</span>
                  {session.announcement}
                </p>
              </aside>
            )}

            <LazyBoundary>
              <Suspense fallback={<LoadingPanel />}>
                {currentView === 'atom_hub' && <AtomHub tasks={progress.tasks} points={totals.at} onOpenGate={g => go.gate(g)} />}
                {currentView === 'atom_gate' && route.gate != null && (
                  <AtomGatePage key={route.gate} gateIndex={route.gate} onBack={() => go.atom()} onToast={m => setNotice({ tone: 'info', text: m })} />
                )}
                {currentView === 'elements_hub' && (
                  <ElementsHub tasks={progress.tasks} unlocked onOpenLab={id => go.lab(id)} onBackToAtom={() => go.atom()} onFinale={() => go.finale()} />
                )}
                {currentView === 'element_lab' && route.lab && (
                  <ElementLabPage key={route.lab} labId={route.lab} conclusions={progress.conclusions[route.lab] || {}} onBack={() => go.elements()} onFinale={() => go.finale()} />
                )}
                {currentView === 'finale' && <Finale tasks={progress.tasks} onBack={() => go.labs()} onCertificate={() => setIsCertOpen(true)} />}
              </Suspense>
            </LazyBoundary>
          </main>
        </>
      )}

      {/* --- النوافذ المنبثقة (تُحمَّل عند فتحها فقط) --- */}
      <LazyBoundary>
        <Suspense fallback={null}>
          {isCertOpen && <CertificateModal student={certificateStudent} onClose={() => setIsCertOpen(false)} />}
          {isNotebookOpen && (
            <NotebookModal
              notebook={progress.notebook}
              initialLab={notebookLab}
              studentName={currentStudent?.fullName || 'باحث الكيمياء'}
              onChange={(lab, page: NotebookPage) => updateProgress(p => ({ ...p, notebook: { ...p.notebook, [lab]: page } }))}
              onClose={() => setIsNotebookOpen(false)}
            />
          )}
          {isLeaderboardOpen && <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} currentStudentId={currentStudent?.id} />}
          {isTeacherOpen && <TeacherDashboard onClose={() => setIsTeacherOpen(false)} onRefreshData={fetchSessionData} />}
          {isShareOpen && <ShareLabModal onClose={() => setIsShareOpen(false)} />}
        </Suspense>
      </LazyBoundary>

      {isRegisterOpen && (
        <StudentRegisterModal
          key={`${currentStudent?.id ?? 'new'}:${currentStudent?.status ?? ''}`}
          currentStudent={currentStudent}
          onClose={() => setIsRegisterOpen(false)}
          onRegistered={handleRegistered}
          onSwitchStudent={currentStudent ? handleSwitchStudent : undefined}
        />
      )}

      {isIdCardOpen && displayStudent && (
        <ChemicalIdCard
          onClose={() => setIsIdCardOpen(false)}
          student={displayStudent}
          onSwitchStudent={handleSwitchStudent}
          onOpenCertificate={() => {
            setIsIdCardOpen(false);
            setIsCertOpen(true);
          }}
        />
      )}

      <NoticeToast notice={notice} onDismiss={() => setNotice(null)} />
    </div>
    </LabContext.Provider>
  );
}
