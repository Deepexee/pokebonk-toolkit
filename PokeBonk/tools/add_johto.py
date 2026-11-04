import json
import sys
import urllib.request
from pathlib import Path

TYPEDEX = Path(__file__).resolve().parent.parent / "typedex.json"
LAST = 251


def load_game():
    req = urllib.request.Request("https://pokebonk.com/data/pokemon.json", headers={"User-Agent": "PokeBonkToolkit"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    game = load_game()
    by_id = {}
    for mon in (game.values() if isinstance(game, dict) else game):
        if isinstance(mon, dict) and mon.get("id"):
            by_id[mon["id"]] = mon
    data = json.loads(TYPEDEX.read_text(encoding="utf-8-sig"))
    ids = data["ids"]
    pokemon = data["pokemon"]
    id_to_name = {v: k for k, v in ids.items()}
    for i in range(152, LAST + 1):
        mon = by_id.get(i)
        if not mon:
            continue
        name = mon["name"]
        ids[name] = i
        pokemon[name] = [t.capitalize() for t in mon["types"]]
        id_to_name[i] = name

    children = {}
    for i in range(1, LAST + 1):
        mon = by_id.get(i)
        if not mon:
            continue
        parent = mon.get("evoFrom")
        if parent and 1 <= parent <= LAST:
            children.setdefault(parent, []).append(i)

    def root_of(i):
        seen = set()
        while True:
            mon = by_id.get(i)
            parent = mon.get("evoFrom") if mon else None
            if not parent or parent in seen or not (1 <= parent <= LAST):
                return i
            seen.add(i)
            i = parent

    families = {}
    for i in range(1, LAST + 1):
        if i in by_id:
            families.setdefault(root_of(i), []).append(i)

    def ordered(root):
        out = []
        queue = [root]
        while queue:
            cur = queue.pop(0)
            out.append(cur)
            queue.extend(sorted(children.get(cur, [])))
        return out

    lines = []
    for root in sorted(families):
        members = ordered(root)
        names = [id_to_name[m] for m in members if m in id_to_name]
        branch = any(len(children.get(m, [])) > 1 for m in members)
        lines.append({"names": names, "branch": branch})
    data["lines"] = lines
    TYPEDEX.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("pokemon", len(pokemon), "lines", len(lines), "ids", len(ids))


if __name__ == "__main__":
    main()
