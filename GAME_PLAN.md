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
maps in **3D** (DS/3DS-style), with a **button to toggle to 2D**, as **one
seamless world with zero transition/loading screens** between maps. It plays like
**Pokémon Platinum with the other regions bolted on** — the full Platinum
feature set, UI, and feel. Single-player first, done to the "exact Platinum"
bar above. **Then** it becomes multiplayer with additional features. We do not
move on to multiplayer, or even to region 2, until the current target looks
exactly right.

## Build order (do not reorder)

0. **The boot experience FIRST.** Before any overworld/battle work, the game's
   **loading screen and the New Game intro must be exact Platinum** — the DS
   boot/copyright screens (as a placeholder loading screen for now is fine, but
   styled exactly Platinum), the Platinum title sequence, and Professor Rowan's
   new-game intro (his narration, the Turtwig/Chimchar/Piplup era intro flow,
   name entry, gender select) — pixel- and flow-identical. This is the first
   thing the user sees, so it is the first thing we make exact.
1. **Prove each region's map pipeline on its starting town, one at a time.**
   Build a single starting town, get it looking *right* (3D solid at DS quality,
   the prominent always-available 2D toggle, exact Platinum feel), sign it off,
   then move to the next. This validates that each region's 3D-map extraction/
   rendering path is correct before we pour effort into full regions.
   1. **Twinleaf Town (Sinnoh)** — first. Get it looking right, then →
   2. **New Bark Town (Johto)** — this is the one that rendered wrong before
      (see-through buildings, sub-DS quality); getting it right here fixes the
      known 3D bug. Then →
   3. **Pallet Town (Kanto)** — then →
   4. (Hoenn starting town — Littleroot — once Omega Ruby 3D assets are pulled.)
2. **Then build out the first four regions in full**: Sinnoh, Johto, Kanto,
   Hoenn — each with the prominent 2D/3D toggle, exact Platinum UI, seamless
   world, USUM battles.
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

**DECIDED: use the USUM (Gen-7) engine as-is — "Gen-7 mechanics under a Platinum
skin."** The game *looks* exactly like Platinum, but the battle math/data is the
modern, already-verified Ultra Moon ruleset. This is the "updated stuff" and
avoids maintaining a second Gen-4 data fork. Consequences we accept:
- **Fairy type exists**, 807 species, modern move/ability/weather/terrain data.
  Physical/Special split is unchanged (Gen 4 already had it).
- **The only visible "tell":** the Platinum UI must now be able to display a
  **Fairy type** (Platinum never had one) — so we produce/extract a
  **Platinum-style Fairy type icon**. This is the single place the skin gets
  extended; it does not violate the sacred rule.
- Species beyond #493 and modern numbers can appear — fine and intended.

**Still to decide later (not blocking):** which **encounter tables** each Sinnoh
route uses — Platinum's original wild lists (authentic Sinnoh feel) vs. an
expanded modern pool. Sinnoh encounter data exists in `data/encounters/`.

### UI extraction — the "exact Platinum" pipeline (in progress)
- **`tools/extract_platinum_ui.py`** — exact DS 2D UI decoder (NCLR/NCGR/NSCR).
- Extracted **exact Platinum party-screen assets** from the ROM
  (`src/assets/platinum/party_menu/`, `bag/`, `summary/`) with a **pixel-diff
  verification loop** against real captured frames. This is the template for
  *every* menu: extract real NARC assets → composite by the game's own layout →
  pixel-diff vs ground truth → repeat until diff == 0.
- Ground-truth capture exists via the emulator (`emulator.html` DS touch works;
  Frame→Shot→Repo captures the real bottom screen).

### Seamless world — ZERO transition screens (non-negotiable, already built)
**Hard requirement:** every overworld map connects seamlessly. **No black
screens, no "loading", no transition wipes** when crossing between maps — you
just keep walking and the next area is already there. This is second only to the
sacred Platinum-look rule.

Already implemented in `Pokemon-Game` (`src/main.js` + `src/engine/map.js`),
port it into this repo:
- `seamlessConnectionStep()` (GBA-style edge connections) and
  `seamlessMatrixStep()` (DS matrix seams) **prefetch neighbor maps** and step
  the player across the seam by shifting into the new map's local frame
  **mid-walk**, so the walk interpolation continues with no black screen.
  `switchToNeighbor()` / `switchToMap()` do the frame swap.
- The async `transitionToConnection()` / `transitionToMatrix()` exist ONLY as a
  fallback for the first few frames before prefetch completes — the goal is that
  prefetch always wins so the fallback never shows.

**Extension work (not invention):**
- Widen prefetch from immediate neighbors to a **ring** (keep the player's chunk
  + all chunks within N tiles loaded) so fast movement never outruns prefetch.
- **Regions connect via land bridges / sea routes authored as normal connected
  maps** — "walk from Sinnoh to Johto" is just more chunks streaming in, no
  special-casing, no region-select screen.
- **Interiors** (buildings, caves) may stay as discrete door-fade loads — that's
  fine and matches the real games; only the **overworld must be seamless**.
- Keep movement **tile-locked and state serializable** so it ports cleanly to the
  later multiplayer server.

*(Full prior write-up: `Pokemon-Game/docs/OPEN_WORLD_PLAN.md` — an "OSRS but
Pokémon" seamless 7-region world; multiplayer is its final phase, matching our
build order.)*

### Ground-truth capture — how "exact" is ENFORCED (the emulator bin-dump pipeline)
This is the backbone of the sacred rule. We do not eyeball fidelity; we measure
it against the live game. Built in `Pokemon-Game` (`emulator.html` +
`emulator-debug.js`, builds 55→63; `docs/DS_HEAP_REGIONS.md`):
- A DS screen is composited from **three memory layers**: **palette RAM**
  (colors), **VRAM** (BG tilemaps + tile gfx), **OAM** (sprite cells). A frame
  PNG alone can't be rebuilt exactly — we need those layers.
- **SOLVED:** all three are contiguous fields of one desmume2015 `MMU_struct` in
  the Emscripten heap. Live-anchor the **palette** by color-signature scan, then
  `VRAM = palette+0x800` (len 0xA4000), `OAM = palette+0xC4800` (len 0x800).
  Verified byte-exact against a full 184 MB Platinum heap dump.
- **`⛁ Drive` button** (build 62): a full heap dump exceeds GitHub's 100 MB cap,
  so it resumable-uploads to the user's Google Drive; we pull it and map all DS
  regions offline in one pass.
- **The verification loop for every screen:** open the real Platinum screen in
  the emulator → auto-capture dumps frame + palette + VRAM + OAM (same seq #) →
  reconstruct the screen from the game's own layers/NARC assets → **pixel-diff
  vs the captured frame → fix → repeat until diff == 0.** This is the only
  acceptable definition of "exact." Already proven on the party screen.

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
  - **The 2D/3D toggle is a PROMINENT, first-class, always-available control**
    (not buried in a menu) — the player can flip back and forth freely at any
    time during overworld play, instantly, staying on the exact same tile with
    the same game state. Both renderers share one collision/warp/NPC/state model,
    so nothing changes but the visuals. This is a headline feature, treat it as
    such in the UI. (Prototyped as the `#b3d`/`#b2d` toggle in `unleashed.html`.)
- **UI layer:** a faithful **two-screen 256×192** Platinum shell (top = overworld,
  bottom = Poketch/menus), integer-scaled, using **only ROM-extracted assets**
  and the exact Platinum font. Every menu built via the extract→composite→
  pixel-diff loop.
- **Battle:** the USUM-decomp engine architecture, fed Gen-4 data (pending the
  Gen-4-vs-Gen-7 decision above), rendered in the exact Platinum battle UI.
- **Save:** localStorage for single-player now; design the save schema so it can
  sync to a server later (multiplayer prep).

## Decisions locked

- **Repo home:** `knightdx91-alt/Pokemon-RPG`, branch `main`. All game code AND
  any assets we end up using live here. (Shared extraction tools/decomp can be
  copied/vendored in from Pokemon-Game as needed.)
- **Battle engine:** USUM (Gen-7) as-is — Gen-7 mechanics under a Platinum skin
  (see above). Add a Platinum-style Fairy type icon.

## Open decisions to settle before the relevant stage (not blocking Sinnoh start)

1. **3D fidelity target for movement/camera:** fixed DS camera angle vs. a small
   set of snap angles. (Free orbit is ruled out — DS assets have low-detail back
   faces.)
2. **Sinnoh encounter tables:** authentic Platinum wild lists vs. expanded modern
   pool (only matters once wild encounters are wired).
3. **Omega Ruby (Hoenn 3D):** user still needs to back up the ROM to Drive.
   Sinnoh/Johto/Kanto 3D assets are already obtainable; Hoenn 3D waits on that.

## Known issues to fix (carried over from prototypes)

### 3D building rendering — see-through faces + sub-DS quality (New Bark, Johto)
Observed in the 3D prototype: New Bark Town buildings rendered wrong — **parts
were see-through even from the front**, and overall quality looked **worse than
the real DS**. Root-cause candidates to work through (in likely order):
- **Transparency / alpha handling:** the prototype materials use
  `transparent:true` + `alphaTest` + `depthWrite:false` on some meshes. Wrong
  alphaTest or a texture whose transparent color key is mis-detected will punch
  holes in solid walls. Fix: only building **billboard/foliage** planes should be
  alpha-tested; solid building geometry must be **opaque with depth-write on**.
- **Backface culling / winding:** everything was forced `THREE.DoubleSide`. DS
  models rely on correct per-polygon culling; double-siding some faces + wrong
  draw order makes interior/back polys show through the front. Respect the
  model's real face-culling flags from the NSBMD material instead of blanket
  double-siding.
- **Depth sorting:** disabling `depthWrite` on opaque meshes lets far faces paint
  over near ones — the classic "see-through from the front." Keep real depth
  buffering for solid geometry.
- **Quality gap vs DS:** likely (a) texture filtering/wrap not matching the DS
  (DS uses nearest + specific S/T wrap+flip per material — must read the NSBMD
  tex params, not assume), (b) missing DS toon/vertex lighting, (c) low bake/
  render resolution. Match the DS material params from `nitro_g3d.py` output.
- **Correct reference:** the Nuvema Town (Unova) render came out **pixel-real**
  through the same rasterizer, so the pipeline is capable — New Bark's breakage
  is a per-model material/culling handling gap, not a fundamental limitation.

## Milestones (in build order)

- [ ] **Boot + New Game are exact Platinum FIRST** — loading screen, title
      sequence, Prof. Rowan intro, name/gender entry, flow into the world.
- [ ] **Twinleaf Town (Sinnoh)** looks right — 3D solid at DS quality, prominent
      2D/3D toggle flips freely mid-play with no state loss, exact Platinum feel.
      Sign off before moving on.
- [ ] **New Bark Town (Johto)** looks right — fixes the see-through / sub-DS
      quality bug. Sign off.
- [ ] **Pallet Town (Kanto)** looks right. Sign off.
- [ ] Only then: walk a full Sinnoh region seamlessly (no transition screens).
- [ ] 2D/3D toggle button flips the same map, same position, instantly.
- [ ] Cross every Sinnoh map boundary with **zero transition/loading screens** —
      walk continues uninterrupted (seamless prefetch, no black frames).
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
