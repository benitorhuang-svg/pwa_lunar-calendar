/**
 * Common Types and Interfaces for Lunar Calendar PWA
 */

export interface AppState {
    activePanel: "today" | "yearMonth" | null;
    selectedDay: number;
    selectedMonth: number;
    selectedYear: number;
    today: Date;
}

export interface DateDetail {
    day: number;
    month: number;
    year: number;
}

export type ThemeName =
    | "theme-autumn"
    | "theme-dark"
    | "theme-festive"
    | "theme-light"
    | "theme-spring"
    | "theme-summer"
    | "theme-winter";
