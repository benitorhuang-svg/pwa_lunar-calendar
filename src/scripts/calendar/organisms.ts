import { WeekDayLabel } from "./atoms";

export const WeekHeaderOrganism = () => `
    <div class="week-header">
        ${["日", "一", "二", "三", "四", "五", "六"].map(WeekDayLabel).join("")}
    </div>
`;

export const DaysGridOrganism = (gridHtml: string, animationClass: string = "") => `
    <div class="days-grid ${animationClass}" id="calendarGrid">
        ${gridHtml}
    </div>
`;
