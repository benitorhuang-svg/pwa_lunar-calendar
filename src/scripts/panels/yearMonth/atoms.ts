/**
 * YearMonth Panel Atoms
 * 基礎 UI 元素 (Basic UI Elements)
 */

export function SectionHeader(text: string): string {
    return `<div class="panel-section-header">${text}</div>`;
}

export function SectionDivider(): string {
    return `<div class="panel-section-divider"></div>`;
}

export function YearItem(year: number, isSelected: boolean, isToday: boolean): string {
    const selectedClass = isSelected ? "selected" : "";
    const todayClass = isToday ? "today" : "";

    return `
        <button type="button" aria-label="${year}年" 
            class="panel-item ${selectedClass} ${todayClass}" 
            onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('year-selected', { detail: ${year} }))">
            ${year}
        </button>
    `;
}

export function MonthItem(monthIndex: number, isSelected: boolean, isToday: boolean): string {
    const selectedClass = isSelected ? "selected" : "";
    const todayClass = isToday ? "today" : "";

    return `
        <button type="button" aria-label="${monthIndex + 1}月" 
            class="panel-item ${selectedClass} ${todayClass}" 
            onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('month-selected', { detail: ${monthIndex} }))">
            <span class="month-num">${monthIndex + 1}</span><span class="month-label">月</span>
        </button>
    `;
}
