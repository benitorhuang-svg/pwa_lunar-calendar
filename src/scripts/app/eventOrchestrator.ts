/**
 * Application Event Orchestrator (Thin Coordinator)
 * 負責協調應用內各種事件 (Responsible for orchestrating various application events)
 * 委派至 orchestrator/ 子模組
 */

import type {
    AppMode,
    ModeChangedDetail,
    RenderCalendarDetail,
    RenderHeroDetail,
    RenderPanelsDetail,
    RequestHeroChangeDetail,
    SlideshowControlDetail,
    UpdateCalendarTitleDetail,
} from "../types";
import type { AppStateManager } from "./stateManager";

import { HolidayService } from "../core/holidayService";
import { Lunar } from "../core/lunar";
import { onTypedEvent } from "../core/typedEvents";

// Orchestrator sub-modules
import { setupNavigationEvents } from "./orchestrator/navigationEvents";
import { setupPanelEvents } from "./orchestrator/panelEvents";
import { setupSelectionEvents } from "./orchestrator/selectionEvents";

export class AppEventOrchestrator {
    private holidayService = HolidayService.getInstance();
    private lastFetchedYear: null | number = null;
    private state: AppStateManager;

    constructor(stateManager: AppStateManager) {
        this.state = stateManager;
    }

    public init(): void {
        setupNavigationEvents(this.state, () => this.updateState());
        setupPanelEvents(this.state, () => this.checkAutoSlideshow());
        setupSelectionEvents(this.state, () => this.updateState());
        this.setupHeroEvents();
        this.setupModeTransitionEvents();

        // 初始抓取 (Initial fetch)
        const currentYear = this.state.getState().selectedYear;
        this.fetchHolidays(currentYear);
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
            this.forceRecovery("artwork");
            this.state.forceReleaseLock(); // Ensure lock is released even on error
        }
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
                    date,
                    lunarText: {
                        day: lunar.getDayInChinese(),
                        ganzhi: lunar.getYearInGanZhi(),
                        month: lunar.getMonthInChinese(),
                    },
                    festival: lunar.getFestival() || lunar.getSolarFestival(),
                    termPeriod: lunar.getSolarTermPeriod(),
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

    private dispatchModeLifecycle(eventName: string, from: AppMode, to: AppMode): void {
        window.dispatchEvent(
            new CustomEvent<ModeChangedDetail>(eventName, {
                detail: { from, to },
            }),
        );
    }

    private async fetchHolidays(year: number): Promise<void> {
        if (this.lastFetchedYear === year) return;
        this.lastFetchedYear = year;

        const systemYear = new Date().getFullYear();
        const fetchTasks = [this.holidayService.fetchYearData(year)];

        // 總是抓取前一年 (Always fetch previous year)
        fetchTasks.push(this.holidayService.fetchYearData(year - 1));

        const currentMonth = new Date().getMonth();
        if (year < systemYear || (year === systemYear && currentMonth >= 5)) {
            fetchTasks.push(this.holidayService.fetchYearData(year + 1));
        }

        await Promise.all(fetchTasks);
        this.updateState();
    }

    /**
     * T216: 強制模式恢復 (Force Mode Recovery)
     */
    private forceRecovery(target: AppMode = "artwork"): void {
        console.warn(`[Orchestrator] Forcing recovery to mode: ${target}`);
        this.state.setMode(target);
    }

    private setupHeroEvents(): void {
        onTypedEvent<RequestHeroChangeDetail>("request-hero-change", (detail) => {
            const { changeBg, transitionOverride } = detail || {};
            const state = this.state.getState();
            const date = new Date(state.selectedYear, state.selectedMonth, state.selectedDay);
            const lunar = Lunar.fromDate(date);

            window.dispatchEvent(
                new CustomEvent<RenderHeroDetail>("render-hero", {
                    detail: { changeBg, date, lunar, transitionOverride },
                }),
            );
        });
    }

    /**
     * 監聽模式轉換事件 (Listen for mode transition events)
     * 統一入口：外部通過 dispatch 'transition-mode' 事件觸發
     */
    private setupModeTransitionEvents(): void {
        onTypedEvent<{ to: AppMode }>("transition-mode", (detail) => {
            this.transitionMode(detail.to);
        });
    }
}
