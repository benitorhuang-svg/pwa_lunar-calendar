/**
 * Test: core/lunar/math.ts & core/lunarConstants.ts
 * 驗證農曆核心計算引擎 — 公曆轉農曆、年天數等
 */

import { describe, expect, it } from "vitest";
import {
    LUNAR_INFO,
    MIN_YEAR,
    MAX_YEAR,
    TIAN_GAN,
    DI_ZHI,
    SHENG_XIAO,
    MONTH_NAMES,
    DAY_NAMES,
} from "../src/scripts/core/lunarConstants";
import {
    gregorianToLunar,
    yearDays,
    monthDays,
    leapMonth,
    leapDays,
} from "../src/scripts/core/lunar/math";

// --- Constants ---

describe("lunarConstants", () => {
    it("LUNAR_INFO 應有 201 筆資料 (1900-2100)", () => {
        expect(LUNAR_INFO.length).toBe(201);
    });

    it("年份範圍應為 1900-2100", () => {
        expect(MIN_YEAR).toBe(1900);
        expect(MAX_YEAR).toBe(2100);
    });

    it("天干應有 10 個", () => {
        expect(TIAN_GAN.length).toBe(10);
    });

    it("地支應有 12 個", () => {
        expect(DI_ZHI.length).toBe(12);
    });

    it("生肖應有 12 個", () => {
        expect(SHENG_XIAO.length).toBe(12);
    });

    it("月名應有 12 個", () => {
        expect(MONTH_NAMES.length).toBe(12);
        expect(MONTH_NAMES[0]).toBe("正");
        expect(MONTH_NAMES[11]).toBe("臘");
    });

    it("日名應有 30 個", () => {
        expect(DAY_NAMES.length).toBe(30);
        expect(DAY_NAMES[0]).toBe("初一");
        expect(DAY_NAMES[29]).toBe("三十");
    });
});

// --- Math Functions ---

describe("yearDays", () => {
    it("1900年應返回合理的農曆年天數", () => {
        const days = yearDays(1900);
        expect(days).toBeGreaterThanOrEqual(348);
        expect(days).toBeLessThanOrEqual(390);
    });

    it("相同年份多次呼叫應返回一致結果（快取測試）", () => {
        const first = yearDays(2025);
        const second = yearDays(2025);
        expect(first).toBe(second);
    });

    it("每年天數應在 348-390 之間", () => {
        for (let y = 1900; y <= 2100; y++) {
            const days = yearDays(y);
            expect(days, `${y} 年天數異常: ${days}`).toBeGreaterThanOrEqual(348);
            expect(days, `${y} 年天數異常: ${days}`).toBeLessThanOrEqual(390);
        }
    });
});

describe("monthDays", () => {
    it("每月天數應為 29 或 30", () => {
        for (let m = 1; m <= 12; m++) {
            const days = monthDays(2025, m);
            expect([29, 30]).toContain(days);
        }
    });
});

describe("leapMonth / leapDays", () => {
    it("閏月應為 0-12 之間", () => {
        for (let y = 1900; y <= 2100; y++) {
            const lm = leapMonth(y);
            expect(lm).toBeGreaterThanOrEqual(0);
            expect(lm).toBeLessThanOrEqual(12);
        }
    });

    it("無閏月時 leapDays 應為 0", () => {
        // 找一個無閏月的年份
        for (let y = 1900; y <= 2100; y++) {
            if (leapMonth(y) === 0) {
                expect(leapDays(y)).toBe(0);
                break;
            }
        }
    });

    it("有閏月時 leapDays 應為 29 或 30", () => {
        for (let y = 1900; y <= 2100; y++) {
            if (leapMonth(y) > 0) {
                expect([29, 30]).toContain(leapDays(y));
                break;
            }
        }
    });
});

describe("gregorianToLunar", () => {
    it("2025-01-29 應為農曆正月初一", () => {
        const result = gregorianToLunar(new Date(2025, 0, 29));
        expect(result.year).toBe(2025);
        expect(result.month).toBe(1);
        expect(result.day).toBe(1);
        expect(result.isLeap).toBe(false);
    });

    it("2025-02-12 應為農曆正月十五 (元宵)", () => {
        const result = gregorianToLunar(new Date(2025, 1, 12));
        expect(result.year).toBe(2025);
        expect(result.month).toBe(1);
        expect(result.day).toBe(15);
    });

    it("農曆每月日期應在 1-30 之間", () => {
        // Test a full year
        for (let m = 0; m < 12; m++) {
            for (let d = 1; d <= 28; d++) {
                const result = gregorianToLunar(new Date(2025, m, d));
                expect(result.day).toBeGreaterThanOrEqual(1);
                expect(result.day).toBeLessThanOrEqual(30);
                expect(result.month).toBeGreaterThanOrEqual(1);
                expect(result.month).toBeLessThanOrEqual(12);
            }
        }
    });

    it("農曆年份轉換應合理", () => {
        // 2000-02-05 = 農曆 2000 年正月初一
        const result = gregorianToLunar(new Date(2000, 1, 5));
        expect(result.year).toBe(2000);
        expect(result.month).toBe(1);
        expect(result.day).toBe(1);
    });
});
