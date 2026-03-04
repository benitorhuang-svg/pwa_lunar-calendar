/**
 * FAQ Organisms — Full FAQ panel renderer
 * FAQ 面板渲染器：組合 atoms 與 data 產生完整面板
 */

import { FAQ_DATA } from "../../../data/faqData";
import { collapseAllItems, createFAQItem, expandAllItems } from "./atoms";

/** Render the complete FAQ panel into a container */
export function renderFAQ(container: HTMLElement): void {
    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "faq-header";

    const title = document.createElement("div");
    title.className = "faq-title";
    title.textContent = "常見問題 (FAQ)";

    const controls = document.createElement("div");
    controls.className = "faq-controls";

    const expandAll = document.createElement("button");
    expandAll.type = "button";
    expandAll.className = "faq-control-btn";
    expandAll.textContent = "全部展開";
    expandAll.addEventListener("click", () => expandAllItems(container));

    const collapseAll = document.createElement("button");
    collapseAll.type = "button";
    collapseAll.className = "faq-control-btn";
    collapseAll.textContent = "全部收合";
    collapseAll.addEventListener("click", () => collapseAllItems(container));

    controls.appendChild(expandAll);
    controls.appendChild(collapseAll);
    header.appendChild(title);
    header.appendChild(controls);
    container.appendChild(header);

    const list = document.createElement("div");
    list.className = "faq-list";

    FAQ_DATA.forEach((entry, i) => {
        list.appendChild(createFAQItem(i + 1, entry.q, entry.a));
    });

    container.appendChild(list);

    // Default: expand all items
    expandAllItems(container);
}
