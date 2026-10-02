# 學校 AI 辦公室：操作說明

學校老師用的 AI 辦公室，建在 LibreChat 之上：像素風介面、全繁體中文，模型由「生生有 Token」提供。

## 啟動（只有一步）

**雙擊 repo 根目錄的 `start-school-ai-office.cmd`。**

它會自動完成全部事情，好了會自動打開瀏覽器到 http://localhost:3080 。

- **使用期間保持那個黑色視窗開著**；要結束就關掉視窗（資料庫與 LibreChat 會一起停止）。
- 已經在執行時再雙擊一次也沒關係，它會略過已啟動的部分。

### 第一次在新電腦上執行
同一個啟動檔會自動做這些事（只做一次）：

1. 安裝套件、編譯網頁（約 5～10 分鐘）。
2. 建立 `.env`（自動產生加密金鑰）與 `librechat.yaml`（學校版設定）。
3. **打開記事本請您填生生有金鑰**：在 `.env` 最後一行 `NMKING_API_KEY=` 後面貼上金鑰、存檔，再雙擊一次啟動檔。
4. 下載資料庫 MongoDB（約 600MB，會驗證檔案完整性）。

需要先裝好：**Node.js 22 以上**、**Git**。不需要 Docker。

## 第一次使用
1. 在登入頁按「註冊」，建立帳號（第一個註冊的帳號就是管理員）。
2. 左側「Agent」可以建立學校助手（例如校務助手、行事曆助手），模型選「NMKing／gpt-5.6-luna」。

## 像素辦公室面板
- 對話畫面右側的「辦公室」：每個學校助手（Agent）是一個像素角色。
- 老師送出問題時，對應的角色會顯示「思考中」；回覆完成後回到「待命」。
- 右上角的按鈕可以收合／展開（會記住您的選擇）。螢幕較窄（含手機）時預設收合，收合後不佔對話空間。

## 檔案在哪裡（都在這個 repo 裡）

| 東西 | 位置 | 會進 git 嗎 |
|---|---|---|
| 啟動檔 | `start-school-ai-office.cmd` | 會 |
| 啟動程式 | `school-ai-office/start.mjs` | 會 |
| 學校版設定範本 | `school-ai-office/librechat.school.yaml` | 會 |
| 實際設定 | `librechat.yaml` | 不會 |
| 金鑰與密碼 | `.env` | **不會**（不要分享、不要提交） |
| 資料庫程式與資料 | `.school-local/` | 不會 |
| 像素主題 | `client/src/themes/pixel.ts`、`client/src/style-pixel.css` | 會 |
| 像素字型（俐方體 11 號，免費可商用） | `client/public/fonts/Cubic_11.woff2` | 會 |
| 辦公室面板程式 | `client/src/components/SchoolOffice/` | 會 |
| 辦公室畫面（pixel-agents 編譯檔，MIT；學校版修改見其中 `VENDORED.md`） | `client/public/pixel-office/` | 會 |

## 常見問題

| 狀況 | 處理 |
|---|---|
| 對話出現「Missing API Key」 | `.env` 的 `NMKING_API_KEY` 沒填，或填完沒重開啟動檔 |
| 改了 `.env` 或 `librechat.yaml` 沒生效 | 關掉視窗、再雙擊啟動檔（設定只在啟動時讀取） |
| 改了介面程式（client） | 在 repo 根目錄執行 `npm.cmd run frontend` 後重開啟動檔 |
| 資料庫啟動失敗 | 看 `.school-local\mongod.log`（啟動檔已關閉會在本機崩潰的「診斷資料收集」功能） |
| 辦公室畫面沒更新（例如還看到英文 Idle） | 瀏覽器快取了舊檔：按 Ctrl+F5 強制重新整理 |

## 與生生有的相容性（2026-10-02 實測）
- 生生有的 chat/completions **串流模式會回錯誤**，所以學校版設定強制走 Responses API（`addParams.useResponsesApi: true`），這和生生有官方 Codex 設定的 `wire_api = "responses"` 一致。
- 模型清單目前只有 `gpt-5.6-luna`。

## 與 LibreChat 官方版的關係
這是 `LibreChat-AI/LibreChat` 的 fork。學校的修改盡量用「新增檔案」完成，以便持續合併官方的安全更新；動到官方檔案的只有 `client/src/App.jsx`（主題接入一行）、`client/src/main.jsx`（載入樣式一行）、`client/index.html`（favicon）、`client/public/assets/logo.svg`、`client/src/components/Chat/Presentation.tsx`（掛上辦公室面板，2 行）、`client/vite.config.ts`（打包辦公室畫面）、`.gitignore`。
