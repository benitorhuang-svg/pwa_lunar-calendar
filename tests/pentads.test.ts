/**
 * Test: core/pentads.ts
 * 驗證七十二候資料完整性
 */

import { describe, expect, it } from "vitest";
import { PENTADS } from "../src/scripts/core/pentads";

describe("七十二候 (PENTADS)", () => {
    it("應有 24 個節氣的候組", () => {
        expect(PENTADS.length).toBe(24);
    });

    it("每個節氣應恰好有 3 候", () => {
        PENTADS.forEach((group, i) => {
            expect(group.length, `節氣 ${i} 應有 3 候`).toBe(3);
        });
    });

    it("共應有 72 候 (24 × 3)", () => {
        const total = PENTADS.reduce((sum, g) => sum + g.length, 0);
        expect(total).toBe(72);
    });

    it("每候應有 name 和 meaning 屬性", () => {
        PENTADS.forEach((group, i) => {
            group.forEach((pentad, j) => {
                expect(pentad.name, `[${i}][${j}].name`).toBeTruthy();
                expect(pentad.meaning, `[${i}][${j}].meaning`).toBeTruthy();
                expect(typeof pentad.name).toBe("string");
                expect(typeof pentad.meaning).toBe("string");
            });
        });
    });

    it("所有候名應唯一", () => {
        const names = PENTADS.flat().map((p) => p.name);
        const unique = new Set(names);
        expect(unique.size).toBe(72);
    });

    it("小寒的第一候應為「雁北鄉」", () => {
        expect(PENTADS[0][0].name).toBe("雁北鄉");
    });

    it("冬至（最後一個節氣）應有完整候資料", () => {
        const lastGroup = PENTADS[23];
        expect(lastGroup.length).toBe(3);
        expect(lastGroup[0].name).toBeTruthy();
    });
});
