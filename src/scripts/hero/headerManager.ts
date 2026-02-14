/**
 * Hero Header Manager
 * 負責管理 Hero 區域頂部的日期顯示
 * Responsible for managing the date display in the Hero header area
 */

import type { RenderHeroDetail, RenderPanelsDetail } from "./types";

export class HeroHeaderManager {
    // UI Elements
    private dayEl: HTMLElement | null = null;
    private monthEl: HTMLElement | null = null;
    private yearEl: HTMLElement | null = null;

    public init(): void {
        this.cacheElements();

        // 初始渲染：使用當前日期
        // Initial render: use current date
        this.updateDate(new Date());

        this.setupEventListeners();
    }

    public updateDate(date: Date): void {
        if (!this.yearEl || !this.monthEl || !this.dayEl) return;

        // 格式化日期：
        // 年: "2024"
        // 月: "02" (補零)
        // 日: "14" (補零)
        // Format Date:
        // Year: "2024"
        // Month: "02" (padded)
        // Day: "14" (padded)

        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        if (this.yearEl.textContent !== year) this.yearEl.textContent = year;
        if (this.monthEl.textContent !== month) this.monthEl.textContent = month;
        if (this.dayEl.textContent !== day) this.dayEl.textContent = day;
    }

    private cacheElements(): void {
        this.yearEl = document.getElementById("infoYear");
        this.monthEl = document.getElementById("infoMonth");
        this.dayEl = document.getElementById("infoDay");
    }

    private setupEventListeners(): void {
        // 監聽 Hero 渲染事件，該事件包含當前日期上下文
        // Listen for hero render events which contain the current date context
        window.addEventListener("render-hero", ((e: CustomEvent<RenderHeroDetail>) => {
            const { date } = e.detail;
            if (date) {
                this.updateDate(typeof date === "string" ? new Date(date) : date);
            }
        }) as EventListener);

        // 監聽面板渲染事件，這可能反映日期變更
        // Listen for panel render events which might reflect date changes
        window.addEventListener("render-panels", ((e: CustomEvent<RenderPanelsDetail>) => {
            const { date } = e.detail;
            if (date) {
                this.updateDate(typeof date === "string" ? new Date(date) : date);
            }
        }) as EventListener);
    }
}
