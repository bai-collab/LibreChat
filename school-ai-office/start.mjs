// 學校 AI 辦公室：唯一入口。由 repo 根目錄的 start-school-ai-office.cmd 呼叫。
// 第一次執行會自動準備環境；之後每次：MongoDB → LibreChat → 開瀏覽器。
// 關掉視窗或按 Ctrl+C 會一併停止。
import { spawn, spawnSync, exec } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = path.join(REPO, '.school-local');
const MONGOD = path.join(LOCAL, 'mongodb', 'bin', 'mongod.exe');
const MONGO_VERSION = '8.2.1';
const APP_URL = 'http://localhost:3080';
const children = [];

const step = (n, msg) => console.log(`[${n}] ${msg}`);
const fail = (msg) => { console.error(`\n✗ ${msg}\n`); stopAll(); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portOpen = (port) =>
  new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1');
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('error', () => resolve(false));
  });
async function waitFor(check, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await check()) return true; await sleep(1000); }
  return false;
}
function stopAll() { for (const c of children) if (!c.killed) c.kill(); }
process.on('SIGINT', () => { stopAll(); process.exit(0); });
process.on('exit', stopAll);

function run(cmd, args, label) {
  step('準備', `${label}（第一次會比較久）…`);
  const r = spawnSync(cmd, args, { cwd: REPO, stdio: 'inherit', shell: true });
  if (r.status !== 0) fail(`${label}失敗，請看上方訊息。`);
}

// ── 第一次執行：自動準備 ──────────────────────────────
if (!fs.existsSync(path.join(REPO, 'node_modules'))) run('npm.cmd', ['ci', '--no-audit', '--no-fund'], '安裝套件');
if (!fs.existsSync(path.join(REPO, 'client', 'dist', 'index.html'))) run('npm.cmd', ['run', 'frontend'], '編譯網頁');

const yamlPath = path.join(REPO, 'librechat.yaml');
if (!fs.existsSync(yamlPath)) {
  fs.copyFileSync(path.join(REPO, 'school-ai-office', 'librechat.school.yaml'), yamlPath);
  step('準備', '已建立 librechat.yaml（學校版設定）');
}

const envPath = path.join(REPO, '.env');
if (!fs.existsSync(envPath)) {
  const hex = (n) => crypto.randomBytes(n).toString('hex');
  let s = fs.readFileSync(path.join(REPO, '.env.example'), 'utf8')
    .replace(/^CREDS_KEY=.*$/m, `CREDS_KEY=${hex(32)}`)
    .replace(/^CREDS_IV=.*$/m, `CREDS_IV=${hex(16)}`)
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${hex(32)}`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${hex(32)}`)
    .replace(/^APP_TITLE=.*$/m, 'APP_TITLE=學校 AI 辦公室')
    .replace(/^SEARCH=.*$/m, 'SEARCH=false');
  s += '\n# School AI Office\nENDPOINTS=agents,custom\n# 生生有 Token 金鑰：用記事本打開本檔，填在等號後面\nNMKING_API_KEY=\n';
  fs.writeFileSync(envPath, s, { flag: 'wx' });
  step('準備', '已建立 .env（已自動產生加密金鑰）');
}
const nmkingKey = /^NMKING_API_KEY=(.*)$/m.exec(fs.readFileSync(envPath, 'utf8'))?.[1]?.trim();
if (!nmkingKey) {
  exec(`notepad "${envPath}"`);
  fail('還沒填生生有金鑰。已幫您用記事本打開 .env：在最後一行 NMKING_API_KEY= 後面貼上金鑰、存檔，再雙擊一次啟動檔。');
}

if (!fs.existsSync(MONGOD)) {
  step('準備', `下載資料庫 MongoDB ${MONGO_VERSION}（約 600MB，只需一次）…`);
  fs.mkdirSync(LOCAL, { recursive: true });
  const base = `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${MONGO_VERSION}.zip`;
  const zip = path.join(LOCAL, 'mongodb.zip');
  const buf = Buffer.from(await (await fetch(base)).arrayBuffer());
  const expected = (await (await fetch(`${base}.sha256`)).text()).split(/\s+/)[0];
  const actual = crypto.createHash('sha256').update(buf).digest('hex');
  if (actual !== expected) fail('MongoDB 下載檔驗證失敗（SHA-256 不符），已中止。');
  fs.writeFileSync(zip, buf);
  const r = spawnSync('powershell', ['-NoProfile', '-Command',
    `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${LOCAL}' -Force`], { stdio: 'inherit' });
  if (r.status !== 0) fail('解壓縮 MongoDB 失敗。');
  fs.renameSync(path.join(LOCAL, `mongodb-win32-x86_64-windows-${MONGO_VERSION}`), path.join(LOCAL, 'mongodb'));
  fs.rmSync(zip);
}
fs.mkdirSync(path.join(LOCAL, 'mongo-data'), { recursive: true });

// ── 每次啟動 ─────────────────────────────────────────
if (await portOpen(27017)) {
  step('1/3', '資料庫已在執行');
} else {
  step('1/3', '啟動資料庫…');
  children.push(spawn(MONGOD, [
    '--dbpath', path.join(LOCAL, 'mongo-data'), '--bind_ip', '127.0.0.1', '--port', '27017',
    '--logpath', path.join(LOCAL, 'mongod.log'), '--logappend',
    // 2026-10-02 實測：診斷資料收集（FTDC）在本機會 fatal assertion 讓資料庫崩潰；學校用途不需要，關閉
    '--setParameter', 'diagnosticDataCollectionEnabled=false',
  ], { stdio: 'ignore' }));
  if (!(await waitFor(() => portOpen(27017), 30000))) fail('資料庫啟動失敗，請看 .school-local\\mongod.log');
}

if (await portOpen(3080)) {
  step('2/3', 'LibreChat 已在執行');
} else {
  step('2/3', '啟動 LibreChat（約 30 秒）…');
  // 直接啟動 node（不經 npm.cmd／shell），關閉時才能確實停掉，不留孤兒行程
  const lc = spawn(process.execPath, ['api/server/index.js'], {
    cwd: REPO,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  children.push(lc);
  lc.on('exit', (code) => { console.log(`LibreChat 已停止（${code}）`); stopAll(); process.exit(code ?? 0); });
}

const ready = await waitFor(async () => {
  try { return (await fetch(`${APP_URL}/api/config`)).status === 200; } catch { return false; }
}, 180000);
if (!ready) fail('LibreChat 沒有在 3 分鐘內就緒，請看上方錯誤訊息。');

step('3/3', `完成！已打開 ${APP_URL}`);
console.log('使用期間請保持這個視窗開著；要結束就關掉視窗或按 Ctrl+C。');
if (!process.env.NO_BROWSER) exec(`start "" ${APP_URL}`);
