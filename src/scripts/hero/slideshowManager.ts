/**
 * Hero Slideshow Manager
 * 負責幻燈片播放邏輯 (Responsible for slideshow playback logic)
 */

export class HeroSlideshowManager {
    private INTERVAL: number;
    private slideshowTimer: null | ReturnType<typeof setInterval> = null;

    constructor(interval = 10000) {
        this.INTERVAL = interval;
    }

    public setIntervalMs(ms: number): void {
        if (typeof ms !== "number" || Number.isNaN(ms) || ms <= 0) return;
        this.INTERVAL = ms;
        // If timer is running, restart is responsibility of caller (handlers/mode)
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }

    public getIntervalMs(): number {
        return this.INTERVAL;
    }

    public isActive(): boolean {
        return this.slideshowTimer !== null;
    }

    public reset(
        switchCallback: (_offset: number, _isAuto: boolean) => void,
        minImages: number,
    ): void {
        this.stop();
        this.start(switchCallback, minImages);
    }

    public start(switchCallback: (_offset: number, _isAuto: boolean) => void, minImages = 2): void {
        if (this.slideshowTimer) return;
        if (minImages < 2) return;

        this.slideshowTimer = setInterval(() => {
            switchCallback(1, true);
        }, this.INTERVAL);
    }

    public stop(): void {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }
}
