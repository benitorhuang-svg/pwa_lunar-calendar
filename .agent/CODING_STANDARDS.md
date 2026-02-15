# Coding & Quality Standards (程式碼品質規範)

本文件定義專案的程式碼品質標準。所有提交的程式碼必須嚴格遵守以下規範，確保專案的可維護性與穩定性。

## 1. 強制性品質檢查 (Mandatory Quality Checks)

**"Definition of Done" (完成的定義)**：
任何功能開發或 Bug 修復，在標記為「完成」之前，**必須**通過以下的自動化檢查。

### A. 前端程式碼 (JavaScript / Astro / TypeScript)

- **檢測工具**: [ESLint](https://eslint.org/) (with TypeScript support)
- **執行指令**:
    ```bash
    npm run lint
    ```
- **通過標準**: **Zero Errors**. 所有報錯必須修正，不得忽略。

### B. Python 腳本 (Backend / Tools)

- **檢測工具**: [Ruff](https://docs.astral.sh/ruff/)
- **執行指令**:
    ```bash
    ruff check .
    ```
- **通過標準**: 所有 Linter 錯誤必須修正。

## 2. JavaScript / TypeScript 開發準則

### 核心原則 (Core Principles)

- **Vanilla TS over Frameworks**: 在 `script` 標籤中，優先使用原生 DOM API，避免引入不必要的輕量級框架。
- **Modular TypeScript (ESM)**: 強制採用 ES Modules。所有邏輯應抽離至 `src/scripts/` 下的獨立模組 (.ts)。
- **Class-Based Encapsulation**: 邏輯應封裝在 Class 中 (如 `DataManager`, `Renderer`, `EventHandlers`)，並透過 `constructor` 進行依賴注入。
- **Explicit State**: 狀態變更應透過全域 `AppStateManager` 維護，嚴禁隱式修改全域變數。
- **Strong Typing**: 善用 TypeScript 的 Interface 與 Type Alias，特別是對於 `CustomEvent` 的 Payload，必須在 `types.ts` 中明確定義。

### 最佳實踐 (Best Practices)

- **事件驅動 (Event-Driven)**: 組件間通訊必須使用 `CustomEvent` 並指定泛型 `<DetailType>`。
    - **發送者**: `window.dispatchEvent(new CustomEvent<DetailType>('name', { detail: ... }))`。
    - **接收者**: `window.addEventListener('name', ((e: CustomEvent<DetailType>) => { ... }) as EventListener)`。
- **職責分離 (SoC)**:
    - **Manager**: 處理資料、計算與狀態。
    - **Handler**: 處理使用者輸入與事件分配。
    - **Renderer**: 處理 DOM 操作與動畫。
    - **Orchestrator**: 負責跨模組的業務流轉。
- **非同步處理**: 優先使用 `async/await` 取代 `Promise.then`。
- **資源路徑**: 在 CSS 中引用 `public/` 資源時，若需作為 Fallback 或建置資源，應使用相對路徑 (`../../public/...`) 以確保 Vite 正確解析。
- **組件內部腳本**: 優先使用「模組化熱插拔」設計。大片段 JS 邏輯必須透過 `import` 載入外部模組，保持 `.astro` 檔案的 `script` 標籤簡潔。
- **註解**: 複雜邏輯必須撰寫「中英對照」註解，說明「為什麼這樣做」。

## 3. Astro 組件與 CSS 樣式準則 (Component & Styling)

### 組件模組化 (Component Modularity)

- **原子化設計 (Atomic Design)**：遵循 Brad Frost 的原子設計理論，將 UI 拆分為不同層級，確保組件的高度重用性。
    - **原子 (Atoms)**：最基礎的 HTML 標籤、SVG 圖示或單一功能的基礎組件。
    - **分子 (Molecules)**：由多個原子組合成的簡單功能塊 (例：帶有刪除按鈕的電台列、帶有圖示的導航按鈕)。
    - **生物 (Organisms)**：由分子與原子構成的複雜 UI 區域 (例：整個 `HeroDock.astro` 或 `HeroGallerySubmenu.astro`)。
- **拆分時機**：當組件滿足以下任一條件時，**必須**進行拆分：
    - 總行數超過 300 行。
    - 包含超過 100 行的內聯 `<style>`。
    - 包含明顯的獨立子區域 (如選單、側邊欄、清單項)。
- **命名規範**：子組件應放置在父組件同目錄下，並以父組件名為前綴 (例如 `HeroDock.astro` 與 `HeroGallerySubmenu.astro`)。

### 樣式管理 (Style Management)

- **外部化優先 (Externalize Styles)**：大於 30 行的 CSS 樣式應抽離至 `src/styles/` 目錄下的專屬 `.css` 檔案。
- **載入方式**：在 Astro Frontmatter 中使用 `import "../../styles/...";` 進行載入，而非使用 `<link>` 標籤，以利於 Astro 進行資源優化。
- **作用域隔離**：除非是全域樣式，否則應善用 Astro 的內建作用域或明確的 CSS Class 命名規範。

## 4. Python 開發準則

### 核心原則

- **Type Hinting**: 關鍵函式應加上 Type Hints。
- **Modern Python**: 使用 Python 3.10+ 特性（如 `match/case`, `pathlib`）。

### 最佳實踐

- **Docstrings**: 模組與公開函式需包含 Docstring。
- **Path Handling**: 嚴禁使用字串拼接路徑，必須使用 `os.path.join` 或 `pathlib.Path`，確保跨平台兼容性（Windows/macOS/Linux）。

## 5. 工作流 (Workflow)

開發者應遵循以下循環：

1.  **Coding**: 撰寫模組化代碼並進行組件拆分。
2.  **Linting**: 執行 `npm run lint` 與 `ruff check .`，確保 **Zero Errors**。
3.  **Documentation**: 更新 `SDD` 或相關架構文件，確保文檔與代碼同步。
4.  **Verification**: 驗證事件流與狀態變更是否符合預期。
5.  **Commit**: 提交清晰的 Commit Message。

---

_程式碼品質不是發生在測試階段，而是發生在每一次按下存檔的瞬間。_
