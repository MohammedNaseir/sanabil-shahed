import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const LoadingPanel: React.FC = () => (
  <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-300">
    <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none text-amber-400" aria-hidden="true" />
    <span>جاري تحميل المحطة...</span>
  </div>
);

interface State {
  error: Error | null;
}

/** يلتقط فشل تحميل جزء من التطبيق (مثلاً انقطاع الاتصال أثناء التحميل) ويعرض زر إعادة المحاولة. */
export class LazyBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('تعذّر تحميل جزء من المختبر:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="max-w-md mx-auto my-10 p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto text-rose-400" aria-hidden="true" />
        <p className="text-sm font-bold text-rose-100">تعذّر تحميل هذا الجزء. تحقّق من الاتصال ثم أعد المحاولة.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-black"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }
}
