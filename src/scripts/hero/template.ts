import { SelectorButton, SelectorSeparator } from "./atoms";

export const HeroSelectorTemplate = (year: number, month: number) => `
    ${SelectorButton("year", year.toString(), "年")}
    ${SelectorSeparator()}
    ${SelectorButton("month", (month + 1).toString().padStart(2, "0"), "月")}
`;
