"""Local SDXL art generator.

Usage:
  python gen.py prompts.json [name ...]          generate (SDXL) + post-process
  python gen.py prompts.json --post [name ...]   re-run post-processing on existing raw images only

prompts.json entries:
  {"name": "pet-fox", "prompt": "...", "w": 1024, "h": 1024, "seed": 1,
   "cutout": true,                     # remove background -> art/cut/<name>.png
   "erase": [[[x, y], ...], ...],      # optional polygons (raw px) forced transparent
   "neg": "face, legs",                # optional extra negative prompt for this entry
   "export": "pets/fox", "size": 512}  # optional -> ../../public/assets/img/<export>.webp, longest side = size
Pass names to process only those entries.
"""
import json, sys, time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

STYLE = ("children's picture book illustration, soft painterly cartoon, rounded shapes, "
         "warm pastel colours, gentle lighting, clean outlines, cute, high quality")
NEGATIVE = ("photo, realistic, photorealistic, product photo, flat vector, clip art, 3d render, text, letters, watermark, signature, scary, dark, "
            "blurry, deformed, extra limbs, ugly, lowres")
SPRITE_NEGATIVE = ("multiple animals, crowd, pattern, duplicate, background scenery, frame, border, "
                   "sticker, white outline, white border, drop shadow, ground shadow")
HERE = Path(__file__).parent
OUT = HERE / "art"
PUBLIC = HERE.parent.parent / "public" / "assets" / "img"

_cut_session = None


def cutout(img, erase=()):
    """Background removal + cleanup: drop haze and stray islands, erase polygons."""
    global _cut_session
    from rembg import new_session, remove
    from scipy import ndimage
    # ponytail: CPU on purpose; on GPU it hogs VRAM and SDXL spills into shared memory (20x slower).
    # birefnet keeps fine parts (ears) that isnet drops.
    _cut_session = _cut_session or new_session("birefnet-general", providers=["CPUExecutionProvider"])
    a = np.array(remove(img, session=_cut_session, only_mask=True))
    # colour always comes from the original: rembg's own cutout blacks out/darkens soft edges
    rgba = np.dstack([np.array(img.convert("RGB")), a])
    if erase:
        m = Image.new("L", img.size, 0)
        for poly in erase:
            ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=255)
        m = np.array(m.filter(ImageFilter.GaussianBlur(2))) / 255
        a = (a * (1 - m)).astype(np.uint8)
    solid = a > 128
    lab, n = ndimage.label(solid)
    if n:
        big = lab == (np.bincount(lab.ravel())[1:].argmax() + 1)
        a[~ndimage.binary_dilation(big, iterations=2)] = 0  # keep only the main subject
    a[a < 24] = 0
    rgba[..., 3] = a
    return Image.fromarray(rgba)


def post(e, img):
    if e.get("cutout"):
        img = cutout(img, e.get("erase", ()))
        img.save(OUT / "cut" / f"{e['name']}.png")
        img = img.crop(img.getbbox())  # trim transparent margins
    if e.get("export"):
        img.thumbnail((e.get("size", 1024),) * 2, Image.LANCZOS)
        dest = PUBLIC / f"{e['export']}.webp"
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, quality=88, method=6)


def load_pipe():
    import torch
    from diffusers import AutoencoderKL, StableDiffusionXLPipeline
    # ponytail: fp16-fix VAE avoids SDXL's black-image NaNs in fp16
    vae = AutoencoderKL.from_pretrained("madebyollin/sdxl-vae-fp16-fix", torch_dtype=torch.float16)
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0", vae=vae,
        torch_dtype=torch.float16, variant="fp16", use_safetensors=True)
    # ponytail: model offload needs ~5.5 GB free VRAM; below that SDXL spills into shared memory and
    # crawls, so stream layers instead (slower per step, but never stalls). Close other GPU apps for speed.
    free_gb = torch.cuda.mem_get_info()[0] / 2**30
    if free_gb >= 5.5:
        pipe.enable_model_cpu_offload()
    else:
        pipe.enable_sequential_cpu_offload()
    print(f"free VRAM {free_gb:.1f} GB -> {'model' if free_gb >= 5.5 else 'sequential'} offload", flush=True)
    return pipe


def main():
    entries = json.loads(Path(sys.argv[1]).read_text())
    args = sys.argv[2:]
    post_only = "--post" in args
    only = set(args) - {"--post"}
    entries = [e for e in entries if not only or e["name"] in only]
    (OUT / "raw").mkdir(parents=True, exist_ok=True)
    (OUT / "cut").mkdir(parents=True, exist_ok=True)

    if post_only:
        for e in entries:
            post(e, Image.open(OUT / "raw" / f"{e['name']}.png").convert("RGB"))
            print("post", e["name"], flush=True)
        return

    import torch
    pipe = load_pipe()
    for e in entries:
        t0 = time.time()
        neg = NEGATIVE + (", " + SPRITE_NEGATIVE if e.get("cutout") else "") + (", " + e["neg"] if "neg" in e else "")
        img = pipe(
            prompt=f"{e['prompt']}, {STYLE}",
            negative_prompt=neg,
            width=e.get("w", 1024), height=e.get("h", 1024),
            num_inference_steps=e.get("steps", 30), guidance_scale=e.get("cfg", 6.5),
            generator=torch.Generator("cpu").manual_seed(e.get("seed", 0)),
        ).images[0]
        img.save(OUT / "raw" / f"{e['name']}.png")
        post(e, img)
        print("done", e["name"], f"{time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
