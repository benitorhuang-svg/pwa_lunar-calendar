/**
 * Layout Main Script
 * 負責全局布局與主題切換 (Responsible for global layout and theme switching)
 */

(function () {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addNames);
    } else {
        addNames();
    }

    function addNames(): void {
        const inputs = Array.from(document.querySelectorAll("input"));
        const missing = inputs.filter((el) => !el.name && !el.id);
        if (missing.length > 0) {
            console.warn(
                `[autofix] Found ${missing.length} input(s) without id/name. Listing for inspection:`,
            );
            missing.forEach((el, i) => {
                try {
                    console.groupCollapsed(`[autofix] input #${i}`);
                    console.warn(el);
                    console.warn(
                        "outerHTML:",
                        el.outerHTML ? el.outerHTML.slice(0, 500) : "(no outerHTML)",
                    );
                    console.warn("baseURI:", el.baseURI || document.baseURI);
                    console.warn("inShadowRoot:", el.getRootNode() !== document);
                    console.groupEnd();
                } catch (err) {
                    console.warn("[autofix] error logging element", err);
                }
            });
            console.warn(
                "[autofix] The script will assign temporary names/ids to these inputs to satisfy autofill checks.",
            );
        }

        let counter = 0;
        inputs.forEach((el) => {
            if (!el.name && !el.id) {
                el.name = `auto_input_${Date.now().toString(36)}_${counter++}`;
            } else if (!el.name && el.id) {
                el.name = el.id;
            } else if (!el.id && el.name) {
                el.id = el.name;
            }
        });
    }
})();

// Automatic Seasonal Theme Switcher
(function () {
    const month = new Date().getMonth() + 1;
    const body = document.body;

    // Remove existing theme classes to prevent conflicts
    body.classList.remove(
        "theme-spring",
        "theme-summer",
        "theme-autumn",
        "theme-winter",
        "theme-light",
        "theme-dark",
        "theme-festive",
    );

    let seasonClass: string;

    // Season Logic (Lunar-Aligned)
    // Season Logic (Lunar-Aligned)
    // 1. Festive (Lunar New Year) - Feb
    if (month === 2) {
        seasonClass = "theme-festive";
    }
    // 2. Spring - Mar, Apr, May
    else if (month >= 3 && month <= 5) {
        seasonClass = "theme-spring";
    }
    // 3. Summer - Jun, Jul, Aug
    else if (month >= 6 && month <= 8) {
        seasonClass = "theme-summer";
    }
    // 4. Autumn - Sep, Oct, Nov
    else if (month >= 9 && month <= 11) {
        seasonClass = "theme-autumn";
    }
    // 5. Winter - Dec, Jan
    else {
        seasonClass = "theme-winter";
    }

    body.classList.add(seasonClass);
    console.log(`[Theme] Auto-switched to ${seasonClass} for month ${month}`);
})();
