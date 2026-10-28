import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

BASE = "https://pokebonk.com/assets/"
BIOMES = ["forest", "desert", "coast", "glacier", "tower", "graveyard", "volcano"]
SIZE = 256
_cache = {}

def fetch(path):
    if path not in _cache:
        req = urllib.request.Request(BASE + path, headers={"User-Agent": "PokeBonkToolkit"})
        with urllib.request.urlopen(req, timeout=20) as r:
            _cache[path] = Image.open(io.BytesIO(r.read())).convert("RGBA")
    return _cache[path]

_sheets = None

def idle_frame(dex, shiny=False):
    global _sheets
    if _sheets is None:
        req = urllib.request.Request("https://pokebonk.com/data/sprites.json",
                                     headers={"User-Agent": "PokeBonkToolkit"})
        with urllib.request.urlopen(req, timeout=20) as r:
            _sheets = json.loads(r.read())
    a = _sheets[str(dex)]["anims"]
    an = a.get("idle") or a.get("walk")
    sheet = fetch(("pmd-shiny/%d.png" if shiny else "pmd/%d.png") % dex)
    return sheet.crop((0, an["y"], an["fw"], an["y"] + an["fh"]))

def crop_alpha(img):
    box = img.getchannel("A").getbbox()
    return img.crop(box) if box else img

def make(biome, dex, shiny=False):
    tile = fetch("env/%s/ground.png" % biome)
    tile = tile.resize((tile.width * 2, tile.height * 2), Image.NEAREST)
    bg = Image.new("RGBA", (SIZE, SIZE))
    for x in range(0, SIZE, tile.width):
        for y in range(0, SIZE, tile.height):
            bg.paste(tile, (x, y))
    vig = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(vig).ellipse((-40, -40, SIZE + 40, SIZE + 40), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(40))
    dark = Image.new("RGBA", (SIZE, SIZE), (10, 12, 26, 150))
    bg = Image.composite(bg, Image.alpha_composite(bg, dark), vig)

    mon = crop_alpha(idle_frame(dex, shiny))
    k = max(1, min(int(150 / mon.width), int(150 / mon.height)))
    mon = mon.resize((mon.width * k, mon.height * k), Image.NEAREST)
    mx = (SIZE - mon.width) // 2
    my = (SIZE - mon.height) // 2 + 4

    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    w = int(mon.width * 0.75)
    fy = my + mon.height - 8
    d.ellipse((SIZE // 2 - w // 2, fy - 12, SIZE // 2 + w // 2, fy + 14), fill=(0, 0, 0, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    sil = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sil.paste((0, 0, 0, 170), (mx + 5, my + 7), mon.getchannel("A"))
    sil = sil.filter(ImageFilter.GaussianBlur(5))

    out = Image.alpha_composite(bg, shadow)
    out = Image.alpha_composite(out, sil)
    out.alpha_composite(mon, (mx, my))
    return out.convert("RGB")

def main():
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    pairs = [p.split(":") for p in sys.argv[2:]] or [
        [b, str(i)] + s for b in BIOMES for i in range(1, 152) for s in ([], ["s"])]
    made = {}
    for p in pairs:
        biome, dex, shiny = p[0], int(p[1]), len(p) > 2
        name = "%s-%d%s.png" % (biome, dex, "-s" if shiny else "")
        try:
            img = make(biome, dex, shiny)
            img.quantize(255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(
                out_dir / name, optimize=True)
            made.setdefault(biome, []).append(("s" if shiny else "") + str(dex))
        except Exception as e:
            print("skip", name, e)
    with open(out_dir / "index.json", "w", encoding="utf-8") as f:
        json.dump(made, f, separators=(",", ":"))
    print("done", sum(len(v) for v in made.values()), "of", len(pairs))

if __name__ == "__main__":
    main()
