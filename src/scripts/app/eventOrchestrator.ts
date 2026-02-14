/**
 * Application Event Orchestrator
 * 負責協調應用內各種事件 (Responsible for orchestrating various application events)
 */

import type { AppStateManager } from "./stateManager";

export class AppEventOrchestrator {
    private state: AppStateManager;

    constructor(stateManager: AppStateManager) {
        this.state = stateManager;
    }

    public init(): void {
        this.setupNavigationEvents();
        this.setupPanelEvents();
        this.setupSelectionEvents();
        this.setupHeroEvents();
    }

    public updateState(): void {
        const state = this.state.getState();
        const date = new Date(state.selectedYear, state.selectedMonth, state.selectedDay);
        const lunar = Lunar.fromDate(date);
        const theme = this.state.getTheme(date, lunar);

        this.state.applyTheme(theme);

        // Render Panels if active
        if (state.activePanel) {
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: state.activePanel,
                        ...state,
                        theme,
                    },
                }),
            );
        }

        // Render Calendar Grid
        window.dispatchEvent(
            new CustomEvent("render-calendar", {
                detail: {
                    month: state.selectedMonth,
                    selectedDay: state.selectedDay,
                    theme,
                    today: state.today,
                    year: state.selectedYear,
                },
            }),
        );

        // Update Header Title
        window.dispatchEvent(
            new CustomEvent("update-calendar-title", {
                detail: {
                    day: state.selectedDay,
                    lunarText: {
                        day: lunar.getDayInChinese(),
                        ganzhi: lunar.getYearInGanZhi(),
                        month: lunar.getMonthInChinese(),
                    },
                    month: state.selectedMonth,
                    year: state.selectedYear,
                },
            }),
        );

        // Render Hero
        window.dispatchEvent(
            new CustomEvent("render-hero", {
                detail: { changeBg: false, date, lunar },
            }),
        );

        this.checkAutoSlideshow();
    }

    private checkAutoSlideshow(): void {
        const isImmersion = document.body.classList.contains("immersion-mode");
        // 如果已經在沈浸模式，由 IdleManager 控制幻燈片，Orchestrator 不進行干預
        if (isImmersion) return;

        const calendarSection = document.getElementById("calendarSection");
        const isGrid = calendarSection ? calendarSection.classList.contains("show-grid") : false;

        const activePanel = this.state.getState().activePanel;

        if (!activePanel && !isGrid) {
            window.dispatchEvent(
                new CustomEvent("slideshow-control", {
                    detail: { action: "start" },
                }),
            );
        } else {
            // If immersion mode is active, the slideshow is managed by IdleManager,
            // so the orchestrator should not stop it.
            // The initial 'if (isImmersion) return;' already prevents this block from running
            // if immersion mode is active.
            window.dispatchEvent(
                new CustomEvent("slideshow-control", {
                    detail: { action: "stop" },
                }),
            );
        }
    }

    private setupHeroEvents(): void {
        window.addEventListener("request-hero-change", (e: any) => {
            const { changeBg, transitionOverride } = e.detail || {};
            const state = this.state.getState();
            const date = new Date(state.selectedYear, state.selectedMonth, state.selectedDay);
            const lunar = Lunar.fromDate(date);

            window.dispatchEvent(
                new CustomEvent("render-hero", {
                    detail: { changeBg, date, lunar, transitionOverride },
                }),
            );
        });
    }

    private setupNavigationEvents(): void {
        window.addEventListener("navigate-month", (e: any) => {
            const dir = e.detail as number;
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
                }),
            );
            window.dispatchEvent(
                new CustomEvent("toggle-grid-view", {
                    detail: { show: false },
                }),
            );
        });
    }

    private setupPanelEvents(): void {
        window.addEventListener("toggle-panel", (e: any) => {
            const type = e.detail as "today" | "yearMonth";
            const isSamePanel = this.state.getState().activePanel === type;

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            if (isSamePanel) {
                window.dispatchEvent(
                    new CustomEvent("toggle-grid-view", {
                        detail: { show: true },
                    }),
                );
            } else {
                this.state.setActivePanel(type);
                window.dispatchEvent(
                    new CustomEvent("toggle-grid-view", {
                        detail: { show: false },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent("render-panels", {
                        detail: {
                            type,
                            ...this.state.getState(),
                        },
                    }),
                );
            }
            this.checkAutoSlideshow();
        });

        window.addEventListener("close-panels", (e: any) => {
            const { showGrid } = e.detail || {};
            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));
            if (showGrid !== undefined) {
                window.dispatchEvent(
                    new CustomEvent("toggle-grid-view", {
                        detail: { show: showGrid },
                    }),
                );
            }
            this.checkAutoSlideshow();
        });

        window.addEventListener("toggle-grid", () => {
            const calendarSection = document.getElementById("calendarSection");
            if (!calendarSection) return;

            const isShowing = calendarSection.classList.contains("show-grid");

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            window.dispatchEvent(
                new CustomEvent("toggle-grid-view", {
                    detail: { show: !isShowing },
                }),
            );
            this.checkAutoSlideshow();
        });
    }

    private setupSelectionEvents(): void {
        window.addEventListener("year-selected", (e: any) => {
            this.state.setYear(e.detail as number);
            this.updateState();
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: "yearMonth",
                        ...this.state.getState(),
                    },
                }),
            );
        });

        window.addEventListener("month-selected", (e: any) => {
            this.state.setMonth(e.detail as number);

            const state = this.state.getState();
            // Date Safety
            const daysInMonth = new Date(state.selectedYear, state.selectedMonth + 1, 0).getDate();
            if (state.selectedDay > daysInMonth) {
                this.state.setDay(daysInMonth);
            }

            this.updateState();

            window.dispatchEvent(new CustomEvent("close-panels", { detail: { showGrid: true } }));
        });

        window.addEventListener("date-selected", (e: any) => {
            const { day, month, year } = e.detail;
            const currentState = this.state.getState();

            if (month !== currentState.selectedMonth || year !== currentState.selectedYear) {
                this.state.setYear(year);
                this.state.setMonth(month);
                this.updateState();
            }

            this.state.setDay(day);

            const updatedState = this.state.getState();
            const date = new Date(
                updatedState.selectedYear,
                updatedState.selectedMonth,
                updatedState.selectedDay,
            );
            const lunar = Lunar.fromDate(date);
            window.dispatchEvent(
                new CustomEvent("render-hero", {
                    detail: { changeBg: false, date, lunar },
                }),
            );

            this.state.setActivePanel("today");
            window.dispatchEvent(
                new CustomEvent("toggle-grid-view", {
                    detail: { show: false },
                }),
            );
            window.dispatchEvent(
                new CustomEvent("render-panels", {
                    detail: {
                        type: "today",
                        ...this.state.getState(),
                    },
                }),
            );
        });
    }
}
