/**
 * Selection Events — Orchestrator sub-module
 * 選擇事件處理：年份、月份、日期選擇
 */

import type {
    ClosePanelsDetail,
    DateSelectedDetail,
    RenderHeroDetail,
    RenderPanelsDetail,
    ToggleGridViewDetail,
} from "../../types";
import type { AppStateManager } from "../stateManager";
import { onTypedEvent } from "../../core/typedEvents";

import { Lunar } from "../../core/lunar";

export function setupSelectionEvents(
    state: AppStateManager,
    updateState: () => void
): void {
    // 年份選擇 (Year Selected)
    onTypedEvent<number>("year-selected", (detail) => {
        state.setYear(detail);
        updateState();
        window.dispatchEvent(
            new CustomEvent<RenderPanelsDetail>("render-panels", {
                detail: {
                    type: "yearMonth",
                    ...state.getState(),
                },
            }),
        );
    });

    // 月份選擇 (Month Selected)
    onTypedEvent<number>("month-selected", (detail) => {
        state.setMonth(detail);

        const s = state.getState();
        // Date Safety
        const daysInMonth = new Date(s.selectedYear, s.selectedMonth + 1, 0).getDate();
        if (s.selectedDay > daysInMonth) {
            state.setDay(daysInMonth);
        }

        updateState();

        window.dispatchEvent(
            new CustomEvent<ClosePanelsDetail>("close-panels", { detail: { showGrid: true } }),
        );
    });

    // 日期選擇 (Date Selected)
    onTypedEvent<DateSelectedDetail>("date-selected", (detail) => {
        const { day, month, year } = detail;
        const currentState = state.getState();

        if (month !== currentState.selectedMonth || year !== currentState.selectedYear) {
            state.setYear(year);
            state.setMonth(month);
            updateState();
        }

        state.setDay(day);

        const updatedState = state.getState();
        const date = new Date(
            updatedState.selectedYear,
            updatedState.selectedMonth,
            updatedState.selectedDay,
        );
        const lunar = Lunar.fromDate(date);
        window.dispatchEvent(
            new CustomEvent<RenderHeroDetail>("render-hero", {
                detail: { changeBg: false, date, lunar },
            }),
        );

        state.setActivePanel("today");
        window.dispatchEvent(
            new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", {
                detail: { show: false },
            }),
        );
        window.dispatchEvent(
            new CustomEvent<RenderPanelsDetail>("render-panels", {
                detail: {
                    type: "today",
                    ...state.getState(),
                },
            }),
        );
    });
}
