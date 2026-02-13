import os
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_DIR = os.path.join(BASE_DIR, 'assets', 'gallery_dreamshaper') # Separate output folder

# Device setup
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# NOTEBOOK-LM AESTHETIC - Cinematic Macro Mastery
STYLE_PREFIX = "Professional cinematic nature photography, Visual China masterpiece style, high-end commercial aesthetic. Sharpest focus, extreme macro details, vibrant saturated colors balanced with deep shadows. Elegant minimalist composition with intentional negative space. Professional lighting (Golden hour rays, soft bokeh, cinematic light shafts). 8k resolution, Hasselblad X2D quality, breathtaking clarity."

SOLAR_TERMS_PROMPTS = {
    "spring": {
        "立春": "Early spring, first emerald buds breaking from charcoal-black branches, soft ethereal morning mist, golden morning sun rays.",
        "雨水": "A single elegant bamboo branch with lush green leaves glistening with fresh giant raindrops, misty background, crystal clear texture.",
        "驚蟄": "A single vibrant green plant sprout emerging from rich dark brown earth, small melting frost crystals, warm golden bokeh light.",
        "春分": "Symmetrical white magnolia flowers in full bloom against a deep, crystal clear turquoise sky, high contrast, serene harmony.",
        "清明": "Misty landscape with ethereal willow branches swaying over a calm mirror-like pond, soft diffused silver light.",
        "穀雨": "Lush green tea plantation terraces under soft, refreshing spring rain, vibrant rejuvenated nature, moist atmosphere.",
    },
    "summer": {
        "立夏": "A single pink lotus flower with exquisite gold-rimmed petals, deep emerald green leaves, bright summer sun, zen luxury.",
        "小滿": "Vibrant field of green wheat turning gold, waving in the breeze under a deep cobalt blue sky, abundance, warm light.",
        "芒種": "Flooded rice terraces reflecting a dramatic fiery orange sunset, sharp agricultural curves, rural zen masterpiece.",
        "夏至": "Intense sunbeams piercing through a dense emerald green bamboo forest, cinematic light shafts, sharp shadows.",
        "小暑": "Pure white jasmine flowers in a shaded courtyard, cool stone textures, intense summer heat bokeh in the distance.",
        "大暑": "Majestic golden sunflowers under a scorching deep blue sky, heat haze, vibrant energy, peak summer intensity.",
    },
    "autumn": {
        "立秋": "A single golden maple leaf resting on a wet dark mossy stone, first sign of autumn, low-angled golden hour light.",
        "處暑": "Endless golden rice fields stretching to the horizon under a brilliant cobalt sky, gentle cooling breeze, peaceful harvest.",
        "白露": "Sparkling diamond-like dew drops on silver pampas grass, cold blue morning light, minimalist crystalline beauty.",
        "秋分": "Symmetrical maple forest path with brilliant fiery red and orange leaves, perfectly clear autumn sky, balanced light.",
        "寒露": "Deep orange persimmons hanging on a bare charcoal-textured branch, cold morning mist, moody and sophisticated.",
        "霜降": "Extreme macro of white frost crystals on the edges of a brilliant red maple leaf, intense color contrast, sharp focus.",
    },
    "winter": {
        "立冬": "Stone lantern in a silent zen garden with a layer of first frost, minimalist grey and white tones, arrival of winter.",
        "小雪": "Light snowflakes falling on a vibrant red camellia flower, high contrast, elegant and quiet, soft focus white background.",
        "大雪": "Traditional pagoda roof covered in thick pure white snow, majestic mountains in distance, silence, deep blue shadows.",
        "冬至": "A single branch of vibrant red plum blossoms blooming in deep white snow, traditional resilience, cinematic lighting.",
        "小寒": "Frozen sapphire lake surface with intricate crystalline ice patterns, harsh winter sun, extreme clarity.",
        "大寒": "Abstract macro of ice crystal structures, deep sapphire and diamond brilliance, extreme winter chill, sharpest texture.",
    }
}

def generate_images():
    print("Loading DreamShaper 8 (The Best Non-Gated SD1.5 Model)...")
    # This model is completely open (non-gated) and has excellent quality
    model_id = "Lykon/dreamshaper-8"
    
    # Load pipeline
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.float16,
        safety_checker=None
    )
    
    # Use DPM++ 2M Karras for best details
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config,
        use_karras_sigmas=True,
        algorithm_type="dpmsolver++"  # Force DPM++ to avoid DEIS error
    )
    
    pipe = pipe.to(device)
    pipe.enable_attention_slicing()
    
    for season, terms in SOLAR_TERMS_PROMPTS.items():
        season_dir = os.path.join(GALLERY_DIR, season)
        os.makedirs(season_dir, exist_ok=True)
        
        for term, prompt in terms.items():
            file_path = os.path.join(season_dir, f"{term}.webp")
            
            # High-end artistic quality settings
            print(f"\n[+] Crafting Artistic Masterpiece: {term} ({season})...")
            full_prompt = f"{STYLE_PREFIX}, {prompt}"
            
            image = pipe(
                prompt=full_prompt,
                negative_prompt="photorealistic, 3d render, plastic, neon, lowres, ugly, blurry, text, watermark, logo, grainy, signature, messy drawing, oversaturated, artificial textures, digital art look, bad layout",
                num_inference_steps=50, # Double steps for extreme detail
                guidance_scale=9.5,    # Slightly higher for better prompt adherence
                width=512,
                height=896
            ).images[0]
            
            # High-quality save
            image.save(file_path, "WEBP", quality=100) # Maximum quality
            print(f"    - Saved: {file_path}")

if __name__ == "__main__":
    generate_images()
    print("\nDreamShaper Generation Complete! Check assets/gallery_dreamshaper folder.")
