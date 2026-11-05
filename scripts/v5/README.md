# استخراج المحتوى من ملف المختبر (lab_shahd_vN.html)

المحتوى في `src/content/atom.ts` و `src/content/elements.ts` مولَّد من ملف HTML الذي تعدّه أ. شهد.
عند وصول نسخة جديدة:

```bash
mkdir -p /tmp/v5 && cp lab_shahd_v6.html /tmp/v5/lab.html
node scripts/v5/1-extract-atom.cjs /tmp/v5        # بوابات الذرة → content.json
node scripts/v5/2-extract-elements.cjs /tmp/v5    # محطات العناصر → elements.json
node scripts/v5/3-generate-content.cjs /tmp/v5 src/content
npx tsx scripts/v5/4-generate-task-table.ts         # جدول المهام الخفيف taskTable.ts
npm test                                          # اختبار المطابقة يبيّن ما تغيّر
```

- السكربتات تشغّل ملف HTML داخل `vm` معزول بصفحة وهمية (دون متصفح ودون شبكة)، وتقرأ البيانات النهائية كما يراها الطالب.
- الصور تُستخرج من الكائن `I` في الملف وتُحوَّل إلى WebP بحجمين في `public/assets/v5/` (`<key>.webp` و `<key>-sm.webp`).
- إن تغيّر عدد الأنشطة أو النقاط عمداً، حدّثي الأرقام في `tests/content-v5.test.ts`.
