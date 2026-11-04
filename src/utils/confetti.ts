/**
 * تأثير الاحتفال يُحمَّل عند أول استخدام فقط (لا يدخل في تحميل الصفحة الأولى)،
 * ولا يعمل لمن فعّل «تقليل الحركة» أو على الأجهزة الضعيفة جداً.
 */
import type { Options } from 'canvas-confetti';

const lowPower = typeof navigator !== 'undefined' &&
  (((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2);

export function confetti(options: Options = {}): void {
  if (lowPower) return;
  import('canvas-confetti')
    .then(m => m.default({ disableForReducedMotion: true, ...options, particleCount: Math.min(options.particleCount ?? 80, 70) }))
    .catch(() => {});
}

export default confetti;
