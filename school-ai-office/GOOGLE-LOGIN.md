# 學校 AI 辦公室：開啟 Google Workspace 登入

讓老師用學校的 Google 帳號登入，不用另外記密碼。這只需要**改設定**，不需要改程式。

全部分成 5 個步驟，約 20 分鐘：

| 步驟 | 在哪裡做 | 誰做 |
|---|---|---|
| 1. 建立 Google 登入用的「用戶端」 | Google Cloud 網站 | 學校網域管理員 |
| 2. 填 `.env` | 這台電腦的記事本 | 管理 LibreChat 的人 |
| 3. 填 `librechat.yaml` | 這台電腦的記事本 | 同上 |
| 4. 重開並測試 | 瀏覽器 | 同上 |
| 5. 收尾：關閉密碼註冊（建議） | `.env` | 同上 |

> **目前的限制**：這份設定只適用於「在跑 LibreChat 的那台電腦上，用 http://localhost:3080 打開」。
> 要讓校內其他電腦也能登入，需要正式網址＋HTTPS，請看最後的「之後要給全校用」。

---

## 步驟 1：在 Google Cloud 建立 OAuth 用戶端

**請用學校網域的帳號操作**（例如 `admin@你的學校網域`），不要用個人 Gmail。
只有用學校帳號建立的專案，才能選「內部」，也就是只有學校帳號能登入。

### 1-1 建立專案
1. 打開 https://console.cloud.google.com/ ，確認右上角是學校帳號。
2. 點最上方的專案選單 →「新增專案」。
3. 專案名稱填 `school-ai-office`。「機構」要選學校網域（不是「無機構」）→「建立」。
4. 建好後，確認最上方的專案選單已切換到 `school-ai-office`。

### 1-2 設定同意畫面（Google Auth Platform）
1. 打開 https://console.cloud.google.com/auth/overview 。
   找不到的話，可以從左上選單 →「API 和服務」→「OAuth 同意畫面」進入。
2. 按「開始使用」，依序填寫：
   - **應用程式資訊**：應用程式名稱填 `學校 AI 辦公室`，使用者支援電子郵件選您的學校信箱。
   - **目標對象**：選 **「內部」**。
     沒有這個選項，代表專案不在學校機構底下，請回 1-1 用學校帳號重建。
   - **聯絡資訊**：填您的學校信箱。
   - 勾選同意政策 →「建立」。
3. 「資料存取（範圍）」**不用加任何東西**。登入只用到基本的 email、姓名、大頭照，Google 預設就允許。

### 1-3 建立用戶端，取得 ID 和密鑰
1. 在 Google Auth Platform 左側點「用戶端」→「建立用戶端」。
2. 應用程式類型選 **「網頁應用程式」**，名稱填 `LibreChat 本機`。
3. **已授權的 JavaScript 來源** → 新增 URI，填：
   ```
   http://localhost:3080
   ```
4. **已授權的重新導向 URI** → 新增 URI，填（要一字不差）：
   ```
   http://localhost:3080/oauth/google/callback
   ```
   - 用 `localhost`，不要寫 `127.0.0.1`。
   - 結尾不要加 `/`。
5. 按「建立」，畫面會出現 **用戶端 ID** 和 **用戶端密鑰**：
   - 兩個都先複製到安全的地方，也可以按「下載 JSON」存一份。
   - 用戶端密鑰等同密碼：不要貼到 LINE 群組或 email，也不要提交到 git。
6. 不需要啟用任何 API。Google 設定可能要等幾分鐘才生效。

---

## 步驟 2：填 `.env`

1. 先關掉啟動視窗（黑色視窗），讓 LibreChat 停止。
2. 用記事本打開 repo 根目錄的 `.env`，按 `Ctrl+F` 搜尋下面的名稱，改成這樣：
   ```ini
   ALLOW_SOCIAL_LOGIN=true
   ALLOW_SOCIAL_REGISTRATION=true

   GOOGLE_CLIENT_ID=貼上用戶端ID（結尾是 .apps.googleusercontent.com）
   GOOGLE_CLIENT_SECRET=貼上用戶端密鑰（通常 GOCSPX- 開頭）
   GOOGLE_CALLBACK_URL=/oauth/google/callback
   ```
   - `ALLOW_SOCIAL_LOGIN`：讓登入頁出現 Google 按鈕。
   - `ALLOW_SOCIAL_REGISTRATION`：讓還沒有帳號的老師，第一次用 Google 登入時自動建帳號。
   - `GOOGLE_CALLBACK_URL` 保持預設值，不用改。
   - 等號前後不要加空格，也不要加引號。
3. 順便確認這兩行是 `http://localhost:3080`，要和步驟 1-3 填的網址一致：
   ```ini
   DOMAIN_CLIENT=http://localhost:3080
   DOMAIN_SERVER=http://localhost:3080
   ```
4. 存檔。

---

## 步驟 3：填 `librechat.yaml`（限制只有學校網域）

1. 用記事本打開 repo 根目錄的 `librechat.yaml`。注意是根目錄這份，不是 `school-ai-office/` 裡的範本。
2. 檢查裡面有沒有 `registration:` 這一段：
   - **有**（2026-10-03 之後才第一次啟動的電腦）：把 `allowedDomains` 那兩行前面的 `# ` 刪掉，再換成學校網域。
   - **沒有**（更早就裝好的電腦）：在 `cache: true` 下一行貼上這段：
   ```yaml
   registration:
     socialLogins: ['google']
     allowedDomains:
       - '你的學校網域'
   ```
3. 網域怎麼填：學校 email `@` 後面的部分。
   例如老師信箱是 `wang@abc.tp.edu.tw`，就填 `'abc.tp.edu.tw'`。
   - 必須**完全相符**，不會自動包含子網域。
   - 老師和學生的網域不同時（例如 `abc.tp.edu.tw` 和 `st.abc.tp.edu.tw`），想開放的都要各列一行：
     ```yaml
     allowedDomains:
       - 'abc.tp.edu.tw'
       - 'st.abc.tp.edu.tw'
     ```
   - YAML 的縮排要用**空白**，不能用 Tab；`-` 要比 `allowedDomains` 多縮 2 格。
4. 存檔。

> 為什麼步驟 1 已經選了「內部」，這裡還要設？
> 這是雙重保護：「內部」是 Google 那邊擋，`allowedDomains` 是 LibreChat 這邊擋。
> 就算日後有人把 Google 設定改成「外部」，非學校帳號還是進不來。
> 設了 `allowedDomains` 之後，用 email 密碼註冊也只接受學校網域。

---

## 步驟 4：重開並測試

1. 雙擊 `start-school-ai-office.cmd`。
   如果視窗出現 `⚠ Google 登入：…` 的提醒，代表步驟 2 或 3 漏了某一項，照提醒修正後再重開。
2. 瀏覽器打開 http://localhost:3080 ，登入頁應該出現 **「使用 Google 登入」** 按鈕。
3. **測試 1：學校帳號**（應該成功）
   按「使用 Google 登入」→ 選學校帳號 → 會回到 LibreChat 並直接登入。
   如果這個帳號還沒有 LibreChat 帳號，會自動建立。
4. **測試 2：個人 Gmail**（應該失敗）
   先登出，再用個人 Gmail 試。Google 應該顯示「存取權遭到封鎖」或類似的訊息。
   這代表「內部」限制有效。
5. 兩項都符合，就完成了。

---

## 步驟 5：收尾（建議）

全部老師都改用 Google 登入後，建議關掉「用 email 密碼註冊」，避免有人繞過 Google：

```ini
ALLOW_REGISTRATION=false
ALLOW_EMAIL_LOGIN=true
```

- `ALLOW_REGISTRATION=false`：登入頁不再顯示「註冊」，新帳號只能透過 Google 建立。
- `ALLOW_EMAIL_LOGIN=true`：**保留**。第一個用密碼註冊的管理員帳號還要靠它登入，關掉會被鎖在外面。

改完記得重開啟動檔。

---

## 重要：已經用 email 密碼註冊的帳號

LibreChat 不會把「密碼帳號」和「Google 帳號」自動合併。
如果某位老師之前用 `wang@學校網域` 加密碼註冊過，現在改按 Google 登入，會**登入失敗**。
記錄檔 `api\logs\debug-日期.log` 會出現 `already exists with provider local`。

處理方式（擇一）：
- **繼續用原本的 email＋密碼登入**（最簡單，對話紀錄都在）。
- 之前的對話不重要的話，由管理員刪除該帳號，再請老師用 Google 重新登入。

管理員帳號建議維持用密碼登入。

---

## 常見問題

| 狀況 | 原因與處理 |
|---|---|
| 登入頁沒有 Google 按鈕 | `.env` 的 `ALLOW_SOCIAL_LOGIN` 不是 `true`、ID 或密鑰少填一個，或沒重開啟動檔。另外確認 `librechat.yaml` 的 `socialLogins` 有 `'google'`。 |
| Google 顯示「錯誤 400：redirect_uri_mismatch」 | 步驟 1-3 的重新導向 URI 和實際網址不一致。檢查 `http`、`localhost`、`3080` 和結尾斜線，並確認瀏覽器網址是 `localhost` 而不是 `127.0.0.1`。剛改完的話，等幾分鐘再試。 |
| Google 顯示「存取權遭到封鎖」（org_internal） | 用了非學校帳號。這是正常的限制。 |
| Google 顯示「invalid_client」 | `GOOGLE_CLIENT_ID` 或 `GOOGLE_CLIENT_SECRET` 貼錯，或多了空格。 |
| 選完 Google 帳號後又回到登入頁，沒有登入 | 打開 `api\logs\` 裡最新的 `debug-日期.log`，搜尋 `googleLogin`：<br>• `email domain not allowed` → 網域不在 `allowedDomains`，或拼錯<br>• `social registration is disabled` → `ALLOW_SOCIAL_REGISTRATION` 不是 `true`<br>• `already exists with provider local` → 見上一節「已經用 email 密碼註冊的帳號」 |
| 改了設定沒生效 | 關掉啟動視窗再雙擊一次（設定只在啟動時讀取）。 |

---

## 之後要給全校用（目前尚未做）

現在只有「跑 LibreChat 的那台電腦」能用 Google 登入，因為：
- Google 只接受 `http://localhost` 或 **HTTPS 正式網址** 當作登入回來的網址。
- 校內網路位址（例如 `http://192.168.1.20:3080`）**不被接受**。

要讓全校使用，需要另外完成：
1. 準備一個正式網址（例如 `ai.你的學校網域`）和 HTTPS 憑證，讓 LibreChat 能從校內其他電腦連線。
2. 把 `.env` 的 `DOMAIN_CLIENT`、`DOMAIN_SERVER` 改成這個網址，`HOST` 改成 `0.0.0.0`。
3. 回 Google Cloud 步驟 1-3，在同一個用戶端**再加一組**來源與重新導向 URI：
   `https://ai.你的學校網域`、`https://ai.你的學校網域/oauth/google/callback`。

這部分牽涉學校網路與資安規定，需要另外規劃。
