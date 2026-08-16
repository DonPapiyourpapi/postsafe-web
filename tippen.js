/* PostSafe — die Überschrift schreibt sich selbst.

   „Deine Post" steht fest; dahinter tippt sich ein Satz Buchstabe für Buchstabe,
   bleibt kurz stehen, löscht sich rückwärts weg, und der nächste kommt.

   Die Sätze stehen in index.html, einer je Zeile. Sie stehen dort zugleich
   unsichtbar übereinander und geben der Überschrift ihre Höhe — deshalb muss
   hier nichts gemessen werden, und deshalb springt beim Tippen nichts. Ein
   früherer Anlauf hat die Höhe gerechnet; bei manchen Breiten fiel die
   Überschrift dabei für einen Wimpernschlag zusammen und riss den Briefstapel
   um über zweihundert Pixel mit.

   Ohne Skript oder ohne Bewegung steht der erste Satz einfach da.           */
(function () {
  "use strict";

  var feld = document.querySelector("[data-tippt]");
  if (!feld) return;

  var text = feld.querySelector(".tippt__text");
  var titel = feld.closest(".display");
  if (!text || !titel) return;

  var saetze = [].map.call(titel.querySelectorAll("[data-satz]"), function (e) {
    return e.textContent.trim();
  }).filter(Boolean);
  if (!saetze.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    text.textContent = saetze[0];
    feld.classList.add("tippt--ruht");
    return;
  }

  var TIPP = 58;        /* je Buchstabe beim Schreiben     */
  var LOESCH = 30;      /* je Buchstabe beim Löschen       */
  var STEHEN = 2000;    /* wie lange der Satz stehenbleibt */
  var LEER = 420;       /* Pause, bevor der nächste beginnt */

  /* Der erste Satz steht schon im HTML und ist damit auch ohne Skript zu lesen.
     Es geht deshalb nicht mit Tippen los, sondern mit Löschen — sonst blitzte
     der fertige Satz auf und finge von vorn an. */
  text.textContent = saetze[0];
  var i = 0, n = saetze[0].length, loescht = true, uhr = null, laeuft = true;

  function schritt() {
    var satz = saetze[i];
    n = loescht ? n - 1 : n + 1;
    text.textContent = satz.slice(0, n);

    var wartet = loescht ? LOESCH : TIPP;
    if (!loescht && n === satz.length) { loescht = true; wartet = STEHEN; }
    else if (loescht && n === 0) { loescht = false; i = (i + 1) % saetze.length; wartet = LEER; }

    uhr = setTimeout(schritt, wartet);
  }

  function an() { if (!laeuft) { laeuft = true; uhr = setTimeout(schritt, 400); } }
  function aus() { laeuft = false; clearTimeout(uhr); }

  /* Nur laufen, solange die Überschrift zu sehen ist — und nicht im Hintergrund. */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      e[0].isIntersecting ? an() : aus();
    }, { threshold: 0 }).observe(titel);
  }
  document.addEventListener("visibilitychange", function () {
    document.hidden ? aus() : an();
  });

  uhr = setTimeout(schritt, STEHEN);
})();
