/**
 * Test: transitionTable.ts
 * 驗證模式轉換表的完整性與一致性
 */

import { describe, expect, it } from "vitest";
import {
    TRANSITION_CLASS_MAP,
    VALID_TRANSITIONS,
} from "../src/scripts/app/transitionTable";

// All valid modes
const ALL_MODES = ["welcome", "artwork", "zen", "calendar", "note"] as const;

describe("VALID_TRANSITIONS（合法轉移路徑表）", () => {
    it("應包含所有 5 種模式的轉移定義", () => {
        ALL_MODES.forEach((mode) => {
            expect(VALID_TRANSITIONS).toHaveProperty(mode);
            expect(Array.isArray(VALID_TRANSITIONS[mode])).toBe(true);
        });
    });

    it("不允許自我轉換（mode → mode）", () => {
        ALL_MODES.forEach((mode) => {
            expect(VALID_TRANSITIONS[mode]).not.toContain(mode);
        });
    });

    it("welcome 應可轉換至 artwork, zen, calendar", () => {
        const targets = VALID_TRANSITIONS.welcome;
        expect(targets).toContain("artwork");
        expect(targets).toContain("zen");
        expect(targets).toContain("calendar");
    });

    it("zen 只能回到 artwork", () => {
        expect(VALID_TRANSITIONS.zen).toEqual(["artwork"]);
    });

    it("note 只能回到 calendar", () => {
        expect(VALID_TRANSITIONS.note).toEqual(["calendar"]);
    });

    it("artwork 應可轉換至 calendar 和 zen", () => {
        const targets = VALID_TRANSITIONS.artwork;
        expect(targets).toContain("calendar");
        expect(targets).toContain("zen");
    });
});

describe("TRANSITION_CLASS_MAP（Class 操作映射表）", () => {
    it("每個合法轉換路徑都應有對應的 class swap 定義", () => {
        ALL_MODES.forEach((from) => {
            VALID_TRANSITIONS[from].forEach((to) => {
                const key = `${from}->${to}`;
                expect(TRANSITION_CLASS_MAP).toHaveProperty(key);
                const entry = TRANSITION_CLASS_MAP[key]!;
                expect(entry).toHaveProperty("add");
                expect(entry).toHaveProperty("remove");
                expect(Array.isArray(entry.add)).toBe(true);
                expect(Array.isArray(entry.remove)).toBe(true);
            });
        });
    });

    it("不應有多餘（非法）路徑的 class swap 定義", () => {
        const validKeys = new Set<string>();
        ALL_MODES.forEach((from) => {
            VALID_TRANSITIONS[from].forEach((to) => {
                validKeys.add(`${from}->${to}`);
            });
        });

        Object.keys(TRANSITION_CLASS_MAP).forEach((key) => {
            expect(validKeys.has(key)).toBe(true);
        });
    });

    it("welcome→artwork 應添加 mode-artwork 並移除 initial-welcome", () => {
        const swap = TRANSITION_CLASS_MAP["welcome->artwork"]!;
        expect(swap.add).toContain("mode-artwork");
        expect(swap.remove).toContain("initial-welcome");
    });

    it("artwork→zen 應移除 mode-artwork 但保留 immersion-mode", () => {
        const swap = TRANSITION_CLASS_MAP["artwork->zen"]!;
        expect(swap.remove).toContain("mode-artwork");
        expect(swap.remove).not.toContain("immersion-mode");
    });

    it("zen→artwork 應添加 mode-artwork", () => {
        const swap = TRANSITION_CLASS_MAP["zen->artwork"]!;
        expect(swap.add).toContain("mode-artwork");
    });

    it("welcome→calendar 應移除 initial-welcome 和 immersion-mode", () => {
        const swap = TRANSITION_CLASS_MAP["welcome->calendar"]!;
        expect(swap.remove).toContain("initial-welcome");
        expect(swap.remove).toContain("immersion-mode");
    });

    it("calendar→note 應添加 note-mode-active", () => {
        const swap = TRANSITION_CLASS_MAP["calendar->note"]!;
        expect(swap.add).toContain("note-mode-active");
    });

    it("note→calendar 應移除 note-mode-active", () => {
        const swap = TRANSITION_CLASS_MAP["note->calendar"]!;
        expect(swap.remove).toContain("note-mode-active");
    });
});
