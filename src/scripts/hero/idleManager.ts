/**
 * Hero Idle Manager
 * 負責閒置計時器邏輯 (Responsible for idle timer logic)
 */

export class HeroIdleManager {
    public isNoteMode = false;
    public get isArtwork(): boolean {
        return this.isArtworkMode;
    }
    private IDLE_TIMEOUT: number;

    private idleTimer: any = null;

    private isArtworkMode = false;

    private lastToggleTime = 0;

    constructor(idleTimeout = 15000) {
        this.IDLE_TIMEOUT = idleTimeout;
    }

    public clear(): void {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    /**
     * 重置閒置計時器 (與全局閒置邏輯整合)
     * 負責在閒置達到時進入沉浸模式，並在交互後喚醒
     */
    public reset(): void {
        // 時隔保護：若剛剛才切換過模式（200ms內），忽略此次喚醒，防止點擊進入時瞬間閃退
        if (Date.now() - this.lastToggleTime < 200) return;

        // 清除現有計時器
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }

        // 1. 喚醒邏輯：已移除自動退出沉浸的邏輯，避免在映畫模式下互動(如切換圖片)導致跳出
        // 狀態切換應由 UI 事件(按鈕、背景點擊)明確觸發
        // The auto-exit logic is removed to prevent exiting immersion mode during interaction in Artwork Mode.
        // State transitions should be explicitly triggered by UI events.

        // 2. 設置沉浸超時邏輯
        this.idleTimer = setTimeout(() => {
            const isWelcome = document.body.classList.contains("initial-welcome");
            const isImmersion = document.body.classList.contains("immersion-mode");

            // 如果已經在「純」沈浸模式（無 UI），則不再重複觸發
            if (isImmersion && !isWelcome) return;

            // 如果正在筆記模式，不進入沉浸模式
            if (this.isNoteMode) return;

            console.log("[Global Idle] Idle reached: Triggering Immersion Mode Cleanup");

            if (isWelcome) {
                document.body.classList.remove("initial-welcome");
            }

            // 強制確保進入沈浸模式 (Dispatch event to hide ALL UI)
            this.lastToggleTime = Date.now();
            window.dispatchEvent(new CustomEvent("welcome-mode", { detail: { active: true } }));
        }, this.IDLE_TIMEOUT);
    }

    public setArtworkMode(value: boolean): void {
        this.isArtworkMode = value;
    }

    public setupListeners(): void {
        // 監聽觸碰、點擊、鍵盤 (全域 reset)
        // 根據使用者要求：只追蹤觸摸/點擊，不追蹤滑鼠移動 (No mousemove tracking)
        ["mousedown", "touchstart", "keypress"].forEach((evt) => {
            window.addEventListener(evt, () => this.reset(), { passive: true });
        });

        // 監聽 DOM 變化 (確保某些狀態切換時能即時啟動計時)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (
                    m.attributeName === "class" &&
                    document.body.classList.contains("initial-welcome")
                ) {
                    this.reset();
                }
            });
        });
        observer.observe(document.body, { attributes: true });

        // 初始化時啟動一次計時器
        this.reset();
    }
}
