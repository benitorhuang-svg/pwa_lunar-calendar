import os
import sys
from PIL import Image, ImageDraw, ImageFont

def apply_calligraphy(image_path, term_zh, term_en, output_path):
    # Load the image
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    draw = ImageDraw.Draw(img)

    # Font Paths (Windows Defaults)
    font_path_zh = "C:\\Windows\\Fonts\\msjh.ttc" # Microsoft JhengHei
    font_path_en = "C:\\Windows\\Fonts\\arial.ttf"

    # Settings based on image size (assuming 512x896)
    scale = width / 512
    font_size_zh = int(45 * scale)
    font_size_en = int(18 * scale)
    padding_right = int(30 * scale)
    padding_top = int(40 * scale)

    try:
        font_zh = ImageFont.truetype(font_path_zh, font_size_zh)
        font_en = ImageFont.truetype(font_path_en, font_size_en)
    except:
        print("Font not found, using default.")
        font_zh = ImageFont.load_default()
        font_en = ImageFont.load_default()

    # 1. Draw Chinese Text (Vertical)
    x_zh = width - padding_right - font_size_zh
    y_zh = padding_top
    for char in term_zh:
        # Draw text with subtle shadow for readability
        draw.text((x_zh+1, y_zh+1), char, font=font_zh, fill=(0, 0, 0, 150)) # Shadow
        draw.text((x_zh, y_zh), char, font=font_zh, fill=(0, 0, 0, 230))    # Main Text
        y_zh += font_size_zh + int(5 * scale)

    # 2. Draw English Text (Vertical)
    x_en = x_zh + font_size_zh + int(5 * scale)
    y_en = padding_top
    for char in term_en:
        draw.text((x_en, y_en), char, font=font_en, fill=(0, 0, 0, 180))
        y_en += font_size_en - int(2 * scale)

    # 3. Draw Red Seal
    seal_size = int(35 * scale)
    seal_x = x_zh + (font_size_zh - seal_size) // 2
    seal_y = y_zh + int(10 * scale)
    
    # Red Square
    draw.rectangle([seal_x, seal_y, seal_x + seal_size, seal_y + seal_size], fill=(180, 40, 40, 220))
    # Seal "Text" (Simplified representation)
    draw.text((seal_x + int(5*scale), seal_y + int(2*scale)), "節", font=ImageFont.truetype(font_path_zh, int(25*scale)), fill=(255, 255, 255, 200))

    # Save
    img.convert("RGB").save(output_path, "WEBP", quality=100)
    print(f"Post-processed archive saved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python post_process_calligraphy.py <img_path> <zh_name> <en_name> <out_path>")
    else:
        apply_calligraphy(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
