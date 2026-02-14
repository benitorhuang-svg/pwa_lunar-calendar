import { APP_BASE_URL } from "../core/appConfig";
import { HeroEventHandlers } from "./eventHandlers";
import { HeroHeaderManager } from "./headerManager";
import { HeroIdleManager } from "./idleManager";
import { HeroImageManager } from "./imageManager";
import { HeroMusicPlayer } from "./musicPlayer";
import { HeroSlideshowManager } from "./slideshowManager";

const baseDir = APP_BASE_URL;

// Initialize Managers
const idleManager = new HeroIdleManager();
const imageManager = new HeroImageManager(baseDir);
const musicPlayer = new HeroMusicPlayer(baseDir);
const slideshowManager = new HeroSlideshowManager();
const headerManager = new HeroHeaderManager();

// Init Managers (DOM elements)
imageManager.init();
musicPlayer.init();
headerManager.init();
idleManager.setupListeners();

// Core Logic & Event Handlers
const eventHandlers = new HeroEventHandlers(imageManager, slideshowManager, idleManager);

// 監聽沉浸模式事件以自動播放音樂 (Listen for immersion mode to auto-play music)
window.addEventListener("welcome-mode", ((e: CustomEvent<{ active: boolean }>) => {
    if (e.detail.active) {
        // 進入沉浸模式時嘗試播放音樂 (Try to play music when entering immersion mode)
        // 注意：仍受瀏覽器 Autoplay 政策限制，需使用者有過點擊行為
        // Note: Still subject to browser Autoplay policy (requires prior interaction)
        setTimeout(() => musicPlayer.play(), 1000); // 稍微延遲，配合動畫氛圍 (Slight delay for atmosphere)
    }
}) as EventListener);

// Start
eventHandlers.init();

// Initial Load
const season = imageManager.getSeason(new Date());
imageManager.detectHeroImages(season);
