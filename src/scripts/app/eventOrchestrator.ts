/**
 * Application Event Orchestrator
 * 負責協調應用內各種事件 (Responsible for orchestrating various application events)
 */

import type {
    ClosePanelsDetail,
    DateSelectedDetail,
    NavigateMonthDetail,
    RenderCalendarDetail,
    RenderHeroDetail,
    RenderPanelsDetail,
    RequestHeroChangeDetail,
    SlideshowControlDetail,
    ToggleGridViewDetail,
    UpdateCalendarTitleDetail,
} from "../types";
import type { AppStateManager } from "./stateManager";

import { Lunar } from "../core/lunar";

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

        // 渲染面板 (Context Check)
        // Render Panels if active
        if (state.activePanel) {
            window.dispatchEvent(
                new CustomEvent<RenderPanelsDetail>("render-panels", {
                    detail: {
                        type: state.activePanel,
                        ...state,
                        theme,
                    },
                }),
            );
        }

        // 渲染日曆網格 (Render Calendar Grid)
        window.dispatchEvent(
            new CustomEvent<RenderCalendarDetail>("render-calendar", {
                detail: {
                    month: state.selectedMonth,
                    selectedDay: state.selectedDay,
                    theme,
                    today: state.today,
                    year: state.selectedYear,
                },
            }),
        );

        // 更新標題 (Update Header Title)
        window.dispatchEvent(
            new CustomEvent<UpdateCalendarTitleDetail>("update-calendar-title", {
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

        // 渲染 Hero 區域 (Render Hero)
        window.dispatchEvent(
            new CustomEvent<RenderHeroDetail>("render-hero", {
                detail: { changeBg: false, date, lunar },
            }),
        );

        this.checkAutoSlideshow();
    }

    private checkAutoSlideshow(): void {
        const isImmersion = document.body.classList.contains("immersion-mode");
        // 如果已經在沈浸模式，由 IdleManager 控制幻燈片，Orchestrator 不進行干預
        // If in immersion mode, IdleManager controls slideshow, Orchestrator stays out
        if (isImmersion) return;

        const calendarSection = document.getElementById("calendarSection");
        const isGrid = calendarSection ? calendarSection.classList.contains("show-grid") : false;

        const activePanel = this.state.getState().activePanel;

        if (!activePanel && !isGrid) {
            window.dispatchEvent(
                new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                    detail: { action: "start" },
                }),
            );
        } else {
            window.dispatchEvent(
                new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                    detail: { action: "stop" },
                }),
            );
        }
    }

    private setupHeroEvents(): void {
        // 監聽 Hero 更換請求 (Request Hero Change)
        window.addEventListener("request-hero-change", ((
            e: CustomEvent<RequestHeroChangeDetail>,
        ) => {
            const { changeBg, transitionOverride } = e.detail || {};
            const state = this.state.getState();
            const date = new Date(state.selectedYear, state.selectedMonth, state.selectedDay);
            const lunar = Lunar.fromDate(date);

            window.dispatchEvent(
                new CustomEvent<RenderHeroDetail>("render-hero", {
                    detail: { changeBg, date, lunar, transitionOverride },
                }),
            );
        }) as EventListener);
    }

    private setupNavigationEvents(): void {
        // 導航月份 (Navigate Month, payload is number)
        window.addEventListener("navigate-month", ((e: CustomEvent<NavigateMonthDetail>) => {
            const dir = e.detail;
            this.state.navigateMonth(dir);
            this.updateState();
        }) as EventListener);

        // 回到今天 (Go to Today)
        window.addEventListener("go-to-today", () => {
            this.state.goToToday();
            this.updateState();

            this.state.setActivePanel("today");
            window.dispatchEvent(
                new CustomEvent<RenderPanelsDetail>("render-panels", {
                    detail: {
                        type: "today",
                        ...this.state.getState(),
                    },
                }),
            );
            window.dispatchEvent(
                new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                    detail: { show: false },
                }),
            );
        });
    }

    private setupPanelEvents(): void {
        // 切換面板 (Toggle Panel)
        window.addEventListener("toggle-panel", ((e: CustomEvent<string>) => {
            const type = e.detail as "today" | "yearMonth";
            const isSamePanel = this.state.getState().activePanel === type;

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            if (isSamePanel) {
                window.dispatchEvent(
                    new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                        detail: { show: true },
                    }),
                );
            } else {
                this.state.setActivePanel(type);
                window.dispatchEvent(
                    new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                        detail: { show: false },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent<RenderPanelsDetail>("render-panels", {
                        detail: {
                            type,
                            ...this.state.getState(),
                        },
                    }),
                );
            }
            this.checkAutoSlideshow();
        }) as EventListener);

        // 關閉面板 (Close Panels)
        window.addEventListener("close-panels", ((e: CustomEvent<ClosePanelsDetail>) => {
            const { showGrid } = e.detail || {};
            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));
            if (showGrid !== undefined) {
                window.dispatchEvent(
                    new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                        detail: { show: showGrid },
                    }),
                );
            }
            this.checkAutoSlideshow();
        }) as EventListener);

        // 切換網格 (Toggle Grid)
        window.addEventListener("toggle-grid", () => {
            const calendarSection = document.getElementById("calendarSection");
            if (!calendarSection) return;

            const isShowing = calendarSection.classList.contains("show-grid");

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            window.dispatchEvent(
                new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                    detail: { show: !isShowing },
                }),
            );
            this.checkAutoSlideshow();
        });
    }

    private setupSelectionEvents(): void {
        // 年份選擇 (Year Selected)
        window.addEventListener("year-selected", ((e: CustomEvent<number>) => {
            this.state.setYear(e.detail);
            this.updateState();
            window.dispatchEvent(
                new CustomEvent<RenderPanelsDetail>("render-panels", {
                    detail: {
                        type: "yearMonth",
                        ...this.state.getState(),
                    },
                }),
            );
        }) as EventListener);

        // 月份選擇 (Month Selected)
        window.addEventListener("month-selected", ((e: CustomEvent<number>) => {
            this.state.setMonth(e.detail);

            const state = this.state.getState();
            // Date Safety
            const daysInMonth = new Date(state.selectedYear, state.selectedMonth + 1, 0).getDate();
            if (state.selectedDay > daysInMonth) {
                this.state.setDay(daysInMonth);
            }

            this.updateState();

            window.dispatchEvent(
                new CustomEvent<ClosePanelsDetail>("close-panels", { detail: { showGrid: true } }),
            );
        }) as EventListener);

        // 日期選擇 (Date Selected)
        window.addEventListener("date-selected", ((e: CustomEvent<DateSelectedDetail>) => {
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
                new CustomEvent<RenderHeroDetail>("render-hero", {
                    detail: { changeBg: false, date, lunar },
                }),
            );

            this.state.setActivePanel("today");
            window.dispatchEvent(
                new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                    detail: { show: false },
                }),
            );
            window.dispatchEvent(
                new CustomEvent<RenderPanelsDetail>("render-panels", {
                    detail: {
                        type: "today",
                        ...this.state.getState(),
                    },
                }),
            );
        }) as EventListener);
    }
}
