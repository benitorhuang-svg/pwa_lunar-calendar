export const TagMini = (content: string) => `<div class="festival-tag-mini">${content}</div>`;

export const PentadTag = (label: string, styleOverrides?: string) =>
    `<span class="pentad-tag-box" ${styleOverrides ? `style="${styleOverrides}"` : ""}>${label}</span>`;

export const NodeMini = (text: string, dim: boolean = false) =>
    `<span class="flow-node-mini ${dim ? "dim" : ""}">${text}</span>`;

export const FlowArrowMini = (days: number) => `
    <div class="flow-arrow-mini">
        <div class="flow-line-mini"></div>
        <div class="flow-tag-mini">${days} 天</div>
        <div class="flow-arrow-head-mini"></div>
    </div>`;

export const FullDateNum = (month: number, date: number) =>
    `<span class="today-full-date">${month}/${date}</span>`;

export const FullYearSmall = (year: number) =>
    `<span class="today-year-small">${year}</span>`;

export const VerticalText = (className: string, text: string) =>
    `<span class="${className}">${text}</span>`;

export const MoonSvg = (value: number) => {
    const R = 28;
    const C = 32;

    let isWaxing = true;
    if (value <= 0.5) isWaxing = true;
    else isWaxing = false;

    const terminatorX = -R * Math.cos(value * 2 * Math.PI);
    const rX = Math.abs(terminatorX);
    const outerSweep = isWaxing ? 1 : 0;

    const startX = 32, startY = 4;
    const endX = 32, endY = 60;

    const outerPath = `M ${startX} ${startY} A ${R} ${R} 0 0 ${outerSweep} ${endX} ${endY}`;

    let innerSweep = 0;
    if (isWaxing) {
        if (value < 0.25) innerSweep = 0;
        else innerSweep = 1;
    } else {
        if (value < 0.75) innerSweep = 0;
        else innerSweep = 1;
    }

    const innerPath = `A ${rX} ${R} 0 0 ${innerSweep} ${startX} ${startY}`;
    const pathD = `${outerPath} ${innerPath} Z`;

    if (value < 0.02 || value > 0.98) {
        return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
            <circle cx="${C}" cy="${C}" r="${R}" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
        </svg>`;
    }

    if (value > 0.48 && value < 0.52) {
        return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
            <defs>
                <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="#fff9e6"/>
                    <stop offset="100%" stop-color="#d4af37"/>
                </radialGradient>
                <filter id="moonGlow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <circle cx="${C}" cy="${C}" r="${R}" fill="url(#moonGrad)" filter="url(#moonGlow)"/>
        </svg>`;
    }

    return `<svg viewBox="0 0 64 64" width="100%" height="100%" class="moon-svg">
        <defs>
            <radialGradient id="moonGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#fff5c3"/>
                <stop offset="70%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#b8860b"/>
            </radialGradient>
            <filter id="crater" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.10" numOctaves="3" result="noise"/>
                <feDiffuseLighting in="noise" lighting-color="#d4af37" surfaceScale="1">
                    <feDistantLight azimuth="45" elevation="40"/>
                </feDiffuseLighting>
                <feComposite operator="in" in2="SourceGraphic"/>
                <feBlend in="SourceGraphic" mode="multiply"/>
            </filter>
        </defs>
        <circle cx="${C}" cy="${C}" r="${R}" fill="#111" class="moon-shadow"/>
        <path d="${pathD}" fill="url(#moonGrad)" filter="url(#crater)" style="filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.5));"/>
    </svg>`;
};
