/**
 * Calendar Renderer
 * 負責日曆渲染邏輯
 */

export class CalendarRenderer {
    constructor(cellBuilder) {
        this.cellBuilder = cellBuilder;
        this.grid = null;
        this.prevRenderedMonth = null;
        this.prevRenderedYear = null;
    }

    init() {
        this.grid = document.getElementById("calendarGrid");
    }

    renderCalendar(year, month, today, selectedDay = null) {
        // Determine animation direction
        let animationClass = "";
        if (this.prevRenderedMonth !== null) {
            const currentTotal = year * 12 + month;
            const prevTotal = this.prevRenderedYear * 12 + this.prevRenderedMonth;
            if (currentTotal > prevTotal) {
                animationClass = "animate-slide-right";
            } else if (currentTotal < prevTotal) {
                animationClass = "animate-slide-left";
            }
        }
        this.prevRenderedMonth = month;
        this.prevRenderedYear = year;

        // Apply animation
        this.grid.className = "days-grid";
        if (animationClass) {
            this.grid.classList.add(animationClass);
            this.grid.onanimationend = () => this.grid.classList.remove(animationClass);
        }

        this.grid.textContent = "";
        const fragment = document.createDocumentFragment();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();

        // Leading padding (Prev Month)
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLast - i;
            fragment.appendChild(
                this.cellBuilder.createDayCell(year, month - 1, day, true, today, selectedDay)
            );
        }

        // Current Month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            fragment.appendChild(
                this.cellBuilder.createDayCell(year, month, day, false, today, selectedDay)
            );
        }

        // Trailing padding (Next Month)
        const totalCells = startDay + lastDay.getDate();
        const targetCells = totalCells <= 35 ? 35 : 42;
        const trailingDays = targetCells - totalCells;

        for (let day = 1; day <= trailingDays; day++) {
            fragment.appendChild(
                this.cellBuilder.createDayCell(year, month + 1, day, true, today, selectedDay)
            );
        }

        this.grid.appendChild(fragment);
    }

    updateTitle(lunarText) {
        const calendarTitle = document.getElementById("calendarTitle");
        if (!calendarTitle || !lunarText) return;

        // Helper to convert special Lunar month names
        const mapMonth = (m) => {
            if (m === "正") return "一";
            if (m === "冬") return "十一";
            if (m === "臘") return "十二";
            return m;
        };

        const displayMonth = mapMonth(lunarText.month);
        calendarTitle.textContent = `${lunarText.ganzhi}年 · ${displayMonth}月 · ${lunarText.day}`;
    }
}
