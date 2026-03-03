/**
 * Calendar Renderer
 * 負責日曆渲染邏輯
 * Responsible for calendar rendering logic
 */

import type { UpdateCalendarTitleDetail } from "../types";
import type { CalendarCellBuilder } from "./calendarCellBuilder";
import { Lunar } from "../core/lunar";
import { CalendarPageTemplate } from "./template";
import { CalendarTitleAtom } from "./atoms";
import { HeroSelectorTemplate } from "../hero/template";

export class CalendarRenderer {
    private cellBuilder: CalendarCellBuilder;
    private section: HTMLElement | null = null;
    private grid: HTMLElement | null = null;
    private prevRenderedMonth: null | number = null;
    private prevRenderedYear: null | number = null;

    constructor(cellBuilder: CalendarCellBuilder) {
        this.cellBuilder = cellBuilder;
    }

    public init(): void {
        this.section = document.getElementById("calendarSection");
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

        // 清空內容並建立新 Fragment / HTML String
        // Clear content and use HTML strings for Atomic rendering
        let gridHtml = "";
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0); // Last day of current month
        const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)

        // 前導填白 (上個月)
        // Leading padding (Prev Month)
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLast - i;
            gridHtml += this.cellBuilder.createDayCellHTML(year, month - 1, day, true, today, selectedDay);
        }

        // 當前月份
        // Current Month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            gridHtml += this.cellBuilder.createDayCellHTML(year, month, day, false, today, selectedDay);
        }

        // 後續填白 (下個月)
        // Trailing padding (Next Month)
        const totalCells = startDay + lastDay.getDate();
        // 動態計算所需的行數 (4, 5, 或 6 行)
        // Dynamically calculate required rows (4, 5, or 6 rows)
        const targetCells = Math.ceil(totalCells / 7) * 7;
        const trailingDays = targetCells - totalCells;

        for (let day = 1; day <= trailingDays; day++) {
            gridHtml += this.cellBuilder.createDayCellHTML(year, month + 1, day, true, today, selectedDay);
        }

        // Render Atoms/Organisms/Template
        if (this.section) {
            // We need Ganzhi and Lunar month for the title atom inside the template
            // For now, if we don't have them yet (it's called before updateTitle), we use placeholders or wait.
            // But normally renderCalendar is called, then updateTitle is called.

            // Actually, let's keep the existing logic where grid is updated separately if already initialized, 
            // OR we render everything if section is empty.

            // To be truly Atomic and "Paginated", let's render everything.
            // We need lunar data for the header.
            const firstDate = new Date(year, month, 1);
            const l = Lunar.fromDate(firstDate);
            const headerHtml = CalendarTitleAtom(
                year,
                month + 1,
                l.getMonthInChinese(),
                l.getDayInChinese()
            );

            this.section.innerHTML = CalendarPageTemplate(headerHtml, gridHtml, animationClass);

            // Re-bind the grid reference because it was just replaced!
            this.grid = document.getElementById("calendarGrid");
        }
    }

    public updateTitle(detail: null | UpdateCalendarTitleDetail): void {
        const section = document.getElementById("calendarSection");
        const heroSelector = document.getElementById("heroYearMonthSelector");
        if (!detail) return;

        const { lunarText, month, year } = detail;

        // 1. Render Calendar Card Content (Atomic)
        if (section) {
            // Need to pass the gridHtml. But renderCalendar already ran. 
            // This is a bit tricky. Maybe we only update the title parts if we don't want to re-render grid.
            // But the user said "Atomic product".
            // Let's just update the specific parts for now to avoid losing grid state, 
            // but use the Atoms.
            const titleEl = document.getElementById("calendarTitle");
            if (titleEl) {
                titleEl.innerHTML = CalendarTitleAtom(
                    detail.date.getFullYear(),
                    detail.date.getMonth() + 1,
                    lunarText.month,
                    lunarText.day
                );
            }
        }

        // 2. Render Gregorian Selector in Hero Header (Atomic)
        if (heroSelector) {
            heroSelector.innerHTML = HeroSelectorTemplate(year, month);
        }
    }
}
