/**
 * Calendar Cell Builder
 * 負責建構日曆單元格
 * Responsible for constructing calendar grid cells
 */

import { HolidayService } from "../core/holidayService";
import { Lunar } from "../core/lunar";

export class CalendarCellBuilder {
    private holidayService = HolidayService.getInstance();

    /**
     * 建立單一日期單元格
     * Create a single day cell element
     */
    public createDayCellHTML(
        year: number,
        month: number,
        day: number,
        isOtherMonth: boolean,
        today: Date,
        selectedDay: null | number,
    ): string {
        const date = new Date(year, month, day);
        const y = date.getFullYear();
        const m = date.getMonth();
        const d = date.getDate();

        // 取得農曆資訊 (Fetch Lunar Info)
        const lunar = Lunar.fromDate(date);
        const term = lunar.getJieQi();
        const festival = lunar.getFestival() || lunar.getSolarFestival();

        // 取得政府休假資訊 (Fetch Govt Holiday Info)
        const holidayInfo = this.holidayService.getHolidayInfo(y, m, d);
        const isOfficialHoliday = holidayInfo
            ? holidayInfo.isHoliday
            : (date.getDay() === 0 || date.getDay() === 6);

        // Class Logic
        const classes = ["day-cell"];
        if (isOtherMonth) classes.push("other-month");
        if (isOfficialHoliday) classes.push("is-holiday");
        if (date.toDateString() === today.toDateString()) classes.push("today");
        if (!isOtherMonth && selectedDay && d === selectedDay) classes.push("selected");

        const tabIndex = isOtherMonth ? "-1" : "0";
        const otherAttr = isOtherMonth ? 'data-other="true"' : "";

        // Bottom Text Logic
        let bottomText = lunar.getDayInChinese();
        let bottomStyle = "";
        let bottomClass = "lunar-text";

        if (holidayInfo && holidayInfo.description && holidayInfo.isHoliday) {
            bottomText = holidayInfo.description;
            bottomStyle = "color: var(--cal-holiday-red, #ff6b6b);";
            bottomClass += " official-holiday";
        } else if (festival) {
            bottomText = festival;
            bottomStyle = "color: var(--cal-festival-red, #ff6b6b); font-weight: 700; opacity: 1;";
        } else if (term) {
            bottomText = term;
            bottomStyle = "color: var(--cal-term-color, #d4af37); font-weight: 700; opacity: 1;";
        }

        const ariaLabel = `${y}年${m + 1}月${d}日 · ${bottomText}${isOfficialHoliday ? " (休假)" : ""}`;

        // Return Atomic Pattern String
        return `
            <button type="button" 
                class="${classes.join(" ")}" 
                tabindex="${tabIndex}"
                data-year="${y}"
                data-month="${m}"
                data-day="${d}"
                ${otherAttr}
                aria-label="${ariaLabel}">
                <div class="gregorian-num">${d}</div>
                <div class="${bottomClass}" style="${bottomStyle}">${bottomText}</div>
            </button>
        `;
    }
}
