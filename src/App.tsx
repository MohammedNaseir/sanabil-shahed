/**
 * مختبر الأسئلة | صقور أ. شهد في منصة سنابل
 * تطبيق تعليمي تفاعلي متكامل مبني وفق منهاج الكيمياء للصف العاشر - دولة فلسطين
 * المختبر الأساسي: درس عنصر السيليكون ومركباته (المحطات الست)
 * المختبر المرافق: بنية الذرة والنماذج الذرية (الوجهات الست)
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, FlaskConical, WifiOff } from 'lucide-react';
import confetti from './utils/confetti';

// المكوّنات الأساسية التي تظهر فوراً
import { Navbar, MobileTabBar } from './components/Navbar';
import { ChemicalIdCard } from './components/ChemicalIdCard';
import { StudentRegisterModal } from './components/StudentRegisterModal';
import { AtelierBackdrop } from './components/home/AtelierBackdrop';
import { ReceptionScreen } from './components/home/ReceptionScreen';
import { LabSelectionScreen } from './components/home/LabSelectionScreen';
import { LazyBoundary, LoadingPanel } from './components/LazyBoundary';
import { NoticeToast, type Notice } from './components/NoticeToast';

import { Student, LabSession, DeductionRecord } from './types';
import { sounds } from './utils/audio';
import { DraftContext, clearAllDrafts, clearDraft } from './utils/draft';
import { ATOMIC_DESTINATIONS, type AtomicDestination, type Route, HOME_ROUTE, formatHash, parseHash, sameRoute } from './utils/routing';
import { usePolling } from './utils/usePolling';
import { SILICON_MAX_SCORE, isAtomicTaskId, isSiliconGameId, sumAtomicPoints } from './data/atomicTasks';
import {
  GUEST_SCOPE, type Progress, applyServerStudent, emptyProgress, loadProgress, loadStudent, loadStudentKey,
  mergeProgress, removeProgress, saveProgress, saveStudent, saveStudentKey,
} from './utils/studentStore';
import { type SyncState, clearQueue, enqueueAtomic, enqueueSilicon, flushQueue, loadQueue } from './utils/scoreQueue';

// تحميل كسول: كل لعبة/وجهة/نافذة كبيرة تُحمَّل فقط عند فتحها
const SiliconLabHub = lazy(() => import('./components/SiliconLabHub').then(m => ({ default: m.SiliconLabHub })));
const GameFalcon = lazy(() => import('./components/games/GameFalcon').then(m => ({ default: m.GameFalcon })));
const GameCipher = lazy(() => import('./components/games/GameCipher').then(m => ({ default: m.GameCipher })));
const GameFlasks = lazy(() => import('./components/games/GameFlasks').then(m => ({ default: m.GameFlasks })));
const GameFurnace = lazy(() => import('./components/games/GameFurnace').then(m => ({ default: m.GameFurnace })));
const GameDetective = lazy(() => import('./components/games/GameDetective').then(m => ({ default: m.GameDetective })));
const GameRescue = lazy(() => import('./components/games/GameRescue').then(m => ({ default: m.GameRescue })));
const DualLabGateway = lazy(() => import('./components/atomic/DualLabGateway').then(m => ({ default: m.DualLabGateway })));
const AtomicLabHub = lazy(() => import('./components/atomic/AtomicLabHub').then(m => ({ default: m.AtomicLabHub })));
const TimeTravelStation = lazy(() => import('./components/atomic/destinations/TimeTravelStation').then(m => ({ default: m.TimeTravelStation })));
const InferConcludeLab = lazy(() => import('./components/atomic/destinations/InferConcludeLab').then(m => ({ default: m.InferConcludeLab })));
const ExplainLab = lazy(() => import('./components/atomic/destinations/ExplainLab').then(m => ({ default: m.ExplainLab })));
const ErrorDetectiveLab = lazy(() => import('./components/atomic/destinations/ErrorDetectiveLab').then(m => ({ default: m.ErrorDetectiveLab })));
const WhatIfLab = lazy(() => import('./components/atomic/destinations/WhatIfLab').then(m => ({ default: m.WhatIfLab })));
const FinalChallengeLab = lazy(() => import('./components/atomic/destinations/FinalChallengeLab').then(m => ({ default: m.FinalChallengeLab })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const LeaderboardModal = lazy(() => import('./components/LeaderboardModal').then(m => ({ default: m.LeaderboardModal })));
const ShareLabModal = lazy(() => import('./components/ShareLabModal').then(m => ({ default: m.ShareLabModal })));
const ChemistryCertificateModal = lazy(() => import('./components/ChemistryCertificateModal').then(m => ({ default: m.ChemistryCertificateModal })));
const AtomicCertificateModal = lazy(() => import('./components/atomic/AtomicCertificateModal').then(m => ({ default: m.AtomicCertificateModal })));
const ResearcherNotebook = lazy(() => import('./components/atomic/ResearcherNotebook').then(m => ({ default: m.ResearcherNotebook })));

const SILICON_GAMES = { falcon: GameFalcon, cipher: GameCipher, flasks: GameFlasks, furnace: GameFurnace, detective: GameDetective, rescue: GameRescue } as const;

const DEFAULT_SESSION: LabSession = {
  isOpen: true,
  announcement: 'مرحباً بكم يا صقور الكيمياء في مختبر أ. شهد — انطلقوا في محطات السيليكون الست لاقتناص الإجابات ونيل وسام التميز!',
  lessonName: 'السيليكون ومركباته — الكيمياء الصف العاشر',
  teacherName: 'أ. شهد',
  organization: 'منصة سنابل التعليمية',
};

const STATUS_POLL_MS = 7000;
const SESSION_POLL_MS = 30000;

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function celebrate() {
  confetti({ disableForReducedMotion: true, particleCount: 90, spread: 75, origin: { y: 0.6 } });
}

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

  const go = {
    reception: () => navigate(HOME_ROUTE),
    labs: () => navigate({ view: 'lab_selection', station: null, destination: null }),
    silicon: (opts?: { replace?: boolean }) => navigate({ view: 'silicon_hub', station: null, destination: null }, opts),
    game: (station: string) => navigate({ view: 'silicon_game', station, destination: null }),
    atomic: (opts?: { replace?: boolean }) => navigate({ view: 'atomic_hub', station: null, destination: null }, opts),
    destination: (d: AtomicDestination) => navigate({ view: 'destination', station: null, destination: d }),
    gateway: () => navigate({ view: 'gateway', station: null, destination: null }),
  };

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

  // نحفظ التقدّم مع نطاقه في حالة واحدة حتى لا يُكتب تقدّم طالب في سجل طالب آخر عند التبديل
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

  const siliconPoints = Object.values(progress.siliconScores).reduce((a, b) => a + b, 0);
  const atomicPoints = sumAtomicPoints(progress.solvedTasks);
  const totalPoints = siliconPoints + atomicPoints;

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
        celebrate();
        setNotice({ tone: 'success', text: `🎉 اعتمدتك المعلمة يا ${server.fullName.split(' ')[0]}! نقاطك تُحتسب الآن في لوحة الشرف.` });
      } else if (server.status === 'rejected') {
        setNotice({ tone: 'error', text: `لم تعتمد المعلمة طلبك: ${server.rejectionReason || 'يرجى مراجعة المعلمة'}.` });
      }
    }
    setCurrentStudent(next);
    const current = progressStateRef.current;
    const reset = current.scope === server.id && applyServerStudent(current.progress, server).wasReset;
    setProgressState(ps => (ps.scope !== server.id ? ps : { scope: ps.scope, progress: applyServerStudent(ps.progress, server).progress }));
    if (reset) {
      clearAllDrafts(server.id);
      setNotice({ tone: 'info', text: 'صفّرت المعلمة النقاط لبدء جولة جديدة. بالتوفيق!' });
    }
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
        setSession(prev => (prev ? { ...prev, isOpen: data.sessionIsOpen, announcement: data.announcement } : prev));
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

  // =================== النتائج ===================

  const handleFinishSiliconGame = (gameId: string, rawScore: number) => {
    if (!isSiliconGameId(gameId)) return;
    const score = Math.max(0, Math.min(SILICON_MAX_SCORE, Math.floor(Number(rawScore) || 0)));
    const best = Math.max(progress.siliconScores[gameId] || 0, score);
    updateProgress(p => ({
      ...p,
      siliconScores: { ...p.siliconScores, [gameId]: Math.max(p.siliconScores[gameId] || 0, score) },
      completedGames: p.completedGames.includes(gameId) ? p.completedGames : [...p.completedGames, gameId],
    }));
    clearDraft(scope, gameId);

    const s = studentRef.current;
    if (s && !s.isLocal) {
      enqueueSilicon(s.id, gameId, best, progress.epoch);
      void syncNow();
    }
    go.silicon({ replace: true });
  };

  const handleAwardAtomicPoints = (_points: number, taskId: string) => {
    if (progress.solvedTasks.includes(taskId)) return;
    updateProgress(p => (p.solvedTasks.includes(taskId) ? p : { ...p, solvedTasks: [...p.solvedTasks, taskId] }));
    const s = studentRef.current;
    if (s && !s.isLocal && isAtomicTaskId(taskId)) {
      enqueueAtomic(s.id, taskId, progress.epoch);
      void syncNow();
    }
  };

  const handleRecordDeduction = (title: string, text: string) => {
    const newDeduction: DeductionRecord = {
      id: `ded_${Date.now()}`,
      title,
      text,
      date: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    };
    updateProgress(p => ({ ...p, deductions: [newDeduction, ...p.deductions] }));
  };

  // =================== التسجيل وتبديل الطالب ===================

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);
  const [isSiliconCertOpen, setIsSiliconCertOpen] = useState(false);
  const [isAtomicCertOpen, setIsAtomicCertOpen] = useState(false);
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
      for (const [g, v] of Object.entries(nextProgress.siliconScores)) enqueueSilicon(student.id, g, v, nextProgress.epoch);
      for (const t of nextProgress.solvedTasks) if (isAtomicTaskId(t)) enqueueAtomic(student.id, t, nextProgress.epoch);
    }
    setSyncState(student.status === 'approved' ? 'pending' : 'waiting_approval');
    if (student.status === 'approved') {
      setIsRegisterOpen(false);
      setIsIdCardOpen(true);
      void syncNow();
    }
    // إن كان الطلب قيد الانتظار تبقى النافذة مفتوحة وتعرض حالة الانتظار
  };

  const handleSwitchStudent = () => {
    if (!confirm('هل تريد تسجيل الخروج من هذا الجهاز؟ سيبقى تقدّمك محفوظاً ويعود عند تسجيل الدخول بالهوية نفسها.')) return;
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

  // =================== إعادة تشغيل لعبة ===================
  const [gameInstance, setGameInstance] = useState(0);
  const draftContext = useMemo(() => ({
    scope,
    restart: (gameId: string) => {
      clearDraft(scope, gameId);
      setGameInstance(n => n + 1);
    },
  }), [scope]);

  // =================== قيم العرض ===================

  const completedSections = [
    progress.solvedTasks.some(t => t.startsWith('quiz_') || t.includes('timeline') || t.startsWith('match_')) ? 'timeline' : '',
    progress.solvedTasks.some(t => t.startsWith('deduction_') || t.includes('method')) ? 'infer' : '',
    progress.solvedTasks.some(t => t.startsWith('explain_')) ? 'explain' : '',
    progress.solvedTasks.some(t => t.startsWith('error_')) ? 'errors' : '',
    progress.solvedTasks.some(t => t.startsWith('whatif_')) ? 'whatif' : '',
    progress.solvedTasks.some(t => t.startsWith('final_')) ? 'final_challenge' : '',
  ].filter(Boolean);

  const displayStudent: Student | null = currentStudent
    ? { ...currentStudent, scores: progress.siliconScores, completedGames: progress.completedGames, siliconPoints, atomicPoints, totalPoints }
    : null;

  // شهادة السيليكون تُحسب من نقاط السيليكون فقط (من أصل 52)
  const certificateStudent: Student = {
    ...(displayStudent || {
      id: 'GUEST-FALCON',
      fullName: 'صقر الكيمياء المتألق',
      chemicalId: 'Si-14-SNBL',
      createdAt: Date.now(),
      status: 'approved' as const,
      falconTitle: 'صقر كيميائي - باحث مختبر',
      affiliation: 'صقور أ. شهد في منصة سنابل',
      lastActive: Date.now(),
    }),
    scores: progress.siliconScores,
    completedGames: progress.completedGames,
    totalPoints: siliconPoints,
  };

  const backToSiliconHub = () => {
    sounds.click();
    go.silicon();
  };
  const backToAtomicHub = () => go.atomic();

  const ActiveGame = route.station && isSiliconGameId(route.station) ? SILICON_GAMES[route.station] : null;

  const destinationProps = {
    onBack: backToAtomicHub,
    onAwardPoints: handleAwardAtomicPoints,
    onRecordDeduction: handleRecordDeduction,
    solvedQuizzes: progress.solvedTasks,
  };

  return (
    <DraftContext.Provider value={draftContext}>
    <div className="min-h-[100svh] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden font-sans">

      {currentView === 'reception' && (
        <ReceptionScreen
          onEnterLab={() => {
            sounds.click();
            go.labs();
          }}
        />
      )}

      {currentView === 'lab_selection' && (
        <LabSelectionScreen
          onSelectSiliconLab={() => {
            sounds.click();
            go.silicon();
          }}
          onSelectAtomicLab={() => {
            sounds.click();
            go.atomic();
          }}
          onBackToReception={() => {
            sounds.click();
            go.reception();
          }}
          studentPoints={totalPoints}
          studentName={currentStudent?.fullName}
          chemicalId={currentStudent?.chemicalId}
        />
      )}

      {currentView !== 'reception' && currentView !== 'lab_selection' && (
        <>
          <AtelierBackdrop />

          <Navbar
            currentStudent={displayStudent}
            session={session}
            currentView={currentView}
            syncState={currentStudent ? syncState : null}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            onNavigateHome={() => { sounds.click(); go.reception(); }}
            onNavigateSelection={() => { sounds.click(); go.labs(); }}
            onNavigateSiliconHub={() => { sounds.click(); go.silicon(); }}
            onNavigateAtomicHub={() => { sounds.click(); go.atomic(); }}
            onOpenNotebook={() => setIsNotebookOpen(true)}
            onOpenIdCard={openIdOrRegister}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenTeacher={() => setIsTeacherOpen(true)}
            onOpenShare={() => setIsShareOpen(true)}
          />
          <MobileTabBar
            currentStudent={displayStudent}
            session={session}
            currentView={currentView}
            syncState={currentStudent ? syncState : null}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            onNavigateHome={() => { sounds.click(); go.reception(); }}
            onNavigateSelection={() => { sounds.click(); go.labs(); }}
            onNavigateSiliconHub={() => { sounds.click(); go.silicon(); }}
            onNavigateAtomicHub={() => { sounds.click(); go.atomic(); }}
            onOpenNotebook={() => setIsNotebookOpen(true)}
            onOpenIdCard={openIdOrRegister}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenTeacher={() => setIsTeacherOpen(true)}
            onOpenShare={() => setIsShareOpen(true)}
          />

          <main id="main" className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-28 md:py-8 space-y-6">

            {currentStudent?.isLocal && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border hairline bg-slate-900/50 px-4 py-3 text-[13px] text-slate-300" role="status">
                <span className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                  وضع التدريب دون اتصال: نتائجك محفوظة على هذا الجهاز فقط ولم تصل للمعلمة.
                </span>
                {serverReachable && (
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(true)}
                    className="h-8 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    الخادم متاح الآن — سجّل لإرسال طلبك
                  </button>
                )}
              </div>
            )}

            {session?.announcement && (
              <aside className="flex items-start gap-4 border-s-2 border-amber-400 ps-4 py-1 animate-in" aria-label="توجيه المعلمة">
                <p className="text-[15px] leading-relaxed text-slate-300">
                  <span className="font-display text-amber-300 ms-0 me-2">توجيه أ. شهد</span>
                  {session.announcement}
                </p>
              </aside>
            )}

            <LazyBoundary>
              <Suspense fallback={<LoadingPanel />}>

                {currentView === 'silicon_hub' && (
                  <SiliconLabHub
                    currentStudent={displayStudent}
                    totalPoints={siliconPoints}
                    completedGames={progress.completedGames}
                    scores={progress.siliconScores}
                    onSelectStation={(stationId) => go.game(stationId)}
                    onOpenIdCard={openIdOrRegister}
                    onOpenRegister={() => setIsRegisterOpen(true)}
                    onOpenCertificate={() => setIsSiliconCertOpen(true)}
                    onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
                    onSwitchToAtomicLab={() => go.atomic()}
                  />
                )}

                {currentView === 'silicon_game' && ActiveGame && route.station && (
                  <div className="w-full space-y-4">
                    <nav aria-label="مسار التنقل" className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={backToSiliconHub}
                        className="inline-flex items-center gap-2 h-9 ps-3 pe-4 rounded-full border hairline text-sm text-slate-300 hover:text-amber-300 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        <span>المحطات</span>
                      </button>
                      <span className="text-[13px] text-slate-500 truncate">
                        مختبر السيليكون <span className="text-amber-400/60 mx-1">/</span>
                        <span className="text-slate-300">{currentStudent?.fullName.split(' ')[0] || 'صقر الكيمياء'}</span>
                      </span>
                    </nav>
                    <ActiveGame
                      key={`${scope}:${route.station}:${gameInstance}`}
                      onFinish={(score: number) => handleFinishSiliconGame(route.station!, score)}
                      onExit={() => go.silicon()}
                    />
                  </div>
                )}

                {currentView === 'gateway' && (
                  <DualLabGateway
                    onEnterSiliconLab={() => go.silicon()}
                    onEnterAtomicLab={() => go.atomic()}
                    onOpenNotebook={() => setIsNotebookOpen(true)}
                    studentPoints={totalPoints}
                  />
                )}

                {currentView === 'atomic_hub' && (
                  <div className="space-y-4">
                    <nav aria-label="مسار التنقل" className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={backToSiliconHub}
                        className="inline-flex items-center gap-2 h-9 ps-3 pe-4 rounded-full border hairline text-sm text-slate-300 hover:text-amber-300 transition-colors"
                      >
                        <FlaskConical className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <span>مختبر السيليكون</span>
                      </button>
                      <span className="text-[13px] text-cyan-400">بنية الذرة والنماذج الذرية</span>
                    </nav>
                    <AtomicLabHub
                      onSelectDestination={(destId) => {
                        if ((ATOMIC_DESTINATIONS as readonly string[]).includes(destId)) go.destination(destId as AtomicDestination);
                      }}
                      onOpenNotebook={() => setIsNotebookOpen(true)}
                      onOpenCertificate={() => setIsAtomicCertOpen(true)}
                      onBackToGateway={() => go.silicon()}
                      totalPoints={atomicPoints}
                      completedTasks={completedSections}
                      studentName={currentStudent?.fullName || 'باحث الكيمياء'}
                    />
                  </div>
                )}

                {currentView === 'destination' && (
                  <div className="w-full" key={`${scope}:${route.destination}:${gameInstance}`}>
                    {route.destination === 'timeline' && <TimeTravelStation {...destinationProps} />}
                    {route.destination === 'infer' && <InferConcludeLab {...destinationProps} />}
                    {route.destination === 'explain' && <ExplainLab {...destinationProps} />}
                    {route.destination === 'error_detective' && <ErrorDetectiveLab {...destinationProps} />}
                    {route.destination === 'whatif' && <WhatIfLab {...destinationProps} />}
                    {route.destination === 'final_challenge' && (
                      <FinalChallengeLab
                        {...destinationProps}
                        onOpenCertificate={() => setIsAtomicCertOpen(true)}
                        totalScore={atomicPoints}
                      />
                    )}
                  </div>
                )}
              </Suspense>
            </LazyBoundary>
          </main>
        </>
      )}

      {/* --- النوافذ المنبثقة (تُحمَّل عند فتحها فقط) --- */}
      <LazyBoundary>
        <Suspense fallback={null}>
          {isSiliconCertOpen && (
            <ChemistryCertificateModal student={certificateStudent} onClose={() => setIsSiliconCertOpen(false)} />
          )}

          {isAtomicCertOpen && (
            <AtomicCertificateModal
              isOpen
              onClose={() => setIsAtomicCertOpen(false)}
              studentName={currentStudent?.fullName || 'باحث الذرة المتميز'}
              chemicalId={currentStudent?.chemicalId || 'FALCON-ATOM-2026'}
              score={atomicPoints}
            />
          )}

          {isNotebookOpen && (
            <ResearcherNotebook
              isOpen
              onClose={() => setIsNotebookOpen(false)}
              studentName={currentStudent?.fullName || 'باحث الكيمياء'}
              totalPoints={totalPoints}
              completedTasks={progress.completedGames}
              deductions={progress.deductions}
              storageScope={scope}
            />
          )}

          {isLeaderboardOpen && (
            <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} currentStudentId={currentStudent?.id} />
          )}

          {isTeacherOpen && (
            <TeacherDashboard onClose={() => setIsTeacherOpen(false)} onRefreshData={fetchSessionData} />
          )}

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
            setIsSiliconCertOpen(true);
          }}
        />
      )}

      <NoticeToast notice={notice} onDismiss={() => setNotice(null)} />
    </div>
    </DraftContext.Provider>
  );
}
