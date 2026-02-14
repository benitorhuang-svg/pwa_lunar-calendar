/**
 * Hero Idle Manager
 * 負責閒置計時器邏輯 (Responsible for idle timer logic)
 */

export class HeroIdleManager {
    constructor(idleTimeout = 10000) {
        this.idleTimer = null;
        this.IDLE_TIMEOUT = idleTimeout;
        this.isArtworkMode = false;
    }

    setArtworkMode(value) {
        this.isArtworkMode = value;
    }

    reset() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }

        const isInitialWelcome = document.body.classList.contains("initial-welcome");
        const isImmersion = document.body.classList.contains("immersion-mode");

        // 路線 A：啟動歡迎頁面
        if (isInitialWelcome) {
            this.idleTimer = setTimeout(() => {
                if (document.body.classList.contains("initial-welcome")) {
                    console.log("[Route A] Idle reached: Hiding Welcome Card");
                    document.body.classList.remove("initial-welcome");
                    window.dispatchEvent(
                        new CustomEvent("welcome-mode", { detail: { active: true } })
                    );
                }
            }, this.IDLE_TIMEOUT);
        }
        // 路線 B：映畫模式
        else if (this.isArtworkMode && !isImmersion) {
            this.idleTimer = setTimeout(() => {
                console.log("[Route B] Idle reached: Hiding Artwork UI");
                window.dispatchEvent(
                    new CustomEvent("welcome-mode", { detail: { active: true } })
                );
            }, this.IDLE_TIMEOUT);
        }
    }

    clear() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    setupListeners() {
        // 監聽 DOM 變化
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

        // 監聽觸碰與點擊
        ["mousedown", "touchstart"].forEach((evt) => {
            window.addEventListener(evt, () => this.reset(), { passive: true });
        });

        // 滑鼠移動
        window.addEventListener(
            "mousemove",
            () => {
                if (document.body.classList.contains("initial-welcome")) return;
                this.reset();
            },
            { passive: true }
        );
    }
}
