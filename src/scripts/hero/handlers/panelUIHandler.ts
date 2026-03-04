import type { HeroIdleManager } from "../idleManager";
import type { RenderPanelsDetail, ToggleGridViewDetail } from "../types";
import type { HeroUIManager } from "../uiManager";
import { uiToggleManager } from "../../app/uiToggleManager";
import { onTypedEvent } from "../../core/typedEvents";

export class PanelUIHandler {
    constructor(
        private uiManager: HeroUIManager,
        private idleManager: HeroIdleManager,
    ) { }

    public init(): void {
        this.bindEvents();
    }

    public setupInteractionButtons(): void {
        // 切換網格按鈕 (Toggle Grid Button / Day Button)
        this.uiManager.bindToggleGrid(() => {
            this.idleManager.resetInteraction();

            const isArtwork = document.body.classList.contains("mode-artwork");

            // Default mode is Artwork (映畫模式)
            // Welcome: click -> go to Artwork (default)
            // Artwork: click -> go to Calendar
            // Calendar: click -> go to Artwork
            if (isArtwork) {
                // Artwork -> Calendar (Monthly Grid)
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "calendar" } }),
                );
            } else {
                // Welcome or Calendar -> Artwork (Photos)
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
                );
            }
        });

        // 綁定筆記按鈕 (Bind Note Button)
        const btnNote = document.getElementById("btnNote");
        const notePadOverlay = document.getElementById("notePadOverlay");
        const panelToday = document.getElementById("panelToday");

        if (btnNote) {
            // Register Notepad with UIToggleManager
            uiToggleManager.register({
                close: () => {
                    window.dispatchEvent(new CustomEvent("close-notepad"));
                    btnNote.classList.remove("active");
                    if (panelToday) {
                        panelToday.style.opacity = "";
                        panelToday.style.pointerEvents = "";
                    }
                },
                id: "notepad",
                open: () => {
                    // Ensure we leave calendar mode (hide grid) when opening a panel
                    window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));

                    if (panelToday) {
                        panelToday.style.opacity = "0";
                        panelToday.style.pointerEvents = "none";
                    }
                    window.dispatchEvent(new CustomEvent("open-notepad"));
                    btnNote.classList.add("active");
                },
            });

            btnNote.addEventListener("click", () => {
                this.idleManager.resetInteraction();
                const isActive = notePadOverlay?.classList.contains("active") ?? false;
                uiToggleManager.toggle("notepad", isActive);
            });
        }
    }

    private bindEvents(): void {
        // 切換網格視圖 (Toggle Grid View)
        onTypedEvent<ToggleGridViewDetail>("toggle-grid-view", (detail) => {
            this.uiManager.toggleGridView(detail.show);
        });

        // 渲染面板 (Render Panels)
        onTypedEvent<RenderPanelsDetail>("render-panels", (detail) => {
            this.uiManager.updatePanelsForType(detail.type);
        });

        // 隱藏面板 (Hide Panels)
        window.addEventListener("hide-panels", () => {
            this.uiManager.hidePanelActiveStates();
        });


    }
}
