# 農民曆 PWA 架構說明書

## 1. 專案概觀

本專案是一個基於 **Astro** 框架構建的現代化農民曆 PWA (Progressive Web App)。
核心設計理念採用 **模組化 TypeScript (Vanilla TS Modules)**，不依賴大型前端框架 (如 React/Vue) 的狀態管理庫，而是利用瀏覽器原生的 `CustomEvent` 實現組件間的解耦與通信，以確保極致的輕量化與效能。

---

## 2. 資料架構與通信機制

### 核心狀態管理 (State Management)

應用程式的狀態由 `AppStateManager` 統一維護，這是唯一的「狀態真理來源 (Single Source of Truth)」。

- **數據類型**: 定義於 `src/scripts/types.ts` 中的 `AppState` 介面。
- **時間狀態**：`selectedYear`, `selectedMonth`, `selectedDay`, `today` (系統當日)
- **UI 狀態**：`activePanel` (當前開啟的面板: 'yearMonth' | 'today' | null)

### 事件驅動流程 (Event-Driven Architecture)

系統採用「發布/訂閱」模式，透過 `window.dispatchEvent` 發送強類別指令 (`CustomEvent<PayloadType>`)，`AppEventOrchestrator` 負責協調。

1.  **用戶觸發 (User Action)**：
    - 點擊日曆 -> 發送 `date-selected` (Payload: `DateSelectedDetail`)
    - 切換月份 -> 發送 `navigate-month` (Payload: `NavigateMonthDetail`)
    - 控制面板 -> 發送 `toggle-panel`

2.  **邏輯處理 (Logic Processing)**：
    - `AppEventOrchestrator` 監聽事件。
    - 調用 `AppStateManager` 更新數據模型。
    - 計算必要的衍生數據 (如：農曆轉換、節氣判斷)。

3.  **視圖更新 (View Rendering)**：
    - 發送渲染事件 (如 `render-calendar`, `render-hero`)。
    - 各個 UI 組件 (`Renderer`) 監聽並重繪 DOM。

---

## 3. 目錄結構與檔案功能說明

### 📂 `src/scripts/` - 核心邏輯層

負責所有的業務邏輯、狀態計算與 API 互動。

#### `src/scripts/` (全域共用)

- **`types.ts`**：**全域型別真理來源**。定義 `AppState`, `ThemeName` 以及所有跨模組事件 (`*Detail`) 的介面。所有模組應優先引用此檔案。

#### `src/scripts/core/` (核心配置)

- **`appConfig.ts`**：**應用配置**。負責處理全域環境變數 (如 `APP_BASE_URL`) 的導出，替代原有的 `window` 全域變數。
- **`lunar.ts`**：**農曆核心引擎**。自建的農曆算法庫 (1900-2100)，提供公農曆轉換、節氣 (精確到分)、干支、宜忌、建除十二神、星座與節日判斷，不依賴外部龐大的一日一檔 JSON。

#### `src/scripts/app/` (應用層)

- **`appController.ts`**：**程式入口點**。負責初始化狀態管理器與事件協調器，並處理 Splash Screen 後的啟動流程。
- **`stateManager.ts`**：**狀態管理**。封裝了年/月/日與主題 (`theme`) 的讀寫邏輯。
- **`eventOrchestrator.ts`**：**事件總線**。整個 App 的神經中樞，負責監聽並派發事件，連接 Model 與 View。
- **`resourceLoader.ts`**：**資源載入**。負責 Splash Screen 的進度條邏輯，預載字體、Hero 圖片與 JSON 數據。

#### `src/scripts/hero/` (主視覺層)

- **`hero-main.ts`**：Hero 區域的入口腳本。
- **`imageManager.ts`**：**圖片邏輯**。負責根據季節/節氣偵測圖片路徑、管理圖片緩存與切換動畫。
- **`imageRules.ts`**：**圖片規則**。定義季節判定邏輯、支援的副檔名以及隨機播放/順序播放的配置常數。
- **`galleryStorage.ts`**：**圖庫存儲**。封裝 IndexedDB，負責儲存與讀取使用者上傳的自訂背景圖片與音效。
- **`musicPlayer.ts`**：**音樂邏輯**。管理背景音樂播放清單與播放狀態。
- **`slideshowManager.ts`**：**輪播邏輯**。單純的計時器控制。
- **`idleManager.ts`**：**閒置邏輯**。偵測用戶無操作後自動進入「沉浸模式」(隱藏 UI) 或「歡迎模式」。
- **`noteManager.ts`**：**筆記功能**。管理「隨筆」面板的開關、LocalStorage 存取、字體切換與 `.txt` 匯出功能。
- **`eventHandlers.ts`**：**事件控制器**。Hero 區域的核心控制器，協調 UI、觸控 (`TouchHandler`) 與 PWA (`PWAHandler`) 互動。
- **`uiManager.ts`**：**UI 管理**。負責 Hero 區域所有 DOM 元素的選取、緩存、狀態切換與事件綁定 (View 層)。
- **`touchHandler.ts`**：**觸控邏輯**。封裝滑動手勢 (Swipe) 的偵測演算法。
- **`pwaHandler.ts`**：**PWA 邏輯**。管理 PWA 安裝提示事件與安裝按鈕互動。
- **`headerManager.ts`**：**標題邏輯**。管理左上角日期的顯示與更新。
- **`types.ts`**：**模組型別**。匯入全域型別並定義 Hero 特有的擴充型別。

#### `src/scripts/calendar/` (日曆層)

- **`calendar-board.ts`**：日曆區域的入口腳本。
- **`calendarRenderer.ts`**：**DOM 渲染**。負責清空並重繪日曆網格 (`.days-grid`)。
- **`calendarCellBuilder.ts`**：**單元格建構**。負責建立單個日期的 HTML (包含農曆、節氣顏色邏輯)。
- **`calendarEventHandlers.ts`**：**互動邏輯**。處理日曆點擊、滑動切換月份 (`Touch Swipe`) 的事件。
- **`types.ts`**：**模組型別**。匯入全域型別。

#### `src/scripts/panels/` (面板層)

- **`floating-panels.ts`**：面板區域的入口腳本。
- **`panelRenderers.ts`**：**面板渲染**。負責繪製「年/月選擇器」與「今日詳情卡片」(包含宜忌、干支、生肖)。
- **`panelEventHandlers.ts`**：**面板互動**。處理面板的開啟/關閉動畫與點擊遮罩層關閉的邏輯。

#### `src/scripts/layout/` (佈局層)

- **`layout-main.ts`**：全域通用腳本。包含自動為 Input 添加 name (輔助填表)、依月份自動切換季節主題 class。

#### `src/scripts/generated/` (自動生成層)

- **`galleryManifest.ts`**：**圖庫清單**。由腳本自動生成，列出 `public/images/` 下所有可用的預設背景圖片，供 `ImageManager` 隨機選取使用。

### 📂 `src/components/` - Astro 組件層

負責 HTML 結構的定義 (Structure)。

- **Hero/**: 背景 (`HeroBackground.astro`)、標題 (`HeroHeader.astro`)、Dock (`HeroDock.astro`)、藝廊子選單 (`HeroGallerySubmenu.astro`)、音樂播放器 (`MusicPlayer.astro`)、隨筆記錄 (`NotePad.astro`)、歡迎遮罩層 (`WelcomeOverlay.astro`)。
- **Calendar/**: 日曆板塊 (`CalendarBoard.astro`)、標題 (`CalendarHeader.astro`)、網格容器 (`CalendarGridContainer.astro`)。
- **Panels/**: 浮動面板容器 (`FloatingPanels.astro`)。

---

### 📂 `src/styles/` - 樣式層 (CSS)

負責視覺表現 (Presentation)，採用 CSS Variables 實現主題切換。
包含 `tokens.css` (設計系統), `themes/*.css` (季節變數), 以及各模組的獨立 CSS。
- **`splash.css`**: **開場動畫與進度條**。獨立管理 Splash Screen、文字墨染動畫與首屏元素出場。
- **`hero/`**:
    - **`background.css`**: 包含背景縮放動畫與首屏 Fallback 機制。
    - **`dock.css`**: 集中管理浮動 Dock 與藝廊選單的視覺樣式。
    - **`music-player.css`**: 音樂撥放器切換鈕與跳動動畫。
    - **`notepad.css`**: 隨筆面板、字體切換與編輯器介面。
    - **`welcome-overlay.css`**: 歡迎模式下的全域透明互動層。

### 📂 `src/pages/` & `src/layouts/` - 頁面入口

- **`Layout.astro`**：HTML 骨架。
- **`index.astro`**：首頁組合與資源載入器。
