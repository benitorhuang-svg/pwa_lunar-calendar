# Coding & Quality Standards (程式碼品質規範)

本文件定義專案的程式碼品質標準。所有提交的程式碼必須嚴格遵守以下規範，確保專案的可維護性與穩定性。

## 1. 強制性品質檢查 (Mandatory Quality Checks)

**"Definition of Done" (完成的定義)**：
任何功能開發或 Bug 修復，在標記為「完成」之前，**必須**通過以下的自動化檢查。

### A. 前端程式碼 (JavaScript / Astro)

- **檢測工具**: [ESLint](https://eslint.org/)
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

## 2. JavaScript / Astro 開發準則

### 核心原則 (Core Principles)

- **Vanilla JS over Frameworks**: 在 `script` 標籤中，優先使用原生 DOM API，避免引入不必要的輕量級框架。
- **Modular Architecture (ESM)**: 強制採用 ES Modules。所有邏輯應抽離至 `src/scripts/` 下的獨立模組。
- **Class-Based Encapsulation**: 邏輯應封裝在 Class 中 (如 `DataManager`, `Renderer`, `EventHandlers`)，並透過 `constructor` 進行依賴注入。
- **Explicit State**: 狀態變更應透過全域 `AppStateManager` 維護，嚴禁隱式修改全域變數。

### 最佳實踐 (Best Practices)

- **事件驅動 (Event-Driven)**: 組件間通訊必須使用 `CustomEvent`。
    - **發送者**: 使用 `window.dispatchEvent(new CustomEvent('name', { detail: ... }))`。
    - **接收者**: 在 Orchestrator 或 Handler 中使用 `addEventListener`。
- **職責分離 (SoC)**:
    - **Manager**: 處理資料、計算與狀態。
    - **Handler**: 處理使用者輸入與事件分配。
    - **Renderer**: 處理 DOM 操作與動畫。
    - **Orchestrator**: 負責跨模組的業務流轉。
- **非同步處理**: 優先使用 `async/await` 取代 `Promise.then`。
- **註解**: 複雜邏輯必須撰寫「中英對照」註解，說明「為什麼這樣做」。

## 3. Python 開發準則

### 核心原則

- **Type Hinting**: 關鍵函式應加上 Type Hints。
- **Modern Python**: 使用 Python 3.10+ 特性（如 `match/case`, `pathlib`）。

### 最佳實踐

- **Docstrings**: 模組與公開函式需包含 Docstring。
- **Path Handling**: 嚴禁使用字串拼接路徑，必須使用 `os.path.join` 或 `pathlib.Path`，確保跨平台兼容性（Windows/macOS/Linux）。

## 4. 工作流 (Workflow)

開發者應遵循以下循環：

1.  **Coding**: 撰寫模組化代碼。
2.  **Linting**: 執行 `npm run lint` 與 `ruff check .`，確保 **Zero Errors**。
3.  **Documentation**: 更新 `SDD` 或相關架構文件，確保文檔與代碼同步。
4.  **Verification**: 驗證事件流與狀態變更是否符合預期。
5.  **Commit**: 提交清晰的 Commit Message。

---

_程式碼品質不是發生在測試階段，而是發生在每一次按下存檔的瞬間。_
