# Naming Standards for Premium Digital Products

本文件規範此專案的命名邏輯，旨在消除開發中的視覺雜訊（Visual Noise），提升搜尋效率並確保團隊協作的精確度。

## 1. 檔案與目錄命名 (Architecture & Files)

### A. CSS 模組化原則

- **禁止使用通用名稱**：嚴格禁止在子目錄中使用 `base.css` 或 `index.css`。這會導致在全域搜尋檔案時出現多個同名結果，增加導航成本。
- **具名核心 (Named Core)**：子目錄的基礎檔案必須包含母目錄名作為前綴或具備明確功能描述。
    - ❌ `panels/base.css` -> ✅ `panels/panels-core.css`
    - ❌ `themes/base.css` -> ✅ `themes/theme-engine.css`
- **語義化根檔案 (Semantic Root)**：
    - 全域變數檔案應命名為 `tokens.css`，明確標示其儲存的是設計變項（Design Tokens）。
    - 入口檔案維持為 `global.css`。

### B. 命名格式規範

- **CSS 檔案**: `kebab-case`
    - Example: `hero-background.css`, `theme-engine.css`
- **JavaScript 模組**: `kebab-case`
    - Example: `lunar-core.js`
- **Astro 組件**: `PascalCase`
    - Example: `CalendarBoard.astro`, `FloatingPanels.astro`
- **Assets 目錄**: `kebab-case`
    - Example: `assets/gallery/spring/`, `assets/icons/`

## 2. 程式碼命名慣例 (Coding Conventions)

### A. CSS Class Naming (BEM-inspired)

我們採用一種輕量級的命名方式，不強制完整 BEM，但強調**語義分組**。

- **功能分組 (Functional Groups)**:
    - `.group-image`: 與欣賞、視覺背景相關的功能。
    - `.group-calendar`: 與數據、工具、曆法相關的功能。
- **狀態修飾 (State Modifiers)**:
    - `.active`: 目前選中或開啟的狀態 (主要用於按鈕)。
    - `.is-hidden`: 隱藏狀態 (display: none / visibility: hidden)。
    - `.has-error`: 錯誤狀態。
    - `.show-grid`: 特殊狀態切換。
- **組件前綴**:
    - 日曆相關: `.calendar-*` (e.g., `.calendar-section`, `.calendar-title`)
    - 面板相關: `.panel-*` (e.g., `.panel-grid`, `.panel-item`)
    - 英雄區塊: `.hero-*` (e.g., `.hero-dock`, `.hero-header`)

### B. JavaScript / Event Naming

- **Custom Events**: `kebab-case`
    - 事件名稱應描述「發生了什麼」或「請求什麼」。
    - ✅ `date-selected`: 用戶選取了日期。
    - ✅ `render-panels`: 請求渲染面板。
    - ✅ `hero-update-request`: 請求更新 Hero 區域。
    - ❌ `updateHero`: (避免使用動詞開頭，這像函數名)
    - ❌ `onDateClick`: (避免使用 on 開頭，這像監聽器)
- **Variables**: `camelCase`
    - DOM 元素: 使用元素類型後綴 (e.g., `btnNext`, `panelToday`, `gridContainer`)
    - Boolean: `isVisible`, `hasLoaded`, `shouldRender`

## 3. 目錄結構與搜尋優化

- 所有樣式檔案應依據組件功能進入子目錄。
- 目的：確保使用 `Ctrl + P` 搜尋時，檔案名稱本身就具備足夠的辨識度，無需依賴路徑判斷內容。

---

_遵循此規範，是保持程式碼具備「精品感」的基礎。_
