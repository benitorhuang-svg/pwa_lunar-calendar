/**
 * Hero Music Player
 * 負責音樂播放器邏輯 (Responsible for music player logic)
 */

export class HeroMusicPlayer {
    private bgMusic: HTMLAudioElement | null = null;
    private btnMusic: HTMLElement | null = null;
    private combinedPlaylist: string[] = [];
    private customPlaylist: string[] = [];
    private trackIdx: number;
    private wasPlayingBeforeHidden: boolean = false;
    private zenPlaylist: string[];

    constructor(baseDir: string) {
        this.zenPlaylist = [
            (baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/"),
            (baseDir + "assets/audio/danyvin.mp3").replace(/\/+/g, "/"),
            (baseDir + "assets/audio/danyvin-journey.mp3").replace(/\/+/g, "/"),
        ];
        this.combinedPlaylist = [...this.zenPlaylist];
        this.trackIdx = Math.floor(Math.random() * this.combinedPlaylist.length);
    }

    public init(): void {
        this.btnMusic = document.getElementById("btnMusic");
        this.bgMusic = document.getElementById("bgMusic") as HTMLAudioElement | null;

        if (!this.btnMusic || !this.bgMusic) return;

        // 音樂守護：當加載失敗或播放結束，自動接下一首
        this.bgMusic.onerror = () => {
            console.error(`[ZenMusic] Source failed: ${this.bgMusic?.src}`);
            this.playNext();
        };

        this.bgMusic.onended = () => {
            this.playNext();
        };

        this.btnMusic.onclick = () => {
            if (!this.bgMusic) return;
            if (this.bgMusic.paused) {
                this.play();
            } else {
                this.pause();
            }
        };

        // 安全防護：當瀏覽器切換到背景或手機跳出 app 時，自動暫停播放
        // Security: Auto-pause playback when tab is hidden or user leaves the app
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                if (this.bgMusic && !this.bgMusic.paused) {
                    this.wasPlayingBeforeHidden = true;
                    this.bgMusic.pause();
                    if (this.btnMusic) this.btnMusic.classList.remove("playing");
                    console.log("[ZenMusic] Auto-paused due to visibility hidden");
                }
            } else if (document.visibilityState === "visible") {
                // 如果之前是被自動暫停的，切換回來時恢復播放
                if (this.wasPlayingBeforeHidden && this.bgMusic) {
                    this.wasPlayingBeforeHidden = false;
                    this.play();
                }
            }
        });

        // Load custom music on init
        this.loadCustomPlaylist();
    }

    public async loadCustomPlaylist(): Promise<number> {
        const { galleryStorage } = await import("./galleryStorage");
        const customRows = await galleryStorage.getAllAudio();

        // Clean up old object URLs if any (optional but good practice)
        this.customPlaylist = customRows
            .map((row) => {
                if (row.type === "link" && row.url) return row.url;
                if (row.type === "file" && row.blob) return URL.createObjectURL(row.blob);
                return "";
            })
            .filter((url) => url !== "");

        this.combinedPlaylist = [...this.zenPlaylist, ...this.customPlaylist];
        console.log(`[ZenMusic] Playlist updated. Total tracks: ${this.combinedPlaylist.length}`);
        return this.customPlaylist.length;
    }

    /**
     * 暫停音樂 (Pause Music)
     */
    public pause(): void {
        if (!this.bgMusic) return;
        this.bgMusic.pause();
        if (this.btnMusic) this.btnMusic.classList.remove("playing");
    }

    /**
     * 播放音樂 (Play Music)
     */
    public play(): void {
        if (!this.bgMusic) return;

        // 初始化第一首
        if (!this.bgMusic.src || this.bgMusic.src === "" || this.bgMusic.ended) {
            this.bgMusic.src = this.combinedPlaylist[this.trackIdx] || "";
        }

        if (this.btnMusic) this.btnMusic.classList.add("loading"); // Indicate loading start

        this.bgMusic
            .play()
            .then(() => {
                console.log(
                    "[ZenMusic] Flowing:",
                    this.combinedPlaylist[this.trackIdx] || "unknown",
                );
                if (this.btnMusic) {
                    this.btnMusic.classList.remove("loading");
                    this.btnMusic.classList.add("playing");
                }
            })
            .catch((e) => {
                console.log("[ZenMusic] Playback blocked or failed:", e.message);
                if (this.btnMusic) this.btnMusic.classList.remove("loading");
            });
    }

    public playIndex(idx: number): void {
        if (!this.bgMusic || idx < 0 || idx >= this.combinedPlaylist.length) return;
        this.trackIdx = idx;
        this.bgMusic.src = this.combinedPlaylist[this.trackIdx] || "";
        this.play();
    }

    public playUrl(url: string): void {
        if (!this.bgMusic || !url) return;
        // Try to find index if it exists in playlist (optional, for Next/Prev consistency)
        const idx = this.combinedPlaylist.indexOf(url);
        if (idx !== -1) {
            this.trackIdx = idx;
        }
        this.bgMusic.src = url;
        this.play();
    }

    private playNext(): void {
        if (!this.bgMusic) return;
        this.trackIdx = (this.trackIdx + 1) % this.combinedPlaylist.length;
        this.bgMusic.src = this.combinedPlaylist[this.trackIdx] || "";
        this.play();
    }
}
