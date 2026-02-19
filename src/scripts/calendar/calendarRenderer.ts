/**
 * Calendar Renderer
 * 負責日曆渲染邏輯
 * Responsible for calendar rendering logic
 */

import type { UpdateCalendarTitleDetail } from "../types";
import type { CalendarCellBuilder } from "./calendarCellBuilder";

export class CalendarRenderer {
    private cellBuilder: CalendarCellBuilder;
    private grid: HTMLElement | null = null;
    private prevRenderedMonth: null | number = null;
    private prevRenderedYear: null | number = null;

    constructor(cellBuilder: CalendarCellBuilder) {
        this.cellBuilder = cellBuilder;
    }

    public init(): void {
        this.grid = document.getElementById("calendarGrid");
    }

    /**
     * 渲染日曆網格
     * Render the calendar grid content
     */
    public renderCalendar(
        year: number,
        month: number,
        today: Date,
        selectedDay: null | number = null,
    ): void {
        if (!this.grid) return;

        // 決定動畫方向
        // Determine animation direction
        let animationClass = "";
        if (this.prevRenderedMonth !== null && this.prevRenderedYear !== null) {
            const currentTotal = year * 12 + month;
            const prevTotal = this.prevRenderedYear * 12 + this.prevRenderedMonth;
            if (currentTotal > prevTotal) {
                animationClass = "animate-slide-right"; // slide left (content moves right->left in perception, actually standard usually next month enters from right)
                // Wait, typically next month enters from right, so "slide-left"?
                // Let's stick to existing class names but clarify meaning if needed.
                // Assuming 'animate-slide-right' means 'sliding towards right' or 'entering from right'?
                // Convention: Next Month -> Slide Left (New content enters from right)
                // Prev Month -> Slide Right (New content enters from left)
                // Let's check CSS if possible, but for now keep class names consistent.
            } else if (currentTotal < prevTotal) {
                animationClass = "animate-slide-left";
            }
        }
        this.prevRenderedMonth = month;
        this.prevRenderedYear = year;

        // 應用動畫
        // Apply animation
        this.grid.className = "days-grid"; // Reset classes
        if (animationClass) {
            this.grid.classList.add(animationClass);

            // 使用 addEventListener 處理一次性事件
            const onAnimationEnd = () => {
                if (this.grid) this.grid.classList.remove(animationClass);
                this.grid?.removeEventListener("animationend", onAnimationEnd);
            };
            this.grid.addEventListener("animationend", onAnimationEnd);
        }

        // 清空內容並建立新 Fragment
        // Clear content and create new fragment
        this.grid.textContent = "";
        const fragment = document.createDocumentFragment();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0); // Last day of current month
        const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)

        // 前導填白 (上個月)
        // Leading padding (Prev Month)
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLast - i;
            fragment.appendChild(
                this.cellBuilder.createDayCell(year, month - 1, day, true, today, selectedDay),
            );
        }

        // 當前月份
        // Current Month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            fragment.appendChild(
                this.cellBuilder.createDayCell(year, month, day, false, today, selectedDay),
            );
        }

        // 後續填白 (下個月)
        // Trailing padding (Next Month)
        const totalCells = startDay + lastDay.getDate();
        // 動態計算所需的行數 (4, 5, 或 6 行)
        // Dynamically calculate required rows (4, 5, or 6 rows)
        // 這樣可以避免強制 6 行導致的過多下個月日期，也不會強制 5 行導致 Feb 2026 (4行) 出現空白
        const targetCells = Math.ceil(totalCells / 7) * 7;
        const trailingDays = targetCells - totalCells;

        for (let day = 1; day <= trailingDays; day++) {
            fragment.appendChild(
                this.cellBuilder.createDayCell(year, month + 1, day, true, today, selectedDay), // month+1 handles overflow correclty in Date constructor if needed but here simple math
            );
        }

        this.grid.appendChild(fragment);
    }

    /**
     * 更新日曆標題 (農曆資訊)
     * Update calendar title with Lunar info
     */
    public updateTitle(detail: null | UpdateCalendarTitleDetail): void {
        const calendarTitle = document.getElementById("calendarTitle");
        if (!calendarTitle || !detail) return;

        const { lunarText, month, year } = detail;

        // 特殊月份名稱轉換
        // Helper to convert special Lunar month names
        const mapMonth = (m: string): string => {
            if (m === "正") return "一";
            if (m === "冬") return "十一";
            if (m === "臘") return "十二";
            return m;
        };

        const displayMonth = mapMonth(lunarText.month);
        const ganzhi = lunarText.ganzhi ? `${lunarText.ganzhi}年` : ""; // Ensure 'Year' suffix

        const yearOptions = [];
        for (let y = 2022; y <= 2031; y++) {
            yearOptions.push(`<option value="${y}" ${y === year ? "selected" : ""}>${y}</option>`);
        }

        const monthOptions = [];
        for (let m = 0; m < 12; m++) {
            monthOptions.push(
                `<option value="${m}" ${m === month ? "selected" : ""}>${(m + 1).toString().padStart(2, "0")}</option>`,
            );
        }

        // 1. Render Lunar Info in Calendar Card
        if (calendarTitle) {
            calendarTitle.innerHTML = `
                <div class="lunar-group">
                    <span class="lunar-ganzhi">${ganzhi}</span>
                    <span class="lunar-month">${displayMonth}月</span>
                </div>
            `;
        }

        // 2. Render Gregorian Selector in Hero Header (Top Left)
        const heroSelector = document.getElementById("heroYearMonthSelector");
        if (heroSelector) {
            heroSelector.innerHTML = `
                <button class="calendar-label-btn" data-type="year" aria-label="選擇年份">
                    <span class="header-year">${year}</span><span class="unit">年</span>
                </button>
                <div class="header-sep"></div>
                <button class="calendar-label-btn" data-type="month" aria-label="選擇月份">
                    <span class="header-month">${(month + 1).toString().padStart(2, "0")}</span><span class="unit">月</span>
                </button>
            `;
        }
    }
}
