import type { AppMode } from "../types";

/**
 * 模式轉換的 Class 操作定義 (Class operations for mode transitions)
 */
export interface TransitionClassSwap {
    add: string[];
    remove: string[];
}

/**
 * 合法轉移路徑表 (Transition Table)
 * 定義每個模式允許遷移到的目標模式
 */
export const VALID_TRANSITIONS: Record<AppMode, AppMode[]> = {
    artwork: ["calendar", "zen"],
    calendar: ["artwork", "note"],
    note: ["calendar"],
    welcome: ["calendar", "zen"],
    zen: ["artwork"],
};

/**
 * 轉移 Class 映射表 (Atomic Class Swap Table)
 * 精確定義每個轉換路徑中需要 add/remove 的 class
 */
export const TRANSITION_CLASS_MAP: Record<string, TransitionClassSwap> = {
    "artwork->calendar": {
        add: [],
        remove: ["immersion-mode", "mode-artwork"],
    },
    "artwork->zen": {
        add: [],
        remove: ["mode-artwork"],
    },
    "calendar->artwork": {
        add: ["immersion-mode", "mode-artwork"],
        remove: [],
    },
    "calendar->note": {
        add: ["note-mode-active"],
        remove: [],
    },
    "note->calendar": {
        add: [],
        remove: ["note-mode-active"],
    },
    "welcome->calendar": {
        add: [],
        remove: ["initial-welcome", "immersion-mode"],
    },
    "welcome->zen": {
        add: [],
        remove: ["initial-welcome"],
    },
    "zen->artwork": {
        add: ["mode-artwork"],
        remove: [],
    },
};
