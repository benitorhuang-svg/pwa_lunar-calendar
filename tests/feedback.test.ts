/**
 * Test: core/feedback.ts
 * 驗證觸覺回饋 & Toast 提示系統
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { hapticFeedback, showToast, initToastContainer } from "../src/scripts/core/feedback";

describe("hapticFeedback", () => {
    it("如果瀏覽器不支援 vibrate，應靜默處理", () => {
        // happy-dom 預設沒有 vibrate
        const original = navigator.vibrate;
        // @ts-expect-error - removing vibrate for test
        delete (navigator as any).vibrate;
        expect(() => hapticFeedback("light")).not.toThrow();
        if (original) (navigator as any).vibrate = original;
    });

    it("如果瀏覽器支援 vibrate，應以正確模式呼叫", () => {
        const vibrateMock = vi.fn();
        (navigator as any).vibrate = vibrateMock;

        hapticFeedback("light");
        expect(vibrateMock).toHaveBeenCalledWith([10]);

        hapticFeedback("medium");
        expect(vibrateMock).toHaveBeenCalledWith([20]);

        hapticFeedback("heavy");
        expect(vibrateMock).toHaveBeenCalledWith([40, 30, 40]);

        // Clean up
        delete (navigator as any).vibrate;
    });

    it("預設樣式應為 light", () => {
        const vibrateMock = vi.fn();
        (navigator as any).vibrate = vibrateMock;

        hapticFeedback();
        expect(vibrateMock).toHaveBeenCalledWith([10]);

        delete (navigator as any).vibrate;
    });
});

describe("showToast", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
        initToastContainer(container);
    });

    it("無容器時不應拋出錯誤", () => {
        initToastContainer(null);
        // Force toastContainer to null internally
        expect(() => showToast("test")).not.toThrow();
    });

    it("應建立 toast 元素並加入容器", () => {
        showToast("測試訊息");
        const toast = container.querySelector(".toast");
        expect(toast).not.toBeNull();
        expect(toast?.textContent).toContain("測試訊息");
    });

    it("error 類型應加上 toast-error class", () => {
        showToast("錯誤訊息", "error");
        const toast = container.querySelector(".toast-error");
        expect(toast).not.toBeNull();
    });

    it("info 類型應顯示 ✨ 圖示", () => {
        showToast("資訊", "info");
        const icon = container.querySelector(".toast-icon");
        expect(icon?.textContent).toBe("✨");
    });

    it("error 類型應顯示 ⚠️ 圖示", () => {
        showToast("錯誤", "error");
        const icon = container.querySelector(".toast-icon");
        expect(icon?.textContent).toBe("⚠️");
    });

    it("帶有動作按鈕時應建立 toast-action", () => {
        const callback = vi.fn();
        showToast("訊息", "info", { label: "撤銷", callback });
        const btn = container.querySelector(".toast-action") as HTMLButtonElement;
        expect(btn).not.toBeNull();
        expect(btn?.textContent).toBe("撤銷");
    });
});
