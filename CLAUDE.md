# CLAUDE.md — Pokémon RPG

Guidance for Claude Code working in this repo. Read `GAME_PLAN.md` first — it is
the agreed vision and must not be re-litigated.

## Repo rules
- **Work on `main` only. No PRs, no feature branches. Push directly to `main`.**
- This repo (`knightdx91-alt/Pokemon-RPG`) is the home for the game code AND any
  assets we use.
- Hosted on **GitHub Pages**. Plain HTML/CSS/JS, no build system (same
  conventions as the sibling `Pokemon-Game` repo).

## The vision in one line (full detail in GAME_PLAN.md)
A browser Pokémon game, regions 1–7, **3D with a prominent always-available 2D
toggle**, **one seamless world with ZERO transition screens**, that looks and
acts **EXACTLY like Pokémon Platinum** (the sacred, non-negotiable rule).
Single-player exact first; multiplayer last. Uses the verified **USUM (Gen-7)
battle engine** from `Pokemon-Game/decomp/` ("Gen-7 mechanics under a Platinum
skin"). DraStic-style controls: dual screens in portrait/reverse-portrait,
single screen + GBA buttons in landscape/reverse-landscape, plus screen-nudge
(up/down/reset) buttons ported from `Pokemon-Game/emulator.html`.

## Build order (do not reorder)
0. **Exact-Platinum boot + New Game intro FIRST** (loading screen, title
   sequence, Prof. Rowan intro, name/gender entry).
1. **Prove each region's map pipeline on its starting town, one at a time, with
   sign-off between each:** Twinleaf (Sinnoh) → New Bark (Johto, the one that
   rendered wrong before) → Pallet (Kanto) → Littleroot (Hoenn, needs Omega
   Ruby 3D assets).
2. Full first four regions. 3. Regions 5–7. 4. Multiplayer.

## ✅ BLOCKER RESOLVED (2026-07-04)
**Drive egress now works** in this session — the Platinum ROM (US, gamecode
**CPUE**, 128 MB) downloads fine:
```
curl -sSL "https://drive.usercontent.google.com/download?id=17pbLDu1VxBpO9Jf3AbWO9ZEH9O1ecVcc&export=download&confirm=t" -o /tmp/pokemon-platinum.nds
# verified: header "POKEMON PL", bytes 12-16 == "CPUE", size == 134217728
```
**But we didn't need to extract from the ROM for the boot art.** The
`pokeplatinum` decomp (cloned at `/home/user/pokeplatinum`) already ships the
EXACT decoded title/intro assets in `res/graphics/title_screen/` — `logo.png`,
`copyright.png`, `gf_presents.png` (all ground truth), plus the Giratina 3D
models (`giratina*.nsbmd/.nsbca`) and the intro NARCs in
`res/prebuilt/demo/{title,intro}/`. The boot flow/order is `titledemo.order`;
the PRESS START string is `res/text/title_screen.json`. Prefer these decoded
assets over re-extracting the ROM. (ROM stays ephemeral in /tmp — never commit
ROM bytes.)

## ✅ Step 0 — first slice built
`index.html` + `styles.css` + `src/boot.js` render the exact power-on flow on a
DS dual-screen stack (256×192 each, integer-scaled, nearest-neighbour):
**GAME FREAK presents. → copyright line → title (exact Platinum logo on the
title red) + blinking PRESS START**, advancing on Start/A/Enter/tap. Assets are
in `assets/boot/` (cropped/cleaned from the decoded decomp PNGs). Verified with
Playbright screenshots.

**Next slices of step 0 (not built yet):**
1. Giratina 3D intro between copyright and title — port `giratina*.nsbmd/.nsbca`
   via the `nitro_g3d` 3D pipeline (shared with the map work).
2. Professor Rowan's new-game intro (narration, starter-era flow), then
   name entry + gender select, then hand off into the world.

## Assets & tools to reuse (in the sibling `Pokemon-Game` repo, cloned at /home/user/Pokemon-Game)
- **USUM battle engine + data:** `decomp/src/pml/battle/*`, `decomp/data/*`,
  `data/pokemon/usum_*.json` (807 species, moves/learnsets/evos/etc., verified).
- **3D map pipeline:** `tools/nitro_g3d.py` (NSBMD/BMD0 decoder), 
  `tools/render_platinum_maps.py` (rasterizer). Sinnoh maps already extracted.
- **3D/2D toggle prototype:** `unleashed.html` (three.js `#b3d`/`#b2d`).
- **Exact-UI pipeline:** `tools/extract_platinum_ui.py`; already-extracted exact
  assets in `src/assets/platinum/` (party_menu, bag, summary).
- **Ground-truth capture (fidelity enforcement):** `emulator.html` +
  `emulator-debug.js` heap-dump of palette/VRAM/OAM (`docs/DS_HEAP_REGIONS.md`)
  → reconstruct → pixel-diff until diff==0. This is how "exact" is proven.
- **Seamless world:** `src/main.js` `seamlessConnectionStep()`/`seamlessMatrixStep()`
  + `src/engine/map.js` `switchToNeighbor()`/`switchToMap()`.
- **Orientation/controls:** `src/ui/layout.js` (4 orientations via body rotate),
  `src/ui/controls.js`; screen-nudge `.emu-nudge`/`nudgeGame()` in `emulator.html`.

## What's built
- `index.html` / `styles.css` / `src/boot.js` — step 0 boot slice (see above).
- `assets/boot/` — exact decoded Platinum boot art (gf_presents, copyright, logo).
- `GAME_PLAN.md` + `README.md` + this file.

DS screen facts: each screen is **256×192**.
