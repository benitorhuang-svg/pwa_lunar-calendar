/**
 * Panel Renderers
 * 負責渲染年月選擇面板和今日詳情面板 (Responsible for rendering Year/Month selection panel and Today's detail panel)
 */

import { HolidayService } from "../core/holidayService";
import { Lunar } from "../core/lunar";
import { POEMS } from "../../data/poems/index";
import type { Poem } from "../../data/poems/types";

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
        const jianchu = lunar.getJianChu();
        const luck = lunar.getComprehensiveLuck();
        const mansion = lunar.getMansion();
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

        this.panelToday.innerHTML = `
            <div class="panel-detail-body">
                ${this.renderSideAccent(ganzhi, monthGZ, dayGZ, zodiac)}
                <div class="panel-main-content">
                    <div class="detail-top-section">
                        ${this.renderDateDisplay(
            date,
            monthText,
            dayText,
            festival,
            termPeriod,
            holidayInfo?.isHoliday ? holidayInfo.description || "休假" : null,
        )}
                        ${this.renderRightCluster(moon)}
                    </div>
                    ${this.renderCultureContent(pentad, poem, date)}
                </div>
            </div>`;

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
        this.panelYearMonth.innerHTML = "";
        const container = document.createElement("div");
        container.className = "panel-section-container";

        // Year Section
        const yearSection = this.createYearSection(selectedYear, today);
        container.appendChild(yearSection);

        // Divider
        const divider = document.createElement("div");
        divider.className = "panel-section-divider";
        container.appendChild(divider);

        // Month Section
        const monthSection = this.createMonthSection(selectedYear, selectedMonth, today);
        container.appendChild(monthSection);

        this.panelYearMonth.appendChild(container);
    }

    private createMonthSection(
        selectedYear: number,
        selectedMonth: number,
        today: Date,
    ): HTMLElement {
        const monthSection = document.createElement("div");
        const monthHeader = document.createElement("div");
        monthHeader.className = "panel-section-header";
        monthHeader.textContent = "月份";
        monthSection.appendChild(monthHeader);

        const monthGrid = document.createElement("div");
        monthGrid.className = "panel-grid panel-grid-month";

        for (let i = 0; i < 12; i++) {
            const isTodayMonth = i === today.getMonth();
            const item = document.createElement("button");
            item.type = "button";
            item.ariaLabel = `${selectedYear}年${i + 1}月`;
            item.className = `panel-item ${i === selectedMonth ? "selected" : ""} ${isTodayMonth ? "today" : ""}`;
            item.innerHTML = `<span class="month-num">${i + 1}</span><span class="month-label">月</span>`;
            item.onclick = (e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("month-selected", { detail: i }));
            };
            monthGrid.appendChild(item);
        }

        monthSection.appendChild(monthGrid);
        return monthSection;
    }

    private createYearSection(selectedYear: number, today: Date): HTMLElement {
        const yearSection = document.createElement("div");
        const yearHeader = document.createElement("div");
        yearHeader.className = "panel-section-header";
        yearHeader.textContent = "年份";
        yearSection.appendChild(yearHeader);

        const yearGrid = document.createElement("div");
        yearGrid.className = "panel-grid panel-grid-year";
        // Show 10 years: current - 4 to + 5
        const startYear = selectedYear - 4;

        for (let i = 0; i < 10; i++) {
            const y = startYear + i;
            const item = document.createElement("button");
            item.type = "button";
            item.ariaLabel = `${y}年`;
            item.className = `panel-item ${y === selectedYear ? "selected" : ""} ${y === today.getFullYear() ? "today" : ""}`;
            item.textContent = y.toString();
            item.onclick = (e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("year-selected", { detail: y }));
            };
            yearGrid.appendChild(item);
        }

        yearSection.appendChild(yearGrid);
        return yearSection;
    }

    // --- Sub-Renderers for Today Panel (Complex UI Decomposition) ---

    private renderDateDisplay(
        date: Date,
        monthText: string,
        dayText: string,
        festival: null | string,
        termPeriod: { current: string; next: string; daysToNext: number } | undefined,
        holidayDesc: null | string = null,
    ): string {
        const finalizedMonth = monthText.endsWith("月") ? monthText : monthText + "月";

        const festivalHtml = festival
            ? `<div class="festival-tag-mini">${festival}</div>`
            : holidayDesc
                ? `<div class="festival-tag-mini">${holidayDesc}</div>`
                : "";

        let termFlowHtml = "";
        if (termPeriod) {
            const isNextMonthTerm = termPeriod.daysToNext > 15;
            termFlowHtml = `
                <div class="term-flow-mini">
                    <span class="flow-node-mini">${termPeriod.current}</span>
                    <div class="flow-arrow-mini">
                        <div class="flow-line-mini"></div>
                        <div class="flow-tag-mini">${termPeriod.daysToNext} 天</div>
                        <div class="flow-arrow-head-mini"></div>
                    </div>
                    <span class="flow-node-mini ${isNextMonthTerm ? "dim" : ""}">${termPeriod.next}</span>
                </div>`;
        }

        return `
            <div class="detail-sub-main">
                <!-- Line 1: Month/Day Year -->
                <div class="today-date-row">
                    <span class="today-full-date">${date.getMonth() + 1}/${date.getDate()}</span>
                    <span class="today-year-small">${date.getFullYear()}</span>
                </div>
                
                <!-- Line 2: Lunar Date + Festival -->
                <div class="lunar-info-row-1">
                    <span class="lunar-main">${finalizedMonth}.${dayText}</span>
                    ${festivalHtml}
                </div>

                <!-- Line 3: Solar Term Flow + Jianchu -->
                <div class="lunar-term-row">
                    ${termFlowHtml}
                </div>
            </div>`;
    }

    private renderRightCluster(moon: { name: string; phase: number; value: number }): string {
        return `
            <div class="detail-right-cluster">
                <div class="moon-box-top">
                    <div class="moon-svg-wrap">
                        ${this.renderMoonSvg(moon.value)}
                    </div>
                    <span class="moon-label-top">${moon.name}</span>
                </div>
            </div>`;
    }

    private renderSideAccent(
        ganzhi: string,
        monthGZ: string,
        dayGZ: string,
        zodiac: string,
    ): string {
        return `
            <div class="panel-side-accent">
                <div class="vertical-text">
                    <span class="side-zodiac">${zodiac}</span>
                    <span class="side-ganzhi">${ganzhi}年 · ${monthGZ}月${dayGZ}日</span>
                </div>
            </div>`;
    }

    // --- Merged Culture Content Logic ---
    private renderCultureContent(
        pentad: { name: string; meaning: string; index: number },
        poem: Poem,
        date: Date
    ): string {
        // Logic: Show Pentad only on specific days (e.g. 1st, 6th, 11th, 16th, 21st, 26th) 
        // which roughly corresponds to the start of a new Pentad (5-day period).
        // Or simply: date.getDate() % 5 === 1.
        // Today (2/19) -> 19 % 5 = 4. So it will show Poem.
        // Yesterday (2/18) -> 18 % 5 = 3. Poem.
        // 2/16 -> 16 % 5 = 1. Pentad.
        const showPentad = (date.getDate() % 5 === 1) || (date.getDate() === 1);

        if (showPentad) {
            return this.renderPentadCard(pentad);
        } else {
            return this.renderPoemCard(poem);
        }
    }

    private renderPentadCard(pentad: { name: string; meaning: string; index: number }): string {
        const pentadLabel = ["", "初候", "二候", "三候"][pentad.index] || "候";
        return `
            <div class="detail-culture-section">
                <div class="culture-left full-width">
                     <div class="pentad-display">
                        <div class="pentad-header-row">
                            <span class="pentad-tag-box">${pentadLabel}</span>
                            <span class="pentad-name-title">${pentad.name}</span>
                        </div>
                        <div class="pentad-content-text">${pentad.meaning}</div>
                     </div>
                </div>
            </div>`;
    }

    private renderPoemCard(poem: Poem): string {
        return `
            <div class="detail-culture-section">
                <div class="culture-left full-width">
                     <div class="pentad-display">
                        <div class="pentad-header-row">
                            <span class="pentad-tag-box" style="background:rgba(212,175,85,0.15); color:var(--cal-accent); border:1px solid rgba(212,175,85,0.3)">詩選</span>
                            <span class="pentad-name-title" style="font-size:1.1rem">${poem.author}</span>
                        </div>
                        <div class="pentad-content-text" style="
                            font-size:1.4rem; 
                            line-height:1.6; 
                            text-align:center; 
                            padding: 12px 0;
                            font-family: var(--font-calligraphy);
                            letter-spacing: 0.05em;
                        ">
                            「${poem.content}」
                        </div>
                        <div style="text-align:right; font-size:0.9rem; opacity:0.6; margin-top:4px; font-family:var(--font-serif)">
                           — ${poem.dynasty || ""}
                        </div>
                     </div>
                </div>
            </div>`;
    }

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

    private renderMoonSvg(value: number): string {
        const R = 28;
        const C = 32;

        let isWaxing = true;
        if (value <= 0.5) {
            isWaxing = true;
        } else {
            isWaxing = false;
        }

        const terminatorX = -R * Math.cos(value * 2 * Math.PI);
        const rX = Math.abs(terminatorX);
        const outerSweep = isWaxing ? 1 : 0;

        const startX = 32,
            startY = 4;
        const endX = 32,
            endY = 60;

        const outerPath = `M ${startX} ${startY} A ${R} ${R} 0 0 ${outerSweep} ${endX} ${endY}`;

        let innerSweep = 0;
        if (isWaxing) {
            if (value < 0.25)
                innerSweep = 0;
            else innerSweep = 1;
        } else {
            if (value < 0.75) innerSweep = 0;
            else innerSweep = 1;
        }

        const innerPath = `A ${rX} ${R} 0 0 ${innerSweep} ${startX} ${startY}`;
        const pathD = `${outerPath} ${innerPath} Z`;

        if (value < 0.02 || value > 0.98) {
            return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
                <circle cx="${C}" cy="${C}" r="${R}" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
            </svg>`;
        }

        if (value > 0.48 && value < 0.52) {
            return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
                <defs>
                    <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#fff9e6"/>
                        <stop offset="100%" stop-color="#d4af37"/>
                    </radialGradient>
                    <filter id="moonGlow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <circle cx="${C}" cy="${C}" r="${R}" fill="url(#moonGrad)" filter="url(#moonGlow)"/>
            </svg>`;
        }

        return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
            <defs>
                <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="#fff5c3"/>
                    <stop offset="70%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#b8860b"/>
                </radialGradient>
                <filter id="crater" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.10" numOctaves="3" result="noise"/>
                    <feDiffuseLighting in="noise" lighting-color="#d4af37" surfaceScale="1">
                        <feDistantLight azimuth="45" elevation="40"/>
                    </feDiffuseLighting>
                    <feComposite operator="in" in2="SourceGraphic"/>
                    <feBlend in="SourceGraphic" mode="multiply"/>
                </filter>
            </defs>
            <circle cx="${C}" cy="${C}" r="${R}" fill="#111" class="moon-shadow"/>
            <path d="${pathD}" fill="url(#moonGrad)" filter="url(#crater)" style="filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.5));"/>
        </svg>`;
    }
}
