/**
 * Panel Events — Orchestrator sub-module
 * 面板事件處理：toggle-panel, close-panels, toggle-grid
 */

import type {
    ClosePanelsDetail,
    RenderPanelsDetail,
    ToggleGridViewDetail,
} from "../../types";
import type { AppStateManager } from "../stateManager";
import { onTypedEvent } from "../../core/typedEvents";

export function setupPanelEvents(
    state: AppStateManager,
    checkAutoSlideshow: () => void
): void {
    // 切換面板 (Toggle Panel)
    onTypedEvent<string | { force?: "close" | "open"; type: string }>("toggle-panel", (detail) => {
        const type = (typeof detail === "string" ? detail : detail.type) as
            | "today"
            | "yearMonth";
        const force = typeof detail === "object" ? detail.force : undefined;

        const currentActive = state.getState().activePanel;
        const isSamePanel = currentActive === type;

        state.setActivePanel(null);
        window.dispatchEvent(new CustomEvent("hide-panels"));

        let shouldOpen = !isSamePanel;
        if (force === "open") shouldOpen = true;
        if (force === "close") shouldOpen = false;

        if (!shouldOpen) {
            // Close / Show Grid
            window.dispatchEvent(
                new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                    detail: { show: true },
                }),
            );
        } else {
            // Open Panel
            state.setActivePanel(type);
            window.dispatchEvent(
                new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                    detail: { show: false },
                }),
            );
            window.dispatchEvent(
                new CustomEvent<RenderPanelsDetail>("render-panels", {
                    detail: {
                        type,
                        ...state.getState(),
                    },
                }),
            );
        }
        checkAutoSlideshow();
    });

    // 關閉面板 (Close Panels)
    onTypedEvent<ClosePanelsDetail>("close-panels", (detail) => {
        const { showGrid } = detail || {};
        state.setActivePanel(null);
        window.dispatchEvent(new CustomEvent("hide-panels"));
        if (showGrid !== undefined) {
            window.dispatchEvent(
                new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                    detail: { show: showGrid },
                }),
            );
        }
        checkAutoSlideshow();
    });

    // T212: 切換網格 (Toggle Grid) - Now purely for UI visibility, no mode switching
    window.addEventListener("toggle-grid", () => {
        const calendarSection = document.getElementById("calendarSection");
        const isShowing = calendarSection?.classList.contains("show-grid") ?? false;

        state.setActivePanel(null);
        window.dispatchEvent(new CustomEvent("hide-panels"));

        window.dispatchEvent(
            new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                detail: { show: !isShowing },
            }),
        );
        checkAutoSlideshow();
    });
}
