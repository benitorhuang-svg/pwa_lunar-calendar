# UI Flow & Logic Architecture (UI 流程與邏輯架構)

此文件描述 "Lunar Calendar" 專案的核心 UI 狀態流轉、互動邏輯與設計哲學。

## 1. 五大核心狀態 (The 5 Core States)

本專案明確定義了五種使用者操作狀態，建構完整的心智模型 (Mental Model)：

### **狀態 1: 初始歡迎 (Initial State)**

- **畫面**: 全螢幕背景 + **今日詳情卡片** (紅卡)。
- **邏輯**: 程式啟動時的預設入口 (`initial-welcome`)。
- **顯示**: 隱藏底部 Dock 與導航，僅顯示中央卡片與背景。
- **流轉**:
    - 點擊右上角「日曆圖示」或畫面任意處 $\rightarrow$ **狀態 2 (日曆)**。

### **狀態 2: 日曆主模式 (Calendar State)**

- **畫面**: **日曆網格 (Grid View)** + 年月導航。
- **邏輯**: 資訊查詢的主模式，亦為預設工作區。
- **顯示**:
    - 顯示日曆網格、年月選擇器。
    - **註**: 此模式下隱藏頂部切換按鈕 (Toggle Button)，保持畫面純淨。
- **流轉**:
    - 點擊日曆背景 $\rightarrow$ **狀態 4 (映畫)**。
    - 點擊日期 $\rightarrow$ **狀態 5 (隨筆/詳情)**。

### **狀態 3: 純淨沉浸 (Zen State)**

- **畫面**: **純背景** (無底部 Dock，無頂部資訊)。
- **邏輯**: 視覺享受與環境氛圍模式 (Ambience Mode)。
- **顯示**: 隱藏所有 UI 元素 (Dock, Header, Panels)。
- **流轉**:
    - 從 **狀態 4** 閒置一段時間後自動進入。
    - 點擊畫面/互動 $\rightarrow$ **狀態 4 (映畫)**。

### **狀態 4: 映畫互動 (Artwork State)**

- **畫面**: 全螢幕背景 + **底部 Dock** (控制列)。
- **邏輯**: 互動式沉浸體驗，可切換背景、控制音樂。
- **顯示**:
    - 顯示底部 Dock (HeroDock)。
    - **註**: 此模式下隱藏頂部切換按鈕 (Toggle Button) 與頂部資訊條。
- **流轉**:
    - 點擊畫面中央/背景 $\rightarrow$ **狀態 3 (純淨)**。
    - (設計中) 透過特定操作 $\rightarrow$ **狀態 2 (日曆)**。

### **狀態 5: 隨筆紀錄 (Note State)**

- **畫面**: **隨筆面板 (PanelToday)** (包含輸入框、字體選擇、匯出)。
- **邏輯**: 專注於寫作與記錄的模式。
- **顯示**: 覆蓋於當前背景之上，顯示完整筆記功能。
- **流轉**:
    - 關閉面板 (Close) $\rightarrow$ 回到 **狀態 2 (日曆)**。

---

## 2. 狀態流轉圖 (State Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> State1_Initial: 程式啟動

    state State1_Initial {
        [*] --> WelcomeCard
        WelcomeCard --> State2_Calendar: 點擊背景 / 按鈕
    }

    state State2_Calendar {
        [*] --> GridView
        GridView --> State5_Note: 點擊日期
        GridView --> State4_Artwork: 點擊背景
    }

    state State4_Artwork {
        [*] --> DockVisible
        DockVisible --> State3_Zen: 點擊背景 / 閒置
    }

    state State3_Zen {
        [*] --> CleanView
        CleanView --> State4_Artwork: 點擊畫面
    }

    state State5_Note {
        [*] --> NotePanel
        NotePanel --> State2_Calendar: 關閉面板
    }
```

## 3. 關鍵互動邏輯 (Interaction Logic)

### 3.1 視圖切換 (Mode Switching)

- **按鈕**: `btnHeaderToggle` (頂部左側)。
- **行為**:
    - **在狀態 2 (日曆)**: 預設**隱藏**。使用者透過點擊背景進入狀態 4。
    - **在狀態 4 (映畫)**: 預設**隱藏**。

### 3.2 沉浸循環 (Immersion Loop)

- **Zen <-> Artwork**:
    - 這兩個狀態形成一個 "觀賞循環"。
    - **Zen (State 3)**: 提供無干擾的觀賞體驗。
    - **Artwork (State 4)**: 提供必要的控制功能 (換圖、音樂)。
    - 兩者透過點擊背景輕鬆切換。

---

## 4. 事件驅動架構 (Event Orchestration)

系統使用 `CustomEven` 進行狀態通知：

| 事件名稱 (Event)    | 參數 (Detail)                               | 描述                                |
| :------------------ | :------------------------------------------ | :---------------------------------- |
| `welcome-mode`      | `{ active: false, targetMode: 'calendar' }` | **強制進入狀態 2** (日曆主模式)。   |
| `welcome-mode`      | `{ active: true }`                          | **進入狀態 4** (映畫模式)。         |
| `close-panels`      | `{ showGrid: true }`                        | 關閉浮動層並顯示網格 (輔助狀態 2)。 |
| `slideshow-control` | `{ action: 'start', isArtwork: true }`      | 啟動輪播並顯示 Dock (輔助狀態 4)。  |

## 5. UI 層級規範 (Z-Index Hierarchy)

1.  **Bottom**: HeroBackground (`z-index: 1`)
2.  **Middle**: HeroHeader / Dock (`z-index: 2000`)
3.  **Top**: Floating Panels (Today/Note) (`z-index: 2200`)
4.  **Overlay**: WelcomeOverlay (`z-index: 100005`, 僅用於狀態 1)
