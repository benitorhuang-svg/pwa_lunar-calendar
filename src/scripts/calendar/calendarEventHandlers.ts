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

export class CalendarEventHandlers {
    private calendarSection: HTMLElement | null = null;
    private grid: HTMLElement | null = null;
    private longPressFired = false;
    private renderer: CalendarRenderer;
    private readonly SWIPE_THRESHOLD_PX = 50;

    constructor(renderer: CalendarRenderer) {
        this.renderer = renderer;
    }

    public init(): void {
        this.grid = document.getElementById("calendarGrid");
        this.calendarSection = document.getElementById("calendarSection");

        this.setupClickHandler();
        this.setupSwipeHandler();
        this.setupTodayButton();
        this.setupGlobalListeners();
        this.setupQuickSelector();
    }

    private setupClickHandler(): void {
        if (!this.grid) return;
        this.grid.addEventListener("click", (e) => {
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
            if (this.grid) {
                this.grid
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
        window.addEventListener("render-calendar", ((e: CustomEvent<RenderCalendarDetail>) => {
            const { month, selectedDay, today, year } = e.detail;
            this.renderer.renderCalendar(year, month, today, selectedDay);
        }) as EventListener);

        // 更新日曆標題 (Update Calendar Title)
        window.addEventListener("update-calendar-title", ((
            e: CustomEvent<UpdateCalendarTitleDetail>,
        ) => {
            this.renderer.updateTitle(e.detail);
        }) as EventListener);

        // 切換網格視圖 (Toggle Grid View)
        window.addEventListener("toggle-grid-view", ((e: CustomEvent<ToggleGridViewDetail>) => {
            if (!this.calendarSection) return;
            const { show } = e.detail;

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
        }) as EventListener);
    }

    private setupSwipeHandler(): void {
        if (!this.calendarSection) return;
        let touchStartX = 0;

        this.calendarSection.addEventListener(
            "touchstart",
            (e) => {
                const touch = e.changedTouches[0];
                if (touch) touchStartX = touch.screenX;
            },
            { passive: true },
        );

        this.calendarSection.addEventListener(
            "touchend",
            (e) => {
                const touch = e.changedTouches[0];
                if (!touch) return;
                const diff = touch.screenX - touchStartX;
                if (Math.abs(diff) > this.SWIPE_THRESHOLD_PX) {
                    // 發送導航月份事件 (Dispatch navigate month event)
                    window.dispatchEvent(
                        new CustomEvent<NavigateMonthDetail>("navigate-month", {
                            detail: diff > 0 ? -1 : 1, // 向右滑上一月，向左滑下一月 (Right: Prev, Left: Next)
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
            btnTodayQuick.addEventListener("click", () => {
                window.dispatchEvent(new CustomEvent("go-to-today"));
            });
        }
    }

    private setupQuickSelector(): void {
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const labelBtn = target.closest(".calendar-label-btn") as HTMLElement;

            if (labelBtn) {
                const type = labelBtn.dataset.type as "year" | "month";
                const popup = document.getElementById("quickSelectorPopup");
                if (popup) {
                    const isSameType = !popup.classList.contains("hidden") && popup.dataset.activeType === type;

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

        if (type === "year") {
            for (let y = 2022; y <= 2031; y++) {
                const item = document.createElement("button");
                item.className = "quick-item";
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
