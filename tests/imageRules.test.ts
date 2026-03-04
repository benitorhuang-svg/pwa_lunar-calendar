/**
 * Test: ImageRules.getSeason
 * 驗證季節判斷邏輯 — 純函式，無 DOM 依賴
 */

import { describe, expect, it } from "vitest";
import { ImageRules } from "../src/scripts/hero/imageRules";

describe("ImageRules.getSeason", () => {
    // --- Spring (Feb=1, Mar=2, Apr=3) ---
    it("2月應為 spring", () => {
        expect(ImageRules.getSeason(new Date(2026, 1, 1))).toBe("spring");
    });

    it("3月應為 spring", () => {
        expect(ImageRules.getSeason(new Date(2026, 2, 15))).toBe("spring");
    });

    it("4月應為 spring", () => {
        expect(ImageRules.getSeason(new Date(2026, 3, 30))).toBe("spring");
    });

    // --- Summer (May=4, Jun=5, Jul=6) ---
    it("5月應為 summer", () => {
        expect(ImageRules.getSeason(new Date(2026, 4, 1))).toBe("summer");
    });

    it("6月應為 summer", () => {
        expect(ImageRules.getSeason(new Date(2026, 5, 21))).toBe("summer");
    });

    it("7月應為 summer", () => {
        expect(ImageRules.getSeason(new Date(2026, 6, 31))).toBe("summer");
    });

    // --- Autumn (Aug=7, Sep=8, Oct=9) ---
    it("8月應為 autumn", () => {
        expect(ImageRules.getSeason(new Date(2026, 7, 1))).toBe("autumn");
    });

    it("9月應為 autumn", () => {
        expect(ImageRules.getSeason(new Date(2026, 8, 15))).toBe("autumn");
    });

    it("10月應為 autumn", () => {
        expect(ImageRules.getSeason(new Date(2026, 9, 31))).toBe("autumn");
    });

    // --- Winter (Nov=10, Dec=11, Jan=0) ---
    it("11月應為 winter", () => {
        expect(ImageRules.getSeason(new Date(2026, 10, 1))).toBe("winter");
    });

    it("12月應為 winter", () => {
        expect(ImageRules.getSeason(new Date(2026, 11, 25))).toBe("winter");
    });

    it("1月應為 winter", () => {
        expect(ImageRules.getSeason(new Date(2026, 0, 15))).toBe("winter");
    });

    // --- Edge: 每月第一天 ---
    it("所有 12 個月的第一天應返回正確的季節", () => {
        const expected = [
            "winter",  // Jan
            "spring",  // Feb
            "spring",  // Mar
            "spring",  // Apr
            "summer",  // May
            "summer",  // Jun
            "summer",  // Jul
            "autumn",  // Aug
            "autumn",  // Sep
            "autumn",  // Oct
            "winter",  // Nov
            "winter",  // Dec
        ];
        for (let m = 0; m < 12; m++) {
            expect(ImageRules.getSeason(new Date(2026, m, 1))).toBe(expected[m]);
        }
    });
});

describe("ImageRules 常數", () => {
    it("SEASONS 應包含所有季節", () => {
        expect(ImageRules.SEASONS).toContain("spring");
        expect(ImageRules.SEASONS).toContain("summer");
        expect(ImageRules.SEASONS).toContain("autumn");
        expect(ImageRules.SEASONS).toContain("winter");
        expect(ImageRules.SEASONS).toContain("default");
    });

    it("SUPPORTED_EXTENSIONS 應包含主要格式", () => {
        expect(ImageRules.SUPPORTED_EXTENSIONS).toContain(".webp");
        expect(ImageRules.SUPPORTED_EXTENSIONS).toContain(".png");
        expect(ImageRules.SUPPORTED_EXTENSIONS).toContain(".jpg");
    });

    it("MAX_IMAGES_PER_SEASON 應為正整數", () => {
        expect(ImageRules.MAX_IMAGES_PER_SEASON).toBeGreaterThan(0);
    });
});
