import os
import json

GALLERY_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'gallery')
MANIFEST_JSON_PATH = os.path.join(GALLERY_DIR, 'gallery.json')
MANIFEST_JS_PATH = os.path.join(GALLERY_DIR, 'manifest.js')

VALID_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}

def generate_manifest():
    manifest = {}
    
    if not os.path.exists(GALLERY_DIR):
        print(f"Gallery directory not found at: {GALLERY_DIR}")
        return

    # Scan subdirectories (spring, summer, autumn, winter, default)
    for folder_name in os.listdir(GALLERY_DIR):
        folder_path = os.path.join(GALLERY_DIR, folder_name)
        
        if os.path.isdir(folder_path):
            images = []
            for filename in os.listdir(folder_path):
                ext = os.path.splitext(filename)[1].lower()
                if ext in VALID_EXTENSIONS:
                    images.append(filename)
            
            # Sort for consistency
            images.sort()
            
            if images:
                manifest[folder_name] = images

    # Write JSON file (optional, but good for reference)
    with open(MANIFEST_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        
    # Write JS file (for file:// protocol support)
    js_content = f"const GALLERY_MANIFEST = {json.dumps(manifest, ensure_ascii=False, indent=2)};"
    with open(MANIFEST_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✅ Gallery manifest generated!")
    print(f"   - JSON: {MANIFEST_JSON_PATH}")
    print(f"   - JS:   {MANIFEST_JS_PATH} (Use this for file:// protocol)")
    print(f"   Categories found: {list(manifest.keys())}")
    for cat, imgs in manifest.items():
        print(f"   - {cat}: {len(imgs)} images")

if __name__ == "__main__":
    generate_manifest()
