/**
 * Test: typedEvents utility
 * 驗證強型別事件工具函式
 */

import { describe, expect, it, vi } from "vitest";
import { dispatchTypedEvent, onTypedEvent } from "../src/scripts/core/typedEvents";

interface TestDetail {
    action: string;
    value: number;
}

describe("typedEvents", () => {
    it("onTypedEvent 應接收正確的 detail 型別", () => {
        const handler = vi.fn<(detail: TestDetail) => void>();

        onTypedEvent<TestDetail>("test-event", handler);
        dispatchTypedEvent<TestDetail>("test-event", { action: "click", value: 42 });

        expect(handler).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledWith({ action: "click", value: 42 });
    });

    it("dispatchTypedEvent 應觸發多個監聽器", () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        onTypedEvent<TestDetail>("multi-event", handler1);
        onTypedEvent<TestDetail>("multi-event", handler2);
        dispatchTypedEvent<TestDetail>("multi-event", { action: "test", value: 0 });

        expect(handler1).toHaveBeenCalledOnce();
        expect(handler2).toHaveBeenCalledOnce();
    });

    it("onTypedEvent 的 once 選項應只觸發一次", () => {
        const handler = vi.fn();

        onTypedEvent<TestDetail>("once-event", handler, { once: true });
        dispatchTypedEvent<TestDetail>("once-event", { action: "a", value: 1 });
        dispatchTypedEvent<TestDetail>("once-event", { action: "b", value: 2 });

        expect(handler).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledWith({ action: "a", value: 1 });
    });

    it("不同事件名稱不應互相觸發", () => {
        const handler = vi.fn();

        onTypedEvent<TestDetail>("event-A", handler);
        dispatchTypedEvent<TestDetail>("event-B", { action: "b", value: 0 });

        expect(handler).not.toHaveBeenCalled();
    });
});
