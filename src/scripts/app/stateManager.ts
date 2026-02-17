/**
 * Application State Manager
 * 負責應用狀態管理 (Responsible for application state management)
 */

import type { Lunar } from "../core/lunar";
import type { AppMode, AppState, ThemeName } from "../types";

import { TRANSITION_CLASS_MAP, VALID_TRANSITIONS } from "./transitionTable";

export class AppStateManager {
    private activePanel: "today" | "yearMonth" | null;
    private isTransitioning: boolean = false;
    private mode: AppMode;
    private selectedDay: number;
    private selectedMonth: number;
    private selectedYear: number;
    private today: Date;
    private transitionQueue: AppMode[] = [];

    constructor() {
        const now = new Date();
        this.selectedYear = now.getFullYear();
        this.selectedMonth = now.getMonth();
        this.selectedDay = now.getDate();
        this.today = now;
        this.activePanel = null;
        this.mode = "welcome";

        // Apply initial mode classes directly in constructor (synchronous)
        // This avoids the "from === to" early return issue in the first setMode call
        document.body.classList.add("initial-welcome", "immersion-mode");
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

    /**
     * T216: 強制釋放轉移鎖 (Force Release Lock)
     */
    public forceReleaseLock(): void {
        console.warn("[FSM] Force releasing transition lock");
        this.isTransitioning = false;
        this.processQueue();
    }

    public getMode(): AppMode {
        return this.mode;
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

        // Reflect to body for cross-module synchronization and CSS targeting
        if (panel) {
            document.body.setAttribute("data-active-panel", panel);
        } else {
            document.body.removeAttribute("data-active-panel");
        }
    }

    public setDay(day: number): void {
        this.selectedDay = day;
    }

    public setMode(to: AppMode): void {
        const from = this.mode;
        if (from === to) return;

        // T200: Illegal Transition Guard
        const validTargets = VALID_TRANSITIONS[from];
        if (!validTargets.includes(to)) {
            console.warn(`[FSM] Invalid mode transition attempted: ${from} → ${to}`);
            return;
        }

        // T201: Transition Lock & Queue
        if (this.isTransitioning) {
            console.log(`[FSM] Transition locked, queueing: ${to}`);
            this.transitionQueue.push(to);
            return;
        }

        this.executeModeTransition(from, to);
    }

    public setMonth(month: number): void {
        this.selectedMonth = month;
    }

    public setYear(year: number): void {
        this.selectedYear = year;
    }

    private executeModeTransition(from: AppMode, to: AppMode): void {
        this.isTransitioning = true;
        this.mode = to;

        // T205 & Finding 4: Clear active panel on non-panel-friendly modes
        if (to === "artwork" || to === "zen" || to === "welcome") {
            this.setActivePanel(null);
        }

        // T203: Get Swap Map
        const transitionKey = `${from}->${to}`;
        const swap = TRANSITION_CLASS_MAP[transitionKey];

        if (!swap) {
            console.error(`[FSM] No transition class map found for ${transitionKey}`);
            this.isTransitioning = false;
            this.processQueue();
            return;
        }

        // T202 & PR1.5B: Atomic Class Swap in rAF
        requestAnimationFrame(() => {
            // "Add first, then remove" to avoid intermediate frame with no mode classes
            if (swap.add.length > 0) {
                document.body.classList.add(...swap.add);
            }
            if (swap.remove.length > 0) {
                document.body.classList.remove(...swap.remove);
            }

            // T201: Release lock and process queue after DOM update
            // We use another rAF or just bit of delay to ensure repaint started?
            // Usually rAF is enough for the "perform transition" phase.
            this.isTransitioning = false;
            this.processQueue();
        });
    }

    private processQueue(): void {
        if (this.transitionQueue.length > 0) {
            const nextMode = this.transitionQueue.shift()!;
            console.log(`[FSM] Processing queued transition to: ${nextMode}`);
            this.setMode(nextMode);
        }
    }
}
