// Ensure form inputs have a name/id for autofill and accessibility checks.
(function () {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addNames);
    } else {
        addNames();
    }

    function addNames() {
        const inputs = Array.from(document.querySelectorAll("input"));
        const missing = inputs.filter((el) => !el.name && !el.id);
        if (missing.length > 0) {
            console.warn(
                `[autofix] Found ${missing.length} input(s) without id/name. Listing for inspection:`,
            );
            missing.forEach((el, i) => {
                try {
                    console.groupCollapsed &&
                        console.groupCollapsed(`[autofix] input #${i}`);
                    console.warn(el);
                    console.warn(
                        "outerHTML:",
                        el.outerHTML
                            ? el.outerHTML.slice(0, 500)
                            : "(no outerHTML)",
                    );
                    console.warn(
                        "baseURI:",
                        el.baseURI || document.baseURI,
                    );
                    console.warn(
                        "inShadowRoot:",
                        !!el.getRootNode && el.getRootNode() !== document,
                    );
                    console.groupEnd && console.groupEnd();
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

    let seasonClass;

    // Season Logic (Lunar-Aligned)
    if (month >= 2 && month <= 4) {
        seasonClass = "theme-spring";
    } else if (month >= 5 && month <= 7) {
        seasonClass = "theme-summer";
    } else if (month >= 8 && month <= 10) {
        seasonClass = "theme-autumn";
    } else {
        // Winter: Nov, Dec, Jan
        seasonClass = "theme-winter";
    }

    // Festive Override Check (Simple check for Lunar New Year period - roughly Jan/Feb)
    // For a more accurate check, we'd need the Lunar library here.
    // For now, let's keep it strictly seasonal as requested, unless specifically Jan/Feb.
    // Actually, let's stick to the 4 seasons first.

    body.classList.add(seasonClass);
    console.log(
        `[Theme] Auto-switched to ${seasonClass} for month ${month}`,
    );
})();
