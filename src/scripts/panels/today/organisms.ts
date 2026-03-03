import { LunarDateRowInfo, TermFlowMini, TopDateRow, MoonStatus } from "./molecules";
import { PentadTag } from "./atoms";
import type { Poem } from "../../../data/poems/types";

export const DateDisplayPanel = (
    date: Date,
    monthText: string,
    dayText: string,
    festivalDesc: string | null,
    termPeriod?: { current: string; next: string; daysToNext: number }
) => `
    <div class="detail-sub-main">
        <div class="today-date-row">
            ${TopDateRow(date)}
            ${LunarDateRowInfo(monthText, dayText, festivalDesc)}
        </div>
        <div class="lunar-term-row">
            ${termPeriod ? TermFlowMini(termPeriod.current, termPeriod.next, termPeriod.daysToNext) : ""}
        </div>
    </div>
`;

export const RightClusterPanel = (moon: { name: string; phase: number; value: number }) => `
    <div class="detail-right-cluster">
        ${MoonStatus(moon)}
    </div>
`;


export const PentadCard = (pentad: { name: string; meaning: string; index: number }) => {
    const pentadLabel = ["", "初候", "二候", "三候"][pentad.index] || "候";
    return `
        <div class="detail-culture-section">
            <div class="culture-left full-width">
                 <div class="pentad-display">
                    <div class="pentad-header-row">
                        ${PentadTag(pentadLabel)}
                        <span class="pentad-name-title">${pentad.name}</span>
                    </div>
                    <div class="pentad-meaning-text">${pentad.meaning}</div>
                 </div>
            </div>
        </div>`;
};

export const PoemCard = (poem: Poem) => {
    // Sentence breaking optimization: 
    // 1. Explicit line break after commas/semicolons
    // 2. Clear block gap after periods (sentence break)
    // 3. Avoid trailing space at the very end
    const content = poem.content.trim();
    // Split by period to separate couplets
    const coupletParts = content.split('。').filter(s => s.length > 0);

    const formattedContent = coupletParts.map(part => {
        // In each couplet, add gap between sentences (at comma/semicolon)
        const inner = part.replace(/([，；！？])/g, '$1<span class="poem-inline-gap"></span>');
        return `<div class="poem-couplet-line">${inner}。</div>`;
    }).join('');

    let displayTitle = "";
    let displayName = poem.author;

    if (poem.author.includes("《")) {
        const parts = poem.author.split("《");
        displayName = parts[0]?.trim() || "";
        const titlePart = parts[1] || "";
        displayTitle = titlePart.replace("》", "").trim();
    }

    const tagText = `${poem.dynasty || ""} · ${displayName || ""}`;

    return `
        <div class="detail-culture-section">
            <div class="culture-left full-width">
                 <div class="pentad-display">
                    <div class="pentad-header-row">
                        ${PentadTag(tagText)}
                        ${displayTitle ? `<span class="pentad-name-title" style="flex: 1; min-width: 0; font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: 10px;">${displayTitle}</span>` : ""}
                    </div>
                    <div class="pentad-content-text">
                        ${formattedContent}
                    </div>
                 </div>
            </div>
        </div>`;
};

export const CultureContent = (
    pentad: { name: string; meaning: string; index: number },
    poem: Poem,
    date: Date
) => {
    const showPentad = (date.getDate() % 5 === 1) || (date.getDate() === 1);
    if (showPentad) {
        return PentadCard(pentad);
    } else {
        return PoemCard(poem);
    }
};
