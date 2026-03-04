/**
 * FAQ Panel Entry Point
 * Delegates rendering to panels/faq/ atomic modules.
 * 入口點：委派至 panels/faq/ 原子化模組
 */

import { renderFAQ } from "../panels/faq/organisms";

function init() {
    const panel = document.getElementById("panelFAQ");
    if (!panel) return;
    renderFAQ(panel);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

export { };
