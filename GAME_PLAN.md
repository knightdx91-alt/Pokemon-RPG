# Pokémon RPG — Master Game Plan

> This is the single source of truth for the vision. It exists so the vision
> does not have to be re-explained every session. Read it first, every time.

## THE SACRED RULE (never change, never compromise)

**It must look and act EXACTLY like Pokémon Platinum — not an approximation.**
Every screen, every menu, every sub-menu, every message box, every font, every
transition, every sound must be pixel- and behavior-identical to the real DS
game. "Close enough" is a failure. When in doubt, extract the real asset from
the ROM and pixel-diff against ground truth — never hand-draw or approximate.

Everything else in this document is negotiable. This rule is not.

---

## The vision (in one paragraph)

A browser-based Pokémon game, hosted on **GitHub Pages**, covering **regions
1–7** (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola). You walk the real
maps in **3D** (DS/3DS-style), with a **button to toggle to 2D**. It plays like
**Pokémon Platinum with the other regions bolted on** — the full Platinum
feature set, UI, and feel. Single-player first, done to the "exact Platinum"
bar above. **Then** it becomes multiplayer with additional features. We do not
move on to multiplayer, or even to region 2, until the current target looks
exactly right.

## Build order (do not reorder)

1. **Sinnoh first.** Get one region fully playable, in 3D with a 2D toggle,
   with the exact Platinum UI. This is the vertical slice that proves the whole
   stack.
2. Then the rest of the **first four regions**: Kanto, Johto, Hoenn.
3. Then regions **5–7**: Unova, Kalos, Alola.
4. Only after single-player is exactly right: **multiplayer** + extra features.

**Do not build anything else until each stage is signed off.** As of this plan,
nothing is greenlit to build — this document is the agreed spec to build
*against* next.

---

## What we already have (assets & prior work to reuse)

All of the following lives in the **Pokemon-Game** repo (`knightdx91-alt/Pokemon-Game`)
and its sibling decomp repos in scope. This project pulls from them; it does not
re-derive them.

### 3D map assets & the 3D/2D toggle — already prototyped
- **`unleashed.html`** (Pokemon-Game) is a working proof-of-concept: a **three.js**
  3D overworld render of a Sinnoh/Johto map (New Bark) with a live **3D ⇄ 2.5D
  toggle** (`#b3d` / `#b2d` buttons), player billboard sprite, and a pre-baked
  `data/unleashed/newbark_2d.png` for the 2D view. `src/vendor/three.min.js` +
  `OrbitControls.js` are vendored. **This is the seed of the 3D/2D system** — the
  toggle the user asked for already exists here.
- **`platinum-ui.html`** — a Platinum two-screen (256×192) UI prototype
  ("Pokémon Unleashed — Platinum UI"), integer-scaled, Poketch-style bottom
  screen. Reference for the exact-UI layout work.
- **3D model pipeline (built & proven):** `tools/nitro_g3d.py` (from-spec Nitro
  G3D / BMD0/NSBMD decoder — game-agnostic), `tools/render_platinum_maps.py`
  (rasterizer + textured top-down bake). These decode DS map geometry + textures
  and already produced pixel-real Sinnoh renders and a pixel-real Unova (Nuvema)
  render using the **same unchanged rasterizer**.

### Map data — extracted and walkable
- **Sinnoh** (from `pret/pokeplatinum`): 533 maps, real per-map textured
  top-down renders, walkable + warp-connected. Pipeline: `extract_platinum_maps.py`
  → `generate_platinum_tileset.py` → `render_platinum_maps.py` →
  `extract_platinum_npcs.py` → `add_map_tilesets.py`. Region `sinnoh` wired into
  the engine.
- **Johto + Kanto** (from Pokémon Heart & Soul, GBA 2D): 420 maps, 419 layouts,
  107 tilesets, pixel-perfect. `tools/extract_hns_johto.py`. Region `johto`.
- **Hoenn** (pokeemerald, GBA 2D): extracted layouts present.
- **Unova** (Pokémon Black, blind-RE from ROM): zone table + textured render
  path solved (`tools/bw_common.py`, `extract_bw_maps.py`); real Nuvema render
  verified. Region `unova` wired, walkable.
- **The 3D DS map data we HAVE:** Sinnoh (Platinum), Johto+Kanto (HGSS via HnS
  is 2D, but HGSS ROM is available for true 3D), Unova (Black).

### The battle engine — Ultra Moon TRUE DECOMP (this is what we use)
Verified, numerically-checked C++ + data in `Pokemon-Game/decomp/`:
- **`decomp/src/pml/battle/`**: `DamageCalc.cpp`, `TypeAffinity.cpp`,
  `BattleAI.cpp`, `CatchRate.cpp`, `MoveEffects.cpp`, `BattlePokemon.h` — each
  with a passing `decomp/verify/verify_*.py`.
- **Core math:** stat calc, exp/level curves, shiny, hidden power, RNG (SFMT/WELL).
- **Data (complete, 807 species):** `data/pokemon/usum_*.json` — base stats,
  types, abilities, names, learnsets, evolutions, egg moves, TM compat, and
  **moves fully** (power/type/acc/pp/category/priority/effectId/status/
  statChanges/flags/weather). Plus `decomp/data/type_chart.json` (18×18 exact
  Gen-7) and `nature_table.json`.
- **Effect→sequence dispatch RESOLVED** (category dispatch in the `0x45a0`
  table; per-effect specifics are data-driven from `usum_moves.json`).
- **CoreParam** (encrypted mon blob) decompiled + validated; **save system**
  fully mapped (39/39 blocks named).

**Battle-engine gaps to flag now (so we can fix before wiring):**
- This is Gen-7 (USUM) battle logic/data. Platinum is **Gen-4**. Decision needed:
  do we run **Gen-4 mechanics** (Physical/Special split is already Gen-4; but
  abilities, move data, type chart differ — Gen-4 has no Fairy type, different
  move powers/effects, different catch/exp constants) or accept **Gen-7
  mechanics under a Platinum skin**? For "exactly like Platinum" the *battle math
  and data should be Gen-4*. The USUM decomp gives us a proven, verifiable engine
  *architecture* and a full data schema — we likely need a **Gen-4 data set**
  (pokeplatinum personal/moves/learnsets) fed through the same engine shape, and
  a Gen-4 type chart (17×17, no Fairy). **This is the first thing to resolve
  with the user before building battles.**
- No Gen-4 wild-encounter tables wired into the new engine yet (Sinnoh encounter
  data exists in `data/encounters/`).

### UI extraction — the "exact Platinum" pipeline (in progress)
- **`tools/extract_platinum_ui.py`** — exact DS 2D UI decoder (NCLR/NCGR/NSCR).
- Extracted **exact Platinum party-screen assets** from the ROM
  (`src/assets/platinum/party_menu/`, `bag/`, `summary/`) with a **pixel-diff
  verification loop** against real captured frames. This is the template for
  *every* menu: extract real NARC assets → composite by the game's own layout →
  pixel-diff vs ground truth → repeat until diff == 0.
- Ground-truth capture exists via the emulator (`emulator.html` DS touch works;
  Frame→Shot→Repo captures the real bottom screen).

### Other reference implementations to mine (look, don't merge)
- **`crater.html` + `src/crater/`** — a full turn-based battle/catch/party/box/
  dex/gym engine (DOM), engine-agnostic modules reusable for battle logic.
- **`game.html` + `src/engine/`** — the walkable overworld engine (`GameMap`,
  `GameRenderer`, `GameCamera`, `GameInput`), `game.html?map=X&region=Y` loads
  all four extracted regions today. This is the movement/collision/warp base.
- **`unleashed.html`** — the 3D path (above).

---

## Architecture direction (proposed — to confirm before building)

- **Host:** GitHub Pages, plain HTML/CSS/JS, no build system (matches Pokemon-Game
  conventions). three.js vendored for the 3D view.
- **World:** two renderers over one shared game state:
  - **3D:** three.js scene built from the DS NSBMD map models (via `nitro_g3d.py`
    export → glTF/JSON mesh) + billboard sprites, bounded/snap camera (the DS
    games use a fixed-ish camera; free orbit exposes un-textured back faces).
  - **2D:** the pre-baked top-down textured PNG per map (already produced by
    `render_platinum_maps.py`) drawn on canvas — exactly the `unleashed.html`
    toggle model, scaled to every Sinnoh map.
  - A single **2D/3D toggle button** swaps which renderer is active; collision,
    warps, NPCs, and game state are shared and identical in both.
- **UI layer:** a faithful **two-screen 256×192** Platinum shell (top = overworld,
  bottom = Poketch/menus), integer-scaled, using **only ROM-extracted assets**
  and the exact Platinum font. Every menu built via the extract→composite→
  pixel-diff loop.
- **Battle:** the USUM-decomp engine architecture, fed Gen-4 data (pending the
  Gen-4-vs-Gen-7 decision above), rendered in the exact Platinum battle UI.
- **Save:** localStorage for single-player now; design the save schema so it can
  sync to a server later (multiplayer prep).

## Open decisions to settle with the user before any building

1. **Which repo is the game's home?** This plan is committed to
   `knightdx91-alt/Pokemon-RPG` (main). Confirm the actual game code also lives
   here vs. continuing inside Pokemon-Game.
2. **Gen-4 vs Gen-7 battle mechanics** (see battle-engine gaps). For "exactly
   like Platinum," Gen-4 data + a 17-type chart is the faithful answer — confirm,
   and if so we pull Gen-4 data from `pret/pokeplatinum` through the engine.
3. **3D fidelity target for movement/camera:** fixed DS camera angle vs. a small
   set of snap angles. (Free orbit is ruled out — DS assets have low-detail back
   faces.)
4. **Omega Ruby (Hoenn 3D):** user still needs to back up the ROM to Drive.
   Sinnoh/Johto/Kanto 3D assets are already obtainable; Hoenn 3D waits on that.

## Milestones (Sinnoh vertical slice = Definition of Done for stage 1)

- [ ] Walk a real Sinnoh map (Twinleaf/Sandgem/Route 201/Jubilife) in 3D.
- [ ] 2D/3D toggle button flips the same map, same position, instantly.
- [ ] Exact Platinum overworld HUD + start menu + every sub-menu, pixel-diff clean.
- [ ] A wild encounter triggers the exact Platinum battle screen; a full battle
      resolves correctly on the decomp engine with Gen-4 data.
- [ ] Poketch, Bag, Party, Summary, PC Boxes, Pokédex, save — all exact.
- [ ] Deployed and playable on GitHub Pages.

Sign-off on this list (and it looking *exactly* like Platinum) is required before
starting region 2.

---

*This plan captures the vision as stated. Nothing here is built yet; building
begins only after the open decisions above are settled.*
