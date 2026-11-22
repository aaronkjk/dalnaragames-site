/* 첫 화면 물수제비 놀이 (canvas 2D · 2026-11-19)
 * - 옆으로 그으면 돌을 던지고(빨리 그을수록 많이 튐), 누르면 물결. 컴퓨터는 커서를 움직이면 작은 물결도.
 * - 키보드: 물 위에 초점을 두고 Enter·스페이스 = 던지기.
 * - 색은 data-* 로: data-ripple · data-drop · data-drop2 · data-stone · data-stone2 · data-shade (모두 "r,g,b"), data-lw(물결 굵기)
 *   CSS 변수 --c-ripple · --c-stone · --c-drop2 가 있으면 그것이 먼저(밝게·어둡게 바뀌면 'dn:mode' 때 다시 읽음)
 * - 소리: 소리 단추를 켰을 때만 DN.sfx('throw' · 'skip' · 'sink')
 * - 그릴 게 있을 때만 그림(가만히 있으면 0). 세로로 밀면 쪽이 그대로 내려감(touch-action: pan-y).
 * - 최고 기록은 이 브라우저에만(localStorage 'dn-skip-best'), 못 쓰는 브라우저면 그냥 안 남김.
 */
window.DNPond = function (el) {
  'use strict';
  if (el.__pond) return; el.__pond = true;
  var cv = el.querySelector('canvas'); if (!cv || !cv.getContext) return;
  var cx = cv.getContext('2d');
  var popEl = el.querySelector('.pop'), bestEl = el.querySelector('.best'), cntEl = el.querySelector('.cnt');
  var tCount = el.getAttribute('data-count') || '{n}', tBest = el.getAttribute('data-best') || '{n}';
  var A = function (k, d) { return el.getAttribute('data-' + k) || d; };
  var RIP, DROP, DROP2, STONE, STONE2, SHADE;
  function readColors() {
    var cs = getComputedStyle(el), cv = function (n) { return (cs.getPropertyValue(n) || '').trim(); };
    RIP = cv('--c-ripple') || A('ripple', '245,241,232'); DROP = cv('--c-ripple') || A('drop', RIP); DROP2 = cv('--c-drop2') || A('drop2', '246,201,69');
    STONE = cv('--c-stone') || A('stone', RIP); STONE2 = A('stone2', DROP2); SHADE = A('shade', '0,0,0');
  }
  readColors();
  document.addEventListener('dn:mode', function () { readColors(); kick(); });
  var LW = +A('lw', '1.6');
  var sfx = function (n) { if (window.DN && DN.sfx) DN.sfx(n); };
  var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  var ripples = [], stones = [], drops = [], raf = 0, last = 0;
  var best = 0, throws = 0;
  try { best = +(localStorage.getItem('dn-skip-best') || 0) || 0; } catch (e) {}
  function setBest() { if (bestEl) { bestEl.textContent = tBest.replace('{n}', best); bestEl.hidden = !best; } }
  setBest();

  function size() {
    var r = el.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  if ('ResizeObserver' in window) new ResizeObserver(function () { size(); kick(); }).observe(el);
  else window.addEventListener('resize', function () { size(); kick(); });

  function ripple(x, y, max, a) { ripples.push({ x: x, y: y, r: 2, max: max, a: a || 0.9, sp: 0.06 + max / 1400 }); }
  function splash(x, y, n, up) {
    for (var i = 0; i < n; i++) drops.push({ x: x, y: y, vx: (Math.random() - 0.5) * 0.22, vy: -(0.12 + Math.random() * 0.16) * (up || 1), a: 1, alt: Math.random() < 0.4 });
  }
  function throwStone(x0, y0, dir, speed, demo) {
    var n = Math.max(2, Math.min(15, Math.round(1.5 + speed * 4.2)));
    var r = 0.8, room = dir > 0 ? W - x0 - 24 : x0 - 24;
    if (room < W * 0.38) { x0 = dir > 0 ? 28 : W - 28; room = W - 52; }
    var d0 = Math.min(W * 0.1 + speed * 26, room * (1 - r) / (1 - Math.pow(r, n)));
    var y = Math.max(H * 0.36, Math.min(H * 0.8, y0));
    stones.push({ x: x0, y: y, dir: dir, n: n, k: 0, d: d0, r: r, t: 0, from: x0, T: 150 + d0 * 1.7, h: Math.min(30, d0 * 0.34) + 6, demo: demo, sink: 0, a: 1 });
    splash(x0, y - 4, 3, 0.6);
    if (!demo) { throws++; if (cntEl) cntEl.textContent = String(throws); sfx('throw'); }
    kick();
  }
  function land(s) {
    s.k++;
    ripple(s.x, s.y, 20 + s.d * 0.35, 0.95); splash(s.x, s.y, 4);
    if (!s.demo) sfx('skip');
    el.dispatchEvent(new CustomEvent('pond:skip', { detail: { k: s.k, n: s.n, demo: s.demo } }));
    if (s.k >= s.n) { s.sink = 1; ripple(s.x, s.y, 46 + s.d * 0.4, 1); splash(s.x, s.y, 7, 1.3); if (!s.demo) sfx('sink'); done(s); return; }
    s.from = s.x; s.t = 0; s.d *= s.r; s.T = 140 + s.d * 1.7; s.h = Math.min(30, s.d * 0.34) + 4;
  }
  function done(s) {
    if (popEl) {
      popEl.textContent = tCount.replace('{n}', s.n);
      popEl.classList.remove('show'); void popEl.offsetWidth; popEl.classList.add('show');
    }
    if (!s.demo && s.n > best) { best = s.n; try { localStorage.setItem('dn-skip-best', String(best)); } catch (e) {} setBest(); }
    el.dispatchEvent(new CustomEvent('pond:done', { detail: { n: s.n, demo: s.demo, best: best } }));
  }

  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(t) {
    var dt = Math.max(0, Math.min(48, t - last)); last = Math.max(last, t);
    raf = 0;
    cx.clearRect(0, 0, W, H);
    ripples = ripples.filter(function (p) {
      p.r += p.sp * dt * (1 + p.max / 60); p.a = Math.max(0, 0.95 * (1 - p.r / p.max));
      if (p.a <= 0.01) return false;
      cx.strokeStyle = 'rgba(' + RIP + ',' + (p.a * 0.85).toFixed(3) + ')'; cx.lineWidth = LW;
      cx.beginPath(); cx.ellipse(p.x, p.y, Math.max(0.1, p.r), Math.max(0.1, p.r * 0.3), 0, 0, Math.PI * 2); cx.stroke();
      if (p.r > 10) { cx.strokeStyle = 'rgba(' + RIP + ',' + (p.a * 0.4).toFixed(3) + ')'; cx.beginPath(); cx.ellipse(p.x, p.y, p.r * 0.62, p.r * 0.19, 0, 0, Math.PI * 2); cx.stroke(); }
      return true;
    });
    drops = drops.filter(function (d) {
      d.vy += 0.0009 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.a -= dt / 700;
      if (d.a <= 0) return false;
      cx.fillStyle = 'rgba(' + (d.alt ? DROP2 : DROP) + ',' + d.a.toFixed(3) + ')';
      cx.fillRect(d.x - 1.5, d.y - 1.5, 3, 3);
      return true;
    });
    stones = stones.filter(function (s) {
      if (s.sink) { s.a -= dt / 380; s.y += dt * 0.01; if (s.a <= 0) return false; }
      else {
        s.t += dt; var p = Math.min(1, s.t / s.T);
        s.x = s.from + s.dir * s.d * p;
        s.z = Math.sin(p * Math.PI) * s.h;
        if (p >= 1) land(s);
      }
      var z = s.sink ? 0 : s.z || 0;
      cx.fillStyle = 'rgba(' + SHADE + ',.35)'; cx.beginPath(); cx.ellipse(s.x, s.y + 2, 8, 2.6, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = 'rgba(' + STONE + ',' + s.a.toFixed(3) + ')';
      cx.beginPath(); cx.ellipse(s.x, s.y - z - 3, 8.5, 4.6, s.dir * -0.15, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = 'rgba(' + STONE2 + ',' + (s.a * 0.9).toFixed(3) + ')';
      cx.beginPath(); cx.ellipse(s.x - 2 * s.dir, s.y - z - 5, 3, 1.4, 0, 0, Math.PI * 2); cx.fill();
      return true;
    });
    if (ripples.length || drops.length || stones.length) raf = requestAnimationFrame(frame);
    else { raf = 0; cx.clearRect(0, 0, W, H); }
  }

  var down = null, trail = [], lastHover = 0, hx = -99, hy = -99;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; }
  el.addEventListener('pointerdown', function (e) {
    down = pos(e); trail = [down];
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
  });
  el.addEventListener('pointermove', function (e) {
    var p = pos(e);
    if (down) { trail.push(p); if (trail.length > 8) trail.shift(); return; }
    if (e.pointerType === 'mouse' && p.t - lastHover > 90 && Math.hypot(p.x - hx, p.y - hy) > 26) {
      lastHover = p.t; hx = p.x; hy = p.y; ripple(p.x, p.y, 16, 0.5); kick();
    }
  });
  function up(e) {
    if (!down) return;
    var p = pos(e), a = down; down = null;
    var b = trail.filter(function (q) { return p.t - q.t < 110; })[0] || a;
    var dx = p.x - b.x, dt = Math.max(16, p.t - b.t), tx = p.x - a.x, ty = p.y - a.y;
    if (Math.abs(tx) > 34 && Math.abs(tx) > Math.abs(ty) * 1.2) {
      var sp = Math.abs(dx) / dt; if (sp < 0.25) sp = Math.min(0.8, Math.abs(tx) / Math.max(120, p.t - a.t));
      throwStone(a.x, (a.y + p.y) / 2, tx > 0 ? 1 : -1, sp, false);
    } else if (Math.abs(tx) < 12 && Math.abs(ty) < 12) {
      ripple(p.x, p.y, 54, 1); splash(p.x, p.y, 5); sfx('drip'); kick();
    }
  }
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', function () { down = null; });
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); throwStone(28, H * 0.6, 1, 0.9 + Math.random() * 1.8, false); }
  });
  el.DNThrow = function () { throwStone(28, H * 0.6, 1, 0.9 + Math.random() * 1.8, false); };

  var shown = false;
  var demo = function () { if (!shown) { shown = true; throwStone(28, H * 0.6, 1, 1.25, true); } };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { setTimeout(demo, 600); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el);
  } else setTimeout(demo, 800);
};
