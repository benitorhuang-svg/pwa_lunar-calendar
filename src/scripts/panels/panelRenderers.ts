/**
 * Panel Renderers
 * 負責渲染年月選擇面板和今日詳情面板 (Responsible for rendering Year/Month selection panel and Today's detail panel)
 */

import { HolidayService } from "../core/holidayService";
import { Lunar } from "../core/lunar";

export class PanelRenderers {
    private holidayService = HolidayService.getInstance();
    private panelToday: HTMLElement | null = null;
    private panelYearMonth: HTMLElement | null = null;

    constructor() {}

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
        console.log("[Floater] Lunar Data:", {
            dayText,
            festival,
            ganzhi,
            jianchu,
            luck,
            mansion: mansion.name,
            monthText,
            zodiac,
            pentad,
            moon,
        });

        if (!ganzhi || !monthText || !dayText) {
            console.warn("[Floater] Critical lunar data missing, showing basic date info.");
        }

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
                    ${this.renderCultureSection(pentad)}
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

    private renderCultureSection(pentad: { name: string; meaning: string; index: number }): string {
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

    private renderMoonSvg(value: number): string {
        const R = 28;
        const C = 32;

        // Phase Logic:
        // New Moon (0) -> Full Moon (0.5) -> New Moon (1.0)
        // Day 2 (approx 0.06) should be Waxing Crescent (Right side lit, very thin).

        // Normalize phase to 0..1 for just the lighting percentage?
        // Let's use standard astronomical definition logic for the path.

        // value 0..0.5 is Waxing
        // using Math.cos for the terminator projection
        // angle goes from 0 to PI for waxing, PI to 2PI for waning

        // Illumination factor (-1 to 1). -1=New, 1=Full.
        // Actually simpler:
        // 0 (New) -> Terminator x = -R
        // 0.25 (First Q) -> Terminator x = 0
        // 0.5 (Full) -> Terminator x = R
        // But we need to define the SHAPE.

        // Waxing (0 < v < 0.5): Light on Right.
        // Outer arc: Right Semicircle.
        // Inner arc: Ellipse from Top to Bottom.

        let isWaxing = true;
        if (value <= 0.5) {
            isWaxing = true;
        } else {
            isWaxing = false;
        }

        // Calculate the "bulge" radius of the terminator ellipse.
        // At value=0 (New), rX = -R (Matches outer circle left, result empty) - Wait.
        // Let's stick to "Draw the Light".

        // Radius of terminator X.
        // We use cos(angle) mapping.
        // 0 -> -R (Concave max)
        // 0.25 -> 0 (Flat)
        // 0.5 -> R (Convex max)

        const terminatorX = -R * Math.cos(value * 2 * Math.PI);
        const rX = Math.abs(terminatorX);

        // Outer Arc: Always the semi-circle on the lit side.
        // Waxing: Right side (1). Waning: Left side (0).
        const outerSweep = isWaxing ? 1 : 0;

        // Terminator Sweep:
        // Needs careful logic.
        // If Waxing (Right Lit):
        //    Terminator starts Top, ends Bottom.
        //    If Crescent (val < 0.25): Terminator curves Right (Sweep 0? No, standard arc sweep logic)
        //    Let's visualize:
        //    Top(32,4) -> Bottom(32,60).
        //    Right Semicircle (Outer): Sweep 1.
        //    Terminator (Inner): Must go Bottom -> Top to close path?
        //    Let's go Bottom(32,60) -> Top(32,4).

        // Construct Path:
        // Move to Top (32, 4)
        // Arc to Bottom (32, 60) via Outer Side.
        // Arc to Top (32, 4) via Terminator.

        const startX = 32,
            startY = 4;
        const endX = 32,
            endY = 60;

        // Outer Arc (Top -> Bottom)
        // Waxing (Right side lit) -> Sweep 1.
        // Waning (Left side lit) -> Sweep 0.
        const outerPath = `M ${startX} ${startY} A ${R} ${R} 0 0 ${outerSweep} ${endX} ${endY}`;

        // Inner Arc (Bottom -> Top)
        // We need to determine Sweep for the return trip.
        // For Waxing Crescent (v=0.1): Terminator X is negative (Left of center).
        // The curve should bulge to the Left (Concave relative to the right-lit shape).
        // Going Bottom->Top. Bulge Left means Sweep 1 (Clockwise).

        // For Waxing Gibbous (v=0.4): Terminator X is positive (Right of center).
        // The curve bubbles out to Left of line? No, it surrounds center.
        // Wait, at Full moon, terminator matches Left Semicircle.

        // Let's rely on the sign of terminatorX.
        // If terminatorX is negative (Concave), we want the arc to effectively pass through x = 32 + terminatorX.
        // SVG Arc radii are positive.
        // We select sweep based on phase.

        let innerSweep = 0;
        if (isWaxing) {
            // Waxing: Outer is Right.
            // Crescent: Inner needs to curve Left (into the shape). Bottom->Top, Curve Left = Sweep 0?
            // SVG coords: Y+ is down. Bottom(60) to Top(4). Vector is Up. Left of Vector is Minus X.
            // So curving towards center (Left) is Sweep 1.

            if (value < 0.25)
                innerSweep = 0; // Crescent: Curve Match Outer edge direction roughly?
            else innerSweep = 1; // Gibbous: Bulge outward
        } else {
            // Waning: Outer is Left.
            // Gibbous (0.5-0.75): Bulge Right.
            // Crescent (>0.75): Hollow Right.
            if (value < 0.75) innerSweep = 0;
            else innerSweep = 1;
        }

        const innerPath = `A ${rX} ${R} 0 0 ${innerSweep} ${startX} ${startY}`;
        const pathD = `${outerPath} ${innerPath} Z`;

        // Special case for exact New Moon to avoid artifacts or thin lines
        if (value < 0.02 || value > 0.98) {
            return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
                <circle cx="${C}" cy="${C}" r="${R}" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
            </svg>`;
        }

        // Special case for Full Moon
        if (value > 0.48 && value < 0.52) {
            // Just a circle
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
            <!-- Background (Dark Side) -->
            <circle cx="${C}" cy="${C}" r="${R}" fill="#111" class="moon-shadow"/>
            
            <!-- Lit Part -->
            <path d="${pathD}" fill="url(#moonGrad)" filter="url(#crater)" style="filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.5));"/>
        </svg>`;
    }
}
