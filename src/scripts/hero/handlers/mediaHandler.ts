import type { HeroImageManager } from "../imageManager";
import type { HeroMusicPlayer } from "../musicPlayer";

import { HeroUIManager } from "../uiManager";
import { showToast } from "../../core/feedback";

export class MediaHandler {
    constructor(
        private imageManager: HeroImageManager,
        private musicPlayer: HeroMusicPlayer,
        private uiManager: HeroUIManager,
    ) { }

    public init(): void {
        this.bindGalleryControls();
        this.renderCustomStationsFromStorage().catch(console.error);
    }

    private bindGalleryControls(): void {
        this.uiManager.bindGalleryControls({
            onClear: async () => {
                const { galleryStorage } = await import("../galleryStorage");
                await galleryStorage.clearAll();

                const season = this.imageManager.getSeason(new Date());
                await this.imageManager.detectHeroImages(season);

                await this.musicPlayer.loadCustomPlaylist();
                await this.renderCustomStationsFromStorage();

                console.log("[Hero] All custom media cleared");
                showToast("已清空所有自選媒體");
            },
            onFileSelect: async (files: FileList) => {
                const { galleryStorage } = await import("../galleryStorage");
                const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
                if (imageFiles.length === 0) return;

                await galleryStorage.saveImages(imageFiles);
                const season = this.imageManager.getSeason(new Date());
                await this.imageManager.detectHeroImages(season);
                console.log(`[Hero] Gallery updated with ${imageFiles.length} images`);
            },
            onFitToggle: (isContain: boolean) => {
                this.uiManager.setBackgroundFit(isContain);
            },
            onModeChange: async (mode: "custom" | "default" | "hybrid") => {
                await this.imageManager.setGalleryMode(mode);
                console.log(`[Hero] Gallery mode switched to: ${mode}`);
            },
            onMusicUrlInput: async (name: string, url: string) => {
                const { galleryStorage } = await import("../galleryStorage");
                await galleryStorage.saveAudioLink(name, url);

                // Refresh Playlist & UI
                await this.musicPlayer.loadCustomPlaylist();
                await this.renderCustomStationsFromStorage();

                // Play the new station
                this.musicPlayer.playUrl(url);
                console.log("[Hero] Custom Radio added and playing");
            },
            onPlay: (url: string) => {
                this.musicPlayer.playUrl(url);
                console.log("[Hero] Radio selected and playing");
            },
            onStationDelete: async (id: string, name: string) => {
                const { galleryStorage } = await import("../galleryStorage");
                await galleryStorage.deleteAudio(id);

                // Refresh Playlist & UI
                await this.musicPlayer.loadCustomPlaylist();
                await this.renderCustomStationsFromStorage();
                console.log(`[Hero] Custom Radio '${name}' deleted`);
            },
        });
    }

    private async deleteCustomStation(id: string, name: string): Promise<void> {
        const { galleryStorage } = await import("../galleryStorage");
        await galleryStorage.deleteAudio(id);
        await this.musicPlayer.loadCustomPlaylist();
        await this.renderCustomStationsFromStorage();
        console.log(`[Hero] Custom Radio '${name}' deleted via list`);
    }

    private async renderCustomStationsFromStorage(): Promise<void> {
        const { galleryStorage } = await import("../galleryStorage");
        const allAudio = await galleryStorage.getAllAudio();
        // Filter only links for the radio menu
        const stationLinks = allAudio
            .filter((a) => a.type === "link" && a.url)
            .map((a) => ({ id: a.id, name: a.name, url: a.url! }));

        this.uiManager.renderCustomStations(
            stationLinks,
            (id: string, name: string) => {
                // Bridge to implementation
                this.deleteCustomStation(id, name);
                showToast(`已刪除電台「${name}」`);
            },
            (_name: string, url: string) => {
                // onSelect
                this.musicPlayer.playUrl(url);
            },
        );
    }
}
