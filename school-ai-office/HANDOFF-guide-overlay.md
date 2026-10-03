# 交接手冊：AI 操作導覽正式版（GuideOverlay）

> 給本機開發 session（人或 AI）。日期 2026-10-03。
> 先讀 `school-ai-office/DEVELOPMENT.md`（尤其第 2 節必守規則、第 10 節導覽設計），再讀本檔。
> 本檔只講「這一件事怎麼做」。

---

## 0. 開場提示詞（貼給本機的 Claude Code）

```text
請讀 school-ai-office/HANDOFF-guide-overlay.md 和 school-ai-office/DEVELOPMENT.md，
依交接手冊的階段 S0 → S6 實作「AI 操作導覽正式版」。
每完成一個階段就停下來，回報做了什麼、跑了哪些檢查、結果如何，等我確認再做下一階段。
回覆一律繁體中文。
```

---

## 1. 同步程式碼

雲端 session 的改動在分支 `claude/beautiful-newton-lwzv2v`，PR 是 [bai-collab/LibreChat#1](https://github.com/bai-collab/LibreChat/pull/1)（合併目標 `school/pixel-theme-zh-hant`）。

```bat
cd 您的 LibreChat 資料夾
git fetch origin
git checkout claude/beautiful-newton-lwzv2v
git pull
git checkout -b school/guide-overlay
npm.cmd ci
```

- 正式版在新分支 `school/guide-overlay` 開發，不要直接改 `claude/beautiful-newton-lwzv2v`。
- 如果 PR #1 已經合併，就改從 `school/pixel-theme-zh-hant` 開新分支。
- `npm.cmd ci` 只在第一次或套件有變動時需要。

---

## 2. 現況：已經有什麼

| 項目 | 位置 | 狀態 |
|---|---|---|
| 導覽登錄表（唯一來源） | `client/src/components/SchoolGuide/registry.ts`、`types.ts` | ✅ 7 個導覽、39 步 |
| 步驟文字 | `client/src/locales/en`、`zh-Hant` 的 `com_ui_school_guide_*` | ✅ |
| 示範頁 | `school-ai-office/guide.html`（由 `build-guide.mjs` 產生） | ✅ 已用 Playwright 測過 |
| 產生器 | `school-ai-office/build-guide.mjs`（`--check` 檢查一致） | ✅ |
| **正式版**（真正的 LibreChat 畫面上加框） | `client/src/components/SchoolGuide/` 其餘檔案 | ❌ 本次任務 |

- **還沒驗證：** 登錄表每一步的 `target`（正式版找元素的方式）是讀程式碼推出來的，**還沒在真正的 LibreChat 上跑過**，所以 S0 要先驗證。
- 導覽清單：

  | 對象 | 導覽 id |
  |---|---|
  | 老師日常 | `start-chat`、`upload-file`、`create-agent`、`find-chat` |
  | 管理員 | `share-agent`、`allow-sharing`、`google-login` |

---

## 3. 要做出來的使用者體驗

**情境 A：問 AI**
1. 老師在對話中選「操作導覽」助手，問「怎麼上傳 PDF 讓 AI 摘要？」。
2. 助手用文字回答，並附上一個連結：`▶ 開始導覽：上傳檔案讓 AI 讀`。
3. 老師點連結，畫面角落出現步驟卡（第 1／4 步＋說明），真正的迴紋針按鈕被**粗框**圍住並取得焦點。
4. 老師自己按迴紋針，導覽自動進到第 2 步，框移到「以文字形式上傳」。
5. 做完最後一步，或按 Esc，導覽結束，焦點回到原本的位置。

**情境 B：不問 AI，直接打開導覽清單**
1. 畫面上有「操作導覽」按鈕，打開後列出可用的導覽（一般老師看不到管理員導覽）。
2. 點一項，從第 1 步開始，之後和情境 A 一樣。

**原則：** 導覽只標示、不代按。每一個按鈕都是老師自己按的。

---

## 4. 實作階段

每個階段做完都要停下來回報。

### S0：先驗證登錄表的定位（最重要，先做）
- **為什麼先做：** 定位錯了，後面的 overlay 再漂亮也框不到東西。
- **做法：** 新增 `e2e/specs/school-guide.spec.ts`。
  - 用管理員帳號、一般帳號各登入一次。
  - 對 `schoolGuides` 每個導覽、每一步：照步驟真的操作到那個畫面（例如先點側邊欄、打開分享對話框），再用該步的 `target` 找元素，斷言**找得到而且看得見**。
  - `target: null` 的步驟（例如在選單裡選某個 Agent、點某則對話）略過。
  - `external` 的步驟（Google Cloud、`.env`、yaml）略過。
- **定位方式怎麼解讀**（S1 會實作成共用函式，S0 可以先在測試裡寫一份）：

  | 種類 | 對應 |
  |---|---|
  | `testId` | `[data-testid="…"]` |
  | `id` | `#…` |
  | `labelKey` | `[aria-label="<該 key 的目前語言文字>"]` |
  | `labelPrefixKey` | aria-label 以「該 key 去掉 `{{0}}` 後的文字」開頭 |
  | `placeholderKey` | `[placeholder="…"]` |
  | `labelledByKey` | 先找文字等於該 key 的元素，取它的 id，再找 `[aria-labelledby~="那個 id"]` |
  | `role`＋`textKey` | `[role="…"]` 且文字等於該 key |
  | `within: 'dialog'` | 只在 `[role="dialog"]` 裡找 |

- **已知可疑點**（S0 要特別確認）：
  1. `nav-panel-agents`、`nav-panel-conversations` 這兩個 testId 在 `UnifiedSidebar/ExpandedPanel.tsx`。側邊欄**收合**時是否也存在？不存在的話，要補收合狀態的定位方式。
  2. `share-agent` 第 5 步（權限選單）用 `com_ui_role_viewer_desc` 當 aria-label。實際的 aria-label 可能是另外傳入的文字，對不上就改。
  3. `allow-sharing` 第 3 步的 `labelledByKey`，要確認 `AdminSettingsDialog` 的角色選單真的用 `aria-labelledby`。
  4. 送出按鈕 `send-button` 在輸入框是空的時候可能是 disabled，或者不存在。
- **完成條件：** 測試全部通過。登錄表若有改動，要重跑 `node school-ai-office/build-guide.mjs`，再跑 `--check`。

### S1：定位函式 `locate.ts`
- 新增 `client/src/components/SchoolGuide/locate.ts`：

  ```ts
  findTarget(locators: GuideLocator[], localize: (key: TranslationKeys) => string, root?: ParentNode): HTMLElement | null
  ```

  - 純函式，依序嘗試，回傳第一個**看得見**的元素。
- 屬性值要用 `CSS.escape`，避免文字裡的引號弄壞選擇器。
- **完成條件：** `__tests__/locate.spec.ts` 用 jsdom 涵蓋每一種定位方式，以及找不到時回傳 `null`。

### S2：狀態（Jotai）
- 新增 `client/src/components/SchoolGuide/store.ts`：`activeGuideAtom = atom<{ id: string; step: number } | null>(null)`。
- **規則：** 新狀態一律用 Jotai（見根目錄 `AGENTS.md` 的 Client state ownership），不要用 Recoil。導覽狀態只在這個功能內讀寫。
- 不需要持久化：重新整理頁面後導覽結束是合理的。

### S3：`GuideOverlay.tsx`
- **加框方式：** 在目標上方畫一個 `position: fixed`、`pointer-events: none` 的框，用 `getBoundingClientRect` 對齊。
  - 用 `ResizeObserver`、捲動和視窗大小事件更新位置。
  - **不要**直接替目標元素加 class：React 重新渲染時可能把 class 洗掉，而且等於改了官方元件的外觀。
- **找不到目標時：**
  - 步驟卡顯示「請先完成上一步」，並用 `MutationObserver` 等元素出現（例如老師打開對話框後），出現就自動加框。
  - **不要**替老師點開任何東西。
- **前進：** 老師點了目標元素（document 層級的 capture 監聽，判斷 `target.contains(event.target)`），就前進到下一步。另外提供「下一步」「上一步」「結束」按鈕。
- **焦點：**
  - 開始時記住原本的 `document.activeElement`。
  - 每一步把焦點移到目標（`preventScroll`，再 `scrollIntoView({ block: 'nearest' })`）。
  - 結束或按 Esc 時，焦點還回去。
- **無障礙：**
  - 步驟卡要有 `role="dialog"`、`aria-modal="false"`、`aria-live="polite"`，唸出「第 n 步：…」。
  - 尊重 `prefers-reduced-motion`：沒有閃爍動畫，捲動不用 smooth。
- **權限：**
  - 一般帳號開到 `audience: 'admin'` 的導覽時，不開始導覽，改顯示「這項需要管理員操作」。
  - 判斷依據是使用者角色 `SystemRoles.ADMIN`。
- **外觀：**
  - 用 `@librechat/client` 的元件和語意色彩，例如 `border-border-heavy`、`bg-surface-primary`、`text-text-primary`。**不要**寫死顏色（見 `AGENTS.md` 的 Frontend theming）。
  - 粗框用語意 token，例如 ring 色或 accent 色，讓像素主題和一般主題都正常。
- **文字：** 一律 `useLocalize()`。新字串只加在 en 和 zh-Hant 開頭的 `com_ui_school_guide_*` 區塊，例如「下一步」「結束」「請先完成上一步」「這項需要管理員操作」。
- **掛載：** 在 `client/src/components/Chat/Presentation.tsx` 的 `<OfficePanel />` 旁邊加一行 `<GuideOverlay />`。這是唯一要動的官方檔案，改完要記到 `school-ai-office/README.md` 的「與 LibreChat 官方版的關係」。

### S4：觸發方式
1. **AI 回覆裡的連結：** 助手回覆 Markdown 連結 `[▶ 開始導覽：標題](#guide:<id>)`。
   - 新增 `useGuideLinks.ts`：在 document 用 capture 監聽 click。`href` 以 `#guide:` 開頭時，`preventDefault()` 加上 `stopPropagation()`，再查登錄表。
   - **id 不在登錄表就忽略**，不做任何事。
   - 讀程式碼確認過的事：
     - `MarkdownComponents.tsx` 的連結元件會加 `target="_blank"`，所以一定要攔截，不然會開新分頁。
     - react-markdown 預設的網址過濾應該會保留 `#guide:…` 這種 hash 連結。這一點**要在 S4 實測確認**。
   - 這個做法不用改官方的 Markdown 元件，而且開始導覽是老師自己點的，符合「不搶焦點」。
2. **導覽清單入口：** 新增 `GuideLauncher.tsx`，打開後依「老師日常／管理員」分組列出導覽，一般帳號看不到管理員組。
   - 入口放在辦公室面板（`client/src/components/SchoolOffice/OfficePanel.tsx`，學校自己的檔案）右上角，或另一個不需要改官方檔案的位置。決定前先問使用者。
- **完成條件：** 用元件測試涵蓋三種情況：點合法連結會開始導覽、點非法 id 沒有任何動作、清單依角色過濾。

### S5：「操作導覽」助手
- `build-guide.mjs` 加 `--agent-prompt` 選項，從登錄表輸出一段可以直接貼進 Agent「指示」欄的文字，內容包含：
  - 每個導覽的 id、標題、摘要、對象。
  - 回覆規則：
    - 先用文字簡短回答。
    - 有對應導覽時，在最後附上一行 `[▶ 開始導覽：<標題>](#guide:<id>)`。
    - 只能用清單裡的 id，沒有對應的就不要附連結。
    - 一般老師問到管理員操作時，請他聯絡管理員。
- 管理員在 LibreChat 建立「操作導覽」助手，把輸出貼進「指示」，再分享給全校老師。可以在分享對話框開「公開」；管理員本來就有公開分享的權限。
- 步驟寫進 `school-ai-office/README.md`。
- 登錄表改了以後，要重新產生指示文字，再貼一次。這件事要寫進 `DEVELOPMENT.md` 第 10 節「新增或修改導覽」。

### S6：收尾檢查與文件
- 更新 `DEVELOPMENT.md` 第 10 節（把正式版從「規劃中」改成現況）、`README.md`（操作導覽怎麼用），以及本檔最後的「進度」。
- 跑完第 6 節的全部檢查，依第 7 節的格式回報。

---

## 5. 必守規則（違反就重做）

1. **導覽只標示、不代按：** 不呼叫目標元素的 `click()`，也不送出表單。
2. **只接受登錄表裡的 id：** AI 回覆裡的任何 selector、程式碼或未知 id，一律忽略。上傳的檔案可能夾帶提示注入。
3. **不在官方元件加屬性：** 定位只靠既有的 `data-testid`、id、語系 key。真的沒有辦法時才加 `data-guide`，加了要記到 README。
4. **官方檔案只動 `Presentation.tsx` 一行：** 其餘都放在 `client/src/components/SchoolGuide/`。
5. 新狀態用 Jotai；文字用 `useLocalize()`；顏色用語意 token；支援暗色和 reduced motion。
6. 登錄表改了，就要跑 `build-guide.mjs`，讓示範頁保持一致。
7. 只推到 `bai-collab/LibreChat`，不要對官方 LibreChat-AI/LibreChat 開 PR 或 issue。合回 main 前先問使用者。

---

## 6. 檢查指令（Windows）

```bat
:: 型別檢查（client 有改就跑；注意 client 的 tsconfig 不檢查 *.spec / *.test）
cd client && npx.cmd tsc --noEmit && cd ..

:: 單元／元件測試（從 client 跑，只跑相關檔案）
cd client && npx.cmd jest src/components/SchoolGuide && cd ..

:: import 排序（只傳改過的檔案，不要不帶參數）
npm.cmd run sort-imports -- client/src/components/SchoolGuide client/src/components/Chat/Presentation.tsx

:: 登錄表與示範頁一致
node school-ai-office/build-guide.mjs --check

:: 靜態檢查（含未使用的語系 key）
npm.cmd run static-checks -- --against origin/school/pixel-theme-zh-hant

:: 重編前端，再用啟動檔實測
npm.cmd run frontend

:: S0 的 e2e（需要 LibreChat 已啟動，並準備好管理員與一般帳號）
npx.cmd playwright test --config=e2e/playwright.config.local.ts e2e/specs/school-guide.spec.ts
```

- 改了 `Presentation.tsx`，會影響對話頁的載入。`AGENTS.md` 建議跑 `npm.cmd run lighthouse`，若本機跑不起來，要在回報裡說明。
- `build-guide.mjs` 需要 Node 22.18 以上；較舊的 22.x 請加 `--experimental-strip-types`。

---

## 7. 每個階段的回報格式

```text
階段：S?
做了什麼：（改了哪些檔案、為什麼）
跑了哪些檢查：（指令＋結果，失敗要貼輸出）
實測：（瀏覽器操作了什麼、看到什麼）
沒做／沒驗證到的：（說清楚原因）
需要使用者決定的：（如果有）
```

---

## 8. 已知風險

| 風險 | 處理 |
|---|---|
| 官方更新改了按鈕文字或 testId，導覽框不到 | S0 的 e2e 測試就是警報。每次合併官方更新後都要跑 |
| AI 編造不存在的導覽 id | 前端忽略；指示文字裡明列可用的 id |
| 導覽進行中，老師切換對話或換頁 | 目標找不到就顯示「請先完成上一步」，不要報錯。換頁時保留目前步驟，讓老師可以繼續或結束 |
| 側邊欄收合，或手機寬度 | S0 要涵蓋 390px 寬度。框的位置要跟著目標更新 |
| 像素主題的 `border-radius: 0 !important` 影響框的外觀 | 框本來就是直角，不受影響；確認一般主題也正常 |

---

## 9. 進度（每完成一個階段就更新）

- [ ] S0 驗證登錄表定位
- [ ] S1 定位函式
- [ ] S2 狀態
- [ ] S3 GuideOverlay
- [ ] S4 觸發（連結＋清單入口）
- [ ] S5 操作導覽助手
- [ ] S6 收尾與文件
