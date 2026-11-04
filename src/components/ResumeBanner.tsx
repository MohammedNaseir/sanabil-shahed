import React, { useState } from 'react';
import { History, RotateCcw, X } from 'lucide-react';

interface ResumeBannerProps {
  show: boolean;
  onRestart: () => void;
}

/** شريط يظهر عند استئناف لعبة محفوظة، مع خيار البدء من جديد. */
export const ResumeBanner: React.FC<ResumeBannerProps> = ({ show, onRestart }) => {
  const [dismissed, setDismissed] = useState(false);
  if (!show || dismissed) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-100 text-xs font-bold"
    >
      <span className="flex items-center gap-2">
        <History className="w-4 h-4 text-cyan-300" aria-hidden="true" />
        استأنفنا تقدّمك السابق في هذه المحطة من حيث توقفت.
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          ابدأ من جديد
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إخفاء الإشعار"
          className="p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
};
