/* patina's landing page: kortex's diagrams and the contour lines. Nothing here talks to a server. */
(function () {
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

  /* kortex's diagrams: in the hero a request runs from you through kortex to a finished
     job; in the kortex section the model it thinks with and the things it works with.
     Examples only, nothing real runs. The dots move with SVG's own animation, paused off
     screen and for reduced motion. */
  (function () {
    var host = document.getElementById('kx-diag-a');
    if (!host) return;
    var NS = 'http://www.w3.org/2000/svg';
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function el(tag, attrs, parent, text) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      if (parent) parent.appendChild(e);
      return e;
    }
    /* line icons on a 24 grid */
    var icons = {
      printer: 'M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z',
      photo: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 8.5h.01',
      ticket: 'M4 4h16v16H4zM8 12l3 3 5-6',
      calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
      fan: 'M12 10.5c-1-4.5 1-7 3.5-6s1 4.5-2 6.5M13.5 12c4.5-1 7 1 6 3.5s-4.5 1-6.5-2M12 13.5c1 4.5-1 7-3.5 6s-1-4.5 2-6.5M10.5 12c-4.5 1-7-1-6-3.5s4.5-1 6.5 2',
      laptop: 'M5 6h14v9H5zM3 18h18',
      globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9M12 3c-2.5 2.6-3.6 5.6-3.6 9s1.1 6.4 3.6 9',
      power: 'M12 3v8M7 6.5a7 7 0 1 0 10 0',
      gear: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1',
      apps: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
      cloud: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5A4.25 4.25 0 0 0 7 18z',
      code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
      plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
      person: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8M5 20a7 7 0 0 1 14 0'
    };
    function icon(name, cx, cy, size, parent, cls) {
      var g = el('g', { transform: 'translate(' + (cx - size / 2) + ',' + (cy - size / 2) + ') scale(' + size / 24 + ')', 'class': cls || 'kx-ico' }, parent);
      if (name === 'eu') {
        for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; el('circle', { cx: 12 + 9 * Math.cos(a), cy: 12 + 9 * Math.sin(a), r: 1.35, 'class': 'fill' }, g); }
        el('text', { x: 12, y: 15.2, 'text-anchor': 'middle', 'class': 'kx-t-eu' }, g, 'EU');
      } else el('path', { d: icons[name] }, g);
      return g;
    }
    function packet(parent, d, dur, begin, cls, back) {
      var c = el('circle', { r: 2.6, 'class': 'kx-pkt ' + (cls || '') }, parent);
      var m = el('animateMotion', { dur: dur + 's', begin: begin + 's', repeatCount: 'indefinite', path: d }, c);
      if (back) { m.setAttribute('keyPoints', '0;1;0'); m.setAttribute('keyTimes', '0;.5;1'); m.setAttribute('calcMode', 'linear'); }
    }
    function sweep(x1, y1, x2, y2, vertical) {
      if (vertical) { var my = (y1 + y2) / 2; return 'M' + x1 + ',' + y1 + ' C' + x1 + ',' + my + ' ' + x2 + ',' + my + ' ' + x2 + ',' + y2; }
      var mx = (x1 + x2) / 2; return 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2;
    }

    /* the hero: you ask, kortex hands it to the agent, a finished job lands on the pile.
       opencode asks before every change, Hermes before risky ones. */
    var asks = [
      { ico: 'printer', ask: 'my printer stopped printing', agent: 0, title: 'Printing again', sub: ['Paper jam cleared.', 'You allowed the fix.'] },
      { ico: 'photo', ask: 'something like Photoshop', agent: 1, title: 'Got PhotoCraft', sub: ['Free, like Photoshop.', 'Opens PSD files.'] },
      { ico: 'plug', ask: 'connect yourself to my Linear', agent: 0, title: 'Connected', sub: ['To your Linear.', 'You signed in once.'] },
      { ico: 'ticket', ask: 'file a ticket: PDF export bug', agent: 1, title: 'Ticket filed', sub: ['In Linear, as a bug,', 'for the Web team.'] },
      { ico: 'calendar', ask: 'what\'s on my list today?', agent: 1, title: '4 things today', sub: ['Invoice overdue, then', 'team call at 15:00.'] },
      { ico: 'fan', ask: 'why is my fan so loud?', agent: 0, title: 'Fan is quiet', sub: ['Stopped a busy tab.', 'You allowed it.'] }
    ];
    var ring = [[-57, -33], [-6, -66], [51, -42], [-57, 33], [-6, 66], [51, 42]];
    function around(c, offs) { return offs.map(function (o) { return [c[0] + o[0], c[1] + o[1]]; }); }
    var layouts = {
      wide: { w: 640, h: 214, you: [118, 104], bub: around([118, 104], ring), hub: [262, 82, 136, 44], v: false,
        inL: [[140, 98, 262, 96], [140, 110, 262, 116]], outL: [[398, 96, 462, 74], [398, 116, 462, 140]], sheet: [462, 30, 150, 140] },
      mid: { w: 500, h: 214, you: [80, 104], bub: around([80, 104], ring), hub: [176, 82, 124, 44], v: false,
        inL: [[102, 98, 176, 96], [102, 110, 176, 116]], outL: [[300, 96, 340, 74], [300, 116, 340, 140]], sheet: [340, 30, 144, 140] },
      tall: { w: 340, h: 478, you: [170, 92], bub: around([170, 92], [[-62, -24], [-34, -60], [34, -60], [62, -24], [-62, 30], [62, 30]]), hub: [102, 214, 136, 44], v: true,
        inL: [[163, 114, 162, 214], [177, 114, 178, 214]], outL: [[102, 236, 96, 380], [238, 236, 246, 380]], sheet: [96, 330, 150, 140] }
    };
    var a = null, aI = 0, doneNo = 128;
    function buildA(L) {
      host.innerHTML = '';
      var svg = el('svg', { viewBox: '0 0 ' + L.w + ' ' + L.h }, host);
      L.bub.forEach(function (p) { el('path', { d: 'M' + p[0] + ',' + p[1] + ' L' + L.you[0] + ',' + L.you[1], 'class': 'kx-wire dot' }, svg); });
      L.inL.forEach(function (l, i) {
        var d = sweep(l[0], l[1], l[2], l[3], L.v);
        el('path', { d: d, 'class': 'kx-wire' + (i ? ' dash' : '') }, svg);
        packet(svg, d, 2.2 + i * .6, i * .35);
      });
      L.outL.forEach(function (l, i) {
        var o = i ? 48 : -48;
        var d = L.v ? 'M' + l[0] + ',' + l[1] + ' C' + (l[0] + o) + ',' + l[1] + ' ' + (l[2] + o) + ',' + l[3] + ' ' + l[2] + ',' + l[3] : sweep(l[0], l[1], l[2], l[3]);
        el('path', { d: d, 'class': 'kx-wire' + (i ? ' dash' : '') }, svg);
        packet(svg, d, 2 + i * .5, .5 + i * .3, 'g');
      });
      el('circle', { cx: L.you[0], cy: L.you[1], r: 30, 'class': 'kx-halo' }, svg);
      el('circle', { cx: L.you[0], cy: L.you[1], r: 22, 'class': 'kx-me' }, svg);
      icon('person', L.you[0], L.you[1], 22, svg, 'kx-me-ico');
      var r = { svg: svg, bubs: [], sheet: L.sheet };
      L.bub.forEach(function (p, i) {
        var g = el('g', { 'class': 'kx-bub' }, svg);
        el('circle', { cx: p[0], cy: p[1], r: 16, 'class': 'kx-node' }, g);
        icon(asks[i].ico, p[0], p[1], 16, g);
        r.bubs.push(g);
      });
      var h = L.hub;
      el('rect', { x: h[0], y: h[1], width: h[2], height: h[3], rx: 10, 'class': 'kx-hub' }, svg);
      el('path', { d: 'M' + (h[0] + 18) + ',' + (h[1] + 28) + ' l7,-12 l7,12 z', 'class': 'kx-tri' }, svg);
      el('text', { x: h[0] + 40, y: h[1] + 27, 'class': 'kx-t-hub' }, svg, 'kortex');
      el('path', { d: 'M' + (h[0] + h[2] - 20) + ',' + (h[1] + 17) + ' l5,5 -5,5', 'class': 'kx-ico' }, svg);
      var chips = [['opencode', 64], ['Hermes', 56]], x = h[0] + h[2] / 2 - (64 + 6 + 56) / 2, y = h[1] + h[3] + 12;
      r.chips = chips.map(function (c) {
        var g = el('g', { 'class': 'kx-chip' }, svg);
        el('rect', { x: x, y: y, width: c[1], height: 19, rx: 5 }, g);
        el('text', { x: x + c[1] / 2, y: y + 13, 'text-anchor': 'middle' }, g, c[0]);
        x += c[1] + 6;
        return g;
      });
      var s = L.sheet;
      el('rect', { x: s[0] + 16, y: s[1] - 16, width: s[2], height: s[3], rx: 8, 'class': 'kx-sheet back2' }, svg);
      el('rect', { x: s[0] + 8, y: s[1] - 8, width: s[2], height: s[3], rx: 8, 'class': 'kx-sheet back1' }, svg);
      r.top = el('g', {}, svg);
      a = r;
      showA(false);
    }
    function showA(animate) {
      var it = asks[aI], s = a.sheet;
      a.bubs.forEach(function (g, k) { g.classList.toggle('on', k === aI); });
      a.chips.forEach(function (g, k) { g.classList.toggle('on', k === it.agent); });
      a.top.innerHTML = '';
      var g = el('g', animate ? { 'class': 'kx-new' } : {}, a.top);
      el('rect', { x: s[0], y: s[1], width: s[2], height: s[3], rx: 8, 'class': 'kx-sheet top' }, g);
      el('text', { x: s[0] + 14, y: s[1] + 22, 'class': 'kx-t-mono' }, g, 'DONE · #0' + doneNo);
      el('circle', { cx: s[0] + 26, cy: s[1] + 48, r: 12, 'class': 'kx-ok' }, g);
      el('path', { d: 'M' + (s[0] + 20) + ',' + (s[1] + 48) + ' l4,4 8,-9', 'class': 'kx-ok-ico' }, g);
      el('text', { x: s[0] + 14, y: s[1] + 86, 'class': 'kx-t-title' }, g, it.title);
      el('text', { x: s[0] + 14, y: s[1] + 106, 'class': 'kx-t-sub' }, g, it.sub[0]);
      el('text', { x: s[0] + 14, y: s[1] + 122, 'class': 'kx-t-sub' }, g, it.sub[1]);
    }

    /* B and C: kortex in the middle, working with one thing at a time */
    function hub(svg, H, tiles, capY) {
      var r = { tiles: [], paths: [] };
      tiles.forEach(function (t) {
        var left = t.x < H[0], edge = left ? t.x + 22 : t.x - 22, from = left ? H[0] - 26 : H[0] + 26, mid = (edge + from) / 2;
        var d = 'M' + from + ',' + H[1] + ' H' + mid + ' V' + t.y + ' H' + edge;
        r.paths.push(d);
        el('path', { d: d, 'class': 'kx-wire' }, svg);
      });
      r.live = el('g', {}, svg);
      tiles.forEach(function (t) {
        var g = el('g', { 'class': 'kx-tile ' + t.c }, svg);
        el('rect', { x: t.x - 22, y: t.y - 22, width: 44, height: 44, rx: 9, 'class': 'kx-node' }, g);
        icon(t.ico, t.x, t.y, 20, g);
        r.tiles.push(g);
      });
      el('rect', { x: H[0] - 26, y: H[1] - 26, width: 52, height: 52, rx: 11, 'class': 'kx-hub' }, svg);
      el('path', { d: 'M' + (H[0] - 10) + ',' + (H[1] + 8) + ' l10,-17 l10,17 z', 'class': 'kx-tri' }, svg);
      r.label = el('text', { 'text-anchor': 'middle', 'class': 'kx-t-lbl' }, svg);
      r.cap = el('text', { x: H[0], y: capY, 'text-anchor': 'middle', 'class': 'kx-t-mono' }, svg);
      return r;
    }
    function showHub(r, tiles, i) {
      var t = tiles[i];
      r.tiles.forEach(function (g, k) { g.classList.toggle('on', k === i); g.classList.toggle('dim', k !== i); });
      r.live.innerHTML = '';
      el('path', { d: r.paths[i], 'class': 'kx-wire ' + (t.c ? 'on-' + t.c : 'on-k') }, r.live);
      if (t.c) packet(r.live, r.paths[i], 1.6, 0, t.c, true);
      r.label.setAttribute('x', t.x); r.label.setAttribute('y', t.y - 32);
      r.label.textContent = t.name;
      r.cap.textContent = t.cap;
    }
    /* the models follow patina's defaults/settings.yaml (ai.local, ai.cloud) */
    var models = [
      { x: 64, y: 56, ico: 'laptop', c: 'g', name: 'On your PC', cap: 'thinking · private, offline', ms: 4200 },
      { x: 64, y: 164, ico: 'eu', c: 'v', name: 'EU cloud', cap: 'thinking · Mistral, France', ms: 3200 },
      { x: 336, y: 56, ico: 'globe', c: 'v', name: 'Other cloud', cap: 'thinking · a provider you pick', ms: 2600 },
      { x: 336, y: 164, ico: 'power', c: '', name: 'Off', cap: 'off until you turn it on', ms: 2400 }
    ];
    /* the things on the PC, and three of the services of patina's defaults/services.yaml
       (the caption names all four) */
    var things = [
      { x: 64, y: 44, ico: 'printer', c: 'g', name: 'Printer', cap: 'working · on your PC' },
      { x: 64, y: 118, ico: 'gear', c: 'g', name: 'Settings', cap: 'working · on your PC' },
      { x: 64, y: 192, ico: 'apps', c: 'g', name: 'Apps', cap: 'working · on your PC' },
      { x: 336, y: 44, ico: 'cloud', c: 'v', name: 'Nextcloud', cap: 'working · your Nextcloud' },
      { x: 336, y: 118, ico: 'ticket', c: 'v', name: 'Linear', cap: 'working · your Linear' },
      { x: 336, y: 192, ico: 'code', c: 'v', name: 'GitHub', cap: 'working · your GitHub' }
    ];
    var bSvg = document.getElementById('kx-diag-b'), cSvg = document.getElementById('kx-diag-c');
    var b = hub(bSvg, [200, 110], models, 218), c = hub(cSvg, [200, 118], things, 230), bI = 0, cI = 0;
    showHub(b, models, 0); showHub(c, things, 0);

    /* the hero's diagram takes the layout that fits its card; each part runs while on screen */
    var seen = { a: false, bc: false }, layout = null;
    function running(k) { return seen[k] && !still && !document.hidden; }
    function update() {
      [[a.svg, 'a'], [bSvg, 'bc'], [cSvg, 'bc']].forEach(function (p) {
        if (p[0].pauseAnimations) p[0][running(p[1]) ? 'unpauseAnimations' : 'pauseAnimations']();
      });
    }
    function fitA() {
      var w = host.clientWidth, want = w < 400 ? 'tall' : w < 600 ? 'mid' : 'wide';
      if (want !== layout) { layout = want; buildA(layouts[want]); update(); }
    }
    fitA();
    if ('ResizeObserver' in window) new ResizeObserver(fitA).observe(host);
    else window.addEventListener('resize', fitA);
    if (still) return;

    function every(k, step, ms) {
      function tick() { if (running(k)) step(); setTimeout(tick, ms()); }
      setTimeout(tick, ms());
    }
    var askEl = document.getElementById('kx-ask'), typing;
    every('a', function () {
      aI = (aI + 1) % asks.length; doneNo++;
      var text = asks[aI].ask, n = 0;
      clearInterval(typing);
      askEl.textContent = '';
      typing = setInterval(function () { askEl.textContent = text.slice(0, ++n); if (n >= text.length) clearInterval(typing); }, 32);
      a.bubs.forEach(function (g, k) { g.classList.toggle('on', k === aI); });
      setTimeout(function () { showA(true); }, 1300);
    }, function () { return 4400; });
    every('bc', function () { bI = (bI + 1) % models.length; showHub(b, models, bI); }, function () { return models[bI].ms; });
    every('bc', function () { cI = (cI + 1) % things.length; showHub(c, things, cI); }, function () { return 2600; });
    [['a', host], ['bc', document.querySelector('.kx-bento')]].forEach(function (p) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { seen[p[0]] = e[0].isIntersecting; update(); }, { threshold: .1 }).observe(p[1]);
      } else seen[p[0]] = true;
    });
    document.addEventListener('visibilitychange', update);
    update();
  })();

  var specs = {
    'a-contour': { cx: .6, cy: .45, reach: .47, rings: 22, inner: '#7c3aed', outer: '#c3a2ff', thin: 1.1, bold: 1.8, alpha: function (t) { return .35 + (1 - t) * .6; } },
    'a-cta-contour': { cx: .9, cy: .15, reach: .7, rings: 26, inner: '#3cff9d', outer: '#6d4fc2', thin: 1, bold: 1.5, alpha: function (t) { return .2 + (1 - t) * .5; } }
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
