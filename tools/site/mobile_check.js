// 홈페이지 폰 점검 (2026-11-21 대표님 "사이트 모바일에도 최적화되게") — 쪽 36개 × 폰 4가지(iPhone 13 · Pixel 7 · 320×568 · iPhone 13 가로)
//   node tools/site/mobile_check.js            (THEME=dark 를 붙이면 '어둡게'를 고른 상태로, ONLY=/ja/,/en/house/ 로 몇 쪽만)
//   쪽마다: 가로 넘침 · 44px보다 작은 누르는 칸(글 속 링크 제외) · 누르는 칸 사이 8px 미만 · 12px 미만 글자 · 15px 미만 본문(긴 글)
//           숫자 칸 글자가 테두리에 닿음 · 마지막 줄에 글자 하나만 남음(일본어·중국어) · 이름·짧은 제목(12자 이하)이 글자 중간에서 꺾임, 한국어·영어 제목이 낱말 중간에서 꺾임(일본어·중국어는 content.py BR 표에 낱말 경계를 더하면 고쳐짐) · 위에 붙는 영역(머리 줄+바로 가기 줄)이 화면의 20% 넘음 · 콘솔 오류
//   iPhone 13에서 더: 모든 글자 2배(크게 보기 흉내) → 가로 넘침·잘린 글·화면 밖 글 0 · html 글자 크기 2배에 본문이 따라 커지는지(rem)
//   그 밖에: 머리 줄 폭 320~1280(10px마다) 로고 글자·단추 겹침, 언어마다 로고 글자 보임이 같은지 · 바로 가기 줄 ›표시와 지금 구역 보이기 · 메뉴 아래 안전 영역 · 기록 줄(폰은 손가락으로 미는 줄)
// 필요: playwright (이 저장소엔 node_modules 없음 → NODE_PATH=/opt/node-tools/node_modules 처럼 있는 곳을 알려 줌)
const { chromium, devices } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const THEME = process.env.THEME || '';
const PORT = 8810 + (THEME === 'dark' ? 1 : 0);
const OUT = process.env.OUT || path.join(os.tmpdir(), 'sitemobile', THEME || 'light'); fs.mkdirSync(OUT, { recursive: true });
const JOBS = +(process.env.JOBS || 6);
const LANGS = ['ko', 'ja', 'zh-TW', 'en'], PRE = { ko: '', ja: 'ja/', 'zh-TW': 'zh-TW/', en: 'en/' };
const KEYS = ['index', 'hanmari', 'tongtong', 'delivery', 'house', 'contact', 'privacy', 'terms', '404'];
const GAMEK = ['hanmari', 'tongtong', 'delivery', 'house'];
const urlOf = (L, k) => '/' + PRE[L] + (k === 'index' ? '' : GAMEK.includes(k) ? k + '/' : k + '.html');
let PAGES = []; for (const L of LANGS) for (const k of KEYS) PAGES.push({ L, k, u: urlOf(L, k) });
if (process.env.ONLY) PAGES = PAGES.filter(p => process.env.ONLY.split(',').some(x => p.u === x || (p.L + ':' + p.k) === x));
const DEVS = {
  'iPhone 13': devices['iPhone 13'],
  'Pixel 7': devices['Pixel 7'],
  '320×568': { viewport: { width: 320, height: 568 }, screen: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent },
  'iPhone 13 가로': devices['iPhone 13 landscape'],
};
const problems = [], notes = [];
const bad = (k, v) => { problems.push(k + ': ' + v); console.log('  ✗ ' + k + ': ' + v); };
const ok = k => console.log('  ✓ ' + k);

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
function serve() {   // GitHub Pages 흉내(check.js와 같음)
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      let f = path.join(ROOT, u);
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!u.endsWith('/')) { rsp.writeHead(301, { Location: u + '/' }); rsp.end(); return; } f = path.join(f, 'index.html'); }
      if (!fs.existsSync(f) || u.includes('/tools/')) { rsp.writeHead(404, { 'Content-Type': TYPES['.html'] }); fs.createReadStream(path.join(ROOT, '404.html')).pipe(rsp); return; }
      const st = fs.statSync(f), ty = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
      if (range) { const m = /bytes=(\d*)-(\d*)/.exec(range); const a = +m[1] || 0, b = m[2] ? +m[2] : st.size - 1; rsp.writeHead(206, { 'Content-Type': ty, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); fs.createReadStream(f, { start: a, end: b }).pipe(rsp); return; }
      rsp.writeHead(200, { 'Content-Type': ty, 'Content-Length': st.size }); fs.createReadStream(f).pipe(rsp);
    }).listen(PORT, '127.0.0.1', () => res(s));
  });
}
const BASE = `http://127.0.0.1:${PORT}`;
async function newCtx(browser, dev) {
  const ctx = await browser.newContext({ ...dev, locale: 'ko-KR' });
  await ctx.route('**/*', r => { let h = ''; try { h = new URL(r.request().url()).hostname; } catch (e) {} if (h && h !== '127.0.0.1') return r.fulfill({ status: 200, contentType: 'text/plain', body: '' }); return r.continue(); });
  await ctx.addInitScript(th => { try { localStorage.setItem('dn-seen-site', '1'); if (th) localStorage.setItem('dn-mode', th); localStorage.setItem('dalnara-lang', (document.documentElement && document.documentElement.lang) || 'ko'); } catch (e) {} }, THEME);
  return ctx;
}
async function openPage(ctx, u) {
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errs.push('콘솔: ' + m.text().slice(0, 140)); });
  page.on('pageerror', e => errs.push('스크립트: ' + String(e).slice(0, 140)));
  page.on('requestfailed', r => { const x = r.url(), t = r.failure() && r.failure().errorText; if (!(/\.mp4/.test(x) && /ERR_ABORTED/.test(t)) && /127\.0\.0\.1/.test(x)) errs.push('못 받음: ' + x.slice(0, 120) + ' ' + t); });
  await page.goto(BASE + u, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  // 나타나기(.rv)가 다 보이게 끝까지 한 번 내렸다가 맨 위로
  await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 450) { scrollTo(0, y); await new Promise(r => setTimeout(r, 25)); } scrollTo(0, 1e6); await new Promise(r => setTimeout(r, 150)); scrollTo(0, 0); await new Promise(r => setTimeout(r, 700)); });
  return { page, errs };
}
async function pool(items, n, fn) { const q = items.slice(); await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); }

// 쪽 안에서 재는 것(문자열로 넘김)
const LIB = `
var vis = el => { if (el.closest('[hidden],.vh,.skip,.loader')) return false; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
var desc = el => { const t = (el.textContent || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 16); return el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/)[0] : '') + '«' + t + '»'; };
var ownText = el => [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
// 스크롤되는 칸 안에서 밖으로 밀려난 부분은 잘라서 봄(보이는 부분만 누를 수 있음)
var clipRect = el => { let r = el.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const q = a.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom); } } return { left: L, top: T, right: R, bottom: B, w: R - L, h: B - T }; };
var inText = a => { if (a.tagName !== 'A') return false; const p = a.parentElement; if (!p) return false; if (a.closest('.jump,.top,.gmenu,.lang-m,nav')) return false; const sib = [...p.childNodes].some(n => n !== a && n.nodeType === 3 && n.textContent.trim().length > 1); return sib || (/^(P|LI|TD|DD)$/.test(p.tagName) && getComputedStyle(a).display === 'inline'); };
var TARGETS = 'a[href], button, summary, [role=button], input, select, textarea';
function targets(scope) {
  const small = [], close = [], rs = [];
  for (const el of (scope || document).querySelectorAll(TARGETS)) {
    if (!vis(el) || inText(el)) continue;
    const r = el.getBoundingClientRect(), c = clipRect(el);
    if (c.w < 1 || c.h < 1) continue;   // 스크롤 칸 밖으로 완전히 밀려난 것
    if (r.width < 43.5 || r.height < 43.5) small.push(desc(el) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
    rs.push([el, c]);
  }
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const [a, p] = rs[i], [b, q] = rs[j]; if (a.contains(b) || b.contains(a)) continue;
    const gx = Math.max(q.left - p.right, p.left - q.right), gy = Math.max(q.top - p.bottom, p.top - q.bottom);
    if (gx > 0 && gy > 0) continue;   // 대각선으로 떨어짐
    const gap = Math.max(gx, gy);
    if (gap < 7.5) close.push(desc(a) + ' ↔ ' + desc(b) + ' ' + Math.round(gap) + 'px');
  }
  return { small, close };
}
function fonts(scope) {
  const tiny = new Set(), body = new Set();
  for (const el of (scope || document.body).querySelectorAll('*')) {
    if (el.closest('svg')) continue;
    const own = ownText(el); if (!own || !vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11.95) tiny.add(desc(el) + ' ' + fs + 'px');
    // 긴 글(영어는 40자, 그 밖은 25자 넘게)은 15px 이상
    if (/^(P|LI|DD|FIGCAPTION)$/.test(el.tagName) && own.length > (/^[\x00-\x7f]*$/.test(own) ? 40 : 25) && fs < 14.95) body.add(desc(el) + ' ' + fs + 'px');
  }
  return { tiny: [...tiny], body: [...body] };
}
// 이름·제목이 글자 중간에서 꺾였는지(같은 글 조각 안에서 줄이 바뀜. <wbr>·띄어쓰기·문장부호 자리는 괜찮음)
var HEADS = 'h1, h2, h3, .pk-name, .pk-card .nm, .gh-n, .ng, .ng-k, .pk-st, .pk-kind, .pt-l b, .sea-l b, .hw b, .gmenu li a, .jump a, .yt-e, .up-w, .marq span, .lt, .sk .sn, .f-h';
function breaks(scope) {
  const out = new Set(), CJK = /[\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff]/, WORD = /[A-Za-z0-9\\uac00-\\ud7a3]/;
  for (const h of (scope || document).querySelectorAll(HEADS)) {
    if (!vis(h) || h.closest('.marq')) continue;
    const short = h.textContent.replace(/\s+/g, '').length <= 12;   // 이름·짧은 제목. 긴 제목 문장은 일본어=말 덩어리(auto-phrase), 중국어=글자 사이가 표준 줄바꿈이라 한·영 낱말만 봄
    const fs = parseFloat(getComputedStyle(h).fontSize);
    const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      if (n.parentElement.closest('.vh,[hidden]')) continue;
      let prev = null;
      for (let i = 0; i < n.length; i++) {
        const ch = n.data[i]; if (/\\s/.test(ch)) { prev = null; continue; }
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const rr = r.getClientRects()[0]; if (!rr || !rr.width) continue;
        if (prev && rr.top > prev.top + fs * 0.5) {
          const a = prev.ch;
          const pun = /[·・、，。,\\-—–\\/／（(「『]/.test(a) || /[）)」』、。，！？!?ー〜…]/.test(ch);
          if (!pun && ((short && CJK.test(a) && CJK.test(ch)) || (WORD.test(a) && WORD.test(ch)) || (short && CJK.test(a) && WORD.test(ch)) || (short && WORD.test(a) && CJK.test(ch))))
            out.add(desc(h) + ' «' + n.data.slice(Math.max(0, i - 5), i) + '|' + n.data.slice(i, i + 5) + '»');
        }
        prev = { top: rr.top, ch };
      }
    }
  }
  return [...out];
}
// 마지막 줄 외톨이 글자(일본어·중국어 글이 마지막 줄에 글자 하나만, 문장부호 빼고)
function orphans(scope) {
  const out = new Set(), CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/, PUN = /[、。，！？!?」』）)・…\s]/;
  for (const el of (scope || document).querySelectorAll('p, li, figcaption, h1, h2, h3')) {
    if (!vis(el) || el.closest('.marq,.vh') || !ownText(el)) continue;   // 글이 직접 들어 있는 것만(숫자 칸처럼 이름·숫자·단위를 줄마다 둔 칸은 빼고)
    const ch = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (n.parentElement.closest('.vh,[hidden]')) continue; for (let i = 0; i < n.length; i++) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const rr = r.getClientRects()[0]; if (rr && rr.width) ch.push([n.data[i], rr.top]); } }
    if (ch.length < 6) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize), lastTop = ch[ch.length - 1][1];
    if (Math.abs(ch[0][1] - lastTop) < fs * 0.5) continue;   // 한 줄
    const last = ch.filter(c => Math.abs(c[1] - lastTop) < fs * 0.5).map(c => c[0]).join('');
    const core = last.replace(new RegExp(PUN.source, 'g'), '');
    if (core.length === 1 && CJK.test(core)) out.add(desc(el) + ' «…|' + last + '»');
  }
  return [...out];
}
function overflowX() { return document.documentElement.scrollWidth - document.documentElement.clientWidth; }
function stuck() {   // 위에 붙어 있는 영역의 아래 끝
  let bottom = 0; const parts = [];
  for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (!/sticky|fixed/.test(cs.position) || cs.display === 'none' || el.closest('[hidden]')) continue; const r = el.getBoundingClientRect(); if (!r.height || r.top > 130 || r.bottom <= 0 || r.height > innerHeight * 0.9) continue; bottom = Math.max(bottom, r.bottom); parts.push((el.className || el.tagName) + ' ' + Math.round(r.top) + '~' + Math.round(r.bottom)); }
  return { bottom: Math.round(bottom), pct: Math.round(bottom / innerHeight * 100), parts };
}
`;

async function measurePage(page, p) {
  return page.evaluate(async ([LIB, isIndex]) => {
    eval(LIB);   // eslint-disable-line no-eval
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const res = { over: 0 };
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y <= H; y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await wait(40); res.over = Math.max(res.over, overflowX()); }
    scrollTo(0, 0); await wait(250);
    const t = targets(), f = fonts(); res.small = t.small; res.close = t.close; res.tiny = f.tiny; res.body = f.body;
    res.breaks = breaks(); res.orph = orphans();
    // 숫자 칸(게임 고르기·게임 쪽): 칸 이름·숫자가 칸 테두리에 닿거나 넘치지 않는지
    res.boxes = [...document.querySelectorAll('.stats li, .pk-facts li')].filter(vis).flatMap(li => { const lr = li.getBoundingClientRect(); return [...li.querySelectorAll('.k, b')].filter(e => { const rg = document.createRange(); rg.selectNodeContents(e); const t = rg.getBoundingClientRect(); return t.width && (t.right > lr.right - 3 || t.left < lr.left + 3); }).map(e => desc(e)); });
    if (isIndex) {   // 게임 고르기: 일곱 게임 칸을 하나씩 열어 이름·글자·누르는 칸
      const pk = document.querySelector('[data-picker]'), cards = [...pk.querySelectorAll('.pk-card')];
      for (const c of cards) { c.click(); await wait(480); const pan = pk.querySelector('.pk-panel:not([hidden])'); breaks(pan).forEach(x => res.breaks.push(x)); fonts(pan).tiny.forEach(x => res.tiny.push(x)); targets(pan).small.forEach(x => res.small.push(x)); }
      cards[0].click(); await wait(200);
    }
    // 메뉴·언어 고르기를 열고도 봄
    document.querySelector('.menu-b').click(); await wait(450);
    const gm = document.getElementById('gm'); breaks(gm).forEach(x => res.breaks.push(x)); targets(gm).small.forEach(x => res.small.push(x)); fonts(gm).tiny.forEach(x => res.tiny.push(x));
    res.gmTip = getComputedStyle(gm.querySelector('.gm-tip')).display;
    gm.querySelector('.gm-x').click(); await wait(150); document.documentElement.style.overflow = '';
    const lb = document.querySelector('.lang-b'); lb.click(); await wait(120); const lm = document.querySelector('.lang-m'); targets(lm).small.forEach(x => res.small.push(x)); document.body.click(); await wait(80);
    // 위에 붙은 영역(쪽 중간쯤에서)
    scrollTo(0, Math.min(1600, (document.documentElement.scrollHeight - innerHeight) / 2)); await wait(350);
    res.stuck = stuck();
    // 기록 줄
    const lg = document.querySelector('.log');
    if (lg) { const r = lg.getBoundingClientRect(); res.log = { on: lg.classList.contains('hs-on'), x: lg.classList.contains('hs-x'), h: Math.round(r.height), tip: [...lg.querySelectorAll('.hs-tip')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.className) }; }
    // 바로 가기 줄: 넘치면 › 표시가 있는지, 구역마다 지금 구역 탭이 줄 안(›칸에 안 가림)에 보이는지
    const bar = document.querySelector('.jump');
    if (bar && getComputedStyle(bar).display !== 'none') {
      const row = bar.querySelector('.jump-in'), over = row.scrollWidth > row.clientWidth + 2;
      scrollTo(0, 0); await wait(100); row.scrollLeft = 0; await wait(80);
      res.jump = { over, moreR: bar.classList.contains('more-r'), hidden: [] };
      for (const a of bar.querySelectorAll('[data-jump]')) {
        const s = document.getElementById(a.dataset.jump); if (!s) continue;
        scrollTo(0, s.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(s).scrollMarginTop) + 2); await wait(800);
        const cur = bar.querySelector('[aria-current="true"]'); if (!cur) { res.jump.hidden.push(a.dataset.jump + ' 표시 없음'); continue; }
        const rr = row.getBoundingClientRect(), cr = cur.getBoundingClientRect();
        const lpad = bar.classList.contains('more-l') ? 26 : 0, rpad = bar.classList.contains('more-r') ? 26 : 0;
        if (cr.left < rr.left + lpad - 1 || cr.right > rr.right - rpad + 1) res.jump.hidden.push(cur.dataset.jump + ' ' + Math.round(cr.left) + '~' + Math.round(cr.right) + ' / 줄 ' + Math.round(rr.left + lpad) + '~' + Math.round(rr.right - rpad));
      }
      scrollTo(0, 0);
    }
    return res;
  }, [LIB, p.k === 'index']);
}

// 모든 글자 2배(크게 보기 흉내)와 html 글자 크기 2배(rem을 따르는지)
async function zoomTest(page) {
  return page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const pEl = [...document.querySelectorAll('main p:not(.vh)')].find(e => { const f = parseFloat(getComputedStyle(e).fontSize); return f >= 13 && f <= 20; }) || document.querySelector('main p'); const b0 = parseFloat(getComputedStyle(pEl).fontSize);
    document.documentElement.style.fontSize = '200%'; await wait(50); const b1 = parseFloat(getComputedStyle(pEl).fontSize); document.documentElement.style.fontSize = ''; await wait(50);
    const els = [...document.querySelectorAll('body *')].filter(e => !e.closest('svg'));
    const sz = els.map(e => { const cs = getComputedStyle(e); return [e, parseFloat(cs.fontSize), cs.lineHeight]; });
    for (const [e, fs, lh] of sz) { e.style.fontSize = (fs * 2) + 'px'; if (/px$/.test(lh)) e.style.lineHeight = (parseFloat(lh) * 2) + 'px'; }
    await wait(500);
    const W = document.documentElement.clientWidth, out = { rem: [b0, b1], over: 0, clip: [], off: [] };
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y <= H; y += 600) {
      scrollTo(0, y); await wait(30);
      out.over = Math.max(out.over, document.documentElement.scrollWidth - W);
    }
    scrollTo(0, 0); await wait(100);
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.vh,.skip,[hidden],svg,.loader,.marq,.gmenu,.lang-m,.f-big,[aria-hidden="true"]')) continue;   // 꾸밈 글자(화면 폭에 맞춰 그림)는 빼고   // .f-big: 맨 아래 큰 꾸밈 글자(화면 폭에 맞춰 그려서 글자 설정과 상관없음)
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el); const rr = el.getBoundingClientRect(); if (!rr.width) continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (/hidden|clip/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 3)) out.clip.push(el.tagName + '.' + el.className + '«' + el.textContent.trim().slice(0, 14) + '»');
      if (rr.right > W + 1 || rr.left < -1) {
        // 옆으로 미는 칸 안이면 괜찮음. 가리는 칸(overflow hidden)은 그 칸 밖으로 나갔을 때만 잘림
        let sc = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/auto|scroll/.test(o.overflowX)) { sc = 'scroll'; break; } if (/hidden|clip/.test(o.overflowX)) { const q = a.getBoundingClientRect(); if (rr.right > q.right + 1 || rr.left < q.left - 1) { sc = 'clip'; break; } } }
        if (sc === 'clip') out.clip.push(el.tagName + '.' + el.className + '«' + el.textContent.trim().slice(0, 14) + '» 칸 밖 ' + Math.round(rr.right));
        else if (!sc) out.off.push(el.tagName + '.' + el.className + '«' + el.textContent.trim().slice(0, 14) + '» ' + Math.round(rr.left) + '~' + Math.round(rr.right));
      }
    }
    out.clip = [...new Set(out.clip)].slice(0, 8); out.off = [...new Set(out.off)].slice(0, 8);
    return out;
  });
}

async function pages(browser) {
  for (const [dn, dev] of Object.entries(DEVS)) {
    console.log(`\n[${dn}] ${dev.viewport.width}×${dev.viewport.height} · 쪽 ${PAGES.length} (${THEME || 'light'})`);
    const lines = [];
    await pool(PAGES, JOBS, async p => {
      const ctx = await newCtx(browser, dev);
      const iss = [];
      try {
        const { page, errs } = await openPage(ctx, p.u);
        const m = await measurePage(page, p);
        if (m.over > 0) iss.push('가로 넘침 ' + m.over + 'px');
        if (m.small.length) iss.push('44px 미만 누르는 칸 ' + [...new Set(m.small)].slice(0, 8).join(' / '));
        if (m.close.length) iss.push('8px 안으로 붙은 칸 ' + [...new Set(m.close)].slice(0, 6).join(' / '));
        if (m.tiny.length) iss.push('12px 미만 글자 ' + [...new Set(m.tiny)].slice(0, 6).join(' / '));
        if (m.body.length) iss.push('15px 미만 본문 ' + [...new Set(m.body)].slice(0, 6).join(' / '));
        if (m.breaks.length) iss.push('이름·제목 꺾임 ' + [...new Set(m.breaks)].slice(0, 8).join(' / '));
        if (m.boxes.length) iss.push('숫자 칸 글자가 테두리에 닿음 ' + m.boxes.slice(0, 6).join(' / '));
        if (m.orph.length) iss.push('마지막 줄 외톨이 글자 ' + m.orph.slice(0, 6).join(' / '));
        if (m.stuck.pct > 20) iss.push(`위에 붙은 영역 ${m.stuck.pct}% (${m.stuck.parts.join(', ')})`);
        if (m.gmTip !== 'none') iss.push('터치 기기인데 메뉴에 키보드 안내가 보임');
        if (m.log) { if (m.log.on) iss.push('폰인데 기록 줄이 내리면 옆으로(세로로 김)'); if (m.log.x && !m.log.tip.some(c => /t-swipe/.test(c))) iss.push('기록 줄 밀기 안내 없음 ' + JSON.stringify(m.log)); if (m.log.h > 700) iss.push('기록 구역 높이 ' + m.log.h); }
        if (m.jump) { if (m.jump.over && !m.jump.moreR) iss.push('바로 가기 줄이 넘치는데 › 표시 없음'); if (m.jump.hidden.length) iss.push('지금 구역 탭이 안 보임 ' + m.jump.hidden.join(' / ')); }
        if (dn === 'iPhone 13') {
          const z = await zoomTest(page);
          if (!(z.rem[1] > z.rem[0] * 1.8)) iss.push('글자 크기 설정을 안 따름(rem) ' + z.rem.join('→'));
          if (z.over > 0) iss.push('글자 2배: 가로 넘침 ' + z.over);
          if (z.clip.length) iss.push('글자 2배: 잘림 ' + z.clip.join(', '));
          if (z.off.length) iss.push('글자 2배: 화면 밖 ' + z.off.join(', '));
        }
        if (errs.length) iss.push([...new Set(errs)].join(' | '));
        if (['index', 'hanmari', 'contact'].includes(p.k) || p.k === GAMEK[LANGS.indexOf(p.L)]) {
          await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
          await page.screenshot({ path: path.join(OUT, `${dn.replace(/\s|×/g, '_')}_${p.L}_${p.k}.png`) });
        }
      } catch (e) { iss.push('점검 실패 ' + String(e.message).split('\n')[0].slice(0, 160)); }
      lines.push([p.u, iss]);
      await ctx.close();
    });
    lines.sort((a, b) => a[0].localeCompare(b[0]));
    let n = 0; for (const [u, iss] of lines) { if (iss.length) bad(`${dn} ${u}`, iss.join(' · ')); else n++; }
    ok(`${dn}: ${n}/${lines.length}쪽 통과`);
  }
}

// 머리 줄: 폭 320~1280에서 로고 글자·단추 겹침 0, 언어마다 로고 글자 보임이 같은지
async function header(browser) {
  console.log('\n[머리 줄] 폭 320~1280(10px마다) × 네 언어');
  const shown = {};
  for (const L of LANGS) {
    const ctx = await newCtx(browser, { viewport: { width: 320, height: 800 }, isMobile: false });
    const { page } = await openPage(ctx, urlOf(L, 'hanmari'));
    for (let w = 320; w <= 1280; w += 10) {
      await page.setViewportSize({ width: w, height: 800 }); await page.waitForTimeout(40);
      const r = await page.evaluate(() => {
        const logo = document.querySelector('.logo'), lt = logo.querySelector('.lt'), tools = document.querySelector('.top .tools');
        const on = getComputedStyle(lt).display !== 'none' && !logo.classList.contains('tight');
        const a = lt.getBoundingClientRect(), b = tools.getBoundingClientRect(), W = document.documentElement.clientWidth;
        const btn = [...tools.querySelectorAll('button')].map(x => x.getBoundingClientRect()).filter(x => x.width);
        return { on, overlap: on && a.right > b.left - 4, out: b.right > W + 1, small: btn.some(x => x.width < 43.5 || x.height < 43.5) };
      });
      (shown[w] = shown[w] || {})[L] = r.on;
      if (r.overlap) bad(`머리 줄 ${L} ${w}`, '로고 글자와 단추가 겹침');
      if (r.out) bad(`머리 줄 ${L} ${w}`, '단추가 화면 밖');
      if (r.small) bad(`머리 줄 ${L} ${w}`, '단추가 44px보다 작음');
    }
    await ctx.close();
  }
  const diff = Object.entries(shown).filter(([w, v]) => new Set(Object.values(v)).size > 1).map(([w, v]) => w + ' ' + JSON.stringify(v));
  if (diff.length) bad('머리 줄 로고 글자가 언어마다 다름', diff.slice(0, 10).join(' / ')); else ok('머리 줄: 겹침 0 · 언어마다 로고 글자 보임이 같음');
}

// 메뉴: 아래 안전 영역(홈 막대)에 마지막 줄이 안 가림
async function safeArea(browser) {
  console.log('\n[메뉴 안전 영역] iPhone 13 세로(위 47·아래 34) · 가로(옆 47·아래 21)');
  for (const [dn, dev, ins] of [['세로', devices['iPhone 13'], { top: 47, bottom: 34, left: 0, right: 0 }], ['가로', devices['iPhone 13 landscape'], { top: 0, bottom: 21, left: 47, right: 47 }]]) {
    for (const u of ['/', '/hanmari/', '/ja/']) {
      const ctx = await newCtx(browser, dev); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
      try { await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: ins }); } catch (e) { notes.push('안전 영역 흉내 안 됨'); await ctx.close(); continue; }
      await page.goto(BASE + u, { waitUntil: 'load' }); await page.waitForTimeout(500);
      await page.tap('.menu-b'); await page.waitForTimeout(500);
      const r = await page.evaluate(b => { const g = document.getElementById('gm'); g.scrollTop = 1e6; const as = [...g.querySelectorAll('a')]; const last = as[as.length - 1].getBoundingClientRect(); return { last: Math.round(last.bottom), H: innerHeight, limit: innerHeight - b }; }, ins.bottom);
      if (r.last > r.limit + 1) bad(`메뉴 ${dn} ${u}`, `마지막 줄이 아래 막대에 가림 ${r.last} > ${r.limit}`); else ok(`메뉴 ${dn} ${u}: 마지막 줄 ${r.last} ≤ ${r.limit}`);
      await ctx.close();
    }
  }
}

(async () => {
  const srv = await serve();
  const browser = await chromium.launch();
  try {
    await pages(browser);
    if (!process.env.ONLY) { await header(browser); await safeArea(browser); }
  } finally { await browser.close(); srv.close(); }
  console.log(`\n문제 ${problems.length}개` + (notes.length ? ` · 메모 ${notes.join(', ')}` : '') + ` · 사진 ${OUT}`);
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ problems, notes }, null, 1));
  process.exitCode = problems.length ? 1 : 0;
})();
