import { AtomicPageLayout } from "../common/templates";
import { SideAccentPanel } from "../common/organisms";
import { DateDisplayPanel, RightClusterPanel, CultureContent } from "./organisms";
import type { Poem } from "../../../data/poems/types";

export interface TodayPanelProps {
    date: Date;
    monthText: string;
    dayText: string;
    ganzhi: string;
    zodiac: string;
    dayGZ: string;
    monthGZ: string;
    festival: string | null;
    holidayDesc: string | null;
    termPeriod?: { current: string; next: string; daysToNext: number };
    pentad: { name: string; meaning: string; index: number };
    poem: Poem;
    moon: { name: string; phase: number; value: number };
}

export const TodayPanelTemplate = (props: TodayPanelProps) => {
    const sidebar = SideAccentPanel(props.ganzhi, props.monthGZ, props.dayGZ, props.zodiac);
    const content = `
        <div class="detail-top-section">
            ${DateDisplayPanel(
        props.date,
        props.monthText,
        props.dayText,
        props.festival,
        props.termPeriod
    )}
            ${RightClusterPanel(props.moon)}
        </div>
        ${CultureContent(props.pentad, props.poem, props.date)}
    `;

    return AtomicPageLayout(sidebar, content);
};
