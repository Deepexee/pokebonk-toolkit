import json
import os
import struct
import sys
import threading
import time
import uuid
import webview
from urllib.parse import quote, urlparse

HOME = "https://pokebonk.com"
ALLOWED = {"pokebonk.com", "www.pokebonk.com"}

DATA_DIR = os.environ.get("POKEBONK_DATA_DIR") or os.path.join(
    os.environ.get("LOCALAPPDATA", os.path.expanduser("~")), "PokeBonk")
os.makedirs(DATA_DIR, exist_ok=True)
RUNS_FILE = os.path.join(DATA_DIR, "runs.json")

LOG_FILE = os.path.join(DATA_DIR, "log.txt")
_last_log = None

def log(msg):
    global _last_log
    if msg == _last_log:
        return
    _last_log = msg
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(time.strftime("%H:%M:%S ") + msg + "\n")
    except Exception:
        pass

try:
    open(LOG_FILE, "w", encoding="utf-8").close()
except Exception:
    pass

DISCORD_CLIENT_ID = "1564177251061207051"

DISCORD_IMAGE = "pokebonk"

DISCORD_PROFILE_URL = ""

CLIENT_URL = "https://pokebonk.deepexe.fr"

TITLE = "PokeBonk"
ICON_FILE = "pokebonk.ico"
TYPEDEX_FILE = "typedex.json"
MAPS_FILE = "maps.json"
HUB_FILE = "hub.js"

VOLUME_JS = r"""
(function () {
  if (window.__pbVol) return;
  window.__pbVol = true;

  var KEY = 'pokebonk_volume';
  var vol = 1;
  try {
    var saved = parseFloat(localStorage.getItem(KEY));
    if (!isNaN(saved)) vol = Math.min(1, Math.max(0, saved));
  } catch (e) {}
  var lastNonZero = vol > 0 ? vol : 1;

  var media = new Set();
  var vDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
  function track(m) {
    if (m.__pbReq === undefined) m.__pbReq = vDesc.get.call(m);
    media.add(m);
    vDesc.set.call(m, m.__pbReq * vol);
  }
  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    configurable: true,
    get: function () { return this.__pbReq !== undefined ? this.__pbReq : vDesc.get.call(this); },
    set: function (v) { this.__pbReq = v; media.add(this); vDesc.set.call(this, v * vol); }
  });
  var origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { track(this); return origPlay.apply(this, arguments); };
  document.querySelectorAll('audio,video').forEach(track);

  var masters = [];
  var masterOf = new WeakMap();
  var origConnect = AudioNode.prototype.connect;
  function masterFor(ctx) {
    var g = masterOf.get(ctx);
    if (!g) {
      g = ctx.createGain();
      g.__pbMaster = true;
      g.gain.value = vol;
      origConnect.call(g, ctx.destination);
      masterOf.set(ctx, g);
      masters.push(g);
    }
    return g;
  }
  AudioNode.prototype.connect = function (dest) {
    var args = Array.prototype.slice.call(arguments);
    if (dest instanceof AudioDestinationNode && !this.__pbMaster) {
      args[0] = masterFor(dest.context);
    }
    return origConnect.apply(this, args);
  };

  function setVol(v) {
    vol = Math.min(1, Math.max(0, v));
    if (vol > 0) lastNonZero = vol;
    try { localStorage.setItem(KEY, String(vol)); } catch (e) {}
    media.forEach(function (m) {
      if (m.__pbReq === undefined) m.__pbReq = vDesc.get.call(m);
      vDesc.set.call(m, m.__pbReq * vol);
    });
    masters.forEach(function (g) { g.gain.value = vol; });
    try { if (window.Howler && window.Howler.volume) window.Howler.volume(vol); } catch (e) {}
    refresh();
    if (window.__PBHubVolume) window.__PBHubVolume();
  }

  window.__pbVolApi = {
    get: function () { return vol; },
    set: setVol,
    toggle: function () { setVol(vol === 0 ? lastNonZero : 0); }
  };

  var box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', right: '12px', bottom: '12px', zIndex: '2147483647',
    display: 'none', alignItems: 'center', gap: '8px', padding: '6px 12px',
    background: 'rgba(34,40,58,0.95)', borderRadius: '999px', color: '#e7eaf6',
    boxShadow: '0 4px 14px rgba(0,0,0,.45)', font: '900 14px Nunito, system-ui, sans-serif',
    userSelect: 'none'
  });
  setTimeout(function () { if (!window.__PBHub) box.style.display = 'flex'; }, 4000);
  var icon = document.createElement('span');
  Object.assign(icon.style, { cursor: 'pointer', width: '22px', textAlign: 'center' });
  var slider = document.createElement('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.step = '1';
  Object.assign(slider.style, { width: '110px', cursor: 'pointer', display: 'none' });

  function refresh() {
    icon.textContent = vol === 0 ? '\uD83D\uDD07' : vol < 0.34 ? '\uD83D\uDD08' : vol < 0.67 ? '\uD83D\uDD09' : '\uD83D\uDD0A';
    slider.value = String(Math.round(vol * 100));
  }
  icon.addEventListener('click', function () { setVol(vol === 0 ? lastNonZero : 0); });
  slider.addEventListener('input', function () { setVol(parseInt(slider.value, 10) / 100); });
  box.addEventListener('mouseenter', function () { slider.style.display = 'block'; });
  box.addEventListener('mouseleave', function () { slider.style.display = 'none'; });
  box.appendChild(icon);
  box.appendChild(slider);
  (document.body || document.documentElement).appendChild(box);
  refresh();
  setVol(vol);
})();
"""

def resource_path(name):
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, name)

TYPEDEX = None
MAPS = None
HUB_JS = ""

RPC_BASE = "https://raw.githubusercontent.com/Deepexee/PokebonkImage/main/"
RPC_INDEX = {}
try:
    with open(resource_path("rpc_index.json"), encoding="utf-8") as f:
        RPC_INDEX = {k: set(v) for k, v in json.load(f).items()}
except Exception as e:
    log("Discord: no picture list (%r), using map + portrait" % (e,))
try:
    with open(resource_path(TYPEDEX_FILE), encoding="utf-8") as f:
        TYPEDEX = json.load(f)
    with open(resource_path(MAPS_FILE), encoding="utf-8") as f:
        MAPS = json.load(f)
    with open(resource_path(HUB_FILE), encoding="utf-8") as f:
        HUB_JS = f.read()
    log("Hub: loaded %d Pokemon (data %s) and %d regions (data %s)"
        % (len(TYPEDEX.get("pokemon", {})), TYPEDEX.get("version", "?"),
           len(MAPS.get("regions", [])), MAPS.get("version", "?")))
except Exception as e:
    log("Hub: could not load the data files (%r)" % (e,))

def inject_hub():
    if not (TYPEDEX and HUB_JS):
        return
    try:
        window.evaluate_js("window.__PBTypedex=%s;window.__PBMaps=%s;%s"
                           % (json.dumps(TYPEDEX), json.dumps(MAPS) if MAPS else "null", HUB_JS))
        ready = window.evaluate_js("!!(window.__PBHub && document.getElementById('pb-hub-host'))")
        log("Hub: overlay %s" % ("ready" if ready else "did not start"))
    except Exception as e:
        log("Hub: injection failed (%r)" % (e,))

class Api:

    _lock = threading.Lock()

    def save_runs(self, text):
        try:
            data = json.loads(text)
            if not isinstance(data, list):
                return False
            tmp = RUNS_FILE + ".tmp"
            with self._lock:
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
                os.replace(tmp, RUNS_FILE)
            return True
        except Exception as e:
            log("Runs: could not save (%r)" % (e,))
            return False

    def load_runs(self):
        try:
            with open(RUNS_FILE, encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return "[]"
        except Exception as e:
            log("Runs: could not read (%r)" % (e,))
            return "[]"

    _fullscreen = False

    def set_fullscreen(self, on):
        try:
            on = bool(on)
            if on != Api._fullscreen:
                window.toggle_fullscreen()
                Api._fullscreen = on
                log("Window: fullscreen %s" % ("on" if on else "off"))
        except Exception as e:
            log("Window: fullscreen failed (%r)" % (e,))
        return Api._fullscreen

    def open_data_folder(self):
        try:
            os.startfile(DATA_DIR)
        except Exception as e:
            log("Runs: could not open the folder (%r)" % (e,))

def set_window_icon():
    try:
        import ctypes

        ico = resource_path(ICON_FILE)
        if os.name != "nt" or not os.path.exists(ico):
            return
        user32 = ctypes.windll.user32
        user32.FindWindowW.restype = ctypes.c_void_p
        user32.LoadImageW.restype = ctypes.c_void_p
        user32.SendMessageW.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_size_t, ctypes.c_void_p]
        hwnd = None
        for _ in range(20):
            hwnd = user32.FindWindowW(None, TITLE)
            if hwnd:
                break
            time.sleep(0.25)
        if not hwnd:
            log("Icon: window not found")
            return
        for kind, size in ((0, 16), (1, 32)):
            hicon = user32.LoadImageW(None, ico, 1, size, size, 0x10)
            if hicon:
                user32.SendMessageW(hwnd, 0x80, kind, hicon)
            else:
                log("Icon: could not load the .ico file")
        log("Icon: window icon set")
    except Exception as e:
        log("Icon: error %r" % (e,))

class DiscordPipe:

    def __init__(self, index):
        self.f = open(r"\\.\pipe\discord-ipc-%d" % index, "r+b", buffering=0)
        self._send, self._recv = self.f.write, self.f.read

    def send(self, opcode, payload):
        data = json.dumps(payload).encode("utf-8")
        self._send(struct.pack("<II", opcode, len(data)) + data)

    def _read(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self._recv(n - len(buf))
            if not chunk:
                raise ConnectionError("Discord closed the connection")
            buf += chunk
        return buf

    def recv(self):
        opcode, n = struct.unpack("<II", self._read(8))
        return opcode, json.loads(self._read(n).decode("utf-8") or "{}")

    def close(self):
        try:
            self.f.close()
        except Exception:
            pass

def discord_connect():
    last = None
    for i in range(10):
        try:
            return DiscordPipe(i)
        except Exception as e:
            last = e
    raise ConnectionError("no running Discord found (%r)" % (last,))

stop = threading.Event()
discord_pipe = {"pipe": None}

DISCORD_TEXT = {
    "pl": {"menu": "W menu", "play": "Zagraj w PokeBonk", "profile": "Mój profil", "lvl": "Poz.",
           "victory": "ZWYCIĘSTWO!!!", "defeat": "Koniec gry", "survived": "Przetrwał"},
    "en": {"menu": "In the menu", "play": "Play PokeBonk", "profile": "My profile", "lvl": "Lv.",
           "victory": "VICTORY!!!", "defeat": "Run over", "survived": "Survived"},
    "fr": {"menu": "Dans le menu", "play": "Jouer à PokeBonk", "profile": "Mon profil", "lvl": "N.",
           "victory": "VICTOIRE !!!", "defeat": "Partie terminée", "survived": "A survécu"},
}

PROBE_JS = r"""
(function () {
  if (window.__PBProbe) return "ok";
  function vis(el) {
    if (!el) return false;
    return el.checkVisibility ? el.checkVisibility() : !!el.getClientRects().length;
  }
  window.__PBProbe = function () {
    var out = { menu: false, lang: "en", tag: null, ready: false, run: null };
    try {
      var cv = document.getElementById("game");
      out.ready = document.readyState === "complete" && !!cv;
      out.menu = vis(document.querySelector(".screen.mm"));
      var tile = document.querySelector(".mm-item.clan,.tile.clan");
      if (tile && vis(tile)) {
        var m = (tile.textContent || "").match(/\[([^\]]{2,8})\]/);
        if (m) out.tag = m[1];
      }
      var saved = localStorage.getItem("pokebonk_hub_lang");
      if (saved) out.lang = saved;
      var sess = null;
      try { sess = JSON.parse(localStorage.getItem("pb.session") || "null"); } catch (e) {}
      if (sess && sess.name && !sess.guest) out.who = String(sess.name).trim().slice(0, 40);
      if (window.__PBState) out.run = JSON.parse(window.__PBState);
    } catch (e) {}
    return JSON.stringify(out);
  };
  return "ok";
})();
"""

POLL_JS = "window.__PBProbe ? window.__PBProbe() : null"

POLL_EVERY = 2.0
MIN_GAP = 15.0
KEEPALIVE = 300.0
RETRY_AFTER = 5.0

def page_state():
    try:
        raw = window.evaluate_js(POLL_JS)
        if raw is None:
            window.evaluate_js(PROBE_JS)
            raw = window.evaluate_js(POLL_JS)
        data = json.loads(raw) if isinstance(raw, str) and raw else None
        if isinstance(data, dict):
            return data
    except Exception as e:
        log("Discord: could not read the page state (%r)" % (e,))
    return None

def short_count(n):
    n = int(n or 0)
    if n >= 1_000_000:
        return "%.1fM" % (n / 1_000_000)
    if n >= 10_000:
        return "%.1fk" % (n / 1000)
    return str(n)

def rpc_thumb(biome, sp, skin):
    if not (RPC_INDEX and biome and sp):
        return None
    have = RPC_INDEX.get(biome) or ()
    if skin == "shiny" and ("s%d" % sp) in have:
        return "%s%s-%d-s.png" % (RPC_BASE, biome, sp)
    if str(sp) in have:
        return "%s%s-%d.png" % (RPC_BASE, biome, sp)
    return None

def build_activity(st, texts, last, started):
    run = (st or {}).get("run") or {}
    activity = {}
    if run.get("result"):
        name = run.get("spName") or "?"
        where = run.get("biomeName") or run.get("biome") or ""
        kills = run.get("killsText") or short_count(run.get("kills"))
        result = run["result"]
        head = texts["victory"] if result == "victory" else texts["survived"] if result == "survived" else texts["defeat"]
        activity["details"] = (head + (" · " + where if where else ""))[:128]
        activity["state"] = ("%s · %s %s · %s K.O. · %s" % (
            name, texts["lvl"], run.get("lvl", 1), kills, run.get("time") or "")).strip(" ·")[:128]
        assets = {}
        thumb = rpc_thumb(run.get("biome"), run.get("sp"), run.get("skin"))
        if result == "victory":
            assets["large_image"] = RPC_BASE + "victory.png"
            assets["large_text"] = "VICTORY!"
            if run.get("monImg"):
                assets["small_image"] = run["monImg"]
                assets["small_text"] = name[:128]
        elif thumb:
            assets["large_image"] = thumb
            assets["large_text"] = ("%s · %s" % (name, where))[:128]
        elif DISCORD_IMAGE:
            assets["large_image"] = DISCORD_IMAGE
        activity["assets"] = assets
        last["start"] = None
        key = ("result", result, run.get("sp"), run.get("time"))
        return activity, key
    if run.get("inRun"):
        mode = run.get("modeName") or "PokeBonk"
        where = run.get("biomeName") or run.get("biome") or ""
        name = run.get("spName") or "?"
        activity["details"] = (mode + (" · " + where if where else ""))[:128]
        activity["state"] = ("%s · %s %s · %s K.O." % (
            name, texts["lvl"], run.get("lvl", 1), short_count(run.get("kills")))).strip()[:128]
        start = int((run.get("start") or time.time() * 1000) / 1000)
        if not last.get("start") or abs(start - last["start"]) > 8:
            last["start"] = start
        activity["timestamps"] = {"start": last["start"]}
        assets = {}
        thumb = rpc_thumb(run.get("biome"), run.get("sp"), run.get("skin"))
        if thumb:
            assets["large_image"] = thumb
            assets["large_text"] = ("%s · %s" % (name, where))[:128]
        elif run.get("mapImg"):
            assets["large_image"] = run["mapImg"]
            assets["large_text"] = where[:128] or "PokeBonk"
        if run.get("monImg") and not thumb:
            assets["small_image"] = run["monImg"]
            assets["small_text"] = ("%s · %s %s" % (name, texts["lvl"], run.get("lvl", 1)))[:128]
        if not assets and DISCORD_IMAGE:
            assets = {"large_image": DISCORD_IMAGE, "large_text": "PokeBonk"}
        activity["assets"] = assets
        key = ("run", run.get("biome"), run.get("sp"), run.get("mode"))
    else:
        last["start"] = None
        activity["details"] = texts["menu"]
        if last.get("tag"):
            activity["state"] = "[" + last["tag"] + "]"
        activity["timestamps"] = {"start": started}
        if DISCORD_IMAGE:
            activity["assets"] = {"large_image": DISCORD_IMAGE, "large_text": "PokeBonk"}
        key = ("menu", last.get("tag"))
    return activity, key

def discord_status():
    if not DISCORD_CLIENT_ID:
        log("Discord: no application ID, status disabled")
        return
    started = int(time.time())
    use_buttons = True
    use_urls = True
    last = {"tag": None, "who": None, "profile": None, "start": None}
    sent = None
    sent_key = None
    sent_at = 0.0
    while True:
        pipe = None
        try:
            pipe = discord_connect()
            discord_pipe["pipe"] = pipe
            pipe.send(0, {"v": 1, "client_id": DISCORD_CLIENT_ID})
            opcode, resp = pipe.recv()
            if resp.get("evt") == "ERROR" or opcode == 2:
                raise ConnectionError("Discord rejected the application ID: %s" % (resp,))
            log("Discord: connected")
            sent = None
            while True:
                st = page_state()
                texts = DISCORD_TEXT.get((st or {}).get("lang"), DISCORD_TEXT["en"])
                if st and st.get("tag") and st["tag"] != last["tag"]:
                    last["tag"] = st["tag"]
                    log("Discord: clan tag: [%s]" % last["tag"])
                if st and st.get("who") and st["who"] != last["who"]:
                    last["who"] = st["who"]
                    last["profile"] = HOME + "/entrenador/" + quote(last["who"])
                    log("Discord: profile: %s" % last["profile"])

                activity, key = build_activity(st, texts, last, started)
                if not use_urls:
                    a = activity.get("assets", {})
                    for k in ("large_image", "small_image"):
                        if str(a.get(k, "")).startswith("http"):
                            a.pop(k, None)
                            a.pop(k.replace("image", "text"), None)
                    if DISCORD_IMAGE and "large_image" not in a:
                        a["large_image"] = DISCORD_IMAGE
                if use_buttons:
                    buttons = [{"label": "Get client", "url": CLIENT_URL}]
                    profile = DISCORD_PROFILE_URL or last["profile"]
                    if profile:
                        buttons.append({"label": texts["profile"], "url": profile})
                    else:
                        buttons.append({"label": texts["play"], "url": HOME})
                    activity["buttons"] = buttons

                payload = json.dumps(activity, sort_keys=True)
                now = time.time()
                wait = POLL_EVERY
                changed = payload != sent
                due = (key != sent_key) or (now - sent_at >= MIN_GAP)
                if st and ((changed and due) or now - sent_at >= KEEPALIVE):
                    pipe.send(1, {
                        "cmd": "SET_ACTIVITY",
                        "args": {"pid": os.getpid(), "activity": activity},
                        "nonce": str(uuid.uuid4()),
                    })
                    opcode, resp = pipe.recv()
                    if resp.get("evt") == "ERROR":
                        info = json.dumps(resp.get("data"), ensure_ascii=False)[:300]
                        log("Discord: status error: %s" % info)
                        low = info.lower()
                        if "rate" in low or "limit" in low:
                            pass
                        elif use_urls and "image" in low:
                            use_urls = False
                            log("Discord: image links rejected, using the app image instead")
                        elif use_buttons:
                            use_buttons = False
                            log("Discord: buttons rejected, retrying without them")
                        wait = RETRY_AFTER
                    else:
                        if key != sent_key:
                            log("Discord: %s / %s" % (activity.get("details"), activity.get("state", "-")))
                        sent = payload
                        sent_key = key
                        sent_at = now
                if stop.wait(wait):
                    return
        except Exception as e:
            log("Discord: %r (retrying soon)" % (e,))
            if pipe:
                pipe.close()
            if stop.wait(30):
                return

_shutdown_lock = threading.Lock()
_shutting_down = False

def shutdown():
    global _shutting_down
    with _shutdown_lock:
        if _shutting_down:
            return
        _shutting_down = True
    log("Shutdown: clearing the status")
    stop.set()
    pipe = discord_pipe["pipe"]
    if pipe:
        try:
            pipe.send(1, {
                "cmd": "SET_ACTIVITY",
                "args": {"pid": os.getpid(), "activity": None},
                "nonce": str(uuid.uuid4()),
            })
            time.sleep(0.5)
        except Exception as e:
            log("Shutdown: could not clear the status: %r" % (e,))
        pipe.close()
    log("App closed")
    os._exit(0)

FULLSCREEN_JS = r"""
(function () {
  if (window.__pbFs) return;
  window.__pbFs = true;
  var fsEl = null;
  function api() { return window.pywebview && window.pywebview.api; }
  function fire() {
    document.dispatchEvent(new Event("fullscreenchange"));
    document.dispatchEvent(new Event("webkitfullscreenchange"));
  }
  function setFs(on) {
    var a = api();
    if (a && a.set_fullscreen) a.set_fullscreen(on);
    fsEl = on ? document.documentElement : null;
    fire();
    return Promise.resolve();
  }
  ["fullscreenElement", "webkitFullscreenElement"].forEach(function (k) {
    try { Object.defineProperty(Document.prototype, k, { configurable: true, get: function () { return fsEl; } }); } catch (e) {}
  });
  function byUser() { return !navigator.userActivation || navigator.userActivation.isActive; }
  Element.prototype.requestFullscreen = function () { return byUser() ? setFs(true) : Promise.resolve(); };
  Element.prototype.webkitRequestFullscreen = function () { if (byUser()) setFs(true); };
  Document.prototype.exitFullscreen = function () { return setFs(false); };
  Document.prototype.webkitExitFullscreen = function () { setFs(false); };
  try {
    if (navigator.keyboard) {
      navigator.keyboard.lock = function () { return Promise.resolve(); };
      navigator.keyboard.unlock = function () {};
    }
  } catch (e) {}
  window.addEventListener("keydown", function (e) {
    if (e.key === "F11") { e.preventDefault(); e.stopPropagation(); setFs(!fsEl); }
  }, true);
})();
"""

def on_loaded():
    url = window.get_current_url()
    if url and urlparse(url).hostname not in ALLOWED:
        window.load_url(HOME)
        return
    try:
        window.evaluate_js(FULLSCREEN_JS + "\n" + VOLUME_JS + "\n" + PROBE_JS)
    except Exception as e:
        log("Probe: injection failed (%r)" % (e,))
    inject_hub()

def window_size():
    try:
        import ctypes
        w = ctypes.windll.user32.GetSystemMetrics(78)
        h = ctypes.windll.user32.GetSystemMetrics(79)
    except Exception:
        w = h = 0
    if w < 400 or h < 300:
        return 1200, 800
    return max(800, min(1200, w - 40)), max(560, min(800, h - 40))

def show_start_error(err):
    log("Fatal: the window did not start (%r)" % (err,))
    url = "https://developer.microsoft.com/microsoft-edge/webview2/"
    text = ("PokeBonk could not open its window.\n\n"
            "The most common cause is a missing Microsoft Edge WebView2 Runtime.\n"
            "Details: %r\n\nOpen the download page now?" % (err,))
    try:
        import ctypes
        if ctypes.windll.user32.MessageBoxW(0, text, "PokeBonk", 0x4 | 0x20) == 6:
            os.startfile(url)
    except Exception as e:
        log("Fatal: no message box (%r)" % (e,))

WIN_W, WIN_H = window_size()
log("Window size %dx%d" % (WIN_W, WIN_H))
window = webview.create_window(TITLE, HOME, width=WIN_W, height=WIN_H, js_api=Api())
window.events.loaded += on_loaded
window.events.shown += set_window_icon
try:
    window.events.closed += shutdown
except Exception as e:
    log("Could not hook the close event: %r" % (e,))
log("App started, Python %s, file: %s" % (sys.version.split()[0], sys.executable))
threading.Thread(target=discord_status, daemon=True).start()
try:
    webview.start(private_mode=False, storage_path=DATA_DIR)
except Exception as e:
    show_start_error(e)
shutdown()
