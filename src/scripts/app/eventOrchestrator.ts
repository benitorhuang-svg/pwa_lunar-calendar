/**
 * Application Event Orchestrator
 * 負責協調應用內各種事件 (Responsible for orchestrating various application events)
 */

import type {
    AppMode,
    ClosePanelsDetail,
    DateSelectedDetail,
    ModeChangedDetail,
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
import { HolidayService } from "../core/holidayService";

export class AppEventOrchestrator {
    private state: AppStateManager;
    private holidayService = HolidayService.getInstance();
    private lastFetchedYear: number | null = null;

    constructor(stateManager: AppStateManager) {
        this.state = stateManager;
    }

    public init(): void {
        this.setupNavigationEvents();
        this.setupPanelEvents();
        this.setupSelectionEvents();
        this.setupHeroEvents();
        this.setupModeTransitionEvents();

        // 初始抓取 (Initial fetch)
        const currentYear = this.state.getState().selectedYear;
        this.fetchHolidays(currentYear);
    }

    private async fetchHolidays(year: number): Promise<void> {
        if (this.lastFetchedYear === year) return;
        this.lastFetchedYear = year;

        const systemYear = new Date().getFullYear();
        const fetchTasks = [this.holidayService.fetchYearData(year)];

        // 總是抓取前一年 (Always fetch previous year)
        fetchTasks.push(this.holidayService.fetchYearData(year - 1));

        // 只有當「下一年」早於或等於系統年份，或者已經是下半年時，才主動抓取下一年
        // (Only proactive fetch next year if it's already released or late in the year)
        const currentMonth = new Date().getMonth(); // 0-11
        if (year < systemYear || (year === systemYear && currentMonth >= 5)) {
            fetchTasks.push(this.holidayService.fetchYearData(year + 1));
        }

        await Promise.all(fetchTasks);
        this.updateState(); // 重新渲染以套用假期 (Re-render to apply)
    }

    /**
     * T204: 集中式模式轉換 (Centralized Mode Transition)
     * 遵循四階段生命週期：beforeExit → beforeEnter → performTransition (atomic) → afterEnter
     */
    public async transitionMode(to: AppMode): Promise<void> {
        const from = this.state.getMode();
        if (from === to) return;

        try {
            // 1. beforeExit(from)
            this.dispatchModeLifecycle("before-exit-mode", from, to);

            // 2. beforeEnter(to)
            this.dispatchModeLifecycle("before-enter-mode", from, to);

            // 3. performTransition (Atomic rAF in stateManager)
            this.state.setMode(to);

            // 4. afterEnter(to)
            // Wait a frame to ensure DOM updated from setMode's rAF
            requestAnimationFrame(() => {
                this.dispatchModeLifecycle("after-enter-mode", from, to);

                // 發送傳統模式變更通知 (Dispatch mode-changed for backward compatibility)
                window.dispatchEvent(
                    new CustomEvent<ModeChangedDetail>("mode-changed", {
                        detail: { from, to },
                    }),
                );
            });
        } catch (error) {
            // T216: 轉換錯誤恢復機制 (Error Recovery)
            console.error(`[Orchestrator] Mode transition failed: ${from} → ${to}`, error);
            this.forceRecovery("calendar");
            this.state.forceReleaseLock(); // Ensure lock is released even on error
        }
    }

    private dispatchModeLifecycle(eventName: string, from: AppMode, to: AppMode): void {
        window.dispatchEvent(
            new CustomEvent<ModeChangedDetail>(eventName, {
                detail: { from, to },
            }),
        );
    }

    /**
     * T216: 強制模式恢復 (Force Mode Recovery)
     */
    private forceRecovery(target: AppMode = "calendar"): void {
        console.warn(`[Orchestrator] Forcing recovery to mode: ${target}`);
        // Direct set to skip lifecycle and break loops
        this.state.setMode(target);
    }

    public updateState(): void {
        const state = this.state.getState();

        // 背景抓取假期 (Background fetch holidays)
        this.fetchHolidays(state.selectedYear);

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
        const mode = this.state.getMode();
        // 沈浸模式下由 IdleManager 控制
        if (mode === "zen" || mode === "artwork" || mode === "welcome") return;

        const calendarSection = document.getElementById("calendarSection");
        const isGrid = calendarSection ? calendarSection.classList.contains("show-grid") : false;

        const activePanel = this.state.getState().activePanel;

        if (!activePanel && !isGrid) {
            window.dispatchEvent(
                new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                    detail: { action: "start", isArtwork: false },
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

    /**
     * 監聽模式轉換事件 (Listen for mode transition events)
     * 統一入口：外部通過 dispatch 'transition-mode' 事件觸發
     */
    private setupModeTransitionEvents(): void {
        window.addEventListener("transition-mode", ((e: CustomEvent<{ to: AppMode }>) => {
            this.transitionMode(e.detail.to);
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
        window.addEventListener("toggle-panel", ((
            e: CustomEvent<string | { force?: "close" | "open"; type: string }>,
        ) => {
            const detail = e.detail;
            const type = (typeof detail === "string" ? detail : detail.type) as
                | "today"
                | "yearMonth";
            const force = typeof detail === "object" ? detail.force : undefined;

            const currentActive = this.state.getState().activePanel;
            const isSamePanel = currentActive === type;

            this.state.setActivePanel(null);
            window.dispatchEvent(new CustomEvent("hide-panels"));

            let shouldOpen = !isSamePanel;
            if (force === "open") shouldOpen = true;
            if (force === "close") shouldOpen = false;

            if (!shouldOpen) {
                // Close / Show Grid
                window.dispatchEvent(
                    new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                        detail: { show: true },
                    }),
                );
            } else {
                // Open Panel
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

        // T212: 切換網格 (Toggle Grid) - Now purely for UI visibility, no mode switching
        window.addEventListener("toggle-grid", () => {
            const calendarSection = document.getElementById("calendarSection");
            const isShowing = calendarSection?.classList.contains("show-grid") ?? false;

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
