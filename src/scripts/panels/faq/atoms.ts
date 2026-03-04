/**
 * FAQ Atoms — Pure UI builders
 * 純 UI 建構函式：單一 FAQ 項目
 */

/** Create a single FAQ item with accordion behavior */
export function createFAQItem(id: number, q: string, a: string): HTMLElement {
    const item = document.createElement("div");
    item.className = "faq-item";

    const btn = document.createElement("button");
    btn.className = "faq-question";
    btn.type = "button";
    btn.id = `faq-q-${id}`;
    btn.setAttribute("aria-controls", `faq-a-${id}`);
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `<span class="faq-q-mark">Q</span><span class="faq-q-text">${q}</span>`;

    const panel = document.createElement("div");
    panel.className = "faq-answer";
    panel.id = `faq-a-${id}`;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", btn.id);
    panel.hidden = true;
    panel.innerHTML = `<div class="faq-a-inner">${a}</div>`;

    btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));
        item.classList.toggle("active", !expanded);
        panel.hidden = expanded;
    });

    btn.addEventListener("keydown", (ev) => {
        if ((ev as KeyboardEvent).key === "ArrowDown") {
            ev.preventDefault();
            const next = item.nextElementSibling as HTMLElement | null;
            (next?.querySelector(".faq-question") as HTMLElement | null)?.focus();
        } else if ((ev as KeyboardEvent).key === "ArrowUp") {
            ev.preventDefault();
            const prev = item.previousElementSibling as HTMLElement | null;
            (prev?.querySelector(".faq-question") as HTMLElement | null)?.focus();
        }
    });

    item.appendChild(btn);
    item.appendChild(panel);
    return item;
}

/** Expand all FAQ items in a container */
export function expandAllItems(container: HTMLElement): void {
    container.querySelectorAll(".faq-item").forEach((it) => {
        const q = it.querySelector(".faq-question") as HTMLElement;
        const a = it.querySelector(".faq-answer") as HTMLElement;
        it.classList.add("active");
        q.setAttribute("aria-expanded", "true");
        a.hidden = false;
    });
}

/** Collapse all FAQ items in a container */
export function collapseAllItems(container: HTMLElement): void {
    container.querySelectorAll(".faq-item").forEach((it) => {
        const q = it.querySelector(".faq-question") as HTMLElement;
        const a = it.querySelector(".faq-answer") as HTMLElement;
        it.classList.remove("active");
        q.setAttribute("aria-expanded", "false");
        a.hidden = true;
    });
}
