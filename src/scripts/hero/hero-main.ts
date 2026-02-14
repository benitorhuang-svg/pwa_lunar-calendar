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



// Start
eventHandlers.init();

// Initial Load
const season = imageManager.getSeason(new Date());
imageManager.detectHeroImages(season);
