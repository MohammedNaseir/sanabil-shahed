import React, { useState } from 'react';
import { usePolling } from '../utils/usePolling';
import { useDialog } from '../utils/useDialog';
import { X, Trophy, Flame, RefreshCw, Award, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LeaderboardEntry {
  id: string;
  fullName: string;
  chemicalId?: string;
  falconTitle: string;
  labPoints?: { at: number; ca: number; su: number; si: number };
  summary?: { atomGates: number; elementStations: number };
  totalPoints: number;
  isOnline: boolean;
}

interface LeaderboardModalProps {
  currentStudentId?: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ currentStudentId, onClose }) => {
  const { dialogProps, titleId } = useDialog(onClose);
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setList(data.leaderboard || []);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  // يتوقف التحديث عند إخفاء الصفحة ويعود فوراً عند ظهورها
  usePolling(fetchLeaderboard, 5000);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-2xl bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[94svh] sm:max-h-[96svh] sm:h-[90vh] overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.click();
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" /><span className="sr-only">إغلاق</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 id={titleId} className="text-2xl font-black text-white">لوحة شرف صقور أ. شهد</h3>
          <p className="text-xs text-slate-400 mt-1">
            ترتيب الباحثين الكيميائيين المعتمدين في منصة سنابل
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {offline && (
            <div role="status" className="text-center p-3 rounded-xl bg-sky-950/50 border border-sky-500/30 text-sky-200 text-xs font-bold">
              تعذّر الاتصال بخادم المختبر، لوحة الشرف تحتاج اتصالاً بالإنترنت.
            </div>
          )}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل بيانات الصقور...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              لم يتم اعتماد نتائج حتى الآن، كن أول من يتصدر لوحة الشرف!
            </div>
          ) : (
            list.map((student, idx) => {
              const isCurrent = student.id === currentStudentId;
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30'
                      : idx === 0
                      ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-950/20 border-amber-500/50 shadow-md'
                      : idx === 1
                      ? 'bg-slate-850 border-slate-700'
                      : idx === 2
                      ? 'bg-amber-950/30 border-amber-900/50'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 text-base shadow-lg shadow-amber-500/30' :
                      idx === 1 ? 'bg-slate-300 text-slate-950' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-white">
                          {student.fullName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                            أنت
                          </span>
                        )}
                        {student.isOnline && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="متصل الآن" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-mono text-amber-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/30">
                          {student.chemicalId || student.id}
                        </span>
                        <span>•</span>
                        <span>الذرة {student.labPoints?.at ?? 0} • العناصر {(student.labPoints?.ca ?? 0) + (student.labPoints?.su ?? 0) + (student.labPoints?.si ?? 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-black text-base sm:text-lg text-amber-300 shrink-0">
                    ⭐ {student.totalPoints}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>يتم تحديث الترتيب تلقائياً كل بضع ثوانٍ</span>
          <button
            onClick={() => {
              sounds.click();
              fetchLeaderboard();
            }}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث الآن</span>
          </button>
        </div>

      </div>
    </div>
  );
};
