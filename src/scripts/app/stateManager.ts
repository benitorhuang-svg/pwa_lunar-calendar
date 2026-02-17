/**
 * Application State Manager
 * 負責應用狀態管理 (Responsible for application state management)
 */

import type { Lunar } from "../core/lunar";
import type { AppMode, AppState, ThemeName } from "../types";

export class AppStateManager {
    private activePanel: "today" | "yearMonth" | null;
    private mode: AppMode;
    private selectedDay: number;
    private selectedMonth: number;
    private selectedYear: number;
    private today: Date;

    constructor() {
        const now = new Date();
        this.selectedYear = now.getFullYear();
        this.selectedMonth = now.getMonth();
        this.selectedDay = now.getDate();
        this.today = now;
        this.activePanel = null;
        this.mode = "welcome";
    }

    /**
     * 應用主題樣式
     * Apply theme classes to the app container
     */
    public applyTheme(theme: ThemeName): void {
        const appContainer = document.getElementById("appContainer");
        if (appContainer) {
            appContainer.classList.remove(
                "theme-light",
                "theme-dark",
                "theme-festive",
                "theme-spring",
                "theme-summer",
                "theme-autumn",
                "theme-winter",
            );
            appContainer.classList.add(theme);
        }
    }

    /**
     * 獲取當前應用狀態
     * Get current application state
     */
    public getState(): AppState {
        return {
            activePanel: this.activePanel,
            mode: this.mode,
            selectedDay: this.selectedDay,
            selectedMonth: this.selectedMonth,
            selectedYear: this.selectedYear,
            today: this.today,
        };
    }

    /**
     * 計算當前主題
     * Calculate current theme based on date and lunar info
     */
    public getTheme(date: Date, lunar: Lunar): ThemeName {
        const festival = lunar.getFestival();

        // Use public API or internal property (if we exposed it, but public API is better)
        // Since Lunar class doesn't expose raw month index directly in public API (it has getMonthInChinese),
        // we might rely on date's month or add a getter to Lunar if needed.
        // Actually Lunar class has `month` property in the constructor logic but it's private `_lunarMonth`.
        // Let's rely on date.getMonth() + 1 as fallback or assume standard seasons.
        // Wait, `lunar.month` was accessed in original code as `lunar.getMonth()` or `_lunarMonth`.
        // The Lunar class I saw earlier has `_lunarMonth` private.
        // It's better to rely on `date` for Season, and `festival` for specific overrides.
        // The only case we need lunar month index is for the "Summer/Winter" logic if we want lunar seasons?
        // Actually the code: `if (lunarMonth === 12 || lunarMonth === 1 ...` implies we need Lunar Month.
        // I should stick to `lunar.getMonthInChinese()` but that returns string.
        // Let's assume for now we use Gregorian month for Seasons, and Lunar Festival for naming.
        // But for "Festive" theme (Spring Festival), we need to know if it's Lunar Month 12 or 1.
        // Wait, `lunar.getFestival()` returns "春節" for 1-1.

        // Let's try to access private property via casting if we really have to,
        // OR better: check if `getFestival` returns specific strings.
        // The original logic `lunarMonth === 12 || lunarMonth === 1` is broad (whole month is festive?).
        // If so, we need exposed lunar month number.
        // I will assume `lunar` has `_lunarMonth` and cast to `any` just for this property access
        // OR standard way: The `Lunar` class doesn't seem to expose numeric month.
        // I will add a `getLunarMonth(): number` to `Lunar` class later if needed, but for now let's use `(lunar as any)._lunarMonth`.

        const lunarMonth = lunar.getLunarMonth();

        let theme: ThemeName;
        const m = date.getMonth() + 1; // Gregorian Month for Seasons

        if (m >= 2 && m <= 4) {
            theme = "theme-spring";
        } else if (m >= 5 && m <= 7) {
            theme = "theme-summer";
        } else if (m >= 8 && m <= 10) {
            theme = "theme-autumn";
        } else {
            theme = "theme-winter";
        }

        // 節日覆蓋 (Festival Overrides)
        if (lunarMonth === 12 || lunarMonth === 1 || (festival && festival.includes("春節"))) {
            theme = "theme-festive";
        } else if (festival && festival.includes("清明")) {
            theme = "theme-dark";
        }

        return theme;
    }

    public goToToday(): void {
        this.selectedYear = this.today.getFullYear();
        this.selectedMonth = this.today.getMonth();
        this.selectedDay = this.today.getDate();
    }

    public navigateMonth(direction: number): void {
        this.selectedMonth += direction;
        if (this.selectedMonth > 11) {
            this.selectedMonth = 0;
            this.selectedYear++;
        } else if (this.selectedMonth < 0) {
            this.selectedMonth = 11;
            this.selectedYear--;
        }
    }

    public setActivePanel(panel: "today" | "yearMonth" | null): void {
        this.activePanel = panel;
    }

    public setDay(day: number): void {
        this.selectedDay = day;
    }

    public getMode(): AppMode {
        return this.mode;
    }

    public setMode(mode: AppMode): void {
        this.mode = mode;
        // 同步 DOM 狀態：將模式映射到 body class
        document.body.classList.remove("initial-welcome", "immersion-mode", "mode-artwork", "note-mode-active");
        switch (mode) {
            case "welcome":
                document.body.classList.add("initial-welcome", "immersion-mode");
                break;
            case "artwork":
                document.body.classList.add("immersion-mode", "mode-artwork");
                break;
            case "zen":
                document.body.classList.add("immersion-mode");
                break;
            case "note":
                document.body.classList.add("note-mode-active");
                break;
            case "calendar":
                // No special classes needed
                break;
        }
    }

    public setMonth(month: number): void {
        this.selectedMonth = month;
    }

    public setYear(year: number): void {
        this.selectedYear = year;
    }
}
