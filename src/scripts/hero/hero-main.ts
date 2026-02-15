import { APP_BASE_URL } from "../core/appConfig";
import { HeroEventHandlers } from "./eventHandlers";
import { HeroHeaderManager } from "./headerManager";
import { HeroIdleManager } from "./idleManager";
import { HeroImageManager } from "./imageManager";
import { HeroMusicPlayer } from "./musicPlayer";
import { NoteManager } from "./noteManager";
import { HeroSlideshowManager } from "./slideshowManager";

const baseDir = APP_BASE_URL;

// Initialize Managers
const idleManager = new HeroIdleManager();
const imageManager = new HeroImageManager(baseDir);
const musicPlayer = new HeroMusicPlayer(baseDir);
const slideshowManager = new HeroSlideshowManager(10000);
const headerManager = new HeroHeaderManager();

const noteManager = new NoteManager(idleManager);

// Init Managers (DOM elements)
imageManager.init();
musicPlayer.init();
headerManager.init();
idleManager.setupListeners();
noteManager.init();

// Core Logic & Event Handlers
const eventHandlers = new HeroEventHandlers(imageManager, slideshowManager, idleManager, musicPlayer);



// Start
eventHandlers.init();

// Initial Load
const season = imageManager.getSeason(new Date());
imageManager.detectHeroImages(season);
