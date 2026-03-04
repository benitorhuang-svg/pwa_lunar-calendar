/**
 * Test: AppStateManager
 * 驗證模式狀態機、導航、主題決策
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateManager } from "../src/scripts/app/stateManager";

describe("AppStateManager", () => {
    let state: AppStateManager;

    beforeEach(() => {
        state = new AppStateManager();
    });

    // ─── Initial State ──────────────────────────────────

    describe("Initial State", () => {
        it("初始模式應為 welcome", () => {
            expect(state.getMode()).toBe("welcome");
        });

        it("初始日期應為今天", () => {
            const now = new Date();
            const s = state.getState();
            expect(s.selectedYear).toBe(now.getFullYear());
            expect(s.selectedMonth).toBe(now.getMonth());
            expect(s.selectedDay).toBe(now.getDate());
        });

        it("初始應無 activePanel", () => {
            expect(state.getState().activePanel).toBeNull();
        });

        it("constructor 應設定 body class: initial-welcome + immersion-mode", () => {
            expect(document.body.classList.contains("initial-welcome")).toBe(true);
            expect(document.body.classList.contains("immersion-mode")).toBe(true);
        });
    });

    // ─── Mode Transitions (FSM) ─────────────────────────

    describe("Mode Transitions（模式狀態機）", () => {
        it("welcome → artwork 應為合法轉換", () => {
            state.setMode("artwork");
            // setMode uses rAF, so mode should be set synchronously
            expect(state.getMode()).toBe("artwork");
        });

        it("welcome → calendar 應為合法轉換", () => {
            state.setMode("calendar");
            expect(state.getMode()).toBe("calendar");
        });

        it("welcome → note 應被拒絕（非法路徑）", () => {
            const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
            state.setMode("note");
            expect(state.getMode()).toBe("welcome"); // unchanged
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("zen → calendar 應被拒絕（非法路徑）", () => {
            const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
            const logSpy = vi.spyOn(console, "log").mockImplementation(() => { });

            // Step 1: welcome → artwork
            state.setMode("artwork");
            // rAF lock is held — force-release to allow next call
            state.forceReleaseLock();

            // Step 2: artwork → zen
            state.setMode("zen");
            state.forceReleaseLock();

            // Step 3: zen → calendar (invalid!)
            state.setMode("calendar");
            expect(state.getMode()).toBe("zen"); // unchanged
            spy.mockRestore();
            logSpy.mockRestore();
        });

        it("same mode → same mode 應被忽略（no-op）", () => {
            state.setMode("artwork");
            state.setMode("artwork"); // no-op
            expect(state.getMode()).toBe("artwork");
        });
    });

    // ─── Navigation ─────────────────────────────────────

    describe("Navigation（日期導航）", () => {
        beforeEach(() => {
            state.setYear(2026);
            state.setMonth(2); // March
            state.setDay(15);
        });

        it("navigateMonth(1) 應前進一個月", () => {
            state.navigateMonth(1);
            expect(state.getState().selectedMonth).toBe(3); // April
        });

        it("navigateMonth(-1) 應後退一個月", () => {
            state.navigateMonth(-1);
            expect(state.getState().selectedMonth).toBe(1); // February
        });

        it("navigateMonth 應處理年份進位（12月→1月）", () => {
            state.setMonth(11); // December
            state.navigateMonth(1);
            const s = state.getState();
            expect(s.selectedMonth).toBe(0); // January
            expect(s.selectedYear).toBe(2027);
        });

        it("navigateMonth 應處理年份退位（1月→12月）", () => {
            state.setMonth(0); // January
            state.navigateMonth(-1);
            const s = state.getState();
            expect(s.selectedMonth).toBe(11); // December
            expect(s.selectedYear).toBe(2025);
        });

        it("navigateDay(1) 應前進一天", () => {
            state.navigateDay(1);
            expect(state.getState().selectedDay).toBe(16);
        });

        it("navigateDay(-1) 應後退一天", () => {
            state.navigateDay(-1);
            expect(state.getState().selectedDay).toBe(14);
        });

        it("navigateDay 應處理月份進位（3月31日→4月1日）", () => {
            state.setDay(31);
            state.navigateDay(1);
            const s = state.getState();
            expect(s.selectedDay).toBe(1);
            expect(s.selectedMonth).toBe(3); // April
        });

        it("navigateDay 應處理月份退位（3月1日→2月最後一天）", () => {
            state.setDay(1);
            state.navigateDay(-1);
            const s = state.getState();
            // 2026年2月有28天
            expect(s.selectedDay).toBe(28);
            expect(s.selectedMonth).toBe(1); // February
        });

        it("goToToday 應重設為今天的日期", () => {
            state.setYear(2020);
            state.setMonth(5);
            state.setDay(1);
            state.goToToday();

            const now = new Date();
            const s = state.getState();
            expect(s.selectedYear).toBe(now.getFullYear());
            expect(s.selectedMonth).toBe(now.getMonth());
            expect(s.selectedDay).toBe(now.getDate());
        });
    });

    // ─── Theme ──────────────────────────────────────────

    describe("Theme（主題決策）", () => {
        // We need a mock Lunar object
        const createMockLunar = (overrides: {
            festival?: string;
            lunarMonth?: number;
            solarFestival?: string;
        } = {}) => ({
            getDayInChinese: () => "初一",
            getFestival: () => overrides.festival || "",
            getLunarMonth: () => overrides.lunarMonth ?? 6,
            getMonthInChinese: () => "六月",
            getSolarFestival: () => overrides.solarFestival || "",
            getSolarTermPeriod: () => null,
            getYearInGanZhi: () => "丙午",
        });

        it("春季（2-4月）應回傳 theme-spring", () => {
            const theme = state.getTheme(
                new Date(2026, 2, 15), // March
                createMockLunar() as any,
            );
            expect(theme).toBe("theme-spring");
        });

        it("夏季（5-7月）應回傳 theme-summer", () => {
            const theme = state.getTheme(
                new Date(2026, 5, 15), // June
                createMockLunar() as any,
            );
            expect(theme).toBe("theme-summer");
        });

        it("秋季（8-10月）應回傳 theme-autumn", () => {
            const theme = state.getTheme(
                new Date(2026, 8, 15), // September
                createMockLunar() as any,
            );
            expect(theme).toBe("theme-autumn");
        });

        it("冬季（11, 12, 1月）應回傳 theme-winter", () => {
            const theme = state.getTheme(
                new Date(2026, 0, 15), // January
                createMockLunar() as any,
            );
            expect(theme).toBe("theme-winter");
        });

        it("農曆12月或1月應覆寫為 theme-festive", () => {
            const theme = state.getTheme(
                new Date(2026, 0, 28), // Late Jan
                createMockLunar({ lunarMonth: 12 }) as any,
            );
            expect(theme).toBe("theme-festive");
        });

        it("春節應覆寫為 theme-festive", () => {
            const theme = state.getTheme(
                new Date(2026, 1, 17),
                createMockLunar({ festival: "春節", lunarMonth: 1 }) as any,
            );
            expect(theme).toBe("theme-festive");
        });

        it("清明應覆寫為 theme-dark", () => {
            const theme = state.getTheme(
                new Date(2026, 3, 4),
                createMockLunar({ festival: "清明", lunarMonth: 3 }) as any,
            );
            expect(theme).toBe("theme-dark");
        });
    });

    // ─── Active Panel ───────────────────────────────────

    describe("Active Panel", () => {
        it("setActivePanel 應設定 body data-active-panel", () => {
            state.setActivePanel("today");
            expect(document.body.getAttribute("data-active-panel")).toBe("today");
        });

        it("setActivePanel(null) 應移除 data-active-panel", () => {
            state.setActivePanel("today");
            state.setActivePanel(null);
            expect(document.body.getAttribute("data-active-panel")).toBeNull();
        });

        it("模式轉換至 artwork 應清除 activePanel", () => {
            state.setActivePanel("today");
            state.setMode("artwork"); // welcome → artwork
            expect(state.getState().activePanel).toBeNull();
        });
    });

    // ─── Force Release Lock ─────────────────────────────

    describe("Force Release Lock", () => {
        it("forceReleaseLock 應不拋出異常", () => {
            const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
            expect(() => state.forceReleaseLock()).not.toThrow();
            spy.mockRestore();
        });
    });
});
