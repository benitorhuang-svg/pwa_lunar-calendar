import { WeekHeaderOrganism, DaysGridOrganism } from "./organisms";

/* Calendar Page Template - Atomic Structure */

export const CalendarPageTemplate = (
    headerHtml: string,
    gridHtml: string,
    animationClass: string = ""
) => `
    <div class="calendar-nav-arrows">
        <div id="calendarTitle" class="calendar-title-container">
            ${headerHtml}
        </div>
    </div>
    ${WeekHeaderOrganism()}
    ${DaysGridOrganism(gridHtml, animationClass)}
`;
