import React, { useState } from 'react';
import { X, UserPlus, Sparkles, AlertCircle, Clock, WifiOff, XCircle } from 'lucide-react';
import confetti from '../utils/confetti';
import { Student } from '../types';
import { sounds } from '../utils/audio';
import { createLocalStudent } from '../utils/studentStore';
import { useDialog } from '../utils/useDialog';

interface StudentRegisterModalProps {
  currentStudent: Student | null;
  onRegistered: (student: Student, studentKey: string | null) => void;
  onClose: () => void;
  /** تسجيل خروج الطالب الحالي من هذا الجهاز (للأجهزة المشتركة). */
  onSwitchStudent?: () => void;
}

/** يحوّل الأرقام العربية إلى لاتينية (لوحة المفاتيح العربية في الجوال). */
function toLatinDigits(v: string) {
  return v.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0)).trim();
}

type FormError =
  | { kind: 'validation' | 'server'; message: string }
  | { kind: 'network' };

export const StudentRegisterModal: React.FC<StudentRegisterModalProps> = ({
  currentStudent,
  onRegistered,
  onClose,
  onSwitchStudent,
}) => {
  const [fullName, setFullName] = useState(currentStudent?.fullName || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [showForm, setShowForm] = useState(currentStudent?.status !== 'pending' || currentStudent?.isLocal);
  const { dialogProps, titleId } = useDialog(onClose);

  const nameId = 'reg-full-name';
  const pinId = 'reg-pin';

  const validate = () => {
    const trimmedName = fullName.trim();
    if (trimmedName.length < 3) return 'يرجى إدخال اسمك كاملاً.';
    if (!/^\d{4,6}$/.test(toLatinDigits(pin))) return 'اختر رقماً سرياً من 4 إلى 6 أرقام.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = validate();
    if (problem) {
      sounds.wrong();
      setError({ kind: 'validation', message: problem });
      return;
    }

    setLoading(true);
    sounds.click();
    let res: Response;
    try {
      res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), pin: toLatinDigits(pin) }),
      });
    } catch {
      // لا يوجد اتصال بالخادم أصلاً
      setLoading(false);
      sounds.wrong();
      setError({ kind: 'network' });
      return;
    }

    const data = await res.json().catch(() => null) as { student?: Student; studentKey?: string; error?: string } | null;
    setLoading(false);

    if (res.ok && data?.student) {
      sounds.correct();
      onRegistered(data.student, data.studentKey ?? null);
      if (data.student.status === 'approved') {
        confetti({ disableForReducedMotion: true, particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
      return;
    }

    sounds.wrong();
    if (!data && (res.status === 404 || res.status >= 502)) {
      // الصفحة تعمل دون خادم (مثلاً الملف المستقل) أو الخادم متوقف
      setError({ kind: 'network' });
      return;
    }
    setError({ kind: 'server', message: data?.error || `تعذّر التسجيل (رمز الخطأ ${res.status}).` });
  };

  const startLocalMode = () => {
    sounds.click();
    onRegistered(createLocalStudent(fullName.trim()), null);
  };

  const isPending = currentStudent && !currentStudent.isLocal && currentStudent.status === 'pending';
  const isRejected = currentStudent && !currentStudent.isLocal && currentStudent.status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div {...dialogProps} className="modal-panel relative w-full max-w-md bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[94svh] sm:max-h-[96svh] sm:h-[90vh] focus:outline-none">

        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={() => {
            sounds.click();
            onClose();
          }}
          aria-label="إغلاق نافذة التسجيل"
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
            <UserPlus className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 id={titleId} className="text-2xl font-black text-white">تسجيل الهوية الكيميائية</h3>
          <p className="text-xs text-slate-400 mt-1">
            صقور أ. شهد نصير — منصة سنابل التعليمية
          </p>
        </div>

        {isPending && !showForm ? (
          <div className="space-y-4 text-center" role="status">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Clock className="w-10 h-10 mx-auto mb-2 text-amber-400 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <h4 className="font-bold text-base text-white">طلبك قيد انتظار اعتماد المعلمة!</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                مرحباً يا <b className="text-amber-400">{currentStudent.fullName}</b>! لقد وصل طلبك للمعلمة، ورقمك في المختبر <span className="font-mono text-amber-300 font-black">{currentStudent.chemicalId}</span>. سنخبرك هنا تلقائياً بمجرد أن تعتمدك المعلمة أ. شهد، ويمكنك اللعب الآن وستُحفظ نقاطك لحين الاعتماد.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                متابعة تصفح المحطات
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                تعديل البيانات
              </button>
            </div>
            {onSwitchStudent && (
              <button type="button" onClick={onSwitchStudent} className="text-[11px] text-slate-400 hover:text-white underline">
                لست {currentStudent.fullName.split(' ')[0]}؟ تبديل الطالب على هذا الجهاز
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {currentStudent?.isLocal && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs font-bold leading-relaxed">
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>أنت الآن في وضع التدريب دون اتصال، ونتائجك محفوظة على هذا الجهاز فقط. سجّل مع الخادم لترسل طلب الانضمام للمعلمة.</span>
              </div>
            )}
            {isRejected && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-bold leading-relaxed" role="alert">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>لم تعتمد المعلمة طلبك: {currentStudent.rejectionReason || 'يرجى مراجعة المعلمة.'} صحّح بياناتك وأعد الإرسال.</span>
              </div>
            )}

            <div>
              <label htmlFor={nameId} className="block text-xs font-extrabold text-slate-300 mb-1.5">
                الاسم الثلاثي للطالب / الطالبة:
              </label>
              <input
                id={nameId}
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اكتب اسمك الثلاثي هنا..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-bold text-right"
                dir="rtl"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor={pinId} className="block text-xs font-extrabold text-amber-300 mb-1.5">
                الرقم السري:
              </label>
              <div className="relative">
                <input
                  id={pinId}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9٠-٩۰-۹]/g, ''))}
                  placeholder="••••"
                  aria-describedby="reg-pin-hint"
                  className="w-full ps-4 pe-16 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono text-lg tracking-[0.4em] text-center"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  aria-pressed={showPin}
                  className="absolute inset-y-0 end-2 my-auto h-7 px-2 rounded-lg text-[11px] text-slate-400 hover:text-white"
                >
                  {showPin ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              <span id="reg-pin-hint" className="text-[11px] text-slate-400 mt-1 block leading-relaxed">
                {currentStudent && !currentStudent.isLocal
                  ? 'اكتب الرقم السري الذي اخترته أول مرة.'
                  : 'اختر رقماً سرياً من 4 إلى 6 أرقام تتذكره جيداً. ستحتاج اسمك ورقمك السري للدخول من أي جهاز آخر. إن نسيته تعيد المعلمة تعيينه.'}
              </span>
            </div>

            {error && error.kind !== 'network' && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{error.message}</span>
              </div>
            )}

            {error?.kind === 'network' && (
              <div role="alert" className="space-y-2 p-3 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>تعذّر الوصول إلى خادم المختبر. تأكد من الاتصال وحاول مجدداً.</span>
                </div>
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                  يمكنك التدرّب الآن دون اتصال: ستُحفظ نتائجك على هذا الجهاز فقط ولن تصل للمعلمة حتى تسجّل مع الخادم لاحقاً.
                </p>
                <button
                  type="button"
                  onClick={startLocalMode}
                  disabled={!!validate()}
                  className="w-full py-2 rounded-lg bg-sky-800 hover:bg-sky-700 disabled:opacity-50 text-white font-black"
                >
                  متابعة في وضع التدريب دون اتصال
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span>جاري إرسال الطلب للمختبر...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" aria-hidden="true" />
                  <span>{error?.kind === 'network' ? 'إعادة المحاولة' : 'تأكيد الهوية الكيميائية والانضمام للمختبر'}</span>
                </>
              )}
            </button>
            {onSwitchStudent && currentStudent && (
              <button type="button" onClick={onSwitchStudent} className="block mx-auto text-[11px] text-slate-400 hover:text-white underline">
                تسجيل خروج {currentStudent.fullName.split(' ')[0]} من هذا الجهاز
              </button>
            )}
          </form>
        )}

      </div>
    </div>
  );
};
