// يولّد src/content/atom.ts و src/content/elements.ts من البيانات الملتقطة من v5.
const fs = require('fs');
const path = require('path');
const [, , dir, outDir] = process.argv;
const atomSrc = require(path.join(dir, 'content.json')).atom;
const el = require(path.join(dir, 'elements.json')).labs;

const ITEM_KEYS = ['t', 'tag', 'q', 'o', 'a', 'e', 'h', 'wm', 'p', 'm', 'av', 'tm', 'fi', 'hdr', 'cs', 'how', 'clues', 'tpl', 'ans', 'chips', 'skin', 's', 'f', 'bad', 'title', 'fixed'];
const htmlLeft = [];

function cleanItem(x, where) {
  const out = {};
  for (const k of ITEM_KEYS) if (x[k] !== undefined) out[k] = x[k];
  if (out.t === 'mcq' && out.a === undefined) out.a = 0;
  // معلومات العالِم في محطات «رحلة الذرة»: نحولها من HTML إلى حقول
  if (x.info) {
    const m = /<h4>([^<]+)<\/h4>(?:<small>([^<]*)<\/small>)?(?:<p><b>تذكّر:<\/b> ([\s\S]*?)<\/p>)?/.exec(x.info);
    if (!m) throw new Error('info not parsed at ' + where);
    out.sci = { name: m[1], ...(m[2] ? { period: m[2] } : {}), ...(m[3] ? { key: m[3] } : {}) };
    if (x.mm && x.m !== x.mm) out.sci.portrait = x.mm;
  }
  for (const [k, v] of Object.entries(out)) {
    const s = JSON.stringify(v);
    if (s.includes('data:image')) throw new Error('data uri left in ' + where + '.' + k);
    if (/<(?!br>|\/?b>)/.test(s)) htmlLeft.push(where + '.' + k + ': ' + s.slice(0, 80));
  }
  return out;
}

// ---------- الذرة ----------
const gates = atomSrc.map((g, i) => ({
  index: i,
  n: g.n,
  q: g.q,
  ex: g.ex,
  img: g.img,
  ...(g.game ? { game: g.game } : {}),
  items: g.items.map((x, j) => cleanItem(x, `atom[${i}][${j}]`)),
}));

// ---------- العناصر ----------
function station(labId, s) {
  const base = { id: s.id, n: s.n, mode: s.mode, how: s.how };
  const c = s.calls;
  const k = c[0].kind;
  if (k === 'sim') {
    const d = c[0].args[0];
    return { ...base, kind: 'sim', sim: {
      lab: d.lab, tag: d.tag, intro: d.intro, pre: d.pre, init: d.init, scene: d.scene.__scene,
      steps: d.steps.map(st => ({ say: st.say, o: st.o, set: st.set, obs: st.obs })),
      post: d.post.slice(0, 2).map((x, j) => cleanItem(x, `${labId}.${s.id}.post${j}`)),
      sum: d.sum,
    } };
  }
  if (k === 'elec') {
    const d = c[0].args[0];
    return { ...base, kind: 'elec', elec: { lab: d.lab, tag: d.tag, intro: d.intro, pre: d.pre,
      post: d.post.slice(0, 2).map((x, j) => cleanItem(x, `${labId}.${s.id}.post${j}`)), sum: d.sum } };
  }
  if (k === 'quiz') {
    return { ...base, kind: 'quiz', items: c[0].args[0].map((x, j) => cleanItem(x, `${labId}.${s.id}[${j}]`)) };
  }
  if (k === 'arcade') {
    const d = c[0].args[0];
    return { ...base, kind: 'arcade', arcade: { tm: d.tm, theme: d.theme, lives: d.lives || 3,
      items: d.items.map((x, j) => cleanItem({ t: 'mcq', ...x }, `${labId}.${s.id}[${j}]`)) } };
  }
  if (k === 'mcq' && s.id === 's1') {
    // محطة المجهر: سؤال تمهيدي ثم شريحة المجهر (منقولة من دالة run الأصلية)
    return { ...base, kind: 'micro', micro: {
      img: 'vol',
      intro: cleanItem({ t: 'mcq', ...c[0].args[0] }, 'su.s1.intro'),
      introFeedback: 'يوجد حرًا قرب البراكين، ويوجد أيضًا في خاماته كالجبس وكبريتيد الهيدروجين، وفي الحموض الأمينية التي تبني البروتينات. هيا نفحص العينات بالمجهر!',
      task: 'اختر كل عينة لتضعها تحت العدسة ثم حرّك المؤشر فوقها. قارن شكل البلورات.',
      forms: [
        { img: 'sf_r', d: 'بلورات هندسية منتظمة معتمة صفراء.' },
        { img: 'sf_n', d: 'بلورات على هيئة إبر شفافة.' },
        { img: 'sf_m', d: 'سلاسل طويلة لينة مطاطية.' },
      ],
      post: [
        cleanItem({ t: 'mcq', q: 'العينات الثلاث كلها من عنصر الكبريت نفسه. ما الظاهرة التي تفسر اختلاف أشكالها؟', o: ['التآصل: وجود العنصر في أكثر من صورة بنيوية تختلف في ترتيب الذرات', 'التأين', 'التحلل الحراري'], a: 0, e: 'التآصل: وجود العنصر الكيميائي الواحد في أكثر من صورة بنيوية، تتشابه في خصائصها الكيميائية وتختلف في خصائصها الفيزيائية.', p: 2, h: 'العنصر واحد لكن الصور مختلفة: ما اسم هذه الظاهرة؟' }, 'su.s1.post0'),
        cleanItem({ t: 'mat', q: 'طابق كل شكل من الكبريت مع وصفه:', o: [['المعيني', 'بلورات هندسية منتظمة معتمة صفراء'], ['الإبري (المنشوري)', 'بلورات إبرية شفافة'], ['المطاطي', 'سلاسل طويلة لينة']], e: 'قارن ما رأيته تحت المجهر.', p: 2 }, 'su.s1.post1'),
      ],
      sum: 'الكبريت يوجد في صور مختلفة (المعيني والإبري والمطاطي) تتفق كيميائيًا وتختلف فيزيائيًا؛ هذه الظاهرة هي التآصل، وجزيء الكبريت الطبيعي S₈ حلقة من ثماني ذرات.',
    } };
  }
  throw new Error('unknown station ' + labId + '.' + s.id + ' ' + k);
}

const labs = ['CA', 'SU', 'SI'].map(key => {
  const L = el[key];
  return { id: L.id, n: L.n, mission: L.mission, q: L.q, ex: L.ex, title: L.title, gate: L.gate, bg: L.bg,
    stations: L.stations.map(s => station(L.id, s)) };
});

const header = src => `/**\n * ⚠️ ملف مولَّد من lab_shahd_v5.html — المحتوى التعليمي لأ. شهد كما هو حرفياً.\n * المصدر: ${src}\n */\n`;
fs.writeFileSync(path.join(outDir, 'atom.ts'),
  header('بوابات مختبر الذرة الست') + `import type { AtomGate } from './types';\n\nexport const ATOM_GATES: AtomGate[] = ${JSON.stringify(gates, null, 2)};\n`);
fs.writeFileSync(path.join(outDir, 'elements.ts'),
  header('مختبرات الكالسيوم والكبريت والسيليكون') + `import type { ElementLab } from './types';\n\nexport const ELEMENT_LABS: ElementLab[] = ${JSON.stringify(labs, null, 2)};\n`);

// إحصاءات للتحقق
const sum = a => a.reduce((x, y) => x + y, 0);
console.log('atom:', gates.map(g => `${g.n}: ${g.items.length} items / ${sum(g.items.map(i => i.p || 0))} pts`).join(' | '));
for (const L of labs) console.log(L.id, L.stations.map(s => `${s.id}(${s.kind})`).join(' '));
console.log('html left:', htmlLeft.length);
htmlLeft.slice(0, 15).forEach(x => console.log('  ', x));
