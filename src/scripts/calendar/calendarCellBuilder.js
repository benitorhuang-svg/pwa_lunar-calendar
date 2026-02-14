/**
 * Calendar Cell Builder
 * 負責建構日曆單元格 (Responsible for constructing calendar grid cells)
 */

export class CalendarCellBuilder {
    createDayCell(year, month, day, isOtherMonth, today, selectedDay) {
        const date = new Date(year, month, day);
        const lunar = Lunar.fromDate(date);
        const term = lunar.getJieQi();
        const festival = lunar.getFestival() || lunar.getSolarFestival();

        const cell = document.createElement("div");

        cell.className = `day-cell ${isOtherMonth ? "other-month" : ""}`;
        cell.tabIndex = isOtherMonth ? -1 : 0;
        cell.setAttribute("role", "button");
        cell.dataset.year = year;
        cell.dataset.month = month;
        cell.dataset.day = day;
        if (isOtherMonth) cell.dataset.other = "true";

        if (date.toDateString() === today.toDateString()) {
            cell.classList.add("today");
        }

        // Maintain selection state if not other month
        if (!isOtherMonth && selectedDay && day === selectedDay) {
            cell.classList.add("selected");
        }

        const greg = document.createElement("div");
        greg.className = "gregorian-num";
        greg.textContent = day;

        const lunarDiv = document.createElement("div");
        lunarDiv.className = "lunar-text";
        const lunarDateStr = lunar.getDayInChinese();
        let bottomText = lunarDateStr;

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

        cell.setAttribute(
            "aria-label",
            `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 · ${bottomText}`
        );

        return cell;
    }
}
