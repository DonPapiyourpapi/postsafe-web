/* PostSafe — der Fuss liegt fest hinter der Seite.
   Die Seite selbst ist eine Karte mit runder Unterkante; beim Scrollen ans Ende
   schiebt sie sich darueber weg und legt den Fuss frei. Damit das genau
   aufgeht, haelt ein Platzhalter im Fluss exakt die Hoehe des Fusses frei —
   und die kennt nur der Browser, weil der Fuss je nach Breite anders umbricht.
   Ohne Skript greift der Rueckfallwert in style.css.                        */
(function () {
  "use strict";

  var foot = document.querySelector(".site-foot");
  var slot = document.querySelector(".foot-slot");
  if (!foot || !slot) return;

  var zuletzt = -1;

  function messen() {
    var h = foot.offsetHeight;
    if (h && h !== zuletzt) {
      zuletzt = h;
      document.documentElement.style.setProperty("--fusshoehe", h + "px");
    }
  }

  messen();

  if ("ResizeObserver" in window) {
    new ResizeObserver(messen).observe(foot);
  }
  window.addEventListener("resize", messen);
  window.addEventListener("orientationchange", messen);
  window.addEventListener("load", messen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(messen);
})();
