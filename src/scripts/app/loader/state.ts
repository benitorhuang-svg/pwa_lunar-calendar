export type ProgressKey = "audio" | "fonts" | "heroAll" | "heroFirst" | "scripts" | "update";

export const progressState: Record<ProgressKey, boolean> = {
    audio: false, // 10%
    fonts: false, // 15%
    heroAll: false, // 15%
    heroFirst: false, // 25%
    scripts: false, // 15%
    update: false, // 20%
};

const weights: Record<ProgressKey, number> = {
    audio: 10,
    fonts: 15,
    heroAll: 15,
    heroFirst: 25,
    scripts: 15,
    update: 20,
};

export function calcPercent(): number {
    let total = 0;
    for (const k in progressState) {
        const key = k as ProgressKey;
        if (progressState[key]) total += weights[key];
    }
    return total;
}
