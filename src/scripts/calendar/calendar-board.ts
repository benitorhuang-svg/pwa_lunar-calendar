import { CalendarCellBuilder } from "./calendarCellBuilder";
import { CalendarEventHandlers } from "./calendarEventHandlers";
import { CalendarRenderer } from "./calendarRenderer";

const cellBuilder = new CalendarCellBuilder();
const renderer = new CalendarRenderer(cellBuilder);
renderer.init();
const handlers = new CalendarEventHandlers(renderer);
handlers.init();
