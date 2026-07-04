/* Pokémon RPG — boot sequence (step 0).
 *
 * GRAPHICS ARE EXACT, NOT APPROXIMATED. Every frame shown here is a whole
 * 256x192 image reconstructed deterministically from the ROM's own tilemaps
 * by tools/reconstruct_title.py (NSCR tile placement + BG scroll from
 * src/applications/title_screen.c). No cropping, recolouring, or eyeballed
 * positioning.
 *
 * TITLE architecture (title_screen.c sets whichScreenIs3D = DS_SCREEN_SUB then
 * GXLayers_SwapDisplay() -> GX_DISP_SELECT_SUB_MAIN, so the SUB engine drives
 * the TOP LCD and the MAIN engine drives the BOTTOM LCD):
 *   - TOP (sub engine)  : Pokémon Platinum logo + PRESS START + borders
 *   - BOTTOM (main eng.) : Giratina (animated 3D) + the copyright line (BG1)
 *
 * What is EXACT and shown now: the title logo on the TOP screen.
 *
 * What is NOT done yet and is therefore NOT faked (left blank rather than
 * approximated, per the exact-graphics rule):
 *   - the animated 3D Giratina on the title BOTTOM screen (NSBMD/NSBCA port),
 *   - the PRESS START graphic and the top/bottom screen borders, and
 *   - the exact opening sequence/order (NOT yet traced from the state machine;
 *     the frames below are shown in an unverified order pending heap-diff).
 *
 * Frame HOLD durations below are placeholder timings (behaviour, not graphics);
 * exact frame counts will be ported from the title_screen.c state machine.
 */

(function () {
  "use strict";

  var top = document.getElementById("screen-top");
  var bottom = document.getElementById("screen-bottom");

  function setTop(cls) { top.className = "screen screen-top " + (cls || ""); }
  function setBottom(cls) { bottom.className = "screen screen-bottom " + (cls || ""); }

  function fadeTo(cls, done) {
    top.classList.add("fade", "hidden");
    setTimeout(function () {
      setTop(cls);
      top.classList.add("fade");
      void top.offsetWidth;
      top.classList.remove("hidden");
      if (done) setTimeout(done, 520);
    }, 520);
  }

  // Opening frames, in order, on the top screen (placeholder holds in ms).
  var OPENING = [
    { cls: "gf-presents", hold: 2600 },
    { cls: "copyright", hold: 2600 },
  ];

  var titleReady = false;

  function showTitle() {
    // TOP screen (sub engine): exact Pokémon Platinum logo. PRESS START and the
    // borders are pending exact extraction, so they are intentionally absent.
    setTop("logo");
    top.classList.remove("fade", "hidden");
    // BOTTOM screen (main engine): the animated 3D Giratina + copyright line —
    // left blank until ported, rather than approximated.
    setBottom("");
    titleReady = true;
  }

  function runOpening(i) {
    if (i >= OPENING.length) { fadeTo("", showTitle); return; }
    if (i === 0) setTop(OPENING[i].cls);
    setTimeout(function () {
      fadeTo(OPENING[i + 1] ? OPENING[i + 1].cls : "", function () {
        if (OPENING[i + 1]) runOpening(i + 1); else showTitle();
      });
    }, OPENING[i].hold);
  }

  function onAdvance() {
    if (!titleReady) return;
    document.removeEventListener("keydown", onKey);
    console.log("[boot] title dismissed — Prof. Rowan intro is the next stage " +
                "(to be built from ground truth: exact naming/gender screens).");
  }
  function onKey(e) {
    if (["Enter", " ", "z", "Z", "x", "X"].indexOf(e.key) !== -1) onAdvance();
  }
  document.addEventListener("keydown", onKey);
  bottom.addEventListener("click", onAdvance);
  top.addEventListener("click", onAdvance);

  function fitScale() {
    var ds = document.getElementById("ds");
    var scale = Math.max(1, Math.min(Math.floor(window.innerWidth / 256),
                                     Math.floor(window.innerHeight / 394)));
    ds.style.setProperty("--scale", scale);
  }
  window.addEventListener("resize", fitScale);
  fitScale();

  runOpening(0);
})();
