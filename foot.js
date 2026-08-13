/* PostSafe — der Fuss wird unten gehalten, ohne position: sticky.

   Warum nicht einfach sticky: Safari faerbt seit iOS 26 seine Leiste am unteren
   Bildschirmrand nach dem naechstgelegenen Element mit position: sticky oder
   fixed. Ein dunkler Fuss, der dort klebt, faerbte die Leiste ueber die ganze
   Seite hinweg dunkel — auch mitten im Text, wo er gar nicht zu sehen ist. Am
   Geraet nachgemessen: die Flaeche hatte exakt die Farbe des Fusses.

   Der Fuss steht deshalb ganz normal im Fluss und wird hier per transform unten
   gehalten. Aussehen und Verhalten sind dieselben wie bei sticky, aber es gibt
   kein klebendes Element mehr, das Safari finden koennte.

   Ohne Skript bleibt der Fuss einfach am Ende der Seite stehen — die Karte
   schiebt sich dann nicht darueber, sonst aendert sich nichts.             */
(function () {
  "use strict";

  var foot = document.querySelector(".site-foot");
  if (!foot) return;

  var laeuft = false;

  function halten() {
    laeuft = false;
    var hoehe = foot.offsetHeight;
    if (!hoehe) return;

    var oben  = foot.offsetTop;                                   /* Lage im Fluss */
    var y     = window.pageYOffset || document.documentElement.scrollTop || 0;
    var unten = y + window.innerHeight;                           /* unterer Fensterrand */
    var d     = (oben + hoehe) - unten;

    /* Solange die Seite ueber ihm laeuft, wird er nach oben geschoben; am Ende
       der Seite steht er von selbst richtig und braucht keine Verschiebung. */
    foot.style.transform = d > 0 ? "translate3d(0," + (-d).toFixed(1) + "px,0)" : "";
  }

  function takt() {
    if (!laeuft) { laeuft = true; requestAnimationFrame(halten); }
  }

  halten();
  window.addEventListener("scroll", takt, { passive: true });
  window.addEventListener("resize", takt);
  window.addEventListener("orientationchange", takt);
  window.addEventListener("load", takt);
  if ("ResizeObserver" in window) new ResizeObserver(takt).observe(foot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(takt);
})();
