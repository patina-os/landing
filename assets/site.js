/* patina's landing page: the kortex demo and the contour lines. Nothing here talks to a server. */
(function () {
  /* the command palette demos: example requests, nothing real runs */
  var asks = {
    a: {
      wait: 'Waiting for your answer', none: 'Only looked. Nothing to approve.',
      done: { once: 'Done, this one time.', always: 'Done. Changes like this will not ask again.', deny: 'Denied. Nothing was changed.' },
      items: [
        ['Bigger text', 'make the text a little bigger', 'Your system font is 10 pt. I can set it to 11 pt for all apps.', 'Change the system font size to 11 pt'],
        ['Dark mode', 'switch to dark mode', 'True black, easy on the eyes. Windows and files stay as they are.', 'Switch the theme to dark mode'],
        ['Set up my mail', 'set up my work email, it is anna@example.eu', 'I\'ll open Thunderbird\'s setup with your address filled in. Your password stays with you.', 'Open Thunderbird\'s account setup for anna@example.eu'],
        ['Loud fan', 'why is my fan so loud?', 'A video tab has kept one core busy for ten minutes. Pausing it should quiet the fan.', null],
        ['Photo editor', 'I need something like Photoshop', 'PhotoCraft works the way Photoshop does, and it is free. The ArtCraft Launcher installs it.', 'Install PhotoCraft with the ArtCraft Launcher']
      ]
    },
  };
  document.querySelectorAll('[data-palette]').forEach(function (pal) {
    var key = pal.dataset.palette, d = asks[key];
    var row = document.querySelector('[data-asks="' + key + '"]');
    var q = pal.querySelector('.q'), ans = pal.querySelector('.ans'), act = pal.querySelector('.act');
    var actText = pal.querySelector('.act-text'), status = pal.querySelector('.status');
    var chips = d.items.map(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = it[0];
      b.addEventListener('click', function () { pick(i); });
      row.appendChild(b);
      return b;
    });
    function pick(i) {
      var it = d.items[i];
      q.textContent = it[1]; ans.textContent = it[2];
      if (it[3]) {
        act.hidden = false;
        actText.innerHTML = '';
        var el = document.createElement(key === 'b' ? 'code' : 'span');
        el.textContent = it[3]; actText.appendChild(el);
        status.textContent = d.wait;
      } else { act.hidden = true; status.textContent = d.none; }
      chips.forEach(function (c, j) { c.setAttribute('aria-pressed', String(i === j)); });
    }
    pal.querySelectorAll('[data-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () { status.textContent = d.done[btn.dataset.choice]; });
    });
    pick(0);
  });

  /* contour rings rising to a summit, steeper on one side, like the mark */
  function contour(canvas, opt) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    var W = rect.width, H = rect.height;
    var cx = W * opt.cx, cy = H * opt.cy;
    var maxR = Math.max(W, H) * opt.reach;
    var n = opt.rings;
    function mix(a, b, t) {
      var pa = [1, 3, 5].map(function (i) { return parseInt(a.slice(i, i + 2), 16); });
      var pb = [1, 3, 5].map(function (i) { return parseInt(b.slice(i, i + 2), 16); });
      return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); }).join(',') + ')';
    }
    for (var k = n; k >= 1; k--) {
      var t = k / n;
      var r = maxR * Math.pow(t, 1.15);
      var shift = (1 - t) * maxR * 0.18;
      ctx.beginPath();
      for (var s = 0; s <= 200; s++) {
        var a = s / 200 * Math.PI * 2;
        var wob = 1 + 0.07 * Math.sin(3 * a + k * 0.7) + 0.045 * Math.sin(5 * a - k * 0.45) + 0.03 * Math.sin(8 * a + k);
        var steep = 1 - 0.22 * Math.cos(a - 0.4);
        var x = cx - shift + Math.cos(a) * r * wob * steep;
        var y = cy + shift * 0.3 + Math.sin(a) * r * wob * 0.82;
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = mix(opt.inner, opt.outer, t);
      ctx.globalAlpha = opt.alpha(t);
      ctx.lineWidth = k % 5 === 0 ? opt.bold : opt.thin;
      if (opt.glow) { ctx.shadowColor = mix(opt.inner, opt.outer, t); ctx.shadowBlur = opt.glow * (1 - t + .2); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (opt.peak) {
      var px = cx - maxR * 0.17, py = cy + maxR * 0.05, sz = opt.peak;
      ctx.beginPath(); ctx.moveTo(px, py - sz); ctx.lineTo(px + sz * .9, py + sz * .6); ctx.lineTo(px - sz * .9, py + sz * .6); ctx.closePath();
      ctx.fillStyle = opt.peakColor;
      if (opt.glow) { ctx.shadowColor = opt.peakColor; ctx.shadowBlur = 18; }
      ctx.fill(); ctx.shadowBlur = 0;
    }
    return true;
  }
  /* pixel rings from the wordmark's ▲: square cells on a grid like the wordmark's blocks,
     a new ring every few seconds, each spreading and fading; stepped at ~12 frames a second
     for the pixel feel, still when the visitor prefers reduced motion */
  (function () {
    var c = document.getElementById('wm-rings');
    if (!c) return;
    var ctx = c.getContext('2d');
    var CELL = 3, W = 480, H = 380, CX = W / 2, CY = H / 2;
    var EVERY = 2600, LIFE = 8400, REACH = 195;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cells = [];
    for (var y = 0; y < H; y += CELL) {
      for (var x = 0; x < W; x += CELL) {
        var dx = x + CELL / 2 - CX, dy = (y + CELL / 2 - CY) / 0.82;
        cells.push([x, y, Math.sqrt(dx * dx + dy * dy), Math.atan2(dy, dx)]);
      }
    }
    function shape(a, k) {
      return 1 + 0.06 * Math.sin(3 * a + k * 1.7) + 0.04 * Math.sin(5 * a - k) + 0.025 * Math.sin(8 * a + k * 0.6);
    }
    function frame(now) {
      ctx.clearRect(0, 0, W, H);
      var first = Math.floor((now - LIFE) / EVERY) + 1, last = Math.floor(now / EVERY);
      for (var k = first; k <= last; k++) {
        var t = (now - k * EVERY) / LIFE;
        if (t < 0 || t > 1) continue;
        var r = 8 + REACH * Math.pow(t, 0.8);
        var alpha = 0.34 * Math.min(1, t * 8) * Math.pow(1 - t, 1.6);
        ctx.fillStyle = t < 0.35 ? '#7c3aed' : '#9b6bff';
        ctx.globalAlpha = alpha;
        for (var i = 0; i < cells.length; i++) {
          var cl = cells[i];
          if (Math.abs(cl[2] - r * shape(cl[3], k)) < CELL * 0.62) ctx.fillRect(cl[0], cl[1], CELL - 0.5, CELL - 0.5);
        }
      }
      ctx.globalAlpha = 1;
    }
    if (still) { frame(EVERY * 3 + 2200); return; }
    var on = true, running = false, lastDraw = 0, start = performance.now();
    function kick() { if (on && !running) { running = true; requestAnimationFrame(loop); } }
    function loop(ts) {
      if (!on) { running = false; return; }
      if (ts - lastDraw > 80) { frame(ts - start + LIFE); lastDraw = ts; }
      requestAnimationFrame(loop);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { on = e[0].isIntersecting; kick(); }).observe(c);
    }
    kick();
  })();

  var specs = {
    'a-contour': { cx: .6, cy: .45, reach: .5, rings: 22, inner: '#7c3aed', outer: '#c3a2ff', thin: 1.1, bold: 1.8, alpha: function (t) { return .35 + (1 - t) * .6; }, peak: 11, peakColor: '#087a46' },
    'a-cta-contour': { cx: .9, cy: .15, reach: .7, rings: 26, inner: '#3cff9d', outer: '#6d4fc2', thin: 1, bold: 1.5, alpha: function (t) { return .2 + (1 - t) * .5; }, peak: 0 }
  };
  function drawAll() {
    Object.keys(specs).forEach(function (id) {
      var c = document.getElementById(id);
      if (c) contour(c, specs[id]);
    });
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawAll, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
  drawAll();
})();
