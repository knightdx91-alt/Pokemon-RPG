/* Pokémon RPG — boot sequence (step 0, first slice).
 *
 * Reproduces the Platinum power-on flow using the EXACT decoded title-screen
 * art pulled from the pokeplatinum decomp (res/graphics/title_screen):
 *
 *   1. "GAME FREAK presents."   (gf_presents.png)
 *   2. Copyright line           (copyright.png)
 *   3. Title screen             (logo.png on the Platinum title red) + PRESS START
 *
 * The Giratina 3D intro that plays between (2) and (3) on hardware is not yet
 * rendered — its NSBMD/NSBCA models live in the decomp and will be ported once
 * the map 3D pipeline (nitro_g3d) is wired up. For now the title logo is exact.
 *
 * Screens are 256x192. Timings approximate the hardware boot.
 */

(function () {
  "use strict";

  var top = document.getElementById("screen-top");
  var bottom = document.getElementById("screen-bottom");

  // Frame durations (ms), matched roughly to the retail boot pacing.
  var SEQ = [
    { cls: "gf-presents", hold: 2600 },
    { cls: "copyright", hold: 2600 },
  ];

  function setTopFrame(cls) {
    top.className = "screen screen-top " + cls;
  }

  function fadeSwap(cls, done) {
    top.classList.add("fade", "hidden");
    setTimeout(function () {
      setTopFrame(cls);
      top.classList.add("fade");
      // force reflow so the fade-in animates
      void top.offsetWidth;
      top.classList.remove("hidden");
      if (done) setTimeout(done, 520);
    }, 520);
  }

  var titleReady = false;

  function showTitle() {
    setTopFrame("title-logo");
    top.classList.remove("fade", "hidden");

    // Bottom (touch) screen carries the blinking PRESS START prompt.
    bottom.className = "screen screen-bottom title-bottom";
    var prompt = document.createElement("div");
    prompt.className = "press-start";
    prompt.textContent = "PRESS START";
    bottom.appendChild(prompt);

    titleReady = true;
  }

  function runSequence(i) {
    if (i >= SEQ.length) {
      fadeSwap("title-logo", showTitle);
      return;
    }
    var step = SEQ[i];
    if (i === 0) {
      setTopFrame(step.cls);
    }
    setTimeout(function () {
      fadeSwap(SEQ[i + 1] ? SEQ[i + 1].cls : "title-logo", function () {
        if (SEQ[i + 1]) runSequence(i + 1);
        else showTitle();
      });
    }, step.hold);
  }

  // Advance from the title on Start / A / Enter / tap (into the New Game intro,
  // built in the next slice).
  function onAdvance() {
    if (!titleReady) return;
    document.removeEventListener("keydown", onKey);
    bottom.removeEventListener("click", onAdvance);
    top.removeEventListener("click", onAdvance);
    // Placeholder hand-off: next slice is Prof. Rowan's new-game intro.
    var p = bottom.querySelector(".press-start");
    if (p) p.textContent = "…";
    console.log("[boot] title dismissed — Prof. Rowan intro is the next slice.");
  }
  function onKey(e) {
    if (["Enter", " ", "z", "Z", "x", "X"].indexOf(e.key) !== -1) onAdvance();
  }
  document.addEventListener("keydown", onKey);
  bottom.addEventListener("click", onAdvance);
  top.addEventListener("click", onAdvance);

  // Fit the DS stack to the viewport with an integer scale.
  function fitScale() {
    var ds = document.getElementById("ds");
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    // Stack is 256 wide, 192*2 + 10 gap = 394 tall at scale 1.
    var scale = Math.max(1, Math.min(Math.floor(vw / 256), Math.floor(vh / 394)));
    ds.style.setProperty("--scale", scale);
  }
  window.addEventListener("resize", fitScale);
  fitScale();

  runSequence(0);
})();
