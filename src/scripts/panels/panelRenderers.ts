/**
 * Panel Renderers
 * 負責渲染年月選擇面板和今日詳情面板 (Responsible for rendering Year/Month selection panel and Today's detail panel)
 */

import { HolidayService } from "../core/holidayService";
import { Lunar } from "../core/lunar";
import { POEMS } from "../../data/poems/index";
import type { Poem } from "../../data/poems/types";
import { TodayPanelTemplate } from "./today/template";
import { YearMonthPanelTemplate } from "./yearMonth/template";

export class PanelRenderers {
    private holidayService = HolidayService.getInstance();
    private panelToday: HTMLElement | null = null;
    private panelYearMonth: HTMLElement | null = null;

    constructor() { }

    public init(): void {
        this.panelYearMonth = document.getElementById("panelYearMonth");
        this.panelToday = document.getElementById("panelToday");
    }

    public renderTodayPanel(
        selectedYear: number,
        selectedMonth: number,
        selectedDay: number,
    ): void {
        if (!this.panelToday) return;

        const date = new Date(selectedYear, selectedMonth, selectedDay);
        const lunar = Lunar.fromDate(date);
        const monthText = lunar.getMonthInChinese();
        const dayText = lunar.getDayInChinese();
        const ganzhi = lunar.getYearInGanZhi();
        const zodiac = lunar.getYearShengXiao();
        const dayGZ = lunar.getDayInGanZhi();
        const monthGZ = lunar.getMonthInGanZhi();
        // const jianchu = lunar.getJianChu();
        // const luck = lunar.getComprehensiveLuck();
        // const mansion = lunar.getMansion();
        const termPeriod = lunar.getSolarTermPeriod();

        const festival = lunar.getFestival() || lunar.getSolarFestival();
        const pentad = lunar.getPentad();
        const moon = lunar.getMoonPhase();

        // 假期資訊 (Holiday Info)
        const holidayInfo = this.holidayService.getHolidayInfo(
            selectedYear,
            selectedMonth,
            selectedDay,
        );

        console.log("[Floater] Rendering today panel for:", date.toDateString());

        if (!ganzhi || !monthText || !dayText) {
            console.warn("[Floater] Critical lunar data missing, showing basic date info.");
        }

        // Gets a poem based on season/term
        const poem = this.getDailyPoem(date, termPeriod?.current);

        this.panelToday.innerHTML = TodayPanelTemplate({
            date,
            monthText,
            dayText,
            ganzhi,
            zodiac,
            dayGZ,
            monthGZ,
            festival,
            holidayDesc: holidayInfo?.isHoliday ? holidayInfo.description || null : null,
            termPeriod,
            pentad: pentad || { name: "", meaning: "", index: 0 },
            poem,
            moon
        });

        // Notify NoteManager to re-bind events
        setTimeout(() => {
            window.dispatchEvent(
                new CustomEvent("today-panel-rendered", {
                    detail: { day: selectedDay, month: selectedMonth, year: selectedYear },
                }),
            );
        }, 0);
    }

    public renderYearMonthPanel(selectedYear: number, selectedMonth: number, today: Date): void {
        if (!this.panelYearMonth) return;
        this.panelYearMonth.innerHTML = YearMonthPanelTemplate(
            selectedYear,
            selectedMonth,
            today.getFullYear(),
            today.getMonth()
        );
    }

    // --- Sub-Renderers for Today Panel (Complex UI Decomposition) ---







    // --- Daily Poem Logic ---
    private getDailyPoem(date: Date, term?: string): Poem {
        // 1. Try to find poems matching the specific solar term
        if (term) {
            const termPoems = POEMS.filter((p) => p.term === term);
            if (termPoems.length > 0) {
                const dayHash = date.getDate();
                return termPoems[dayHash % termPoems.length]!;
            }
        }

        // 2. Fallback to season
        const month = date.getMonth() + 1;
        let season: "spring" | "summer" | "autumn" | "winter" = "spring";

        if (month >= 3 && month <= 5) season = "spring";
        else if (month >= 6 && month <= 8) season = "summer";
        else if (month >= 9 && month <= 11) season = "autumn";
        else season = "winter";

        const seasonPoems = POEMS.filter((p) => p.season === season);
        const candidates = seasonPoems.length > 0 ? seasonPoems : POEMS;

        // 3. Random pick consistent for the day
        const dayHash = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        const index = dayHash % candidates.length;

        return candidates[index]!;
    }




}
