/**
 * Hero Event Handlers
 * 負責 Hero 相關的事件監聽和處理
 * Responsible for Hero-related event listening and handling
 *
 * Update: 重構以委派給子處理器 (PWA, Touch) 和 UI 管理器。
 * Update: Refactored to delegate to sub-handlers and UIManager.
 */

import type { HeroIdleManager } from "./idleManager";
import type { HeroImageManager } from "./imageManager";
import type { HeroMusicPlayer } from "./musicPlayer";
import type { HeroSlideshowManager } from "./slideshowManager";

import { MediaHandler } from "./handlers/mediaHandler";
import { ModeHandler } from "./handlers/modeHandler";
// New Handlers
import { NavigationHandler } from "./handlers/navigationHandler";
import { PanelUIHandler } from "./handlers/panelUIHandler";
import { SlideshowSettingsHandler } from "./handlers/slideshowSettingsHandler";
import { HeroPWAHandler } from "./pwaHandler";
import { HeroTouchHandler } from "./touchHandler";
import { HeroUIManager } from "./uiManager";

export class HeroEventHandlers {
    private idleManager: HeroIdleManager;
    private imageManager: HeroImageManager;
    private mediaHandler: MediaHandler;
    private modeHandler: ModeHandler;
    private musicPlayer: HeroMusicPlayer;
    // Components
    private navigationHandler: NavigationHandler;
    private panelUIHandler: PanelUIHandler;
    private pwaHandler: HeroPWAHandler;

    private slideshowManager: HeroSlideshowManager;
    private slideshowSettingsHandler: SlideshowSettingsHandler;
    private touchHandler: HeroTouchHandler;
    private uiManager: HeroUIManager;

    constructor(
        imageManager: HeroImageManager,
        slideshowManager: HeroSlideshowManager,
        idleManager: HeroIdleManager,
        musicPlayer: HeroMusicPlayer,
    ) {
        this.imageManager = imageManager;
        this.slideshowManager = slideshowManager;
        this.idleManager = idleManager;
        this.musicPlayer = musicPlayer;

        this.uiManager = new HeroUIManager();

        // Initialize Core Handlers
        this.pwaHandler = new HeroPWAHandler(
            () => this.uiManager.showInstallButton(),
            () => this.uiManager.hideInstallButton(),
            (cb) => this.uiManager.bindInstallButton(cb),
        );

        // Initialize Sub-Handlers
        this.navigationHandler = new NavigationHandler(
            this.idleManager,
            this.imageManager,
            this.slideshowManager,
            this.uiManager,
        );

        this.modeHandler = new ModeHandler(
            this.idleManager,
            this.imageManager,
            this.slideshowManager,
            this.uiManager,
            this.musicPlayer,
        );

        this.mediaHandler = new MediaHandler(this.imageManager, this.musicPlayer, this.uiManager);

        this.panelUIHandler = new PanelUIHandler(this.uiManager, this.idleManager);
        this.slideshowSettingsHandler = new SlideshowSettingsHandler(
            this.slideshowManager,
            this.idleManager,
        );

        // Initialize Touch Handler LAST to ensure all dependencies are ready
        this.touchHandler = new HeroTouchHandler(
            () => {
                // T385: Only handle global swipe in Artwork/Zen modes
                if (
                    document.body.classList.contains("mode-artwork") ||
                    document.body.classList.contains("immersion-mode")
                ) {
                    console.log("[Hero] Swipe Left -> Next (Global)");
                    this.navigationHandler.handleNavigation(1);
                }
            },
            () => {
                if (
                    document.body.classList.contains("mode-artwork") ||
                    document.body.classList.contains("immersion-mode")
                ) {
                    console.log("[Hero] Swipe Right -> Prev (Global)");
                    this.navigationHandler.handleNavigation(-1);
                }
            },
            () => this.idleManager.resetInteraction(),
        );
    }

    public init(): void {
        this.uiManager.init();

        // Initialize music playlist (Delegate to MediaHandler implicitly if moved, but MusicPlayer is core)
        this.musicPlayer.loadCustomPlaylist();

        // Init Sub-Handlers
        this.navigationHandler.init();
        this.modeHandler.init();
        this.mediaHandler.init();
        this.panelUIHandler.init();
        this.slideshowSettingsHandler.init();
        this.panelUIHandler.setupInteractionButtons(); // Explicit setup if needed

        this.pwaHandler.init();
        this.touchHandler.init();
    }
}
