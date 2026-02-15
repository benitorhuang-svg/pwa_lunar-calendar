/**
 * Panel Renderers
 * 負責渲染年月選擇面板和今日詳情面板 (Responsible for rendering Year/Month selection panel and Today's detail panel)
 */

import { Lunar } from "../core/lunar";

export class PanelRenderers {
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
        const luck = lunar.getDayLuck();
        const termPeriod = lunar.getSolarTermPeriod();
        const yi = lunar.getDayYi();
        const ji = lunar.getDayJi();
        const festival = lunar.getFestival() || lunar.getSolarFestival();

        const festivalHtml = festival
            ? `<div class="detail-sub-main" style="color:#ff6b6b; margin-top:10px">${festival}</div>`
            : "";

        this.panelToday.innerHTML = `
    <div class="panel-detail-body">
        <div class="panel-side-accent">
            <div class="vertical-text">${ganzhi}年 · ${monthText}月${dayText}</div>
        </div>
        <div class="panel-main-content">
            <div class="detail-top-section">
                <div class="date-display">
                    <div class="detail-header">${date.getMonth() + 1}/${date.getDate()}</div>
                    <div class="detail-sub-main">${date.getFullYear()} · ${ganzhi}年</div>
                </div>
                <div class="traditional-seal">${zodiac.charAt(0)}</div>
            </div>
            
            <div class="detail-info-row">
                <div class="lunar-gz-tags">
                    <span>${monthGZ}月</span>
                    <span>${dayGZ}日</span>
                </div>
                <div class="solar-term">${termPeriod.current}</div>
            </div>

            <div class="detail-lucky-pill">
                ${jianchu}日 · ${luck}
            </div>
            
            ${festivalHtml}
            
            <div class="detail-yiji-section">
                <div class="yiji-item">
                    <span class="yiji-label yiji-label--good">宜</span>
                    <div class="tag-container">
                        ${yi.length > 0 ? yi.slice(0, 5).map((t: string) => `<span class="tag">${t}</span>`).join("") : '<span class="tag">諸事平吉</span>'}
                    </div>
                </div>
                <div class="yiji-item">
                    <span class="yiji-label yiji-label--bad">忌</span>
                    <div class="tag-container">
                        ${ji.length > 0 ? ji.slice(0, 5).map((t: string) => `<span class="tag">${t}</span>`).join("") : '<span class="tag">諸事不忌</span>'}
                    </div>
                </div>
            </div>
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
        monthGrid.className = "panel-grid";

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
        yearGrid.className = "panel-grid";
        const startYear = selectedYear - 4;

        for (let i = 0; i < 12; i++) {
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
}
