import { PanelRenderers } from "./panelRenderers.js";
import { PanelEventHandlers } from "./panelEventHandlers.js";

const renderers = new PanelRenderers();
renderers.init();
const handlers = new PanelEventHandlers(renderers);
handlers.init();
