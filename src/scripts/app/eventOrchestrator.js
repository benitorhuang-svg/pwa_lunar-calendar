/**
 * Application Event Orchestrator
 * 負責協調應用內各種事件 (Responsible for orchestrating various application events)
 */

export class AppEventOrchestrator {
    constructor(stateManager) {
        this.state = stateManager;
    }

    init() {
        this.setupNavigationEvents();
        this.setupPanelEvents();
        this.setupSelectionEvents();
        this.setupHeroEvents();
    }

    updateState() {
        const date = new Date(
            this.state.selectedYear,
            this.state.selectedMonth,
            this.state.selectedDay
        );
        const lunar = Lunar.fromDate(date);
        const theme = this.state.getTheme(date, lunar);

        this.state.applyTheme(theme);

        // Render Panels if active
        if (this.state.activePanel) {
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: this.state.activePanel,
                        ...this.state.getState(),
                        theme,
                    },
                })
            );
        }

        // Render Calendar Grid
        window.dispatchEvent(
            new CustomEvent("render-calendar", {
                detail: {
                    year: this.state.selectedYear,
                    month: this.state.selectedMonth,
                    today: this.state.today,
                    selectedDay: this.state.selectedDay,
                    theme,
                },
            })
        );

        // Update Header Title
        window.dispatchEvent(
            new CustomEvent("update-calendar-title", {
                detail: {
                    year: this.state.selectedYear,
                    month: this.state.selectedMonth,
                    day: this.state.selectedDay,
                    lunarText: {
                        ganzhi: lunar.getYearInGanZhi(),
                        month: lunar.getMonthInChinese(),
                        day: lunar.getDayInChinese(),
                    },
                },
            })
        );

        // Render Hero
        window.dispatchEvent(
            new CustomEvent("render-hero", {
                detail: { date, lunar, changeBg: false },
            })
        );

        this.checkAutoSlideshow();
    }

    checkAutoSlideshow() {
        const calendarSection = document.getElementById("calendarSection");
        const isGrid = calendarSection
            ? calendarSection.classList.contains("show-grid")
            : false;

        if (!this.state.activePanel && !isGrid) {
            window.dispatchEvent(
                new CustomEvent("slideshow-control", {
                    detail: { action: "start" },
                })
            );
        } else {
            window.dispatchEvent(
                new CustomEvent("slideshow-control", {
                    detail: { action: "stop" },
                })
            );
        }
    }

    setupNavigationEvents() {
        window.addEventListener("navigate-month", (e) => {
            const dir = e.detail;
            this.state.navigateMonth(dir);
            this.updateState();
        });

        window.addEventListener("go-to-today", () => {
            this.state.goToToday();
            this.updateState();

            this.state.setActivePanel("today");
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: "today",
                        ...this.state.getState(),
                    },
                })
            );
            window.dispatchEvent(
                new CustomEvent("toggle-grid-view", {
                    detail: { show: false },
                })
            );
        });
    }

    setupPanelEvents() {
        window.addEventListener("toggle-panel", (e) => {
            const type = e.detail;
            const isSamePanel = this.state.activePanel === type;

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            if (isSamePanel) {
                window.dispatchEvent(
                    new CustomEvent("toggle-grid-view", {
                        detail: { show: true },
                    })
                );
            } else {
                this.state.setActivePanel(type);
                window.dispatchEvent(
                    new CustomEvent("toggle-grid-view", {
                        detail: { show: false },
                    })
                );
                window.dispatchEvent(
                    new CustomEvent("render-panels", {
                        detail: {
                            type,
                            ...this.state.getState(),
                        },
                    })
                );
            }
            this.checkAutoSlideshow();
        });

        window.addEventListener("close-panels", (e) => {
            const { showGrid } = e.detail || {};
            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));
            if (showGrid !== undefined) {
                window.dispatchEvent(
                    new CustomEvent("toggle-grid-view", {
                        detail: { show: showGrid },
                    })
                );
            }
            this.checkAutoSlideshow();
        });

        window.addEventListener("toggle-grid", () => {
            const calendarSection = document.getElementById("calendarSection");
            const isShowing = calendarSection.classList.contains("show-grid");

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            window.dispatchEvent(
                new CustomEvent("toggle-grid-view", {
                    detail: { show: !isShowing },
                })
            );
            this.checkAutoSlideshow();
        });
    }

    setupSelectionEvents() {
        window.addEventListener("year-selected", (e) => {
            this.state.setYear(e.detail);
            this.updateState();
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: "yearMonth",
                        ...this.state.getState(),
                    },
                })
            );
        });

        window.addEventListener("month-selected", (e) => {
            this.state.setMonth(e.detail);

            // Date Safety
            const daysInMonth = new Date(
                this.state.selectedYear,
                this.state.selectedMonth + 1,
                0
            ).getDate();
            if (this.state.selectedDay > daysInMonth) {
                this.state.setDay(daysInMonth);
            }

            this.updateState();

            window.dispatchEvent(
                new CustomEvent("close-panels", { detail: { showGrid: true } })
            );
        });

        window.addEventListener("date-selected", (e) => {
            const { year, month, day } = e.detail;

            if (month !== this.state.selectedMonth || year !== this.state.selectedYear) {
                this.state.setYear(year);
                this.state.setMonth(month);
                this.updateState();
            }

            this.state.setDay(day);

            const date = new Date(
                this.state.selectedYear,
                this.state.selectedMonth,
                this.state.selectedDay
            );
            const lunar = Lunar.fromDate(date);
            window.dispatchEvent(
                new CustomEvent("render-hero", {
                    detail: { date, lunar, changeBg: false },
                })
            );

            this.state.setActivePanel("today");
            window.dispatchEvent(
                new CustomEvent("toggle-grid-view", {
                    detail: { show: false },
                })
            );
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: "today",
                        ...this.state.getState(),
                    },
                })
            );
        });
    }

    setupHeroEvents() {
        window.addEventListener("request-hero-change", (e) => {
            const { changeBg, transitionOverride } = e.detail || {};
            const date = new Date(
                this.state.selectedYear,
                this.state.selectedMonth,
                this.state.selectedDay
            );
            const lunar = Lunar.fromDate(date);

            window.dispatchEvent(
                new CustomEvent("render-hero", {
                    detail: { date, lunar, changeBg, transitionOverride },
                })
            );
        });
    }
}
