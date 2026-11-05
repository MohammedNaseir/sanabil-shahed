// يولّد src/content/taskTable.ts من المحتوى: npx tsx scripts/v5/4-generate-task-table.ts
import fs from 'node:fs';
import path from 'node:path';
import { buildTaskTable } from '../../src/content/buildTasks';

const t = buildTaskTable();
const body = Object.entries(t).map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`).join('\n');
const out = path.resolve(import.meta.dirname, '../../src/content/taskTable.ts');
fs.writeFileSync(out, `/**\n * ⚠️ ملف مولَّد: جدول مهام المختبر ونقاطها (npx tsx scripts/v5/4-generate-task-table.ts).\n * لا يُعدَّل يدوياً؛ tests/content-v5.test.ts يتأكد من مطابقته للمحتوى.\n */\nexport const TASK_TABLE: Readonly<Record<string, number>> = Object.freeze({\n${body}\n});\n`);
console.log('tasks:', Object.keys(t).length);
