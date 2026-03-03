/**
 * Common Organisms for Panels
 */

import { VerticalText } from "../today/atoms";

export const SideAccentPanel = (ganzhi: string, monthGZ: string, dayGZ: string, zodiac: string) => `
    <div class="panel-side-accent">
        <div class="vertical-text">
            ${VerticalText("side-zodiac", zodiac)}
            ${VerticalText("side-ganzhi", `${ganzhi}年 ${monthGZ}月${dayGZ}日`)}
        </div>
    </div>
`;
