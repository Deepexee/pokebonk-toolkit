import io
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SC = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/"
GAME = "https://pokebonk.com/assets/"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "PokeBonkToolkit"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def anim_info(xml, name):
    anims = {a.findtext("Name"): a for a in xml.find("Anims")}
    a = anims[name]
    while a.find("CopyOf") is not None:
        a = anims[a.findtext("CopyOf")]
    return {
        "fw": int(a.findtext("FrameWidth")), "fh": int(a.findtext("FrameHeight")),
        "d": [int(d.text) for d in a.find("Durations")],
        "file": a.findtext("Name"),
    }

def pads(sheet, y, fw, fh, rows):
    out = []
    for r in range(rows):
        box = sheet.crop((0, y + r * fh, fw, y + (r + 1) * fh)).getchannel("A").getbbox()
        out.append(fh - box[3] if box else 0)
    return out

def thumb(ground, frame, size=256):
    tile = ground.resize((ground.width * 2, ground.height * 2), Image.NEAREST)
    bg = Image.new("RGBA", (size, size))
    for x in range(0, size, tile.width):
        for y in range(0, size, tile.height):
            bg.paste(tile, (x, y))
    vig = Image.new("L", (size, size), 0)
    ImageDraw.Draw(vig).ellipse((-40, -40, size + 40, size + 40), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(40))
    bg = Image.composite(bg, Image.alpha_composite(bg, Image.new("RGBA", (size, size), (10, 12, 26, 150))), vig)
    mon = frame.crop(frame.getchannel("A").getbbox())
    k = max(1, min(150 // mon.width, 150 // mon.height))
    mon = mon.resize((mon.width * k, mon.height * k), Image.NEAREST)
    mx, my = (size - mon.width) // 2, (size - mon.height) // 2 + 4
    sh = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    w = int(mon.width * 0.75)
    fy = my + mon.height - 8
    ImageDraw.Draw(sh).ellipse((size // 2 - w // 2, fy - 12, size // 2 + w // 2, fy + 14), fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    sil = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sil.paste((0, 0, 0, 170), (mx + 5, my + 7), mon.getchannel("A"))
    sil = sil.filter(ImageFilter.GaussianBlur(5))
    out = Image.alpha_composite(Image.alpha_composite(bg, sh), sil)
    out.alpha_composite(mon, (mx, my))
    return out.convert("RGB")

def main():
    out = Path(sys.argv[1])
    sheets = {}
    for arg in sys.argv[2:]:
        dex, biome = arg.split(":")
        n = "%04d" % int(dex)
        xml = ET.fromstring(get(SC + "sprite/%s/AnimData.xml" % n))
        walk, idle = anim_info(xml, "Walk"), anim_info(xml, "Idle")
        wimg = Image.open(io.BytesIO(get(SC + "sprite/%s/%s-Anim.png" % (n, walk["file"])))).convert("RGBA")
        iimg = Image.open(io.BytesIO(get(SC + "sprite/%s/%s-Anim.png" % (n, idle["file"])))).convert("RGBA")
        sheet = Image.new("RGBA", (max(wimg.width, iimg.width), wimg.height + iimg.height), (0, 0, 0, 0))
        sheet.paste(wimg, (0, 0))
        sheet.paste(iimg, (0, wimg.height))
        (out / "pmd").mkdir(parents=True, exist_ok=True)
        sheet.save(out / "pmd" / ("%s.png" % dex))
        entry = {}
        for key, info, y, img in (("walk", walk, 0, wimg), ("idle", idle, wimg.height, iimg)):
            rows = img.height // info["fh"]
            entry[key] = {"y": y, "fw": info["fw"], "fh": info["fh"], "n": img.width // info["fw"], "rows": rows,
                          "d": info["d"], "pad": pads(sheet, y, info["fw"], info["fh"], rows)}
        sheets[dex] = entry
        (out / "portraits").mkdir(parents=True, exist_ok=True)
        (out / "portraits" / ("%s.png" % dex)).write_bytes(get(SC + "portrait/%s/Normal.png" % n))
        ground = Image.open(io.BytesIO(get(GAME + "env/%s/ground.png" % biome))).convert("RGBA")
        first_idle = sheet.crop((0, wimg.height, idle["fw"], wimg.height + idle["fh"]))
        (out / "shots").mkdir(parents=True, exist_ok=True)
        thumb(ground, first_idle).save(out / "shots" / ("%s-%s.png" % (biome, dex)))
        print("ok", dex, biome, entry["idle"]["fw"], entry["idle"]["fh"], entry["idle"]["n"])
    with open(out / "extra-sprites.js", "w", encoding="utf-8") as f:
        f.write("// Pokémon that are not in PokéBonk, from PMD SpriteCollab (CC BY-NC 4.0)\n")
        f.write("Object.assign(window.PB_SHEETS, " + json.dumps(sheets, separators=(",", ":")) + ");\n")

if __name__ == "__main__":
    main()
