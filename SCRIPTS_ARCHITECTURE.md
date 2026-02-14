# 農民曆 PWA 架構說明書

## 1. 專案概觀
本專案是一個基於 **Astro** 框架構建的現代化農民曆 PWA (Progressive Web App)。
核心設計理念採用 **模組化原生 JavaScript (Vanilla JS Modules)**，不依賴大型前端框架 (如 React/Vue) 的狀態管理庫，而是利用瀏覽器原生的 `CustomEvent` 實現組件間的解耦與通信，以確保極致的輕量化與效能。

---

## 2. 資料架構與通信機制

### 核心狀態管理 (State Management)
應用程式的狀態由 `AppStateManager` 統一維護，這是唯一的「狀態真理來源 (Single Source of Truth)」。
*   **時間狀態**：`selectedYear`, `selectedMonth`, `selectedDay`, `today` (系統當日)
*   **UI 狀態**：`activePanel` (當前開啟的面板: 'yearMonth' | 'today' | null)

### 事件驅動流程 (Event-Driven Architecture)
系統採用「發布/訂閱」模式，透過 `window.dispatchEvent` 發送指令，`AppEventOrchestrator` 負責協調。

1.  **用戶觸發 (User Action)**：
    *   點擊日曆 -> 發送 `date-selected`
    *   切換月份 -> 發送 `navigate-month`
    *   控制面板 -> 發送 `toggle-panel`

2.  **邏輯處理 (Logic Processing)**：
    *   `AppEventOrchestrator` 監聽事件。
    *   調用 `AppStateManager` 更新數據模型。
    *   計算必要的衍生數據 (如：農曆轉換、節氣判斷)。

3.  **視圖更新 (View Rendering)**：
    *   發送渲染事件 (如 `render-calendar`, `render-hero`)。
    *   各個 UI 組件 (`Renderer`) 監聽並重繪 DOM。

---

## 3. 目錄結構與檔案功能說明

### 📂 `src/scripts/` - 核心邏輯層
負責所有的業務邏輯、狀態計算與 API 互動。

#### `src/scripts/app/` (應用層)
*   **`appController.js`**：**程式入口點**。負責初始化狀態管理器與事件協調器，並處理 Splash Screen 後的啟動流程。
*   **`stateManager.js`**：**狀態管理**。封裝了年/月/日與主題 (`theme`) 的讀寫邏輯。
*   **`eventOrchestrator.js`**：**事件總線**。整個 App 的神經中樞，負責監聽並派發事件，連接 Model 與 View。
*   **`resourceLoader.js`**：**資源載入**。負責 Splash Screen 的進度條邏輯，預載字體、Hero 圖片與 JSON 數據。

#### `src/scripts/hero/` (主視覺層)
*   **`hero-main.js`**：Hero 區域的入口腳本。
*   **`imageManager.js`**：**圖片邏輯**。負責根據季節/節氣偵測圖片路徑、管理圖片緩存與切換動畫。
*   **`musicPlayer.js`**：**音樂邏輯**。管理背景音樂播放清單與播放狀態。
*   **`slideshowManager.js`**：**輪播邏輯**。單純的計時器控制。
*   **`idleManager.js`**：**閒置邏輯**。偵測用戶無操作後自動進入「沉浸模式」(隱藏 UI) 或「歡迎模式」。
*   **`eventHandlers.js`**：Hero 區域的事件監聽與 UI 互動綁定。

#### `src/scripts/calendar/` (日曆層)
*   **`calendar-board.js`**：日曆區域的入口腳本。
*   **`calendarRenderer.js`**：**DOM 渲染**。負責清空並重繪日曆網格 (`.days-grid`)。
*   **`calendarCellBuilder.js`**：**單元格建構**。負責建立單個日期的 HTML (包含農曆、節氣顏色邏輯)。
*   **`calendarEventHandlers.js`**：**互動邏輯**。處理日曆點擊、滑動切換月份 (`Touch Swipe`) 的事件。

#### `src/scripts/panels/` (面板層)
*   **`floating-panels.js`**：面板區域的入口腳本。
*   **`panelRenderers.js`**：**面板渲染**。負責繪製「年/月選擇器」與「今日詳情卡片」(包含宜忌、干支、生肖)。
*   **`panelEventHandlers.js`**：**面板互動**。處理面板的開啟/關閉動畫與點擊遮罩層關閉的邏輯。

#### `src/scripts/layout/` (佈局層)
*   **`layout-main.js`**：全域通用腳本。包含自動為 Input 添加 name (輔助填表)、依月份自動切換季節主題 class。

---

### 📂 `src/components/` - Astro 組件層
負責 HTML 結構的定義 (Structure)。

#### `src/components/Hero/`
*   **`HeroSection.astro`**：Hero 區域的主容器。
*   **`HeroBackground.astro`**：背景圖片容器 (`#heroBgContainer`)。
*   **`HeroHeader.astro`**：左上角日期顯示區 (`Year`, `Month`, `Day`)。
*   **`HeroDock.astro`**：底部導航 Dock (音樂、切換圖片、面板開關)。
*   **`WelcomeOverlay.astro`**：歡迎模式/點擊遮罩層。
*   **`MusicPlayer.astro`**：(已整合至 scripts，此檔可能為結構佔位)。

#### `src/components/Calendar/`
*   **`CalendarBoard.astro`**：日曆區域的主容器。
*   **`CalendarHeader.astro`**：日曆上方的標題與星期列 (`Sun`, `Mon`...)。
*   **`CalendarGridContainer.astro`**：日曆網格容器 (`#calendarGrid`)。

#### `src/components/Panels/`
*   **`FloatingPanels.astro`**：包含「年/月選擇面板」與「今日詳情面板」的 HTML 容器。

---

### 📂 `src/styles/` - 樣式層 (CSS)
負責視覺表現 (Presentation)，採用 CSS Variables 實現主題切換。

*   **`global.css`**：全域重置、字體定義。
*   **`tokens.css`**：**設計系統核心**。定義所有 CSS 變數 (顏色、字級、間距)。
*   **`themes/`**：包含 `spring.css`, `summer.css`, `autumn.css`, `winter.css` 等季節主題變數定義。
*   **`hero/`**：Hero 區域的特定樣式 (`background.css`, `dock.css`, `header.css`)。
*   **`calendar/`**：日曆區域的特定樣式 (`layout.css`, `cell.css`, `navigation.css`)。
*   **`panels/`**：面板區域的特定樣式 (`selector.css`, `detail.css`)。

---

### 📂 `src/pages/` & `src/layouts/` - 頁面入口
*   **`src/layouts/Layout.astro`**：HTML 骨架 (`<head>`, `<body>`)。負責引入全域 CSS 與 PWA Manifest。
*   **`src/pages/index.astro`**：首頁。組合各個 Astro 組件，並包含 Loading Screen (Splash Screen) 的 HTML 結構。
