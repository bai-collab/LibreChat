# 學校 AI 辦公室：開發交接（給下一個開發 session）

> 使用者操作請看同資料夾的 `README.md`。本檔給接手開發的人／AI：現況、規則、已知坑、下一步。
> 最後更新：2026-10-03。分支 `school/pixel-theme-zh-hant`（尚未合回 main）。

## 1. 一句話現況
LibreChat（bai-collab/LibreChat fork）已改成「學校 AI 辦公室」：像素風主題、全繁中介面、對話旁的像素辦公室面板（Agent 角色隨回覆動作）、一鍵啟動。模型由「生生有 Token」提供。Google 登入的設定方式已寫好（`GOOGLE-LOGIN.md`，純設定、不改程式），待使用者建立 OAuth 用戶端後實測；行事曆／LINE **還沒做**。

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
| 操作導覽 | 登錄表 `client/src/components/SchoolGuide/registry.ts`（＋`types.ts`），文字在語系檔 `com_ui_school_guide_*`；示範頁 `school-ai-office/guide.html` 由 `school-ai-office/build-guide.mjs` 產生（設計見第 10 節） |

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
1. **Google Workspace 登入**（設定已備妥，待實測）：步驟見 `GOOGLE-LOGIN.md`。重點：
   - 「內部」OAuth 用戶端＋`librechat.yaml` 的 `registration.allowedDomains` 雙重限制網域。`allowedDomains` 是完全比對，子網域要各自列出。
   - `start.mjs` 啟動時會檢查設定，漏填只提醒、不擋啟動。
   - 既有的 email 密碼帳號不會和 Google 帳號合併（`already exists with provider local`）。
   - Google 只接受 localhost 或 HTTPS 的重新導向 URI，所以目前只能在本機用。全校使用要先有正式網址＋HTTPS。
2. **Google 共用日曆**：讀寫工具（MCP 或 Agent tool）；共用日曆讀寫分離、事件記錄真正建立者；不要用網域全域委派。
3. **LINE Gateway＋帳號綁定**：Gateway 只走 Agents API；綁定碼一次性、有期限。
4. **提醒**：不用 Sheets 去重，用有鎖與重試的做法。
5. **AI 操作導覽**：見第 10 節。登錄表與示範頁已完成；下一步做 LibreChat 內的正式版（GuideOverlay）。
6. 視情況把分支合回 bai-collab/LibreChat 的 main（先問使用者）。

## 10. 規劃中：AI 操作導覽（加粗框＋focus）

### 目標
老師在 LibreChat 裡問「怎麼把 Agent 分給總務主任？」，AI 除了用文字回答，還在**真正的畫面上**把要按的按鈕加粗框、移過焦點，一步一步帶著做。

### 現況（2026-10-03）
- **已決定**（使用者 2026-10-03）：
  - 導覽包含老師日常操作，不只管理員設定。
  - 示範頁和正式版**共用同一份導覽登錄表**。
- **導覽登錄表**（唯一來源）：`client/src/components/SchoolGuide/registry.ts`，型別在 `types.ts`。
  - 每一步的說明文字都用語系 key（`com_ui_school_guide_*`，en 與 zh-Hant 都有）。
  - `tsc` 會檢查 key 是否存在，打錯 key 會編譯失敗（已驗證）。
- **目前 7 個導覽、39 步**：

  | 對象 | 導覽 id |
  |---|---|
  | 老師日常 | `start-chat`、`upload-file`、`create-agent`、`find-chat` |
  | 管理員 | `share-agent`、`allow-sharing`、`google-login` |

- **示範頁** `school-ai-office/guide.html`：
  - 導覽資料由 `node school-ai-office/build-guide.mjs` 從登錄表寫入，**不要手改**標記 `GUIDES:BEGIN … GUIDES:END` 之間的內容。
  - `--check` 會檢查兩件事：示範頁是否和登錄表一致；每個語系 key、畫面、面板、選單、`data-t` 是否都存在。
  - 問答是關鍵字比對，不是 AI。
- **已用 Playwright 實測示範頁**：
  - 1200px 亮色、390px 暗色，7 個導覽全部步驟都有加粗框、目標可見、沒有橫向捲動、沒有 console 錯誤。
  - 7 個範例問題都比對到正確導覽，焦點落在目標元素。
- **尚未驗證：** 登錄表裡給正式版用的定位方式（`target`），都是讀程式碼推得的，還沒在真正的 LibreChat 上跑過。正式版的 Playwright 測試要先補上。
- `zh-Hant` 的 `com_ui_instructions` 從「說明」改為「指示」。原本和「Agent 說明」撞名，導覽講不清楚是哪一欄。

### 新增或修改導覽
1. 在 `registry.ts` 加一筆導覽：
   - 每一步要有 `textKey`（可加 `tipKey`）、`target`（正式版定位方式；沒有穩定元素就寫 `null`）、`mock`（示範頁的畫面與 `data-t`）。
   - 步驟在 LibreChat 之外（Google Cloud、`.env`、`librechat.yaml`）時，加上 `external`。
2. 在 `client/src/locales/en/translation.json` 和 `zh-Hant/translation.json` 加文字，放在檔案開頭的 `com_ui_school_*` 區塊（集中在開頭，合併官方更新時比較不會衝突）。
3. 示範頁缺畫面元素時，在 `guide.html` 補上 `data-t`。
4. 執行 `node school-ai-office/build-guide.mjs` 更新示範頁，再執行 `--check` 確認一致。
   - 需要 Node 22.18 以上（直接讀 .ts）；較舊的 22.x 請加 `--experimental-strip-types`。

### 正式版架構（建議）
```text
老師提問
  → 「操作導覽」Agent（指示裡附上導覽清單：id、標題、適用情境）
  → 回覆文字中帶一個標記，例如 [[guide:share-agent]]（只允許清單內的 id）
  → 前端 useGuideCommand 在最新一則回覆中偵測標記 → 顯示「開始導覽」按鈕
  → 老師按下 → GuideOverlay 依 id 查導覽登錄表，逐步：
        prepare（例如打開側邊欄）→ 找 DOM → 加粗框 → scrollIntoView → focus
  → 下一步／Esc 結束（結束時焦點還給原本的位置）
```

| 檔案（建議） | 職責 |
|---|---|
| `client/src/components/SchoolGuide/registry.ts` | 導覽登錄表（**已完成**，與示範頁共用）：每步的定位方式、說明文字的語系 key、對象（teacher／admin） |
| `client/src/components/SchoolGuide/GuideOverlay.tsx` | 加框（4px 粗框＋硬陰影，尊重 reduced motion）、focus 管理、`aria-live` 唸出步驟、找不到目標時的提示 |
| `client/src/components/SchoolGuide/useGuideCommand.ts` | 從 AI 回覆中解析 `[[guide:id]]`，比照 `SchoolOffice/useOfficeBridge.ts` 監看訊息的方式 |

### 設計決策
1. **目標用穩定屬性或語系 key 定位，不改官方元件**：每一步可列多個定位方式，依序嘗試，找到第一個就用。種類有 `testId`、`id`、`labelKey`、`labelPrefixKey`、`placeholderKey`、`labelledByKey`、`role`＋`textKey`，可加 `within: 'dialog'` 限定在對話框內。例如管理員設定按鈕是 `aria-label={localize('com_ui_admin_settings')}`，登錄表寫成 `{ labelKey: 'com_ui_admin_settings' }`，執行時組出 `[aria-label="管理員設定"]`。
   - 不用在官方元件加 `data-guide`，同步 upstream 不會衝突。
   - 切換語言也不會壞。
   - 只有沒有穩定 aria-label 的元素才考慮加 `data-guide`，加了要記在 README 的官方檔案清單。
2. **AI 只能指定導覽 id，不能給 selector 或程式碼**：上傳的檔案或網頁內容可能夾帶提示注入，所以前端只接受登錄表裡有的 id，其他一律忽略。
3. **只標示、不代按**：導覽永遠不自動點擊或送出，按鈕一定由老師自己按。
4. **由老師按「開始導覽」才移動焦點**：避免老師還在讀回覆，焦點就被搶走（無障礙要求）。
5. **權限感知**：步驟標註需要的角色（例如管理員設定只有 ADMIN 看得到）。一般帳號問到時，回答「請聯絡管理員」，不開始導覽。
6. **第一版用文字標記，不用工具呼叫**：標記不需要後端，改 Agent 指示就能調整。之後要更穩定，再改成 Agent tool `show_guide(id)`，前端從工具呼叫事件取得 id。

### 驗收
- 每個導覽 id 用 Playwright 在真正的 LibreChat（管理員與一般帳號各一次）跑完全部步驟，斷言每一步都找得到目標。
  - 這組測試也是 **upstream 更新後的警報**：官方改了按鈕文字或位置，測試會先壞。
- 手機寬度、暗色主題、鍵盤操作（Tab／Esc）、螢幕報讀器唸出步驟。
- AI 回覆裡出現清單外的 id、或夾帶 selector，前端都不能有任何動作。

### 已決定
- 範圍包含老師日常操作（2026-10-03）。
- 示範頁與正式版共用 `registry.ts`（2026-10-03）。
