/**
 * Calendar Cell Builder
 * 負責建構日曆單元格
 * Responsible for constructing calendar grid cells
 */

import { Lunar } from "../core/lunar";

export class CalendarCellBuilder {
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
    ): HTMLDivElement {
        // 注意：這裡 month 是 0-indexed，Date 建構函數自動處理月份溢位 (e.g. month-1 where month=0 becomes previous year)
        // Note: JS Date constructor handles month overflow/underflow automatically
        const date = new Date(year, month, day);

        // 取得農曆資訊 (Fetch Lunar Info)
        const lunar = Lunar.fromDate(date);
        const term = lunar.getJieQi();
        const festival = lunar.getFestival() || lunar.getSolarFestival();

        const cell = document.createElement("div");

        // 設定 Class (Set Classes)
        cell.className = `day-cell ${isOtherMonth ? "other-month" : ""}`;
        cell.tabIndex = isOtherMonth ? -1 : 0; // 非當月日期不可聚焦 (Disable focus for other month)
        cell.setAttribute("role", "button");

        // 設定資料屬性，供點擊事件使用
        // Set data attributes for click handling
        // Note: Adjusting date back to actual year/month if it was overflowed by "day" is tricky if we just passed standardized year/month.
        // But here `year` and `month` passed in are the *target* context of the cell.
        // Actually, if we pass month-1 and day, Date object calculates correct timestamp, but dataset needs the correct visual year/month.
        // The Renderer logic passes the intended logical year/month for the cell.
        // Let's rely on the passed arguments as the "visual" date.

        // Important: If we are rendering "Prev Month" padding, the passed `month` is already `month - 1`.
        // So `date.getMonth()` should generally match `month` (modulo 12).

        cell.dataset.year = date.getFullYear().toString();
        cell.dataset.month = date.getMonth().toString();
        cell.dataset.day = date.getDate().toString();

        if (isOtherMonth) cell.dataset.other = "true";

        // 標記今日 (Mark Today)
        if (date.toDateString() === today.toDateString()) {
            cell.classList.add("today");
        }

        // 標記選中狀態 (Mark Selected)
        // 只有非其他月份的日期才顯示選中態 (Only show selected state for current month cells)
        if (!isOtherMonth && selectedDay && day === selectedDay) {
            cell.classList.add("selected");
        }

        // 建立公曆數字 (Gregorian Number)
        const greg = document.createElement("div");
        greg.className = "gregorian-num";
        greg.textContent = day.toString();

        // 建立農曆/節日文字 (Lunar/Festival Text)
        const lunarDiv = document.createElement("div");
        lunarDiv.className = "lunar-text";

        const lunarDateStr = lunar.getDayInChinese();
        let bottomText = lunarDateStr;

        // 優先顯示節日，其次節氣，最後農曆日期
        // Priority: Festival > Solar Term > Lunar Date
        if (festival) {
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
            `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 · ${bottomText}`,
        );

        return cell;
    }
}
