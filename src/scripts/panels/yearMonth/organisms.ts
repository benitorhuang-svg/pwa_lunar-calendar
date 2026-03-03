/**
 * YearMonth Panel Organisms
 * 負責大型模塊 (Large Modules)
 */

import { MonthItem, SectionHeader, YearItem } from "./atoms";

export function YearGrid(selectedYear: number, todayYear: number): string {
    const startYear = selectedYear - 4;
    let itemsHtml = "";

    // Show 10 years: current - 4 to + 5
    for (let i = 0; i < 10; i++) {
        const y = startYear + i;
        itemsHtml += YearItem(y, y === selectedYear, y === todayYear);
    }

    return `
        <div>
            ${SectionHeader("年份")}
            <div class="panel-grid panel-grid-year">
                ${itemsHtml}
            </div>
        </div>
    `;
}

export function MonthGrid(selectedMonth: number, todayMonth: number): string {
    let itemsHtml = "";

    for (let i = 0; i < 12; i++) {
        itemsHtml += MonthItem(i, i === selectedMonth, i === todayMonth);
    }

    return `
        <div>
            ${SectionHeader("月份")}
            <div class="panel-grid panel-grid-month">
                ${itemsHtml}
            </div>
        </div>
    `;
}
