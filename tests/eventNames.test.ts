/**
 * Test: core/eventNames.ts
 * 驗證事件名稱常數的完整性與唯一性
 */

import { describe, expect, it } from "vitest";
import { APP_EVENTS } from "../src/scripts/core/eventNames";

describe("APP_EVENTS", () => {
    it("所有值應為非空字串", () => {
        for (const [key, value] of Object.entries(APP_EVENTS)) {
            expect(value, `${key} 不應為空`).toBeTruthy();
            expect(typeof value, `${key} 應為字串`).toBe("string");
        }
    });

    it("所有值應為 kebab-case 格式", () => {
        const kebabRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
        for (const [key, value] of Object.entries(APP_EVENTS)) {
            expect(value, `${key}="${value}" 不符合 kebab-case`).toMatch(kebabRegex);
        }
    });

    it("所有值應唯一（無重複事件名稱）", () => {
        const values = Object.values(APP_EVENTS);
        const unique = new Set(values);
        expect(unique.size).toBe(values.length);
    });

    it("應包含關鍵生命週期事件", () => {
        expect(APP_EVENTS.APP_LOGIC_READY).toBe("app-logic-ready");
        expect(APP_EVENTS.LOADER_FINISHED).toBe("loader-finished");
        expect(APP_EVENTS.TRANSITION_MODE).toBe("transition-mode");
    });

    it("應包含所有面板事件", () => {
        expect(APP_EVENTS.CLOSE_PANELS).toBeDefined();
        expect(APP_EVENTS.HIDE_PANELS).toBeDefined();
        expect(APP_EVENTS.OPEN_NOTEPAD).toBeDefined();
        expect(APP_EVENTS.CLOSE_NOTEPAD).toBeDefined();
    });

    it("應包含所有渲染事件", () => {
        expect(APP_EVENTS.RENDER_CALENDAR).toBeDefined();
        expect(APP_EVENTS.RENDER_HERO).toBeDefined();
        expect(APP_EVENTS.RENDER_PANELS).toBeDefined();
    });

    it("事件數量應至少有 20 個", () => {
        expect(Object.keys(APP_EVENTS).length).toBeGreaterThanOrEqual(20);
    });
});
