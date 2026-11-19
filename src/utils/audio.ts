/**
 * نظام الصوتيات الكيميائية التفاعلي - Web Audio API
 * أصوات نقية تعمل في المتصفح دون الحاجة لملفات صوت خارجية
 */

import { safeGet, safeSet } from './storage';

const SOUND_PREF_KEY = 'shhd_sound_enabled';

class SoundSystem {
  private ctx: AudioContext | null = null;
  // الصوت مطفأ افتراضياً للمستخدم الجديد، ويُحفظ اختيار الطالب على جهازه
  public enabled: boolean = typeof window !== 'undefined' && safeGet(SOUND_PREF_KEY) === '1';

  setEnabled(on: boolean): boolean {
    this.enabled = on;
    safeSet(SOUND_PREF_KEY, on ? '1' : '0');
    if (on) {
      this.initCtx();
      this.click();
    }
    return this.enabled;
  }

  toggle(): boolean {
    return this.setEnabled(!this.enabled);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // صوت النقر الكيميائي الأنيق
  click() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // صوت الإجابة الصحيحة - رنين كيميائي ذهبي مبهج
  correct() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  // صوت الإجابة الخاطئة - تنبيه خافت غير حاد
  wrong() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  // صوت دوران عجلة الصقور
  wheelTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch {}
  }

  // صوت إشعال فرن الصهر
  furnaceIgnite() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch {}
  }

  // صوت إنقاذ وفوز نهائي
  victory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const chord = [392.00, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.8);
      });
    } catch {}
  }

  // صوت تجميد الماء أو المساعدة
  iceFreeze() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2400, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }

  // طقطقة عجلة تدور وتتباطأ تدريجياً (للمدة المعطاة بالمللي ثانية)
  spin(ms = 4000) {
    if (!this.enabled || typeof window === 'undefined') return;
    let elapsed = 0;
    let gap = 45;
    const tick = () => {
      this.wheelTick();
      elapsed += gap;
      gap *= 1.07;
      if (elapsed < ms) window.setTimeout(tick, gap);
    };
    tick();
  }

  // صفارة حكم
  whistle() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2900, t0);
      lfo.frequency.value = 38;
      lfoGain.gain.value = 0.07;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      gain.gain.setValueAtTime(0.14, t0);
      gain.gain.setValueAtTime(0.14, t0 + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0); lfo.start(t0);
      osc.stop(t0 + 0.9); lfo.stop(t0 + 0.9);
    } catch {}
  }

  // تصفيق جمهور
  applause(seconds = 2) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const rate = this.ctx.sampleRate;
      const len = Math.floor(rate * seconds);
      const buf = this.ctx.createBuffer(1, len, rate);
      const data = buf.getChannelData(0);
      let amp = 0;
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.0016) amp = 1;
        amp *= 0.9986;
        const overall = Math.min(1, i / (rate * 0.2)) * Math.min(1, (len - i) / (rate * 0.6));
        data[i] = (Math.random() * 2 - 1) * amp * overall;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.9;
      src.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      src.start();
    } catch {}
  }

  // فتح الخزنة: قرقعة معدنية ثم رنين
  vaultOpen() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const t0 = this.ctx.currentTime;
      const thud = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(130, t0);
      thud.frequency.exponentialRampToValueAtTime(55, t0 + 0.35);
      tg.gain.setValueAtTime(0.25, t0);
      tg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      thud.connect(tg); tg.connect(this.ctx.destination);
      thud.start(t0); thud.stop(t0 + 0.4);
      [784, 988, 1175, 1568].forEach((f, i) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        const st = t0 + 0.45 + i * 0.09;
        o.frequency.setValueAtTime(f, st);
        g.gain.setValueAtTime(0.13, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.5);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(st); o.stop(st + 0.5);
      });
    } catch {}
  }
}

export const sounds = new SoundSystem();
