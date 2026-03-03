export const SelectorButton = (type: "year" | "month", value: string, unit: string) => `
    <button class="calendar-label-btn" data-type="${type}" aria-label="選擇${type === "year" ? "年份" : "月份"}">
        <span class="header-${type}">${value}</span><span class="unit">${unit}</span>
    </button>
`;

export const SelectorSeparator = () => `<div class="header-sep"></div>`;
