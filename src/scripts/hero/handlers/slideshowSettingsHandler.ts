import type { HeroSlideshowManager } from "../slideshowManager";
import type { HeroUIManager } from "../uiManager";
import type { HeroIdleManager } from "../idleManager";
import type { SlideshowControlDetail } from "../types";

export class SlideshowSettingsHandler {
    private menu: HTMLElement | null = null;
    private btn: HTMLElement | null = null;

    constructor(
        private slideshowManager: HeroSlideshowManager,
        private uiManager: HeroUIManager,
        private idleManager: HeroIdleManager,
    ) { }

    public init(): void {
        // ModeUIManager keeps many elements; for simplicity query DOM directly
        this.btn = document.getElementById('btnSlideshowSettings');
        this.menu = document.getElementById('slideshowSettingsMenu');

        if (!this.btn || !this.menu) return;

        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const visible = this.menu?.getAttribute('aria-hidden') === 'false';
            this.menu?.setAttribute('aria-hidden', visible ? 'true' : 'false');
        });

        document.addEventListener('click', () => {
            this.menu?.setAttribute('aria-hidden', 'true');
        });

        this.menu.querySelectorAll('.menu-item').forEach((el) => {
            el.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const val = (ev.currentTarget as HTMLElement).getAttribute('data-val');
                this.menu?.setAttribute('aria-hidden', 'true');
                this.applySetting(val);
            });
        });

        // Restore saved setting
        const saved = localStorage.getItem('slideshow_setting');
        if (saved) {
            this.updateActiveUI(saved);
            if (saved === 'black') {
                document.body.classList.add('all-black');
                this.slideshowManager.stop();
            } else {
                const ms = parseInt(saved, 10);
                if (!Number.isNaN(ms)) this.slideshowManager.setIntervalMs(ms);
            }
        } else {
            // Default to 3s if no setting saved
            this.updateActiveUI('3000');
        }
    }

    private updateActiveUI(val: string): void {
        if (!this.menu) return;
        this.menu.querySelectorAll('.menu-item').forEach((el) => {
            const itemVal = el.getAttribute('data-val');
            if (itemVal === val) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Update the button label
        const label = document.getElementById('slideshowCurrentVal');
        if (label) {
            if (val === 'black') {
                label.textContent = 'Black';
            } else {
                const sec = Math.round(parseInt(val, 10) / 1000);
                label.textContent = `${sec}s`;
            }
        }

        // Special check for custom: if numeric value isn't 1000, 3000, 5000, and not 'black'
        const presets = ['1000', '3000', '5000', 'black'];
        const isCustom = !presets.includes(val);
        const customBtn = this.menu.querySelector('[data-val="custom"]');
        if (customBtn) {
            if (isCustom) customBtn.classList.add('active');
            else customBtn.classList.remove('active');
        }
    }

    private applySetting(val: string | null): void {
        if (!val) return;

        if (val === 'black') {
            document.body.classList.add('all-black');
            this.slideshowManager.stop();
            localStorage.setItem('slideshow_setting', 'black');
            this.updateActiveUI('black');
            return;
        }

        // numeric or custom
        let ms = parseInt(val, 10);
        let finalVal = val;

        if (val === 'custom') {
            const input = prompt('請輸入秒數 (例如 2 表示 2 秒)：', '3');
            const n = input ? Number(input) : NaN;
            if (Number.isNaN(n) || n <= 0) return;
            ms = Math.round(n * 1000);
            finalVal = String(ms);
        }

        if (!Number.isNaN(ms) && ms > 0) {
            document.body.classList.remove('all-black');
            this.slideshowManager.setIntervalMs(ms);
            localStorage.setItem('slideshow_setting', finalVal);
            this.updateActiveUI(finalVal);

            // Restart slideshow in immersion (request ModeHandler to start slideshow)
            const detail: SlideshowControlDetail = { action: 'start', isArtwork: false };
            window.dispatchEvent(new CustomEvent<SlideshowControlDetail>('slideshow-control', { detail }));
            // Reset idle so user won't be kicked out of immersion
            this.idleManager.reset();
        }
    }
}
