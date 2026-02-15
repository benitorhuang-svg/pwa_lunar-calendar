import { AUDIO_MANIFEST } from "../generated/audioManifest";

export class HeroMusicPlayer {
    private bgMusic: HTMLAudioElement | null = null;
    private btnMusic: HTMLElement | null = null;
    private combinedPlaylist: string[] = [];
    private customPlaylist: string[] = [];
    private fadeTimer: any = null;
    private trackIdx: number;
    private wasPlayingBeforeHidden: boolean = false;
    private zenPlaylist: string[];

    constructor(baseDir: string) {
        // Automatically populated from public/assets/audio via generated manifest
        this.zenPlaylist = AUDIO_MANIFEST.map((file: string) =>
            (baseDir + "assets/audio/" + file).replace(/\/+/g, "/"),
        );

        // Add external/hardcoded sources if any (keeping the Jamendo one for demo/convenience)
        this.zenPlaylist.push("https://mp3l.jamendo.com/?trackid=953602&format=mp31&from=app-dev");

        this.combinedPlaylist = [...this.zenPlaylist];
        this.trackIdx = Math.floor(Math.random() * this.combinedPlaylist.length);
    }

    public init(): void {
        this.btnMusic = document.getElementById("btnMusic");
        this.bgMusic = document.getElementById("bgMusic") as HTMLAudioElement | null;

        if (!this.btnMusic || !this.bgMusic) return;

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

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                if (this.bgMusic && !this.bgMusic.paused) {
                    this.wasPlayingBeforeHidden = true;
                    this.pause();
                    console.log("[ZenMusic] Auto-paused due to visibility hidden");
                }
            } else if (document.visibilityState === "visible") {
                if (this.wasPlayingBeforeHidden && this.bgMusic) {
                    this.wasPlayingBeforeHidden = false;
                    this.play();
                }
            }
        });

        this.loadCustomPlaylist();
    }

    public async loadCustomPlaylist(): Promise<number> {
        const { galleryStorage } = await import("./galleryStorage");
        const customRows = await galleryStorage.getAllAudio();

        this.customPlaylist = customRows
            .map((row) => {
                if (row.type === "link" && row.url) return row.url;
                if (row.type === "file" && row.blob) return URL.createObjectURL(row.blob);
                return "";
            })
            .filter((url) => url !== "");

        this.combinedPlaylist = [...this.zenPlaylist, ...this.customPlaylist];

        const lastUrl = localStorage.getItem("zen_music_last_url");
        if (lastUrl) {
            const idx = this.combinedPlaylist.indexOf(lastUrl);
            if (idx !== -1) {
                this.trackIdx = idx;
                if (this.bgMusic) this.bgMusic.src = lastUrl;
            } else if (lastUrl.startsWith("http")) {
                if (this.bgMusic) this.bgMusic.src = lastUrl;
            }
            window.dispatchEvent(new CustomEvent("music-restored", { detail: { url: lastUrl } }));
        } else {
            if (this.combinedPlaylist.length > 0 && this.bgMusic) {
                // Pick a random track from the newly expanded list
                this.trackIdx = Math.floor(Math.random() * this.combinedPlaylist.length);
                this.bgMusic.src = this.combinedPlaylist[this.trackIdx] || "";
            }
        }
        return this.customPlaylist.length;
    }

    public pause(): void {
        if (!this.bgMusic) return;
        this.fade("out", () => {
            this.bgMusic?.pause();
            if (this.btnMusic) this.btnMusic.classList.remove("playing");
        });
    }

    public play(): void {
        if (!this.bgMusic) return;

        if (!this.bgMusic.src || this.bgMusic.src === "" || this.bgMusic.ended) {
            const url = this.combinedPlaylist[this.trackIdx] || "";
            this.bgMusic.src = url;
            this.saveLastSelection(url);
        }

        if (this.btnMusic) this.btnMusic.classList.add("loading");

        this.bgMusic
            .play()
            .then(() => {
                if (this.btnMusic) {
                    this.btnMusic.classList.remove("loading");
                    this.btnMusic.classList.add("playing");
                }
                this.fade("in");
            })
            .catch((e) => {
                console.log("[ZenMusic] Playback blocked:", e.message);
                if (this.btnMusic) this.btnMusic.classList.remove("loading");
            });
    }

    public playIndex(idx: number): void {
        if (!this.bgMusic || idx < 0 || idx >= this.combinedPlaylist.length) return;
        this.trackIdx = idx;
        const url = this.combinedPlaylist[this.trackIdx] || "";
        this.bgMusic.src = url;
        this.saveLastSelection(url);
        this.play();
    }

    public playUrl(url: string): void {
        if (!this.bgMusic || !url) return;
        const idx = this.combinedPlaylist.indexOf(url);
        if (idx !== -1) this.trackIdx = idx;
        this.bgMusic.src = url;
        this.saveLastSelection(url);
        this.play();
    }

    private fade(type: "in" | "out", callback?: () => void): void {
        if (!this.bgMusic) return;
        if (this.fadeTimer) clearInterval(this.fadeTimer);

        const audio = this.bgMusic;
        const duration = 1000;
        const steps = 20;
        const interval = duration / steps;
        const stepAmount = 1 / steps;

        if (type === "in") {
            audio.volume = 0;
            this.fadeTimer = setInterval(() => {
                const next = audio.volume + stepAmount;
                if (next >= 1) {
                    audio.volume = 1;
                    clearInterval(this.fadeTimer);
                    if (callback) callback();
                } else {
                    audio.volume = next;
                }
            }, interval);
        } else {
            this.fadeTimer = setInterval(() => {
                const next = audio.volume - stepAmount;
                if (next <= 0) {
                    audio.volume = 0;
                    clearInterval(this.fadeTimer);
                    if (callback) callback();
                } else {
                    audio.volume = next;
                }
            }, interval);
        }
    }

    private playNext(): void {
        if (!this.bgMusic) return;
        this.trackIdx = (this.trackIdx + 1) % this.combinedPlaylist.length;
        const url = this.combinedPlaylist[this.trackIdx] || "";
        this.bgMusic.src = url;
        this.saveLastSelection(url);
        this.play();
    }

    private saveLastSelection(url: string): void {
        if (!url) return;
        localStorage.setItem("zen_music_last_url", url);
    }
}
