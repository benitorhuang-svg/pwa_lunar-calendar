import { PanelRenderers } from "./panelRenderers.js";
import { PanelEventHandlers } from "./panelEventHandlers.js";

const renderers = new PanelRenderers();
const handlers = new PanelEventHandlers(renderers);
handlers.init();
