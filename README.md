# PokéBonk Toolkit

A desktop and Android client for [PokéBonk](https://pokebonk.com) with a built-in toolkit:
Pokédex, type chart, map guides, run history with progress charts, and an automatic Discord status.

**Download:** [pokebonk.deepexe.fr](https://pokebonk.deepexe.fr)

## Features

- **Toolkit menu** (F2 or the button in the corner), styled like the game: Pokédex, types, maps with the best partners for each one.
- **Run tracking**: every run is saved (map, Pokémon, level, K.O., time, result). The Progress page shows your stats and how they change over time.
- **Discord status**: shows the map and your Pokémon in pixel art, live level and K.O. count, and a VICTORY picture after a win.
- **Real fullscreen** with F11 or the game's button, and a volume control.
- **Light on weak PCs**: the graphics card is used even when WebView2 blocklists it, the game's requests no longer go through Python, and the game's processes run at above-normal priority without Windows efficiency mode.
- **Auto-update**: the toolkit updates silently; a new app version downloads in the background and installs on restart (or when the app closes). On Android, a button opens the new APK.

## Repository

| Folder | What it is |
| --- | --- |
| `PokeBonk/` | Windows app: `pokebonk.py` (pywebview window, Discord status) and `hub.js` (toolkit injected into the game) |
| `PokeBonk/tools/` | Scripts that generate the Discord pictures |
| `android/` | Android app: a WebView that loads the game with the same `hub.js` |

The Discord pictures are hosted in [Deepexee/PokebonkImage](https://github.com/Deepexee/PokebonkImage).

## Build

### Windows

Needs Python 3 (with the `py` launcher).

```bat
cd PokeBonk
build.bat
```

The app is written to `PokeBonk/dist/PokeBonkApp.exe`.

### Android

Needs JDK 21 and the Android SDK (`platforms;android-35`, `build-tools;35.0.0`). No Gradle.

```powershell
cd android
.\build_apk.ps1
```

The version comes from `PokeBonk/version.json`. The script copies the toolkit files from `PokeBonk/`, then writes `android/PokeBonk.apk`.
On the first build it creates a signing key (`pokebonk.keystore` and `keystore.properties`). Keep them safe and out of git: updates must be signed with the same key.

## Publishing an update

Versions live in `PokeBonk/version.json`:

- `app`: Windows app version. Raise it to ship a new exe.
- `toolkit`: toolkit build. Raise it to ship new `hub.js` / data files without a new exe or APK.
- `toolkit_min_app` / `toolkit_min_android`: oldest app versions that can run this toolkit build.
- `android`: APK version code (must always go up) and name.

Build, generate the update folder, then upload it to `/var/www/pokebonk-toolkit/update/` on the server:

```bat
py PokeBonk\tools\publish_update.py site\update --exe PokeBonk\dist\PokeBonkApp.exe --apk android\PokeBonk.apk
```

Leave out `--exe` or `--apk` to keep the previous ones. The app reads `https://pokebonk.deepexe.fr/update/latest.json`.

## Toolkit settings

The **Settings** tab of the toolkit (F2) has:

- a **K.O./s counter** shown under the game's K.O. counter during a run;
- **mouse wheel binds**: bind the wheel up/down to a key during a run (it acts like pressing that key, so use the key you set in the game for the action);
- an **interface editor**: hide or resize any part of the game's screen, in the menus or in a run (pause the game first for the in-run screen).

Everything is saved in `%LOCALAPPDATA%\PokeBonk\config.yml` (a copy of your toolkit options plus some game options such as the controller calibration). Edit it with any text editor and restart the app.

## App settings

`%LOCALAPPDATA%\PokeBonk\settings.json` can turn features off, for example on a PC with GPU driver problems:

```json
{ "gpu_boost": false, "high_performance_gpu": true, "priority_boost": false, "auto_update": false }
```

If OBS shows a black window, use **Window Capture** with the *Windows 10 (1903 and up)* capture method, The app no longer forces the faster graphics card by default (it made OBS capture black on laptops with two graphics cards); set `"high_performance_gpu": true` to force it.

## Credits

Made by **Deepexe** and **Kanami**. Fan-made, not affiliated with PokéBonk, Nintendo or The Pokémon Company.
Sprites from the game.
