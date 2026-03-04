/**
 * Calendar Event Handlers
 * 負責日曆相關的事件處理 (Responsible for calendar-related event handling)
 */

import type { CalendarRenderer } from "./calendarRenderer";
import type {
    DateSelectedDetail,
    NavigateMonthDetail,
    RenderCalendarDetail,
    ToggleGridViewDetail,
    UpdateCalendarTitleDetail,
} from "./types";
import { onTypedEvent } from "../core/typedEvents";

export class CalendarEventHandlers {
    private calendarSection: HTMLElement | null = null;
    private longPressFired = false;
    private renderer: CalendarRenderer;
    private readonly SWIPE_THRESHOLD_PX = 50;

    constructor(renderer: CalendarRenderer) {
        this.renderer = renderer;
    }

    public init(): void {
        this.calendarSection = document.getElementById("calendarSection");

        this.setupClickHandler();
        this.setupSwipeHandler();
        this.setupTodayButton();
        this.setupGlobalListeners();
        this.setupQuickSelector();
        this.setupCalendarNavigation();
    }

    private setupClickHandler(): void {
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            // 尋找最近的日期單元格 (Find closest day cell)
            const cell = target.closest(".day-cell") as HTMLElement | null;
            if (!cell) return;

            // 如果長按事件已觸發，則忽略點擊 (Ignore click if long press fired)
            if (this.longPressFired) {
                this.longPressFired = false;
                return;
            }

            e.stopPropagation();

            const day = parseInt(cell.dataset.day || "0");
            const year = parseInt(cell.dataset.year || "0");
            const month = parseInt(cell.dataset.month || "0");

            // 視覺回饋 (Visual Feedback)
            const grid = document.getElementById("calendarGrid");
            if (grid) {
                grid
                    .querySelectorAll(".day-cell")
                    .forEach((c) => c.classList.remove("selected"));
            }
            cell.classList.add("selected");

            console.log(`[Calendar] Date Selected: ${year}-${month + 1}-${day}`);

            // 發送日期選擇事件 (Dispatch date selected event)
            window.dispatchEvent(
                new CustomEvent<DateSelectedDetail>("date-selected", {
                    detail: { day, month, year },
                }),
            );
        });
    }

    private setupGlobalListeners(): void {
        // 渲染日曆 (Render Calendar)
        onTypedEvent<RenderCalendarDetail>("render-calendar", (detail) => {
            const { month, selectedDay, today, year } = detail;
            this.renderer.renderCalendar(year, month, today, selectedDay);
        });

        // 更新日曆標題 (Update Calendar Title)
        onTypedEvent<UpdateCalendarTitleDetail>("update-calendar-title", (detail) => {
            this.renderer.updateTitle(detail);
        });

        // 切換網格視圖 (Toggle Grid View)
        onTypedEvent<ToggleGridViewDetail>("toggle-grid-view", (detail) => {
            if (!this.calendarSection) return;
            const { show } = detail;

            if (show) {
                this.calendarSection.classList.remove("hidden");
                void this.calendarSection.offsetWidth; // 強制重繪 (Force reflow)
                this.calendarSection.classList.add("show-grid");
            } else {
                this.calendarSection.classList.remove("show-grid");

                // 動畫結束後隱藏 (Hide after transition ends)
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

                // 備用超時 (Backup timeout in case transitionend fails)
                setTimeout(onTransitionEnd, 550);
            }
        });
    }

    private setupSwipeHandler(): void {
        const section = document.getElementById("calendarSection");
        if (!section) return;

        let touchStartX = 0;
        let touchStartY = 0;

        section.addEventListener(
            "touchstart",
            (e) => {
                const touch = e.changedTouches[0];
                if (!touch) return;
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            },
            { passive: true },
        );

        section.addEventListener(
            "touchend",
            (e) => {
                const touch = e.changedTouches[0];
                if (!touch) return;
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                // 檢查是否為水平滑動 (Check if swipe is horizontal)
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > this.SWIPE_THRESHOLD_PX) {
                    window.dispatchEvent(
                        new CustomEvent<NavigateMonthDetail>("navigate-month", {
                            detail: deltaX > 0 ? -1 : 1,
                        }),
                    );
                }
            },
            { passive: true },
        );
    }

    private setupCalendarNavigation(): void {
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("#btnCalendarPrev")) {
                window.dispatchEvent(
                    new CustomEvent<NavigateMonthDetail>("navigate-month", {
                        detail: -1,
                    }),
                );
            } else if (target.closest("#btnCalendarNext")) {
                window.dispatchEvent(
                    new CustomEvent<NavigateMonthDetail>("navigate-month", {
                        detail: 1,
                    }),
                );
            }
        });
    }

    private setupTodayButton(): void {
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.id === "btnTodayQuick" || target.closest("#btnTodayQuick")) {
                window.dispatchEvent(new CustomEvent("go-to-today"));
            }
        });
    }

    private setupQuickSelector(): void {
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const labelBtn = target.closest(".calendar-label-btn") as HTMLElement;

            if (labelBtn) {
                const type = labelBtn.dataset.type as "year" | "month";
                const popup = document.getElementById("quickSelectorPopup");
                if (popup) {
                    const isSameType =
                        !popup.classList.contains("hidden") && popup.dataset.activeType === type;

                    if (isSameType) {
                        // Toggle OFF
                        popup.classList.add("hidden");
                        popup.dataset.activeType = "";
                    } else {
                        // Show or Switch Type
                        this.renderQuickGrid(type, popup);
                        popup.classList.remove("hidden");
                        popup.dataset.activeType = type;
                    }
                }
                e.stopPropagation();
            } else if (target.closest(".calendar-today-btn")) {
                // Return to Today from Card
                console.log("[Calendar] Card Back to Today clicked");
                window.dispatchEvent(new CustomEvent("go-to-today"));
            } else {
                const popup = document.getElementById("quickSelectorPopup");
                if (popup && !popup.classList.contains("hidden")) {
                    if (!target.closest("#quickSelectorPopup")) {
                        popup.classList.add("hidden");
                        popup.dataset.activeType = "";
                    }
                }
            }
        });
    }

    private renderQuickGrid(type: "year" | "month", container: HTMLElement): void {
        container.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = `quick-grid quick-grid-${type}`;

        // Get current values from DOM to highlight active state
        const currentYearStr = document.querySelector(".header-year")?.textContent || "";
        const currentMonthStr = document.querySelector(".header-month")?.textContent || "";

        const currentYear = parseInt(currentYearStr);
        const currentMonth = parseInt(currentMonthStr) - 1; // DOM is 1-based, logic is 0-based

        if (type === "year") {
            for (let y = 2022; y <= 2031; y++) {
                const item = document.createElement("button");
                item.className = "quick-item";
                if (y === currentYear) item.classList.add("active");

                item.textContent = y.toString();
                item.onclick = () => {
                    window.dispatchEvent(new CustomEvent("year-selected", { detail: y }));
                    container.classList.add("hidden");
                };
                grid.appendChild(item);
            }
        } else {
            for (let m = 0; m < 12; m++) {
                const item = document.createElement("button");
                item.className = "quick-item";
                if (m === currentMonth) item.classList.add("active");

                item.textContent = (m + 1).toString().padStart(2, "0");
                item.onclick = () => {
                    window.dispatchEvent(new CustomEvent("month-selected", { detail: m }));
                    container.classList.add("hidden");
                };
                grid.appendChild(item);
            }
        }
        container.appendChild(grid);
    }
}
