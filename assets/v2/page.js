/* 첫 화면 작은 단추 — 밝게·어둡게(다른 쪽과 같은 기억 'dn-mode') · 메일 주소 복사
 * 움직이는 그림(main.js)이 못 떠도 이 둘은 따로 움직임 */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ── 밝게·어둡게: 처음엔 늘 밝게, 고른 것은 이 브라우저에만 기억 ── */
  var btns = [].slice.call(document.querySelectorAll('[data-mode-toggle]'));
  function cur() { return root.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'; }
  function paint(m) {
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', m === 'dark' ? 'true' : 'false');
      var l = b.querySelector('.mode-t'); if (l) l.textContent = b.getAttribute('data-' + m);
      b.setAttribute('aria-label', b.getAttribute('data-aria') + ': ' + b.getAttribute('data-' + m));
    });
  }
  function set(m) {
    root.setAttribute('data-mode', m);
    try { localStorage.setItem('dn-mode', m); } catch (e) {}
    paint(m);
  }
  paint(cur());
  btns.forEach(function (b) { b.addEventListener('click', function () { set(cur() === 'dark' ? 'light' : 'dark'); }); });

  /* ── 머리 줄: 글자를 아주 크게 키운 좁은 화면에서 단추가 화면 밖으로 나가면 '게임' 단추를 숨기고 여백을 줄임(그래도 넘치면 로고도) ── */
  var bar = document.getElementById('bar'), raf = 0;
  function over() { return bar.scrollWidth > bar.clientWidth + 1; }
  function fit() {
    raf = 0;
    bar.classList.remove('tight', 'tighter');
    if (over()) { bar.classList.add('tight'); if (over()) bar.classList.add('tighter'); }
  }
  function later() { if (!raf) raf = requestAnimationFrame(fit); }
  if (bar) {
    fit();
    addEventListener('resize', later);
    if (window.ResizeObserver) new ResizeObserver(later).observe(bar.querySelector('.bar-r'));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  }

  /* ── 메일 주소 복사: 클립보드가 막힌 곳(미리보기 틀 등)에선 주소를 골라 두고 복사 명령으로 ── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var txt = b.getAttribute('data-copy'), msg = b.parentNode.querySelector('.copy-msg');
    var src = b.parentNode.querySelector('[data-copy-src]');
    function pick() {
      if (!src) return;
      var r = document.createRange(); r.selectNodeContents(src);
      var s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    function done(ok) {
      if (!ok) pick();
      if (msg) { msg.textContent = ''; msg.textContent = b.getAttribute(ok ? 'data-ok' : 'data-pick'); }
    }
    function legacy() {
      var ok = false;
      pick();
      try { ok = document.execCommand('copy'); } catch (er) {}
      done(ok);
    }
    var fp = document.featurePolicy || document.permissionsPolicy;
    var blocked = !navigator.clipboard || (fp && fp.allowsFeature && !fp.allowsFeature('clipboard-write'));
    if (blocked) { legacy(); return; }
    try { navigator.clipboard.writeText(txt).then(function () { done(true); }, legacy); } catch (er) { legacy(); }
  });
})();
