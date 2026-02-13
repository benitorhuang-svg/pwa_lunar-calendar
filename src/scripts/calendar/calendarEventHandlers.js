/**
 * Calendar Event Handlers
 * 負責日曆相關的事件處理
 */

export class CalendarEventHandlers {
    constructor(renderer) {
        this.renderer = renderer;
        this.grid = null;
        this.calendarSection = null;
        this.SWIPE_THRESHOLD_PX = 50;
        this.longPressFired = false;
    }

    init() {
        this.grid = document.getElementById("calendarGrid");
        this.calendarSection = document.getElementById("calendarSection");

        this.setupClickHandler();
        this.setupSwipeHandler();
        this.setupTodayButton();
        this.setupEventListeners();
    }

    setupClickHandler() {
        this.grid.addEventListener("click", (e) => {
            const cell = e.target.closest(".day-cell");
            if (!cell) return;

            if (this.longPressFired) {
                this.longPressFired = false;
                return;
            }

            e.stopPropagation();

            const day = parseInt(cell.dataset.day);
            const year = parseInt(cell.dataset.year);
            const month = parseInt(cell.dataset.month);

            // Visual Feedback
            this.grid.querySelectorAll(".day-cell").forEach((c) =>
                c.classList.remove("selected")
            );
            cell.classList.add("selected");

            console.log(`[Calendar] Date Selected: ${year}-${month + 1}-${day}`);
            window.dispatchEvent(
                new CustomEvent("date-selected", { detail: { year, month, day } })
            );
        });
    }

    setupSwipeHandler() {
        let touchStartX = 0;

        this.calendarSection.addEventListener(
            "touchstart",
            (e) => (touchStartX = e.changedTouches[0].screenX),
            { passive: true }
        );

        this.calendarSection.addEventListener(
            "touchend",
            (e) => {
                const diff = e.changedTouches[0].screenX - touchStartX;
                if (Math.abs(diff) > this.SWIPE_THRESHOLD_PX) {
                    window.dispatchEvent(
                        new CustomEvent("navigate-month", {
                            detail: diff > 0 ? -1 : 1,
                        })
                    );
                }
            },
            { passive: true }
        );
    }

    setupTodayButton() {
        const btnTodayQuick = document.getElementById("btnTodayQuick");
        if (btnTodayQuick) {
            btnTodayQuick.onclick = () =>
                window.dispatchEvent(new CustomEvent("go-to-today"));
        }
    }

    setupEventListeners() {
        // Render Calendar
        window.addEventListener("render-calendar", (e) => {
            const { year, month, today, selectedDay } = e.detail;
            this.renderer.renderCalendar(year, month, today, selectedDay);
        });

        // Update Calendar Title
        window.addEventListener("update-calendar-title", (e) => {
            const { lunarText } = e.detail;
            this.renderer.updateTitle(lunarText);
        });

        // Toggle Grid View
        window.addEventListener("toggle-grid-view", (e) => {
            const { show } = e.detail;
            if (show) {
                this.calendarSection.classList.remove("hidden");
                void this.calendarSection.offsetWidth; // Force reflow
                this.calendarSection.classList.add("show-grid");
            } else {
                this.calendarSection.classList.remove("show-grid");

                const onTransitionEnd = () => {
                    if (!this.calendarSection.classList.contains("show-grid")) {
                        this.calendarSection.classList.add("hidden");
                    }
                    this.calendarSection.removeEventListener(
                        "transitionend",
                        onTransitionEnd
                    );
                };
                this.calendarSection.addEventListener("transitionend", onTransitionEnd);

                // Backup timeout
                setTimeout(onTransitionEnd, 550);
            }
        });
    }

    // Long Press Handler (currently disabled)
    async handleLongPress(date, lunar) {
        const title = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate()}`;
        const text = `農曆 ${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text });
            } catch (e) {
                console.error("Share failed", e);
            }
        } else if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(`${title} ${text}`);
                alert("已複製日期資訊到剪貼簿");
            } catch (e) {
                console.error("Clipboard copy failed", e);
            }
        }
    }
}
