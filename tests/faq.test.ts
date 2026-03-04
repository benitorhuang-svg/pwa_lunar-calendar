/**
 * Test: FAQ Data & Atoms
 * 驗證 FAQ 資料完整性與 DOM 建構器
 */

import { describe, expect, it } from "vitest";
import { FAQ_DATA } from "../src/data/faqData";
import { collapseAllItems, createFAQItem, expandAllItems } from "../src/scripts/panels/faq/atoms";

describe("FAQ Data", () => {
    it("應有正確數量的問答項目", () => {
        expect(FAQ_DATA.length).toBeGreaterThanOrEqual(5);
    });

    it("每個項目須有 q 和 a 欄位", () => {
        FAQ_DATA.forEach((entry, i) => {
            expect(entry.q, `FAQ[${i}].q 不應為空`).toBeTruthy();
            expect(entry.a, `FAQ[${i}].a 不應為空`).toBeTruthy();
        });
    });

    it("問題不應重複", () => {
        const questions = FAQ_DATA.map((e) => e.q);
        const unique = new Set(questions);
        expect(unique.size).toBe(questions.length);
    });
});

describe("FAQ Atoms", () => {
    describe("createFAQItem", () => {
        it("應建立正確的 DOM 結構", () => {
            const item = createFAQItem(1, "問題？", "答案。");
            expect(item.className).toBe("faq-item");
            expect(item.querySelector(".faq-question")).toBeTruthy();
            expect(item.querySelector(".faq-answer")).toBeTruthy();
        });

        it("按鈕應設定正確的 aria 屬性", () => {
            const item = createFAQItem(1, "Q1", "A1");
            const btn = item.querySelector(".faq-question") as HTMLElement;
            expect(btn.id).toBe("faq-q-1");
            expect(btn.getAttribute("aria-controls")).toBe("faq-a-1");
            expect(btn.getAttribute("aria-expanded")).toBe("false");
        });

        it("答案面板應預設隱藏", () => {
            const item = createFAQItem(1, "Q1", "A1");
            const panel = item.querySelector(".faq-answer") as HTMLElement;
            expect(panel.hidden).toBe(true);
        });

        it("點擊按鈕應切換展開狀態", () => {
            const item = createFAQItem(1, "Q1", "A1");
            const btn = item.querySelector(".faq-question") as HTMLButtonElement;
            const panel = item.querySelector(".faq-answer") as HTMLElement;

            btn.click(); // expand
            expect(btn.getAttribute("aria-expanded")).toBe("true");
            expect(item.classList.contains("active")).toBe(true);
            expect(panel.hidden).toBe(false);

            btn.click(); // collapse
            expect(btn.getAttribute("aria-expanded")).toBe("false");
            expect(item.classList.contains("active")).toBe(false);
            expect(panel.hidden).toBe(true);
        });
    });

    describe("expandAllItems / collapseAllItems", () => {
        it("expandAllItems 應展開所有項目", () => {
            const container = document.createElement("div");
            container.appendChild(createFAQItem(1, "Q1", "A1"));
            container.appendChild(createFAQItem(2, "Q2", "A2"));

            expandAllItems(container);

            container.querySelectorAll(".faq-item").forEach((item) => {
                expect(item.classList.contains("active")).toBe(true);
                const panel = item.querySelector(".faq-answer") as HTMLElement;
                expect(panel.hidden).toBe(false);
            });
        });

        it("collapseAllItems 應收合所有項目", () => {
            const container = document.createElement("div");
            container.appendChild(createFAQItem(1, "Q1", "A1"));
            container.appendChild(createFAQItem(2, "Q2", "A2"));

            expandAllItems(container);
            collapseAllItems(container);

            container.querySelectorAll(".faq-item").forEach((item) => {
                expect(item.classList.contains("active")).toBe(false);
                const panel = item.querySelector(".faq-answer") as HTMLElement;
                expect(panel.hidden).toBe(true);
            });
        });
    });
});
