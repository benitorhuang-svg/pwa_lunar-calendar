# UI Flow & Logic Architecture (UI 流程與邏輯架構)

本文件使用 Mermaid 圖表描述專案的 UI 狀態流轉與事件驅動邏輯。

## 1. 核心狀態流轉圖 (Core State Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> Loading: 進入頁面
    Loading --> WelcomeMode: loader-finished (加載且動畫完成)
    
    state WelcomeMode {
        [*] --> TodayInfoCard: 顯示今日宜忌 (居中)
        TodayInfoCard --> [*]: 點擊卡片/背景
    }
    
    WelcomeMode --> CalendarGrid: 點擊卡片/進入主介面
    WelcomeMode --> ImmersionMode: 閒置 6 秒 (隱藏 UI 卡片)
    
    state CalendarGrid {
        [*] --> MonthView: 顯示日曆網格
        MonthView --> DateDetail: 點擊日期
        DateDetail --> MonthView: 關閉詳細資訊
        
        MonthView --> YearMonthSelector: 點擊年月按鈕
        YearMonthSelector --> MonthView: 選擇年月/跳轉
    }
    
    CalendarGrid --> ImmersionMode: 閒置 6 秒 (無觸碰) / 點擊「映畫」
    ImmersionMode --> CalendarGrid: 觸碰螢幕 / 點擊 (恢復介面)
    
    state ImmersionMode {
        [*] --> Slideshow: 自動幻燈片播放
        Slideshow --> Slideshow: 手動切換圖片
    }

    state GallerySubmenu {
        [*] --> MenuOpen: 點擊音樂/藝廊按鈕
        
        state MenuOpen {
            [*] --> Idle: 等待操作
            Idle --> PlayStream: 點擊既有電台 (Radio Preset)
            Idle --> InputUrl: 點擊「自訂網址」輸入框
            Idle --> DeleteStation: 點擊刪除按鈕 (X)
            
            InputUrl --> SaveAndPlay: 輸入完成 (Enter/Blur)
            SaveAndPlay --> Idle: 儲存至 IndexedDB 並播放
            
            DeleteStation --> ConfirmDelete: 彈出確認
            ConfirmDelete --> Idle:確認刪除/取消
        }
        
        MenuOpen --> [*]: 點擊外部/關閉
    }
```

## 2. 事件驅動架構 (Event-Driven Architecture)

應用程式採用解耦的事件驅動模型，由 `EventOrchestrator` 擔任指揮官。

```mermaid
graph TD
    subgraph "User Actions (Input)"
        UA1[點擊日期]
        UA2[導航按鈕/滑動]
        UA3[閒置逾時]
        UA4[點擊面板背景]
    end

    subgraph "Event Dispatcher (AppEventOrchestrator)"
        EO[Orchestrator]
    end

    subgraph "Managers (Logic & State)"
        SM[AppStateManager]
        IM[HeroImageManager]
        SSM[SlideshowManager]
    end

    subgraph "Renderers (UI Updates)"
        CR[CalendarRenderer]
        PR[PanelRenderers]
        HR[HeroRenderer]
    end

    UA1 --> EO
    UA2 --> EO
    UA3 --> EO
    UA4 --> EO

    EO --> SM
    SM -- "State Change" --> EO
    
    EO -- "render-calendar" --> CR
    EO -- "render-panels" --> PR
    EO -- "render-hero" --> HR
    EO -- "slideshow-control" --> SSM
```

## 3. 初始化流程 (Initialization Sequence)

```mermaid
sequenceDiagram
    participant B as Browser
    participant L as ResourceLoader
    participant AC as AppController
    participant EO as EventOrchestrator
    participant PH as PanelHandlers

    B->>L: 頁面加載
    L->>L: 預載圖片、字體、音頻
    L-->>B: 添加 .app-loaded Class (啟動揭幕動畫)
    L-->>B: 發送 loader-finished 事件 (動畫結束)
    
    B->>AC: DOMContentLoaded
    AC->>EO: init()
    B->>AC: 監聽到 loader-finished
    AC->>AC: activateWelcome()
    
    AC->>EO: updateState() (發送 render 事件)
    EO->>PH: render-panels (today)
    
    Note over AC, PH: 進入「歡迎模式」: 顯示今日宜忌，隱藏日曆網格
```

## 4. 文件維護說明
- **Mermaid 工具**: 建議使用 VS Code 的 Mermaid Preview 擴充功能查看。
- **邏輯變更**: 若修改 `src/scripts/app/` 下的控制項，請同步更新此圖表。
