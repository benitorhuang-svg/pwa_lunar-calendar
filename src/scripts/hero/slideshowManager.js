/**
 * Hero Slideshow Manager
 * 負責幻燈片播放邏輯 (Responsible for slideshow playback logic)
 */

export class HeroSlideshowManager {
    constructor(interval = 10000) {
        this.slideshowTimer = null;
        this.INTERVAL = interval;
    }

    start(switchCallback, minImages = 2) {
        if (this.slideshowTimer) return;
        if (minImages < 2) return;

        this.slideshowTimer = setInterval(() => {
            switchCallback(1, true);
        }, this.INTERVAL);
    }

    stop() {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }

    reset(switchCallback, minImages) {
        this.stop();
        this.start(switchCallback, minImages);
    }

    isActive() {
        return this.slideshowTimer !== null;
    }
}
