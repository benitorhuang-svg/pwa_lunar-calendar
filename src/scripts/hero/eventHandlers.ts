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
import type {
    ClosePanelsDetail,
    NavigateMonthDetail,
    RenderHeroDetail,
    RenderPanelsDetail,
    SlideshowControlDetail,
    ToggleGridViewDetail,
    TogglePanelDetail,
    WelcomeModeDetail,
} from "./types";

import { HeroPWAHandler } from "./pwaHandler";
import { HeroTouchHandler } from "./touchHandler";
import { HeroUIManager } from "./uiManager";

export class HeroEventHandlers {
    private idleManager: HeroIdleManager;
    private imageManager: HeroImageManager;
    private musicPlayer: HeroMusicPlayer;
    private pwaHandler: HeroPWAHandler;

    private slideshowManager: HeroSlideshowManager;
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

        // 初始化子處理器 (Initialize Sub-handlers)
        this.pwaHandler = new HeroPWAHandler(
            () => this.uiManager.showInstallButton(),
            () => this.uiManager.hideInstallButton(),
            (cb) => this.uiManager.bindInstallButton(cb),
        );

        this.touchHandler = new HeroTouchHandler(
            () => this.handleNavigation(1), // 向左滑動 -> 下一頁 (Swipe Left -> Next)
            () => this.handleNavigation(-1), // 向右滑動 -> 上一頁 (Swipe Right -> Prev)
            () => this.idleManager.reset(),
        );
    }

    public init(): void {
        this.uiManager.init();

        // 初始化音樂清單 (Initialize music playlist)
        this.musicPlayer.loadCustomPlaylist();

        this.setupGlobalEventListeners();
        this.setupUIInteractions();

        this.pwaHandler.init();
        this.touchHandler.init();
    }

    private handleNavigation(direction: number): void {
        this.idleManager.reset();

        // 映畫模式下切換圖片 (Switch images in Artwork Mode)
        if (this.idleManager.isArtwork) {
            this.imageManager.switchHero(direction, false, () =>
                this.slideshowManager.reset(
                    (o, a) => this.imageManager.switchHero(o, a),
                    Math.max(
                        this.imageManager.specialHeroList.length,
                        this.imageManager.heroList.length,
                    ),
                ),
            );
        } else {
            // 日曆模式下切換月份 (Switch months in Calendar Mode)
            window.dispatchEvent(
                new CustomEvent<NavigateMonthDetail>("navigate-month", { detail: direction }),
            );
        }
    }

    private setupGlobalEventListeners(): void {
        // 渲染 Hero (Render Hero)
        window.addEventListener("render-hero", ((e: CustomEvent<RenderHeroDetail>) => {
            const { changeBg, date, lunar, transitionOverride } = e.detail;
            this.imageManager.updateHeroLogic(
                changeBg !== undefined ? changeBg : false,
                transitionOverride || null,
                typeof date === "string" ? new Date(date) : date,
                lunar,
            );
        }) as EventListener);

        // 幻燈片控制 (Slideshow Control)
        window.addEventListener("slideshow-control", ((e: CustomEvent<SlideshowControlDetail>) => {
            const { action, isArtwork } = e.detail;

            if (action === "start") {
                this.idleManager.setArtworkMode(isArtwork !== false);

                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length,
                );

                this.slideshowManager.start(
                    (offset, isAuto) =>
                        this.imageManager.switchHero(offset, isAuto, () =>
                            this.slideshowManager.reset(
                                (o, a) => this.imageManager.switchHero(o, a),
                                minImages,
                            ),
                        ),
                    minImages,
                );

                if (isArtwork !== false) {
                    this.uiManager.updateArtworkModeUI(true);
                    this.idleManager.reset();
                }
            } else if (action === "stop") {
                this.idleManager.setArtworkMode(false);
                this.slideshowManager.stop();
                this.uiManager.updateArtworkModeUI(false);
            }
        }) as EventListener);

        // 歡迎模式/沉浸模式 (Welcome/Immersion Mode)
        window.addEventListener("welcome-mode", ((e: CustomEvent<WelcomeModeDetail>) => {
            const { active } = e.detail;
            if (active) {
                document.body.classList.add("immersion-mode");
                this.idleManager.clear();

                // 進入沉浸模式時強制啟動幻燈片 (Force start slideshow in immersion mode)
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: false },
                    }),
                );

                if (document.body.classList.contains("initial-welcome")) {
                    this.idleManager.reset();
                }
            } else {
                document.body.classList.remove("immersion-mode");
                document.body.classList.remove("initial-welcome");

                // 停止幻燈片播放 (Stop slideshow)
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "stop" },
                    }),
                );

                // 喚醒時回到日曆網格封面 (Return to calendar grid on wake up)
                window.dispatchEvent(
                    new CustomEvent<ClosePanelsDetail>("close-panels", {
                        detail: { showGrid: true },
                    }),
                );
            }
        }) as EventListener);

        // 切換網格視圖 (Toggle Grid View)
        window.addEventListener("toggle-grid-view", ((e: CustomEvent<ToggleGridViewDetail>) => {
            this.uiManager.toggleGridView(e.detail.show);
        }) as EventListener);

        // 渲染面板 (Render Panels)
        window.addEventListener("render-panels", ((e: CustomEvent<RenderPanelsDetail>) => {
            this.uiManager.updatePanelsForType(e.detail.type);
        }) as EventListener);

        // 隱藏面板 (Hide Panels)
        window.addEventListener("hide-panels", () => {
            this.uiManager.hidePanelActiveStates();
        });
    }

    private setupUIInteractions(): void {
        // 導航按鈕 (Navigation Buttons)
        this.uiManager.bindNavigation(
            () => this.handleNavigation(-1),
            () => this.handleNavigation(1),
        );

        // 切換網格按鈕 (Toggle Grid Button)
        this.uiManager.bindToggleGrid(() => {
            this.idleManager.reset();
            window.dispatchEvent(new CustomEvent("toggle-grid"));
        });

        // 切換年月面板按鈕 (Toggle Year/Month Button)
        this.uiManager.bindToggleYearMonth(() => {
            this.idleManager.reset();
            window.dispatchEvent(
                new CustomEvent<TogglePanelDetail>("toggle-panel", { detail: "yearMonth" }),
            );
        });

        // 更換圖片/映畫按鈕 (Change Image / Artwork Button)
        this.uiManager.bindChangeImage(
            () => this.idleManager.reset(),
            () => this.idleManager.isArtwork,
        );

        // 歡迎畫面遮罩點擊 (Welcome Overlay)
        this.uiManager.bindWelcomeOverlay(() => {
            this.idleManager.reset();

            window.dispatchEvent(
                new CustomEvent<WelcomeModeDetail>("welcome-mode", { detail: { active: false } }),
            );

            document.body.classList.remove("initial-welcome");
            window.dispatchEvent(
                new CustomEvent<ClosePanelsDetail>("close-panels", { detail: { showGrid: true } }),
            );
        });

        // 藝廊與媒體管理 (Gallery & Media Management)
        // 藝廊與媒體管理 (Gallery & Media Management)
        this.uiManager.bindGalleryControls({
            onFileSelect: async (files: FileList) => {
                const { galleryStorage } = await import("./galleryStorage");
                const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
                if (imageFiles.length === 0) return;

                await galleryStorage.saveImages(imageFiles);
                const season = this.imageManager.getSeason(new Date());
                await this.imageManager.detectHeroImages(season);
                console.log(`[Hero] Gallery updated with ${imageFiles.length} images`);
            },
            onModeChange: async (mode) => {
                await this.imageManager.setGalleryMode(mode);
                console.log(`[Hero] Gallery mode switched to: ${mode}`);
            },
            onFitToggle: (isContain) => {
                this.uiManager.setBackgroundFit(isContain);
            },
            onMusicUrlInput: async (name, url) => {
                const { galleryStorage } = await import("./galleryStorage");
                await galleryStorage.saveAudioLink(name, url);

                // Refresh Playlist & UI
                await this.musicPlayer.loadCustomPlaylist();
                await this.renderCustomStationsFromStorage();

                // Play the new station
                this.musicPlayer.playUrl(url);
                console.log("[Hero] Custom Radio added and playing");
            },
            onClear: async () => {
                const { galleryStorage } = await import("./galleryStorage");
                await galleryStorage.clearAll();

                const season = this.imageManager.getSeason(new Date());
                await this.imageManager.detectHeroImages(season);

                await this.musicPlayer.loadCustomPlaylist();
                await this.renderCustomStationsFromStorage();

                console.log("[Hero] All custom media cleared");
            },
            onStationDelete: async (id, name) => {
                const { galleryStorage } = await import("./galleryStorage");
                await galleryStorage.deleteAudio(id);

                // Refresh Playlist & UI
                await this.musicPlayer.loadCustomPlaylist();
                await this.renderCustomStationsFromStorage();
                console.log(`[Hero] Custom Radio '${name}' deleted`);
            },
            onPlay: (url) => {
                this.musicPlayer.playUrl(url);
                console.log("[Hero] Radio selected and playing");
            }
        });

        // Background Click
        this.uiManager.bindBackgroundClick(() => this.idleManager.isArtwork);

        // Initial Render of Custom Stations
        this.renderCustomStationsFromStorage().catch(console.error);
    }

    private async renderCustomStationsFromStorage(): Promise<void> {
        const { galleryStorage } = await import("./galleryStorage");
        const allAudio = await galleryStorage.getAllAudio();
        // Filter only links for the radio menu
        const stationLinks = allAudio
            .filter(a => a.type === "link" && a.url)
            .map(a => ({ id: a.id, name: a.name, url: a.url! }));

        this.uiManager.renderCustomStations(
            stationLinks,
            (id, name) => {
                // This callback is actually handled by bindGalleryControls' onStationDelete
                // Wait, uiManager calls this directly. We need to bridge it.
                // But bindGalleryControls already sets up the onDelete callback passed to renderCustomStations?
                // No, bindGalleryControls implementation in uiManager calls specific callbacks.
                // uiManager.renderCustomStations takes an onDelete callback argument.
                // We are calling renderCustomStations here, so we must provide the implementation.

                // Re-using the logic:
                this.deleteCustomStation(id, name);
            },
            (name, url) => {
                // onSelect
                this.musicPlayer.playUrl(url);
            }
        );
    }

    private async deleteCustomStation(id: string, name: string): Promise<void> {
        const { galleryStorage } = await import("./galleryStorage");
        await galleryStorage.deleteAudio(id);
        await this.musicPlayer.loadCustomPlaylist();
        await this.renderCustomStationsFromStorage();
        console.log(`[Hero] Custom Radio '${name}' deleted via list`);
    }
}
