import { CalendarRenderer } from "./calendarRenderer.js";
import { CalendarEventHandlers } from "./calendarEventHandlers.js";

const renderer = new CalendarRenderer();
const handlers = new CalendarEventHandlers(renderer);
handlers.init();
