/* PostSafe-Moiré — zeichnet ein Verlaufsbild mit welliger Streifen-Interferenz.
   Verwendung:  <canvas class="mo" data-pal="0" data-seed="1.1"></canvas>
   oder:        <canvas class="mo" data-name="Rechnungen"></canvas>            */
(function () {
  var PALS = [
    [[255,176,32],[255,61,120],[124,31,162]],   /* 0 Zahlung  */
    [[46,196,255],[43,75,255],[123,43,255]],    /* 1 Amt      */
    [[0,214,200],[0,138,255],[60,60,200]],      /* 2 Schutz   */
    [[168,255,96],[0,208,132],[0,138,150]],     /* 3 Konto    */
    [[255,196,120],[255,92,122],[196,40,140]],  /* 4 Körper   */
    [[110,43,255],[43,197,255],[0,230,190]],    /* 5 Arbeit   */
    [[210,210,204],[150,150,146],[96,96,94]],   /* 6 Rauschen */
    [[255,214,0],[255,59,24],[190,20,90]]       /* 7 Frist    */
  ];

  /* Text -> Zahl. Derselbe Text ergibt immer dasselbe Bild. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function mix3(p, t) {
    var a, b, k;
    if (t < 0.5) { a = p[0]; b = p[1]; k = t * 2; }
    else { a = p[1]; b = p[2]; k = (t - 0.5) * 2; }
    return [a[0] + (b[0]-a[0])*k, a[1] + (b[1]-a[1])*k, a[2] + (b[2]-a[2])*k];
  }

  function draw(cv) {
    var wCss = cv.offsetWidth, hCss = cv.offsetHeight;
    if (!wCss || !hCss) return;

    var pal, seed;
    var name = cv.getAttribute('data-name');
    if (name) {                                   /* Bild aus dem Namen ableiten */
      var h = hash(name);
      pal  = PALS[h % PALS.length];
      seed = 1 + ((h >>> 8) % 2000) / 100;
    } else {
      pal  = PALS[parseInt(cv.getAttribute('data-pal'), 10) || 0];
      seed = parseFloat(cv.getAttribute('data-seed')) || 1;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(wCss * dpr));
    var hh = Math.max(2, Math.round(hCss * dpr));
    if (w * hh > 900000) {                        /* Deckel gegen zu grosse Flächen */
      var f = Math.sqrt(900000 / (w * hh));
      w = Math.round(w * f); hh = Math.round(hh * f);
    }
    cv.width = w; cv.height = hh;

    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(w, hh), d = img.data;

    var cx = 0.26 + (seed * 0.137 % 0.42);        /* Lage des Farbklecks   */
    var cy = 0.30 + (seed * 0.211 % 0.40);
    var fStripe = 0.62 + (seed * 0.083 % 0.55);   /* Streifendichte        */
    var fWarpA  = 2.2  + (seed * 0.29  % 3.4);    /* Wellenzahl senkrecht  */
    var fWarpB  = 5.5  + (seed * 0.47  % 6.0);
    var amp     = 8    + (seed * 1.7   % 13);     /* Wellenausschlag       */
    var i = 0;

    for (var y = 0; y < hh; y++) {
      var fy = y / hh;
      var warp = Math.sin(fy * Math.PI * 2 * fWarpA + seed) * amp
               + Math.sin(fy * Math.PI * 2 * fWarpB + seed * 1.9) * (amp * 0.42);
      for (var x = 0; x < w; x++) {
        var fx = x / w;
        var dx = (fx - cx) * 1.15, dy = fy - cy;
        var r = Math.sqrt(dx*dx + dy*dy);
        var blob = 1 - Math.min(1, r * 1.95);
        var diag = fx * 0.40 + fy * 0.74;
        var t = 0.10 + blob * 0.42 + diag * 0.36;
        t += Math.sin((x + warp) * fStripe + seed) * 0.155;   /* Moiré */
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        var c = mix3(pal, t);
        d[i++] = c[0]; d[i++] = c[1]; d[i++] = c[2]; d[i++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function run() {
    var list = document.querySelectorAll('canvas.mo');
    for (var i = 0; i < list.length; i++) draw(list[i]);
  }

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(run, 220);
  });
})();
