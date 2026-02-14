import { HeroIdleManager } from "./idleManager.js";
import { HeroImageManager } from "./imageManager.js";
import { HeroMusicPlayer } from "./musicPlayer.js";
import { HeroSlideshowManager } from "./slideshowManager.js";
import { HeroEventHandlers } from "./eventHandlers.js";

const baseDir = window.APP_BASE_URL || "/";

// Initialize Managers
const idleManager = new HeroIdleManager();
const imageManager = new HeroImageManager(baseDir);
const musicPlayer = new HeroMusicPlayer(baseDir);
const slideshowManager = new HeroSlideshowManager();

// Init Managers (DOM elements)
imageManager.init();
musicPlayer.init();

// Core Logic & Event Handlers
const eventHandlers = new HeroEventHandlers(
    imageManager,
    slideshowManager,
    idleManager
);

// Start
eventHandlers.init();

// Initial Load
const season = imageManager.getSeason(new Date());
imageManager.detectHeroImages(season);
