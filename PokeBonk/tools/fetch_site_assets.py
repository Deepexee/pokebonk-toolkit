import json
import sys
import urllib.request
from pathlib import Path

BASE = "https://pokebonk.com/"
OUT = Path(sys.argv[1])
WALKERS = [1, 4, 7, 25, 39, 133, 54, 43, 16, 52, 35, 60, 143, 74, 95]
FILES = [
    "assets/env/forest/atlas.png", "assets/env/forest/ground.png", "assets/env/forest/path.png",
    "assets/env/forest/cliff.png",
    "assets/items/poke-ball.png", "assets/items/nugget.png",
    "assets/ui/icons/research.png", "assets/ui/icons/record.png", "assets/ui/icons/map-portal.png",
    "assets/ui/icons/check.png",
] + ["assets/ui/types/%s.png" % t for t in ("fire", "water", "grass", "electric", "psychic", "dragon")] \
  + ["assets/pmd/%d.png" % i for i in WALKERS] + ["assets/portraits/%d.png" % i for i in WALKERS]

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "PokeBonkToolkit"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

for f in FILES:
    dest = OUT / f.replace("assets/", "", 1)
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        dest.write_bytes(get(f))
    except Exception as e:
        print("skip", f, e)

from PIL import Image

sheets = json.loads(get("data/sprites.json"))
walk = {}
for i in WALKERS:
    a = sheets.get(str(i), {}).get("anims", {})
    walk[i] = {k: dict(a[k]) for k in ("walk", "idle") if k in a}
    sheet = Image.open(OUT / "pmd" / ("%d.png" % i)).convert("RGBA")
    for an in walk[i].values():
        pads = []
        for row in range(an.get("rows", 8)):
            top = an["y"] + row * an["fh"]
            box = sheet.crop((0, top, an["fw"], top + an["fh"])).getchannel("A").getbbox()
            pads.append(an["fh"] - box[3] if box else 0)
        an["pad"] = pads
atlas = json.loads(get("assets/env/forest/atlas.json"))
with open(OUT / "sprites.js", "w", encoding="utf-8") as fh:
    fh.write("window.PB_SHEETS=" + json.dumps(walk, separators=(",", ":")) + ";\n")
    fh.write("window.PB_ATLAS=" + json.dumps(atlas["sprites"], separators=(",", ":")) + ";\n")
print("ok", len(FILES))
