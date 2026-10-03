// 由導覽登錄表產生 school-ai-office/guide.html 的導覽資料（唯一來源：client/src/components/SchoolGuide/registry.ts）。
//   node school-ai-office/build-guide.mjs          更新 guide.html
//   node school-ai-office/build-guide.mjs --check  只檢查，guide.html 過期或登錄表有錯就失敗
// registry.ts 是 TypeScript，需要 Node 22.18 以上（內建型別剝除）；較舊的 22.x 請加 --experimental-strip-types。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(REPO, 'client/src/components/SchoolGuide/registry.ts');
const LOCALE = path.join(REPO, 'client/src/locales/zh-Hant/translation.json');
const EN = path.join(REPO, 'client/src/locales/en/translation.json');
const HTML = path.join(REPO, 'school-ai-office/guide.html');
const BEGIN = '/* GUIDES:BEGIN */';
const END = '/* GUIDES:END */';
const check = process.argv.includes('--check');

let schoolGuides;
try {
  ({ schoolGuides } = await import(pathToFileURL(REGISTRY).href));
} catch (err) {
  if (err?.code === 'ERR_UNKNOWN_FILE_EXTENSION') {
    console.error('✗ 這個 Node 版本不能直接讀 .ts：請改用 Node 22.18 以上，或加上 --experimental-strip-types。');
    process.exit(1);
  }
  throw err;
}

const zh = JSON.parse(fs.readFileSync(LOCALE, 'utf8'));
const en = JSON.parse(fs.readFileSync(EN, 'utf8'));
const html = fs.readFileSync(HTML, 'utf8');
const mockTargets = new Set([...html.matchAll(/data-t="([^"]+)"/g)].map((m) => m[1]));
const screens = new Set([...html.matchAll(/data-screen="([^"]+)"/g)].map((m) => m[1]));
const panels = new Set([...html.matchAll(/data-panel="([^"]+)"/g)].map((m) => m[1]));
const popovers = new Set([...html.matchAll(/data-popover="([^"]+)"/g)].map((m) => m[1]));

const errors = [];
const text = (key, where) => {
  if (!(key in en)) errors.push(`${where}：英文語系沒有 ${key}`);
  if (!(key in zh)) errors.push(`${where}：繁中語系沒有 ${key}`);
  return zh[key] ?? key;
};

const ids = new Set();
const data = schoolGuides.map((g) => {
  if (ids.has(g.id)) errors.push(`重複的導覽 id：${g.id}`);
  ids.add(g.id);
  return {
    id: g.id,
    audience: g.audience,
    title: text(g.titleKey, g.id),
    summary: text(g.summaryKey, g.id),
    keywords: g.keywords,
    steps: g.steps.map((s, i) => {
      const where = `${g.id} 第 ${i + 1} 步`;
      const m = s.mock;
      if (!screens.has(m.screen)) errors.push(`${where}：guide.html 沒有畫面 ${m.screen}`);
      if (m.panel && !panels.has(m.panel)) errors.push(`${where}：guide.html 沒有面板 ${m.panel}`);
      if (m.popover && !popovers.has(m.popover)) errors.push(`${where}：guide.html 沒有選單 ${m.popover}`);
      if (!mockTargets.has(m.target)) errors.push(`${where}：guide.html 沒有 data-t="${m.target}"`);
      if (!s.external && s.target === undefined) errors.push(`${where}：缺 target（沒有可標示的元素請寫 null）`);
      return {
        text: text(s.textKey, where),
        ...(s.tipKey ? { tip: text(s.tipKey, where) } : {}),
        ...m,
      };
    }),
  };
});

if (errors.length) {
  console.error(`✗ 導覽登錄表有 ${errors.length} 個問題：\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

const start = html.indexOf(BEGIN);
const end = html.indexOf(END);
if (start < 0 || end < start) {
  console.error(`✗ guide.html 找不到 ${BEGIN} … ${END} 標記`);
  process.exit(1);
}
const next = html.slice(0, start + BEGIN.length) + JSON.stringify(data) + html.slice(end);

if (check) {
  if (next !== html) {
    console.error('✗ guide.html 跟導覽登錄表不一致：請執行 node school-ai-office/build-guide.mjs');
    process.exit(1);
  }
  console.log(`✓ guide.html 與登錄表一致（${data.length} 個導覽）`);
} else {
  fs.writeFileSync(HTML, next);
  console.log(`✓ 已更新 guide.html（${data.length} 個導覽、${data.reduce((n, g) => n + g.steps.length, 0)} 步）`);
}
