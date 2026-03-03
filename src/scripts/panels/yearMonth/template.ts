import { AtomicPageLayout } from "../common/templates";
import { SideAccentPanel } from "../common/organisms";
import { SectionDivider } from "./atoms";
import { MonthGrid, YearGrid } from "./organisms";
import { Lunar } from "../../core/lunar";

export function YearMonthPanelTemplate(
    selectedYear: number,
    selectedMonth: number,
    todayYear: number,
    todayMonth: number
): string {
    const today = new Date();
    const l = Lunar.fromDate(today);
    const ganzhi = l.getYearInGanZhi();
    const zodiac = l.getYearShengXiao();
    const monthGZ = l.getMonthInGanZhi();
    const dayGZ = l.getDayInGanZhi();

    const sidebar = SideAccentPanel(ganzhi, monthGZ, dayGZ, zodiac);
    const content = `
        <div class="panel-section-container">
            ${YearGrid(selectedYear, todayYear)}
            ${SectionDivider()}
            ${MonthGrid(selectedMonth, todayMonth)}
        </div>
    `;

    return AtomicPageLayout(sidebar, content);
}
