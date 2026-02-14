import { PanelEventHandlers } from "./panelEventHandlers";
import { PanelRenderers } from "./panelRenderers";

const renderers = new PanelRenderers();
renderers.init();
const handlers = new PanelEventHandlers(renderers);
handlers.init();
