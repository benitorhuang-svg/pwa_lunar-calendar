/**
 * Application State Manager
 * 負責應用狀態管理 (Responsible for application state management)
 */

export class AppStateManager {
    constructor() {
        this.selectedYear = new Date().getFullYear();
        this.selectedMonth = new Date().getMonth();
        this.selectedDay = new Date().getDate();
        this.today = new Date();
        this.activePanel = null;
    }

    getState() {
        return {
            selectedYear: this.selectedYear,
            selectedMonth: this.selectedMonth,
            selectedDay: this.selectedDay,
            today: this.today,
            activePanel: this.activePanel,
        };
    }

    setYear(year) {
        this.selectedYear = year;
    }

    setMonth(month) {
        this.selectedMonth = month;
    }

    setDay(day) {
        this.selectedDay = day;
    }

    setActivePanel(panel) {
        this.activePanel = panel;
    }

    navigateMonth(direction) {
        this.selectedMonth += direction;
        if (this.selectedMonth > 11) {
            this.selectedMonth = 0;
            this.selectedYear++;
        } else if (this.selectedMonth < 0) {
            this.selectedMonth = 11;
            this.selectedYear--;
        }
    }

    goToToday() {
        this.selectedYear = this.today.getFullYear();
        this.selectedMonth = this.today.getMonth();
        this.selectedDay = this.today.getDate();
    }

    getTheme(date, lunar) {
        const festival = lunar.getFestival();
        const lunarMonth =
            typeof lunar.getMonth === "function"
                ? lunar.getMonth()
                : lunar._lunarMonth || date.getMonth() + 1;

        let theme;
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
        if (
            lunarMonth === 12 ||
            lunarMonth === 1 ||
            (festival && festival.includes("春節"))
        ) {
            theme = "theme-festive";
        } else if (festival && festival.includes("清明")) {
            theme = "theme-dark";
        }

        return theme;
    }

    applyTheme(theme) {
        const appContainer = document.getElementById("appContainer");
        if (appContainer) {
            appContainer.classList.remove(
                "theme-light",
                "theme-dark",
                "theme-festive",
                "theme-spring",
                "theme-summer",
                "theme-autumn",
                "theme-winter"
            );
            appContainer.classList.add(theme);
        }
    }
}
