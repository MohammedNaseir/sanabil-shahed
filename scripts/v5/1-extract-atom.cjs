// يشغّل سكربت v5 داخل vm معزول بـ DOM وهمي (Proxy) ثم يستخرج بيانات المختبرات كـ JSON.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const html = fs.readFileSync(path.join(dir, 'lab.html'), 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

function fake(name = 'x') {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === Symbol.iterator) return function* () {};
      if (p === 'length') return 0;
      if (p === 'then') return undefined;
      if (p in t && p !== 'prototype') return t[p];
      return fake(name + '.' + String(p));
    },
    set() { return true; },
    apply() { return fake(name + '()'); },
    construct() { return fake('new ' + name); },
  });
}

const store = {};
const ctx = {
  console,
  Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Map, Set, Symbol, Promise, Error,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  sessionStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
  localStorage: { getItem: () => null, setItem: () => {} },
  document: fake('document'),
  navigator: fake('navigator'),
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  addEventListener: () => {},
  innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1,
  Image: function () { return fake('img'); },
  AudioContext: function () { return fake('audio'); },
};
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

const tail = `;globalThis.__D={CA,SU,SI,AT,LABS_EL:LABS,GR};`;
// الثوابت CA/SU/SI معرّفة قبل IIFE الذرة؛ نلتقطها في نهاية السكربت
try {
  vm.runInContext(js + tail, ctx, { timeout: 10000 });
} catch (e) {
  console.error('runtime error:', e && e.message);
}

const seen = new WeakSet();
function ser(v, depth = 0) {
  if (typeof v === 'function') return { __fn: v.toString() };
  if (v && typeof v === 'object') {
    if (seen.has(v)) return '[circular]';
    seen.add(v);
    const out = Array.isArray(v) ? v.map(x => ser(x, depth + 1)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x, depth + 1)]));
    seen.delete(v);
    return out;
  }
  return v;
}
const D = ctx.__D || {};
const atom = ctx.atomApi && ctx.atomApi.LABS;
const out = { elements: ser({ CA: D.CA, SU: D.SU, SI: D.SI }), atom: ser(atom), atomTYP: ser(ctx.atomApi && ctx.atomApi.TYP) };
fs.writeFileSync(path.join(dir, 'content.json'), JSON.stringify(out, null, 1));
console.log('CA stations', D.CA && D.CA.stations.length, 'SU', D.SU && D.SU.stations.length, 'SI', D.SI && D.SI.stations.length, 'atom labs', atom && atom.length);
