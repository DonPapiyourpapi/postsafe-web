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

  /* --- Sanftes Erscheinen ------------------------------------------------ */

  function setupReveals() {
    var targets = [].slice.call(document.querySelectorAll("[data-reveal]"));

    if (!("IntersectionObserver" in window) || reduce.matches) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
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

    targets.forEach(function (el) { io.observe(el); });
  }

  /* --- Die Geschichte: erster Bildschirm, Stapel, Ordner ------------------ */

  var story = document.querySelector("[data-story]");
  var stage = story && story.querySelector("[data-stage]");
  var words = story && story.querySelector("[data-words] > div");
  var hint = story && story.querySelector(".story__hint");
  var folderBox = story && story.querySelector("[data-folders]");
  var phone = story && story.querySelector("[data-phone]");
  var letters = story ? [].slice.call(story.querySelectorAll("[data-ltr]")) : [];
  var folders = story ? [].slice.call(story.querySelectorAll(".folders .folder")) : [];
  var caps = story ? [].slice.call(story.querySelectorAll("[data-cap]")) : [];
  var layout = null;

  /* Brief 0 liegt oben auf — er wird zuerst abfotografiert. */
  var HX = [-0.06, 0.22, -0.24, 0.16, -0.16, 0.06];
  var HY = [0.02, 0.12, 0.16, -0.10, -0.06, -0.16];
  var HR = [-2.5, 6, -8, 5, -6, 2];

  var PX = [-0.05, 0.16, -0.19, 0.12, -0.14, 0.04];
  var PY = [0.04, 0.14, 0.19, -0.06, -0.12, -0.19];
  var PR = [-4, 8, -11, 9, -7, 3];

  function measure() {
    if (!stage) return;
    var W = stage.clientWidth;
    var H = stage.clientHeight;
    if (!W || !H) { layout = null; return; }

    var narrow = W < 700;
    var cardW = narrow ? Math.min(W * 0.54, 205) : Math.min(W * 0.26, 250);
    var cardH = cardW * 1.36;

    /* Der Brief bringt seine eigene Schriftgröße mit, damit alles mitskaliert. */
    letters.forEach(function (el) {
      el.style.width = cardW + "px";
      el.style.fontSize = (cardW * 0.058).toFixed(2) + "px";
    });

    /* Wo im Brief die erkannten Wörter stehen — als Anteil der Briefhöhe. */
    var marks = letters.map(function (el) {
      var sheet = el.querySelector(".sheet");
      var sh = sheet.offsetHeight || cardH;
      return [].slice.call(el.querySelectorAll("[data-mark]")).map(function (m) {
        return { el: m, at: (m.offsetTop + m.offsetHeight / 2) / sh };
      });
    });

    var sr = stage.getBoundingClientRect();
    var boxes = folders.map(function (f) {
      var r = f.getBoundingClientRect();
      return {
        cx: r.left - sr.left + r.width / 2,
        cy: r.top - sr.top + r.height / 2,
        h: r.height
      };
    });

    /* Das iPhone: so groß, dass der Brief in den Sucher passt —
       am Telefon nur so hoch, dass es über den Ordnern bleibt. */
    var phoneW = Math.min((narrow ? H * 0.56 : H * 0.94) / 2.03, cardW / 0.84);
    if (phone) {
      phone.style.width = phoneW.toFixed(1) + "px";
      phone.style.height = (phoneW * 2.03).toFixed(1) + "px";
    }

    var fr = folderBox ? folderBox.getBoundingClientRect() : null;
    var mid0 = boxes.length ? (boxes[0].cy - boxes[0].h / 2 + boxes[boxes.length - 1].cy + boxes[boxes.length - 1].h / 2) / 2 : H / 2;

    layout = {
      W: W, H: H, narrow: narrow, cardW: cardW, cardH: cardH,
      marks: marks, boxes: boxes,
      phoneW: phoneW, phoneH: phoneW * 2.03,
      photoFit: Math.min(1, (phoneW * 0.84) / cardW),
      shiftX: fr && !narrow ? Math.max(0, (W - fr.width) / 2) : 0,
      shiftY: narrow ? H / 2 - mid0 : 0,
      heroX: narrow ? W * 0.5 : W * 0.72,
      heroY: narrow ? H * 0.7 : H * 0.5,
      pileX: narrow ? W * 0.5 : W * 0.26,
      pileY: narrow ? H * 0.27 : H * 0.5
    };
  }

  function paint(q) {
    if (!layout) return;
    var n = letters.length;

    var out = easeInOut(span(q, 0.02, 0.12));        /* die Worte treten ab */
    var gather = easeInOut(span(q, 0.02, 0.15));     /* Fächer wird zum Stapel */
    var show = span(q, 0.13, 0.24);                  /* Ordner treten auf */

    if (words) {
      words.style.opacity = (1 - out).toFixed(3);
      words.style.transform = "translate3d(0," + (-out * 44).toFixed(1) + "px,0)";
    }
    if (hint) hint.style.opacity = (1 - span(q, 0, 0.04)).toFixed(3);

    /* Am Ende rückt die fertige Ablage in die Mitte. */
    var mid = easeInOut(span(q, 0.92, 1));
    if (folderBox) {
      folderBox.style.opacity = show.toFixed(3);
      folderBox.style.transform =
        "translate(" + (-layout.shiftX * mid).toFixed(1) + "px," +
        (layout.shiftY * mid).toFixed(1) + "px) scale(" +
        (1 + 0.05 * mid).toFixed(3) + ")";
    }

    var counts = [0, 0, 0, 0, 0, 0];
    var hits = [false, false, false, false, false, false];
    var firstX = 0, firstY = 0, firstP = 0, firstLp = 0;

    for (var i = 0; i < n; i++) {
      var el = letters[i];
      var k = +(el.getAttribute("data-folder") || 0);
      var box = layout.boxes[k] || layout.boxes[0];

      /* Der erste Brief bekommt Zeit fürs Abfotografieren. */
      var first = i === 0;
      var start = first ? 0.18 : 0.44 + (i - 1) * 0.0725;
      var lp = span(q, start, start + (first ? 0.28 : 0.17));

      var lift = first
        ? span(lp, 0, 0.12) * (1 - span(lp, 0.5, 0.64))
        : Math.sin(Math.PI * span(lp, 0, 0.42));
      var photo = first ? span(lp, 0.02, 0.18) * (1 - span(lp, 0.44, 0.58)) : 0;
      var read = span(lp, first ? 0.34 : 0.06, first ? 0.62 : 0.4);
      var t = easeInOut(span(lp, first ? 0.66 : 0.42, 1));

      /* Ruheort: erst Fächer, dann Stapel */
      var restX = lerp(layout.heroX + layout.cardW * HX[i], layout.pileX + layout.cardW * PX[i], gather);
      var restY = lerp(layout.heroY + layout.cardH * HY[i], layout.pileY + layout.cardH * PY[i], gather)
                  - lift * layout.cardH * 0.07;
      var restR = lerp(HR[i], PR[i], gather);

      var landS = box ? clamp((box.h * 0.5) / layout.cardH, 0.08, 0.4) : 0.2;

      if (first) { firstX = restX; firstY = restY; firstP = photo; firstLp = lp; }

      var cx = lerp(restX, box.cx - layout.cardW * 0.12, t);
      var cy = lerp(restY, box.cy, t) - Math.sin(Math.PI * t) * (layout.narrow ? 16 : 30);
      var rot = lerp(restR, 0, easeOut(span(lp, first ? 0.02 : 0.3, first ? 0.2 : 0.95)));
      var sc = lerp(lerp(1 + 0.045 * lift, layout.photoFit, photo), landS, t);
      /* Während des Fotos treten die übrigen Briefe zurück. */
      var op = (1 - span(t, 0.72, 0.99)) * (first ? 1 : 1 - firstP * 0.65);

      el.style.transform =
        "translate3d(" + (cx - layout.cardW / 2).toFixed(2) + "px," +
        (cy - layout.cardH / 2).toFixed(2) + "px,0) rotate(" + rot.toFixed(2) +
        "deg) scale(" + sc.toFixed(3) + ")";
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(lp > 0.02 ? 20 + Math.round(lp * 40) + i : n - i);

      var sheet = el.firstElementChild;
      if (sheet) sheet.style.boxShadow = lift > 0.06 ? "var(--shadow-3)" : "";

      /* Der Lesestreifen und die Wörter, die er erkennt */
      var edge = lerp(-0.05, 1.05, read);
      var scan = el.querySelector(".scan");
      if (scan) {
        scan.style.opacity = (read > 0 && read < 1 ? 1 : 0).toString();
        scan.style.setProperty("--scan", ((edge - 0.55) * 100).toFixed(1) + "%");
      }
      layout.marks[i].forEach(function (m) {
        m.el.classList.toggle("is-read", edge > m.at);
      });

      var tag = el.querySelector("[data-tag]");
      if (tag) {
        var ts = span(lp, 0.34, 0.5);
        tag.style.opacity = (ts * (1 - span(t, 0.5, 0.9))).toFixed(3);
        tag.style.transform = "scale(" + lerp(0.86, 1, ts).toFixed(3) + ")";
      }

      if (t > 0.9) counts[k]++;
      if (t > 0.8 && t < 0.995) hits[k] = true;
    }

    if (phone) {
      var pIn = span(firstLp, 0.02, 0.18);
      var pOut = span(firstLp, 0.42, 0.56);
      var pVis = pIn * (1 - pOut);
      phone.style.opacity = pVis.toFixed(3);
      if (pVis > 0.001) {
        var pY = lerp(layout.cardH * 0.55, 0, easeOut(pIn)) + lerp(0, layout.cardH * 0.7, pOut);
        phone.style.transform =
          "translate3d(" + (firstX - layout.phoneW / 2).toFixed(1) + "px," +
          (firstY - layout.phoneH / 2 + pY).toFixed(1) + "px,0) rotate(" +
          lerp(-3.5, 0, easeOut(pIn)).toFixed(2) + "deg) scale(" +
          lerp(1.05, 1, easeOut(pIn)).toFixed(3) + ")";
        var view = phone.querySelector(".phone__view");
        if (view) {
          var lock = span(firstLp, 0.1, 0.24);
          var blink = firstLp < 0.3 ? span(firstLp, 0.26, 0.3) : 1 - span(firstLp, 0.3, 0.36);
          view.style.opacity = (lock * (1 - pOut) * (1 - clamp(blink, 0, 1) * 0.85)).toFixed(3);
          view.style.transform = "scale(" + lerp(1.1, 1, easeOut(lock)).toFixed(3) + ")";
        }
      }
    }

    for (var f = 0; f < folders.length; f++) {
      folders[f].classList.toggle("is-hit", hits[f]);
      var nEl = folders[f].querySelector("[data-n]");
      if (nEl) {
        var c = counts[f];
        if (nEl.textContent !== String(c)) nEl.textContent = String(c);
        nEl.classList.toggle("is-on", c > 0);
      }
    }

    var on = q < 0.07 ? -1 : q < 0.18 ? 0 : q < 0.89 ? 1 : q < 0.94 ? -1 : 2;
    caps.forEach(function (c, i) { c.classList.toggle("is-on", i === on); });
  }

  function updateStory() {
    if (!story || !layout) return;
    var rect = story.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    var total = rect.height - window.innerHeight;
    paint(total > 0 ? clamp(-rect.top / total, 0, 1) : 0);
  }

  function restStory() {
    /* Ohne Bewegung: der Stapel liegt bereit, die Ordner stehen gefüllt daneben. */
    if (!layout) return;
    var counts = [0, 0, 0, 0, 0, 0];

    letters.forEach(function (el, i) {
      var k = +(el.getAttribute("data-folder") || 0);
      counts[k]++;
      var cx = layout.pileX + layout.cardW * PX[i];
      var cy = layout.pileY + layout.cardH * PY[i];
      el.style.transform =
        "translate3d(" + (cx - layout.cardW / 2).toFixed(2) + "px," +
        (cy - layout.cardH / 2).toFixed(2) + "px,0) rotate(" + PR[i].toFixed(2) + "deg)";
      el.style.opacity = "1";
      el.style.zIndex = String(i);
      var tag = el.querySelector("[data-tag]");
      if (tag) tag.style.opacity = "1";
      layout.marks[i].forEach(function (m) { m.el.classList.add("is-read"); });
    });

    if (folderBox) folderBox.style.opacity = "1";
    folders.forEach(function (f, i) {
      var nEl = f.querySelector("[data-n]");
      if (nEl) { nEl.textContent = String(counts[i]); nEl.classList.add("is-on"); }
    });
    caps.forEach(function (c) { c.classList.add("is-on"); });
    if (words) { words.style.opacity = "1"; words.style.transform = "none"; }
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

  /* --- Takt --------------------------------------------------------------- */

  var ticking = false;

  function frame() {
    ticking = false;
    updateStory();
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function onResize() {
    measure();
    placeFlight();
    if (reduce.matches) restStory(); else onScroll();
  }

  function boot() {
    document.documentElement.classList.add("js");
    if (reduce.matches) document.documentElement.classList.add("no-fly");

    setupReveals();
    measure();
    placeFlight();

    if (reduce.matches) {
      restStory();
      return;
    }

    paint(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(stage);
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
