# 功能規格說明：農民曆 PWA — 沉浸式時間藝術品 (Lunar Calendar PWA)

**建立日期**：2026-02-17  
**狀態**：定稿  
**輸入**：既有專案原始碼、SDD 文件群、技術文件、UI/UX 規範

---

## 用戶情境與測試

### User Story 1 — 智能儀式啟動與歡迎體驗 (Priority: P1) 🎯

使用者開啟應用程式後，經歷一段精心設計的「儀式感」開場：從載入畫面、資源預熱到歡迎卡片浮現，形成流暢而優雅的第一印象。

**優先級說明**：這是使用者的第一接觸點，直接決定產品的品質感知。啟動流程的穩定性與流暢度關乎留存率。

**獨立測試方式**：可在全新瀏覽器環境下直接開啟首頁，驗證從進度條到歡迎卡片的完整流程。

**驗收情境**：

1. **Given** 使用者首次開啟應用, **When** 頁面載入, **Then** 顯示載入進度條，平行預載核心腳本 (15%)、首張 Hero 圖 (25%)、字體 (15%)、輪播圖 (15%)、音訊 (10%)、SW 更新 (20%)，權重加總 100%。
2. **Given** 所有資源就緒且 `app-logic-ready` 訊號已收到, **When** 進度條到達 100%, **Then** 載入遮罩溶解與歡迎卡片浮現零時差同步啟動 (2.2s 過渡)。
3. **Given** 極端網路環境, **When** 資源加載超過 8 秒, **Then** 強制門限觸發，進度條跳至 100% 並進入應用。
4. **Given** 使用者已進入歡迎模式, **When** 無任何操作超過 6 秒（閒置監控不追蹤滑鼠移動）, **Then** 歡迎卡片淡出，自動進入沉浸模式。
5. **Given** 歡迎模式中, **When** 使用者點擊背景或右上角日曆圖示, **Then** 切換至日曆主模式。

---

### User Story 2 — 日曆查詢與農曆資訊 (Priority: P1) 🎯

使用者在日曆主模式中查詢任意日期的農曆資訊、節氣、宜忌等傳統數據，並能快速切換年月。

**優先級說明**：這是產品的核心功能——農民曆資訊查詢，為所有交互的基礎。

**獨立測試方式**：進入日曆模式後，選取不同月份/年份，點選日期查看今日面板詳情。

**驗收情境**：

1. **Given** 日曆主模式, **When** 網格呈現, **Then** 顯示 5×7 或 6×7 日期格，週首以傳統漢字標註（日一二三四五六），前後月灰色填充。
2. **Given** 日期格, **When** 呈現單元格, **Then** 西曆大數字位於左上，農曆日期或節氣標註位於右下。節慶字體紅色強調，節氣字體金色強調。
3. **Given** 使用者點選日期, **When** `date-selected` 事件觸發, **Then** 底部彈出「今日詳情面板」，顯示：農曆日期、干支紀年、生肖、建除十二神吉凶、二十八宿值日、宜忌項目。
4. **Given** 使用者左右滑動日曆 (≥50px), **When** `navigate-month` 事件觸發, **Then** 日曆以滑動動畫切換至上/下月，標題同步更新。
5. **Given** 使用者點選年月選擇器, **When** `toggle-panel` 觸發 `yearMonth` 類型, **Then** 年份以 5×2 網格（十年範圍）顯示，月份以 4×3 網格顯示。選中後 200ms 延遲關閉面板。
6. **Given** 使用者點選灰色跨月日期格, **When** 日期屬前/後月, **Then** 自動跨月跳轉並重繪網格。

---

### User Story 3 — 映畫互動與背景賞析 (Priority: P1) 🎯

使用者透過映畫模式進行背景圖片的手動/ 自動瀏覽、切換藝廊來源、享受沉浸式視覺體驗。

**優先級說明**：映畫模式是產品「時間的藝術品」定位的核心支撐。賞析體驗的流暢度與畫質直接影響品牌印象。

**獨立測試方式**：從日曆或歡迎模式切換至映畫，操作 Dock 按鈕切換圖片、選擇藝廊模式，進入/退出沉浸 (Zen) 模式。

**驗收情境**：

1. **Given** 映畫模式, **When** 進入, **Then** 顯示底部 Dock + 頂部 Header（資訊條）+ 右上工具按鈕。Dock 色系全域同步切換為「極地純銀 & 晶透白」。
2. **Given** Dock 中間槽位, **When** 映畫模式, **Then** 顯示藝廊控制功能組（`.group-image`），隱藏日曆功能組（`.group-calendar`）。
3. **Given** 映畫模式, **When** 點擊 `< >` 導航箭頭或左右滑動, **Then** 切換至播放列表中的上/下張圖片，轉場 1.6s `cubic-bezier(0.2, 0.8, 0.2, 1)` 平移與淡入。
4. **Given** 藝廊選單, **When** 使用者切換模式, **Then** 三種模式可選：Default（季節圖）、Custom（自選圖）、Hybrid（混合）。Custom 空白時顯示 Fallback 圖片與紅色警告提示。
5. **Given** 映畫模式, **When** 閒置 5 秒, **Then** IdleManager 觸發 `artwork-idle-slide` 自動切換下一張。
6. **Given** 映畫模式, **When** 使用者點擊背景, **Then** 進入 Zen 沉浸模式，呼叫 `requestFullscreen()`，全螢幕顯示，隱藏所有 UI。
7. **Given** Zen 模式中, **When** 使用者點擊畫面或按 Esc, **Then** 呼叫 `exitFullscreen()`，返回映畫模式，Dock/Header 重新顯示。系統監聽 `fullscreenchange` 確保同步。
8. **Given** 首次進入 Zen 模式, **When** 手勢引導顯示, **Then** 半透明滑動動畫提示「左右滑動切換背景」，4.5 秒後淡出，localStorage 記錄不再顯示。

---

### User Story 4 — 音樂播放與電台管理 (Priority: P2)

使用者可播放禪意環境音或自訂線上電台，享受聽覺沈浸體驗，並管理自己的音樂偏好。

**優先級說明**：音樂是沈浸體驗的隱形支柱，直接提升環境氛圍品質。但不影響核心日曆與視覺功能。

**獨立測試方式**：點擊音樂按鈕，測試播放/暫停/切換、新增/刪除自訂電台、跨 Session 記憶恢復。

**驗收情境**：

1. **Given** 音樂播放器初始化, **When** 存在 `localStorage` 中的上次 URL, **Then** 自動設定 `audio.src` 為準備就緒狀態，發送 `music-restored` 事件，同步高亮對應電台項目。
2. **Given** 使用者點擊播放, **When** 音訊開始, **Then** 具備 ≥1000ms 的淡入效果，對應電台項目顯示呼吸燈波紋。
3. **Given** 使用者輸入自訂電台 URL, **When** URL 為有效 HTTPS 格式, **Then** 新增至 IndexedDB，刷新後保留。點擊既有電台僅切換播放，不重複新增。
4. **Given** 使用者刪除電台, **When** 確認操作, **Then** 從 IndexedDB 移除（含預設與自訂電台皆可刪除）。
5. **Given** 分頁隱藏, **When** `visibilitychange` 為 hidden, **Then** 自動暫停播放；切回時自動恢復。

---

### User Story 5 — 動態主題與季節系統 (Priority: P2)

應用根據當前月份與特定節慶自動切換系統主題色，讓視覺體驗與真實時間共鳴。

**優先級說明**：動態主題是「時間的藝術品」概念的延伸，讓應用具備時間感知力。

**獨立測試方式**：手動切換月份至不同季節範圍，驗證主題色（Spring/Summer/Autumn/Winter/Festive/Dark）是否正確套用。

**驗收情境**：

1. **Given** 目前月份為 2-4 月, **When** 主題計算, **Then** 套用 `theme-spring`。5-7 月 → `theme-summer`。8-10 月 → `theme-autumn`。11-1 月 → `theme-winter`。
2. **Given** 春節日期, **When** 主題計算, **Then** 覆寫為 `theme-festive`（紅色主導）。
3. **Given** 主題切換, **When** CSS 變數更新, **Then** 背景色、文字色、邊框色以 0.6s `cubic-bezier(0.22, 1, 0.36, 1)` 緩動過渡。
4. **Given** 日曆模式, **When** Dock 色系, **Then** 同步為「暖曜 Obsidian & 香檳金」。強調色 `#D4AF37`。
5. **Given** 映畫模式, **When** Dock 色系, **Then** 同步為「極地純銀 & 晶透白」。強調色 `#FFFFFF`。

---

### User Story 6 — PWA 安裝與離線能力 (Priority: P3)

使用者可將應用安裝至裝置桌面，並在離線狀態下繼續使用已快取的資源。

**優先級說明**：PWA 能力強化用戶黏著度與使用便利性。但應用核心功能不依賴此。

**獨立測試方式**：在支援 PWA 的瀏覽器中觸發安裝提示，斷網後驗證已快取頁面的可用性。

**驗收情境**：

1. **Given** 支援 PWA 的環境, **When** `deferredPrompt` 可用, **Then** 顯示「加到主畫面」按鈕。
2. **Given** Service Worker 偵測到更新, **When** `registration.waiting` 存在, **Then** 強制 `skipWaiting` 即時更新。12 秒超時後仍允許進入。
3. **Given** 離線狀態, **When** 使用者開啟已安裝的 PWA, **Then** 已快取的頁面、圖片、字體可正常顯示與操作。

---

### User Story 7 — FAQ 面板與知識引導 (Priority: P3)

使用者可透過 FAQ 面板了解應用的功能與操作方式。

**優先級說明**：降低新使用者的學習門檻。但不影響核心功能使用。

**獨立測試方式**：點擊右上角 FAQ 按鈕，驗證面板開關、手風琴展開收合、遮罩關閉行為。

**驗收情境**：

1. **Given** 映畫模式右上工具列, **When** 使用者點擊 FAQ 按鈕（❓）, **Then** 顯示玻璃質感浮動面板，含問答條目與關閉鈕。
2. **Given** FAQ 面板已開啟, **When** 點擊背景遮罩或關閉鈕, **Then** 面板關閉。
3. **Given** FAQ 面板, **When** 點擊問題項目, **Then** 手風琴展開/收合對應答案。

---

### 邊界情境

- 當使用者在極慢網路 (2G) 環境下開啟時？→ 8 秒超時門限強制進入，首張季節圖確定性預載。
- 當 Custom 藝廊為空時？→ 顯示 Fallback 圖片 (`default/1.png`) + 紅色警告框，自動開啟圖片管理選單引導匯入。
- 當外部電台 URL 無法播放時？→ 錯誤處理與 Fallback 到下一首。
- 當使用者透過系統按鈕退出全螢幕？→ 監聽 `fullscreenchange`，自動從 Zen 回到 Artwork。
- 當農曆查詢日期超出 1900-2100 範圍？→ 按算法邊界限制處理。
- 當多個面板疊加操作時？→ Toggle 同面板為關閉，Toggle 不同面板為切換，背景遮罩同步。
- 當使用者高頻點擊模式切換按鈕（<200ms 間隔）？→ 轉移鎖拒絕重疊轉換，確保每次轉換完整結束後才接受下一次。
- 當 `requestFullscreen()` 被瀏覽器拒絕（如 iOS Safari）？→ 進入 Zen 模式但不強制全螢幕，UI 仍正常隱藏。
- 當模式轉換中途觸發新的轉換請求？→ 排隊等候當前轉換完成，不丟棄亦不覆蓋。
- 當轉換過程中發生 JavaScript 異常？→ 錯誤恢復機制安全回滾至 Calendar，釋放轉移鎖，清除所有計時器。
- 當 Welcome 模式下 capture 階段的 background click handler 先於 WelcomeOverlay 觸發？→ handler 內模式守衛判斷 `mode === "welcome"` 直接 return，由 WelcomeOverlay 專責處理。
- 當 `fullscreenchange` 事件在轉移鎖鎖定期間觸發（如轉換 Artwork→Zen 進行中使用者按 Esc）？→ 退出事件排入轉換佇列，待當前轉換完成後依序處理。
- 當使用者在 CSS transition 動畫執行中（如 Dock 淡入 0.4s）點擊 Dock 按鈕？→ 轉移鎖阻擋新轉換，排入佇列。CSS transition 透過 `pointer-events: none` 在轉換期間停用按鈕。
- 當面板在非 panel-friendly 模式（Artwork/Zen/Welcome）意外殘留？→ `setMode()` 主動清除 `activePanel`，不依賴異步事件。

---

## 需求

### 功能性需求

- **FR-001**：系統必須在啟動時平行預載核心資源（圖片、字體、腳本、音訊），並以加權進度條反映真實載入狀態。
- **FR-002**：系統必須支援五種操作模式（Welcome / Calendar / Artwork / Zen / Note），並透過集中式有限狀態機 (FSM) 管理模式轉換，具備轉移守衛與轉移鎖。
- **FR-002a**：FSM 必須定義合法轉移路徑表（Transition Table），拒絕非法轉移並記錄警告日誌。
- **FR-002b**：每次模式轉換必須經歷 `beforeExit(from)` → `beforeEnter(to)` → `DOM batch update (rAF)` → `afterEnter(to)` 四階段生命週期。
- **FR-002c**：模式轉換期間必須啟用轉移鎖 (Transition Lock)，鎖定期間的轉換請求排入佇列，按序執行。
- **FR-002d**：轉換過程中的異常必須觸發錯誤恢復機制，安全回滾至 Calendar 模式，並無條件釋放轉移鎖。
- **FR-002e**：Fullscreen 進入/退出操作必須作為轉換生命週期 `afterEnter` 階段的一部分執行，不得在事件處理器中獨立呼叫。
- **FR-003**：系統必須即時計算並顯示農曆日期、二十四節氣、天干地支、生肖、建除十二神、二十八宿值日、宜忌項目。
- **FR-004**：系統必須支援 4K 畫質的背景圖片展示，具備緩慢推進動畫效果與 1.6s 絲綢切換過渡。
- **FR-005**：系統必須根據月份/節慶自動切換色彩主題（7 種主題），且轉場具備 0.6s 緩動。
- **FR-006**：系統必須支援音樂播放（內建曲目 + 自訂 HTTPS 電台），具備淡入淡出、狀態記憶、分頁感知。
- **FR-007**：系統必須支援 IndexedDB 儲存使用者自訂圖片與電台清單，實現離線持久化。
- **FR-008**：系統必須在日曆與映畫模式間自動切換 Dock 色系（金色↔銀色）及功能槽位（年月↔藝廊），所有色系變更在同一 rAF 幀內完成。
- **FR-009**：系統必須支援 PWA 安裝、Service Worker 更新偵測與離線快取。
- **FR-010**：系統必須在沉浸模式中整合瀏覽器 Fullscreen API，並監聽 `fullscreenchange` 實現狀態同步。當 `requestFullscreen()` 失敗時，仍須正常進入 Zen 模式（降級處理）。`fullscreenchange` listener 必須檢查轉移鎖狀態，鎖定中的退出事件排入佇列。
- **FR-011**：系統必須提供 FAQ 面板，以手風琴形式展示操作指南。
- **FR-012**：系統必須在 Zen 模式支援左右滑動手勢切換背景。
- **FR-013**：模式切換時的 DOM class 變更必須使用原子替換（先 add 新 class，再 remove 舊 class），避免中間幀無 class 的佈局閃爍。
- **FR-014**：所有模式相關的 UI 元素可見性必須由 CSS body-class 後代選擇器統一控制。JS 層禁止使用 `style.display` / `style.opacity` 控制模式相關可見性，避免 inline style 覆蓋 CSS 規則。
- **FR-015**：Welcome 模式的閒置自動轉場超時必須為 6 秒，與 Artwork 模式的 15 秒閒置超時使用獨立計時器，不得共用。
- **FR-016**：背景 click 事件 handler 必須在 handler 開頭進行模式守衛檢查，Welcome 模式下的點擊由 WelcomeOverlay 專責處理，background handler 不得攔截。

### 主要實體

- **AppState**：核心應用狀態，包含 `mode`, `selectedDay/Month/Year`, `activePanel`, `today`。
- **AppMode**：`"welcome" | "calendar" | "artwork" | "zen" | "note"` 列舉型態。
- **Lunar**：農曆計算物件，提供干支、生肖、節氣、節慶、宜忌等方法。
- **Theme**：`theme-spring | theme-summer | theme-autumn | theme-winter | theme-festive | theme-dark | theme-light` 主題常量。
- **CustomEvent Contracts**：20+ 種事件定義，含 Payload 型別，定義於 `types.ts`。

---

## 成功標準

### 可衡量成果

- **SC-001**：首屏加載至歡迎卡片顯示不超過 8 秒（含超時保護）。
- **SC-002**：五種模式間的轉換延遲不超過 200ms（不含動畫時間），所有 DOM 變更在單一 rAF 內完成。
- **SC-003**：ESLint 與 Ruff 品質門檻達成 Zero Errors。
- **SC-004**：在 iPhone SE（375px）至 4K 桌面（3840px）範圍內排版完整無破損。
- **SC-005**：背景圖片切換動畫保持 60fps 流暢度。
- **SC-006**：Dock 色系切換與模式轉換同秒同步完成，零視覺延遲。
- **SC-007**：使用者自訂電台與圖片在跨 Session 後仍完整保存。
- **SC-008**：模式切換期間 CLS (Cumulative Layout Shift) 為 0——無佈局跳動或閃爍。
- **SC-009**：高頻操作壓力測試（≤100ms 間隔連續點擊模式按鈕 20 次），應用不崩潰、不進入非法狀態、最終穩定在正確模式。
- **SC-010**：`types.ts` 中所有 CustomEvent Payload 型別定義無 `any` 類型使用。
- **SC-011**：Welcome 模式閒置自動轉場在靜止 6 秒後觸發（誤差 ≤500ms），絕非 15 秒。
- **SC-012**：Fullscreen 進入/退出操作僅在轉換生命週期的 `afterEnter` 階段執行，`grep -r "requestFullscreen\|exitFullscreen" src/scripts/` 結果僅出現在轉換生命週期管理器中。
- **SC-013**：`grep -r "style\.display\|style\.opacity\|style\.pointerEvents" src/scripts/hero/ui/` 結果中，不含模式相關可見性控制（僅允許非模式相關的動態 UI 操作，如 toast、安裝按鈕）。
- **SC-014**：轉換過程中故意拋出異常（DevTools inject），系統在 200ms 內恢復至 Calendar 模式，轉移鎖正常釋放。
