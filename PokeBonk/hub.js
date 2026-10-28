(function () {
  "use strict";

  if (window.__PBHub) return;
  window.__PBHub = true;

  var DATA = window.__PBTypedex;
  if (!DATA || !DATA.chart || !DATA.pokemon || !DATA.types) return;

  var TYPES = DATA.types;
  var CHART = DATA.chart;
  var POKEMON = DATA.pokemon;
  var LINES = DATA.lines || [];
  var VERSION = DATA.version || "";
  var NAMES = Object.keys(POKEMON).sort(function (a, b) {
    return ((DATA.ids || {})[a] || 999) - ((DATA.ids || {})[b] || 999) || a.localeCompare(b);
  });

  var MAPS = window.__PBMaps || null;
  var HAS_MAPS = !!(MAPS && MAPS.regions && MAPS.partners);
  var REGIONS = HAS_MAPS ? MAPS.regions : [];
  var PARTNERS = HAS_MAPS ? MAPS.partners : {};
  var REGION_BY_ID = {};
  REGIONS.forEach(function (r) { REGION_BY_ID[r.id] = r; });
  var PARTNER_NAMES = Object.keys(PARTNERS)
    .filter(function (n) { return !!POKEMON[n]; })
    .sort(function (a, b) { return PARTNERS[a].n - PARTNERS[b].n; });

  var IDS = DATA.ids || {};
  var NAME_BY_ID = {};
  Object.keys(IDS).forEach(function (n) { NAME_BY_ID[IDS[n]] = n; });

  function asset(path) { return location.origin + "/assets/" + path; }
  function portraitUrl(id) { return id ? asset("portraits/" + id + ".png") : ""; }
  function portraitImg(nameOrId, cls) {
    var id = typeof nameOrId === "number" ? nameOrId : IDS[nameOrId];
    if (!id) return "";
    return '<img class="pix ' + (cls || "pt") + '" src="' + portraitUrl(id) + '" alt="" draggable="false" loading="lazy">';
  }
  function typeIcon(type) {
    return '<img class="pix ti" src="' + asset("ui/types/" + String(type).toLowerCase() + ".png") + '" alt="" draggable="false">';
  }
  function uiIcon(name, size) {
    return '<img class="pix ui" src="' + asset(name) + '" alt="" draggable="false" style="width:' + (size || 20) + "px;height:" + (size || 20) + 'px">';
  }

  var BIOME_TO_REGION = { forest: "viridian", desert: "desert", coast: "storm", glacier: "glacier", tower: "tower", graveyard: "tower", volcano: "volcano" };
  function biomeGround(biome) { return biome ? asset("env/" + biome + "/ground.png") : ""; }
  var REGION_BIOME = { viridian: "forest", desert: "desert", storm: "coast", glacier: "glacier", tower: "graveyard", volcano: "volcano" };

  var SI18N = {
    pl: {
      nav: "Postępy", sub: "{n} zapisanych gier", subNone: "Brak zapisanych gier",
      emptyT: "Nic tu jeszcze nie ma", emptyH: "Zagraj grę: czas, K.O., poziom i złoto zapisują się same co kilka sekund.",
      runs: "Gry", total: "Łączny czas", bestTime: "Najdłużej", bestKills: "Rekord K.O.", kpm: "K.O./min", avgLvl: "Śr. poziom",
      allMaps: "Wszystkie mapy", allModes: "Wszystkie tryby", allMons: "Wszystkie Pokémony",
      trend: "Twoja forma", trendHint: "każdy punkt to jedna gra · linia = średnia z 5",
      mDur: "Czas", mKills: "K.O.", mKpm: "K.O./min", mLvl: "Poziom", mGold: "Złoto",
      byMon: "Według Pokémona", byMap: "Według mapy", recent: "Ostatnie gry",
      better: "+{p}% wobec 5 poprzednich", worse: "{p}% wobec 5 poprzednich", same: "tak samo jak wcześniej",
      timeline: "Przebieg gry", timelineHint: "K.O. i poziom w czasie",
      endMenu: "zakończona", endClosed: "przerwana", endRestart: "restart", live: "w trakcie",
      exportB: "Otwórz folder z zapisami", minHp: "Najniższe PV", tools: "Narzędzia", lvl: "Poz.", ago: "{n} temu", now: "teraz", plays: "{n} gier",
      saved: "Zapis: %LOCALAPPDATA%\\PokeBonk\\runs.json"
    },
    en: {
      nav: "Progress", sub: "{n} runs saved", subNone: "No runs saved yet",
      emptyT: "Nothing here yet", emptyH: "Play a run: time, K.O.s, level and gold are saved by themselves every few seconds.",
      runs: "Runs", total: "Time played", bestTime: "Longest run", bestKills: "Most K.O.s", kpm: "K.O./min", avgLvl: "Avg. level",
      allMaps: "All maps", allModes: "All modes", allMons: "All Pokémon",
      trend: "Your form", trendHint: "one dot per run · line = average of 5",
      mDur: "Time", mKills: "K.O.s", mKpm: "K.O./min", mLvl: "Level", mGold: "Gold",
      byMon: "By Pokémon", byMap: "By map", recent: "Recent runs",
      better: "+{p}% vs the 5 before", worse: "{p}% vs the 5 before", same: "same as before",
      timeline: "Run timeline", timelineHint: "K.O.s and level over time",
      endMenu: "finished", endClosed: "interrupted", endRestart: "restarted", live: "live",
      exportB: "Open the save folder", minHp: "Lowest HP", tools: "Toolkit", lvl: "Lv.", ago: "{n} ago", now: "now", plays: "{n} runs",
      saved: "Saved in %LOCALAPPDATA%\\PokeBonk\\runs.json"
    },
    fr: {
      nav: "Progression", sub: "{n} parties enregistrées", subNone: "Aucune partie enregistrée",
      emptyT: "Rien pour l'instant", emptyH: "Lance une partie : temps, K.O., niveau et or s'enregistrent tout seuls toutes les quelques secondes.",
      runs: "Parties", total: "Temps de jeu", bestTime: "Plus longue", bestKills: "Record K.O.", kpm: "K.O./min", avgLvl: "Niveau moyen",
      allMaps: "Toutes les cartes", allModes: "Tous les modes", allMons: "Tous les Pokémon",
      trend: "Ta forme", trendHint: "un point par partie · ligne = moyenne sur 5",
      mDur: "Durée", mKills: "K.O.", mKpm: "K.O./min", mLvl: "Niveau", mGold: "Or",
      byMon: "Par Pokémon", byMap: "Par carte", recent: "Dernières parties",
      better: "+{p} % par rapport aux 5 d'avant", worse: "{p} % par rapport aux 5 d'avant", same: "comme avant",
      timeline: "Déroulé de la partie", timelineHint: "K.O. et niveau au fil du temps",
      endMenu: "terminée", endClosed: "interrompue", endRestart: "relancée", live: "en cours",
      exportB: "Ouvrir le dossier des sauvegardes", minHp: "PV les plus bas", tools: "Outils", lvl: "N.", ago: "il y a {n}", now: "à l'instant", plays: "{n} parties",
      saved: "Enregistré dans %LOCALAPPDATA%\\PokeBonk\\runs.json"
    }
  };

  var REGION_COLOR = {
    viridian: "#7AC74C", desert: "#E2BF65", storm: "#F7D02C",
    glacier: "#96D9D6", tower: "#735797", volcano: "#EE8130"
  };

  var TRAIT_REWARDS = {
    guardians: ["boss"],
    endless: ["heal", "resist", "hp"],
    rain: ["rain"],
    tide: ["speed"],
    spout: ["resist", "armor", "shield", "hp"],
    rods: [],
    blizzard: ["speed"],
    iceSlip: [],
    crystals: [],
    floors: ["heal", "shield", "hp", "resist", "lifesteal"]
  };

  var COLORS = {
    Normal: "#A8A77A", Fighting: "#C22E28", Flying: "#A98FF3", Poison: "#A33EA1",
    Ground: "#E2BF65", Rock: "#B6A136", Bug: "#A6B91A", Ghost: "#735797",
    Steel: "#B7B7CE", Fire: "#EE8130", Water: "#6390F0", Grass: "#7AC74C",
    Electric: "#F7D02C", Psychic: "#F95587", Ice: "#96D9D6", Dragon: "#6F35FC",
    Dark: "#705746", Fairy: "#D685AD"
  };

  var TYPE_COUNTS = {};
  TYPES.forEach(function (t) { TYPE_COUNTS[t] = 0; });
  NAMES.forEach(function (n) {
    POKEMON[n].forEach(function (t) { TYPE_COUNTS[t] = (TYPE_COUNTS[t] || 0) + 1; });
  });

  var I18N = {
    pl: {
      launcher: "Narzędzia",
      launcherTitle: "Narzędzia PokeBonk (F2)",
      navDex: "Pokédex", navTypes: "Typy",
      soonTitle: "Więcej wkrótce",
      soonText: "Kolejne narzędzia pojawią się tutaj.",
      dexSub: "{n} Pokémonów · mnożniki PokeBonk",
      typesSub: "{n} typów · mnożniki PokeBonk",
      typeCount: "{n} Pokémonów",
      searchPoke: "Szukaj Pokémona lub typu…",
      foundSub: "Wyniki: {n}",
      noResults: "Brak wyników",
      noResultsHint: "Spróbuj innej nazwy albo wpisz typ, np. „ogień”.",
      back: "Wróć", clear: "Wyczyść", close: "Zamknij (Esc)",
      evolution: "Ewolucja", noEvolution: "Brak ewolucji",
      weaknesses: "Słabości", weaknessesHint: "dostaje więcej",
      resistances: "Odporności", resistancesHint: "dostaje mniej",
      neutral: "Neutralne", noEntries: "brak",
      dualNote: "Podwójny typ: mnożniki się mnożą, a otrzymywane obrażenia są ograniczone do ×0,5–×1,6.",
      whatBeats: "Co bije", stab: "STAB ×1,25",
      attack: "Atak", attackHint: "ten typ bije",
      defense: "Obrona", defenseHint: "ten typ dostaje od",
      neutralAtk: "Neutralne przy ataku", neutralDef: "Neutralne w obronie",
      minNote: "Najniższy mnożnik w PokeBonk to ×0,5 — nie ma pełnej odporności.",
      footMain: "Mnożniki PokeBonk: mocno ×1,35 · słabo ×0,8 · ledwo ×0,5. Żaden typ nie daje pełnej odporności.",
      footCalc: "Podwójny typ: mnożniki się mnożą; otrzymywane obrażenia 0,5–1,6, zadawane 0,4–1,8. STAB ×1,25.",
      strong: "mocno", weak: "słabo", soft: "ledwo",
      navMaps: "Mapy",
      mapsSub: "{n} regionów · kto jest tam najlepszy",
      mapDetailSub: "{n} zagrożeń · ranking partnerów",
      searchMaps: "Szukaj regionu albo zagrożenia…",
      mapThreats: "Zagrożenia",
      mapThreatsHint: "udokumentowane walki na tej mapie",
      mapBest: "Najlepsi partnerzy",
      mapBestHint: "liczone z typów i pasywów",
      mapMore: "Pokaż całą listę ({n})",
      mapAvoid: "Ryzykowne wybory",
      mapAvoidHint: "najniżej w rankingu, a do tego dostają ponad ×1",
      mapHazards: "Teren i mechaniki",
      mapPhys: "Fizyczne czy specjalne?",
      mapPhysText: "W PokeBonk obrażenia fizyczne i specjalne to dwie statystyki twojej postaci, a nie obrona przeciwnika. Słabości liczą się wyłącznie z typów, więc nie ma Pokémonów „odpornych na ataki fizyczne”. Ołtarz Porygona podnosi jedną z tych statystyk i obniża drugą — dlatego warto wiedzieć, którą budujesz.",
      mapPhysList: "Wzmacniają atak fizyczny",
      mapSpecList: "Wzmacniają atak specjalny",
      mapPhysNone: "Żaden partner nie wzmacnia tej statystyki swoim pasywem.",
      mapUnlock: "Jak odblokować",
      mapUnlockStart: "Region startowy — dostępny od początku.",
      mapUnlockAfter: "Najpierw przejdź: {name}.",
      mapEventUntil: "Wydarzenie trwa do {date}.",
      mapEventOver: "Wydarzenie skończyło się {date}.",
      mapSoon: "Zapowiedziana — brak jakichkolwiek danych.",
      mapNoThreats: "Brak udokumentowanych zagrożeń, więc ranking liczy się tylko z pokrycia typów.",
      mapWildNote: "Publiczne listy dzikich Pokémonów dla poszczególnych stref nie istnieją, dlatego w rankingu są tylko potwierdzone walki.",
      mapLegendNote: "Legendarni partnerzy mają dodatkowo więcej obrażeń, HP i prędkości, ale odblokowują się najpóźniej.",
      mapFoot: "Ranking to podpowiedź liczona z tabeli typów PokeBonk i opisów pasywów (dane fanów, v{v}, stan na {d}). To nie są dane wyciągnięte z gry.",
      mapScore: "dopasowanie",
      mapTop: "Najlepszy wybór",
      mapThreatCount: "zagrożeń: {n}",
      mapHazardCount: "mechanik: {n}",
      mapRanked: "Ranking {n} partnerów",
      kindGuardian: "strażnik", kindBoss: "boss", kindLegend: "legendarny",
      kindSurvival: "Survival", kindFloor: "piętro",
      statusLive: "dostępna", statusEvent: "wydarzenie", statusSoon: "wkrótce",
      rStarter: "startowy", rCommon: "częsty", rUncommon: "nieczęsty", rRare: "rzadki", rLegendary: "legendarny",
      rHit: "×{m} przeciw {n}",
      rTakes: "dostaje ×{m} od {t}",
      rResists: "tylko ×{m} od {t}",
      rCov: "pokrycie {n}/18",
      rIce: "nie ślizga się na lodzie",
      mapNoResults: "Nie ma takiego regionu.",
      mapsNote: "Każdy region ma 3 strefy Classic, własną mapę Survival i własne rankingi.",
      tags: {
        dmg: "więcej obrażeń", phys: "atak fizyczny", spec: "atak specjalny",
        atkSpeed: "szybkość ataku", crit: "obrażenia krytyczne", area: "większy obszar",
        proj: "pociski", speed: "szybkość", hp: "więcej HP", armor: "pancerz",
        shield: "tarcza", resist: "mniej otrzymywanych obrażeń", evasion: "unik",
        heal: "leczenie", lifesteal: "wykradanie HP", xp: "więcej XP", money: "więcej pieniędzy",
        luck: "szczęście", boss: "bonus vs elity i bossowie", status: "statusy",
        control: "kontrola tłumu", rain: "silny w deszczu", sand: "szybszy w burzy piaskowej",
        sun: "bonus w słońcu", ground: "odporność na zagrożenia z ziemi",
        projRes: "mniej obrażeń od pocisków i obszarowych", lowHp: "silny przy niskim HP",
        multi: "powtarza ataki", stab: "bonus za własny typ", sturdy: "przeżywa śmiertelny cios",
        air: "walczy w powietrzu", adapt: "kopiuje typy wroga"
      },
      traits: {
        guardians: ["Strażnicy i Alphy", "Każda strefa ma strażnika, a w trakcie biegu pojawiają się Alphy. Pasywy z bonusem przeciw elitom i bossom działają na wszystkich."],
        endless: ["Endless Night", "W Survivalu boss pojawia się co 5 minut: Mew o 15:00, Moltres o 30:00, Mewtwo o 45:00, a od 45:00 trwa Endless Night."],
        rain: ["Deszcz i burze", "Plaże, rafy i elektryczne burze nad morzem. Deszcz jest też potrzebny do wyzwania Zapdosa."],
        tide: ["Pływy", "Woda zalewa plaże i spowalnia. Plateau i wysepki z piorunochronem zostają suche, a po odpływie w piasku zostają perły."],
        spout: ["Trąby wodne", "Porywają ciebie i dzikie Pokémony. Upadek uderza w tłum i zadaje ciężkie obrażenia wrogom wokół ciebie."],
        rods: ["Piorunochrony", "Stań przy aktywnym piorunochronie, a piorun trafi w niego zamiast w ciebie. Supreme Thunder da się uniknąć tylko w oku burzy albo przy aktywnym piorunochronie."],
        blizzard: ["Zamiecie", "Wiatr pcha cię po lodzie i zmienia kierunek — chowaj się za klifami. Stanie w miejscu na otwartej przestrzeni zasypuje śniegiem."],
        iceSlip: ["Śliski lód", "Jazda po lodzie nabiera rozpędu. Dzikie Pokémony wepchnięte na lód też się ślizgają — poza typami Lodowymi."],
        crystals: ["Kryształy i filary", "Rozbij kryształy jeziora, żeby zdjąć z Articuno lodową powłokę. Ice Beam odbija się od filarów i może zamrozić samo Articuno. Kiedy jezioro świeci na Sheer Cold, przejdź do sektora ze złotą krawędzią."],
        floors: ["Siedem pięter", "Każde piętro jest trudniejsze, więc weź leczenie albo tarcze. Na szczycie czeka Gengar."]
      },
      mapDesc: {
        viridian: "Region startowy: tu uczysz się walk ze strażnikami i ołtarzy Unown.",
        desert: "Drugi region i brama do wszystkiego, co dalej.",
        storm: "Plaże, rafy i elektryczne burze nad morzem. Dom Zapdosa.",
        glacier: "Lód, zamiecie i rozpęd na śliskiej tafli. Dom Articuno.",
        tower: "Halloweenowe wydarzenie: siedem pięter, na szczycie Gengar.",
        volcano: "Zapowiedziana wyspa. Nie ma jeszcze żadnych szczegółów."
      },
      types: {
        Normal: "Normalny", Fighting: "Walczący", Flying: "Latający", Poison: "Trujący",
        Ground: "Ziemny", Rock: "Kamienny", Bug: "Robak", Ghost: "Duch",
        Steel: "Stalowy", Fire: "Ogień", Water: "Woda", Grass: "Trawa",
        Electric: "Elektryczny", Psychic: "Psychiczny", Ice: "Lód", Dragon: "Smok",
        Dark: "Mroczny", Fairy: "Bajkowy"
      }
    },
    en: {
      launcher: "Toolkit",
      launcherTitle: "PokeBonk Toolkit (F2)",
      navDex: "Pokédex", navTypes: "Types",
      soonTitle: "More coming soon",
      soonText: "New tools will show up right here.",
      dexSub: "{n} Pokémon · PokeBonk multipliers",
      typesSub: "{n} types · PokeBonk multipliers",
      typeCount: "{n} Pokémon",
      searchPoke: "Search Pokémon or type…",
      foundSub: "Matches: {n}",
      noResults: "No results",
      noResultsHint: "Try another name, or type a type such as “fire”.",
      back: "Back", clear: "Clear", close: "Close (Esc)",
      evolution: "Evolution", noEvolution: "No evolution",
      weaknesses: "Weaknesses", weaknessesHint: "takes more",
      resistances: "Resistances", resistancesHint: "takes less",
      neutral: "Neutral", noEntries: "none",
      dualNote: "Dual type: multipliers stack; damage taken is capped at ×0.5–×1.6.",
      whatBeats: "What it beats", stab: "STAB ×1.25",
      attack: "Attack", attackHint: "this type hits",
      defense: "Defense", defenseHint: "this type takes from",
      neutralAtk: "Neutral on attack", neutralDef: "Neutral on defense",
      minNote: "The lowest PokeBonk multiplier is ×0.5 — no type is fully immune.",
      footMain: "PokeBonk multipliers: strong ×1.35 · weak ×0.8 · barely ×0.5. No type is fully immune.",
      footCalc: "Dual type: multipliers stack; damage taken 0.5–1.6, damage dealt 0.4–1.8. STAB ×1.25.",
      strong: "strong", weak: "weak", soft: "barely",
      navMaps: "Maps",
      mapsSub: "{n} regions · who is best there",
      mapDetailSub: "{n} documented threats · partner ranking",
      searchMaps: "Search a region or a threat…",
      mapThreats: "Threats",
      mapThreatsHint: "documented fights on this map",
      mapBest: "Best partners",
      mapBestHint: "computed from types and passives",
      mapMore: "Show the full list ({n})",
      mapAvoid: "Risky picks",
      mapAvoidHint: "lowest on the list, and they take more than ×1",
      mapHazards: "Terrain and mechanics",
      mapPhys: "Physical or special?",
      mapPhysText: "In PokeBonk physical and special damage are two stats on your character, not a defense stat on the enemy. Weaknesses come only from types, so no Pokémon is “immune to physical”. The Porygon Altar raises one of those stats and lowers the other, so it helps to know which one your build uses.",
      mapPhysList: "Boost physical damage",
      mapSpecList: "Boost special damage",
      mapPhysNone: "No partner boosts this stat with its passive.",
      mapUnlock: "How to unlock",
      mapUnlockStart: "Starting region — available from the beginning.",
      mapUnlockAfter: "Clear {name} first.",
      mapEventUntil: "The event runs until {date}.",
      mapEventOver: "The event ended on {date}.",
      mapSoon: "Announced — no data at all yet.",
      mapNoThreats: "No documented threats, so the ranking only uses type coverage.",
      mapWildNote: "There are no public wild spawn lists per zone, so the ranking only uses confirmed fights.",
      mapLegendNote: "Legendary partners also get extra damage, HP and speed, but they unlock last.",
      mapFoot: "The ranking is a suggestion computed from the PokeBonk type chart and passive descriptions (fan data, v{v}, as of {d}). It is not data read from the game.",
      mapScore: "match",
      mapTop: "Top pick",
      mapThreatCount: "threats: {n}",
      mapHazardCount: "mechanics: {n}",
      mapRanked: "{n} partners ranked",
      kindGuardian: "guardian", kindBoss: "boss", kindLegend: "legendary",
      kindSurvival: "Survival", kindFloor: "floor",
      statusLive: "available", statusEvent: "event", statusSoon: "soon",
      rStarter: "starter", rCommon: "common", rUncommon: "uncommon", rRare: "rare", rLegendary: "legendary",
      rHit: "×{m} against {n}",
      rTakes: "takes ×{m} from {t}",
      rResists: "only ×{m} from {t}",
      rCov: "covers {n}/18 types",
      rIce: "does not slip on ice",
      mapNoResults: "No such region.",
      mapsNote: "Every region has three Classic zones, its own Survival map and its own leaderboards.",
      tags: {
        dmg: "more damage", phys: "physical damage", spec: "special damage",
        atkSpeed: "attack speed", crit: "critical hits", area: "bigger area",
        proj: "projectiles", speed: "speed", hp: "max HP", armor: "armor",
        shield: "shield", resist: "takes less damage", evasion: "evasion",
        heal: "healing", lifesteal: "lifesteal", xp: "more XP", money: "more money",
        luck: "luck", boss: "bonus vs elites and bosses", status: "status effects",
        control: "crowd control", rain: "strong in rain", sand: "faster in sandstorms",
        sun: "bonus in sunlight", ground: "immune to ground hazards",
        projRes: "less projectile and area damage", lowHp: "strong at low HP",
        multi: "repeats attacks", stab: "own-type bonus", sturdy: "survives a lethal hit",
        air: "fights airborne", adapt: "copies enemy types"
      },
      traits: {
        guardians: ["Guardians and Alphas", "Every zone has a guardian, and Alphas show up during a run. Passives with a bonus against elites and bosses work on all of them."],
        endless: ["Endless Night", "In Survival a boss appears every 5 minutes: Mew at 15:00, Moltres at 30:00, Mewtwo at 45:00, and Endless Night from 45:00."],
        rain: ["Rain and storms", "Beaches, reefs and electrical storms over the sea. Rain is also needed for the Zapdos challenge."],
        tide: ["Tides", "The tide rises and floods the beaches, and the water slows you down. Plateaus and the lightning-rod islets stay dry, and the outgoing tide leaves pearls in the sand."],
        spout: ["Waterspouts", "They suck up you and wild Pokémon. Landing slams into the crowd and deals heavy damage to the enemies around you."],
        rods: ["Lightning rods", "Stand next to an active lightning rod and the bolt goes to the rod instead of you. Supreme Thunder can only be dodged in the eye of the storm or next to an active rod."],
        blizzard: ["Blizzards", "The wind pushes you across the ice and can change direction — hide behind cliffs. Standing still in the open gets you snowed over."],
        iceSlip: ["Slippery ice", "Sliding on ice builds momentum. Wild Pokémon pushed onto ice slip too, except Ice types."],
        crystals: ["Crystals and pillars", "Break the lake's crystals to strip Articuno's ice shell. Its Ice Beam bounces off pillars and can freeze Articuno itself. When the lake glows for Sheer Cold, move to a sector with a golden edge."],
        floors: ["Seven floors", "Each floor gets harder, so bring healing or shields. Gengar waits at the top."]
      },
      mapDesc: {
        viridian: "The starting region: learn guardian fights and Unown altars here.",
        desert: "The second region, and the gate to everything after it.",
        storm: "Beaches, reefs and electrical storms over the sea. Home of Zapdos.",
        glacier: "Ice, blizzards and momentum on slippery ground. Home of Articuno.",
        tower: "The Halloween event: seven floors with Gengar at the top.",
        volcano: "An announced island. No details yet."
      }
    },
    fr: {
      launcher: "Outils",
      launcherTitle: "Outils PokeBonk (F2)",
      navDex: "Pokédex", navTypes: "Types",
      soonTitle: "Bientôt plus",
      soonText: "Les prochains outils apparaîtront ici.",
      dexSub: "{n} Pokémon · multiplicateurs PokeBonk",
      typesSub: "{n} types · multiplicateurs PokeBonk",
      typeCount: "{n} Pokémon",
      searchPoke: "Chercher un Pokémon ou un type…",
      foundSub: "Résultats : {n}",
      noResults: "Aucun résultat",
      noResultsHint: "Essayez un autre nom, ou un type comme « feu ».",
      back: "Retour", clear: "Effacer", close: "Fermer (Échap)",
      evolution: "Évolution", noEvolution: "Aucune évolution",
      weaknesses: "Faiblesses", weaknessesHint: "subit plus",
      resistances: "Résistances", resistancesHint: "subit moins",
      neutral: "Neutre", noEntries: "aucune",
      dualNote: "Double type : les multiplicateurs se multiplient ; les dégâts reçus sont limités à ×0,5–×1,6.",
      whatBeats: "Ce qu'il bat", stab: "STAB ×1,25",
      attack: "Attaque", attackHint: "ce type frappe",
      defense: "Défense", defenseHint: "ce type subit de",
      neutralAtk: "Neutre en attaque", neutralDef: "Neutre en défense",
      minNote: "Le multiplicateur le plus bas dans PokeBonk est ×0,5 — il n'y a pas d'immunité totale.",
      footMain: "Multiplicateurs PokeBonk : fort ×1,35 · faible ×0,8 · à peine ×0,5. Aucun type n'est totalement immunisé.",
      footCalc: "Double type : les multiplicateurs se multiplient ; dégâts reçus 0,5–1,6, dégâts infligés 0,4–1,8. STAB ×1,25.",
      strong: "fort", weak: "faible", soft: "à peine",
      navMaps: "Cartes",
      mapsSub: "{n} régions · qui y est le meilleur",
      mapDetailSub: "{n} menaces documentées · classement des partenaires",
      searchMaps: "Chercher une région ou une menace…",
      mapThreats: "Menaces",
      mapThreatsHint: "combats documentés sur cette carte",
      mapBest: "Meilleurs partenaires",
      mapBestHint: "calculé d'après les types et les passifs",
      mapMore: "Afficher toute la liste ({n})",
      mapAvoid: "Choix risqués",
      mapAvoidHint: "les plus mal classés, et ils subissent plus de ×1",
      mapHazards: "Terrain et mécaniques",
      mapPhys: "Physique ou spécial ?",
      mapPhysText: "Dans PokeBonk, les dégâts physiques et spéciaux sont deux statistiques de votre personnage, pas une défense de l'adversaire. Les faiblesses ne viennent que des types : aucun Pokémon n'est « immunisé au physique ». L'Autel Porygon augmente l'une de ces statistiques et réduit l'autre — mieux vaut savoir laquelle votre build utilise.",
      mapPhysList: "Augmentent les dégâts physiques",
      mapSpecList: "Augmentent les dégâts spéciaux",
      mapPhysNone: "Aucun partenaire n'augmente cette statistique avec son passif.",
      mapUnlock: "Comment débloquer",
      mapUnlockStart: "Région de départ — disponible dès le début.",
      mapUnlockAfter: "Terminez d'abord {name}.",
      mapEventUntil: "L'événement dure jusqu'au {date}.",
      mapEventOver: "L'événement est terminé depuis le {date}.",
      mapSoon: "Annoncée — aucune donnée pour l'instant.",
      mapNoThreats: "Aucune menace documentée : le classement ne repose que sur la couverture de types.",
      mapWildNote: "Il n'existe pas de liste publique des Pokémon sauvages par zone ; le classement n'utilise que les combats confirmés.",
      mapLegendNote: "Les partenaires légendaires ont en plus des dégâts, des PV et de la vitesse, mais se débloquent en dernier.",
      mapFoot: "Ce classement est une suggestion calculée à partir de la table des types PokeBonk et des descriptions de passifs (données de fans, v{v}, au {d}). Ce ne sont pas des données lues dans le jeu.",
      mapScore: "affinité",
      mapTop: "Meilleur choix",
      mapThreatCount: "menaces : {n}",
      mapHazardCount: "mécaniques : {n}",
      mapRanked: "{n} partenaires classés",
      kindGuardian: "gardien", kindBoss: "boss", kindLegend: "légendaire",
      kindSurvival: "Survival", kindFloor: "étage",
      statusLive: "disponible", statusEvent: "événement", statusSoon: "bientôt",
      rStarter: "starter", rCommon: "commun", rUncommon: "peu commun", rRare: "rare", rLegendary: "légendaire",
      rHit: "×{m} contre {n}",
      rTakes: "subit ×{m} de {t}",
      rResists: "seulement ×{m} de {t}",
      rCov: "couvre {n}/18 types",
      rIce: "ne glisse pas sur la glace",
      mapNoResults: "Aucune région de ce nom.",
      mapsNote: "Chaque région a trois zones Classic, sa propre carte Survival et ses propres classements.",
      tags: {
        dmg: "plus de dégâts", phys: "dégâts physiques", spec: "dégâts spéciaux",
        atkSpeed: "vitesse d'attaque", crit: "coups critiques", area: "zone plus large",
        proj: "projectiles", speed: "vitesse", hp: "PV max", armor: "armure",
        shield: "bouclier", resist: "subit moins de dégâts", evasion: "esquive",
        heal: "soin", lifesteal: "vol de vie", xp: "plus d'XP", money: "plus d'argent",
        luck: "chance", boss: "bonus contre élites et boss", status: "altérations",
        control: "contrôle de foule", rain: "fort sous la pluie", sand: "plus rapide dans le sable",
        sun: "bonus au soleil", ground: "immunisé aux pièges de sol",
        projRes: "moins de dégâts de projectiles et de zone", lowHp: "fort à PV bas",
        multi: "répète les attaques", stab: "bonus de type", sturdy: "survit à un coup fatal",
        air: "combat aérien", adapt: "copie les types ennemis"
      },
      traits: {
        guardians: ["Gardiens et Alphas", "Chaque zone a un gardien, et des Alphas apparaissent pendant le run. Les passifs avec un bonus contre les élites et les boss fonctionnent sur tous."],
        endless: ["Endless Night", "En Survival, un boss apparaît toutes les 5 minutes : Mew à 15:00, Moltres à 30:00, Mewtwo à 45:00, puis Endless Night à partir de 45:00."],
        rain: ["Pluie et orages", "Plages, récifs et orages électriques au-dessus de la mer. La pluie est aussi requise pour le défi de Zapdos."],
        tide: ["Marées", "La marée monte et inonde les plages, et l'eau vous ralentit. Les plateaux et les îlots à paratonnerre restent secs, et la marée descendante laisse des perles dans le sable."],
        spout: ["Trombes d'eau", "Elles aspirent vous et les Pokémon sauvages. L'atterrissage frappe la foule et inflige de lourds dégâts aux ennemis autour de vous."],
        rods: ["Paratonnerres", "Placez-vous près d'un paratonnerre actif et la foudre le touche au lieu de vous. Supreme Thunder ne peut être esquivé que dans l'œil du cyclone ou près d'un paratonnerre actif."],
        blizzard: ["Blizzards", "Le vent vous pousse sur la glace et peut changer de direction — abritez-vous derrière les falaises. Rester immobile à découvert vous couvre de neige."],
        iceSlip: ["Glace glissante", "Glisser sur la glace donne de l'élan. Les Pokémon sauvages poussés sur la glace glissent aussi, sauf les types Glace."],
        crystals: ["Cristaux et piliers", "Brisez les cristaux du lac pour retirer la carapace de glace d'Articuno. Son Laser Glace rebondit sur les piliers et peut geler Articuno lui-même. Quand le lac brille pour Sheer Cold, allez dans un secteur au bord doré."],
        floors: ["Sept étages", "Chaque étage est plus difficile, alors apportez des soins ou des boucliers. Gengar vous attend au sommet."]
      },
      mapDesc: {
        viridian: "La région de départ : apprenez les combats de gardiens et les autels Unown.",
        desert: "La deuxième région, et la porte vers tout le reste.",
        storm: "Plages, récifs et orages électriques au-dessus de la mer. Fief de Zapdos.",
        glacier: "Glace, blizzards et élan sur sol glissant. Fief d'Articuno.",
        tower: "L'événement d'Halloween : sept étages avec Gengar au sommet.",
        volcano: "Une île annoncée. Aucun détail pour l'instant."
      },
      types: {
        Normal: "Normal", Fighting: "Combat", Flying: "Vol", Poison: "Poison",
        Ground: "Sol", Rock: "Roche", Bug: "Insecte", Ghost: "Spectre",
        Steel: "Acier", Fire: "Feu", Water: "Eau", Grass: "Plante",
        Electric: "Électrik", Psychic: "Psy", Ice: "Glace", Dragon: "Dragon",
        Dark: "Ténèbres", Fairy: "Fée"
      }
    }
  };

  var LANG_KEY = "pokebonk_hub_lang";
  var lang = "en";
  try {
    var savedLang = localStorage.getItem(LANG_KEY);
    if (I18N[savedLang]) lang = savedLang;
  } catch (e) {}

  function T(key) { return I18N[lang][key]; }
  function S(key) { return (SI18N[lang] || SI18N.en)[key]; }
  function tname(type) { return (I18N[lang].types && I18N[lang].types[type]) || type; }
  function fill(s, n) { return String(s).replace("{n}", n); }
  function tmpl(s, o) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? "" : o[k]; });
  }

  var ALIASES = {
    Normal: ["normalny"],
    Fighting: ["walka", "walczacy", "bijatyka"],
    Flying: ["lot", "powietrzny"],
    Poison: ["trucizna", "trujacy"],
    Ground: ["ziemia", "ziemny", "grunt"],
    Rock: ["kamien", "kamienny"],
    Bug: ["robak", "owad"],
    Ghost: ["duch", "upior"],
    Steel: ["stal", "metal"],
    Fire: ["ogien", "ognia", "ognisty"],
    Water: ["woda", "wodny"],
    Grass: ["trawa", "trawiasty", "roslinny"],
    Electric: ["prad", "elektryka"],
    Psychic: ["psychika", "umysl"],
    Ice: ["lod", "mroz"],
    Dragon: ["smok", "smoczy"],
    Dark: ["mrok", "ciemnosc", "ciemny"],
    Fairy: ["bajka", "wrozka", "fe"]
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[\u2019“”"«»]/g, "")
      .replace(/ł/g, "l")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ").trim();
  }

  function fmt(v) {
    var r = Math.round(v * 1000) / 1000;
    var s = String(r);
    return lang === "en" ? s : s.replace(".", ",");
  }

  function rgbOf(hex) {
    var c = hex.replace("#", "");
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }

  function textColor(hex) {
    var c = rgbOf(hex);
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) > 150 ? "#15161c" : "#fff";
  }

  function triplet(hex) {
    var c = rgbOf(hex);
    return c[0] + "," + c[1] + "," + c[2];
  }

  function darken(hex, f) {
    var c = rgbOf(hex);
    return "rgb(" + Math.round(c[0] * (1 - f)) + "," + Math.round(c[1] * (1 - f)) + "," + Math.round(c[2] * (1 - f)) + ")";
  }

  function chip(name, mult) {
    var col = COLORS[name] || "#666";
    return '<span class="chip" data-type="' + esc(name) + '" title="' + esc(name) + '" style="background:' + col + ';color:' + textColor(col) + '">' +
      typeIcon(name) + esc(tname(name)) + (mult != null ? '<b>×' + fmt(mult) + '</b>' : "") + "</span>";
  }

  function chipsOrNone(list) {
    return '<div class="chips">' + (list.length
      ? list.map(function (x) { return chip(x[0], x[1]); }).join("")
      : '<span class="none">' + esc(T("noEntries")) + "</span>") + "</div>";
  }

  function arow(label, list, cls) {
    var chips = list.length
      ? list.map(function (x) { return chip(x[0], x[1]); }).join("")
      : '<span class="none">—</span>';
    return '<div class="arow"><span class="lbl ' + cls + '">' + esc(label) + '</span><div class="chips">' + chips + "</div></div>";
  }

  function groupsFrom(fn) {
    var g = { strong: [], weak: [], soft: [], neutral: [] };
    TYPES.forEach(function (t) {
      var v = fn(t);
      if (v > 1.001) g.strong.push([t, v]);
      else if (v < 0.999 && v > 0.6) g.weak.push([t, v]);
      else if (v <= 0.6) g.soft.push([t, v]);
      else g.neutral.push(t);
    });
    g.strong.sort(function (a, b) { return b[1] - a[1]; });
    return g;
  }

  function defense(types) {
    var out = {};
    TYPES.forEach(function (atk) {
      var v = 1;
      types.forEach(function (def) { v *= CHART[atk][def]; });
      out[atk] = Math.max(0.5, Math.min(1.6, Math.round(v * 1000) / 1000));
    });
    return out;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function bestHit(atkTypes, defTypes) {
    var best = 0, bestType = atkTypes[0];
    atkTypes.forEach(function (a) {
      var v = 1;
      defTypes.forEach(function (d) { v *= CHART[a][d]; });
      v = clamp(Math.round(v * 1000) / 1000, 0.4, 1.8);
      if (v > best) { best = v; bestType = a; }
    });
    return { v: best, t: bestType };
  }

  function worstTaken(atkTypes, defTypes) {
    var worst = 0, worstType = atkTypes[0];
    atkTypes.forEach(function (a) {
      var v = 1;
      defTypes.forEach(function (d) { v *= CHART[a][d]; });
      v = clamp(Math.round(v * 1000) / 1000, 0.5, 1.6);
      if (v > worst) { worst = v; worstType = a; }
    });
    return { v: worst, t: worstType };
  }

  function coverage(types) {
    var n = 0;
    TYPES.forEach(function (x) {
      var best = 0;
      types.forEach(function (t) { if (CHART[t][x] > best) best = CHART[t][x]; });
      if (best >= 1.35) n++;
    });
    return n;
  }

  function synergies(name, region) {
    var tags = PARTNERS[name].g || [];
    var types = POKEMON[name];
    var out = [], seen = {};
    (region.traits || []).forEach(function (tr) {
      if (tr === "iceSlip" && types.indexOf("Ice") >= 0 && !seen.iceType) {
        seen.iceType = true;
        out.push({ tag: "ice", trait: tr });
      }
      (TRAIT_REWARDS[tr] || []).forEach(function (tag) {
        if (seen[tag] || tags.indexOf(tag) < 0) return;
        seen[tag] = true;
        out.push({ tag: tag, trait: tr });
      });
    });
    return out;
  }

  function scorePartner(name, region) {
    var ts = POKEMON[name];
    var off = 0, def = 0, W = 0, hit = null, taken = null;
    (region.threats || []).forEach(function (th) {
      var tt = POKEMON[th.n];
      if (!tt || th.n === name) return;
      var w = th.w || 1;
      W += w;
      var h = bestHit(ts, tt);
      var t = worstTaken(tt, ts);
      off += w * h.v;
      def += w * t.v;
      if (!hit || h.v > hit.v) hit = { v: h.v, threat: th.n };
      if (!taken || t.v > taken.v) taken = t;
    });
    if (W) { off /= W; def /= W; }
    var cov = coverage(ts);
    var syn = synergies(name, region);
    var score = W
      ? 100 * (0.30 * clamp((off - 0.8) / 0.8, 0, 1) +
               0.32 * clamp((1.6 - def) / 1.1, 0, 1) +
               0.18 * clamp(cov / 8, 0, 1) +
               0.20 * clamp(syn.length / 3, 0, 1))
      : 100 * clamp(cov / 8, 0, 1);
    return {
      name: name, score: Math.round(score), off: off, def: def, cov: cov,
      hit: hit, taken: taken, syn: syn, rarity: PARTNERS[name].r
    };
  }

  var rankCache = {};
  function rankRegion(region) {
    if (!rankCache[region.id]) {
      rankCache[region.id] = PARTNER_NAMES.map(function (n) { return scorePartner(n, region); })
        .sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name); });
    }
    return rankCache[region.id];
  }

  function tagLabel(id) {
    if (id === "ice") return T("rIce");
    var m = T("tags");
    return (m && m[id]) || id;
  }

  function traitOf(id) {
    var m = T("traits");
    return (m && m[id]) || [id, ""];
  }

  function regionDesc(id) {
    var m = T("mapDesc");
    return (m && m[id]) || "";
  }

  function rarityLabel(r) {
    return T("r" + String(r).charAt(0).toUpperCase() + String(r).slice(1)) || r;
  }

  function kindLabel(k) {
    var m = { guardian: "kindGuardian", boss: "kindBoss", legend: "kindLegend", survival: "kindSurvival", floor: "kindFloor" };
    return T(m[k] || "kindBoss");
  }

  function statusLabel(s) {
    var m = { live: "statusLive", event: "statusEvent", soon: "statusSoon" };
    return T(m[s] || "statusLive");
  }

  function fmtDate(iso) {
    var p = String(iso).split("-");
    if (p.length !== 3) return iso;
    if (lang === "pl") return p[2] + "." + p[1] + "." + p[0];
    if (lang === "fr") return p[2] + "/" + p[1] + "/" + p[0];
    return iso;
  }

  function eventOver(region) {
    if (!region.eventUntil) return false;
    var t = Date.parse(region.eventUntil + "T23:59:59Z");
    return !isNaN(t) && t < Date.now();
  }

  function lineOf(name) {
    for (var i = 0; i < LINES.length; i++) {
      if (LINES[i].names.indexOf(name) >= 0) return LINES[i];
    }
    return null;
  }

  function evoHtml(name) {
    var line = lineOf(name);
    if (!line || line.names.length < 2) return '<span class="none">' + esc(T("noEvolution")) + "</span>";
    function nm(n) {
      return '<span class="evo-name' + (n === name ? " cur" : "") + '" data-poke="' + esc(n) + '">' + esc(n) + "</span>";
    }
    if (line.branch) {
      return nm(line.names[0]) + '<span class="evo-arrow">→</span>' +
        line.names.slice(1).map(nm).join('<span class="evo-arrow">/</span>');
    }
    return line.names.map(nm).join('<span class="evo-arrow">→</span>');
  }

  function atkBlock(type) {
    var g = groupsFrom(function (def) { return CHART[type][def]; });
    return '<div class="atk"><div class="atk-h">' + chip(type) + "</div>" +
      arow(T("strong"), g.strong, "good") +
      arow(T("weak"), g.weak, "bad") +
      arow(T("soft"), g.soft, "soft") + "</div>";
  }

  function panel(title, hint, cls, inner) {
    return '<div class="panel"><div class="panel-t' + (cls ? " " + cls : "") + '">' + esc(title) +
      (hint ? ' <span class="hint">' + esc(hint) + "</span>" : "") + "</div>" + inner + "</div>";
  }

  function neutralBox(label, list) {
    if (!list.length) return "";
    return '<details class="neutral"><summary>' + esc(label) + " (" + list.length + ')</summary><div class="chips">' +
      list.map(function (t) { return chip(t); }).join("") + "</div></details>";
  }

  function backBtn() {
    return '<button type="button" class="backb" data-back>' + IC.back + "<span>" + esc(T("back")) + "</span></button>";
  }

  function legend() {
    return '<div class="legend">' + esc(T("footMain")) + "<br>" + esc(T("footCalc")) + "</div>";
  }

  function emptyHtml(title, hint) {
    return '<div class="empty"><div class="orb"></div><b>' + esc(title || T("noResults")) + "</b><span>" +
      esc(hint || T("noResultsHint")) + "</span></div>";
  }

  var IC = {
    dex: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="10" r="3.2"/><path d="M8.5 17.2h7"/></svg>',
    types: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2.2"/><rect x="13.2" y="3.2" width="7.6" height="7.6" rx="2.2"/><rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2.2"/><rect x="13.2" y="13.2" width="7.6" height="7.6" rx="2.2"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.4"/><path d="M15.6 15.6L20.5 20.5"/></svg>',
    maps: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4.6L4 6.8v12.6l5-2.2 6 2.4 5-2.2V4.8l-5 2.2-6-2.4z"/><path d="M9 4.6v12.6M15 7v12.6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 5.4L8 12l6.6 6.6"/></svg>'
  };

  function typeMatch(type, qn) {
    var names = [type, I18N.pl.types[type], I18N.fr.types[type]];
    for (var n = 0; n < names.length; n++) {
      var full = norm(names[n]);
      if (full.indexOf(qn) === 0 || (qn.length >= 3 && full.indexOf(qn) >= 0)) return true;
    }
    var aliases = ALIASES[type] || [];
    for (var i = 0; i < aliases.length; i++) {
      var a = norm(aliases[i]);
      if (a.indexOf(qn) === 0 || (qn.length >= 3 && a.indexOf(qn) >= 0)) return true;
    }
    return false;
  }

  function pcard(name) {
    var ts = POKEMON[name];
    var c1 = COLORS[ts[0]] || "#666";
    var c2 = ts[1] ? (COLORS[ts[1]] || "#666") : c1;
    return '<button type="button" class="pcard" data-poke="' + esc(name) + '" style="--c1:' + c1 + ";--c2:" + c2 + '">' +
      '<span class="pframe">' + portraitImg(name) + "</span>" +
      '<span class="pbody"><span class="pnum">#' + String(IDS[name] || 0).padStart(3, "0") + "</span>" +
      '<span class="pname">' + esc(name) + "</span>" +
      '<span class="pchips">' + ts.map(function (t) { return chip(t); }).join("") + "</span></span>" +
      "</button>";
  }

  function tile(t) {
    var col = COLORS[t] || "#666";
    return '<button type="button" class="tile" data-type="' + esc(t) + '" style="--c:' + col + ";--cd:" + darken(col, 0.45) + ";--tc:" + textColor(col) + '">' +
      '<span class="tname">' + esc(tname(t)) + "</span>" +
      (lang === "en" ? "" : '<span class="ten">' + esc(t) + "</span>") +
      '<span class="tcount">' + esc(fill(T("typeCount"), TYPE_COUNTS[t])) + "</span>" +
      "</button>";
  }

  function dexView() {
    var qn = norm(state.query);
    var list = NAMES;
    if (qn) {
      list = NAMES.filter(function (n) {
        if (norm(n).indexOf(qn) >= 0) return true;
        var ts = POKEMON[n];
        for (var i = 0; i < ts.length; i++) if (typeMatch(ts[i], qn)) return true;
        return false;
      }).sort(function (a, b) {
        var sa = norm(a).indexOf(qn) === 0 ? 0 : 1;
        var sb = norm(b).indexOf(qn) === 0 ? 0 : 1;
        return sa - sb || a.localeCompare(b);
      });
    }
    if (!list.length) { shownCount = 0; return emptyHtml(); }
    shownCount = list.length;
    return '<div class="grid">' + list.map(pcard).join("") + "</div>";
  }

  function typesView() {
    var qn = norm(state.query);
    var list = qn ? TYPES.filter(function (t) { return typeMatch(t, qn); }) : TYPES;
    if (!list.length) { shownCount = 0; return emptyHtml(); }
    shownCount = list.length;
    return '<div class="tgrid">' + list.map(tile).join("") + "</div>";
  }

  function pokeView(name) {
    var ts = POKEMON[name];
    var d = defense(ts);
    var weak = [], res = [], neu = [];
    TYPES.forEach(function (t) {
      var v = d[t];
      if (v > 1.001) weak.push([t, v]);
      else if (v < 0.999) res.push([t, v]);
      else neu.push(t);
    });
    weak.sort(function (a, b) { return b[1] - a[1]; });
    res.sort(function (a, b) { return a[1] - b[1]; });

    var html = backBtn();
    html += '<div class="hero has-pt" style="--r1:' + triplet(COLORS[ts[0]] || "#666") + ";--r2:" + triplet(COLORS[ts[1] || ts[0]] || "#666") + '">' +
      '<span class="hero-pt">' + portraitImg(name, "pt big") + "</span>" +
      '<span class="pnum">#' + String(IDS[name] || 0).padStart(3, "0") + "</span>" +
      '<h2 class="hname">' + esc(name) + "</h2>" +
      '<div class="chips big">' + ts.map(function (t) { return chip(t); }).join("") + "</div></div>";
    html += panel(T("evolution"), "", "", '<div class="evo">' + evoHtml(name) + "</div>");
    html += '<div class="cards">' +
      panel(T("weaknesses"), T("weaknessesHint"), "weak", chipsOrNone(weak)) +
      panel(T("resistances"), T("resistancesHint"), "res", chipsOrNone(res)) +
      "</div>";
    html += neutralBox(T("neutral"), neu);
    if (ts.length > 1) html += '<div class="note">' + esc(T("dualNote")) + "</div>";
    html += panel(T("whatBeats"), T("stab"), "", '<div class="atk-grid">' +
      ts.map(function (t) { return atkBlock(t); }).join("") + "</div>");
    html += legend();
    return html;
  }

  function typeView(type) {
    var atk = groupsFrom(function (def) { return CHART[type][def]; });
    var def = groupsFrom(function (a) { return CHART[a][type]; });
    var col = COLORS[type] || "#666";

    var html = backBtn();
    html += '<div class="hero" style="--r1:' + triplet(col) + ";--r2:" + triplet(col) + '">' +
      '<h2 class="hname">' + esc(tname(type)) +
        (lang === "en" ? "" : ' <span class="en">' + esc(type) + "</span>") + "</h2>" +
      "<p>" + esc(fill(T("typeCount"), TYPE_COUNTS[type])) + "</p>" +
      '<div class="chips big">' + chip(type) + "</div></div>";
    html += '<div class="cards">' +
      panel(T("attack"), T("attackHint"), "",
        arow(T("strong"), atk.strong, "good") + arow(T("weak"), atk.weak, "bad") + arow(T("soft"), atk.soft, "soft")) +
      panel(T("defense"), T("defenseHint"), "",
        arow(T("strong"), def.strong, "good") + arow(T("weak"), def.weak, "bad") + arow(T("soft"), def.soft, "soft")) +
      "</div>";
    html += neutralBox(T("neutralAtk"), atk.neutral);
    html += neutralBox(T("neutralDef"), def.neutral);
    html += '<div class="note">' + esc(T("minNote")) + "</div>";
    return html;
  }

  function threatPill(th) {
    var ts = POKEMON[th.n];
    if (!ts) return "";
    var col = COLORS[ts[0]] || "#666";
    var sub = kindLabel(th.k) + (th.t ? " · " + th.t : "");
    return '<span class="threat" data-poke="' + esc(th.n) + '" style="background:' + col + ";color:" + textColor(col) + '">' +
      portraitImg(th.n) + "<b>" + esc(th.n) + "</b><i>" + esc(sub) + "</i></span>";
  }

  function nameChips(list) {
    if (!list.length) return '<span class="none">' + esc(T("mapPhysNone")) + "</span>";
    return '<div class="chips">' + list.map(function (n) {
      var col = COLORS[POKEMON[n][0]] || "#666";
      return '<span class="chip" data-poke="' + esc(n) + '" style="background:' + col + ";color:" + textColor(col) + '">' + esc(n) + "</span>";
    }).join("") + "</div>";
  }

  function prow(r, i) {
    var ts = POKEMON[r.name];
    var c1 = COLORS[ts[0]] || "#666";
    var c2 = ts[1] ? (COLORS[ts[1]] || "#666") : c1;
    var why = [];
    if (r.hit && r.hit.v > 1.001) {
      why.push('<span class="rchip good">' + esc(tmpl(T("rHit"), { m: fmt(r.hit.v), n: r.hit.threat })) + "</span>");
    }
    if (r.taken && Math.abs(r.taken.v - 1) > 0.001) {
      why.push('<span class="rchip ' + (r.taken.v > 1 ? "bad" : "res") + '">' +
        esc(tmpl(r.taken.v > 1 ? T("rTakes") : T("rResists"), { m: fmt(r.taken.v), t: tname(r.taken.t) })) + "</span>");
    }
    why.push('<span class="rchip">' + esc(fill(T("rCov"), r.cov)) + "</span>");
    r.syn.forEach(function (s) {
      var d = traitOf(s.trait);
      why.push('<span class="rchip syn" title="' + esc(d[0] + ": " + d[1]) + '">' + esc(tagLabel(s.tag)) + "</span>");
    });
    return '<button type="button" class="prow" data-poke="' + esc(r.name) + '" style="--c1:' + c1 + ";--c2:" + c2 + '" title="' + esc(PARTNERS[r.name].p || "") + '">' +
      '<span class="prank">' + (i + 1) + "</span>" +
      '<span class="pmeta-wrap">' + portraitImg(r.name) + '<span class="pmeta"><span class="pname">' + esc(r.name) +
        (r.rarity === "legendary" ? ' <i class="lg">★</i>' : "") + "</span>" +
        '<span class="pchips">' + ts.map(function (t) { return chip(t); }).join("") +
        '<i class="rar">' + esc(rarityLabel(r.rarity)) + "</i></span></span></span>" +
      '<span class="pscore"><span class="bar"><i style="width:' + r.score + '%"></i></span><b>' + r.score + "%</b></span>" +
      '<span class="preasons">' + why.join("") + "</span>" +
      "</button>";
  }

  function badges(region) {
    return (region.season ? '<i class="badge">' + esc(region.season) + "</i>" : "") +
      '<i class="badge">' + esc(statusLabel(region.status)) + "</i>";
  }

  function mcard(region) {
    var col = REGION_COLOR[region.id] || "#8b90a3";
    var soon = region.status === "soon";
    var top = soon ? [] : rankRegion(region).slice(0, 3);
    var html = '<button type="button" class="mcard' + (soon ? " off" : "") + '" data-map="' + esc(region.id) +
      '" style="--c:' + col + ";--cd:" + darken(col, 0.55) + ";--cr:" + triplet(col) +
      ";--bg:url('" + biomeGround(REGION_BIOME[region.id]) + "')" + '">' +
      '<span class="mc-h"><b>' + esc(region.name) + '</b><span class="mc-badges">' + badges(region) + "</span></span>" +
      '<span class="mc-d">' + esc(regionDesc(region.id)) + "</span>";
    if (soon) return html + '<span class="mc-t">' + esc(T("mapSoon")) + "</span></button>";
    html += '<span class="mc-t">' + esc(fill(T("mapThreatCount"), region.threats.length)) + " · " +
      esc(fill(T("mapHazardCount"), (region.traits || []).length)) + "</span>";
    html += '<span class="mc-top"><i class="mc-topl">' + esc(T("mapTop")) + "</i>" +
      top.map(function (r) {
        return '<i class="pick" data-poke="' + esc(r.name) + '">' + portraitImg(r.name) + "<b>" + esc(r.name) + "</b><u>" + r.score + "%</u></i>";
      }).join("") + "</span>";
    return html + "</button>";
  }

  function mapsView() {
    var qn = norm(state.query);
    var list = REGIONS;
    if (qn) {
      list = REGIONS.filter(function (r) {
        if (norm(r.name).indexOf(qn) >= 0) return true;
        if (norm(regionDesc(r.id)).indexOf(qn) >= 0) return true;
        for (var i = 0; i < r.threats.length; i++) if (norm(r.threats[i].n).indexOf(qn) >= 0) return true;
        for (var j = 0; j < (r.traits || []).length; j++) if (norm(traitOf(r.traits[j])[0]).indexOf(qn) >= 0) return true;
        return false;
      });
    }
    if (!list.length) { shownCount = 0; return emptyHtml(T("mapNoResults"), T("searchMaps")); }
    shownCount = list.length;
    return '<div class="mgrid">' + list.map(mcard).join("") + "</div>" +
      '<div class="note">' + esc(T("mapsNote")) + " " + esc(T("mapWildNote")) + "</div>";
  }

  function mapView(id) {
    var region = REGION_BY_ID[id];
    if (!region) return emptyHtml();
    var col = REGION_COLOR[id] || "#8b90a3";
    var html = backBtn();
    html += '<div class="hero map" style="--r1:' + triplet(col) + ";--r2:" + triplet(col) +
      ";--bg:url('" + biomeGround(REGION_BIOME[id]) + "')" + '">' +
      '<h2 class="hname">' + esc(region.name) + '<span class="hero-badges">' + badges(region) + "</span></h2>" +
      "<p>" + esc(regionDesc(id)) + "</p>" +
      (region.eventUntil
        ? "<p>" + esc(tmpl(eventOver(region) ? T("mapEventOver") : T("mapEventUntil"), { date: fmtDate(region.eventUntil) })) + "</p>"
        : "") +
      "</div>";

    if (region.status === "soon") {
      return html + '<div class="note">' + esc(T("mapSoon")) + "</div>";
    }

    var unlock = region.unlockAfter && REGION_BY_ID[region.unlockAfter]
      ? tmpl(T("mapUnlockAfter"), { name: REGION_BY_ID[region.unlockAfter].name })
      : T("mapUnlockStart");
    html += panel(T("mapUnlock"), "", "", '<div class="unlock">' + esc(unlock) + "</div>");

    if (region.threats.length) {
      html += panel(T("mapThreats"), T("mapThreatsHint"), "",
        '<div class="threats">' + region.threats.map(threatPill).join("") + "</div>");
    }

    if ((region.traits || []).length) {
      html += panel(T("mapHazards"), "", "", '<div class="traits">' + region.traits.map(function (tr) {
        var d = traitOf(tr);
        return '<div class="trait"><b>' + esc(d[0]) + "</b><span>" + esc(d[1]) + "</span></div>";
      }).join("") + "</div>");
    }

    var rank = rankRegion(region);
    var top = rank.slice(0, 10);
    var rest = rank.slice(10);
    html += panel(T("mapBest"), T("mapBestHint") + " · " + fill(T("mapRanked"), rank.length), "",
      '<div class="ranklist">' + top.map(prow).join("") + "</div>" +
      (rest.length
        ? '<details class="neutral morebox"><summary>' + esc(fill(T("mapMore"), rest.length)) +
          '</summary><div class="ranklist">' + rest.map(function (r, i) { return prow(r, i + top.length); }).join("") + "</div></details>"
        : "") +
      '<div class="note inline">' + esc(T("mapLegendNote")) + " " +
        esc(tmpl(T("mapFoot"), { v: MAPS.version || "", d: fmtDate(MAPS.updated || "") })) + "</div>");

    if (!region.threats.length) {
      html += '<div class="note">' + esc(T("mapNoThreats")) + "</div>";
    }

    var avoid = rank.slice(10)
      .filter(function (r) { return r.taken && r.taken.v > 1.001; })
      .sort(function (a, b) { return a.score - b.score || b.taken.v - a.taken.v; })
      .slice(0, 6);
    if (avoid.length) {
      html += panel(T("mapAvoid"), T("mapAvoidHint"), "weak", '<div class="avoids">' + avoid.map(function (r) {
        return '<span class="avoid" data-poke="' + esc(r.name) + '"><b>' + esc(r.name) + "</b><i>" +
          esc(tmpl(T("rTakes"), { m: fmt(r.taken.v), t: tname(r.taken.t) })) + "</i></span>";
      }).join("") + "</div>");
    }

    var phys = PARTNER_NAMES.filter(function (n) { return (PARTNERS[n].g || []).indexOf("phys") >= 0; });
    var spec = PARTNER_NAMES.filter(function (n) { return (PARTNERS[n].g || []).indexOf("spec") >= 0; });
    html += panel(T("mapPhys"), "", "", '<div class="note tight">' + esc(T("mapPhysText")) + "</div>" +
      '<div class="physgrid">' +
        '<div class="phys"><b>' + esc(T("mapPhysList")) + "</b>" + nameChips(phys) + "</div>" +
        '<div class="phys"><b>' + esc(T("mapSpecList")) + "</b>" + nameChips(spec) + "</div>" +
      "</div>");

    return html;
  }

  var RUNS_KEY = "pokebonk_runs_v1";
  var LIVE_KEY = "pokebonk_run_live";
  var MIN_RUN = 20;
  var POINT_EVERY = 10;
  var HUD_GONE_MS = 15000;
  var runs = [];
  try { runs = JSON.parse(localStorage.getItem(RUNS_KEY) || "[]"); } catch (e) { runs = []; }
  if (!Array.isArray(runs)) runs = [];

  function pyApi() { return window.pywebview && window.pywebview.api; }

  function persist() {
    if (runs.length > 2000) runs = runs.slice(-2000);
    var txt = JSON.stringify(runs);
    try { localStorage.setItem(RUNS_KEY, txt); } catch (e) {}
    var a = pyApi();
    if (a && a.save_runs) { try { a.save_runs(txt); } catch (e) {} }
  }

  function mergeRuns(list) {
    if (!Array.isArray(list)) return 0;
    var have = {};
    runs.forEach(function (r) { have[r.id] = 1; });
    var added = 0;
    list.forEach(function (r) {
      if (r && r.id && !have[r.id]) { runs.push(r); have[r.id] = 1; added++; }
    });
    if (added) runs.sort(function (a, b) { return a.at - b.at; });
    return added;
  }

  var diskLoaded = false;
  function loadFromDisk() {
    var a = pyApi();
    if (diskLoaded || !a || !a.load_runs) return;
    diskLoaded = true;
    a.load_runs().then(function (txt) {
      var list = null;
      try { list = JSON.parse(txt || "[]"); } catch (e) {}
      var added = mergeRuns(list);
      if (added || !Array.isArray(list) || list.length !== runs.length) persist();
      if (added) refreshStats();
    }).catch(function () {});
  }
  if (pyApi()) loadFromDisk();
  window.addEventListener("pywebviewready", loadFromDisk);
  setTimeout(loadFromDisk, 3000);

  try {
    var pending = JSON.parse(localStorage.getItem(LIVE_KEY) || "null");
    localStorage.removeItem(LIVE_KEY);
    if (pending && pending.id && pending.dur >= MIN_RUN) {
      pending.end = "closed";
      if (mergeRuns([pending])) persist();
    }
  } catch (e) {}

  function visible(el) {
    if (!el) return false;
    return el.checkVisibility ? el.checkVisibility() : !!el.getClientRects().length;
  }

  function parseClock(s) {
    var p = String(s || "").trim().split(":");
    if (p.length < 2) return null;
    var t = 0;
    for (var i = 0; i < p.length; i++) {
      var v = parseFloat(p[i]);
      if (isNaN(v)) return null;
      t = t * 60 + v;
    }
    return Math.floor(t);
  }

  function parseCount(s) {
    s = String(s || "").replace(/[\s  ]/g, "");
    var m = s.match(/^([\d.,]+)([kKmM])?$/);
    if (!m) return null;
    if (m[2]) {
      var v = parseFloat(m[1].replace(",", "."));
      return isNaN(v) ? null : Math.round(v * (/k/i.test(m[2]) ? 1e3 : 1e6));
    }
    var n = parseInt(m[1].replace(/[.,]/g, ""), 10);
    return isNaN(n) ? null : n;
  }

  function text(sel, root) {
    var el = (root || document).querySelector(sel);
    return el ? (el.textContent || "").trim() : "";
  }

  function skinOf(portrait) {
    var img = portrait && portrait.querySelector("img");
    if (!img) return "";
    var src = img.getAttribute("src") || "";
    if (/(^|\s)lk-/.test(img.className)) return "look";
    if (/shiny/.test(src)) return "shiny";
    if (src.indexOf("data:") === 0) return "shiny";
    return "";
  }

  function readHud() {
    var top = document.querySelector(".hud-top");
    var biomeEl = top && top.querySelector(".ht-biome");
    if (!biomeEl || !visible(top)) return null;
    var t = parseClock(text(".timer", top));
    if (t == null) return null;
    var tier = top.querySelector(".ht-tier");
    var portrait = document.querySelector(".hud-tl .tl-portrait");
    var wallet = top.querySelector(".wallet");
    var hpBar = document.querySelector(".hpbar i");
    var hp = hpBar ? parseFloat((hpBar.style.transform.match(/scaleX\(([\d.e+-]+)\)/) || [])[1]) : NaN;
    return {
      t: t,
      biome: String(biomeEl.getAttribute("data-k") || "").split("|")[0],
      biomeName: (biomeEl.textContent || "").trim(),
      phase: text(".ht-zone", top),
      mode: tier ? tier.getAttribute("data-t") || "" : "",
      modeName: tier ? (tier.textContent || "").trim() : "",
      sp: portrait ? parseInt(portrait.getAttribute("data-k"), 10) || 0 : 0,
      skin: skinOf(portrait),
      spName: text(".hud-tl .tl-name"),
      lvl: parseCount(text(".hud-tl .tl-lvl b")) || 0,
      kills: parseCount(text(".hud-tr .counter span")) || 0,
      gold: wallet ? parseCount(wallet.getAttribute("data-g")) || 0 : 0,
      hp: isNaN(hp) ? null : Math.round(hp * 100)
    };
  }

  var cur = null;
  var lastSeen = 0;
  var lastLiveSave = 0;

  function newRun(h) {
    return {
      v: 1,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      at: Date.now() - h.t * 1000,
      biome: h.biome, biomeName: h.biomeName,
      mode: h.mode, modeName: h.modeName,
      sp0: h.sp, sp: h.sp, spName: h.spName,
      dur: h.t, lvl: h.lvl, kills: h.kills, gold: h.gold, phase: h.phase,
      minHp: h.hp == null ? 100 : h.hp,
      pts: [[h.t, h.lvl, h.kills, h.gold]],
      end: ""
    };
  }

  function updateRun(h) {
    var c = cur;
    c.dur = Math.max(c.dur, h.t);
    c.lvl = Math.max(c.lvl, h.lvl);
    c.kills = Math.max(c.kills, h.kills);
    c.gold = h.gold;
    if (h.phase) c.phase = h.phase;
    if (h.sp) c.sp = h.sp;
    if (h.spName) c.spName = h.spName;
    if (h.hp != null && h.hp < c.minHp) c.minHp = h.hp;
    var last = c.pts[c.pts.length - 1];
    if (h.t - last[0] >= POINT_EVERY) c.pts.push([h.t, c.lvl, c.kills, c.gold]);
  }

  function finishRun(reason) {
    if (!cur) return;
    var r = cur;
    cur = null;
    try { localStorage.removeItem(LIVE_KEY); } catch (e) {}
    if (r.dur < MIN_RUN) return;
    r.end = reason;
    var last = r.pts[r.pts.length - 1];
    if (last[0] !== r.dur) r.pts.push([r.dur, r.lvl, r.kills, r.gold]);
    runs.push(r);
    persist();
    refreshStats();
  }

  function resumeRun(h) {
    var r = runs[runs.length - 1];
    if (!r || r.biome !== h.biome || (h.sp !== r.sp && h.sp !== spOf(r))) return null;
    var endedAt = r.at + r.dur * 1000;
    if (h.t < r.dur - 1 || h.t - r.dur > 120 || Date.now() - endedAt > 60 * 60 * 1000) return null;
    runs.pop();
    persist();
    r.end = "";
    return r;
  }

  var lastResult = null;
  var RESULT_LINGER = 5 * 60 * 1000;

  function readResult() {
    var heroEl = document.querySelector(".sm-hero");
    if (!visible(heroEl)) return null;
    var k = Array.prototype.map.call(document.querySelectorAll(".sm-kpis .sm-kpi"), function (e) {
      var b = e.querySelector("b");
      return ((b || e).textContent || "").trim();
    });
    var win = heroEl.classList.contains("win");
    return {
      outcome: win ? "victory" : (cur && cur.mode === "endless" ? "survived" : "defeat"),
      time: k[0] || "", killsText: k[1] || "", dmgText: k[2] || "", pointsText: k[3] || ""
    };
  }

  function noteResult(r) {
    var c = cur || runs[runs.length - 1];
    if (!c) return;
    if (!lastResult || lastResult.id !== c.id) {
      c.result = r.outcome;
      c.dmgText = r.dmgText;
      c.pointsText = r.pointsText;
      if (!cur) persist();
      lastResult = {
        id: c.id, at: Date.now(), result: r.outcome,
        biome: c.biome, biomeName: c.biomeName, mode: c.mode, modeName: c.modeName,
        sp: c.sp, spName: c.spName || NAME_BY_ID[c.sp] || "", lvl: c.lvl,
        kills: c.kills, killsText: r.killsText, time: r.time || fmtDur(c.dur), dmgText: r.dmgText
      };
    }
  }

  function publish(h) {
    var s = { inRun: false };
    var showResult = lastResult && Date.now() - lastResult.at < RESULT_LINGER &&
      (!h || !cur || cur.id === lastResult.id);
    if (showResult) {
      s = {
        inRun: false, result: lastResult.result,
        biome: lastResult.biome, biomeName: lastResult.biomeName,
        mode: lastResult.mode, modeName: lastResult.modeName,
        sp: lastResult.sp, spName: lastResult.spName, lvl: lastResult.lvl,
        kills: lastResult.kills, killsText: lastResult.killsText, time: lastResult.time,
        dmgText: lastResult.dmgText, monImg: portraitUrl(lastResult.sp)
      };
    } else if (h && cur) {
      s = {
        inRun: true,
        biome: h.biome, biomeName: h.biomeName,
        mode: h.mode, modeName: h.modeName, phase: h.phase,
        sp: h.sp, spName: h.spName || NAME_BY_ID[h.sp] || "",
        lvl: cur.lvl, kills: cur.kills, t: h.t,
        start: Date.now() - h.t * 1000,
        skin: h.skin,
        mapImg: biomeGround(h.biome), monImg: portraitUrl(h.sp)
      };
    }
    window.__PBState = JSON.stringify(s);
  }

  function tick() {
    var h = null;
    try { h = readHud(); } catch (e) {}
    var now = Date.now();
    if (h) {
      lastSeen = now;
      if (cur && (h.biome !== cur.biome || h.t < cur.dur - 3)) finishRun("restart");
      if (!cur) cur = resumeRun(h) || newRun(h);
      else updateRun(h);
      if (now - lastLiveSave > 15000) {
        lastLiveSave = now;
        try { localStorage.setItem(LIVE_KEY, JSON.stringify(cur)); } catch (e) {}
      }
    } else if (cur && now - lastSeen > HUD_GONE_MS) {
      finishRun("menu");
    }
    var res = null;
    try { res = readResult(); } catch (e) {}
    if (res) noteResult(res);
    publish(h);
    setDockMode(!!h);
    refreshLiveCard();
  }

  window.addEventListener("pagehide", function () {
    if (cur) { try { localStorage.setItem(LIVE_KEY, JSON.stringify(cur)); } catch (e) {} }
  });

  var stx = { map: "", mode: "", mon: "", metric: "dur" };

  function locale() { return lang === "fr" ? "fr-FR" : lang === "pl" ? "pl-PL" : "en-US"; }
  function fmtNum(n) { return Math.round(n || 0).toLocaleString(locale()); }
  function fmtDur(s) {
    s = Math.max(0, Math.round(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + "h" + String(m).padStart(2, "0") : m + ":" + String(x).padStart(2, "0");
  }
  function kpmOf(r) { return r.dur > 0 ? r.kills / (r.dur / 60) : 0; }
  function spOf(r) { return r.sp0 || r.sp || 0; }
  function monName(id, fb) { return NAME_BY_ID[id] || fb || "#" + id; }
  function metricOf(r, m) {
    return m === "kills" ? r.kills : m === "kpm" ? kpmOf(r) : m === "lvl" ? r.lvl : m === "gold" ? r.gold : r.dur;
  }
  function fmtMetric(v, m) {
    if (m === "dur") return fmtDur(v);
    if (m === "kpm") return fmt(Math.round(v * 10) / 10);
    if (v >= 10000) return (Math.round(v / 100) / 10).toLocaleString(locale()) + "k";
    return fmtNum(v);
  }
  function agoText(ts) {
    var d = (Date.now() - ts) / 1000;
    if (d < 60) return S("now");
    var day = lang === "fr" ? " j" : " d";
    var n = d < 3600 ? Math.round(d / 60) + " min" : d < 86400 ? Math.round(d / 3600) + " h" : Math.round(d / 86400) + day;
    return tmpl(S("ago"), { n: n });
  }
  function endLabel(e) {
    return e === "closed" ? S("endClosed") : e === "restart" ? S("endRestart") : S("endMenu");
  }

  function filteredRuns() {
    return runs.filter(function (r) {
      return (!stx.map || r.biome === stx.map) && (!stx.mode || r.mode === stx.mode) &&
        (!stx.mon || String(spOf(r)) === stx.mon);
    });
  }

  function runThumb(r, big) {
    return '<span class="thumb' + (big ? " big" : "") + '" style="--bg:url(\'' + biomeGround(r.biome) + '\')">' +
      portraitImg(r.sp || spOf(r), "pt") + "</span>";
  }

  function statTile(label, value, sub) {
    return '<div class="stile"><small>' + esc(label) + "</small><b>" + esc(value) + "</b>" +
      (sub ? "<i>" + sub + "</i>" : "") + "</div>";
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= v) return steps[i] * p;
    return 10 * p;
  }

  function trendSvg(list, m) {
    var W = 680, H = 190, L = 50, R = 14, Tp = 12, B = 24;
    var vals = list.map(function (r) { return metricOf(r, m); });
    var top = Math.max.apply(null, vals.concat([m === "kpm" ? 1 : 10]));
    var max = m === "dur" ? niceMax(top / 60 / 4) * 4 * 60 : niceMax(top);
    var n = list.length;
    function x(i) { return n < 2 ? (L + W - R) / 2 : L + i * (W - L - R) / (n - 1); }
    function y(v) { return Tp + (H - Tp - B) * (1 - v / max); }
    var g = "";
    for (var k = 0; k <= 4; k++) {
      var gv = max * k / 4, gy = y(gv);
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" class="gl"/>' +
        '<text x="' + (L - 8) + '" y="' + (gy + 4) + '" class="ax" text-anchor="end">' + esc(fmtMetric(gv, m)) + "</text>";
    }
    var avg = [];
    for (var i = 0; i < n; i++) {
      var s = 0, c = 0;
      for (var j = Math.max(0, i - 4); j <= i; j++) { s += vals[j]; c++; }
      avg.push(x(i).toFixed(1) + "," + y(s / c).toFixed(1));
    }
    var dots = list.map(function (r, i) {
      return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(vals[i]).toFixed(1) + '" r="' + (i === n - 1 ? 6 : 4) +
        '" class="dot' + (i === n - 1 ? " last" : "") + '" data-run="' + esc(r.id) + '"><title>' +
        esc(monName(spOf(r), r.spName) + " · " + (r.biomeName || r.biome) + " · " + fmtMetric(vals[i], m)) +
        "</title></circle>";
    }).join("");
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img">' + g +
      (n > 1 ? '<polyline class="avg" points="' + avg.join(" ") + '"/>' : "") + dots + "</svg>";
  }

  function timelineSvg(r) {
    var pts = r.pts && r.pts.length ? r.pts : [[0, 1, 0, 0], [r.dur, r.lvl, r.kills, r.gold]];
    var W = 680, H = 200, L = 50, R = 44, Tp = 12, B = 26;
    var tMax = Math.max(1, pts[pts.length - 1][0]);
    var kMax = niceMax(Math.max(10, r.kills));
    var lMax = niceMax(Math.max(10, r.lvl));
    function x(t) { return L + (W - L - R) * t / tMax; }
    function yk(v) { return Tp + (H - Tp - B) * (1 - v / kMax); }
    function yl(v) { return Tp + (H - Tp - B) * (1 - v / lMax); }
    var g = "";
    for (var k = 0; k <= 4; k++) {
      var gy = yk(kMax * k / 4);
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" class="gl"/>' +
        '<text x="' + (L - 8) + '" y="' + (gy + 4) + '" class="ax k" text-anchor="end">' + esc(fmtMetric(kMax * k / 4, "kills")) + "</text>" +
        '<text x="' + (W - R + 8) + '" y="' + (gy + 4) + '" class="ax l">' + Math.round(lMax * k / 4) + "</text>";
    }
    for (var q = 1; q <= 4; q++) {
      var tx = x(tMax * q / 4);
      g += '<text x="' + tx + '" y="' + (H - 6) + '" class="ax" text-anchor="middle">' + fmtDur(tMax * q / 4) + "</text>";
    }
    var kp = pts.map(function (p) { return x(p[0]).toFixed(1) + "," + yk(p[2]).toFixed(1); });
    var area = x(pts[0][0]).toFixed(1) + "," + yk(0) + " " + kp.join(" ") + " " + x(pts[pts.length - 1][0]).toFixed(1) + "," + yk(0);
    var lp = pts.map(function (p) { return x(p[0]).toFixed(1) + "," + yl(p[1]).toFixed(1); }).join(" ");
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img">' + g +
      '<polygon class="karea" points="' + area + '"/><polyline class="kline" points="' + kp.join(" ") + '"/>' +
      '<polyline class="lline" points="' + lp + '"/></svg>' +
      '<div class="legend2"><span class="lk">' + esc(S("mKills")) + '</span><span class="ll">' + esc(S("mLvl")) + "</span></div>";
  }

  function selectBox(name, value, opts) {
    return '<label class="sel"><select data-stx="' + name + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select></label>";
  }

  function groupBy(list, keyFn) {
    var m = {};
    list.forEach(function (r) {
      var k = keyFn(r);
      (m[k] = m[k] || []).push(r);
    });
    return m;
  }

  function summaryRow(label, thumbHtml, list, attr) {
    var best = Math.max.apply(null, list.map(function (r) { return r.dur; }));
    var bestK = Math.max.apply(null, list.map(function (r) { return r.kills; }));
    var kpm = list.reduce(function (s, r) { return s + kpmOf(r); }, 0) / list.length;
    return '<button type="button" class="srow" ' + attr + ">" + thumbHtml +
      '<span class="sr-n"><b>' + esc(label) + "</b><small>" + esc(fill(S("plays"), list.length)) + "</small></span>" +
      '<span class="sr-v"><small>' + esc(S("bestTime")) + "</small><b>" + fmtDur(best) + "</b></span>" +
      '<span class="sr-v"><small>' + esc(S("bestKills")) + "</small><b>" + fmtMetric(bestK, "kills") + "</b></span>" +
      '<span class="sr-v"><small>' + esc(S("kpm")) + "</small><b>" + fmtMetric(kpm, "kpm") + "</b></span></button>";
  }

  function runRow(r) {
    return '<button type="button" class="rrow" data-run="' + esc(r.id) + '">' + runThumb(r) +
      '<span class="rr-n"><b>' + esc(monName(r.sp, r.spName)) + " <i>" + esc(S("lvl")) + " " + r.lvl + "</i>" +
        (r.result === "victory" ? ' <img class="pix won" src="' + asset("ui/icons/record.png") + '" alt="" title="Victory">' : "") + "</b>" +
      "<small>" + esc((r.biomeName || r.biome) + " · " + (r.modeName || r.mode)) + "</small></span>" +
      '<span class="rr-v"><b>' + fmtDur(r.dur) + "</b><small>" + esc(S("mDur")) + "</small></span>" +
      '<span class="rr-v"><b>' + fmtMetric(r.kills, "kills") + "</b><small>" + esc(S("mKills")) + "</small></span>" +
      '<span class="rr-v hide-s"><b>' + fmtMetric(kpmOf(r), "kpm") + "</b><small>" + esc(S("kpm")) + "</small></span>" +
      '<span class="rr-t">' + esc(agoText(r.at)) + "</span></button>";
  }

  function liveCardHtml() {
    if (!cur) return "";
    return '<div class="livecard">' + runThumb(cur) + '<span class="rr-n"><b>' + esc(monName(cur.sp, cur.spName)) +
      " <i>" + esc(S("lvl")) + " " + cur.lvl + '</i> <em class="live">' + esc(S("live")) + "</em></b><small>" +
      esc((cur.biomeName || cur.biome) + " · " + (cur.modeName || cur.mode)) +
      '</small></span><span class="rr-v"><b>' + fmtDur(cur.dur) + "</b><small>" + esc(S("mDur")) + "</small></span>" +
      '<span class="rr-v"><b>' + fmtMetric(cur.kills, "kills") + "</b><small>" + esc(S("mKills")) + "</small></span>" +
      '<span class="rr-v hide-s"><b>' + fmtMetric(kpmOf(cur), "kpm") + "</b><small>" + esc(S("kpm")) + "</small></span></div>";
  }

  function refreshLiveCard() {
    if (!isOpen || state.view !== "stats") return;
    var el = content.querySelector(".livecard");
    var html = liveCardHtml();
    if (el && html) el.outerHTML = html;
    else if (!!el !== !!html) refreshStats();
  }

  function statsView() {
    var all = runs;
    if (!all.length && !cur) {
      shownCount = 0;
      return '<div class="empty"><img class="pix" src="' + asset("ui/icons/record.png") + '" alt="" width="56" height="56"><b>' +
        esc(S("emptyT")) + "</b><span>" + esc(S("emptyH")) + "</span></div>";
    }
    var maps = {}, modes = {}, mons = {};
    all.forEach(function (r) {
      maps[r.biome] = r.biomeName || r.biome;
      modes[r.mode] = r.modeName || r.mode;
      mons[spOf(r)] = monName(spOf(r), r.spName);
    });
    var list = filteredRuns();
    shownCount = list.length;
    var html = '<div class="filters">' +
      selectBox("map", stx.map, [["", S("allMaps")]].concat(Object.keys(maps).map(function (k) { return [k, maps[k]]; }))) +
      selectBox("mode", stx.mode, [["", S("allModes")]].concat(Object.keys(modes).map(function (k) { return [k, modes[k]]; }))) +
      selectBox("mon", stx.mon, [["", S("allMons")]].concat(Object.keys(mons).sort(function (a, b) {
        return String(mons[a]).localeCompare(mons[b]);
      }).map(function (k) { return [k, mons[k]]; }))) +
      "</div>";

    html += liveCardHtml();

    if (!list.length) return html + emptyHtml(S("emptyT"), S("emptyH"));

    var total = list.reduce(function (s, r) { return s + r.dur; }, 0);
    var kpmAvg = list.reduce(function (s, r) { return s + kpmOf(r); }, 0) / list.length;
    var lvlAvg = list.reduce(function (s, r) { return s + r.lvl; }, 0) / list.length;
    html += '<div class="stiles">' +
      statTile(S("runs"), fmtNum(list.length)) +
      statTile(S("total"), fmtDur(total)) +
      statTile(S("bestTime"), fmtDur(Math.max.apply(null, list.map(function (r) { return r.dur; })))) +
      statTile(S("bestKills"), fmtMetric(Math.max.apply(null, list.map(function (r) { return r.kills; })), "kills")) +
      statTile(S("kpm"), fmtMetric(kpmAvg, "kpm")) +
      statTile(S("avgLvl"), fmt(Math.round(lvlAvg * 10) / 10)) +
      "</div>";

    var chartList = list.slice(-60);
    var m = stx.metric;
    var delta = "";
    if (list.length >= 6) {
      var last5 = list.slice(-5), prev5 = list.slice(-10, -5);
      var a = last5.reduce(function (s, r) { return s + metricOf(r, m); }, 0) / last5.length;
      var b = prev5.reduce(function (s, r) { return s + metricOf(r, m); }, 0) / prev5.length;
      if (b > 0) {
        var p = Math.round((a - b) / b * 100);
        delta = '<span class="delta ' + (p > 1 ? "up" : p < -1 ? "down" : "") + '">' +
          esc(p > 1 ? tmpl(S("better"), { p: p }) : p < -1 ? tmpl(S("worse"), { p: p }) : S("same")) + "</span>";
      }
    }
    var mBtns = [["dur", S("mDur")], ["kills", S("mKills")], ["kpm", S("mKpm")], ["lvl", S("mLvl")], ["gold", S("mGold")]]
      .map(function (b) {
        return '<button type="button" class="pill' + (m === b[0] ? " on" : "") + '" data-metric="' + b[0] + '">' + esc(b[1]) + "</button>";
      }).join("");
    html += '<div class="panel"><div class="panel-t">' + esc(S("trend")) + ' <span class="hint">' + esc(S("trendHint")) + "</span>" + delta + "</div>" +
      '<div class="seg sm metric">' + mBtns + "</div>" + trendSvg(chartList, m) + "</div>";

    html += '<div class="panel"><div class="panel-t">' + esc(S("recent")) + "</div>" +
      '<div class="rlist">' + list.slice(-12).reverse().map(runRow).join("") + "</div></div>";

    var byMon = groupBy(list, spOf);
    var monKeys = Object.keys(byMon).sort(function (a, b) { return byMon[b].length - byMon[a].length; });
    var byMap = groupBy(list, function (r) { return r.biome; });
    html += '<div class="cards">' +
      '<div class="panel"><div class="panel-t">' + esc(S("byMon")) + '</div><div class="slist">' +
        monKeys.slice(0, 12).map(function (k) {
          var l = byMon[k];
          return summaryRow(monName(+k, l[l.length - 1].spName), '<span class="sframe">' + portraitImg(+k) + "</span>", l, 'data-stmon="' + esc(k) + '"');
        }).join("") + "</div></div>" +
      '<div class="panel"><div class="panel-t">' + esc(S("byMap")) + '</div><div class="slist">' +
        Object.keys(byMap).map(function (k) {
          var l = byMap[k];
          return summaryRow(l[l.length - 1].biomeName || k, '<span class="sframe tile" style="--bg:url(\'' + biomeGround(k) + '\')"></span>', l, 'data-stmap="' + esc(k) + '"');
        }).join("") + "</div></div>" +
      "</div>";

    html += '<div class="foot-actions"><button type="button" class="btn ghost" data-folder>' + esc(S("exportB")) + "</button>" +
      '<span class="hint">' + esc(S("saved")) + "</span></div>";
    return html;
  }

  function runById(id) {
    for (var i = runs.length - 1; i >= 0; i--) if (runs[i].id === id) return runs[i];
    return null;
  }

  function runView(id) {
    var r = runById(id);
    if (!r) return emptyHtml();
    var html = backBtn();
    html += '<div class="hero map run" style="--r1:138,92,255;--r2:90,47,200;--bg:url(\'' + biomeGround(r.biome) + '\')">' +
      '<span class="hero-pt">' + portraitImg(r.sp || spOf(r), "pt big") + "</span>" +
      '<h2 class="hname">' + esc(monName(r.sp, r.spName)) + "</h2>" +
      "<p>" + esc((r.biomeName || r.biome) + " · " + (r.modeName || r.mode) + " · " + new Date(r.at).toLocaleString(locale()) + " · " + endLabel(r.end)) + "</p></div>";
    html += '<div class="stiles">' +
      statTile(S("mDur"), fmtDur(r.dur)) +
      statTile(S("mKills"), fmtMetric(r.kills, "kills")) +
      statTile(S("kpm"), fmtMetric(kpmOf(r), "kpm")) +
      statTile(S("mLvl"), String(r.lvl)) +
      statTile(S("mGold"), fmtNum(r.gold)) +
      statTile(S("minHp"), (r.minHp == null ? "—" : r.minHp + "%")) +
      "</div>";
    html += '<div class="panel"><div class="panel-t">' + esc(S("timeline")) + ' <span class="hint">' + esc(S("timelineHint")) + "</span></div>" +
      timelineSvg(r) + "</div>";
    return html;
  }

  function openFolder() {
    var a = pyApi();
    if (a && a.open_data_folder) { a.open_data_folder(); return; }
    try {
      var blob = new Blob([JSON.stringify(runs, null, 1)], { type: "application/json" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "pokebonk-runs.json";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 2000);
    } catch (e) {}
  }

  var CSS = `
:host{--paper:rgba(34,40,58,.97);--paper2:#1a1f2e;--paper3:#2a3248;--pill:#3a4466;--ink:#e7eaf6;--ink2:#aeb6cc;--ink3:#8d97b3;
--ring:inset 0 0 0 1px rgba(150,165,215,.16);--shadow:0 12px 32px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.4);
--red:#ff5a5f;--red-d:#e0303e;--orange:#ff9a3a;--yellow:#fc3;--blue:#3a8cff;--blue-d:#2563d8;--green:#36c96a;--green-d:#1fa04e;--purple:#8a5cff;--purple-d:#5a2fc8;
--stripes:repeating-linear-gradient(-45deg,#ffffff24 0 10px,#fff0 10px 20px);
--ft:"M PLUS Rounded 1c","Nunito",system-ui,sans-serif;--f:"Nunito",system-ui,sans-serif}
*,*::before,*::after{box-sizing:border-box}
.pix{image-rendering:pixelated;image-rendering:crisp-edges}
img.ti{width:14px;height:14px;flex:0 0 14px;margin-left:-2px}
kbd{display:inline-grid;place-items:center;min-width:22px;height:20px;padding:0 6px;border-radius:7px;background:#1a1f2e;color:#c9d0e4;font:900 11px/1 var(--ft);box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}

.dock{position:absolute;right:12px;bottom:12px;display:flex;align-items:center;gap:8px;pointer-events:auto;transition:opacity .2s}
.dock.inrun{opacity:.55}
.dock.inrun:hover,.dock:focus-within{opacity:1}
.dk{display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 14px 0 9px;border:0;border-radius:999px;background:rgba(34,40,58,.95);color:var(--ink);font:900 14px/1 var(--ft);cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.45),var(--ring);transition:transform .12s,background .12s}
.dk:hover{transform:translateY(-1px);background:rgba(44,52,76,.97)}
.dk:active{transform:translateY(1px)}
.dk .ui{flex:0 0 auto}
.dk.on{background:var(--stripes),linear-gradient(100deg,var(--red),var(--orange));box-shadow:0 4px 0 #b8323a,0 4px 14px rgba(0,0,0,.45)}
.dk.on kbd{background:rgba(0,0,0,.25);color:#fff}
.dock.inrun .ltext,.dock.inrun .dk kbd{display:none}
.dock.inrun .dk{padding:0 9px}
.vol{position:relative;display:flex;align-items:center;height:40px;border-radius:999px;background:rgba(34,40,58,.95);box-shadow:0 4px 14px rgba(0,0,0,.45),var(--ring);padding:0 4px}
.vol[hidden]{display:none}
.vbtn{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:var(--ink);cursor:pointer}
.vbtn:hover{background:rgba(255,255,255,.08)}
.vrange{width:0;opacity:0;transition:width .18s,opacity .18s,margin .18s;accent-color:var(--yellow);cursor:pointer}
.vol:hover .vrange,.vol:focus-within .vrange{width:96px;opacity:1;margin:0 10px 0 2px}

.screen{position:absolute;inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(12,14,26,.55);backdrop-filter:blur(4px);animation:fadeIn .14s ease-out}
.screen[hidden]{display:none}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.hub{position:relative;width:min(1060px,100%);height:min(760px,94vh);display:flex;flex-direction:column;background:var(--paper);border-radius:22px;box-shadow:var(--shadow),var(--ring);overflow:hidden;color:var(--ink);font:700 13px/1.45 var(--f);animation:pop .2s cubic-bezier(.2,1.3,.4,1)}
@keyframes pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.ribbon{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:12px 16px 12px 18px;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.15);background:var(--stripes),linear-gradient(100deg,var(--red),var(--orange))}
.ribbon.rb-types{background:var(--stripes),linear-gradient(100deg,var(--blue),#5fb0ff)}
.ribbon.rb-maps{background:var(--stripes),linear-gradient(100deg,var(--green-d),var(--green))}
.ribbon.rb-stats{background:var(--stripes),linear-gradient(100deg,var(--purple-d),var(--purple))}
.rb-ic{flex:0 0 auto;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.18)}
.titles{min-width:0;margin-right:auto}
.titles h1{margin:0;font:900 21px/1.15 var(--ft);letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.titles p{margin:1px 0 0;font:800 12px/1.3 var(--f);opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.langs{display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(0,0,0,.2)}
.lang{border:0;background:transparent;color:rgba(255,255,255,.8);font:900 11px/1 var(--ft);padding:6px 9px;border-radius:999px;cursor:pointer}
.lang:hover{color:#fff}
.lang.active{background:#fff;color:#2a2f45;text-shadow:none}
.xbtn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 6px 0 12px;border:0;border-radius:999px;background:rgba(0,0,0,.2);color:#fff;font:900 13px/1 var(--ft);cursor:pointer;text-shadow:none}
.xbtn:hover{background:rgba(0,0,0,.32)}
.tbar{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:12px 16px 4px;flex-wrap:wrap}
.seg{display:flex;gap:2px;padding:4px;border-radius:999px;background:var(--paper2);box-shadow:inset 0 1px 3px rgba(0,0,0,.4)}
.pill{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;background:transparent;color:var(--ink2);font:900 13.5px/1 var(--ft);padding:8px 13px;cursor:pointer;white-space:nowrap;transition:background .12s,color .12s}
.pill:hover{color:#fff}
.pill.on,.pill.active{background:var(--pill);color:#fff;box-shadow:0 2px 0 rgba(0,0,0,.35),0 4px 14px rgba(0,0,0,.3)}
.pill[hidden]{display:none}
.seg.sm .pill{font-size:12px;padding:6px 11px}
.searchwrap{position:relative;flex:1 1 220px;display:flex;align-items:center;min-width:180px}
.searchwrap[hidden]{display:none}
.sic{position:absolute;left:13px;pointer-events:none;color:var(--ink3);display:grid;place-items:center}
.q{width:100%;height:40px;padding:0 36px 0 38px;border:0;border-radius:999px;background:var(--paper2);color:#fff;font:800 13.5px var(--f);outline:none;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)}
.q:focus{box-shadow:inset 0 1px 3px rgba(0,0,0,.4),0 0 0 2px var(--yellow)}
.q::placeholder{color:var(--ink3)}
.clear{position:absolute;right:9px;border:0;background:var(--pill);color:#fff;width:22px;height:22px;border-radius:50%;font:900 13px/1 var(--ft);cursor:pointer;display:grid;place-items:center;padding:0}
.clear[hidden]{display:none}
.content{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:12px 16px 18px}
.content::-webkit-scrollbar{width:10px}
.content::-webkit-scrollbar-thumb{background:var(--pill);border-radius:10px;border:3px solid transparent;background-clip:content-box}
.foot{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 18px;background:var(--paper2);color:var(--ink3);font:800 11px/1.3 var(--f)}
.foot span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.view{animation:viewIn .16s ease-out}
@keyframes viewIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

.chips{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 7px;border-radius:999px;font:900 11px/1.4 var(--ft);cursor:pointer;border:0;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18);transition:filter .12s,transform .12s}
.chip:hover{filter:brightness(1.1);transform:translateY(-1px)}
.chip b{font-weight:900;font-size:10px;opacity:.85}
.big .chip{font-size:13px;padding:5px 12px 5px 9px}
.big img.ti{width:18px;height:18px;flex-basis:18px}
.panel{margin-top:12px;padding:12px 14px;border-radius:18px;background:var(--paper2)}
.panel-t{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;margin-bottom:10px;font:900 13px/1.2 var(--ft);color:#fff;letter-spacing:.2px}
.panel-t.weak{color:#ff8d96}
.panel-t.res{color:#7fe3a5}
.hint{font:800 11px/1.3 var(--f);color:var(--ink3);letter-spacing:0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:12px}
.cards>.panel{margin-top:0}
.note{margin-top:12px;padding:10px 12px;border-radius:14px;background:var(--paper2);color:var(--ink2);font:700 12px/1.55 var(--f)}
.note.inline{margin-top:10px;background:rgba(255,255,255,.04)}
.note.tight{margin-top:0;background:transparent;padding:0 0 4px}
.none{color:var(--ink3);font-size:12px}
.legend{margin-top:14px;color:var(--ink3);font:700 11px/1.6 var(--f)}
details.neutral{margin-top:12px;padding:11px 14px;border-radius:18px;background:var(--paper2)}
details.neutral summary{cursor:pointer;list-style:none;font:900 13px/1 var(--ft);color:var(--ink2)}
details.neutral summary::-webkit-details-marker{display:none}
details.neutral summary::before{content:"▸ "}
details.neutral[open] summary::before{content:"▾ "}
details.neutral .chips,details.neutral .ranklist{margin-top:10px}
.morebox{padding:0;background:transparent}
.empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 20px;text-align:center}
.empty b{font:900 17px/1.2 var(--ft);color:#fff}
.empty span{font-size:12.5px;color:var(--ink2);max-width:360px}
.orb{width:56px;height:56px;border-radius:50%;background:url("${asset("items/poke-ball.png")}") center/contain no-repeat;image-rendering:pixelated;opacity:.8}
.backb{display:inline-flex;align-items:center;gap:7px;margin-bottom:12px;height:34px;padding:0 14px 0 6px;border:0;border-radius:999px;background:var(--paper2);color:#fff;font:900 13px/1 var(--ft);cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.35)}
.backb:hover{background:var(--paper3)}
.btn{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 18px;border:0;border-radius:999px;color:#fff;font:900 13.5px/1 var(--ft);cursor:pointer;background:linear-gradient(#ff787c,var(--red) 60%,var(--red-d));box-shadow:0 4px 0 #9d222b,0 4px 14px rgba(0,0,0,.45)}
.btn.ghost{background:var(--pill);box-shadow:0 3px 0 rgba(0,0,0,.4)}
.btn:hover{filter:brightness(1.08)}
.btn:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.4)}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(186px,1fr));gap:8px}
.pcard{display:flex;align-items:center;gap:10px;padding:7px 10px 7px 7px;border-radius:18px;border:0;background:var(--paper2);color:var(--ink);cursor:pointer;text-align:left;font:inherit;transition:transform .12s,background .12s}
.pcard:hover{transform:translateY(-2px);background:var(--paper3)}
.pframe,.sframe{flex:0 0 auto;display:grid;place-items:center;width:52px;height:52px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,var(--c1,#3a4466),var(--c2,#2a3248));box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)}
.pframe img,.sframe img{width:100%;height:100%;object-fit:cover}
.pbody{min-width:0;display:flex;flex-direction:column;gap:3px}
.pnum{font:900 10px/1 var(--ft);color:var(--ink3);letter-spacing:.4px}
.pname{font:900 14px/1.15 var(--ft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pchips{display:flex;flex-wrap:wrap;gap:3px;align-items:center}
.pchips .chip{font-size:10px;padding:2px 7px 2px 5px}
.pchips img.ti{width:12px;height:12px;flex-basis:12px}

.tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px}
.tile{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:12px 14px;border-radius:18px;border:0;background:var(--stripes),linear-gradient(135deg,var(--c),var(--cd));color:var(--tc);cursor:pointer;font:inherit;text-align:left;overflow:hidden;min-height:84px;box-shadow:0 4px 0 rgba(0,0,0,.3);transition:transform .12s}
.tile:hover{transform:translateY(-2px)}
.tile::after{content:"";position:absolute;right:8px;bottom:8px;width:34px;height:34px;background:var(--ti) center/contain no-repeat;image-rendering:pixelated;opacity:.9}
.tname{font:900 16px/1.15 var(--ft)}
.ten{font:900 10px/1 var(--ft);opacity:.7;text-transform:uppercase;letter-spacing:.6px}
.tcount{margin-top:auto;font:800 11px/1 var(--f);opacity:.9}

.hero{position:relative;overflow:hidden;border-radius:20px;padding:18px 20px;background:var(--stripes),linear-gradient(115deg,rgba(var(--r1),.85),rgba(var(--r2),.55));box-shadow:0 4px 0 rgba(0,0,0,.3)}
.hero.has-pt,.hero.run{padding-left:128px;min-height:124px}
.hero.map{background:linear-gradient(90deg,rgba(26,31,46,.92),rgba(26,31,46,.55)),var(--bg) center/96px repeat}
.hero.map.run{background:linear-gradient(90deg,rgba(26,31,46,.85) 30%,rgba(26,31,46,.35)),var(--bg) center/96px repeat}
.hero-pt{position:absolute;left:16px;top:50%;transform:translateY(-50%);width:96px;height:96px;border-radius:20px;overflow:hidden;background:rgba(0,0,0,.18);box-shadow:inset 0 0 0 3px rgba(255,255,255,.35)}
.hero-pt img{width:100%;height:100%}
.hero .pnum{color:rgba(255,255,255,.75)}
.hname{margin:0 0 8px;font:900 28px/1.1 var(--ft);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.2)}
.hname .en{font:800 13px var(--f);color:rgba(255,255,255,.75);margin-left:6px}
.hero p{margin:0 0 8px;font:800 12.5px/1.45 var(--f);color:rgba(255,255,255,.9)}
.hero-badges{display:inline-flex;gap:5px;margin-left:10px;vertical-align:middle}
.badge{font:900 10px/1 var(--ft);text-transform:uppercase;letter-spacing:.5px;padding:4px 8px;border-radius:999px;background:rgba(0,0,0,.28);color:#fff;white-space:nowrap}
.evo{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.evo-name{cursor:pointer;padding:6px 11px;border-radius:999px;background:var(--paper3);color:#fff;font:900 12.5px/1 var(--ft)}
.evo-name:hover{background:var(--pill)}
.evo-name.cur{background:var(--yellow);color:#3a2a00}
.evo-arrow{color:var(--ink3);font-weight:900}
.atk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.atk{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04)}
.atk-h{margin-bottom:6px}
.arow{display:flex;align-items:flex-start;gap:8px;margin-top:6px}
.lbl{flex:0 0 60px;padding-top:4px;font:900 10.5px/1 var(--ft);text-transform:uppercase;letter-spacing:.4px}
.lbl.good{color:#7fe3a5}.lbl.bad{color:#ffd166}.lbl.soft{color:#ff8d96}

.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.mcard{position:relative;display:flex;flex-direction:column;gap:7px;padding:14px 15px;border-radius:20px;border:0;color:var(--ink);cursor:pointer;text-align:left;font:inherit;overflow:hidden;background:linear-gradient(180deg,rgba(26,31,46,.72),rgba(26,31,46,.96) 55%),var(--bg) center/80px repeat;box-shadow:0 4px 0 rgba(0,0,0,.3),inset 0 3px 0 var(--c);transition:transform .12s}
.mcard:hover{transform:translateY(-2px)}
.mcard.off{opacity:.55}
.mc-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mc-h b{font:900 17px/1.15 var(--ft);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.35)}
.mc-badges{display:flex;gap:4px;margin-left:auto}
.mc-d{font-size:12px;color:var(--ink2)}
.mc-t{font:900 10.5px/1 var(--ft);text-transform:uppercase;letter-spacing:.4px;color:var(--ink3)}
.mc-top{display:flex;flex-direction:column;gap:4px;margin-top:auto;padding-top:8px}
.mc-topl{font:900 10.5px/1 var(--ft);text-transform:uppercase;letter-spacing:.4px;color:#7fe3a5;font-style:normal}
.pick{display:flex;align-items:center;gap:6px;font-style:normal;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.07);cursor:pointer}
.pick:hover{background:rgba(255,255,255,.14)}
.pick b{font:900 12px/1 var(--ft)}
.pick img.pt{width:24px;height:24px;border-radius:50%;margin-left:-5px;background:rgba(255,255,255,.12)}
.pick u{margin-left:auto;text-decoration:none;font:900 11px/1 var(--ft);color:#7fe3a5}
.unlock{font-size:12.5px;color:var(--ink2)}
.threats{display:flex;flex-wrap:wrap;gap:6px}
.threat{display:inline-flex;align-items:center;gap:7px;padding:4px 12px 4px 4px;border-radius:999px;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.2)}
.threat img.pt{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.35)}
.threat b{font:900 13px/1 var(--ft)}
.threat i{font:800 10px/1 var(--f);font-style:normal;opacity:.85;text-transform:uppercase}
.traits{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px}
.trait{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04)}
.trait b{display:block;font:900 13px/1.2 var(--ft);color:var(--yellow);margin-bottom:3px}
.trait span{font-size:12px;color:var(--ink2)}
.ranklist{display:flex;flex-direction:column;gap:6px}
.prow{display:grid;grid-template-columns:24px minmax(0,1fr) 108px;gap:4px 10px;align-items:center;width:100%;padding:7px 12px 8px 8px;border-radius:16px;border:0;background:rgba(255,255,255,.04);color:var(--ink);cursor:pointer;text-align:left;font:inherit;transition:background .12s}
.prow:hover{background:rgba(255,255,255,.09)}
.prank{font:900 13px/1 var(--ft);color:var(--ink3);text-align:center}
.pmeta-wrap{display:flex;align-items:center;gap:9px;min-width:0}
.pmeta-wrap img.pt{flex:0 0 40px;width:40px;height:40px;border-radius:12px;background:linear-gradient(160deg,var(--c1),var(--c2))}
.pmeta{min-width:0;display:flex;flex-direction:column;gap:3px}
.pmeta .pname{font-size:13.5px}
.lg{font-style:normal;color:var(--yellow)}
.rar{font:900 9.5px/1 var(--ft);font-style:normal;text-transform:uppercase;color:var(--ink3);background:rgba(255,255,255,.07);padding:3px 6px;border-radius:999px}
.pscore{display:flex;align-items:center;gap:7px;justify-content:flex-end}
.pscore b{font:900 13px/1 var(--ft);color:#7fe3a5;min-width:36px;text-align:right}
.bar{position:relative;flex:0 0 56px;height:8px;border-radius:999px;background:rgba(0,0,0,.35);overflow:hidden}
.bar i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--yellow),var(--green))}
.preasons{grid-column:2/4;display:flex;flex-wrap:wrap;gap:4px}
.rchip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font:800 11px/1.4 var(--f);background:rgba(255,255,255,.07);color:var(--ink2)}
.rchip.good{background:rgba(54,201,106,.18);color:#7fe3a5}
.rchip.bad{background:rgba(255,90,95,.18);color:#ff8d96}
.rchip.res{background:rgba(58,140,255,.18);color:#9cc4ff}
.rchip.syn{background:rgba(255,204,51,.15);color:var(--yellow)}
.avoids{display:flex;flex-wrap:wrap;gap:6px}
.avoid{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:rgba(255,90,95,.14);cursor:pointer}
.avoid:hover{background:rgba(255,90,95,.24)}
.avoid b{font:900 12px/1 var(--ft);color:#ffd7d7}
.avoid i{font-style:normal;font-size:11px;color:#ff8d96}
.physgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:8px}
.phys{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04)}
.phys>b{display:block;font:900 12px/1 var(--ft);color:var(--ink2);margin-bottom:8px}

.filters{display:flex;flex-wrap:wrap;gap:8px}
.sel{position:relative}
.sel::after{content:"▾";position:absolute;right:13px;top:50%;transform:translateY(-50%);color:var(--ink2);pointer-events:none;font-size:12px}
.sel select{appearance:none;height:36px;padding:0 32px 0 14px;border:0;border-radius:999px;background:var(--paper2);color:#fff;font:900 12.5px/1 var(--ft);cursor:pointer;box-shadow:inset 0 1px 3px rgba(0,0,0,.4);outline:none}
.sel select:focus{box-shadow:0 0 0 2px var(--yellow)}
.sel option{background:#22283a}
.stiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:12px}
.stile{display:flex;flex-direction:column;gap:3px;padding:11px 14px;border-radius:16px;background:var(--paper2)}
.stile small{font:900 10.5px/1 var(--ft);text-transform:uppercase;letter-spacing:.4px;color:var(--ink3)}
.stile b{font:900 22px/1.1 var(--ft);color:#fff}
.metric{display:inline-flex;margin-bottom:6px}
.delta{margin-left:auto;font:900 11.5px/1 var(--ft);padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.07);color:var(--ink2)}
.delta.up{background:rgba(54,201,106,.18);color:#7fe3a5}
.delta.down{background:rgba(255,90,95,.18);color:#ff8d96}
.chart{display:block;width:100%;height:auto}
.chart .gl{stroke:rgba(150,165,215,.13);stroke-width:1}
.chart .ax{fill:var(--ink3);font:800 11px var(--f)}
.chart .ax.k{fill:var(--yellow)}.chart .ax.l{fill:#9cc4ff}
.chart .avg{fill:none;stroke:var(--red);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.chart .dot{fill:var(--yellow);stroke:#1a1f2e;stroke-width:2;cursor:pointer}
.chart .dot:hover{r:7}
.chart .dot.last{fill:#fff;stroke:var(--red);stroke-width:3}
.chart .karea{fill:rgba(255,204,51,.14)}
.chart .kline{fill:none;stroke:var(--yellow);stroke-width:3;stroke-linejoin:round}
.chart .lline{fill:none;stroke:#7fb3ff;stroke-width:2.5;stroke-dasharray:6 5;stroke-linejoin:round}
.legend2{display:flex;gap:14px;margin-top:4px;font:900 11.5px/1 var(--ft)}
.legend2 .lk{color:var(--yellow)}.legend2 .ll{color:#7fb3ff}
.rlist,.slist{display:flex;flex-direction:column;gap:6px}
.rrow,.srow,.livecard{display:flex;align-items:center;gap:12px;width:100%;padding:6px 14px 6px 6px;border:0;border-radius:16px;background:rgba(255,255,255,.04);color:var(--ink);cursor:pointer;text-align:left;font:inherit;transition:background .12s}
.rrow:hover,.srow:hover{background:rgba(255,255,255,.09)}
.livecard{margin-top:12px;cursor:default;background:var(--stripes),linear-gradient(100deg,rgba(54,201,106,.28),rgba(54,201,106,.08));box-shadow:inset 0 0 0 2px rgba(54,201,106,.5)}
.thumb{position:relative;flex:0 0 auto;width:72px;height:52px;border-radius:12px;overflow:hidden;background:var(--bg) center/64px repeat;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)}
.thumb img{position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%);border-radius:10px;box-shadow:0 0 0 2px #fff,0 3px 8px rgba(0,0,0,.5)}
.sframe.tile{background:var(--bg) center/56px repeat;min-height:0;padding:0;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)}
.sframe.tile::after{display:none}
.rr-n,.sr-n{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px}
.rr-n b,.sr-n b{font:900 14px/1.15 var(--ft);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rr-n b i{font:900 11px var(--ft);font-style:normal;color:var(--ink3);margin-left:4px}
.rr-n b img.won{width:18px;height:18px;vertical-align:-3px;margin-left:4px}
.rr-n small,.sr-n small{font:800 11.5px/1.2 var(--f);color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rr-v,.sr-v{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:58px}
.rr-v b,.sr-v b{font:900 15px/1 var(--ft);color:#fff}
.rr-v small,.sr-v small{font:900 9.5px/1 var(--ft);text-transform:uppercase;color:var(--ink3)}
.rr-t{flex:0 0 76px;text-align:right;font:800 11px/1.2 var(--f);color:var(--ink3)}
.live{font:900 10px/1 var(--ft);font-style:normal;text-transform:uppercase;color:#062;background:#7fe3a5;padding:3px 7px;border-radius:999px;margin-left:6px;vertical-align:middle}
.foot-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}

@media (max-width:760px){
.screen{padding:8px}
.hub{height:96vh;border-radius:18px}
.ribbon{padding:10px 12px}
.titles h1{font-size:18px}
.rb-ic{display:none}
.tbar{padding:10px 10px 2px}
.nav{width:100%;overflow-x:auto}
.content{padding:10px 10px 16px}
.cards,.atk-grid,.mgrid,.physgrid,.traits{grid-template-columns:minmax(0,1fr)}
.prow{grid-template-columns:20px minmax(0,1fr) 84px}
.hero.has-pt,.hero.run{padding-left:96px}
.hero-pt{width:70px;height:70px;left:12px}
.hname{font-size:22px}
.hide-s,.rr-t{display:none}
.foot{display:none}
}
@media (prefers-reduced-motion:reduce){
*,*::before,*::after{animation-duration:.01ms !important;transition-duration:.01ms !important}
}
`;

  var NAV = [
    { v: "dex", icon: "items/poke-ball.png", label: function () { return T("navDex"); }, rb: "rb-dex" },
    { v: "types", icon: "ui/types/fire.png", label: function () { return T("navTypes"); }, rb: "rb-types" },
    { v: "maps", icon: "ui/icons/map-portal.png", label: function () { return T("navMaps"); }, rb: "rb-maps" },
    { v: "stats", icon: "ui/icons/record.png", label: function () { return S("nav"); }, rb: "rb-stats" }
  ];

  var SPEAKER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 9.5h3.6L12.5 5v14l-4.9-4.5H4z"/>' +
    '<path class="w1" d="M15.3 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path class="w2" d="M17.8 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path class="mute" d="M16 9.5l5 5m0-5l-5 5" stroke="#ff8d96" stroke-width="2.4" stroke-linecap="round"/></svg>';

  var host = document.createElement("div");
  host.id = "pb-hub-host";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;";
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML = "<style>" + CSS + "</style>" +
    '<div class="dock" id="dock">' +
      '<div class="vol" id="vol" hidden><button type="button" class="vbtn" id="vbtn">' + SPEAKER + "</button>" +
        '<input type="range" class="vrange" id="vrange" min="0" max="100" step="1"></div>' +
      '<button type="button" class="dk" id="launcher" data-open>' + uiIcon("ui/icons/research.png", 24) +
        '<span class="ltext">Menu</span><kbd>F2</kbd></button>' +
    "</div>" +
    '<div class="screen" id="screen" hidden>' +
      '<div class="hub" role="dialog" aria-modal="true" id="hub">' +
        '<header class="ribbon" id="ribbon">' +
          '<span class="rb-ic" id="rbIc"></span>' +
          '<div class="titles"><h1 id="hTitle">Pokédex</h1><p id="hSub"></p></div>' +
          '<div class="langs" id="langs">' +
            '<button type="button" class="lang" data-lang="pl">PL</button>' +
            '<button type="button" class="lang" data-lang="en">EN</button>' +
            '<button type="button" class="lang" data-lang="fr">FR</button>' +
          "</div>" +
          '<button type="button" class="xbtn" id="close" data-close><span>×</span><kbd>Esc</kbd></button>' +
        "</header>" +
        '<div class="tbar">' +
          '<nav class="seg nav" id="nav">' + NAV.map(function (n) {
            return '<button type="button" class="pill" data-view="' + n.v + '">' + uiIcon(n.icon, 20) + '<span data-label="' + n.v + '"></span></button>';
          }).join("") + "</nav>" +
          '<div class="searchwrap" id="searchwrap">' +
            '<span class="sic">' + IC.search + "</span>" +
            '<input class="q" id="q" type="text" autocomplete="off" spellcheck="false">' +
            '<button type="button" class="clear" id="clear" data-clear hidden>×</button>' +
          "</div>" +
        "</div>" +
        '<div class="content" id="content"></div>' +
        '<footer class="foot"><span id="ver">PokeBonk</span><span><kbd>F2</kbd><b id="footHint"></b></span></footer>' +
      "</div>" +
    "</div>";

  (document.body || document.documentElement).appendChild(host);

  var dock = root.getElementById("dock");
  var launcher = root.getElementById("launcher");
  var screen = root.getElementById("screen");
  var hub = root.getElementById("hub");
  var ribbon = root.getElementById("ribbon");
  var closeBtn = root.getElementById("close");
  var clearBtn = root.getElementById("clear");
  var searchwrap = root.getElementById("searchwrap");
  var q = root.getElementById("q");
  var content = root.getElementById("content");
  var hTitle = root.getElementById("hTitle");
  var hSub = root.getElementById("hSub");
  var langsEl = root.getElementById("langs");

  var state = { view: "dex", sel: "", query: "" };
  var hist = [];
  var isOpen = false;
  var needsRender = true;
  var shownCount = 0;

  var volBox = root.getElementById("vol");
  var vbtn = root.getElementById("vbtn");
  var vrange = root.getElementById("vrange");
  function volApi() { return window.__pbVolApi; }
  function paintVol() {
    var a = volApi();
    if (!a) return;
    var v = a.get();
    volBox.hidden = false;
    vrange.value = String(Math.round(v * 100));
    vbtn.querySelector(".w1").style.display = v > 0 ? "" : "none";
    vbtn.querySelector(".w2").style.display = v > 0.5 ? "" : "none";
    vbtn.querySelector(".mute").style.display = v > 0 ? "none" : "";
  }
  vbtn.addEventListener("click", function () { var a = volApi(); if (a) { a.toggle(); paintVol(); } });
  vrange.addEventListener("input", function () { var a = volApi(); if (a) { a.set(parseInt(vrange.value, 10) / 100); paintVol(); } });
  window.__PBHubVolume = paintVol;
  paintVol();

  var dockInRun = null;
  function setDockMode(inRun) {
    if (inRun === dockInRun) return;
    dockInRun = inRun;
    dock.classList.toggle("inrun", inRun);
  }

  function snapshot() { return { view: state.view, sel: state.sel, query: state.query }; }

  function isDetail() { return state.view === "poke" || state.view === "type" || state.view === "map" || state.view === "run"; }
  function hasSearch() { return !isDetail() && state.view !== "stats"; }

  function rootView() {
    return state.view === "poke" ? "dex"
      : state.view === "type" ? "types"
      : state.view === "map" ? "maps"
      : state.view === "run" ? "stats"
      : state.view;
  }

  function headerTexts() {
    if (state.view === "stats" || state.view === "run") {
      return [S("nav"), runs.length ? fill(S("sub"), runs.length) : S("subNone")];
    }
    if (state.view === "map") {
      var r = REGION_BY_ID[state.sel];
      if (!r) return [T("navMaps"), ""];
      return [r.name, T("navMaps") + " · " +
        (r.threats.length ? fill(T("mapThreatCount"), r.threats.length) : statusLabel(r.status))];
    }
    if (state.view === "maps") return [T("navMaps"), fill(T("mapsSub"), REGIONS.length)];
    if (state.view === "poke") {
      var ts = POKEMON[state.sel] || [];
      return [state.sel, T("navDex") + " · " + ts.map(tname).join(" / ")];
    }
    if (state.view === "type") {
      return [tname(state.sel), T("navTypes") + " · " + fill(T("typeCount"), TYPE_COUNTS[state.sel])];
    }
    if (state.view === "types") return [T("navTypes"), fill(T("typesSub"), TYPES.length)];
    return [T("navDex"), fill(T("dexSub"), NAMES.length)];
  }

  function renderLauncher() {
    launcher.title = T("launcherTitle");
    launcher.querySelector(".ltext").textContent = S("tools");
  }

  function renderShell() {
    renderLauncher();
    var rv = rootView();
    var nav = NAV.filter(function (n) { return n.v === rv; })[0] || NAV[0];
    ribbon.className = "ribbon " + nav.rb;
    root.getElementById("rbIc").innerHTML = uiIcon(nav.icon, 26);
    Array.prototype.forEach.call(root.querySelectorAll("[data-label]"), function (el) {
      var n = NAV.filter(function (x) { return x.v === el.getAttribute("data-label"); })[0];
      el.textContent = n.label();
    });
    root.querySelector('.pill[data-view="maps"]').hidden = !HAS_MAPS;
    root.getElementById("ver").textContent = "PokeBonk Toolkit" + (VERSION ? " · data " + VERSION : "");
    root.getElementById("footHint").textContent = S("tools") + " · Esc";
    closeBtn.title = T("close");
    clearBtn.title = T("clear");
    q.placeholder = state.view === "maps" ? T("searchMaps") : T("searchPoke");

    var h = headerTexts();
    hTitle.textContent = h[0];
    hSub.textContent = h[1];

    searchwrap.hidden = !hasSearch();
    clearBtn.hidden = !state.query;

    Array.prototype.forEach.call(root.querySelectorAll(".nav .pill"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-view") === rv);
    });
    Array.prototype.forEach.call(langsEl.querySelectorAll(".lang"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
  }

  function decorateTiles() {
    Array.prototype.forEach.call(content.querySelectorAll(".tile[data-type]"), function (el) {
      el.style.setProperty("--ti", 'url("' + asset("ui/types/" + el.getAttribute("data-type").toLowerCase() + ".png") + '")');
    });
  }

  function renderContent() {
    var html;
    if (state.view === "poke" && POKEMON[state.sel]) html = pokeView(state.sel);
    else if (state.view === "type" && TYPES.indexOf(state.sel) >= 0) html = typeView(state.sel);
    else if (state.view === "map" && REGION_BY_ID[state.sel]) html = mapView(state.sel);
    else if (state.view === "run") html = runView(state.sel);
    else if (state.view === "stats") html = statsView();
    else if (state.view === "maps") html = mapsView();
    else html = state.view === "types" ? typesView() : dexView();
    content.innerHTML = '<div class="view">' + html + "</div>";
    decorateTiles();
    if (hasSearch()) {
      hSub.textContent = norm(state.query) ? fill(T("foundSub"), shownCount) : headerTexts()[1];
    }
  }

  function renderAll() {
    needsRender = false;
    renderShell();
    renderContent();
  }

  function refreshStats() {
    needsRender = true;
    if (isOpen && (state.view === "stats" || state.view === "run")) {
      var top = content.scrollTop;
      renderAll();
      content.scrollTop = top;
    }
  }

  function setView(v) {
    if (v !== "dex" && v !== "types" && v !== "maps" && v !== "stats") return;
    if (v === "maps" && !HAS_MAPS) return;
    hist = [];
    state.view = v;
    state.sel = "";
    state.query = "";
    q.value = "";
    renderAll();
    content.scrollTop = 0;
    focusMain();
  }

  function openDetail(view, sel) {
    hist.push(snapshot());
    state.view = view;
    state.sel = sel;
    state.query = "";
    q.value = "";
    renderAll();
    content.scrollTop = 0;
    focusMain();
  }
  function openPoke(name) { if (POKEMON[name]) openDetail("poke", name); }
  function openType(type) { if (TYPES.indexOf(type) >= 0) openDetail("type", type); }
  function openMap(id) { if (REGION_BY_ID[id]) openDetail("map", id); }
  function openRun(id) { if (runById(id)) openDetail("run", id); }

  function goBack() {
    var s = hist.pop();
    if (!s) s = { view: rootView(), sel: "", query: "" };
    state.view = s.view;
    state.sel = s.sel;
    state.query = s.query;
    q.value = s.query;
    renderAll();
    content.scrollTop = 0;
    focusMain();
  }

  function focusMain() {
    if (!isOpen) return;
    setTimeout(function () {
      if (!isOpen) return;
      if (hasSearch()) q.focus();
      else hub.focus();
    }, 30);
  }

  function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    renderAll();
  }

  function openHub(view) {
    if (isOpen) return;
    if (view && view !== state.view) { state.view = view; state.sel = ""; hist = []; needsRender = true; }
    if (needsRender || state.query || state.view === "stats") {
      cancelSearch();
      state.query = "";
      q.value = "";
      renderAll();
    }
    isOpen = true;
    screen.hidden = false;
    launcher.classList.add("on");
    focusMain();
  }

  function closeHub() {
    if (!isOpen) return;
    isOpen = false;
    screen.hidden = true;
    launcher.classList.remove("on");
    q.blur();
    hub.blur();
    launcher.blur();
  }

  function toggleHub() {
    if (isOpen) closeHub();
    else openHub();
  }

  screen.addEventListener("click", function (e) {
    if (e.target === screen) closeHub();
  });

  var searchTimer = 0;
  function cancelSearch() {
    if (searchTimer) { clearTimeout(searchTimer); searchTimer = 0; }
  }
  function flushSearch() {
    if (!searchTimer) return;
    cancelSearch();
    renderContent();
  }
  function resetSearch() {
    cancelSearch();
    q.value = "";
    state.query = "";
    clearBtn.hidden = true;
    renderContent();
  }

  q.addEventListener("input", function () {
    state.query = q.value;
    clearBtn.hidden = !state.query;
    cancelSearch();
    searchTimer = setTimeout(function () { searchTimer = 0; renderContent(); }, 140);
  });

  q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      flushSearch();
      if (!norm(state.query)) return;
      var el = content.querySelector("[data-poke],[data-type],[data-map]");
      if (!el) return;
      if (el.hasAttribute("data-poke")) openPoke(el.getAttribute("data-poke"));
      else if (el.hasAttribute("data-map")) openMap(el.getAttribute("data-map"));
      else openType(el.getAttribute("data-type"));
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (q.value) resetSearch();
      else closeHub();
    }
  });

  root.addEventListener("change", function (e) {
    var el = e.target;
    if (el && el.hasAttribute && el.hasAttribute("data-stx")) {
      stx[el.getAttribute("data-stx")] = el.value;
      renderContent();
    }
  });

  root.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var el;
    if ((el = e.target.closest("[data-lang]"))) { setLang(el.getAttribute("data-lang")); return; }
    if ((el = e.target.closest("[data-close]"))) { closeHub(); return; }
    if ((el = e.target.closest("[data-clear]"))) { resetSearch(); q.focus(); return; }
    if ((el = e.target.closest("[data-back]"))) { goBack(); return; }
    if ((el = e.target.closest("[data-metric]"))) { stx.metric = el.getAttribute("data-metric"); renderContent(); return; }
    if ((el = e.target.closest("[data-stmon]"))) { stx.mon = el.getAttribute("data-stmon"); renderContent(); content.scrollTop = 0; return; }
    if ((el = e.target.closest("[data-stmap]"))) { stx.map = el.getAttribute("data-stmap"); renderContent(); content.scrollTop = 0; return; }
    if ((el = e.target.closest("[data-folder]"))) { openFolder(); return; }
    if ((el = e.target.closest("[data-run]"))) { openRun(el.getAttribute("data-run")); return; }
    if ((el = e.target.closest("[data-view]"))) { setView(el.getAttribute("data-view")); return; }
    if ((el = e.target.closest("[data-type]"))) { openType(el.getAttribute("data-type")); return; }
    if ((el = e.target.closest("[data-poke]"))) { openPoke(el.getAttribute("data-poke")); return; }
    if ((el = e.target.closest("[data-map]"))) { openMap(el.getAttribute("data-map")); return; }
    if ((el = e.target.closest("[data-open]"))) { toggleHub(); return; }
  });

  window.addEventListener("keydown", function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    var inHost = path.indexOf(host) >= 0;
    if (e.key === "F2") {
      if (!inHost) { e.preventDefault(); e.stopPropagation(); }
      toggleHub();
      return;
    }
    if (!isOpen) return;
    if (e.key === "Escape") {
      if (path.indexOf(q) >= 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (isDetail()) goBack();
      else closeHub();
      return;
    }
    if (!inHost) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  ["keyup", "keypress"].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!isOpen) return;
      var path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(host) >= 0) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  });

  ["pointerdown", "mousedown", "mouseup", "click", "dblclick", "contextmenu", "wheel", "touchstart", "touchend"].forEach(function (ev) {
    host.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
  });
  ["keydown", "keyup", "keypress"].forEach(function (ev) {
    host.addEventListener(ev, function (e) { e.stopPropagation(); });
  });

  hub.setAttribute("tabindex", "-1");
  hub.style.outline = "none";

  function ensureHost() {
    if (document.hidden) return;
    if (document.body && !document.body.contains(host)) document.body.appendChild(host);
  }
  document.addEventListener("fullscreenchange", ensureHost);
  document.addEventListener("visibilitychange", ensureHost);
  setInterval(ensureHost, 4000);

  renderLauncher();
  setInterval(tick, 1000);
  tick();
})();
