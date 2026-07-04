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

## ⛔ CURRENT BLOCKER (resume point — 2026-07-04)
**Building is gated on getting the Platinum ROM's exact title/intro art, and
this repo-task session type has egress scoped to GitHub repos ONLY — Google
Drive is policy-denied (proxy returns 403 for `drive.usercontent.google.com`).**
The Drive MCP tool can't help either: it returns the 128 MB ROM as base64 into
context (~180 MB of text), which cannot land on disk for `nds_decomp.py`.

**The user is updating their network-egress settings to allow Drive**, then
starting a fresh session. When egress is fixed, the bootstrap is:
- Platinum ROM (US, gamecode **CPUE**, 128 MB) is in the user's Google Drive:
  - `Pokemon Platinum.nds` — Drive id `1dYedqyolx558pnkJ5NA5ywpm6MoRkVuD`
  - `3541 - Pokemon Platinum Version (US)(XenoPhobia).nds` — id `17pbLDu1VxBpO9Jf3AbWO9ZEH9O1ecVcc`
  ```
  curl -sSL "https://drive.usercontent.google.com/download?id=1dYedqyolx558pnkJ5NA5ywpm6MoRkVuD&export=download&confirm=t" -o /tmp/pokemon-platinum.nds
  # verify: header bytes 12-16 == "CPUE", size == 134217728
  python3 /home/user/Pokemon-Game/tools/nds_decomp.py /tmp/pokemon-platinum.nds -o source/nds/CPUE
  ```
- Extraction is gitignored/ephemeral — commit only derived assets (never ROM bytes).

**Alternative if egress still can't reach Drive:** run the extraction from a web
session on the `Pokemon-Game` repo (Drive `curl` works there), commit the
title/intro assets, then build the boot here on top of them.

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

## Nothing is built in this repo yet
Only `GAME_PLAN.md` + `README.md` + this file exist. Next session (post-egress
fix): pull the ROM, extract the exact boot/title/intro assets, and build step 0.
DS screen facts that are known regardless of ROM: each screen is **256×192**.
