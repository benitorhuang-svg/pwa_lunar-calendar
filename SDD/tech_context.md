# Technical Context & Architecture (SDD)

## 1. 專案核心設計哲學 (Core Architectural Philosophy)

**「教科書級別重構 (Textbook Refactoring)」** 為本專案的技術基準。
專案核心目標是透過極致的模組化與職責分離，將 Vanilla JS 專案的可維護性提升至企業級框架水準。

### 核心原則：

- **UI 與邏輯分離**：Astro 組件僅負責 HTML 結構（骨架）與局部樣式（皮肉）。
- **功能導向模組化 (Feature-oriented)**：邏輯被抽離至 `src/scripts/{feature}/` 目錄。
- **單向數據流與事件驅動**：利用全域 `AppStateManager` 維護數據，並透過 `AppEventOrchestrator` 以 CustomEvent 協調各組件。
- **類型安全 (Type Safety)**：全面定義 TypeScript 介面 (`src/scripts/types.ts`)，確保跨模組通訊的資料一致性。

## 2. 技術棧與環境 (Technology Stack & Environment)

- **核心框架**: [Astro](https://astro.build/) (v4.16+) - 採用群島架構 (Island Architecture)。
- **開發語言**:
    - **JavaScript (ESM)**: 強制採用 ES Modules 規範。
    - **TypeScript (Static Analysis)**: 使用 TypeScript 進行類型解析與 IDE 強化（透過 `tsconfig.json`）。
- **品質管控工具**:
    - **ESLint**: 語法與質量檢查（強制 Zero Errors）。
    - **Prettier**: 視覺工整度與代碼風格標準化。
    - **Ruff**: Python 工具腳本的 Linter。
- **路徑解析**: 使用 `@/` 别名指向 `src/` 目錄，確保跨層級導入的穩定性。

## 3. 系統分層與職責 (System Layering)

專案代碼分為四個主要邏輯模塊類別：

| 類別 (Category)  | 命名規範           | 職責 (Responsibility)                                        | 範例                                                                                             |
| :--------------- | :----------------- | :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **Manager**      | `*Manager.ts`      | 維護持久狀態、執行業務邏輯、處理資源加載與 API。             | `HeroImageManager`, `AppStateManager`, `HeroIdleManager`, `HeroMusicPlayer`, `HeroHeaderManager` |
| **Handler**      | `*Handler.ts`      | 監聽 UI 事件與全域 CustomEvents，並轉換為對 Manager 的調用。 | `CalendarEventHandlers`, `HeroEventHandlers` (Controller), `HeroTouchHandler`, `HeroPWAHandler`  |
| **UI Manager**   | `*UIManager.ts`    | 管理 DOM 元素、狀態切換與視圖邏輯 (View Logic)。             | `HeroUIManager`                                                                                  |
| **Renderer**     | `*Renderer.ts`     | 專職處理複雜的 DOM 動態構建、樣式切換與動畫觸發。            | `CalendarRenderer`, `PanelRenderers`, `CalendarCellBuilder`                                      |
| **Orchestrator** | `*Orchestrator.ts` | 系統的「靈魂」，負責跨功能模組的業務流轉與全域事件編排。     | `AppEventOrchestrator`                                                                           |
| **Types**        | `types.ts`         | 定義全域共用的型別、介面與事件契約。                         | `src/scripts/types.ts`                                                                           |

## 4. 全域事件目錄 (Global Event Catalog)

組件間的通訊完全依賴 `CustomEvent`，其契約 (Contract) 定義於 `src/scripts/types.ts`，分為「指令傳遞」與「渲染驅動」：

### A. 指令與控制 (Command & Control) - 由 UI/Manager 出發

- `date-selected`: 選中日期。Payload: `DateSelectedDetail`.
- `navigate-month`: 切換月份。Payload: `NavigateMonthDetail (-1 | 1)`.
- `year-selected` / `month-selected`: 面板選擇。Payload: `number`.
- `go-to-today`: 快速回到當前日期。
- `toggle-grid`: 切換日曆網格顯示。
- `toggle-panel`: 開啟/切換特定面板。Payload: `'yearMonth' | 'today'`.
- `close-panels`: 關閉所有面板。 Payload: `ClosePanelsDetail`.
- `request-hero-change`: 業務層請求更新背景。Payload: `RequestHeroChangeDetail`.
- `slideshow-control`: 控制輪播與映畫模式。Payload: `SlideshowControlDetail`.
- `welcome-mode`: 切換歡迎/沉浸狀態。Payload: `{ active: boolean }`.

### B. 渲染與更新 (Rendering & Update) - 由 Orchestrator 出發

- `render-calendar`: 指令日曆渲染器重畫網格。Payload: `RenderCalendarDetail`.
- `update-calendar-title`: 更新頂部日期與農曆標語。Payload: `UpdateCalendarTitleDetail`.
- `render-panels`: 指令面板渲染器渲染並顯示內容。Payload: `RenderPanelsDetail`.
- `hide-panels`: 通告所有面板進行隱藏。
- `render-hero`: 指令圖片管理器執行背景切換。Payload: `RenderHeroDetail`.

## 5. 資源加載系統 (Resource Loading System)

採用基於「邏輯門鎖 (Logic Gate)」與「平行預熱 (Parallel Warming)」的混合加載策略：

- **雙層進度追蹤**：進度條不僅追蹤靜態資源下載，還監聽應用程式核心邏輯與組件初始化完成的 `app-logic-ready` 訊號。
- **權重分配**：
    - **核心腳本 (15%)**: 真正反映應用程式逻辑就緒狀態。
    - **首張 Hero 圖 (25%)**: 強制先行下載。
    - **字體 (15%)**: 確保 Playfair Display & 織芒星書法體無閃爍加載。
    - **其餘輪播圖 (15%)**: 採用平行預熱。
    - **音訊 (10%)**: 視音頻。
    - **SW 更新 check (20%)**: Service Worker 版本檢查。
- **優化機制**：
    - **平行預熱 (Parallel Warming)**：`HeroImageManager` 捨棄循序 for-loop，改用 `Promise.all` 併發請求，顯著縮短等待時間。
    - **首圖確定性 (Deterministic First-Load)**：確保當前季節的首張圖片（通常為 1.webp）必被預載，防止加載畫面進入主畫面時發生未預期 404 或閃爍。
    - **非阻塞更新**：Service Worker 的更新檢查不再阻塞資源下載。
    - **超時保護**：8 秒強制門限，確保極端網路環境下仍能進入應用。

## 6. 視覺與圖形質量 (Visual Fidelity)

追求極致的「數位高級感」，移除所有可能產生雜訊或顆粒感的後製效果：

- **移除數位噪點 (No Grain Policy)**：全面移除 SVG `feTurbulence` 噪點紋理（包括玻璃卡片、日曆網格、隨筆面板及藝廊菜單），確保 4K 螢幕下的純淨觀感。
- **原始色彩復原**：背景圖片移除 CSS `saturate` 與 `brightness` 濾鏡，保留攝影作品最真實的寬容度與質感。
- **流暢轉場**：背景切換採用 1.6s 的 `cubic-bezier(0.2, 0.8, 0.2, 1)` 動態平移與淡入，模擬絲綢般的切換效果。

## 7. PWA 與 離線強化

- **技術實現**: 基於 `@vite-pwa/astro`。
- **Service Worker**: 採 `autoUpdate` 策略。

## 7. 版面與定位規範 (Layout & Positioning Rules)

為解決 UI 轉場時的跳動感並優化 PWA 體驗，建立以下開發規範：

- **由下往上 (Bottom-to-Top) 慣性**：所有功能面板（Selector, Grid）優先採用底部支撐或底部滑入動畫，符合手機用戶的操作本能。
- **行動優先版面 (Mobile-First Layout)**：
    - 選擇器限制最大寬度為 `500px`，並在小螢幕下寬度撐滿 (100%)。
    - 移除工具列文字，使用 `:has(span:empty)` 補償內邊距，達成絕對置中與平衡。
- **水平置中基準**：所有懸浮組件（Dock, Panels）必須在 `transform` 屬性中顯式宣告 `translateX(-50%)`。

---

_本文件定義之架構與事件契約，為所有重構與新功能開發之最高指導規範。_
