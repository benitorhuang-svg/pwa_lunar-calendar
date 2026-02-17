import { APP_BASE_URL } from "../core/appConfig";
import { HeroEventHandlers } from "./eventHandlers";
import { HeroHeaderManager } from "./headerManager";
import { HeroIdleManager } from "./idleManager";
import { HeroImageManager } from "./imageManager";
import { HeroMusicPlayer } from "./musicPlayer";
import { ParallaxManager } from "./parallaxManager";
import { HeroSlideshowManager } from "./slideshowManager";

const baseDir = APP_BASE_URL;

// Initialize Managers
const idleManager = new HeroIdleManager();
const imageManager = new HeroImageManager(baseDir);
const musicPlayer = new HeroMusicPlayer(baseDir);
const slideshowManager = new HeroSlideshowManager(10000);
const headerManager = new HeroHeaderManager();
const parallaxManager = new ParallaxManager();

// Init Managers (DOM elements)
imageManager.init();
musicPlayer.init();
headerManager.init();
idleManager.setupInteractionListeners();

parallaxManager.init();

// Core Logic & Event Handlers
const eventHandlers = new HeroEventHandlers(
    imageManager,
    slideshowManager,
    idleManager,
    musicPlayer,
);

// Start
eventHandlers.init();

// Initial Load
(async () => {
    const season = imageManager.getSeason(new Date());
    await imageManager.detectHeroImages(season);

    // Signal to resource loader that core logic AND first batch of images are ready
    (window as any).__APP_LOGIC_READY__ = true;
    window.dispatchEvent(new CustomEvent("app-logic-ready"));
})();

// Listen for image preloading from manager to set global flag
window.addEventListener("app-images-preloaded", () => {
    (window as any).__APP_IMAGES_PRELOADED__ = true;
});
