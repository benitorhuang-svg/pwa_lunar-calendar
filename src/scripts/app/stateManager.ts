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

    public applyTheme(theme: ThemeName): void {
        const appContainer = document.getElementById("appContainer");
        if (!appContainer) return;

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

    public getTheme(date: Date, lunar: Lunar): ThemeName {
        const festival = lunar.getFestival();
        const lunarMonth = lunar.getLunarMonth();

        let theme: ThemeName;
        const month = date.getMonth() + 1;

        if (month >= 2 && month <= 4) {
            theme = "theme-spring";
        } else if (month >= 5 && month <= 7) {
            theme = "theme-summer";
        } else if (month >= 8 && month <= 10) {
            theme = "theme-autumn";
        } else {
            theme = "theme-winter";
        }

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

    public setMonth(month: number): void {
        this.selectedMonth = month;
    }

    public setYear(year: number): void {
        this.selectedYear = year;
    }

    public getMode(): AppMode {
        return this.mode;
    }

    public setMode(mode: AppMode): void {
        this.mode = mode;

        document.body.classList.remove(
            "initial-welcome",
            "immersion-mode",
            "mode-artwork",
            "note-mode-active",
        );

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
                break;
        }
    }
}
