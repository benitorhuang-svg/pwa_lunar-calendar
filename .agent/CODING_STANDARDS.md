# Coding & Quality Standards (程式碼品質規範)

本文件定義專案的程式碼品質標準。所有提交的程式碼必須嚴格遵守以下規範，確保專案的可維護性與穩定性。

## 1. 強制性品質檢查 (Mandatory Quality Checks)

**"Definition of Done" (完成的定義)**：
任何功能開發或 Bug 修復，在標記為「完成」之前，**必須**通過以下的自動化檢查。

### A. 前端程式碼 (JavaScript / Astro)
*   **檢測工具**: [ESLint](https://eslint.org/)
*   **執行指令**: 
    ```bash
    npm run lint
    ```
*   **通過標準**: **Zero Errors**. 所有報錯必須修正，不得忽略。

### B. Python 腳本 (Backend / Tools)
*   **檢測工具**: [Ruff](https://docs.astral.sh/ruff/)
*   **執行指令**:
    ```bash
    ruff check .
    ```
*   **通過標準**: 所有 Linter 錯誤必須修正。

## 2. JavaScript / Astro 開發準則

### 核心原則
*   **Vanilla JS over Frameworks**: 在 `script` 標籤中，優先使用原生 DOM API (`querySelector`, `addEventListener`)，避免引入不必要的輕量級庫。
*   **Explicit State**: 狀態變更應透過明確的函式調用或事件派發，禁止隱式修改全域變數。

### 最佳實踐
*   **事件驅動**: 組件間溝通必須使用 `CustomEvent`，禁止直接跨組件調用函式。
*   **非同步處理**: 優先使用 `async/await` 取代 `Promise.then`。
*   **註解**: 複雜邏輯（如農曆算法、座標計算）必須撰寫註解說明「為什麼這麼做」。

## 3. Python 開發準則

### 核心原則
*   **Type Hinting**: 關鍵函式應加上 Type Hints。
*   **Modern Python**: 使用 Python 3.10+ 特性（如 `match/case`, `pathlib`）。

### 最佳實踐
*   **Docstrings**: 模組與公開函式需包含 Docstring。
*   **Path Handling**: 嚴禁使用字串拼接路徑，必須使用 `os.path.join` 或 `pathlib.Path`，確保跨平台兼容性（Windows/macOS/Linux）。

## 4. 工作流 (Workflow)

開發者應遵循以下循環：
1.  **Coding**: 撰寫程式碼。
2.  **Self-Review**: 自我審查邏輯與命名。
3.  **Linting**: 執行 `npm run lint` 與 `ruff check .`。
4.  **Fixing**: 修正所有 Linter 回報的問題。
5.  **Commit**: 提交程式碼。

---
*程式碼品質不是發生在測試階段，而是發生在每一次按下存檔的瞬間。*
