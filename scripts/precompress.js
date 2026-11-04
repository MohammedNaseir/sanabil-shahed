/**
 * يضغط ملفات الواجهة مسبقاً (brotli و gzip) بعد البناء، فيرسلها الخادم مضغوطة
 * دون أن يضغطها مع كل طلب. يوفّر نحو 75% من حجم التنزيل على الشبكات الضعيفة.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|woff)$/;

let before = 0;
let after = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!COMPRESSIBLE.test(entry.name)) continue;
    const buf = fs.readFileSync(full);
    if (buf.length < 1024) continue;
    const br = zlib.brotliCompressSync(buf, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
    });
    const gz = zlib.gzipSync(buf, { level: 9 });
    fs.writeFileSync(`${full}.br`, br);
    fs.writeFileSync(`${full}.gz`, gz);
    before += buf.length;
    after += br.length;
  }
}

if (!fs.existsSync(dist)) {
  console.error('✖ مجلد dist غير موجود. شغّلي vite build أولاً.');
  process.exit(1);
}
walk(dist);
console.log(`✔ ضغط مسبق: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (brotli)`);
