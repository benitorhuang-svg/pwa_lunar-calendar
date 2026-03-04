/**
 * Common Panel Atoms — Shared utility functions
 * 共用原子函式：面板間共享的基礎操作
 */

/**
 * Hide the Today card (panelToday) to prevent z-index conflicts
 * when other panels (FAQ, Gallery Submenu) open on top.
 * 隱藏今日卡片，避免 z-index 衝突
 */
export function hideTodayCard(): void {
    const panelToday = document.getElementById("panelToday");
    if (panelToday) {
        panelToday.style.opacity = "0";
        panelToday.style.pointerEvents = "none";
    }
}

/**
 * Restore the Today card visibility.
 * 恢復今日卡片可見性
 */
export function restoreTodayCard(): void {
    const panelToday = document.getElementById("panelToday");
    if (panelToday) {
        panelToday.style.opacity = "";
        panelToday.style.pointerEvents = "";
    }
}
