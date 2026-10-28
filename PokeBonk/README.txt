POKEBONK — QUICK GUIDE (EN)

1. WHAT YOU NEED
- Windows 10 or 11
- Python installed with the "Add Python to PATH" option (the "py" command must work)
- An internet connection (the script installs two libraries by itself)

2. BUILDING THE APP
1. Unpack the archive (right-click -> "Extract All").
2. Open the extracted folder and double-click build.bat.
3. A black window opens: it installs pywebview and PyInstaller, then compiles.
   Do not close it, this takes a few minutes.
4. At the end, press any key. The program is in the dist subfolder:
   PokeBonkApp.exe
5. Double-click PokeBonkApp.exe to launch the game.

Note: on first launch, Windows SmartScreen may show "Windows protected your PC".
Click "More info" then "Run anyway". This is normal for an unsigned,
home-made program.

3. USING THE TOOLKIT MENU
- F2 key (or the button in the top-right corner): opens / closes the menu.
- Escape: closes the menu.
- Left column: Pokédex (all 151 Pokémon), Types (the 18 types) and
  Maps (the 6 regions).
- Maps: each region shows its known fights, its field mechanics and a ranking
  of the 79 partners from best fit to worst, with the reason (type multipliers,
  coverage, passives that help on that map). This ranking is computed from the
  type chart and passive descriptions (fan data) - it is not read from the game.
- Search bar: type a Pokémon or type name ("fire", "water"...). In Maps, the
  search also finds a region or a boss ("Gengar", "ice").
- Click a card to see the evolution, the weaknesses, the resistances and what
  the Pokémon or the type hits hard.
- PL / EN / FR buttons in the top-right corner: menu language (the choice is
  remembered).
- While the menu is open, the game does not receive your keys: you do not move
  by accident.

4. POKEBONK MULTIPLIERS
- strong x1.35 · weak x0.8 · barely x0.5 (no type is fully immune)
- Dual type: the multipliers multiply; damage taken is capped at x0.5-x1.6.
- Same type as the attack (STAB): x1.25.

5. IF SOMETHING GOES WRONG
- The build fails: check that "py --version" works in a command prompt, then
  run build.bat again.
- The app does not open: open the file
  %LOCALAPPDATA%\PokeBonk\log.txt and send it to the person who gave you
  the archive.
