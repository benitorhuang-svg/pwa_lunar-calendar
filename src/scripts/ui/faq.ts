// Lightweight FAQ accordion renderer
const FAQ_DATA: { a: string; q: string }[] = [
    {
        a: `本曆依據清代「欽定協紀辨方書」校訂，採用建除十二客、二十八宿值日、天干地支紀日法，提供傳統宜忌與吉凶判斷。資料與演算法支援公元 1900–2100 年的農曆轉換；目前（含 2026 年）均在支援範圍內。`,
        q: "農曆資料依據什麼版本？",
    },
    {
        q: "什麼是月令七十二候？",
        a: "月令七十二候集解，是依據中國古代曆法，將二十四節氣進一步細分為七十二個「候」，每候約五天。透過觀察動植物的變化（如魚上冰、桃始華）與天氣現象，細膩描繪了自然界的微觀更迭與生態時序。",
    },
    {
        q: "陰曆、陽曆與陰陽合曆有何不同？",
        a: "陽曆以地球繞日公轉為基準（如公曆）；陰曆以月球盈虧為基準（如伊斯蘭曆）；農曆則屬於「陰陽合曆」，兼顧朔望月與回歸年。透過「置閏法」（每 19 年設 7 個閏月）協調陰陽曆的時間差，確保季節更替與月份保持一致。",
    },
    {
        a: `進入映畫模式後，點擊底部 Dock 的藝廊按鈕，可匯入自選圖片。支援自選/預設/混合三種模式切換。圖片儲存於瀏覽器本地 IndexedDB。`,
        q: "如何自訂背景圖片？",
    },
    {
        a: `進入映畫模式 → 打開藝廊選單 → 音樂電台區域，可輸入線上音訊 URL 添加自訂電台。支援 MP3 串流格式。`,
        q: "如何添加自訂音樂電台？",
    },
    {
        a: `本 PWA 提供離線支援，已緩存部分圖像與資源，但首次使用或匯入自訂內容仍需網路。`,
        q: "可以離線使用嗎？",
    },
];

function createFAQItem(id: number, q: string, a: string): HTMLElement {
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

function init() {
    const panel = document.getElementById("panelFAQ");
    if (!panel) return;
    renderFAQ(panel);
}

function renderFAQ(container: HTMLElement) {
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
    expandAll.addEventListener("click", () => {
        container.querySelectorAll(".faq-item").forEach((it) => {
            const q = it.querySelector(".faq-question") as HTMLElement;
            const a = it.querySelector(".faq-answer") as HTMLElement;
            it.classList.add("active");
            q.setAttribute("aria-expanded", "true");
            a.hidden = false;
        });
    });

    const collapseAll = document.createElement("button");
    collapseAll.type = "button";
    collapseAll.className = "faq-control-btn";
    collapseAll.textContent = "全部收合";
    collapseAll.addEventListener("click", () => {
        container.querySelectorAll(".faq-item").forEach((it) => {
            const q = it.querySelector(".faq-question") as HTMLElement;
            const a = it.querySelector(".faq-answer") as HTMLElement;
            it.classList.remove("active");
            q.setAttribute("aria-expanded", "false");
            a.hidden = true;
        });
    });

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

    // Default: expand all items (programmatically click for consistency)
    expandAll.click();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

export { };
