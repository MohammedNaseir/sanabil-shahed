import React, { useEffect } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';

export interface Notice {
  tone: 'success' | 'info' | 'error';
  text: string;
}

const TONES = {
  success: { cls: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100', Icon: CheckCircle2 },
  info: { cls: 'bg-slate-900/95 border-cyan-500/50 text-cyan-100', Icon: Info },
  error: { cls: 'bg-rose-950/95 border-rose-500/50 text-rose-100', Icon: XCircle },
} as const;

/** إشعار عائم يُقرأ لقارئات الشاشة ويختفي تلقائياً. */
export const NoticeToast: React.FC<{ notice: Notice | null; onDismiss: () => void }> = ({ notice, onDismiss }) => {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onDismiss, notice.tone === 'error' ? 12000 : 7000);
    return () => clearTimeout(t);
  }, [notice, onDismiss]);

  return (
    <div aria-live="polite" className="fixed bottom-24 md:bottom-4 inset-x-3 sm:inset-x-auto sm:left-4 z-[60] flex justify-center pointer-events-none">
      {notice && (() => {
        const { cls, Icon } = TONES[notice.tone];
        return (
          <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`pointer-events-auto max-w-md w-full flex items-start gap-2 p-3.5 rounded-2xl border shadow-2xl text-xs sm:text-sm font-bold ${cls}`}>
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="flex-1 leading-relaxed">{notice.text}</span>
            <button type="button" onClick={onDismiss} aria-label="إغلاق الإشعار" className="p-1 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })()}
    </div>
  );
};
