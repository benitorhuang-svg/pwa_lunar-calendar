import { TagMini, NodeMini, FlowArrowMini, FullDateNum, FullYearSmall, MoonSvg } from "./atoms";

export const TermFlowMini = (current: string, next: string, daysToNext: number) => {
    const isNextMonthTerm = daysToNext > 15;
    return `
        <div class="term-flow-mini">
            ${NodeMini(current)}
            ${FlowArrowMini(daysToNext)}
            ${NodeMini(next, isNextMonthTerm)}
        </div>`;
};

export const LunarDateRowInfo = (monthText: string, dayText: string, festivalDesc: string | null) => {
    const finalizedMonth = monthText.endsWith("月") ? monthText : monthText + "月";
    return `
        <div class="lunar-info-row-1" style="margin-top: 0;">
            <span class="lunar-main">${finalizedMonth}.${dayText}</span>
            ${festivalDesc ? TagMini(festivalDesc) : ""}
        </div>`;
};

export const TopDateRow = (date: Date) => `
    ${FullDateNum(date.getMonth() + 1, date.getDate())}
    ${FullYearSmall(date.getFullYear())}
`;

export const MoonStatus = (moon: { name: string; phase: number; value: number }) => `
    <div class="moon-box-top">
        <div class="moon-svg-wrap">
            ${MoonSvg(moon.value)}
        </div>
        <span class="moon-label-top">${moon.name}</span>
    </div>
`;
