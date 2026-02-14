import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_ROOT = path.join(__dirname, "../public/assets/gallery");
const MANIFEST_JS = path.join(GALLERY_ROOT, "manifest.js");
const GALLERY_JSON = path.join(GALLERY_ROOT, "gallery.json");

function generateManifest() {
    const manifest = {};
    const seasons = ["default", "spring", "summer", "autumn", "winter"];

    seasons.forEach((season) => {
        const seasonDir = path.join(GALLERY_ROOT, season);
        if (fs.existsSync(seasonDir)) {
            const files = fs
                .readdirSync(seasonDir)
                .filter((file) => /\.(png|webp|jpg|jpeg)$/i.test(file))
                .sort();
            manifest[season] = files;
        } else {
            manifest[season] = [];
        }
    });

    // Write gallery.json
    fs.writeFileSync(GALLERY_JSON, JSON.stringify(manifest, null, 4));
    console.log(`[Manifest Generator] Created: ${GALLERY_JSON}`);

    // Write manifest.js (for direct script loading as fallback)
    const jsContent = `/**
 * Generated Gallery Manifest
 * Do not edit manually.
 */
window.GALLERY_MANIFEST = ${JSON.stringify(manifest, null, 4)};
`;
    fs.writeFileSync(MANIFEST_JS, jsContent);
    console.log(`[Manifest Generator] Created: ${MANIFEST_JS}`);
}

try {
    generateManifest();
} catch (err) {
    console.error("[Manifest Generator] Error:", err);
    process.exit(1);
}
