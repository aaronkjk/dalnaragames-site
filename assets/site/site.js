/* 달나라 게임즈 홈페이지 — 오락실 움직임·소리 (site.js 안에서 공용 기능보다 먼저, 2026-11-19)
 * 게임 메뉴 같은 메뉴(▶ 표시, ↑↓ Enter) · 물고기 카드 뒤집기 · 숫자 세기 · 오락실 소리(네모 파형 짧은 음) · 밝게·어둡게 · 구역 바로 가기 줄
 */
(function () {
  'use strict';
  var DN = window.DN = window.DN || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  function T(f, d, t, v, f2, dl) { if (DN.tone) DN.tone(f, d, t, v, f2, dl); }
  function N(d, f, q, v, ty, dl, f2) { if (DN.noise) DN.noise(d, f, q, v, ty, dl, f2); }

  /* 소리(소리 단추를 켰을 때만) */
  DN.sounds = {
    none: function () {},
    tap: function () { T(660, 0.05, 'square', 0.035); },
    tick: function () { T(880, 0.04, 'square', 0.03); },
    pick: function () { T(523, 0.05, 'square', 0.04); T(784, 0.07, 'square', 0.04, null, 0.05); },
    start: function () { [523, 659, 784, 1046].forEach(function (f, i) { T(f, 0.09, 'square', 0.04, null, i * 0.07); }); },
    go: function () { T(784, 0.06, 'square', 0.04); T(1046, 0.1, 'square', 0.04, null, 0.06); },
    menu: function () { T(392, 0.07, 'square', 0.04); T(587, 0.09, 'square', 0.04, null, 0.06); },
    flip: function () { N(0.09, 2600, 0.8, 0.12); T(1200, 0.04, 'square', 0.02, null, 0.05); },
    note: function () { T(330, 0.09, 'square', 0.04); T(262, 0.12, 'square', 0.04, null, 0.08); },
    on: function () { T(880, 0.07, 'square', 0.04); T(1320, 0.1, 'square', 0.04, null, 0.07); },
    throw: function () { N(0.14, 1600, 0.7, 0.1, 'bandpass', 0, 500); },
    skip: function () { T(950, 0.07, 'sine', 0.09, 480); N(0.05, 3200, 1, 0.06); },
    sink: function () { T(320, 0.26, 'sine', 0.12, 90); N(0.18, 700, 0.8, 0.08); },
    drip: function () { T(1300, 0.08, 'sine', 0.06, 620); }
  };

  /* 메뉴: 열면 첫 줄에 초점, ↑↓로 옮기면 ▶가 따라감 */
  var mb = $('.menu-b'), gm = $('#gm');
  if (mb && gm) {
    var links = $$('a', gm);
    links.forEach(function (a, i) { a.parentNode.style.setProperty('--k', i); });
    var open = function () {
      gm.hidden = false; gm.classList.remove('in'); void gm.offsetWidth; gm.classList.add('in');
      mb.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden';
      // 지금 보는 구역(바로 가기 줄과 같은 표시)에 초점, 없으면 첫 줄
      var here = links.filter(function (a) { return a.getAttribute('aria-current') === 'true'; })[0] || links[0];
      here.focus();
    };
    var close = function (back) {
      gm.hidden = true; mb.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = '';
      if (back) mb.focus();
    };
    mb.addEventListener('click', open);
    $('.gm-x', gm).addEventListener('click', function () { close(true); });
    links.forEach(function (a) { a.addEventListener('click', function () { close(false); }); a.addEventListener('focus', function () { if (DN.sfx) DN.sfx('tick'); }); });
    gm.addEventListener('keydown', function (e) {
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    });
  }

  /* 물고기 카드 뒤집기 */
  $$('.hw').forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });
  });

  /* 숫자 세기: 화면에 들어오면 0에서 그 숫자까지(숫자는 HTML에 이미 있음 = 사실 그대로) */
  function countUp(el) {
    var to = +el.getAttribute('data-count'); if (!(to >= 0)) return;
    var t0 = performance.now(), ms = to > 50 ? 1100 : 800;
    (function step(t) {
      var p = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - p, 3);   // 첫 장면 시각이 t0보다 앞설 수 있어서 0 아래로 안 내려가게
      el.textContent = String(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }); }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* 돌이 물에 닿으면 화면 위 '최고' 숫자도 같이 바꿈(물수제비 놀이가 알려 줌) */
  document.addEventListener('dn:pick', function (e) {
    var p = e.detail && e.detail.picker; if (!p) return;
    var stage = $('.pk-stage', p); if (stage) stage.setAttribute('data-cur', e.detail.i);
  });
})();

/* 밝게·어둡게 고르기 (2026-11-19 대표님: 밝은 게 기본, 고를 수 있게)
 * - 처음엔 늘 밝게(기기 설정 안 따름). 고른 것은 이 브라우저에만 기억(localStorage 'dn-mode'), 못 쓰는 브라우저면 그냥 밝게
 * - 쪽을 열 때 <head>의 한 줄이 그리기 전에 data-mode를 붙여서 깜빡임 없음. 여기선 단추만 맞추고 바꿀 때 처리
 */
(function () {
  'use strict';
  var root = document.documentElement, KEY = 'dn-mode';
  var btns = [].slice.call(document.querySelectorAll('[data-mode-toggle]'));
  function cur() { return root.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'; }
  function paint(m) {
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', m === 'dark' ? 'true' : 'false');
      var l = b.querySelector('.mode-l'); if (l) l.textContent = b.getAttribute('data-' + m);
      b.setAttribute('aria-label', b.getAttribute('data-aria') + ': ' + b.getAttribute('data-' + m));
    });
    var t = document.querySelector('meta[name=theme-color]'); if (t) t.setAttribute('content', m === 'dark' ? '#15161a' : '#f3eee3');
  }
  function set(m) {
    root.setAttribute('data-mode', m);
    try { localStorage.setItem(KEY, m); } catch (e) {}
    paint(m);
    document.dispatchEvent(new CustomEvent('dn:mode', { detail: { mode: m } }));
    if (window.DN && DN.sfx) DN.sfx(m === 'dark' ? 'menu' : 'tick');
  }
  paint(cur());
  btns.forEach(function (b) { b.addEventListener('click', function () { set(cur() === 'dark' ? 'light' : 'dark'); }); });
})();

/* 머리 줄 로고 글자: 보통은 CSS 규칙(언어와 상관없이 같음). 글자를 아주 크게 키운 폰에서 단추와 겹치면 글자를 숨김 */
(function () {
  var logo = document.querySelector('.logo'), lt = logo && logo.querySelector('.lt'), tools = document.querySelector('.top .tools');
  if (!lt || !tools) return;
  function fit() {
    logo.classList.remove('tight');
    if (getComputedStyle(lt).display === 'none') return;
    if (lt.getBoundingClientRect().right > tools.getBoundingClientRect().left - 6) logo.classList.add('tight');
  }
  fit(); addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(tools);
})();

/* 구역 바로 가기 줄 + 메뉴: 지금 보는 구역 표시(둘이 같은 표시를 씀). 누르면 부드럽게 내려감(CSS scroll-behavior + scroll-margin) */
(function () {
  var bar = document.querySelector('.jump'); if (!bar) return;
  var row = bar.querySelector('.jump-in');
  var all = [].slice.call(document.querySelectorAll('[data-jump]'));
  var ids = [], seen = {};
  [].forEach.call(bar.querySelectorAll('[data-jump]'), function (a) { var k = a.getAttribute('data-jump'); if (!seen[k]) { seen[k] = 1; ids.push(k); } });
  var hm = document.getElementById('game'); if (hm) ids.unshift('game');
  var secs = ids.map(function (k) { return document.getElementById(k); }).filter(Boolean);
  var cur = null, raf = 0, lock = 0;
  function mark(k) {
    if (k === cur) return; cur = k;
    all.forEach(function (a) { if (a.getAttribute('data-jump') === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    show(k);
  }
  // 폰: 표시된 탭이 줄 안에 보이게 옆으로 밀어 줌(세로 스크롤은 건드리지 않음). 끝의 ‹ › 칸(26px)에 가리지 않게 34px 여유
  function show(k, now) {
    if (row.scrollWidth <= row.clientWidth + 2) return;
    var on = k && bar.querySelector('[data-jump="' + k + '"]');
    if (!on) { if (row.scrollLeft > 0) row.scrollTo({ left: 0, behavior: now ? 'auto' : 'smooth' }); return; }   // 맨 위(아직 구역 전): 줄도 처음으로
    var x = on.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    var l = x - 34, r = x + on.offsetWidth + 34;
    var b = now ? 'auto' : 'smooth';
    if (l < row.scrollLeft) row.scrollTo({ left: Math.max(0, l), behavior: b });
    else if (r > row.scrollLeft + row.clientWidth) row.scrollTo({ left: r - row.clientWidth, behavior: b });
  }
  // 옆에 더 있으면 그쪽 끝에 ‹ › 표시
  function edges() {
    var more = row.scrollWidth > row.clientWidth + 2;
    bar.classList.toggle('more-l', more && row.scrollLeft > 4);
    bar.classList.toggle('more-r', more && row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
  }
  row.addEventListener('scroll', edges, { passive: true });
  addEventListener('resize', edges);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { edges(); show(cur, true); });
  edges();
  function spy() {
    raf = 0;
    var line = (parseFloat(getComputedStyle(bar).top) || 61) + bar.offsetHeight + 48, k = null;   // 줄이 붙었을 때의 밑선 기준(줄이 아직 제자리에 있어도 같은 기준)
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) k = secs.length ? secs[secs.length - 1].id : null;   // 맨 아래면 마지막 구역
    else secs.forEach(function (s) { if (s.getBoundingClientRect().top <= line) k = s.id; });
    if (Date.now() < lock) return;   // 탭을 누른 뒤 내려가는 동안은 누른 탭 그대로(지나가는 구역이 깜빡이지 않게)
    mark(k);
  }
  addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(spy); }, { passive: true });
  addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(spy); });
  // 누르면 링크 그대로 부드럽게 내려가고(CSS), 다 내려간 뒤 그 구역이 이 줄 바로 밑에 있는지 한 번 더 맞춤(위로 올라갈 때 몇 px 어긋나던 것)
  function settle(k) {
    var el = document.getElementById(k); if (!el) return;
    var fix = function () {
      var m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0, d = el.getBoundingClientRect().top - m;
      if (Math.abs(d) > 3 && innerHeight + scrollY < document.documentElement.scrollHeight - 4) window.scrollTo({ top: scrollY + d, behavior: 'auto' });
    };
    if ('onscrollend' in window) window.addEventListener('scrollend', fix, { once: true });
    setTimeout(fix, 1300);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-jump]'); if (!a) return;
    var k = a.getAttribute('data-jump'); settle(k);
    if (bar.contains(a)) { mark(k); lock = Date.now() + 900; setTimeout(function () { if (!raf) raf = requestAnimationFrame(spy); }, 950); }
  });
  spy();
})();

/* 달나라 게임즈 홈페이지 — 공용 기능 (2026-11-19 새 디자인)
 * 움직임은 기기 '동작 줄이기' 설정과 상관없이 모두 켬(대표님 결정). 스크롤 이벤트 대신 IntersectionObserver·CSS 스크롤 애니메이션.
 * 기능: 불러오기(첫 방문 한 번) · 소리 단추 · 서울 시각 인사와 오늘 달 · 게임 고르기 · 기록 줄 · 소식 4개 언어 · 유튜브 · 언어 고르기 · 메일 복사 · 영상 · 나타나기 · 쪽 넘김
 * 언어마다 다른 글(달 이름·인사·복사 안내)은 쪽 <head>의 window.DN_T(tools/site/build.py가 넣음)에서 읽음
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var TX = window.DN_T || {};
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function onView(el, cb, opt) {
    if (!el) return null;
    if (!hasIO) { cb(true, null, null); return null; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e, io); }); }, opt || {});
    io.observe(el);
    return io;
  }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  var DN = window.DN = window.DN || {};
  DN.$ = $; DN.$$ = $$; DN.onView = onView; DN.store = store; DN.emit = emit;
  DN.key = root.getAttribute('data-design') || 'dn';

  /* ── 소리: 기본 꺼짐. 켜면 이 브라우저에만 기억 ── */
  var ac = null, sndOn = false;
  function ctx() {
    if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  DN.tone = function (f, dur, type, vol, f2, delay) {
    var c = ctx(); if (!c) return;
    var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  };
  DN.noise = function (dur, freq, q, vol, type, delay, f2) {
    var c = ctx(); if (!c) return;
    var t = c.currentTime + (delay || 0), n = Math.max(1, Math.round(c.sampleRate * dur)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; fl.type = type || 'bandpass'; fl.frequency.setValueAtTime(freq || 1200, t); fl.Q.value = q || 1;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.value = vol || 0.2; s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t);
  };
  DN.sounds = DN.sounds || {};
  DN.sfx = function (name) { if (!sndOn) return; var f = DN.sounds[name] || DN.sounds.tap; if (f) try { f(); } catch (e) {} };
  DN.soundOn = function () { return sndOn; };
  function setSound(on, quiet) {
    sndOn = on; store.set('dn-sound', on ? '1' : '0');
    $$('[data-sound]').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var l = $('.snd-l', b); if (l) l.textContent = b.getAttribute(on ? 'data-on' : 'data-off');
    });
    root.classList.toggle('snd', on);
    if (on && !quiet) { ctx(); DN.sfx('on'); }
  }
  // 저장된 '켬'은 첫 손짓 뒤에만 소리가 나므로 단추 표시만 켬 상태로 맞춰 둠
  setSound(store.get('dn-sound') === '1', true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sound]');
    if (b) { setSound(!sndOn); return; }
    var x = e.target.closest && e.target.closest('[data-sfx], a[href], button, summary');
    if (x && sndOn) DN.sfx(x.getAttribute('data-sfx') || 'tap');
  });

  /* ── 불러오기(첫 방문 한 번, 1초 안) ── */
  var ld = $('#loader');
  if (ld) {
    var seenKey = 'dn-seen-' + DN.key;
    if (root.classList.contains('seen')) ld.remove();
    else {
      store.set(seenKey, '1');
      var finish = function () { if (!ld.isConnected) return; ld.classList.add('done'); setTimeout(function () { ld.remove(); emit('dn:loaded'); }, 220); };
      setTimeout(finish, +ld.getAttribute('data-ms') || 1000);
      ld.addEventListener('click', finish);
    }
  }

  /* ── 서울 시각 인사와 오늘 달 ── */
  var SYN = 29.530588853, REF = Date.UTC(2000, 0, 6, 18, 14);
  DN.moon = function (d) {
    var age = (((d - REF) / 864e5) % SYN + SYN) % SYN, k = (1 - Math.cos(2 * Math.PI * age / SYN)) / 2;
    var M = TX.moon || ['삭', '초승달', '상현달', '차오르는 달', '보름달', '기우는 달', '하현달', '그믐달'];
    var names = [[1.5, M[0]], [6.4, M[1]], [8.9, M[2]], [13.8, M[3]], [15.8, M[4]], [20.6, M[5]], [23.1, M[6]], [28.0, M[7]], [99, M[0]]];
    var name = names.filter(function (n) { return age < n[0]; })[0][1];
    return { age: age, k: k, waxing: age < SYN / 2, name: name };
  };
  DN.moonPath = function (r, k, waxing) {   // 밝은 쪽 모양(가운데 0,0). 북반구에서 차는 달은 오른쪽이 밝음
    var x = Math.abs(r * (1 - 2 * k)).toFixed(2);
    var ls = waxing ? 1 : 0, ts = waxing ? (k < 0.5 ? 0 : 1) : (k < 0.5 ? 1 : 0);
    if (k < 0.02) return '';
    if (k > 0.98) return 'M0 ' + (-r) + 'A' + r + ' ' + r + ' 0 1 1 0 ' + r + 'A' + r + ' ' + r + ' 0 1 1 0 ' + (-r) + 'Z';
    return 'M0 ' + (-r) + 'A' + r + ' ' + r + ' 0 0 ' + ls + ' 0 ' + r + 'A' + x + ' ' + r + ' 0 0 ' + ts + ' 0 ' + (-r) + 'Z';
  };
  DN.seoul = function (d) {
    var p = {};
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit' })
        .formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    } catch (e) { var u = new Date(d.getTime() + 9 * 36e5); p.hour = String(u.getUTCHours()); p.minute = String(u.getUTCMinutes()); }
    var h = (+p.hour) % 24, m = +p.minute;
    var part = h < 5 ? 'dawn' : h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night';
    return { h: h, m: m, hm: (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m, part: part, night: h < 6 || h >= 18 };
  };
  var GREET = TX.greet || { dawn: '새벽까지 깨어 계시네요', morning: '좋은 아침이에요', day: '좋은 오후예요', evening: '저녁 시간이에요', night: '밤 올빼미님 안녕하세요' };
  function tickClock() {
    var now = new Date(), s = DN.seoul(now), mo = DN.moon(now);
    root.setAttribute('data-sky', s.night ? 'night' : 'day');
    root.setAttribute('data-part', s.part);
    $$('[data-clock]').forEach(function (el) { el.textContent = s.hm; });
    $$('[data-greet]').forEach(function (el) { el.textContent = GREET[s.part]; });
    $$('[data-moon-name]').forEach(function (el) { el.textContent = mo.name; });
    $$('svg[data-moon]').forEach(function (svg) {
      var r = +svg.getAttribute('data-moon') || 40, lit = $('.lit', svg);
      if (lit) lit.setAttribute('d', DN.moonPath(r, mo.k, mo.waxing));
    });
    emit('dn:clock', { seoul: s, moon: mo });
  }
  tickClock(); setInterval(tickClock, 30000);

  /* ── 나타나기: 아래에 있던 .rv만 잠깐 숨겼다가 들어오면(또는 지나치면) 보임 ── */
  var waiting = [];
  function sweep() {
    var h = innerHeight;
    waiting = waiting.filter(function (el) {
      if (el.getBoundingClientRect().top < h * 0.94) { el.classList.remove('wait'); el.classList.add('seen'); return false; }
      return true;
    });
  }
  if (hasIO) {
    $$('.rv').forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight * 0.94) { el.classList.add('wait'); waiting.push(el); } });
    var rio = new IntersectionObserver(function (es) {
      var hit = es.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      hit.forEach(function (e, i) { e.target.style.setProperty('--d', String(Math.min(i, 6))); });
      sweep();
    }, { rootMargin: '0px 0px -6% 0px' });
    waiting.forEach(function (el) { rio.observe(el); });
    $$('section, footer').forEach(function (s) { rio.observe(s); });
  }

  /* ── 영상: 화면에 보이고, 고른 칸일 때만 재생 ── */
  var loaded = document.readyState === 'complete';
  window.addEventListener('load', function () { loaded = true; setTimeout(function () { refreshVideos(document); }, 300); });
  function poster(v) { var ps = v.getAttribute('data-poster'); if (ps && !v.getAttribute('poster')) v.setAttribute('poster', ps); }
  function playV(v) {   // 영상은 첫 화면이 다 뜬 뒤에만 받기 시작
    poster(v); if (!loaded) return;
    if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  DN.playV = playV;
  var vidIO = hasIO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && !v.closest('[hidden]') && !v.closest('.off')) playV(v); else v.pause();
    });
  }, { threshold: 0.25 }) : null;
  $$('video').forEach(function (v) { v.muted = true; v.setAttribute('muted', ''); if (vidIO) vidIO.observe(v); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) $$('video').forEach(function (v) { v.pause(); }); });
  function refreshVideos(scope) {
    $$('video', scope).forEach(function (v) {
      var vis = !v.closest('[hidden]') && !v.closest('.off');
      var r = v.getBoundingClientRect(), seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (vis) poster(v);
      if (vis && r.width && seen > r.height * 0.25) playV(v); else v.pause();
    });
  }
  DN.refreshVideos = refreshVideos;

  /* ── 게임 고르기: 카드 누르기 · ← → 단추 · 키보드 · 옆으로 밀기 ── */
  $$('[data-picker]').forEach(function (pk) {
    var cards = $$('.pk-card', pk), panels = $$('.pk-panel', pk), stage = $('.pk-stage', pk);
    var count = $('[data-pk-count]', pk), cur = -1, n = panels.length;
    function show(i, how) {
      i = (i + n) % n; if (i === cur) return;
      var prev = cur; cur = i;
      cards.forEach(function (c, j) { c.setAttribute('aria-selected', j === i ? 'true' : 'false'); c.tabIndex = j === i ? 0 : -1; c.classList.toggle('on', j === i); });
      panels.forEach(function (p, j) {
        var on = j === i; p.hidden = !on; p.classList.toggle('on', on);
        if (on) { p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); p.setAttribute('data-dir', how || (prev < 0 ? 'none' : (i > prev ? 'next' : 'prev'))); }
      });
      if (count) count.textContent = String(i + 1);
      pk.setAttribute('data-cur', String(i));
      refreshVideos(pk);
      if (prev >= 0) DN.sfx('pick');
      emit('dn:pick', { picker: pk, i: i, prev: prev, how: how });
      var c = cards[i];
      if (c && prev >= 0) {   // 카드 줄이 옆으로 넘치면 고른 카드가 보이게(쪽 전체는 안 움직임)
        var row = c.parentNode, rr = row.getBoundingClientRect(), cr = c.getBoundingClientRect();
        if (row.scrollWidth > row.clientWidth + 2 && (cr.left < rr.left || cr.right > rr.right)) row.scrollBy({ left: (cr.left + cr.width / 2) - (rr.left + rr.width / 2), behavior: 'smooth' });
      }
    }
    DN.pick = DN.pick || {}; DN.pick[pk.id || 'games'] = function (i, how) { show(i, how); };
    function focusCard() {   // 카드에 초점을 옮겨도 쪽이 크게 뛰지 않게(필요할 때만 가까운 쪽으로 조금)
      var c = cards[cur]; try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); }
      var r = c.getBoundingClientRect(), j = document.querySelector('.jump'), hb = j ? j.getBoundingClientRect().bottom : 60;   // 위에 붙은 줄 밑까지
      if (r.bottom > innerHeight || r.top < hb) c.scrollIntoView({ block: 'nearest' });
    }
    cards.forEach(function (c, j) {
      c.addEventListener('click', function () { show(j, 'tap'); });
      c.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); show(cur + 1, 'next'); focusCard(); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); show(cur - 1, 'prev'); focusCard(); }
        else if (k === 'Home') { e.preventDefault(); show(0); focusCard(); }
        else if (k === 'End') { e.preventDefault(); show(n - 1); focusCard(); }
      });
    });
    $$('[data-pk-step]', pk).forEach(function (b) { b.addEventListener('click', function () { var d = +b.getAttribute('data-pk-step'); show(cur + d, d > 0 ? 'next' : 'prev'); }); });
    if (stage) {   // 옆으로 밀면 넘김(세로로 밀면 쪽이 내려감: touch-action pan-y)
      $$('a, img, video', stage).forEach(function (x) { x.setAttribute('draggable', 'false'); });
      var sx = 0, sy = 0, st = 0, on = false;
      stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button) return; on = true; sx = e.clientX; sy = e.clientY; st = Date.now(); });
      stage.addEventListener('pointerup', function (e) {
        if (!on) return; on = false;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - st < 900) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
      });
      stage.addEventListener('pointercancel', function () { on = false; });
      stage.addEventListener('keydown', function (e) {
        if (e.target !== stage) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, 'next'); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, 'prev'); }
      });
    }
    var start = +(pk.getAttribute('data-start') || 0);
    show(start, 'none');
    onView(pk, function (vis) { if (vis) refreshVideos(pk); else $$('video', pk).forEach(function (v) { v.pause(); }); }, { threshold: 0.15 });
  });

  /* ── 기록 줄: 세로로 내리면 옆으로 지나감(CSS 스크롤 애니메이션). 안 되는 브라우저는 손으로 옆으로 밀기 ── */
  var sdt = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --a'));
  root.classList.toggle('sdt', sdt);
  $$('[data-hscroll]').forEach(function (sec) {
    var track = $('.hs-track', sec), win = $('.hs-win', sec) || sec;
    if (!track) return;
    // 폰·가로로 눕힌 폰은 세로로 4화면 넘게 내려야 하고 그동안 아래가 비어서, 넓고(720 이상) 높은(500 초과) 화면에서만 '내리면 옆으로'
    var big = window.matchMedia ? matchMedia('(min-width: 720px) and (min-height: 501px)') : { matches: true };
    function measure() {
      var dx = Math.max(0, track.scrollWidth - win.clientWidth);
      sec.style.setProperty('--dx', dx + 'px');
      sec.classList.toggle('hs-on', sdt && dx > 8 && big.matches);
      sec.classList.toggle('hs-x', dx > 8);
    }
    measure();
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(win); else window.addEventListener('resize', measure);
    if (big.addEventListener) big.addEventListener('change', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    // 손가락으로 미는 줄이면 처음 화면에 들어올 때 한 번 살짝 밀었다 돌아와서 옆에 더 있다는 걸 보여 줌
    onView(win, function (on, e, io) {
      if (!on || sec.classList.contains('hs-on') || !sec.classList.contains('hs-x') || win.scrollLeft > 0) return;
      io && io.disconnect();
      setTimeout(function () {   // 칸 맞춤(snap)이 끌어당기지 않게 잠깐 끔
        win.style.scrollSnapType = 'none'; win.scrollTo({ left: 72, behavior: 'smooth' });
        setTimeout(function () { if (win.scrollLeft <= 80) win.scrollTo({ left: 0, behavior: 'smooth' }); setTimeout(function () { win.style.scrollSnapType = ''; }, 500); }, 650);
      }, 300);
    }, { threshold: 0.6 });
  });

  /* ── 안내 창(지금은 쓰는 곳 없음, data-soon 단추를 달면 같은 창 안에서 알려 줌) ── */
  var note = $('#note'), lastFocus = null;
  DN.note = function (msg, title) {
    if (!note) return;
    lastFocus = document.activeElement;
    $('.note-m', note).textContent = msg;
    if (title) $('.note-t', note).textContent = title;
    note.hidden = false; note.classList.remove('in'); void note.offsetWidth; note.classList.add('in');
    root.classList.add('noting');
    var x = $('.note-x', note); if (x) x.focus();
    DN.sfx('note');
  };
  function closeNote() {
    if (!note || note.hidden) return;
    note.hidden = true; root.classList.remove('noting');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (note) {
    note.addEventListener('click', function (e) { if (e.target === note || e.target.closest('.note-x')) closeNote(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNote(); });
  }
  document.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('[data-soon]');
    if (s) { e.preventDefault(); DN.note(s.getAttribute('data-soon'), s.getAttribute('data-soon-t') || null); }
  });

  /* ── 언어 고르기 ── */
  $$('.lang').forEach(function (lg) {
    var b = $('.lang-b', lg), m = $('.lang-m', lg);
    if (!b || !m) return;
    function set(open) { m.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); lg.classList.toggle('open', open); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(m.hidden); });
    document.addEventListener('click', function (e) { if (!m.hidden && !lg.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) { set(false); b.focus(); } });
    $$('[aria-current]', m).forEach(function (x) { x.addEventListener('click', function () { set(false); }); });
  });

  /* ── 메일 주소 복사 (미리보기 틀에선 메일 앱 링크가 안 될 수 있어서 주소를 보여 주고 복사) ── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var txt = b.getAttribute('data-copy'), msg = $('.copy-msg', b.parentNode) || null;
    function done(ok) {
      if (msg) { msg.textContent = ok ? (TX.copied || '복사했어요') : (TX.picked || '주소를 골라 두었어요. 길게 눌러 복사해 주세요'); msg.classList.remove('show'); void msg.offsetWidth; msg.classList.add('show'); }
      if (!ok) { var src = $('[data-copy-src]', b.parentNode) || $('[data-copy-src]', b.closest('section, footer, .note-box') || document); if (src) { var r = document.createRange(); r.selectNodeContents(src); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } }
    }
    // 미리보기 틀처럼 클립보드가 막힌 곳이면 쓰기를 시도하지 않고(브라우저 오류가 남음) 주소를 골라 복사 명령으로
    var fp = document.featurePolicy || document.permissionsPolicy;
    var blocked = !navigator.clipboard || (fp && fp.allowsFeature && !fp.allowsFeature('clipboard-write'));
    var legacy = function () {
      var src = $('[data-copy-src]', b.parentNode) || $('[data-copy-src]', b.closest('section, footer, .note-box') || document), okc = false;
      if (src) { var r = document.createRange(); r.selectNodeContents(src); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { okc = document.execCommand('copy'); } catch (er) {} }
      done(okc);
    };
    if (blocked) { legacy(); return; }
    try { navigator.clipboard.writeText(txt).then(function () { done(true); }, legacy); } catch (er) { legacy(); }
  });

  /* ── 소식: 언어 바꾸기 + 옆으로 넘기기 단추 ── */
  $$('.news').forEach(function (news) {
    var lists = $$('.news-l', news), btns = $$('.nlang button', news);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var lg = b.getAttribute('data-lang');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        lists.forEach(function (l) {
          var on = l.getAttribute('data-lang') === lg; l.hidden = !on;
          if (on) { l.scrollLeft = 0; l.classList.remove('play'); void l.offsetWidth; l.classList.add('play'); }
        });
        emit('dn:newslang', { lang: lg });
      });
    });
    $$('.narr button', news).forEach(function (b) {
      b.addEventListener('click', function () {
        var l = lists.filter(function (x) { return !x.hidden; })[0]; if (!l) return;
        l.scrollBy({ left: (+b.getAttribute('data-dir')) * Math.min(l.clientWidth * 0.85, 660), behavior: 'smooth' });
      });
    });
    onView(news, function (on, e, io) { if (on) { lists.forEach(function (l) { if (!l.hidden) l.classList.add('play'); }); io && io.disconnect(); } }, { threshold: 0.15 });
  });

  /* ── 유튜브: yt.js 목록이 있으면 썸네일 + 새 창 링크, 없으면 '첫 영상 준비 중' 칸 그대로 ── */
  var ybox = $('.yvids'), YL = window.DN_YT || [];
  if (ybox && YL.length) {
    var made = 0;
    YL.forEach(function (x) {
      var o = typeof x === 'string' ? { id: x } : x;
      if (!/^[\w-]{11}$/.test(o.id || '')) return;
      if (!made) ybox.innerHTML = '';
      made++;
      var a = document.createElement('a');
      a.className = 'yitem' + (o.short ? ' short' : '');
      a.href = (o.short ? 'https://www.youtube.com/shorts/' : 'https://www.youtube.com/watch?v=') + o.id;
      a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = '<img src="https://i.ytimg.com/vi/' + o.id + '/hqdefault.jpg" alt="" loading="lazy"><span class="yplay" aria-hidden="true"></span><span class="yt-t"></span><span class="vh"> (' + (TX.nw || '새 창') + ')</span>';
      $('.yt-t', a).textContent = o.title || '';
      $('img', a).addEventListener('error', function () { this.remove(); });
      ybox.appendChild(a);
    });
  }

  /* ── 물수제비 놀이는 첫 화면이 다 뜬 뒤에 불러옴 ── */
  $$('.pond').forEach(function (pond) {
    var go = function () {
      if (window.DNPond) return window.DNPond(pond);
      var s = document.createElement('script'); s.src = pond.getAttribute('data-src') || 'pond.js'; s.async = true;
      s.onload = function () { window.DNPond && window.DNPond(pond); };
      document.head.appendChild(s);
    };
    var later = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(go, { timeout: 900 }); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  });

  /* ── 쪽 넘김: 누른 자리를 기억해 새 쪽에서 그 자리부터 넘어가게(View Transitions) ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.origin !== location.origin || a.hasAttribute('data-soon')) return;
    try { sessionStorage.setItem('dn-vt', JSON.stringify([Math.round(e.clientX / innerWidth * 100), Math.round(e.clientY / innerHeight * 100)])); } catch (er) {}
  });

  /* ── 펼치는 질문: 열 때 소리 ── */
  $$('details.qa').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) emit('dn:qa', { el: d }); }); });

  /* ── 흐르는 것들은 화면 밖이면 멈춤(배터리) ── */
  $$('[data-pause-off]').forEach(function (el) { onView(el, function (on) { el.classList.toggle('paused', !on); }); });
})();
