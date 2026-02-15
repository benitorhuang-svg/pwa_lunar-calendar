import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_ROOT = path.join(__dirname, "../public/assets/audio");
const SRC_GENERATED_ROOT = path.join(__dirname, "../src/scripts/generated");

if (!fs.existsSync(SRC_GENERATED_ROOT)) {
    fs.mkdirSync(SRC_GENERATED_ROOT, { recursive: true });
}

const MANIFEST_TS = path.join(SRC_GENERATED_ROOT, "audioManifest.ts");

function generateAudioManifest() {
    const files = [];
    if (fs.existsSync(AUDIO_ROOT)) {
        fs.readdirSync(AUDIO_ROOT)
            .filter((file) => /\.(mp3|wav|ogg|m4a)$/i.test(file))
            .forEach((file) => files.push(file));
        files.sort();
    }

    const tsContent = `/**
 * Generated Audio Manifest
 * Do not edit manually.
 */
export const AUDIO_MANIFEST = ${JSON.stringify(files, null, 4)};
`;
    fs.writeFileSync(MANIFEST_TS, tsContent);
    console.log(`[Audio Manifest Generator] Created: ${MANIFEST_TS}`);
}

try {
    generateAudioManifest();
} catch (err) {
    console.error("[Audio Manifest Generator] Error:", err);
    process.exit(1);
}
