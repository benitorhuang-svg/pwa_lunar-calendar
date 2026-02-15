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

import { HeroPWAHandler } from "./pwaHandler";
import { HeroTouchHandler } from "./touchHandler";
import { HeroUIManager } from "./uiManager";

// New Handlers
import { NavigationHandler } from "./handlers/navigationHandler";
import { ModeHandler } from "./handlers/modeHandler";
import { MediaHandler } from "./handlers/mediaHandler";
import { PanelUIHandler } from "./handlers/panelUIHandler";

export class HeroEventHandlers {
    private idleManager: HeroIdleManager;
    private imageManager: HeroImageManager;
    private musicPlayer: HeroMusicPlayer;
    private pwaHandler: HeroPWAHandler;
    private slideshowManager: HeroSlideshowManager;
    private touchHandler: HeroTouchHandler;
    private uiManager: HeroUIManager;

    // Components
    private navigationHandler: NavigationHandler;
    private modeHandler: ModeHandler;
    private mediaHandler: MediaHandler;
    private panelUIHandler: PanelUIHandler;

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

        this.touchHandler = new HeroTouchHandler(
            () => this.navigationHandler.handleNavigation(1), // Updated to use NavigationHandler
            () => this.navigationHandler.handleNavigation(-1),
            () => this.idleManager.reset(),
        );

        // Initialize Sub-Handlers
        this.navigationHandler = new NavigationHandler(
            this.idleManager,
            this.imageManager,
            this.slideshowManager,
            this.uiManager
        );

        this.modeHandler = new ModeHandler(
            this.idleManager,
            this.imageManager,
            this.slideshowManager,
            this.uiManager
        );

        this.mediaHandler = new MediaHandler(
            this.imageManager,
            this.musicPlayer,
            this.uiManager
        );

        this.panelUIHandler = new PanelUIHandler(
            this.uiManager,
            this.idleManager
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
        this.panelUIHandler.setupInteractionButtons(); // Explicit setup if needed

        this.pwaHandler.init();
        this.touchHandler.init();
    }
}
