/**
 * 集中式事件名稱常數
 * Centralized Event Name Constants
 *
 * 所有自訂 CustomEvent 名稱統一在此定義，
 * 避免字串拼寫錯誤、提供 IDE 自動補全與 Refactor-safe。
 *
 * 使用方式：
 *   import { APP_EVENTS } from "../core/eventNames";
 *   window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSITION_MODE, { detail }));
 */

export const APP_EVENTS = {
    // --- Lifecycle ---
    /** resourceLoader → appController: 所有腳本就緒 */
    APP_LOGIC_READY: "app-logic-ready",
    /** imageManager → resourceLoader: 圖庫預載完成 */
    APP_IMAGES_PRELOADED: "app-images-preloaded",
    /** resourceLoader → 全域: 載入完成，overlay 移除後 */
    LOADER_FINISHED: "loader-finished",

    // --- Mode Transitions ---
    /** 模式切換請求 (detail: { to: AppMode }) */
    TRANSITION_MODE: "transition-mode",
    /** 模式切換完成通知 (detail: { mode: AppMode }) */
    MODE_CHANGED: "mode-changed",

    // --- Navigation ---
    /** 日期導航 (detail: -1 | 1) */
    NAVIGATE_DAY: "navigate-day",
    /** 月份導航 (detail: -1 | 1) */
    NAVIGATE_MONTH: "navigate-month",
    /** 跳回今天 */
    GO_TO_TODAY: "go-to-today",

    // --- Selection ---
    /** 日曆格選取 (detail: { year, month, day }) */
    DATE_SELECTED: "date-selected",
    /** 年份選取 (detail: number) */
    YEAR_SELECTED: "year-selected",
    /** 月份選取 (detail: number) */
    MONTH_SELECTED: "month-selected",

    // --- Rendering ---
    /** 觸發日曆渲染 (detail: CalendarRenderDetail) */
    RENDER_CALENDAR: "render-calendar",
    /** 觸發 Hero 區渲染 (detail: RenderHeroDetail) */
    RENDER_HERO: "render-hero",
    /** 觸發面板渲染 (detail: RenderPanelsDetail) */
    RENDER_PANELS: "render-panels",
    /** 更新日曆標題 (detail: UpdateCalendarTitleDetail) */
    UPDATE_CALENDAR_TITLE: "update-calendar-title",
    /** Today 面板渲染完成 */
    TODAY_PANEL_RENDERED: "today-panel-rendered",

    // --- Panels ---
    /** 關閉所有面板 (detail: { showGrid: boolean }) */
    CLOSE_PANELS: "close-panels",
    /** 隱藏面板 (無 detail) */
    HIDE_PANELS: "hide-panels",
    /** 切換日曆 Grid 視圖 (detail: ToggleGridViewDetail) */
    TOGGLE_GRID_VIEW: "toggle-grid-view",

    // --- Notepad ---
    /** 開啟筆記本 */
    OPEN_NOTEPAD: "open-notepad",
    /** 關閉筆記本 */
    CLOSE_NOTEPAD: "close-notepad",

    // --- Hero / Gallery ---
    /** 要求切換背景圖 (detail?: RequestHeroChangeDetail) */
    REQUEST_HERO_CHANGE: "request-hero-change",
    /** 輪播控制 (detail: SlideshowControlDetail) */
    SLIDESHOW_CONTROL: "slideshow-control",
    /** Artwork 閒置輪播觸發 */
    ARTWORK_IDLE_SLIDE: "artwork-idle-slide",
    /** 自訂圖庫清空 */
    CUSTOM_LIST_EMPTY: "custom-list-empty",

    // --- Music ---
    /** 音樂恢復播放 (detail: { url: string }) */
    MUSIC_RESTORED: "music-restored",

    // --- Welcome ---
    /** 顯示 Welcome 面板 */
    SHOW_WELCOME_PANEL: "show-welcome-panel",
} as const;

/** 事件名稱的聯合型別，用於泛型約束 */
export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS];
