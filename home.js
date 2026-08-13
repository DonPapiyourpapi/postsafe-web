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
  var stick = story && story.querySelector(".story__stick");
  var wordsBox = story && story.querySelector("[data-words]");
  var words = story && story.querySelector("[data-words] > div");
  var marksBar = story && story.querySelector("[data-marks]");
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

    /* Zuerst messen, was von der Briefgröße unabhängig ist: Bühne und Ordner.
       Erst danach steht fest, wie groß ein Brief sein darf. */
    var sr = stage.getBoundingClientRect();
    var boxes = folders.map(function (f) {
      var r = f.getBoundingClientRect();
      return {
        cx: r.left - sr.left + r.width / 2,
        cy: r.top - sr.top + r.height / 2,
        h: r.height
      };
    });
    var fr = folderBox ? folderBox.getBoundingClientRect() : null;

    var narrow = W < 700;
    var cardW = narrow ? Math.min(W * 0.54, 205) : Math.min(W * 0.26, 250);

    /* Am Telefon stehen Worte, Briefe und Ordner übereinander statt nebeneinander.
       Zwei Grenzen halten sie auseinander, und die engere gewinnt:

         · der Stapel im ersten Bild beginnt unter der Unterkante der Worte und
           darf bis zum unteren Rand reichen — dort steht anfangs noch kein Satz;
         · der Stapel beim Fotografieren bleibt über der ersten Ordnerzeile.

       Passt es nicht, wird der Brief kleiner. Ein Brief, der über der Überschrift
       oder auf einem Ordner liegt, ist der schlechtere Tausch.
       Gerechnet über offsetTop, damit ein Umbau mitten im Scrollen nicht die
       gerade verschobenen Worte misst.
       1.32 bzw. 1.38 = Höhe des Fächers in Briefhöhen, 1.36 = Seitenverhältnis. */
    var heroTop = 0;
    var overFolders = boxes.length ? boxes[0].cy - boxes[0].h / 2 - 12 : H;
    if (narrow && stick && wordsBox) {
      /* Unten steht die Markenleiste; ihr Platz gehoert nicht dem Stapel. */
      var unten = marksBar ? marksBar.offsetHeight + 20 : 0;
      var room = stick.clientHeight - stage.offsetTop - 8 - unten;
      heroTop = wordsBox.offsetTop + wordsBox.offsetHeight - stage.offsetTop + 36;
      cardW = Math.max(112, Math.min(
        cardW,
        (room - heroTop) / (1.32 * 1.36),
        overFolders / (1.38 * 1.36)
      ));
    }
    var cardH = cardW * 1.36;

    /* Am Telefon hängt der Stapel oben in der Luft über den Ordnern. */
    var pileY = narrow ? cardH * 0.69 + 4 : H * 0.5;

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

    /* Das iPhone: so groß, dass der Brief in den Sucher passt. Am Telefon steht
       es an der Stelle, an der später die Ordner stehen — die treten erst auf,
       wenn es wieder weg ist (siehe „show" in paint). */
    var phoneW = Math.min(H * 0.94 / 2.03, cardW / 0.84);
    if (phone) {
      phone.style.width = phoneW.toFixed(1) + "px";
      phone.style.height = (phoneW * 2.03).toFixed(1) + "px";
    }

    var mid0 = boxes.length ? (boxes[0].cy - boxes[0].h / 2 + boxes[boxes.length - 1].cy + boxes[boxes.length - 1].h / 2) / 2 : H / 2;

    layout = {
      W: W, H: H, narrow: narrow, cardW: cardW, cardH: cardH,
      marks: marks, boxes: boxes,
      phoneW: phoneW, phoneH: phoneW * 2.03,
      photoFit: Math.min(1, (phoneW * 0.84) / cardW),
      shiftX: fr && !narrow ? Math.max(0, (W - fr.width) / 2) : 0,
      shiftY: narrow ? H / 2 - mid0 : 0,
      heroX: narrow ? W * 0.5 : W * 0.72,
      heroY: narrow ? heroTop + cardH * 0.66 : H * 0.5,
      pileX: narrow ? W * 0.5 : W * 0.26,
      pileY: pileY
    };
  }

  /* Die ersten beiden Briefe werden mit dem iPhone abfotografiert und
     bekommen dafür Zeit; die übrigen laufen im schnelleren Takt durch. */
  function sched(i, q) {
    var two = i < 2;
    var start = two ? 0.16 + i * 0.22 : 0.59 + (i - 2) * 0.062;
    var lp = span(q, start, start + (two ? 0.24 : 0.13));
    return {
      two: two,
      lp: lp,
      photo: two ? span(lp, 0.02, 0.18) * (1 - span(lp, 0.44, 0.58)) : 0,
      lift: two
        ? span(lp, 0, 0.12) * (1 - span(lp, 0.5, 0.64))
        : Math.sin(Math.PI * span(lp, 0, 0.42)),
      read: span(lp, two ? 0.34 : 0.06, two ? 0.62 : 0.4),
      t: easeInOut(span(lp, two ? 0.66 : 0.42, 1)),
      end: start + (two ? 0.24 : 0.13)
    };
  }

  /* Kurzes Blinzeln des Suchers im Moment der Aufnahme */
  function dip(lp) {
    return clamp(lp < 0.3 ? span(lp, 0.26, 0.3) : 1 - span(lp, 0.3, 0.36), 0, 1);
  }

  function paint(q) {
    if (!layout) return;
    var n = letters.length;

    var S = [];
    for (var j = 0; j < n; j++) S.push(sched(j, q));
    var maxPhoto = Math.max(S[0].photo, n > 1 ? S[1].photo : 0);

    var out = easeInOut(span(q, 0.02, 0.12));        /* die Worte treten ab */
    var gather = easeInOut(span(q, 0.02, 0.15));     /* Fächer wird zum Stapel */
    /* Ordner treten auf. Am Telefon erst, wenn das Fotografieren vorbei ist:
       dort steht das iPhone genau an ihrer Stelle, und ein leerer Ordner, der
       eine halbe Bildschirmlänge lang darunter wartet, erzählt ohnehin nichts.
       Der zweite Brief ist bei 0.52 abfotografiert, der dritte startet bei 0.59. */
    var show = layout.narrow ? span(q, 0.52, 0.59) : span(q, 0.13, 0.24);

    if (words) {
      words.style.opacity = (1 - out).toFixed(3);
      words.style.transform = "translate3d(0," + (-out * 44).toFixed(1) + "px,0)";
    }
    if (hint) hint.style.opacity = (1 - span(q, 0, 0.04)).toFixed(3);
    if (marksBar) marksBar.style.opacity = (1 - out).toFixed(3);

    /* Am Ende rückt die fertige Ablage in die Mitte. */
    var mid = easeInOut(span(q, 0.91, 1));
    if (folderBox) {
      folderBox.style.opacity = show.toFixed(3);
      folderBox.style.transform =
        "translate(" + (-layout.shiftX * mid).toFixed(1) + "px," +
        (layout.shiftY * mid).toFixed(1) + "px) scale(" +
        (1 + 0.05 * mid).toFixed(3) + ")";
    }

    var counts = [0, 0, 0, 0, 0, 0];
    var hits = [false, false, false, false, false, false];
    var restAt = [{ x: 0, y: 0 }, { x: 0, y: 0 }];

    for (var i = 0; i < n; i++) {
      var el = letters[i];
      var k = +(el.getAttribute("data-folder") || 0);
      var box = layout.boxes[k] || layout.boxes[0];

      var st = S[i];
      var first = st.two;
      var lp = st.lp;
      var lift = st.lift;
      var photo = st.photo;
      var read = st.read;
      var t = st.t;

      /* Ruheort: erst Fächer, dann Stapel */
      var restX = lerp(layout.heroX + layout.cardW * HX[i], layout.pileX + layout.cardW * PX[i], gather);
      var restY = lerp(layout.heroY + layout.cardH * HY[i], layout.pileY + layout.cardH * PY[i], gather)
                  - lift * layout.cardH * 0.07;
      var restR = lerp(HR[i], PR[i], gather);

      var landS = box ? clamp((box.h * 0.5) / layout.cardH, 0.08, 0.4) : 0.2;

      if (i < 2) { restAt[i] = { x: restX, y: restY }; }

      var cx = lerp(restX, box.cx - layout.cardW * 0.12, t);
      var cy = lerp(restY, box.cy, t) - Math.sin(Math.PI * t) * (layout.narrow ? 16 : 30);
      var rot = lerp(restR, 0, easeOut(span(lp, first ? 0.02 : 0.3, first ? 0.2 : 0.95)));
      var sc = lerp(lerp(1 + 0.045 * lift, layout.photoFit, photo), landS, t);
      /* Während einer Aufnahme treten die übrigen Briefe zurück. */
      var op = (1 - span(t, 0.72, 0.99)) * (1 - Math.max(0, maxPhoto - photo) * 0.65);

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
      /* Der Ordner bleibt noch ein Stück hervorgehoben, nachdem der
         Brief hineingerutscht ist — sonst ist der Moment zu kurz. */
      if (t > 0.45 && q < st.end + 0.05) hits[k] = true;
    }

    if (phone) {
      /* Es kommt zum ersten Brief, wandert zum zweiten weiter
         und fährt erst danach wieder weg. */
      var pIn = span(S[0].lp, 0.02, 0.18);
      var pOut = span(S[1].lp, 0.42, 0.58);
      var pVis = pIn * (1 - pOut);
      phone.style.opacity = pVis.toFixed(3);
      if (pVis > 0.001) {
        var hand = easeInOut(span(q, 0.3, 0.385));
        var px = lerp(restAt[0].x, restAt[1].x, hand);
        var py = lerp(restAt[0].y, restAt[1].y, hand);
        var pY = lerp(layout.cardH * 0.55, 0, easeOut(pIn)) + lerp(0, layout.cardH * 0.7, pOut);
        phone.style.transform =
          "translate3d(" + (px - layout.phoneW / 2).toFixed(1) + "px," +
          (py - layout.phoneH / 2 + pY).toFixed(1) + "px,0) rotate(" +
          lerp(-3.5, 0, easeOut(pIn)).toFixed(2) + "deg) scale(" +
          lerp(1.05, 1, easeOut(pIn)).toFixed(3) + ")";
        var view = phone.querySelector(".phone__view");
        if (view) {
          var lock = Math.max(
            span(S[0].lp, 0.1, 0.24) * (1 - span(S[0].lp, 0.44, 0.58)),
            span(S[1].lp, 0.1, 0.24) * (1 - pOut)
          );
          var blink = 1 - Math.max(dip(S[0].lp), dip(S[1].lp)) * 0.85;
          view.style.opacity = (lock * blink).toFixed(3);
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

    var on = q < 0.05 ? -1 : q < 0.15 ? 0 : q < 0.88 ? 1 : q < 0.92 ? -1 : 2;
    caps.forEach(function (c, i) { c.classList.toggle("is-on", i === on); });
  }

  /* Der Fortschritt wird an der Höhe des klebenden Blocks gemessen, nicht an
     window.innerHeight. Am Telefon fährt die Adressleiste beim Scrollen ein und
     aus; innerHeight springt dabei um rund achtzig Punkte, und die Geschichte
     sprang mit — Ordner und Sätze zuckten hin und her. Der klebende Block ist
     100svh hoch und ändert sich dabei nicht. */
  function updateStory() {
    if (!story || !layout) return;
    var rect = story.getBoundingClientRect();
    var view = stick ? stick.offsetHeight : window.innerHeight;
    if (rect.top > view || rect.bottom < 0) return;
    var total = rect.height - view;
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
