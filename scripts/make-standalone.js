/**
 * يصنع ملف HTML واحداً يعمل دون خادم (للمشاركة عبر واتساب أو التشغيل من الجهاز).
 * يُشغَّل عبر: npm run build:standalone
 *
 * - يدمج ملف CSS وملف JS الوحيدين الناتجين عن vite.standalone.config.ts
 * - يدمج الصور المستخدمة من public/ كـ data URI
 * - في هذه النسخة تعمل الأنشطة والتدريب محلياً، أما التسجيل لدى المعلمة ولوحة الشرف ولوحة المعلمة فتحتاج الخادم
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'dist-standalone', '.build');
const publicDir = path.join(root, 'public');
const outDir = path.join(root, 'dist-standalone');
const OUT_NAME = 'مختبر_الأسئلة_صقور_أ_شهد.html';

const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

const indexPath = path.join(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) fail('لم يُعثر على dist-standalone/.build/index.html. شغّلي npm run build:standalone.');

let html = fs.readFileSync(indexPath, 'utf-8');
const assetsDir = path.join(buildDir, 'assets');
const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const jsFiles = files.filter(f => f.endsWith('.js'));
const cssFiles = files.filter(f => f.endsWith('.css'));
if (jsFiles.length !== 1) fail(`متوقع ملف JS واحد، وُجد ${jsFiles.length}: ${jsFiles.join(', ')}`);
if (cssFiles.length > 1) fail(`متوقع ملف CSS واحد على الأكثر، وُجد ${cssFiles.length}`);

/** يستبدل كل مسار صورة عامة (مثل /sanabil-logo.png) بنسخة data URI. */
const embedded = new Map();
function embedPublicAssets(text) {
  return text.replace(/\/((?:assets\/aistudio\/)?[\w.-]+\.(?:png|webp|jpe?g|svg))/g, (match, rel) => {
    const file = path.join(publicDir, rel);
    if (!fs.existsSync(file)) return match;
    if (!embedded.has(rel)) {
      const mime = MIME[path.extname(rel).toLowerCase()];
      embedded.set(rel, `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`);
    }
    return embedded.get(rel);
  });
}

const js = embedPublicAssets(fs.readFileSync(path.join(assetsDir, jsFiles[0]), 'utf-8'))
  // منع إنهاء وسم السكربت مبكراً إن ظهر النص داخل الكود
  .replace(/<\/script/gi, '<\\/script');

// نستخدم دوال الاستبدال حتى لا تُفسَّر رموز $ داخل الكود
html = html.replace(/<script[^>]*type="module"[^>]*src="[^"]*"[^>]*><\/script>/i, () => `<script type="module">\n${js}\n</script>`);
if (cssFiles.length === 1) {
  const css = embedPublicAssets(fs.readFileSync(path.join(assetsDir, cssFiles[0]), 'utf-8'));
  html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/i, () => `<style>\n${css}\n</style>`);
}
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/gi, '');
html = embedPublicAssets(html);

if (/src="\/assets\/|href="\/assets\//.test(html)) fail('ما زالت هناك مراجع لملفات خارجية في الملف الناتج.');

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, OUT_NAME);
fs.writeFileSync(outPath, html, 'utf-8');
fs.rmSync(buildDir, { recursive: true, force: true });

console.log(`✔ النسخة المستقلة: ${path.relative(root, outPath)} (${(fs.statSync(outPath).size / 1e6).toFixed(2)}MB، ${embedded.size} صور مدمجة)`);
