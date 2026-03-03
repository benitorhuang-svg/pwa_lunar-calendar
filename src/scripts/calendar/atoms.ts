import { SelectorButton } from "../hero/atoms";

/* Atoms: Smallest functional units */

export const WeekDayLabel = (label: string) => `<div>${label}</div>`;

export const NavArrowAtom = (type: "prev" | "next", id: string) => `
    <button class="nav-arrow-btn ${type}" id="${id}" aria-label="${type === "prev" ? "上一個" : "下一個"}">
        <svg fill="none" height="20" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" width="20">
            <path d="${type === "prev" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}"></path>
        </svg>
    </button>
`;

export const CalendarTitleAtom = (year: number, month: number, lunarMonth: string, lunarDay: string) => `
    <div class="header-atom-wrapper">
        ${NavArrowAtom("prev", "btnCalendarPrev")}
        
        <div class="calendar-header-simple">
            ${SelectorButton("year", year.toString(), "年")}
            ${SelectorButton("month", month.toString().padStart(2, "0"), "月")}
            <span class="header-lunar">農曆${lunarMonth}${lunarDay}</span>
            <button class="calendar-today-btn" id="btnTodayQuick" aria-label="回到今日">回到今日</button>
        </div>

        ${NavArrowAtom("next", "btnCalendarNext")}
    </div>
`;

export const TodayButtonAtom = () => `
    <button class="calendar-today-btn" id="btnTodayQuick" aria-label="回到今日">回到今日</button>
`;
