# 學校 AI 辦公室：開發交接（給下一個開發 session）

> 使用者操作請看同資料夾的 `README.md`。本檔給接手開發的人／AI：現況、規則、已知坑、下一步。
> 最後更新：2026-10-02。分支 `school/pixel-theme-zh-hant`（尚未合回 main）。

## 1. 一句話現況
LibreChat（bai-collab/LibreChat fork）已改成「學校 AI 辦公室」：像素風主題、全繁中介面、對話旁的像素辦公室面板（Agent 角色隨回覆動作）、一鍵啟動。模型由「生生有 Token」提供。Google 登入／行事曆／LINE 都**還沒做**。

## 2. 必守規則
1. **只推到 bai-collab/LibreChat，絕不回傳原開發者**。`upstream` 只用來 fetch 官方更新；其 push URL 已設為無效值，`gh` 預設 repo 已設為 bai-collab/LibreChat。不要對 LibreChat-AI/LibreChat 開 PR 或 issue。
2. **不改 main 以外的人的東西**：在分支開發，合回 main 前先問使用者。
3. **少改官方檔案**：學校功能用「新增檔案」完成，動到官方檔案要記在 README 的「與 LibreChat 官方版的關係」。
4. **操作只給一個入口**：給使用者的步驟整合成單一入口（目前是 `start-school-ai-office.cmd`），不要拆成多個檔案／視窗讓人拼湊。
5. **秘密不進 git**：`.env`、`librechat.yaml`、`.school-local/` 都在 .gitignore。生生有金鑰只讓使用者自己填。
6. 回覆使用者一律繁體中文。

## 3. 架構
```text
start-school-ai-office.cmd → school-ai-office/start.mjs
   ├─ MongoDB（.school-local/mongodb，資料 .school-local/mongo-data）
   └─ LibreChat（node api/server/index.js，http://localhost:3080）
        ├─ 介面：client/（pixel 主題 + zh-Hant + 辦公室面板）
        ├─ 模型：librechat.yaml 的 custom endpoint「NMKing」→ 生生有（Responses API）
        └─ Agents API：/api/agents/v1/*（每位教師自己的 API key，未來 LINE Gateway 用）
```

## 4. 學校版檔案地圖
| 功能 | 檔案 |
|---|---|
| 像素主題 | `client/src/themes/pixel.ts`、`client/src/style-pixel.css`、`client/src/App.jsx`（一行接入） |
| 像素字型 | `client/public/fonts/Cubic_11.woff2`（CSS 要用 `$fonts/` 別名，否則不會被打包→404） |
| 繁中補齊 | `client/src/locales/zh-Hant/translation.json`（補了 1021 鍵） |
| 辦公室面板 | `client/src/components/SchoolOffice/`（OfficePanel、useOfficeBridge、protocol）；掛在 `client/src/components/Chat/Presentation.tsx` |
| 辦公室畫面 | `client/public/pixel-office/`（pixel-agents 編譯產物，修改紀錄見 `VENDORED.md`）；`client/vite.config.ts` 負責打包 |
| 啟動／設定 | `start-school-ai-office.cmd`、`school-ai-office/start.mjs`、`school-ai-office/librechat.school.yaml` |

## 5. 開發常用
- 改了 `client/`：`npm.cmd run frontend`（或只改 client 時 `cd client && npm.cmd run build`），然後關掉啟動視窗再雙擊一次（後端會快取舊的檔案清單，不重啟會白畫面）。
- 改了 `.env`／`librechat.yaml`：重開啟動檔（只在啟動時讀）。
- 這台 Windows：npm／npx 要用 `npm.cmd`／`npx.cmd`。
- repo 有 commit hook（prettier、eslint、sort-imports），commit 時會自動格式化。

## 6. 已知坑（都踩過）
| 坑 | 結論 |
|---|---|
| 生生有 chat/completions **串流**回 `upstream returned non-JSON response` | `addParams.useResponsesApi: true` 改走 Responses API（與官方 Codex 設定 `wire_api = "responses"` 一致）。模型清單只有 `gpt-5.6-luna`。 |
| MongoDB 啟動幾秒後 fatal assertion（FTDC） | 啟動參數 `--setParameter diagnosticDataCollectionEnabled=false`（已在 start.mjs）。 |
| 用腳本打 LibreChat 的 JWT 路由被封鎖 2 小時 | LibreChat 會封鎖非瀏覽器 User-Agent。外部程式（未來 LINE Gateway）**只能走 `/api/agents/v1/*` + 教師 API key**，該路徑不受此限。 |
| `npm.cmd run backend` 包一層 → 關視窗留下孤兒行程 | start.mjs 直接 spawn `node api/server/index.js`。 |
| Windows `.cmd` 內放 UTF-8 中文／LF → 指令被切壞 | `.cmd` 只放 ASCII＋CRLF，邏輯放 Node。 |
| 改了 `client/public/pixel-office/` 的檔案，瀏覽器還是舊的 | 該路徑快取 2 天。檔名不變的修改要 Ctrl+F5；正式改版建議改檔名。 |
| Codex 派工 effort | 使用者的 Codex 設定預設是 high；要 max 必須明帶 `-c model_reasoning_effort=max` 並核對輸出。 |

## 7. 已驗證的事實（2026-10-02 實測）
- **教師身分委派**（未來 LINE 用）：API key 必須教師登入後才能產生（`POST /api/api-keys` 需 JWT），可設到期、可撤銷；他人 key 呼叫未分享 Agent → 403；撤銷／到期 → 401。另需該 Agent 的 REMOTE_AGENT 權限（Web 可用 ≠ API 可用）。
- 驗收：像素主題與繁中（agy 收尾 PASS）、辦公室面板（agy 收尾 PASS）、手機 375px 無橫向捲動。

## 8. 延後與已知小瑕疵
- 像素主題目前寫死（日後可改成環境變數開關）；`style-pixel.css` 的 `!important` 可再收斂。
- 手機收合後的浮動「展開辦公室」鈕會輕微蓋到右上訊息泡泡（審查判 Low）。
- 辦公室在約 380px 面板內只能 1 倍縮放，畫面偏小。
- REMOTE_AGENT「分享給他人後可用」的正向案例尚未測。

## 9. 下一步（依原計畫順序）
1. **Google Workspace 登入**：使用者是學校網域管理員，可建「內部」OAuth 用戶端；LibreChat 有 Google 社群登入設定（`.env` 的 GOOGLE_CLIENT_ID 等）。
2. **Google 共用日曆**：讀寫工具（MCP 或 Agent tool）；共用日曆讀寫分離、事件記錄真正建立者；不要用網域全域委派。
3. **LINE Gateway＋帳號綁定**：Gateway 只走 Agents API；綁定碼一次性、有期限。
4. **提醒**：不用 Sheets 去重，用有鎖與重試的做法。
5. 視情況把分支合回 bai-collab/LibreChat 的 main（先問使用者）。
