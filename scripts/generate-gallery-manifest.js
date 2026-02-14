import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_ROOT = path.join(__dirname, "../public/assets/gallery");
const SRC_GENERATED_ROOT = path.join(__dirname, "../src/scripts/generated");
if (!fs.existsSync(SRC_GENERATED_ROOT)) {
    fs.mkdirSync(SRC_GENERATED_ROOT, { recursive: true });
}
const MANIFEST_TS = path.join(SRC_GENERATED_ROOT, "galleryManifest.ts");
const GALLERY_JSON = path.join(GALLERY_ROOT, "gallery.json");

function generateManifest() {
    const manifest = {};
    const seasons = ["default", "spring", "summer", "autumn", "winter"];

    seasons.forEach((season) => {
        const seasonDir = path.join(GALLERY_ROOT, season);
        const files = [];
        if (fs.existsSync(seasonDir)) {
            fs.readdirSync(seasonDir)
                .filter((file) => /\.(png|webp|jpg|jpeg)$/i.test(file))
                .forEach((file) => files.push(file));
            files.sort();
        }
        manifest[season] = files;
    });

    // Write gallery.json (Keep for fallback/reference)
    fs.writeFileSync(GALLERY_JSON, JSON.stringify(manifest, null, 4));
    console.log(`[Manifest Generator] Created: ${GALLERY_JSON}`);

    // Write galleryManifest.ts
    const tsContent = `/**
 * Generated Gallery Manifest
 * Do not edit manually.
 */
export const GALLERY_MANIFEST = ${JSON.stringify(manifest, null, 4)};
`;
    fs.writeFileSync(MANIFEST_TS, tsContent);
    console.log(`[Manifest Generator] Created: ${MANIFEST_TS}`);
}

try {
    generateManifest();
} catch (err) {
    console.error("[Manifest Generator] Error:", err);
    process.exit(1);
}
