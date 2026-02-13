import os
import torch
import re
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from PIL import Image

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPT_DIR = os.path.join(BASE_DIR, "scripts", "prompts")
OUTPUT_DIR = os.path.join(BASE_DIR, "assets", "gallery", "spring")

def load_prompt_from_md(filename):
    path = os.path.join(PROMPT_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract Prompt and Negative Prompt using regex
    prompt_match = re.search(r'## 💡 核心提示詞 \(Prompt\)\n(.*?)\n\n##', content, re.DOTALL)
    neg_match = re.search(r'## 🚫 排除項 \(Negative Prompt\)\n(.*?)$', content, re.DOTALL)
    
    prompt = prompt_match.group(1).strip() if prompt_match else ""
    neg_prompt = neg_match.group(1).strip() if neg_match else ""
    
    return prompt, neg_prompt

def generate_masterpiece(md_file, term_name):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    prompt, neg_prompt = load_prompt_from_md(md_file)
    if not prompt:
        print(f"Error: Could not load prompt from {md_file}")
        return

    model_id = "Lykon/dreamshaper-8"
    print(f"\n[+] Loading {model_id} for {term_name} Masterpiece...")

    pipe = StableDiffusionPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.float16,
        safety_checker=None
    )
    
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config,
        use_karras_sigmas=True,
        algorithm_type="dpmsolver++"
    )
    
    pipe = pipe.to(device)

    print(f"[⌛] Crafting {term_name} with extreme precision (50 steps)...")
    
    # Higher guidance scale for "Soulful/Masterpiece" feel
    image = pipe(
        prompt=prompt,
        negative_prompt=neg_prompt,
        num_inference_steps=50,
        guidance_scale=11.5,
        width=512,
        height=896
    ).images[0]

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    save_path = os.path.join(OUTPUT_DIR, f"{term_name}_Masterpiece.webp")
    image.save(save_path, "WEBP", quality=100)
    print(f"\n[✨] SUCCESS! Your superior {term_name} image is here: {save_path}")

if __name__ == "__main__":
    generate_masterpiece("04_chunfen.md", "春分")
