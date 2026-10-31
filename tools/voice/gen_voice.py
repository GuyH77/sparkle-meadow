"""Generate voice clips for every line in src/lines.json -> public/assets/voice/<key>.mp3.

Usage: python gen_voice.py [--force] [key ...]   (skips existing clips unless --force)
Run with the artgen venv: tools/artgen/.venv/Scripts/python tools/voice/gen_voice.py
"""
import asyncio, json, sys
from pathlib import Path

import edge_tts

VOICE, RATE, PITCH = "en-GB-MaisieNeural", "-8%", "+0Hz"  # the pet's voice: a young British girl, slowed a touch
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "voice"


async def main():
    lines = json.loads((ROOT / "src" / "lines.json").read_text())
    args = sys.argv[1:]
    force = "--force" in args
    only = set(args) - {"--force"}
    OUT.mkdir(parents=True, exist_ok=True)
    for key, text in lines.items():
        dest = OUT / f"{key}.mp3"
        if (only and key not in only) or (dest.exists() and dest.stat().st_size and not force):  # empty = interrupted write
            continue
        await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(dest))
        print(key)


asyncio.run(main())
