/**
 * Hero Idle Manager
 * 負責閒置計時器邏輯 (Responsible for idle timer logic)
 */

export class HeroIdleManager {
    public get isArtwork(): boolean {
        return this.isArtworkMode;
    }
    private IDLE_TIMEOUT: number;
    private idleTimer: any = null;

    private isArtworkMode = false;

    constructor(idleTimeout = 6000) {
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
        // 清除現有計時器
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }

        const isInitialWelcome = document.body.classList.contains("initial-welcome");
        const isImmersion = document.body.classList.contains("immersion-mode");

        // 1. 喚醒邏輯：如果當前處於沉浸模式（且非初始歡迎），交互後應退出沉浸
        if (isImmersion && !isInitialWelcome) {
            console.log("[Global Idle] Wake up: Exiting Immersion Mode");
            window.dispatchEvent(new CustomEvent("welcome-mode", { detail: { active: false } }));
        }

        // 2. 設置沉浸超時邏輯
        this.idleTimer = setTimeout(() => {
            const isWelcome = document.body.classList.contains("initial-welcome");
            const isImmersion = document.body.classList.contains("immersion-mode");

            // 如果已經在「純」沈浸模式（無 UI），則不再重複觸發
            if (isImmersion && !isWelcome) return;

            console.log("[Global Idle] Idle reached: Triggering Immersion Mode Cleanup");

            if (isWelcome) {
                document.body.classList.remove("initial-welcome");
            }

            // 強制確保進入沈浸模式 (Dispatch event to hide ALL UI)
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
