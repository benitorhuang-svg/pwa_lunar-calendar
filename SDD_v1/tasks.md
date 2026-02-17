# 任務清單：農民曆 PWA — 沉浸式時間藝術品

**輸入**：來自 `SDD_v1/` 的設計文件  
**前置需求**：plan.md（必填）、spec.md（必填）、constitution.md（必填）

**性質**：Brownfield（漸進式強化）——專案已有完整可運作之程式碼基礎。本任務清單為系統化的盤點、驗證與強化路線圖，而非從零建置。

**組織方式**：任務依 User Story 分組，以便每個 Story 可獨立實作與測試。

## 格式：`[ID] [P?] [Story] Description`

- **[P]**：可平行執行（不同檔案、無相依性）
- **[Story]**：此任務所屬的 User Story（如 US1、US2、US3）
- 描述中請包含精確的檔案路徑

## 路徑命名慣例

- **原始碼**：`src/scripts/{feature}/`, `src/styles/`, `src/components/`
- **靜態資源**：`public/assets/`
- **設定檔**：根目錄 `astro.config.mjs`, `tsconfig.json`, `package.json`
- **設計文件**：`SDD_v1/`

---

## 階段 1：專案基礎設施盤點與驗證（共用基礎設施）

**目的**：確保專案骨架、依賴關係與品質工具鏈完整就緒，為後續所有 User Story 的實作/驗證提供穩固基礎。

- [x] T001 [P] 驗證 TypeScript 編譯設定：確認 `tsconfig.json` 中 `@/` 路徑別名正確指向 `src/`，`strict` 模式啟用，`target` 為 ES2022+。路徑：`tsconfig.json`
- [x] T002 [P] 驗證 ESLint 品質門檻：執行 `npm run lint`，確保 Zero Errors。修復任何已知的 lint 違規。路徑：`eslint.config.js`
- [x] T003 [P] 驗證 Ruff 品質門檻：執行 `ruff check .` 對所有 Python 腳本 (`scripts/`)，確保 Zero Errors。路徑：`pyproject.toml`, `scripts/`
- [x] T004 驗證全域型別契約完整性：檢查 `src/scripts/types.ts` 中所有 CustomEvent Payload 型別定義是否與 `plan.md` 事件契約清單一致。確認無 `any` 型別使用。路徑：`src/scripts/types.ts`
- [x] T005 [P] 驗證 Astro 建置配置：確認 `astro.config.mjs` 中 PWA 設定 (`@vite-pwa/astro`) 正確，`autoUpdate` 策略啟用。路徑：`astro.config.mjs`
- [x] T006 [P] 驗證資源清單生成腳本：執行 `scripts/generate-gallery-manifest.js` 與 `scripts/generate-audio-manifest.js`，確認輸出與 `src/scripts/generated/` 下的 manifest 一致。路徑：`scripts/`, `src/scripts/generated/`

**檢查點**：基礎設施驗證完畢——所有品質門檻通過，型別契約與建置流程正常運作。

---

## 階段 1.5：狀態機核心重構（UI 流暢度優化）🔥

**目的**：解決代碼審閱中發現的 6 個關鍵問題（見 plan.md §代碼審閱發現與優化建議），從根本上改善模式轉換的原子性、一致性與流暢度。此階段為後續所有 UI 功能驗證的前提。

**獨立測試**：在 Chrome DevTools Performance 面板錄製模式切換過程，確認零 Layout Shift；高頻壓力測試模式按鈕（≤100ms 間隔連續點擊 20 次），確認應用穩定。

### 1.5A — FSM 轉移守衛與轉移鎖

- [x] T200 [US*] 實作合法轉移路徑表 (Transition Table)：在 `stateManager.ts` 或新建 `src/scripts/app/transitionTable.ts` 中定義 `VALID_TRANSITIONS: Record<AppMode, AppMode[]>`，列出每個模式允許的目標模式。
    - 依據：plan.md §1.2 合法轉移路徑表
    - 路徑：`src/scripts/app/stateManager.ts`
    - 驗收：嘗試非法轉換（如 `Calendar → Zen`），`console.warn` 輸出警告且轉換不發生。

- [x] T201 [US*] 實作轉移鎖 (Transition Lock) 與佇列機制：在 `eventOrchestrator.ts` 的 `transitionMode()` 中加入 `isTransitioning` 鎖與 `transitionQueue: AppMode[]` 佇列。鎖定期間新請求排入佇列，當前轉換完成後自動處理佇列首項。
    - 依據：plan.md §1.3 轉移生命週期
    - 路徑：`src/scripts/app/eventOrchestrator.ts`
    - 驗收：高頻壓力測試（≤100ms 間隔連續點擊模式按鈕 20 次），應用不崩潰、最終穩定在正確模式。

### 1.5B — Body Class 原子替換

- [x] T202 [US*] 重構 `stateManager.setMode()` 為原子 Class 替換：移除當前「先清空全部 class → 再添加新 class」的寫法。改為根據 `from → to` 的轉換路徑，在 `requestAnimationFrame` 內「先 add 新 class → 後 remove 舊 class」。
    - 依據：plan.md §2.1 原子 Class 替換表
    - 路徑：`src/scripts/app/stateManager.ts`
    - 驗收：Chrome Performance 面板錄製 Calendar→Artwork 轉換，逐幀檢查確認無中間幀缺少 class。CLS 指標為 0。

- [x] T203 [P] [US*] 定義 `TRANSITION_CLASS_MAP` 常量：建立 `Record<string, { add: string[], remove: string[] }>` 映射表，key 為 `"from->to"` 格式。
    - 依據：plan.md §2.1 Atomic Class Swap Table
    - 路徑：`src/scripts/app/stateManager.ts` 或 `src/scripts/app/transitionTable.ts`
    - 驗收：涵蓋所有 8 條合法轉換路徑，每條路徑的 add/remove 集合正確。

### 1.5C — 轉換生命週期整合

- [x] T204 [US*] 實作四階段轉換生命週期：將 `modeHandler.applyModeSideEffects()` 拆分為 `beforeExit(from)` / `beforeEnter(to)` / `performTransition()` / `afterEnter(to)` 四個獨立方法，確保副作用在正確階段執行。
    - 依據：plan.md §1.3 轉移生命週期 + §6 轉換副作用清單
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：
        - `beforeExit` 階段：計時器已清除、面板已關閉
        - `performTransition` 階段：所有 DOM 更新在同一 rAF 內
        - `afterEnter` 階段：新計時器啟動、`mode-changed` 事件發送

- [x] T205 [US*] 清理面板狀態洩漏：在 `stateManager.setMode()` 中，對非 panel-friendly 模式（`artwork`, `zen`, `welcome`）主動將 `activePanel` 設為 `null` 並同步 `body[data-active-panel]`。
    - 依據：plan.md §發現 4
    - 路徑：`src/scripts/app/stateManager.ts`
    - 驗收：在 Calendar（今日面板開啟狀態）→ Artwork 轉換後，`stateManager.getState().activePanel` 為 `null`。

### 1.5D — IdleManager 重構

- [x] T206 [US*] 重構 IdleManager 為三域計時器架構：將當前的 `idleTimer` + `artworkTimer` 雙計時器拆分為 `welcomeTimer` / `zenTimer` / `artworkSlideTimer` 三個獨立計時器域，各有獨立的啟動/清除/重置邏輯。
    - 依據：plan.md §1.4 IdleManager 重構方案
    - 路徑：`src/scripts/hero/idleManager.ts`
    - API 變更：
        - 新增 `activateForMode(mode: AppMode): void`
        - 新增 `deactivateAll(): void`
        - 改名 `reset()` → `resetInteraction()` (語義明確)
        - 新增 `pauseSlideTimer()` / `resumeSlideTimer()`
    - 驗收：
        - Welcome 模式：僅 `welcomeTimer` (6s) 活躍，`artworkSlideTimer` 不活躍
        - Artwork 模式：`zenTimer` (15s) 與 `artworkSlideTimer` (5s) 同時活躍
        - 使用者互動：僅重置閒置計時器，不影響 `artworkSlideTimer`
        - 無 200ms debounce hack（移除 `lastToggleTime`)

- [x] T207 [US*] 移除 IdleManager 中的 200ms debounce hack：轉移鎖（T201）取代了 debounce hack 的功能。移除 `lastToggleTime` 欄位與 200ms 時間檢查邏輯。
    - 路徑：`src/scripts/hero/idleManager.ts`
    - 驗收：`lastToggleTime` 相關代碼已移除，快速模式切換仍穩定（由轉移鎖保障）。

### 1.5E — UI 可見性統一化

- [x] T208 [US*] 統一 UI 元素可見性控制為 CSS-driven：將 `modeUIManager.ts` 與 `layoutManager.ts` 中透過 `style.display` / `style.opacity` 控制的模式相關可見性邏輯，遷移至 CSS 層透過 body class 後代選擇器統一控制。JS 層僅負責切換 body class。
    - 依據：plan.md §發現 6
    - 需新增/修改的 CSS 規則：

        ```css
        /* Hero Header 可見性 */
        body.immersion-mode:not(.mode-artwork) .hero-header {
            opacity: 0;
            pointer-events: none;
        }
        body.mode-artwork .hero-header .hero-info-strip {
            opacity: 0;
            pointer-events: none;
        }

        /* Dock 可見性 */
        body.initial-welcome .hero-dock-wrapper,
        body.immersion-mode:not(.mode-artwork) .hero-dock-wrapper {
            opacity: 0;
            pointer-events: none;
        }

        /* 年月按鈕可見性 */
        body.mode-artwork #btnYearMonth {
            display: none;
        }
        ```

    - 路徑：`src/styles/global.css`（或 `hero/` 子目錄）, `src/scripts/hero/ui/modeUIManager.ts`, `src/scripts/hero/ui/layoutManager.ts`
    - 驗收：`modeUIManager.ts` 中不再直接操作 `style.display` 或 `style.opacity` 來控制模式相關的可見性。

### 1.5F — 型別安全修補

- [x] T209 [P] [US*] 消除 `RenderHeroDetail.lunar` 的 `any` 型別：定義 `LunarData` interface 擷取 Lunar 物件所需的公開方法簽名，或重構 import 路徑解決循環依賴。
    - 依據：plan.md §發現 5 + 憲章 §III
    - 路徑：`src/scripts/types.ts`, `src/scripts/core/lunar.ts`
    - 驗收：`grep -r 'any' src/scripts/types.ts` 結果為 0。

### 1.5G — Fullscreen 生命週期整合

- [x] T210 [US3] 將 Fullscreen 邏輯從 `uiManager.bindBackgroundClick()` 遷移至轉換生命週期：
    - 移除 `uiManager.ts` 中 `bindBackgroundClick()` 內的 `this.toggleFullscreen(true/false)` 呼叫
    - 在 `modeHandler.applyModeSideEffects()` 重構為四階段生命週期後，於 `afterEnter("zen")` 中執行 `requestFullscreen()`，於 `afterEnter("artwork")` 中執行 `exitFullscreen()`（僅在 `from === "zen"` 時）
    - 依據：plan.md §8 Fullscreen 生命週期整合方案 + 憲章 §II Fullscreen 生命週期整合原則
    - 路徑：`src/scripts/hero/uiManager.ts`, `src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：`grep -r "requestFullscreen\|exitFullscreen" src/scripts/` 僅出現在 modeHandler.ts 或專用 transition lifecycle 模組中。

- [x] T211 [US3] 為 `fullscreenchange` listener 加入轉移鎖守衛：
    - 在 `fullscreenchange` handler 中檢查 `isTransitioning` 狀態
    - 若鎖定中，將 `transition-mode: artwork` 請求排入佇列
    - 若未鎖定，正常 dispatch `transition-mode`
    - 依據：plan.md §8 fullscreenchange 事件守衛
    - 路徑：`src/scripts/hero/uiManager.ts` (遷移至 modeHandler.ts)
    - 驗收：在 Artwork→Zen 轉換動畫進行中按 Esc，不會產生雙重轉換或 console error。

### 1.5H — 事件語義修正

- [x] T212 [US*] 重構 `toggle-grid` 事件語義：
    - 將 `eventOrchestrator.ts` 中 `toggle-grid` handler 的模式切換邏輯移至按鈕 handler 層
    - `btnDay` 點擊時：直接 dispatch `transition-mode` 事件（Calendar→Artwork 或 Artwork→Calendar）
    - `toggle-grid` 事件回歸純粹的日曆網格顯示/隱藏功能
    - 依據：plan.md §9 toggle-grid 事件語義重新定義
    - 路徑：`src/scripts/app/eventOrchestrator.ts`, `src/scripts/hero/eventHandlers.ts`
    - 驗收：`toggle-grid` handler 中不再包含 `transition-mode` dispatch。

### 1.5I — Background Click 模式守衛

- [x] T213 [US*] 在背景 click handler 加入模式守衛：
    - 在 `bindBackgroundClick()` 的 handler 開頭加入 `if (currentMode === "welcome") return;`
    - 移除對 `#welcomeInteractionOverlay` 的 CSS selector 依賴
    - 依據：plan.md §11 事件衝突與冒泡控制矩陣
    - 路徑：`src/scripts/hero/uiManager.ts`
    - 驗收：Welcome 模式下隨意點擊不觸發 background handler。

### 1.5J — inline style 清除

- [x] T214 [US*] 清除 `layoutManager.updatePanelsForType()` 中的 inline style 操作：
    - 將 `style.opacity` / `style.display` / `style.pointerEvents` 操作改為設置 `body[data-active-panel]` 屬性
    - 新增對應的 CSS 規則：`body[data-active-panel="today"] .hero-header { opacity: 0; pointer-events: none; }`
    - 依據：plan.md §發現 10 + 憲章 §II 可見性單一控制源
    - 路徑：`src/scripts/hero/ui/layoutManager.ts`, `src/styles/global.css`
    - 驗收：`layoutManager.ts` 中不再包含 `style.opacity =` 或 `style.pointerEvents =` 的模式相關操作。

- [x] T215 [P] [US*] 清除 `modeUIManager.updateArtworkModeUI()` 中的 inline style 操作：
    - 將 `infoStrip.style.opacity`、`toggleBtn.style.display`、`yearMonthBtn.style.display` 等操作遷移至 CSS 規則
    - 新增：`body.mode-artwork .hero-info-strip { opacity: 0; pointer-events: none; }`
    - 新增：`body.mode-artwork #btnYearMonth { display: none; }`
    - 依據：plan.md §發現 10
    - 路徑：`src/scripts/hero/ui/modeUIManager.ts`, `src/styles/hero/` 或 `src/styles/global.css`
    - 驗收：`modeUIManager.ts` 中 `updateArtworkModeUI()` 不再包含 `style.opacity =` / `style.display =`。

### 1.5K — 錯誤恢復機制

- [x] T216 [US*] 實作轉換錯誤恢復與回滾機制：
    - 在四階段轉換生命週期外層包裹 try/catch/finally
    - catch 中呼叫 `forceRecovery("calendar")` 強制回滾至 Calendar 模式
    - finally 中無條件釋放轉移鎖並處理佇列
    - 依據：plan.md §12 錯誤恢復與回滾策略
    - 路徑：`src/scripts/app/eventOrchestrator.ts` 或 `src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：DevTools Console 中故意 inject 異常至 `performTransition()`，應用自動恢復至 Calendar，轉移鎖釋放。

**檢查點**：狀態機核心重構完成——所有模式轉換使用原子 class 替換、四階段生命週期、轉移鎖、三域計時器。Fullscreen 邏輯整合至生命週期。inline style 清除。事件語義修正。壓力測試通過，CLS 為 0。

---

## 階段 2：User Story 1 — 智能儀式啟動與歡迎體驗 (Priority: P1) 🎯 MVP

**目標**：驗證並強化從載入畫面到歡迎卡片浮現的完整儀式流程，確保首屏體驗的穩定性與流暢度。

**獨立測試**：在全新瀏覽器環境（無快取）下開啟首頁，驗證進度條→歡迎卡片→閒置自動轉場的完整流程。

### US1 — 資源載入器驗證與優化

- [x] T010 [US1] 驗證 ResourceLoader 加權進度追蹤邏輯：確認六段權重（核心腳本 15%、首圖 25%、字體 15%、輪播圖 15%、音訊 10%、SW 20%）正確累加至 100%。
    - 路徑：`src/scripts/app/resourceLoader.ts`
    - 驗收：進度條從 0% 均勻推進至 100%，無跳躍或卡頓。

- [x] T011 [US1] 驗證邏輯門鎖 (Logic Gate) 機制：進度條不得在收到 `app-logic-ready` 事件前跑滿 100%。
    - 路徑：`src/scripts/app/resourceLoader.ts`
    - 驗收：移除 `app-logic-ready` 發送線，觀察進度條是否卡在 <100%。

- [x] T012 [US1] 驗證 8 秒超時保護：模擬極慢網路環境（Chrome DevTools → Slow 3G），確認 8 秒後強制進入應用。
    - 路徑：`src/scripts/app/resourceLoader.ts`
    - 驗收：8 秒後進度條強制到 100%，遮罩溶解正常。

- [x] T013 [P] [US1] 驗證首圖確定性預載：確認 `imageManager.ts` 中當季首張圖片（如 `spring/1.webp`）路徑與 `index.astro` 開場背景路徑完全一致。
    - 路徑：`src/scripts/hero/imageManager.ts`, `src/pages/index.astro`
    - 驗收：無首圖閃爍（前後路徑一致）。

- [x] T014 [P] [US1] 驗證平行預熱 (Parallel Warming)：確認 `imageManager.ts` 使用 `Promise.all` 併發預載所有季節圖片，而非序列 for-loop。
    - 路徑：`src/scripts/hero/imageManager.ts`
    - 驗收：Network 面板顯示圖片請求同時發出。

### US1 — 歡迎模式 (Welcome Mode) 狀態驗證

- [x] T015 [US1] 驗證歡迎模式啟動序列：`AppController` 啟動後發送 `transition-mode: { to: 'welcome' }`，確認 body 加入 `initial-welcome` + `immersion-mode` 類別。
    - 路徑：`src/scripts/app/appController.ts`, `src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：DevTools Elements 面板確認 body class 正確。

- [x] T016 [US1] 驗證載入→歡迎零時差同步：確認 `loader-finished` 事件觸發後，載入遮罩溶解（opacity → 0）與歡迎卡片浮現（opacity 0→1, 2.2s 過渡）同步啟動。
    - 路徑：`src/styles/splash.css`, `src/components/Hero/WelcomeOverlay.astro`
    - 驗收：無空白間隙（載入消失但歡迎未出現）。

- [x] T017 [US1] 驗證歡迎模式可見性矩陣：確認在 Welcome 模式下：
    - ✅ HeroBackground 可見
    - ✅ WelcomeOverlay (今日紅卡) 可見
    - ❌ HeroDock 隱藏
    - ❌ CalendarBoard 隱藏
    - ❌ 右上工具按鈕隱藏
    - 路徑：`src/styles/global.css`（body.initial-welcome 選擇器）
    - 驗收：截圖對比，僅背景 + 紅卡可見。

### US1 — 閒置自動轉場

- [x] T018 [US1] 驗證閒置偵測設定：確認 `IdleManager` 在歡迎模式下的計時器為 6 秒，且**不追蹤 mousemove**（僅追蹤 mousedown, touchstart, keypress）。
    - 路徑：`src/scripts/hero/idleManager.ts`
    - 驗收：歡迎模式下，僅移動滑鼠不重置計時器；6 秒後卡片淡出。

- [x] T019 [US1] 驗證歡迎→沉浸自動轉場：閒置 6 秒後，確認 `transition-mode: { to: 'zen' }` 被觸發，歡迎卡片淡出，進入純背景沉浸模式。
    - 路徑：`src/scripts/hero/idleManager.ts`, `src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：歡迎卡片消失，Dock/Header 不顯示，僅背景。

**檢查點**：US1 完整的儀式啟動流程（加載→歡迎→閒置自動轉場）可獨立驗證並穩定運作。

---

## 階段 3：User Story 2 — 日曆查詢與農曆資訊 (Priority: P1) 🎯

**目標**：驗證日曆網格渲染、農曆計算精確度、年月選擇器與日期互動的完整功能鏈。

**獨立測試**：進入日曆模式，切換至已知節氣/節慶日期，驗證顯示正確性；操作年月選擇器跨年切換。

### US2 — 日曆網格渲染

- [x] T020 [US2] 驗證日曆網格結構：5×7 或 6×7 格局，週首漢字標註（日一二三四五六），前後月灰色填充正確。
    - 路徑：`src/scripts/calendar/calendarRenderer.ts`, `src/scripts/calendar/calendarCellBuilder.ts`
    - 驗收：2026-02 顯示 35 或 42 格，前月灰色日期可見。

- [x] T021 [US2] 驗證日期格內容佈局：西曆大數字（左上, Playfair Display）+ 農曆日期/節氣（右下, Noto Serif TC）。
    - 路徑：`src/scripts/calendar/calendarCellBuilder.ts`, `src/styles/calendar/`
    - 驗收：DevTools 確認字體 family 與定位。

- [x] T022 [US2] 驗證節慶/節氣色彩優先級：政府假日 (#ff6b6b) > 傳統節慶 (紅色粗體) > 二十四節氣 (金色粗體) > 農曆日期 (灰色低透明度)。
    - 路徑：`src/scripts/calendar/calendarCellBuilder.ts`
    - 驗收：已知節氣日（如 2026-02-04 立春）顯示金色；春節日期顯示紅色。

- [x] T023 [US2] 驗證日曆滑動動畫：向左滑動 ≥50px 觸發 `navigate-month(+1)`，網格 `animate-slide-left` → `animationend` 後移除。向右同理 (-1, `animate-slide-right`)。
    - 路徑：`src/scripts/calendar/calendarEventHandlers.ts`, `src/styles/calendar/`
    - 驗收：滑動切月動畫流暢無殘留 class。

- [x] T024 [P] [US2] 驗證跨月日期格跳轉：點選灰色前月/後月日期格，觸發 `date-selected` 並自動切換至對應月份重繪。
    - 路徑：`src/scripts/calendar/calendarEventHandlers.ts`, `src/scripts/app/eventOrchestrator.ts`
    - 驗收：點選 2 月網格中的 1 月 31 日，自動跳轉至 1 月。

### US2 — 農曆計算引擎

- [x] T025 [US2] 驗證農曆計算精確度：抽樣驗證已知日期的農曆轉換結果。
    - 測試日期：2026-01-29（春節, 農曆正月初一）、2026-02-04（立春）、2026-06-14（端午）
    - 路徑：`src/scripts/core/lunar.ts`
    - 驗收：`Lunar.fromDate(date)` 回傳的幹支年、農曆月日、節氣、節慶全部正確。

- [x] T026 [US2] 驗證建除十二神與二十八宿：確認 `getComprehensiveLuck()` 結合建除主判與二十八宿輔判。
    - 路徑：`src/scripts/core/lunar.ts`
    - 驗收：今日面板顯示建除吉凶等級與二十八宿宿名（含禽星 tooltip）。

- [x] T027 [P] [US2] 驗證宜忌項目生成：確認依據建除十二客生成每日宜忌清單。
    - 路徑：`src/scripts/core/lunar.ts`
    - 驗收：今日面板「宜」與「忌」區塊正確顯示項目標籤 (Tags)。

### US2 — 年月選擇器面板

- [x] T028 [US2] 驗證年份選擇器佈局：5 欄 × 2 列，共顯示 10 年，聚焦當前年份前後範圍，當前年高亮。
    - 路徑：`src/scripts/panels/` (panelRenderers)
    - 驗收：2026 年高亮，周圍 ±5 年可見。

- [x] T029 [US2] 驗證月份選擇器佈局：4 欄 × 3 列，共 12 個月，當前月高亮。
    - 路徑：`src/scripts/panels/` (panelRenderers)
    - 驗收：2 月高亮，12 個月全部可見。

- [x] T030 [US2] 驗證選擇後延遲關閉面板：選中月份後，面板延遲 200ms 關閉，提供「確認選中」視覺停留。
    - 路徑：`src/scripts/panels/` (panelEventHandlers)
    - 驗收：選中後可見短暫高亮，200ms 後面板滑出。

- [x] T031 [US2] 驗證面板互斥邏輯：toggle 同面板為關閉；toggle 不同面板為切換；`body[data-active-panel]` 同步更新；背景遮罩 (`#panelBackOverlay`) 隨面板開關同步。
    - 路徑：`src/scripts/app/stateManager.ts`, `src/scripts/panels/`
    - 驗收：快速連續點擊年月→今日→年月，面板切換無殘留或閃爍。

### US2 — 日曆模式可見性與 Dock

- [x] T032 [US2] 驗證日曆模式 Dock 狀態：
    - `.group-calendar` 可見（年月按鈕顯示）
    - `.group-image` 隱藏
    - 步進鍵 `< >` 功能為 `navigate-month(-1/+1)`，色系為香檳金 `#D4AF37`
    - `btnDay` (日曆按鈕) 為 `active` 高亮狀態
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`, `src/styles/hero/`
    - 驗收：DevTools 確認 class 狀態與色彩變數。

- [x] T033 [US2] 驗證日曆→今日面板→返回流程：點選日期 → `date-selected` → 今日面板彈出 → 日曆網格隱藏 → 關閉面板 → 日曆網格恢復。
    - 路徑：`src/scripts/app/eventOrchestrator.ts`, `src/scripts/panels/`
    - 驗收：完整流轉無殘留狀態。

- [x] T034 [US2] 驗證日曆標題同步更新：切換月份後，`update-calendar-title` 事件觸發，頂部顯示「農曆 [月名]」+「YYYY . MM」。特殊月份映射：正→一月、冬→十一月、臘→十二月。
    - 路徑：`src/scripts/calendar/calendarRenderer.ts`
    - 驗收：切換至農曆十一月，標題顯示「農曆 冬月」。

**檢查點**：US2 日曆功能完整驗收——網格渲染、農曆計算、年月選擇器、面板互動全部正常。

---

## 階段 4：User Story 3 — 映畫互動與背景賞析 (Priority: P1) 🎯

**目標**：驗證映畫/Zen 雙模式的狀態轉換、Dock 色系同步、藝廊管理、輪播計時與全螢幕整合。

**獨立測試**：從日曆切換至映畫模式，操作所有 Dock 按鈕、切換藝廊模式、進入/退出 Zen、測試手勢引導。

### US3 — 模式轉換與 Dock 色系同步

- [x] T040 [US3] 驗證 Calendar → Artwork 轉換：點擊「映畫」按鈕觸發 `transition-mode: { to: 'artwork' }`。
    - body 變更：add `immersion-mode` + `mode-artwork`
    - Dock 色系：從香檳金轉為極地純銀
    - 中間槽位：`.group-calendar` → hidden, `.group-image` → flex
    - `btnChangeImage` 進入 `active` 高亮
    - CalendarBoard → 隱藏
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：所有元件可見性符合 plan.md 元件可見性矩陣 Artwork 列。

- [x] T041 [US3] 驗證 Artwork → Calendar 轉換：點擊「日曆」按鈕觸發 `transition-mode: { to: 'calendar' }`。
    - body 變更：remove `immersion-mode`, `mode-artwork`
    - Dock 色系：從極地純銀轉回香檳金
    - 中間槽位：`.group-image` → hidden, `.group-calendar` → flex
    - `btnDay` 進入 `active` 高亮
    - CalendarBoard → 顯示
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：色系即時同步，無延遲或閃爍。

- [x] T042 [US3] 驗證色系全域同步範圍：模式切換時，以下元件色系必須「同秒、同步」更新：
    - Dock 框線 (border)
    - 步進鍵 `< >` (箭頭顏色)
    - 分隔線 (divider gradient)
    - 高亮按鈕 (active button bg/text)
    - 音樂律動波紋 (music pulse)
    - 路徑：`src/styles/hero/`, CSS 變數
    - 驗收：慢動作播放轉場，確認沒有個別元件延遲更新。

- [x] T043 [P] [US3] 驗證步進鍵 `< >` 功能轉義：
    - 日曆模式：`navigate-month(-1/+1)`
    - 映畫模式：`request-hero-change` (prev/next image)
    - Zen 模式：Dock 隱藏，滑動手勢替代
    - 路徑：`src/scripts/hero/handlers/navigationHandler.ts`
    - 驗收：在映畫模式按 `<` 確認是切換圖片而非切月。

### US3 — 藝廊管理系統

- [x] T044 [US3] 驗證藝廊模式切換（Default / Custom / Hybrid）：
    - Default：僅季節圖片（依據當前月份加載 spring/summer/autumn/winter 資料夾）
    - Custom：僅自選圖片（來自 IndexedDB blob）
    - Hybrid：季節 + 自選混合，隨機洗牌
    - 路徑：`src/scripts/hero/imageManager.ts`, `src/scripts/hero/galleryManager.ts`
    - 驗收：切換每種模式，Network 面板確認圖片來源正確。

- [x] T045 [US3] 驗證 Custom 空狀態處理：自選圖片為空時：
    - 背景強制顯示 Fallback 圖片 (`assets/gallery/default/1.png`)
    - 顯示紅色警告框 `.gallery-empty-notice`：「⚠️ 尚無自選圖片，請先匯入」
    - 自動開啟圖片管理選單引導匯入
    - `custom-list-empty` 事件觸發
    - 路徑：`src/scripts/hero/imageManager.ts`, `src/scripts/hero/galleryManager.ts`
    - 驗收：清空 IndexedDB 後切換至 Custom，確認三項行為全部正確。

- [x] T046 [P] [US3] 驗證節慶特殊圖片切換：當日期位於已知節慶/節氣時，圖片管理器搜尋對應名稱的圖片（如 `DragonBoat.png`, `DragonBoat1.png` 至 `DragonBoat5.png`）。找到後切換至節慶圖片列表。
    - 路徑：`src/scripts/hero/imageManager.ts`, `src/scripts/hero/imageRules.ts`
    - 驗收：手動設定日期為端午節，確認背景切換為端午圖片。

- [x] T047 [P] [US3] 驗證圖片隨機洗牌：`imageRules.ts` 中 `ENABLE_RANDOM_SHUFFLE = true`，季節圖片載入後經過洗牌再播放。
    - 路徑：`src/scripts/hero/imageRules.ts`, `src/scripts/hero/imageManager.ts`
    - 驗收：多次重整首頁，首張背景圖不同。

### US3 — 輪播計時與閒置管理

- [x] T048 [US3] 驗證輪播計時器：`SlideshowManager` 預設間隔 10,000ms，映畫模式啟動時 `slideshow-control: { action: 'start', isArtwork: true }`。
    - 路徑：`src/scripts/hero/slideshowManager.ts`
    - 驗收：打開 DevTools console，確認每 10 秒觸發一次 `switchCallback`。

- [x] T049 [US3] 驗證映畫閒置自動換圖：`IdleManager` 在映畫模式下每 5 秒觸發 `artwork-idle-slide`，`NavigationHandler` 收到後切換下一張。
    - 路徑：`src/scripts/hero/idleManager.ts`, `src/scripts/hero/handlers/navigationHandler.ts`
    - 驗收：進入映畫模式後不操作，5 秒後圖片自動切換。

- [x] T050 [US3] 驗證 IdleManager 200ms 防抖：模式轉換期間（如 Calendar → Artwork），確認 200ms debounce 防止閒置計時器閃爍啟動。
    - 路徑：`src/scripts/hero/idleManager.ts`
    - 驗收：快速連續切換模式，不觸發意外的閒置回調。

### US3 — 沉浸模式 (Zen) 與全螢幕整合

- [x] T051 [US3] 驗證 Artwork → Zen 轉換（全螢幕進入）：
    - 點擊背景觸發 `transition-mode: { to: 'zen' }`
    - 系統呼叫 `document.documentElement.requestFullscreen()`
    - body class：`immersion-mode`（無 `mode-artwork`）
    - Dock / Header / 右上按鈕 / 日曆 全部隱藏
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：確認瀏覽器進入全螢幕，UI 完全消失。

- [x] T052 [US3] 驗證 Zen → Artwork 轉換（全螢幕退出）：
    - 點擊畫面或按 Esc 觸發 `transition-mode: { to: 'artwork' }`
    - 系統呼叫 `document.exitFullscreen()`
    - Dock / Header / 右上按鈕重新顯示（銀色系）
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：退出全螢幕，Dock 恢復銀色系。

- [x] T053 [US3] 驗證 fullscreenchange 同步機制：使用者透過系統行為（如手機返回鍵、桌面 Alt+F4 相鄰全螢幕窗口）退出全螢幕時，監聽 `fullscreenchange` 事件，自動將模式從 Zen 強制恢復為 Artwork。
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`
    - 驗收：在 Zen 模式按 Esc 退出全螢幕，系統自動回到 Artwork（Dock 重新顯示）。

- [x] T054 [US3] 驗證 Zen 滑動手勢切換背景：在 Zen 模式（UI 全隱藏）下，左右滑動 ≥50px 可切換背景圖片。`NavigationHandler` 接受 `immersion-mode` 作為有效狀態。
    - 路徑：`src/scripts/hero/touchHandler.ts`, `src/scripts/hero/handlers/navigationHandler.ts`
    - 驗收：全螢幕 Zen 模式中左右滑動，背景圖片變更。

- [x] T055 [US3] 驗證首次手勢引導：使用者**首次**進入 Zen 模式時，顯示半透明手指滑動動畫 +「左右滑動切換背景」文字提示，4.5 秒後淡出，`localStorage('hasShownZenHint')` 設為 true 後不再顯示。
    - 路徑：`src/scripts/hero/handlers/modeHandler.ts`（或專用 hint 模組）
    - 驗收：首次進入顯示引導；清除 localStorage 後重進再次顯示；第二次進入不顯示。

### US3 — 背景圖片轉場品質

- [x] T056 [US3] 驗證背景切換動畫品質：圖片切換採用 1.6s `cubic-bezier(0.2, 0.8, 0.2, 1)` 的動態平移 + 淡入（絲綢般過渡）。
    - 路徑：`src/styles/hero.css`（或 hero/ 子目錄）
    - 驗收：DevTools Performance 面板確認動畫穩定 60fps，無掉幀。

- [x] T057 [P] [US3] 驗證 No Grain Policy：確認全站無 SVG `feTurbulence` 噪點紋理殘留（玻璃卡片、日曆、面板、藝廊選單）。
    - 路徑：全域搜尋 `feTurbulence` 於 `src/`
    - 驗收：搜尋結果為 0。

- [x] T058 [P] [US3] 驗證原始色彩還原：背景圖片無 CSS `saturate` / `brightness` 濾鏡。
    - 路徑：`src/styles/hero.css`（hero-background 相關）
    - 驗收：搜尋 hero-background 的 filter 屬性，確認無 saturate/brightness。

**檢查點**：US3 映畫系統完整驗收——模式轉換、雙色系同步、藝廊管理、Zen 全螢幕、滑動手勢、轉場品質全部正常。

---

## 階段 5：User Story 4 — 音樂播放與電台管理 (Priority: P2)

**目標**：驗證音樂播放、淡入淡出、自訂電台 CRUD、狀態記憶恢復與分頁感知。

**獨立測試**：播放預設音樂、新增/刪除自訂電台、關閉重開頁面驗證恢復，切換分頁驗證暫停/恢復。

### US4 — 音樂播放核心

- [x] T060 [US4] 驗證音樂播放淡入淡出：播放開始時 ≥1000ms 的 Logarithmic Fade-in，暫停時 ≥1000ms Fade-out。
    - 路徑：`src/scripts/hero/musicPlayer.ts`
    - 驗收：播放/暫停操作無突兀音量跳變。

- [x] T061 [US4] 驗證播放中視覺回饋：音樂播放時，對應電台項目具備呼吸燈或波紋效果，提供「運作中」視覺索引。
    - 路徑：`src/scripts/hero/musicPlayer.ts`, `src/styles/hero/`
    - 驗收：播放中可見微弱動態波紋。

- [x] T062 [US4] 驗證分頁感知：`visibilitychange` 為 `hidden` 時自動暫停，切回 `visible` 時自動恢復播放。
    - 路徑：`src/scripts/hero/musicPlayer.ts`
    - 驗收：切換分頁後音樂暫停，回來後恢復。

- [x] T063 [P] [US4] 驗證曲目自動接續：當前曲目播放結束 (`ended` 事件) 後自動播放下一首。
    - 路徑：`src/scripts/hero/musicPlayer.ts`
    - 驗收：播放一首短曲，結束後自動切換到下一首。

### US4 — 電台管理與持久化

- [x] T064 [US4] 驗證自訂電台新增：使用者輸入有效 HTTPS 串流 URL，新增至 IndexedDB，刷新後保留。
    - 路徑：`src/scripts/hero/musicPlayer.ts`（或專用電台管理模組）
    - 驗收：新增電台 → 重新整理 → 電台仍存在。

- [x] T065 [US4] 驗證電台刪除功能：支援刪除預設與自訂電台。
    - 路徑：同上
    - 驗收：刪除電台 → 消失 → 重新整理→ 仍消失。

- [x] T066 [US4] 驗證防呆機制：點擊既有電台僅切換播放（不重複新增）；輸入新 URL 才執行新增動作。
    - 路徑：同上
    - 驗收：點擊已存在的電台，清單不出現重複項。

- [x] T067 [US4] 驗證狀態記憶恢復：`localStorage('zen_music_last_url')` 記住上次選擇。啟動時 `MusicPlayer.init` 讀取並準備就緒，發送 `music-restored` 事件，UI 高亮對應項。
    - 路徑：`src/scripts/hero/musicPlayer.ts`
    - 驗收：播放某電台 → 重新整理 → 該電台自動被選中（Ready 狀態）。

- [x] T068 [P] [US4] 驗證 HTTPS 強制：自訂 URL 輸入時驗證必須為 `https://` 開頭，拒絕 `http://` 或無效格式。
    - 路徑：同上
    - 驗收：輸入 `http://...` → 拒絕並提示。

**檢查點**：US4 音樂功能完整驗收——播放品質、電台 CRUD、持久化、安全性全部正常。

---

## 階段 6：User Story 5 — 動態主題與季節系統 (Priority: P2)

**目標**：驗證主題引擎根據月份/節慶自動切換色彩主題，且模式↔色系同步正確。

**獨立測試**：手動切換月份至 4 個季節與春節日期，驗證主題色是否正確套用。

- [x] T070 [US5] 驗證季節主題映射規則：
    - 2-4 月 → `theme-spring`
    - 5-7 月 → `theme-summer`
    - 8-10 月 → `theme-autumn`
    - 11-1 月 → `theme-winter`
    - 路徑：`src/scripts/app/stateManager.ts`（`getTheme` 方法）
    - 驗收：切換月份至 3、6、9、12 月，確認 `#appContainer` class 正確。

- [x] T071 [US5] 驗證節慶主題覆寫：春節日期覆寫為 `theme-festive`（紅色主導）。
    - 路徑：`src/scripts/app/stateManager.ts`
    - 驗收：切換至 2026-01-29（春節），主題變為 `theme-festive`。

- [x] T072 [US5] 驗證主題轉場動畫：主題切換時背景色、文字色、邊框色以 0.6s `cubic-bezier(0.22, 1, 0.36, 1)` 緩動過渡。
    - 路徑：`src/styles/themes/`, `src/styles/global.css`
    - 驗收：切月時觀察背景色變化為平滑過渡，非瞬間跳變。

- [x] T073 [US5] 驗證日曆模式金色系應用：日曆模式下 Dock 框線、分隔線、步進鍵、高亮按鈕全部為香檳金系 (`#D4AF37`)。
    - 路徑：`src/styles/hero/`
    - 驗收：DevTools computed styles 確認色彩值。

- [x] T074 [P] [US5] 驗證映畫模式銀色系應用：映畫模式下全部為極地純銀系 (`#FFFFFF` 強調)。
    - 路徑：`src/styles/hero/`
    - 驗收：同上，切換至映畫模式後確認。

**檢查點**：US5 主題引擎完整驗收——季節映射、節慶覆寫、轉場動畫、雙色系同步全部正常。

---

## 階段 7：User Story 6 — PWA 安裝與離線能力 (Priority: P3)

**目標**：驗證 PWA manifest、Service Worker 更新機制與離線快取。

**獨立測試**：在 Chrome 中觸發安裝提示，斷網後驗證頁面可用性。

- [x] T080 [US6] 驗證 PWA 安裝提示流程：瀏覽器觸發 `beforeinstallprompt`，`deferredPrompt` 捕獲後顯示「加到主畫面」按鈕。
    - 路徑：`src/scripts/hero/pwaHandler.ts`
    - 驗收：Chrome Application 面板確認 manifest 合規，安裝按鈕可見。

- [x] T081 [US6] 驗證 Service Worker 更新偵測：`registration.waiting` 存在時強制 `skipWaiting`，12 秒超時後仍允許進入。
    - 路徑：`src/scripts/app/resourceLoader.ts`
    - 驗收：DevTools Application → Service Workers 確認更新流程。

- [x] T082 [P] [US6] 驗證離線快取：斷網後已安裝的 PWA 可開啟，已快取頁面、圖片、字體正常顯示。
    - 路徑：`astro.config.mjs` (PWA 設定)
    - 驗收：斷網模式下開啟 PWA，日曆與背景圖可操作。

**檢查點**：US6 PWA 功能基本驗收。

---

## 階段 8：User Story 7 — FAQ 面板與知識引導 (Priority: P3)

**目標**：驗證 FAQ 面板的開關行為、手風琴展開/收合與遮罩關閉。

**獨立測試**：在映畫模式點擊 FAQ 按鈕，操作所有問答項目。

- [x] T090 [US7] 驗證 FAQ 面板開關：右上角 ❓ 按鈕非同步切換面板顯示/隱藏；面板為玻璃質感浮動面板。
    - 路徑：`src/components/Hero/HeroSection.astro`（或專用 FAQ 組件）, `src/scripts/hero/`
    - 驗收：點擊開啟，再次點擊或點遮罩關閉。

- [x] T091 [US7] 驗證 FAQ 手風琴互動：點擊問題項目展開答案，再次點擊收合。
    - 路徑：同上
    - 驗收：每個 Q&A 條目可展開/收合。

**檢查點**：US7 FAQ 基本功能驗收。

---

## 階段 9：跨功能驗證與品質收斂 (Cross-cutting Concerns)

**目的**：跨越所有 User Story 的全域品質驗證。

- [x] T100 [P] 響應式設計全面驗證：在以下斷點驗證版面完整性：
    - iPhone SE (375px)
    - iPhone 14 Pro (393px)
    - iPad (768px)
    - Desktop (1024px)
    - Wide Desktop (1440px)
    - 4K (3840px)
    - 路徑：全域 CSS 與 Astro 組件
    - 驗收：6 個斷點截圖無破版。

- [x] T101 [P] 觸控區域合規驗證：所有可觸控元件（Dock 按鈕、日期格、面板項目、工具按鈕）最小面積 ≥ 44×44px。
    - 路徑：`src/styles/`
    - 驗收：Chrome DevTools 元素尺寸測量。

- [x] T102 無障礙語義驗證：自定義按鈕具備 `role="button"` + `aria-label`。
    - 路徑：`src/components/`（所有 .astro 組件）
    - 驗收：螢幕閱讀器可正確朗讀每個按鈕用途。

- [x] T103 色彩對比驗證：農曆日期文字在各主題色下符合 WCAG AA (≥ 4.5:1)。
    - 路徑：`src/styles/themes/`, `src/styles/calendar/`
    - 驗收：使用 Lighthouse Accessibility 檢查或對比度工具。

- [x] T104 Zero Error 最終驗證：執行 `npm run lint` + `ruff check .`，確保全專案 Zero Errors。
    - 路徑：根目錄
    - 驗收：兩個指令輸出均為 0 errors。

- [x] T105 完整事件流驗證：依據 `plan.md` 事件契約清單，驗證所有 20+ 種 CustomEvent 的發送者、消費者與 Payload 型別一致性。額外驗證 `toggle-grid` 語義修正後，事件流無斷裂。
    - 路徑：`src/scripts/types.ts`, 全域 `dispatchEvent` / `addEventListener`
    - 驗收：`grep -r 'dispatchEvent' src/` 的每個事件名稱在 types.ts 中有對應定義。

- [x] T106 效能基準驗證：
    - 首屏加載 ≤ 8 秒（Slow 3G）
    - 模式切換 ≤ 200ms（Performance 面板）
    - 背景動畫 ≥ 55fps（Performance 面板）
    - 模式切換 CLS = 0（Layout Shift 追蹤）
    - 高頻壓力測試通過（100ms 間隔 × 20 次模式切換）
    - Welcome 閒置自動轉場在 6 秒觸發（±500ms）
    - Fullscreen 進入/退出僅在 afterEnter 階段執行（grep 驗證）
    - CSS transition 在模式切換期間維持 ≥ 55fps
    - 路徑：瀏覽器 DevTools
    - 驗收：八項指標全部達標。

- [x] T107 文件同步最終更新：確認 `SDD_v1/` 下所有四份文件（constitution, spec, plan, tasks）與專案實際程式碼一致。
    - 路徑：`SDD_v1/`
    - 驗收：文件描述的事件名、檔案路徑、行為邏輯與程式碼實際行為一致。

- [x] T108 FSM 轉換路徑完整性驗證：逐一執行 plan.md §1.2 合法轉移路徑表中的所有 8 條路徑，確認每條路徑的副作用（§6 轉換副作用清單）全部正確執行。
    - 手動測試流程：
        1. Welcome → Calendar：確認 Dock 出現（金色）、CalendarBoard 顯示
        2. Welcome → Zen（閒置6秒）：確認全 UI 隱藏、**6 秒觸發**（非 15 秒）
        3. Calendar → Artwork：確認 Dock 色系金→銀、Gallery 顯示、CalendarBoard 隱藏
        4. Calendar → Note：確認筆記面板出現
        5. Artwork → Calendar：確認 Dock 色系銀→金、CalendarBoard 顯示、Gallery 隱藏
        6. Artwork → Zen：確認全 UI 隱藏、Fullscreen 在 `afterEnter` 觸發/降級
        7. Zen → Artwork：確認 Dock 重現（銀色）、Fullscreen 退出在 `afterEnter` 觸發
        8. Note → Calendar：確認筆記面板關閉、日曆恢復
    - 額外驗證：9. Welcome 背景 click（capture 階段）：確認模式守衛攔截，不觸發 transition 10. Artwork→Zen 轉換中按 Esc：確認 fullscreenchange 排入佇列 11. 面板殘留檢查：Calendar（today 面板開啟）→ Artwork → 檢查 `activePanel === null` 12. 錯誤恢復：inject 異常至 performTransition → 確認回滾至 Calendar
    - 驗收：12 條測試路徑全部通過，無殘留 class、無面板洩漏、無計時器錯誤。

---

## 相依性與執行順序

### 階段相依性

- **階段 1（基礎設施）**：無相依性——可立即開始
- **階段 1.5（狀態機重構）**：依賴階段 1 基礎設施驗證完成。**此為核心前置依賴**——後續所有 UI 驗證的正確性基於此階段的輸出。
    - 建議子階段順序：1.5A(守衛) → 1.5B(原子class) → 1.5C(生命週期) → 1.5D(IdleManager) → 1.5E(CSS統一) → 1.5F(型別) → 1.5G(Fullscreen整合) → 1.5H(事件語義) → 1.5I(模式守衛) → 1.5J(inline style) → 1.5K(錯誤恢復)
    - 1.5F、1.5I 可與其他子階段平行
    - 1.5G 依賴 1.5A(轉移鎖) + 1.5C(生命週期)
    - 1.5H 可在 1.5A 之後獨立執行
    - 1.5J 依賴 1.5E(CSS統一)
    - 1.5K 依賴 1.5A(轉移鎖) + 1.5C(生命週期)
- **階段 2-4（P1 User Stories）**：依賴階段 1.5 狀態機重構完成
    - US1（歡迎）、US2（日曆）、US3（映畫）可平行進行
    - 建議依序：US1 → US2 → US3（因體驗路徑為 歡迎→日曆→映畫）
- **階段 5-6（P2 User Stories）**：依賴階段 2-4 核心驗證完成
    - US4（音樂）與 US5（主題）可平行進行
- **階段 7-8（P3 User Stories）**：依賴 P1 完成
    - US6（PWA）與 US7（FAQ）可平行進行
- **階段 9（品質收斂）**：依賴所有 User Story 完成

### User Story 相依性

- **US1（P1）**：依賴階段 1.5 的 IdleManager 三域計時器重構（T206）——歡迎模式的 6s 閒置計時器行為需重構後才能正確驗證
- **US2（P1）**：依賴階段 1.5 的面板狀態清理（T205）——面板互斥邏輯需要狀態同步修正
- **US3（P1）**：依賴階段 1.5 的核心 FSM（T200-T204）——模式轉換路徑與 Fullscreen 降級策略
- **US4（P2）**：可在 US3 完成後開始——音樂播放需在映畫模式下測試
- **US5（P2）**：可在 US2 完成後開始——主題引擎需在日曆切月場景下測試
- **US6（P3）**：獨立——PWA 功能不依賴前述 Story
- **US7（P3）**：可在 US3 完成後開始——FAQ 按鈕位於映畫模式右上角

### 可平行執行的機會

- 所有標記 [P] 的基礎設施任務（T001-T006）可平行執行
- 階段 1.5 中 T203、T209、T213 可平行執行（常量定義 + 型別修補 + 模式守衛互不干擾）
- 階段 1.5 中 T214、T215 可平行執行（layoutManager + modeUIManager inline style 清除互不干擾）
- 階段 1.5 中 T212（事件語義）可在 T200 後獨立執行
- US1 中 T013/T014 可平行執行（首圖 + 平行預熱驗證互不干擾）
- US2 中 T024/T027 可平行執行
- US3 中 T043/T046/T047/T057/T058 可平行執行
- US4 中 T063/T068 可平行執行
- US5 中 T074 可平行執行
- US6 中 T082 可平行執行
- 階段 9 中 T100/T101/T102/T103 可平行執行

---

## 實作策略

### 先完成核心重構（階段 1 + 1.5），再驗證功能

1. 完成階段 1：基礎設施驗證
2. 完成階段 1.5：狀態機核心重構 ← **關鍵路徑**
    - 1.5A: FSM 轉移守衛 + 轉移鎖
    - 1.5B: Body Class 原子替換
    - 1.5C: 四階段轉換生命週期
    - 1.5D: IdleManager 三域重構
    - 1.5E: UI 可見性 CSS 統一化
    - 1.5F: 型別安全修補
    - 1.5G: Fullscreen 生命週期整合 ← **新增**
    - 1.5H: toggle-grid 事件語義修正 ← **新增**
    - 1.5I: Background Click 模式守衛 ← **新增**
    - 1.5J: inline style 清除 ← **新增**
    - 1.5K: 錯誤恢復機制 ← **新增**
3. **停止並壓力測試**：高頻模式切換 20 次 + CLS 驗證 + Performance Profile
4. 完成核心重構後，後續 User Story 驗證的可信度大幅提升

### 漸進式交付

1. 核心重構完成（階段 1.5）→ 模式轉換流暢度已保障
2. MVP 驗證（US1→US2→US3）→ 核心體驗已就緒
3. 加入 US4（音樂）+ US5（主題）→ 視聽體驗完善
4. 加入 US6（PWA）+ US7（FAQ）→ 安裝能力與引導完善
5. 執行階段 9 品質收斂 → 全面達標

---

## 備註

- `[P]` 任務 = 不同檔案、無相依性，可同時進行
- `[Story]` 標籤將任務對應到特定 User Story
- `[US*]` 標籤代表跨 User Story 的基礎設施任務
- 每個 User Story 應可獨立完成、獨立測試
- 每完成一個任務或邏輯群組就提交一次
- 可在任何檢查點停下來，獨立驗證該 User Story
- 因本專案為 Brownfield，大部分任務為「驗證 (V)」而非「建立 (C)」——發現缺陷時就地修復
- **階段 1.5 為例外**——這些是主動重構任務 (C)，因代碼審閱發現的結構性問題需要在功能驗證前修正
- **新增 T210-T216** 為第二輪代碼審閱發現的關鍵問題（Fullscreen 散落、Welcome 超時、事件語義、inline style、錯誤恢復）
- 避免：模糊不清的任務、同檔案衝突、跨 User Story 的相依性破壞獨立性
- 新增任務 ID 從 T200 開始，與原有 T001-T107 編號區隔
