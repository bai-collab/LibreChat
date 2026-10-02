# pixel-office（內附第三方編譯產物）

- 來源：pixel-agents（MIT）`webview-ui` 編譯產物，commit 3537e14；角色素材 MetroCity（CC0）。
- 學校版修改（只有這些，重新匯入時要重做）：
  1. `index.html`：加入 `acquireVsCodeApi` shim（走 postMessage 與 LibreChat 溝通）、自動縮放置中、隱藏原本的工具列。
  2. `assets/index-D-OGLsbn.js`：角色閒置標籤 `Idle` → `待命`（唯一一處 `return\`Idle\``）。
- `data/`：由 pixel-agents asset pipeline 匯出的解碼素材與預設辦公室配置。
