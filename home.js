/* ==========================================================================
   PostSafe — Startseite. Kein Framework, keine externen Skripte.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var span = function (v, a, b) { return clamp((v - a) / (b - a), 0, 1); };

  /* --- Kopfzeile --------------------------------------------------------- */

  var head = document.querySelector(".site-head");

  function updateHead() {
    if (!head) return;
    head.classList.toggle("is-stuck", window.scrollY > 8);
  }

  /* --- Sanftes Erscheinen ------------------------------------------------ */

  function setupReveals() {
    var targets = [].slice.call(document.querySelectorAll("[data-reveal]"));
    var loose = [].slice.call(document.querySelectorAll(".rise")).filter(function (el) {
      return !el.closest("[data-reveal]") && !el.classList.contains("is-in");
    });
    var all = targets.concat(loose);

    if (!("IntersectionObserver" in window) || reduce.matches) {
      all.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    all.forEach(function (el) { io.observe(el); });
  }

  /* --- Der Stapel: vom Scrollen getriebene Szene -------------------------- */

  var scene = document.querySelector("[data-scene]");
  var stage = scene && scene.querySelector("[data-stage]");
  var glow = scene && scene.querySelector(".stage__glow");
  var letters = scene ? [].slice.call(scene.querySelectorAll("[data-ltr]")) : [];
  var caps = scene ? [].slice.call(scene.querySelectorAll("[data-cap]")) : [];
  var layout = null;

  /* Ein Stapel, den niemand sortiert hat: Neigung und Versatz je Brief. */
  var TILT = [-11, 7, -4, 9.5, -7.5, 2.5];
  var OFFX = [-0.17, 0.15, -0.05, 0.11, -0.13, 0.03];
  var OFFY = [0.22, 0.14, 0.04, -0.04, -0.13, -0.21];

  function measure() {
    if (!stage) return;
    var W = stage.clientWidth;
    var H = stage.clientHeight;
    if (!W || !H) { layout = null; return; }

    var narrow = W < 620;
    var cardW = narrow ? Math.min(W * 0.86, 340) : Math.min(W * 0.46, 430);

    letters.forEach(function (el) { el.style.width = cardW + "px"; });

    var heights = letters.map(function (el) { return el.offsetHeight || cardW * 0.55; });
    var settled = narrow ? 0.9 : 0.8;
    var strip = heights[0] * settled;
    var step = clamp((H - strip - 10) / (letters.length - 1), 30, narrow ? 56 : 64);
    var colH = step * (letters.length - 1) + strip;

    layout = {
      W: W, H: H, narrow: narrow, cardW: cardW, heights: heights,
      settled: settled, step: step,
      /* Schmal: der Stapel ordnet sich an Ort und Stelle.
         Breit: er rückt zur Seite, die Ablage wächst rechts und zentriert sich am Ende. */
      pileHome: W * 0.5,
      pileRest: narrow ? W * 0.5 : W * 0.28,
      pileY: narrow ? H * 0.42 : H * 0.52,
      colX: narrow ? W * 0.5 : W * 0.74,
      colHome: W * 0.5,
      colY: clamp((H - colH) / 2, 6, H) + strip * 0.5
    };
  }

  function paint(p) {
    if (!layout) return;
    var n = letters.length;

    /* Die Kamera rückt den Stapel zur Seite, sobald es losgeht —
       und schiebt die fertige Ablage am Ende in die Mitte. */
    var pileX = lerp(layout.pileHome, layout.pileRest, easeInOut(span(p, 0.02, 0.16)));
    var colX = lerp(layout.colX, layout.colHome, easeInOut(span(p, 0.86, 1)));

    for (var i = 0; i < n; i++) {
      var el = letters[i];
      var h = layout.heights[i];

      var start = 0.09 + i * (0.58 / n);
      var lp = span(p, start, start + 0.31);

      var lift = Math.sin(Math.PI * span(lp, 0, 0.4));          /* hoch und wieder runter */
      var read = span(lp, 0.05, 0.36);                           /* Lesestreifen */
      var t = easeInOut(span(lp, 0.36, 1));                      /* Flug in die Reihe */

      var fromX = pileX + layout.cardW * OFFX[i % 6] * (layout.narrow ? 0.62 : 1);
      var fromY = layout.pileY + h * OFFY[i % 6] - lift * 26;
      var toX = colX;
      var toY = layout.colY + i * layout.step;

      var cx = lerp(fromX, toX, t);
      var cy = lerp(fromY, toY, t) - Math.sin(Math.PI * t) * (layout.narrow ? 18 : 34);
      var rot = lerp(TILT[i % 6], 0, easeOut(span(lp, 0.2, 0.9)));
      var sc = lerp(1 + 0.05 * lift, layout.settled, t);

      el.style.transform =
        "translate3d(" + (cx - layout.cardW / 2).toFixed(2) + "px," +
        (cy - h / 2).toFixed(2) + "px,0) rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      el.style.zIndex = String(lp > 0.02 && lp < 0.99 ? 40 + i : i);

      var paper = el.firstElementChild;
      if (paper) {
        paper.style.boxShadow = lift > 0.05 ? "var(--shadow-3)" : t > 0.92 ? "var(--shadow-1)" : "";
      }

      var chip = el.querySelector(".paper__chip");
      if (chip) {
        chip.style.opacity = span(lp, 0.18, 0.4).toFixed(3);
        chip.style.transform = "scale(" + lerp(0.9, 1, span(lp, 0.18, 0.45)).toFixed(3) + ")";
      }

      var scan = el.querySelector(".scan");
      if (scan) {
        scan.style.opacity = (read > 0 && read < 1 ? 1 : 0).toString();
        scan.style.setProperty("--scan", (lerp(-45, 145, read)).toFixed(1) + "%");
      }
    }

    if (glow) {
      var fade = 1 - span(p, 0.15, 0.8);
      glow.style.opacity = (0.25 + 0.75 * fade).toFixed(3);
      glow.style.transform = "translate(-50%,-50%) scale(" + (0.7 + 0.3 * fade).toFixed(3) + ")";
    }

    var on = p < 0.2 ? 0 : p < 0.72 ? 1 : p < 0.78 ? -1 : 2;
    caps.forEach(function (c, i) { c.classList.toggle("is-on", i === on); });
  }

  function updateScene() {
    if (!scene || !layout) return;
    var rect = scene.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    paint(p);
  }

  function restScene() {
    /* Ruhezustand ohne Bewegung: alles liegt geordnet, alle Zeilen lesbar. */
    if (!layout) return;
    paint(1);
    caps.forEach(function (c) { c.classList.add("is-on"); });
    letters.forEach(function (el) {
      var chip = el.querySelector(".paper__chip");
      if (chip) chip.style.opacity = "1";
    });
  }

  /* --- Frist: Datum in den Kalender --------------------------------------- */

  function placeFlight() {
    var fly = document.querySelector("[data-fly]");
    var cell = document.querySelector("[data-target]");
    if (!fly || !cell) return;
    var a = fly.getBoundingClientRect();
    var b = cell.getBoundingClientRect();
    if (!a.width || !b.width) return;
    fly.style.setProperty("--fx", ((b.left + b.width / 2) - (a.left + a.width / 2)).toFixed(1) + "px");
    fly.style.setProperty("--fy", ((b.top + b.height / 2) - (a.top + a.height / 2)).toFixed(1) + "px");
  }

  /* --- Briefe im Kopfbereich folgen dem Zeiger ---------------------------- */

  function setupParallax() {
    var fan = document.querySelector(".fan");
    if (!fan || reduce.matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var papers = [].slice.call(fan.querySelectorAll(".paper"));
    var depth = [0.35, 0.62, 1];

    window.addEventListener("mousemove", function (e) {
      var r = fan.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / Math.max(window.innerWidth, 1);
      var dy = (e.clientY - (r.top + r.height / 2)) / Math.max(window.innerHeight, 1);
      papers.forEach(function (p, i) {
        var d = depth[i] || 0.5;
        p.style.setProperty("--mx", (dx * 26 * d).toFixed(1) + "px");
        p.style.setProperty("--my", (dy * 20 * d).toFixed(1) + "px");
      });
    }, { passive: true });
  }

  /* --- Takt --------------------------------------------------------------- */

  var ticking = false;

  function frame() {
    ticking = false;
    updateHead();
    updateScene();
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function onResize() {
    measure();
    placeFlight();
    if (reduce.matches) restScene(); else onScroll();
  }

  function boot() {
    document.documentElement.classList.add("js");
    if (reduce.matches) document.documentElement.classList.add("no-fly");

    setupReveals();
    setupParallax();
    measure();
    placeFlight();
    updateHead();

    if (reduce.matches) {
      restScene();
      return;
    }

    paint(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
    onScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
