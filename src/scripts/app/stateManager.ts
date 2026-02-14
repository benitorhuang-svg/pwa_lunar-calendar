/**
 * Application State Manager
 * 負責應用狀態管理 (Responsible for application state management)
 */

import type { AppState, ThemeName } from "../types";

export class AppStateManager {
    private activePanel: "today" | "yearMonth" | null;
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
    }

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

    public getState(): AppState {
        return {
            activePanel: this.activePanel,
            selectedDay: this.selectedDay,
            selectedMonth: this.selectedMonth,
            selectedYear: this.selectedYear,
            today: this.today,
        };
    }

    public getTheme(date: Date, lunar: any): ThemeName {
        const festival = lunar.getFestival();
        const lunarMonth =
            typeof lunar.getMonth === "function"
                ? lunar.getMonth()
                : lunar._lunarMonth || date.getMonth() + 1;

        let theme: ThemeName;
        const m = date.getMonth() + 1;

        if (m >= 2 && m <= 4) {
            theme = "theme-spring";
        } else if (m >= 5 && m <= 7) {
            theme = "theme-summer";
        } else if (m >= 8 && m <= 10) {
            theme = "theme-autumn";
        } else {
            theme = "theme-winter";
        }

        // Festival Overrides
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
}
