import os
import glob
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_DIR = os.path.join(BASE_DIR, "assets", "gallery")

# 24 Solar Terms list in Chinese
SOLAR_TERMS = [
    "立春", "雨水", "驚蟄", "春分", "清明", "穀雨",
    "立夏", "小滿", "芒種", "夏至", "小暑", "大暑",
    "立秋", "處暑", "白露", "秋分", "寒露", "霜降",
    "立冬", "小雪", "大雪", "冬至", "小寒", "大寒"
]

def clean_and_convert():
    seasons = ["spring", "summer", "autumn", "winter", "default"]
    
    for season in seasons:
        season_path = os.path.join(GALLERY_DIR, season)
        if not os.path.exists(season_path):
            continue
            
        print(f"\n[+] Processing season: {season}")
        
        # Get all image files
        files = glob.glob(os.path.join(season_path, "*.*"))
        
        # Lists to keep track
        special_images = []
        regular_images = []
        
        for f in files:
            name = os.path.splitext(os.path.basename(f))[0]
            # Check if it's a solar term masterpiece
            if any(term in name for term in SOLAR_TERMS):
                special_images.append(f)
            else:
                regular_images.append(f)
                
        # 1. Convert and Rename Specials (Masterpieces)
        for f in special_images:
            name = os.path.splitext(os.path.basename(f))[0]
            # Keep only the term name (remove suffixes like _Masterpiece or _Soulful)
            clean_name = next((term for term in SOLAR_TERMS if term in name), name)
            new_path = os.path.join(season_path, f"{clean_name}.webp")
            
            with Image.open(f) as img:
                img.save(new_path, "WEBP", quality=100)
            
            if f != new_path:
                os.remove(f)
            print(f"    - Converted Masterpiece: {clean_name}.webp")

        # 2. Convert and Rename Regulars sequentially
        for i, f in enumerate(regular_images, 1):
            new_path = os.path.join(season_path, f"{i}.webp")
            
            with Image.open(f) as img:
                img.save(new_path, "WEBP", quality=90)
            
            # Remove original if it was different
            if os.path.abspath(f) != os.path.abspath(new_path):
                os.remove(f)
            print(f"    - Sequence: {i}.webp")

if __name__ == "__main__":
    clean_and_convert()
    print("\n[✨] Gallery cleanup and conversion complete!")
