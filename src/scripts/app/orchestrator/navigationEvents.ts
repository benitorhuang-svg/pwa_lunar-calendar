/**
 * Navigation Events — Orchestrator sub-module
 * 導航事件處理：月份、日期、回到今天
 */

import type {
    NavigateMonthDetail,
    RenderPanelsDetail,
    ToggleGridViewDetail,
} from "../../types";
import type { AppStateManager } from "../stateManager";
import { onTypedEvent } from "../../core/typedEvents";

export function setupNavigationEvents(
    state: AppStateManager,
    updateState: () => void
): void {
    // 導航月份 (Navigate Month, payload is number)
    onTypedEvent<NavigateMonthDetail>("navigate-month", (detail) => {
        const dir = detail;
        state.navigateMonth(dir);
        updateState();
    });

    // 回到今天 (Go to Today)
    onTypedEvent<any>("go-to-today", () => {
        state.goToToday();
        updateState();

        state.setActivePanel("today");
        window.dispatchEvent(
            new CustomEvent<RenderPanelsDetail>("render-panels", {
                detail: {
                    type: "today",
                    ...state.getState(),
                },
            }),
        );
        window.dispatchEvent(
            new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                detail: { show: false },
            }),
        );
    });

    // 導航日期 (Navigate Day, payload is number)
    onTypedEvent<number>("navigate-day", (detail) => {
        const dir = detail;
        state.navigateDay(dir);
        updateState();
    });
}
