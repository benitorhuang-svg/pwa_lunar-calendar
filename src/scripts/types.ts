/**
 * Common Types and Interfaces for Lunar Calendar PWA
 * 定義全域共用的型別與介面
 */

// 應用模式 (Application Mode) — 五大核心狀態
export type AppMode = "welcome" | "calendar" | "artwork" | "zen" | "note";

// 應用程式狀態 (Application State)
export interface AppState {
    activePanel: "today" | "yearMonth" | null;
    mode: AppMode;
    selectedDay: number;
    selectedMonth: number;
    selectedYear: number;
    today: Date;
}

// 關閉面板事件 (Close Panels)
export interface ClosePanelsDetail {
    showGrid: boolean;
}

// 日期詳細資訊 (Date Detail)
export interface DateDetail {
    day: number;
    month: number;
    year: number;
}

// --- Cross-Module Event Details (跨模組事件詳細資訊) ---

// 日期選擇事件 (Date Selected)
export type DateSelectedDetail = DateDetail;

// 導航月份事件 (Navigate Month)
export type NavigateMonthDetail = number; // -1 or 1

// 渲染日曆事件 (Render Calendar)
export interface RenderCalendarDetail {
    month: number;
    selectedDay: number;
    theme: ThemeName;
    today: Date;
    year: number;
}

// 渲染 Hero 事件 (Render Hero)
export interface RenderHeroDetail {
    changeBg: boolean;
    date: Date | string;
    lunar: any; // Using explicit Lunar type in specific files if possible, or any here to avoid circular dep
    transitionOverride?: string | undefined;
}

// 渲染面板事件 (Render Panels) - Base structure, specific panels might extend
export interface RenderPanelsDetail extends Partial<AppState> {
    date?: Date | string;
    theme?: ThemeName;
    type?: "today" | "yearMonth";
}

// 請求更換 Hero 事件 (Request Hero Change)
export interface RequestHeroChangeDetail {
    changeBg: boolean;
    transitionOverride?: string;
}

// 幻燈片控制事件 (Slideshow Control)
export interface SlideshowControlDetail {
    action: "start" | "stop";
    isArtwork?: boolean;
}

// 主題名稱 (Theme Name)
export type ThemeName =
    | "theme-autumn"
    | "theme-dark"
    | "theme-festive"
    | "theme-light"
    | "theme-spring"
    | "theme-summer"
    | "theme-winter";

// 切換網格視圖事件 (Toggle Grid View)
export interface ToggleGridViewDetail {
    show: boolean;
}

export type TogglePanelDetail = string | { force?: "close" | "open"; type: "today" | "yearMonth" };

// 更新日曆標題事件 (Update Calendar Title)
export interface UpdateCalendarTitleDetail {
    day: number;
    lunarText: {
        day: string;
        ganzhi: string;
        month: string;
    };
    month: number;
    year: number;
}

export interface WelcomeModeDetail {
    active: boolean;
    targetMode?: "artwork" | "calendar" | "zen";
}

// 模式變更事件 (Mode Changed Event)
export interface ModeChangedDetail {
    from: AppMode;
    to: AppMode;
}
