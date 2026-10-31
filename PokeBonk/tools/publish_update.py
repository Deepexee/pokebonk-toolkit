import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLKIT_FILES = ("hub.js", "typedex.json", "maps.json", "rpc_index.json")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--exe")
    ap.add_argument("--apk")
    ap.add_argument("--base", default="https://pokebonk.deepexe.fr/update/")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    base = args.base.rstrip("/") + "/"
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8-sig"))
    latest_path = out / "latest.json"
    latest = json.loads(latest_path.read_text(encoding="utf-8-sig")) if latest_path.exists() else {}

    build = int(version["toolkit"])
    folder = out / "toolkit" / str(build)
    folder.mkdir(parents=True, exist_ok=True)
    files = {}
    for name in TOOLKIT_FILES:
        shutil.copyfile(ROOT / name, folder / name)
        files[name] = {"sha256": sha256(folder / name), "size": (folder / name).stat().st_size}
    latest["toolkit"] = {
        "build": build,
        "min_app": version.get("toolkit_min_app", version["app"]),
        "min_android": int(version.get("toolkit_min_android", 0)),
        "base": "%stoolkit/%d/" % (base, build),
        "files": files,
    }

    if args.exe:
        dest = out / "app" / version["app"] / "PokeBonkApp.exe"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(args.exe, dest)
        latest["app"] = {
            "version": version["app"],
            "url": "%sapp/%s/PokeBonkApp.exe" % (base, version["app"]),
            "sha256": sha256(dest),
            "size": dest.stat().st_size,
        }

    if args.apk:
        code = int(version["android"]["code"])
        dest = out / "android" / str(code) / "PokeBonk.apk"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(args.apk, dest)
        latest["android"] = {
            "code": code,
            "name": version["android"]["name"],
            "url": "%sandroid/%d/PokeBonk.apk" % (base, code),
            "sha256": sha256(dest),
            "size": dest.stat().st_size,
        }

    latest_path.write_text(json.dumps(latest, indent=2), encoding="utf-8")
    print(json.dumps(latest, indent=2))


if __name__ == "__main__":
    main()
