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
    public createDayCell(
        year: number,
        month: number,
        day: number,
        isOtherMonth: boolean,
        today: Date, // 系統當日 (System Today)
        selectedDay: null | number, // 當前月份被選中的日期 (Selected day in current month)
    ): HTMLButtonElement {
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
            : date.getDay() === 0 || date.getDay() === 6;

        const cell = document.createElement("button");
        cell.type = "button";

        // 設定 Class (Set Classes)
        cell.className = `day-cell ${isOtherMonth ? "other-month" : ""}`;
        if (isOfficialHoliday) cell.classList.add("is-holiday");

        cell.tabIndex = isOtherMonth ? -1 : 0;

        cell.dataset.year = y.toString();
        cell.dataset.month = m.toString();
        cell.dataset.day = d.toString();

        if (isOtherMonth) cell.dataset.other = "true";

        // 標記今日 (Mark Today)
        if (date.toDateString() === today.toDateString()) {
            cell.classList.add("today");
        }

        // 標記選中狀態 (Mark Selected)
        if (!isOtherMonth && selectedDay && d === selectedDay) {
            cell.classList.add("selected");
        }

        // 建立公曆數字 (Gregorian Number)
        const greg = document.createElement("div");
        greg.className = "gregorian-num";
        greg.textContent = d.toString();

        // 建立農曆/節日文字 (Lunar/Festival Text)
        const lunarDiv = document.createElement("div");
        lunarDiv.className = "lunar-text";

        const lunarDateStr = lunar.getDayInChinese();
        let bottomText = lunarDateStr;

        // 優先顯示政府節日描述 > 農曆節日 > 節氣 > 農曆日期
        // Priority: Govt Description > Festival > Solar Term > Lunar Date
        if (holidayInfo && holidayInfo.description && holidayInfo.isHoliday) {
            bottomText = holidayInfo.description;
            lunarDiv.style.color = "var(--cal-holiday-red, #ff6b6b)";
            lunarDiv.classList.add("official-holiday");
        } else if (festival) {
            bottomText = festival;
            lunarDiv.style.color = "var(--cal-festival-red, #ff6b6b)";
            lunarDiv.style.fontWeight = "700";
            lunarDiv.style.opacity = "1";
        } else if (term) {
            bottomText = term;
            lunarDiv.style.color = "var(--cal-term-color, #d4af37)";
            lunarDiv.style.fontWeight = "700";
            lunarDiv.style.opacity = "1";
        }

        lunarDiv.textContent = bottomText;

        cell.appendChild(greg);
        cell.appendChild(lunarDiv);

        // 無障礙標籤 (A11y Label)
        cell.setAttribute(
            "aria-label",
            `${y}年${m + 1}月${d}日 · ${bottomText}${isOfficialHoliday ? " (休假)" : ""}`,
        );

        return cell;
    }
}
