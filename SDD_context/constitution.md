# 農民曆 PWA 憲章 (Lunar Calendar PWA Constitution)

## 核心原則

### I. 數位高級感優先 (Digital Premium First)

一切設計與開發決策必須服務於「數位高級感」的產品定位。本產品不是傳統農曆工具的翻版，而是「時間的藝術品」——一個具備沉浸式、質感導向的視聽體驗應用。

- 視覺層面：追求極致的圖片通透度、無數位噪點、純淨色彩還原。
- 聽覺層面：音訊播放必須具備淡入淡出，模仿高級音響的阻尼感。
- 互動層面：動畫遵循「彈性物理」曲線，而非線性運動。轉場節奏追求「禪意律動」。
- 材質層面：善用玻璃擬態、微發光、極簡邊框，營造深度層次。

### II. 模組化與職責分離 (Modular SoC Architecture)

採用「教科書級別重構」標準，將 Vanilla JS/TS 專案的可維護性提升至企業級框架水準。

- **UI 與邏輯分離**：Astro 組件僅負責 HTML 結構（骨架）；所有邏輯抽離至 `src/scripts/{feature}/` 目錄。
- **系統分層**：嚴格遵循 Manager / Handler / UIManager / Renderer / Orchestrator / Types 六層職責劃分。
- **事件驅動通訊**：組件間通訊完全依賴 `CustomEvent`，契約定義於 `types.ts`。嚴禁全域變數直接互通。
- **單向數據流**：全域 `AppStateManager` 維護狀態，`AppEventOrchestrator` 協調流轉。
- **狀態機正規化**：模式轉換必須透過正規有限狀態機 (FSM) 管控，具備轉移守衛 (Guards)、進入/退出動作 (Entry/Exit Actions)、轉移鎖 (Transition Lock)。禁止散落的 class 切換邏輯。
- **可見性單一控制源**：元素的模式相關可見性必須統一由 CSS body-class 後代選擇器控制（CSS-driven visibility）。JS 層僅負責切換 body class，嚴禁在 JS 層直接操作 `style.display` / `style.opacity` 來控制模式相關可見性。
- **Fullscreen 生命週期整合**：全螢幕進入/退出必須作為模式轉換生命週期(`afterEnter` 階段)的一部分執行，嚴禁在事件處理器中散落呼叫 `requestFullscreen()` / `exitFullscreen()`。
- **原子化拆分**：任何模組超過 300 行必須進行職責拆分；任何內聯 `<style>` 超過 100 行必須外部化。
- **原子化設計 (Atomic Design)**：CSS 與 TS 模組遵循 `atoms → molecules → organisms → template → media-queries` 分層。大檔案轉換為聚合器（CSS `@import`）或薄協調器（TS thin orchestrator），子模組按職責拆分至同名子目錄。

### III. 類型安全不可協商 (Type Safety Non-Negotiable)

- 全面使用 TypeScript Interface 與 Type Alias 定義跨模組通訊契約。
- 所有 `CustomEvent` Payload 必須在 `types.ts` 中明確定義泛型類型。
- 嚴禁使用 `any` 類型。
- 事件發送者與接收者必須共享相同的型別定義。

### IV. 品質門檻 (Quality Gates)

任何功能開發或 Bug 修復的「完成定義 (Definition of Done)」：

- **前端**：`npm run lint` 必須 **Zero Errors**（ESLint with TypeScript support）。
- **Python 腳本**：`ruff check .` 必須全通過。
- **視覺驗證**：必須同時在手機（< 768px）與桌面（≥ 1024px）驗證排版完整性。
- **事件驗證**：新增或修改的 CustomEvent 必須驗證發送者與接收者的 Payload 一致性。

### V. 響應式設計與行動優先 (Responsive & Mobile-First)

- 以手機版面為基礎，透過 `min-width` 媒體查詢漸進式增強。
- 嚴禁在佈局中使用固定像素值；必須使用 `vw`, `vh`, `%`, `clamp()`, `rem` 等相對單位。
- 所有可觸控元件最小面積不低於 `44x44px`。
- 斷點系統：Mobile (< 768px) / Tablet (≥ 768px) / Desktop (≥ 1024px) / Wide (≥ 1440px)。

### VI. 命名即文件 (Naming is Documentation)

- **CSS 檔案**：`kebab-case`，禁止使用 `base.css` 或 `index.css` 等通用名稱。
- **JS/TS 模組**：`kebab-case`（檔案）、`PascalCase`（Astro 組件）。
- **Class 命名**：輕量 BEM 風格，強調語義分組（`.group-image`, `.group-calendar`）。
- **Custom Events**：`kebab-case`，描述「發生了什麼」而非「要做什麼」。
- **變數命名**：`camelCase`，DOM 元素使用類型後綴（`btnNext`, `panelToday`）。

### VII. 簡單性原則 (Simplicity & YAGNI)

- 不提前設計未需要的功能。
- 不引入不必要的第三方函式庫；優先使用原生 DOM API。
- 不過度抽象；抽象層級應與當前功能複雜度匹配。
- 複雜邏輯必須撰寫「中英對照」註解，說明「為什麼這樣做」。

---

## 技術限制條件 (Technical Constraints)

### 技術棧

| 項目         | 選型                     | 備註                             |
| ------------ | ------------------------ | -------------------------------- |
| **核心框架** | Astro v4.16+             | 群島架構 (Island Architecture)   |
| **語言**     | TypeScript (ESM)         | 強制 ES Modules                  |
| **品質工具** | ESLint + Prettier + Ruff | Zero Errors 政策                 |
| **路徑解析** | `@/` → `src/`            | tsconfig.json paths              |
| **PWA**      | @vite-pwa/astro          | autoUpdate 策略                  |
| **農曆引擎** | 本地 lunar-core.js       | 基於 lunar-javascript，1900-2100 |
| **狀態儲存** | IndexedDB + localStorage | 零伺服器、客戶端私有             |

### 效能要求

- 首屏加載：8 秒超時保護，強制門限確保進入應用。
- 圖片預熱：`Promise.all` 併發預載，禁止序列阻塞。
- 邏輯門鎖：加載完成必須同時滿足「靜態資源就緒」+「應用邏輯就緒」雙重條件。
- 背景切換：1.6s `cubic-bezier(0.2, 0.8, 0.2, 1)` 過渡。
- 音訊淡入淡出：≥ 1000ms Logarithmic Fade。
- **模式轉換延遲**：≤ 200ms（不含 CSS 動畫時間），所有 DOM 變更必須在單一 `requestAnimationFrame` 內批次完成。
- **轉場幀率**：模式切換期間 CSS transition/animation 維持 ≥ 55fps。
- **佈局穩定性**：模式切換禁止觸發 Cumulative Layout Shift (CLS > 0)。
- **CSS 動畫協調**：JS 轉換在 rAF 內完成 DOM 變更後，CSS transition 負責視覺過渡。JS 不得使用 `setTimeout` 模擬動畫延遲，改用 `transitionend` / `animationend` 事件協調後續邏輯。

### 安全要求

- 所有外部音訊串流強制 HTTPS。
- 自訂電台輸入需做格式驗證。
- 用戶資料僅存儲於本地（IndexedDB / localStorage），不傳輸至任何伺服器。

---

## 開發流程 (Development Workflow)

1. **Coding**：依據本憲章與架構規範撰寫模組化代碼。
2. **Linting**：執行 `npm run lint` 與 `ruff check .`，確保 Zero Errors。
3. **Documentation**：更新 SDD 或相關架構文件，確保文檔與代碼同步。
4. **Verification**：驗證事件流與狀態變更是否符合 `types.ts` 契約。
5. **Visual QA**：在 Mobile + Desktop 雙端驗證排版與轉場效果。
6. **Commit**：撰寫清晰的 Commit Message。

---

## 治理機制

- 本憲章為所有開發決策的最高指導原則。
- 任何違反憲章的技術選型需在 `complexity-tracking` 中記錄理由。
- 修訂憲章需附帶變更摘要與影響分析。
- 執行階段的細節指引請參閱 `.agent/CODING_STANDARDS.md` 與 `.agent/NAMING_STANDARDS.md`。

**版本**：1.3.0 | **通過日期**：2026-02-17 | **最後修訂**：2026-03-04

### 修訂記錄

| 版本  | 日期       | 變更摘要                                                                |
| ----- | ---------- | ----------------------------------------------------------------------- |
| 1.0.0 | 2026-02-17 | 初始版本                                                                |
| 1.1.0 | 2026-02-17 | 新增 FSM 正規化原則、模式轉換效能要求（rAF 批次、CLS 零容忍）           |
| 1.2.0 | 2026-02-17 | 新增可見性單一控制源原則、Fullscreen 生命週期整合原則、CSS 動畫協調要求 |
| 1.3.0 | 2026-03-04 | 新增原子化設計 (Atomic Design) 方法論原則，CSS/TS 分層標準化            |
