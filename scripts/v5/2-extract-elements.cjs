// المرحلة 2: نشغّل كل محطة من مختبرات العناصر داخل vm ونلتقط البيانات التي تمرّرها لمحرّكات
// quiz / arcade / sim / elec / mcq، فنحصل على المحتوى النهائي كما يراه الطالب حرفياً.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const html = fs.readFileSync(path.join(dir, 'lab.html'), 'utf8');
let js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

const hook = (sig, kind) => {
  const i = js.indexOf(sig);
  if (i < 0) throw new Error('missing ' + sig);
  js = js.slice(0, i + sig.length) + `if(globalThis.__cap){globalThis.__cap.push({kind:'${kind}',args:[...arguments].slice(1)});return}` + js.slice(i + sig.length);
};
// أول تعريف لكل دالة هو الخاص بمختبر العناصر (تطبيق الذرة داخل IIFE لاحقاً)
hook('function quiz(el,items,idp,onEnd,k=0){', 'quiz');
hook('function arcade(el,d,idp,onEnd){', 'arcade');
hook('function sim(el,d,idp,onEnd){', 'sim');
hook('function elec(el,d,idp,onEnd){', 'elec');
hook('function mcq(el,it,cb,t=0){', 'mcq');

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
  console, Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Map, Set, Symbol, Promise, Error,
  parseInt, parseFloat, isNaN, isFinite,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  sessionStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
  document: fake('document'), navigator: fake('navigator'),
  matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener: () => {},
  innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1,
  Image: function () { return fake('img'); },
};
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(js + `;globalThis.__L={CA,SU,SI,I};`, ctx, { timeout: 10000 });

const ser = v => {
  if (typeof v === 'function') return { __scene: v.name || 'anon' };
  if (Array.isArray(v)) return v.map(ser);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ser(x)]));
  return v;
};

const labs = {};
for (const key of ['CA', 'SU', 'SI']) {
  const L = ctx.__L[key];
  const out = { id: L.id, n: L.n, mission: L.mission, q: L.q, ex: L.ex, title: L.title, phase: L.phase, bg: L.bg, gate: L.gate, stations: [] };
  for (const s of L.stations) {
    ctx.__cap = [];
    try { s.run(fake('el'), () => {}); } catch (e) { console.error(key, s.id, e.message); }
    const cap = ctx.__cap;
    ctx.__cap = null;
    out.stations.push({ id: s.id, n: s.n, mode: s.mode, how: s.how, calls: ser(cap) });
  }
  labs[key] = out;
}
const imgKeys = Object.keys(ctx.__L.I);
fs.writeFileSync(path.join(dir, 'elements.json'), JSON.stringify({ labs, imgKeys }, null, 1));
for (const k of Object.keys(labs)) console.log(k, labs[k].stations.map(s => s.id + ':' + s.calls.map(c => c.kind).join('+')).join('  '));
console.log('images', imgKeys.length);
