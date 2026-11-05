import React, { useState, useRef } from 'react';
import { usePolling } from '../utils/usePolling';
import { useDialog } from '../utils/useDialog';
import { 
  X, Lock, ShieldCheck, UserCheck, Users, Trophy, Settings, 
  CheckCircle, XCircle, RefreshCw, Power, AlertTriangle, Search,
  Award, FileSpreadsheet, Trash2, Share2, Download, KeyRound
} from 'lucide-react';
import { Student, LabSession } from '../types';
import { sounds } from '../utils/audio';
import { ChemistryCertificateModal } from './ChemistryCertificateModal';
import { ShareLabModal } from './ShareLabModal';

interface TeacherDashboardProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onClose, onRefreshData }) => {
  const { dialogProps, titleId } = useDialog(onClose);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('shhd_teacher_token');
    } catch {
      return null;
    }
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<'requests' | 'students' | 'leaderboard' | 'settings'>('requests');
  const [students, setStudents] = useState<Student[]>([]);
  const [session, setSession] = useState<LabSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  // لا نستبدل نص الإعلان أثناء كتابة المعلمة له
  const announcementDirtyRef = useRef(false);

  // Authenticate Teacher
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    sounds.click();

    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passcode.trim() })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || (res.status === 404 ? 'لوحة المعلمة تحتاج تشغيل خادم المختبر.' : 'رمز الدخول غير صحيح'));
      }

      sounds.correct();
      try {
        sessionStorage.setItem('shhd_teacher_token', data.token);
      } catch {
        // التخزين غير متاح: تبقى الجلسة في هذه النافذة فقط
      }
      setPasscode('');
      setToken(data.token);
    } catch (err: unknown) {
      sounds.wrong();
      const message = err instanceof TypeError
        ? 'تعذّر الاتصال بخادم المختبر.'
        : err instanceof Error ? err.message : 'تعذر تسجيل الدخول';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearToken = (message = '') => {
    try {
      sessionStorage.removeItem('shhd_teacher_token');
    } catch {
      // تجاهل
    }
    setToken(null);
    setStudents([]);
    if (message) setAuthError(message);
  };

  const handleLogout = () => {
    sounds.click();
    if (token) {
      fetch('/api/teacher/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    clearToken();
  };

  /** طلب محمي للمعلمة: يعالج انتهاء الجلسة والأخطاء ويحدّث اللوحة بعده. */
  const teacherAction = async (url: string, body?: unknown) => {
    if (!token) return false;
    setActionError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        clearToken('انتهت جلسة الدخول، يرجى تسجيل الدخول من جديد.');
        return false;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `تعذّر تنفيذ العملية (رمز ${res.status})`);
        return false;
      }
      await fetchDashboardData();
      return true;
    } catch {
      setActionError('تعذّر الاتصال بالخادم. تحقّقي من الشبكة وحاولي مجدداً.');
      return false;
    }
  };

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        clearToken('انتهت جلسة الدخول، يرجى تسجيل الدخول من جديد.');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data.students || []);
      setSession(data.session || null);
      if (typeof data.session?.announcement === 'string' && !announcementDirtyRef.current) {
        setAnnouncementText(data.session.announcement);
      }
    } catch (err) {
      console.error('Failed to fetch teacher data:', err);
    }
  };

  // تحديث مباشر كل 4 ثوانٍ، ويتوقف عند إخفاء الصفحة
  usePolling(fetchDashboardData, 4000, Boolean(token));

  // Actions
  const handleApprove = async (studentId: string) => {
    if (!token) return;
    sounds.click();
    await teacherAction('/api/teacher/approve', { studentId });
  };

  const handleApproveAll = async () => {
    if (!token) return;
    sounds.correct();
    await teacherAction('/api/teacher/approve-all');
  };

  const handleReject = async (studentId: string) => {
    if (!token) return;
    sounds.wrong();
    await teacherAction('/api/teacher/reject', { studentId });
  };

  // إعادة تعيين الرقم السري: يُولَّد رقم جديد يظهر للمعلمة مرة واحدة لتعطيه للطالب
  const [pinNotice, setPinNotice] = useState<{ name: string; pin: string } | null>(null);
  const handleResetPin = async (student: Student) => {
    if (!token || !confirm(`إعادة تعيين الرقم السري للطالب ${student.fullName}؟`)) return;
    setActionError('');
    try {
      const res = await fetch('/api/teacher/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: student.id }),
      });
      if (res.status === 401 || res.status === 403) {
        clearToken('انتهت جلسة الدخول، يرجى تسجيل الدخول من جديد.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || 'تعذّر إعادة تعيين الرقم السري');
        return;
      }
      setPinNotice({ name: student.fullName, pin: data.pin });
    } catch {
      setActionError('تعذّر الاتصال بالخادم.');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!token || !confirm('هل أنتِ متأكدة من حذف هذا الطالب من سجل المختبر؟')) return;
    sounds.wrong();
    await teacherAction('/api/teacher/delete-student', { studentId });
  };

  const handleToggleSession = async () => {
    if (!token || !session) return;
    sounds.click();
    setIsUpdatingSession(true);
    await teacherAction('/api/teacher/session', { isOpen: !session.isOpen });
    setIsUpdatingSession(false);
    onRefreshData?.();
  };

  const handleToggleElements = async () => {
    if (!token || !session) return;
    sounds.click();
    setIsUpdatingSession(true);
    await teacherAction('/api/teacher/session', { elementsUnlocked: !session.elementsUnlocked });
    setIsUpdatingSession(false);
    onRefreshData?.();
  };

  const handleSaveAnnouncement = async () => {
    if (!token) return;
    sounds.correct();
    setIsUpdatingSession(true);
    announcementDirtyRef.current = false;
    const ok = await teacherAction('/api/teacher/session', { announcement: announcementText });
    if (!ok) announcementDirtyRef.current = true;
    setIsUpdatingSession(false);
    onRefreshData?.();
  };

  const handleResetScores = async () => {
    if (!token || !confirm('هل تريدين تصفير نقاط جميع الطلاب لبدء منافسة جديدة؟')) return;
    sounds.wrong();
    await teacherAction('/api/teacher/reset-scores');
  };

  const pendingStudents = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status === 'approved');
  const onlineCount = approvedStudents.filter(s => s.isOnline).length;

  const filteredStudents = approvedStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-5xl h-[96svh] sm:h-[90vh] bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id={titleId} className="text-xl font-black text-white">لوحة تحكم المعلمة</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-extrabold border border-amber-500/30">
                  أ. شهد نصير
                </span>
              </div>
              <p className="text-xs text-slate-400">إدارة الجلسة والطلبة وترتيب الصقور في منصة سنابل</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/download/lab-html"
              download="مختبر_الأسئلة_صقور_أ_شهد.html"
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="تحميل ملف المختبر التفاعلي الكامل كملف HTML مستقل"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحميل ملف HTML للواتساب</span>
              <span className="sm:hidden">تحميل HTML</span>
            </a>
            <button
              onClick={() => {
                sounds.click();
                setIsShareModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="مشاركة الرابط للطلاب"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة الرابط</span>
            </button>
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                تسجيل الخروج
              </button>
            )}
            <button
              onClick={() => {
                sounds.click();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" /><span className="sr-only">إغلاق</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!token ? (
          /* Password Protection Form */
          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">منطقة محمية للمعلمة فقط</h4>
                <p className="text-xs text-slate-400 mt-1">
                  يرجى إدخال رمز الأمان الخاص بالمعلمة أ. شهد للوصول للوحة الإدارة.
                </p>
              </div>

              <div>
                <label htmlFor="teacher-passcode" className="sr-only">رمز الأمان الخاص بالمعلمة</label>
                <input
                  id="teacher-passcode"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="رمز الأمان..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-400 font-bold bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20"
              >
                {loading ? 'جاري التحقق...' : 'دخول لوحة الإدارة'}
              </button>
            </form>
          </div>
        ) : (
          /* Main Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-l border-slate-800 bg-slate-950/40 p-3 sm:p-4 flex md:flex-col gap-2 shrink-0 overflow-x-auto">
              <button
                onClick={() => { sounds.click(); setActiveTab('requests'); }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'requests'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>طلبات الانضمام</span>
                </div>
                {pendingStudents.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'requests' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {pendingStudents.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { sounds.click(); setActiveTab('students'); }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'students'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>الطلاب في المختبر</span>
                </div>
                <span className="text-[10px] text-slate-400">{approvedStudents.length}</span>
              </button>

              <button
                onClick={() => { sounds.click(); setActiveTab('leaderboard'); }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>ترتيب الصقور</span>
                </div>
                <span className="text-amber-400 text-xs">⭐</span>
              </button>

              <button
                onClick={() => { sounds.click(); setActiveTab('settings'); }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>إدارة الجلسة</span>
              </button>
            </div>

            {/* Tab Panels */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {pinNotice && (
                <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border hairline bg-slate-950/60">
                  <span className="text-sm text-slate-300">
                    الرقم السري الجديد لـ <b className="text-white">{pinNotice.name}</b>:
                    <span className="mx-2 font-mono text-2xl tracking-[0.3em] text-amber-300" dir="ltr">{pinNotice.pin}</span>
                    <span className="block text-xs text-slate-500">أعطيه للطالب الآن، لن يظهر مرة أخرى.</span>
                  </span>
                  <button type="button" onClick={() => setPinNotice(null)} className="h-8 px-3 rounded-full border hairline text-xs text-slate-300">تم</button>
                </div>
              )}
              {actionError && (
                <p role="alert" className="mb-4 text-xs text-rose-300 font-bold bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                  {actionError}
                </p>
              )}
              
              {/* TAB 1: Pending Requests */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-white">طلبات انضمام جديدة ({pendingStudents.length})</h4>
                      <p className="text-xs text-slate-400">تحقق من أسماء الطلاب واعتمدي بطاقات هوياتهم الكيميائية</p>
                    </div>

                    {pendingStudents.length > 0 && (
                      <button
                        onClick={handleApproveAll}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>قبول جميع الطلبات</span>
                      </button>
                    )}
                  </div>

                  {pendingStudents.length === 0 ? (
                    <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800">
                      <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2 opacity-80" />
                      <p className="text-sm font-bold text-slate-300">لا توجد طلبات انضمام معلقة حالياً</p>
                      <p className="text-xs text-slate-500 mt-1">جميع طلبات الطلاب تم اعتمادها بنجاح.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {pendingStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/30 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-white">{student.fullName}</span>
                              <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/40 font-bold">
                                رقم الطالب: {student.chemicalId || student.id}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-1">
                              تاريخ الإرسال: {new Date(student.createdAt).toLocaleTimeString('ar-EG')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(student.id)}
                              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>قبول واعتماد الهوية</span>
                            </button>

                            <button
                              onClick={() => handleReject(student.id)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800/50 text-rose-300 text-xs font-bold transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>رفض</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: All Students in Lab */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-white">الطلاب المعتمدون في المختبر ({approvedStudents.length})</h4>
                      <p className="text-xs text-slate-400">
                        المتواجدون حالياً: <b className="text-emerald-400">{onlineCount}</b> صقور أونلاين
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="search"
                        aria-label="بحث عن طالب بالاسم أو الرقم"
                        placeholder="بحث بالاسم أو الرقم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">اسم الباحث</th>
                          <th className="p-3">رقم الطالب</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3">الذرة</th>
                          <th className="p-3">الكالسيوم</th>
                          <th className="p-3">الكبريت</th>
                          <th className="p-3">السيليكون</th>
                          <th className="p-3">الإنجاز</th>
                          <th className="p-3">المجموع ⭐</th>
                          <th className="p-3 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {filteredStudents.map(student => (
                          <tr key={student.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-white whitespace-nowrap">
                              {student.fullName}
                            </td>
                            <td className="p-3 font-mono text-amber-300 font-bold text-xs">
                              {student.chemicalId || student.id}
                            </td>
                            <td className="p-3">
                              {student.isOnline ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  أونلاين
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">غير متصل</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-cyan-300">{student.labPoints?.at || '—'}</td>
                            <td className="p-3 font-bold text-slate-300">{student.labPoints?.ca || '—'}</td>
                            <td className="p-3 font-bold text-slate-300">{student.labPoints?.su || '—'}</td>
                            <td className="p-3 font-bold text-slate-300">{student.labPoints?.si || '—'}</td>
                            <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                              بوابات {student.summary?.atomGates ?? 0}/6 · محطات {student.summary?.elementStations ?? 0}/21
                            </td>
                            <td className="p-3 font-black text-amber-300 text-sm whitespace-nowrap">
                              ⭐ {student.totalPoints}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedStudentForCert(student)}
                                  title="عرض وطباعة شهادة الطالب"
                                  aria-label={`شهادة ${student.fullName}`}
                                  className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors"
                                >
                                  <Award className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResetPin(student)}
                                  title="إعادة تعيين الرقم السري"
                                  aria-label={`إعادة تعيين الرقم السري لـ ${student.fullName}`}
                                  className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(student.id)}
                                  title="حذف الطالب"
                                  aria-label={`حذف ${student.fullName}`}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Falcon Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-white">ترتيب صقور المختبر المباشر</h4>
                      <p className="text-xs text-slate-400">تحديث فوري لترتيب الصقور حسب مجموع النقاط والمحطات المنجزة</p>
                    </div>

                    <button
                      onClick={() => {
                        sounds.click();
                        fetchDashboardData();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>تحديث فوري</span>
                    </button>
                  </div>

                  <div className="grid gap-2.5">
                    {[...approvedStudents]
                      .sort((a, b) => b.totalPoints - a.totalPoints)
                      .map((student, idx) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                            idx === 0
                              ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10'
                              : idx === 1
                              ? 'bg-slate-800/70 border-slate-600'
                              : idx === 2
                              ? 'bg-amber-900/20 border-amber-800/40'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                              idx === 0 ? 'bg-amber-400 text-slate-950 text-base' :
                              idx === 1 ? 'bg-slate-300 text-slate-950' :
                              idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                            </span>

                            <div>
                              <span className="font-bold text-sm text-white block">{student.fullName}</span>
                              <span className="text-[10px] text-slate-400">
                                الذرة {student.labPoints?.at ?? 0} • الكالسيوم {student.labPoints?.ca ?? 0} • الكبريت {student.labPoints?.su ?? 0} • السيليكون {student.labPoints?.si ?? 0}
                              </span>
                            </div>
                          </div>

                          <div className="text-left font-black text-base text-amber-300">
                            ⭐ {student.totalPoints} نقطة
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Session Control */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-xl">
                  
                  {/* Open / Close Session */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h5 className="text-sm font-black text-white flex items-center gap-2">
                      <Power className="w-4 h-4 text-amber-400" />
                      <span>حالة استقبال الطلاب في المختبر</span>
                    </h5>
                    <p className="text-xs text-slate-400">
                      يمكنكِ إغلاق المختبر عند انتهاء الحصة لمنع استقبال طلبات جديدة، أو فتحه لبدء نشاط تفاعلي.
                    </p>

                    <button
                      onClick={handleToggleSession}
                      disabled={isUpdatingSession}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                        session?.isOpen
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>{session?.isOpen ? 'إغلاق المختبر الآن' : 'فتح المختبر لاستقبال الطلاب'}</span>
                    </button>
                  </div>

                  {/* فتح مختبر العناصر للصف كله */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h5 className="text-sm font-black text-white">مختبر العناصر (المرحلة الثانية)</h5>
                    <p className="text-xs text-slate-400">
                      يُفتح تلقائياً لكل طالب بعد إنجاز «مختبر التحقيق النهائي» في مختبر الذرة. يمكنكِ فتحه الآن لكل الصف (مثلاً لبدء حصة الكالسيوم مباشرة).
                    </p>
                    <button
                      type="button"
                      onClick={handleToggleElements}
                      disabled={isUpdatingSession}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all ${session?.elementsUnlocked ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                      {session?.elementsUnlocked ? 'إعادة القفل (يُفتح بعد مختبر الذرة)' : 'فتح مختبر العناصر للجميع'}
                    </button>
                  </div>

                  {/* Announcement Banner */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h5 className="text-sm font-black text-white">إعلان المعلمة للطلاب في أعلى المختبر</h5>
                    <textarea
                      rows={3}
                      value={announcementText}
                      onChange={(e) => {
                        announcementDirtyRef.current = true;
                        setAnnouncementText(e.target.value);
                      }}
                      aria-label="نص إعلان المعلمة للطلبة"
                      placeholder="اكتبي توجيهاتك أو رسالتك التشجيعية لطلبتك..."
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={handleSaveAnnouncement}
                      disabled={isUpdatingSession}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors"
                    >
                      نشر الإعلان للطلبة
                    </button>
                  </div>

                  {/* Danger Zone: Reset Scores */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                    <h5 className="text-sm font-black text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>منطقة تصفير التحدي</span>
                    </h5>
                    <p className="text-xs text-slate-400">
                      تصفير درجات ونقاط جميع الطلاب لبدء جولة مسابقة جديدة مع الاحتفاظ بحساباتهم.
                    </p>
                    <button
                      onClick={handleResetScores}
                      className="px-4 py-2 rounded-xl bg-rose-900/70 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-bold transition-colors"
                    >
                      تصفير جميع النقاط
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Certificate Inspection Modal */}
        {selectedStudentForCert && (
          <ChemistryCertificateModal
            student={selectedStudentForCert}
            onClose={() => setSelectedStudentForCert(null)}
          />
        )}

        {/* Share Lab Link Modal */}
        {isShareModalOpen && (
          <ShareLabModal
            onClose={() => setIsShareModalOpen(false)}
          />
        )}

      </div>
    </div>
  );
};
