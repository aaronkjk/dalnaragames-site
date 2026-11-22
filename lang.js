/* 언어 고르기 (2026-11-17)
 * - 쪽마다 <head>의 <link rel="alternate" hreflang="..."> 에 그 쪽의 언어별 주소가 있어요. 이 파일은 그걸 읽어서 옮겨 가요.
 * - 처음 들어온 사람: 한국어 쪽(맨 위 폴더)으로 바깥에서 들어오면, 전에 고른 언어 → 브라우저 언어 순서로 보고 그 언어 쪽으로 보내요.
 *   /en/ 처럼 언어가 정해진 주소로 들어오면 그대로 둬요(링크를 준 사람이 고른 언어라서).
 * - 위쪽 언어 고르기에서 누르면 그 언어를 기억해요(localStorage). 저장이 막힌 브라우저에서는 자동으로 옮기지 않아요.
 * - 문의 쪽(contact.html)은 주소의 ?lang=ko|ja|zh-TW|en 을 가장 먼저 따라요(게임 설정의 '문의' 링크).
 * - 검색 로봇·미리보기 로봇은 옮기지 않아요(한국어 쪽이 검색에 그대로 잡히게).
 */
(function () {
  var KEY = 'dalnara-lang';
  var LANGS = ['ko', 'ja', 'zh-TW', 'en'];
  var html = document.documentElement;
  var cur = html.getAttribute('lang') || 'ko';

  function norm(v) {
    v = String(v || '').toLowerCase().replace('_', '-');
    if (!v) return null;
    if (v.indexOf('ko') === 0) return 'ko';
    if (v.indexOf('ja') === 0) return 'ja';
    if (v.indexOf('zh') === 0) return 'zh-TW';
    if (v.indexOf('en') === 0) return 'en';
    return null;
  }
  function load() { try { return localStorage.getItem(KEY); } catch (e) { return undefined; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function pathOf(lang) {
    var el = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]');
    if (!el) return null;
    try { return new URL(el.getAttribute('href'), location.href).pathname; } catch (e) { return null; }
  }
  function go(lang) {
    var p = pathOf(lang);
    if (!p || p === location.pathname) return false;
    location.replace(p + location.search + location.hash);
    return true;
  }
  function browserLang() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) { var n = norm(list[i]); if (n) return n; }
    return 'en';
  }

  function autoGo() {
    var q = new URLSearchParams(location.search);
    // 1) 문의 쪽: 게임이 넘겨준 언어를 따름
    if (html.hasAttribute('data-follow-lang') && q.get('lang')) {
      var want = norm(q.get('lang'));
      if (want) { if (want !== cur) go(want); return; }
    }
    // 2) 한국어 쪽에 바깥에서 처음 들어온 경우만
    if (cur !== 'ko') return;
    if (/bot|crawl|spider|slurp|preview|lighthouse|headless|yeti|daum|kakaotalk-scrap|facebookexternalhit|embedly/i.test(navigator.userAgent || '')) return;
    var ref = document.referrer || '';
    if (ref) { try { if (new URL(ref).host === location.host) return; } catch (e) {} }
    var saved = load();
    if (saved === undefined) return;            // 저장이 막혀 있으면 자동으로 옮기지 않음
    var target = norm(saved) || browserLang();
    if (target !== 'ko') go(target);
  }
  try { autoGo(); } catch (e) {}

  // 언어 고르기를 누르면 기억하고, 주소 뒤의 ?game=…·#… 를 그대로 가지고 감
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[data-setlang]') : null;
    if (a) {
      var l = a.getAttribute('data-setlang');
      if (LANGS.indexOf(l) >= 0) save(l);
      if (location.search || location.hash) {
        var q2 = new URLSearchParams(location.search);
        if (q2.has('lang')) q2.set('lang', l);
        var s = q2.toString();
        a.setAttribute('href', a.getAttribute('href').split(/[?#]/)[0] + (s ? '?' + s : '') + location.hash);
      }
      return;
    }
    var open = document.querySelectorAll('details.lang[open]');
    for (var i = 0; i < open.length; i++) if (!open[i].contains(ev.target)) open[i].removeAttribute('open');
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    var open = document.querySelectorAll('details.lang[open]');
    for (var i = 0; i < open.length; i++) { open[i].removeAttribute('open'); var s = open[i].querySelector('summary'); if (s) s.focus(); }
  });
})();
