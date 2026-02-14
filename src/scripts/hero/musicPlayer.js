/**
 * Hero Music Player
 * 負責音樂播放器邏輯 (Responsible for music player logic)
 */

export class HeroMusicPlayer {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.btnMusic = null;
        this.bgMusic = null;
        this.zenPlaylist = [
            (baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/"),
            (baseDir + "assets/audio/danyvin.mp3").replace(/\/+/g, "/"),
            (baseDir + "assets/audio/danyvin-journey.mp3").replace(/\/+/g, "/"),
        ];
        this.trackIdx = Math.floor(Math.random() * this.zenPlaylist.length);
    }

    init() {
        this.btnMusic = document.getElementById("btnMusic");
        this.bgMusic = document.getElementById("bgMusic");

        if (!this.btnMusic || !this.bgMusic) return;

        // 音樂守護：當一首結束，自動接下一首
        this.bgMusic.onended = () => {
            this.trackIdx = (this.trackIdx + 1) % this.zenPlaylist.length;
            this.bgMusic.src = this.zenPlaylist[this.trackIdx];
            this.bgMusic.play();
        };

        this.btnMusic.onclick = () => {
            if (this.bgMusic.paused) {
                // 初始化第一首
                if (!this.bgMusic.src || this.bgMusic.src === "" || this.bgMusic.ended) {
                    this.bgMusic.src = this.zenPlaylist[this.trackIdx];
                }

                this.bgMusic
                    .play()
                    .then(() => {
                        console.log("[ZenMusic] Flowing:", this.zenPlaylist[this.trackIdx]);
                    })
                    .catch((e) => {
                        console.log("[ZenMusic] Blocked:", e);
                    });
                this.btnMusic.classList.add("playing");
            } else {
                this.bgMusic.pause();
                this.btnMusic.classList.remove("playing");
                // 暫停即預備下一首
                this.trackIdx = (this.trackIdx + 1) % this.zenPlaylist.length;
                this.bgMusic.src = this.zenPlaylist[this.trackIdx];
            }
        };
    }
}
