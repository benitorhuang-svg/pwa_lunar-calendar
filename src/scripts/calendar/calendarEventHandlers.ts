/**
 * Calendar Event Handlers
 * 負責日曆相關的事件處理 (Responsible for calendar-related event handling)
 */

import type { CalendarRenderer } from "./calendarRenderer";

export class CalendarEventHandlers {
    private calendarSection: HTMLElement | null = null;
    private grid: HTMLElement | null = null;
    private longPressFired = false;
    private renderer: CalendarRenderer;
    private SWIPE_THRESHOLD_PX = 50;

    constructor(renderer: CalendarRenderer) {
        this.renderer = renderer;
    }

    public init(): void {
        this.grid = document.getElementById("calendarGrid");
        this.calendarSection = document.getElementById("calendarSection");

        this.setupClickHandler();
        this.setupSwipeHandler();
        this.setupTodayButton();
        this.setupEventListeners();
    }

    private setupClickHandler(): void {
        if (!this.grid) return;
        this.grid.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const cell = target.closest(".day-cell") as HTMLElement | null;
            if (!cell) return;

            if (this.longPressFired) {
                this.longPressFired = false;
                return;
            }

            e.stopPropagation();

            const day = parseInt(cell.dataset.day || "0");
            const year = parseInt(cell.dataset.year || "0");
            const month = parseInt(cell.dataset.month || "0");

            // Visual Feedback
            if (this.grid) {
                this.grid
                    .querySelectorAll(".day-cell")
                    .forEach((c) => c.classList.remove("selected"));
            }
            cell.classList.add("selected");

            console.log(`[Calendar] Date Selected: ${year}-${month + 1}-${day}`);
            window.dispatchEvent(
                new CustomEvent("date-selected", { detail: { day, month, year } }),
            );
        });
    }

    private setupEventListeners(): void {
        // Render Calendar
        window.addEventListener("render-calendar", (e: any) => {
            const { month, selectedDay, today, year } = e.detail;
            this.renderer.renderCalendar(year, month, today, selectedDay);
        });

        // Update Calendar Title
        window.addEventListener("update-calendar-title", (e: any) => {
            const { lunarText } = e.detail;
            this.renderer.updateTitle(lunarText);
        });

        // Toggle Grid View
        window.addEventListener("toggle-grid-view", (e: any) => {
            if (!this.calendarSection) return;
            const { show } = e.detail;
            if (show) {
                this.calendarSection.classList.remove("hidden");
                void this.calendarSection.offsetWidth; // Force reflow
                this.calendarSection.classList.add("show-grid");
            } else {
                this.calendarSection.classList.remove("show-grid");

                const onTransitionEnd = () => {
                    if (
                        this.calendarSection &&
                        !this.calendarSection.classList.contains("show-grid")
                    ) {
                        this.calendarSection.classList.add("hidden");
                    }
                    this.calendarSection?.removeEventListener("transitionend", onTransitionEnd);
                };
                this.calendarSection.addEventListener("transitionend", onTransitionEnd);

                // Backup timeout
                setTimeout(onTransitionEnd, 550);
            }
        });
    }

    private setupSwipeHandler(): void {
        if (!this.calendarSection) return;
        let touchStartX = 0;

        this.calendarSection.addEventListener(
            "touchstart",
            (e) => (touchStartX = e.changedTouches[0].screenX),
            { passive: true },
        );

        this.calendarSection.addEventListener(
            "touchend",
            (e) => {
                const diff = e.changedTouches[0].screenX - touchStartX;
                if (Math.abs(diff) > this.SWIPE_THRESHOLD_PX) {
                    window.dispatchEvent(
                        new CustomEvent("navigate-month", {
                            detail: diff > 0 ? -1 : 1,
                        }),
                    );
                }
            },
            { passive: true },
        );
    }

    private setupTodayButton(): void {
        const btnTodayQuick = document.getElementById("btnTodayQuick");
        if (btnTodayQuick) {
            btnTodayQuick.onclick = () => window.dispatchEvent(new CustomEvent("go-to-today"));
        }
    }
}
