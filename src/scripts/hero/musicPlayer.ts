/**
 * Hero Music Player
 * 負責音樂播放器邏輯 (Responsible for music player logic)
 */

export class HeroMusicPlayer {
    private bgMusic: HTMLAudioElement | null = null;
    private btnMusic: HTMLElement | null = null;
    private trackIdx: number;
    private zenPlaylist: string[];

    constructor(baseDir: string) {
        this.zenPlaylist = [
            (baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/"),
            (baseDir + "assets/audio/danyvin.mp3").replace(/\/+/g, "/"),
            (baseDir + "assets/audio/danyvin-journey.mp3").replace(/\/+/g, "/"),
        ];
        this.trackIdx = Math.floor(Math.random() * this.zenPlaylist.length);
    }

    public init(): void {
        this.btnMusic = document.getElementById("btnMusic");
        this.bgMusic = document.getElementById("bgMusic") as HTMLAudioElement | null;

        if (!this.btnMusic || !this.bgMusic) return;

        // 音樂守護：當一首結束，自動接下一首
        this.bgMusic.onended = () => {
            if (!this.bgMusic) return;
            this.trackIdx = (this.trackIdx + 1) % this.zenPlaylist.length;
            this.bgMusic.src = this.zenPlaylist[this.trackIdx] || "";
            this.play();
        };

        this.btnMusic.onclick = () => {
            if (!this.bgMusic) return;
            if (this.bgMusic.paused) {
                this.play();
            } else {
                this.pause();
            }
        };
    }

    /**
     * 播放音樂 (Play Music)
     */
    public play(): void {
        if (!this.bgMusic) return;

        // 初始化第一首
        if (!this.bgMusic.src || this.bgMusic.src === "" || this.bgMusic.ended) {
            this.bgMusic.src = this.zenPlaylist[this.trackIdx] || "";
        }

        this.bgMusic
            .play()
            .then(() => {
                console.log("[ZenMusic] Flowing:", this.zenPlaylist[this.trackIdx] || "unknown");
                if (this.btnMusic) this.btnMusic.classList.add("playing");
            })
            .catch((e) => {
                // 通常是瀏覽器自動播放限制 (Usually browser autoplay restriction)
                console.log("[ZenMusic] Playback blocked or failed:", e.message);
            });
    }

    /**
     * 暫停音樂 (Pause Music)
     */
    public pause(): void {
        if (!this.bgMusic) return;
        this.bgMusic.pause();
        if (this.btnMusic) this.btnMusic.classList.remove("playing");

        // 預備下一首
        this.trackIdx = (this.trackIdx + 1) % this.zenPlaylist.length;
        this.bgMusic.src = this.zenPlaylist[this.trackIdx] || "";
    }
}
