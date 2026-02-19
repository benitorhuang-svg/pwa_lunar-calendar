import { PanelEventHandlers } from "./panelEventHandlers";
import { PanelRenderers } from "./panelRenderers";

import { NotePadHandler } from "./notePadHandler";

const renderers = new PanelRenderers();
renderers.init();
const handlers = new PanelEventHandlers(renderers);
handlers.init();
const notePad = new NotePadHandler();
notePad.init();
