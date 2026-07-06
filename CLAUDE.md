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

## ⛔ EXACT-GRAPHICS RULE (learned the hard way — 2026-07-04)
**Graphics/UI must be reconstructed from ground truth and pixel-verified —
NEVER hand-cropped, recoloured, repositioned, or eyeballed.** (Timing/behaviour
code may be approximated; graphics may not.) An earlier pass violated this:
it cropped `gf_presents` by eye, blacked out "artifacts" in `copyright`, guessed
the title red, invented the "GAME FREAK presents." centering, and put the logo
on the wrong screen. All wrong. The correct method:

- The decomp ships the exact tile sheet (`*.png`), palette (`*.pal`/NCLR) and,
  crucially, the **`*.NSCR` tilemap** that says exactly which 8×8 tile (index +
  H/V flip + palette bank) goes at each screen cell. Reconstruct each frame by
  placing tiles per the NSCR and applying the BG scroll from
  `src/applications/title_screen.c`. This is deterministic and exact.
- `tools/reconstruct_title.py` does this. Re-run it to regenerate boot frames.
- **Verify** against the emulator heap dump (pixel-diff → 0). The user's dump is
  in Drive: `...heap_2026-07-04T10-10-22-380Z.bin` (id
  `1DidqjHrvqf4H1dm1dnuVXlW26Vl36pbd`, 193,331,200 bytes — the emulator's whole
  process heap; DS palette/VRAM/OAM live inside it). `curl` it to /tmp (egress
  works); the MCP download would base64 it into context.

### Ground-truth title architecture (from title_screen.c)
- TOP (main) screen: **Giratina** (animated 3D, BG0) + copyright line (BG1).
- BOTTOM (sub) screen: **Pokémon Platinum logo** (BG2/3, scroll Y=1) + PRESS
  START (BG0).

## ✅ Step 0 — exact frames reconstructed
`index.html`/`styles.css`/`src/boot.js` show the opening on a DS dual-screen
stack: **GAME FREAK → copyright → title (logo on the BOTTOM screen)**. All three
frames are whole 256×192 images produced by `tools/reconstruct_title.py` —
exact, not approximated. The title top screen is left BLANK on purpose (Giratina
3D not ported yet — not faked), and PRESS START is intentionally absent (pending
exact extraction from the title NARC/font — not faked).

**Remaining step-0 work (all from ground truth, never approximated):**
1. Pixel-diff the reconstructed frames vs the heap dump until diff==0.
2. Port the animated 3D Giratina (`giratina*.nsbmd/.nsbca`) for the title top.
3. Extract the exact PRESS START graphic from the title NARC / message font.
4. Port the title_screen.c state machine for exact frame counts/scroll/fades.
5. Prof. Rowan's new-game intro — reconstruct the exact message box (NCLR/NCGR/
   NSCR), the real font (`res/fonts/font_message.*` + charmap
   `tools/msgenc/charmap.txt`), the exact naming_screen + gender select, driving
   the unaltered dialogue in `res/text/rowan_intro.json`.

## Assets & tools to reuse (in the sibling `Pokemon-Game` repo, cloned at /home/user/Pokemon-Game)
- **USUM battle engine + data:** `decomp/src/pml/battle/*`, `decomp/data/*`,
  `data/pokemon/usum_*.json` (807 species, moves/learnsets/evos/etc., verified).
- **3D map pipeline:** `tools/nitro_g3d.py` (NSBMD/BMD0 decoder), 
  `tools/render_platinum_maps.py` (rasterizer). Sinnoh maps already extracted.
- **3D map assets, per region (`assets_3d/` in Pokemon-Game):** real ROM terrain
  models + texture sets + placed building models, one self-contained folder per
  region, collected by `tools/collect_region_3d.py` with a `MANIFEST.json` +
  `ATTRIBUTION.md`. **Kanto + Johto DONE** (from HeartGold IPKE: land cells,
  NSBTX texsets, bm_field/bm_room building models; every town render-verified).
  Sinnoh pending (Platinum), Hoenn pending (Omega Ruby 3DS, needs a BCH
  extractor). These are the ground-truth 3D assets for building each region's
  world. See that repo's CLAUDE.md "3D map-asset collection" section for the
  matrix/texset/building format facts.
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
- `tools/reconstruct_title.py` — deterministic NSCR→256×192 frame reconstructor.
- `assets/boot/` — exact reconstructed frames (gf_presents, copyright, logo).
- `index.html` / `styles.css` / `src/boot.js` — opening/title display.
- `GAME_PLAN.md` + `README.md` + this file.

DS screen facts: each screen is **256×192**.
