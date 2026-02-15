/**
 * Hero Type Definitions
 * 定義 Hero 區域使用的所有介面與型別
 * Definitions used across the Hero module
 *
 * Note: Many types are now centralized in src/scripts/types.ts
 * Here we re-export them or define module-specific extensions.
 */

// Global Types
export type {
    ClosePanelsDetail,
    NavigateMonthDetail,
    RenderHeroDetail,
    RenderPanelsDetail,
    RequestHeroChangeDetail,
    SlideshowControlDetail,
    ToggleGridViewDetail,
} from "../types";

// 切換面板事件詳細資訊 (Detail for toggling specific panel)
export type TogglePanelDetail = string;

// 歡迎模式/沉浸模式事件詳細資訊 (Detail for Welcome/Immersion mode)
export interface WelcomeModeDetail {
    active: boolean; // 是否啟用 (Whether active)
    targetMode?: 'calendar' | 'artwork';
}
