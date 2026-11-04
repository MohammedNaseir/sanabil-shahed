import React, { useState } from 'react';
import { useDialog } from '../utils/useDialog';
import { X, Share2, Copy, Check, MessageSquare, CheckCircle2, Globe, ExternalLink, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ShareLabModalProps {
  onClose: () => void;
}

export const ShareLabModal: React.FC<ShareLabModalProps> = ({ onClose }) => {
  const { dialogProps, titleId } = useDialog(onClose);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // الرابط الرسمي للمختبر. إن فُتح التطبيق من دومين آخر (أو محلياً) نشارك العنوان الحالي نفسه.
  const OFFICIAL_URL = 'https://sanabil-shahed.naseir.site';
  const publicAppUrl = window.location.protocol.startsWith('http') && !/^(localhost|127\.|\[::1\])/.test(window.location.hostname)
    ? window.location.origin
    : OFFICIAL_URL;

  const handleCopyLink = async () => {
    sounds.correct();
    try {
      await navigator.clipboard.writeText(publicAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const studentInviteMessage = `🦅 مختبر الأسئلة الكيميائي | صقور أ. شهد في منصة سنابل 🦅
أعزائي طلبة الصف العاشر الأبطال،
ندعوكم لخوض غمار التحدي في مختبر الكيمياء التفاعلي لدرس «السيليكون ومركباته»:

🔗 رابط الدخول المباشر للمختبر:
${publicAppUrl}

🧪 خطوات الانضمام:
1️⃣ افتح الرابط أعلاه من أي هاتف أو حاسوب.
2️⃣ اضغط على «هويتي الكيميائية» وسجّل اسمك الثلاثي واختر رقماً سرياً تتذكره.
3️⃣ انطلق في المحطات الست (صقر الصيد، شفرة الاكتشاف، قوارير المحاليل، فرن الصهر، المحقق الكيميائي، كبسولة الإنقاذ).
4️⃣ اجمع نقاطك واطبع شهادة التكريم المعتمدة من أ. شهد ومنصة سنابل التعليمية! 🌟`;

  const handleCopyMessage = async () => {
    sounds.correct();
    try {
      await navigator.clipboard.writeText(studentInviteMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-2xl bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden space-y-5 max-h-[94svh] sm:max-h-[96svh] sm:h-[90vh] overflow-y-auto">
        
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 id={titleId} className="text-lg font-black text-white">الرابط المباشر لمختبر الكيمياء للطلاب</h3>
              <p className="text-xs text-slate-400">صقور أ. شهد نصير — منصة سنابل التعليمية</p>
            </div>
          </div>

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

        {/* The Direct Public Link Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-blue-900/30 border-2 border-amber-400/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" />
              الرابط المباشر العام للطلاب (Public Link):
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
              جاهز للإرسال
            </span>
          </div>

          {/* Copyable Box */}
          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-amber-500/30">
            <input
              type="text"
              readOnly
              value={publicAppUrl}
              className="w-full bg-transparent text-amber-200 text-xs sm:text-sm font-mono focus:outline-none select-all px-2"
              dir="ltr"
            />
            <button
              onClick={handleCopyLink}
              className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            هذا هو الرابط العام الذي يُرسل للطلبة مباشرة للدخول على المختبر وخوض التحديات.
          </p>
        </div>

        {/* How to activate sharing if Google shows restricted / 403 / 404 */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>خطوة تفعيل الرابط العام ليفتح عند جميع الطلبة بدون أي خطأ:</span>
          </div>
          
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">1</span>
              <span>
                في أعلى شاشة الموقع هذه تماماً، انظري إلى <strong>الشريط العلوي الخارجي لـ Google AI Studio</strong> (فوق نافذة المعاينة في الزاوية العلوية).
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">2</span>
              <span>
                اضغطي على زر <strong>Share (مشاركة)</strong> الأزرق/الأبيض.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">3</span>
              <span>
                تأكدي من تفعيل خيار <strong>Anyone with the link (أي شخص لديه الرابط)</strong> لكي يفتح فوراً لجميع الهواتف والأجهزة دون طلب تسجيل دخول جوجل.
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp / Invitation Template with Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>رسالة واتساب جاهزة مع الرابط لإرسالها لمجموعة الصف:</span>
            </label>
            <button
              onClick={handleCopyMessage}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-400/30 hover:bg-amber-500/20 transition-colors"
            >
              {copiedMessage ? 'تم نسخ الرسالة ✓' : 'نسخ الرسالة للواتساب'}
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-sans select-all">
            {studentInviteMessage}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              sounds.click();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};

