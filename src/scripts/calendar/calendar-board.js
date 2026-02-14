import { CalendarRenderer } from "./calendarRenderer.js";
import { CalendarEventHandlers } from "./calendarEventHandlers.js";
import { CalendarCellBuilder } from "./calendarCellBuilder.js";

const cellBuilder = new CalendarCellBuilder();
const renderer = new CalendarRenderer(cellBuilder);
renderer.init();
const handlers = new CalendarEventHandlers(renderer);
handlers.init();
