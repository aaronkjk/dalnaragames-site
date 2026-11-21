// 홈페이지 점검 (2026-11-19 새 디자인) — 쪽 36개(네 언어 × 첫 화면·게임 쪽 넷·문의·개인정보·약관·404)
//   node tools/site/check.js [layout|links|extra|all]     (THEME=dark 를 붙이면 '어둡게'를 고른 상태로)
//   layout: 쪽마다 폭 6가지 — 가로 넘침·화면 밖 글·숨은 채 남은 것·안 뜬 그림·글자 대비·머리 줄 겹침·콘솔 오류·못 받은 파일·모드
//   links : 쪽마다 모든 링크를 실제로 누름 — 안쪽 같은 창(없는 쪽 0), 바깥 새 창, 언어 고르기는 같은 쪽의 다른 언어, 메뉴·바로 가기·소리·밝게어둡게·복사
//   extra : 게임 고르기·소식 언어·물수제비·물고기 카드·불러오기(첫 방문 한 번)·없는 주소 → 그 언어 404·느린 폰 첫 화면
// 필요: npm i playwright (이 저장소에는 node_modules 없음 — 게임 저장소 쪽 것을 써도 됨: NODE_PATH)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const WHAT = process.argv[2] || 'all';
const THEME = process.env.THEME || '';
const PORT = 8800 + (THEME === 'dark' ? 1 : 0);
const OUT = process.env.OUT || path.join(os.tmpdir(), 'sitecheck', THEME || 'light'); fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number) : [320, 360, 390, 412, 768, 1280];
const JOBS = +(process.env.JOBS || 6);
const LANGS = ['ko', 'ja', 'zh-TW', 'en'], PRE = { ko: '', ja: 'ja/', 'zh-TW': 'zh-TW/', en: 'en/' };
const KEYS = ['index', 'hanmari', 'tongtong', 'delivery', 'house', 'contact', 'privacy', 'terms', '404'];
const urlOf = (L, k) => '/' + PRE[L] + (k === 'index' ? '' : ['hanmari', 'tongtong', 'delivery', 'house'].includes(k) ? k + '/' : k + '.html');
let PAGES = []; for (const L of LANGS) for (const k of KEYS) PAGES.push({ L, k, u: urlOf(L, k) });
if (process.env.ONLY) PAGES = PAGES.filter(p => process.env.ONLY.split(',').some(x => p.u === x || (p.L + ':' + p.k) === x));
const EXT_HOSTS = /(^|\.)(threads\.com|instagram\.com|youtube\.com|ytimg\.com|kisa\.or\.kr|kopico\.go\.kr|google\.com|policies\.google\.com|apple\.com|firebase\.google\.com|play\.google\.com|support\.google\.com)$/;
const NO_WORDS = /(?<![A-Za-z])AI(?![A-Za-z])|인공지능|Claude|클로드|코드 모르|코드를 모르|별빛 산책|starwalk/;
const report = { problems: [], notes: [] };
const bad = (k, v) => { report.problems.push(k + ': ' + v); console.log('  ✗ ' + k + ': ' + v); };
const ok = k => console.log('  ✓ ' + k);

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
function serve() {   // GitHub Pages 흉내: 폴더는 index.html, 없는 주소는 맨 위 404.html을 404로
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      let f = path.join(ROOT, u);
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!u.endsWith('/')) { rsp.writeHead(301, { Location: u + '/' }); rsp.end(); return; } f = path.join(f, 'index.html'); }
      if (!fs.existsSync(f) || u.includes('/_preview/') || u.includes('/tools/')) { rsp.writeHead(404, { 'Content-Type': TYPES['.html'] }); fs.createReadStream(path.join(ROOT, '404.html')).pipe(rsp); return; }
      const st = fs.statSync(f), ty = TYPES[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
      if (range) { const m = /bytes=(\d*)-(\d*)/.exec(range); const a = +m[1] || 0, b = m[2] ? +m[2] : st.size - 1; rsp.writeHead(206, { 'Content-Type': ty, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 }); fs.createReadStream(f, { start: a, end: b }).pipe(rsp); return; }
      rsp.writeHead(200, { 'Content-Type': ty, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(rsp);
    }).listen(PORT, '127.0.0.1', () => res(s));
  });
}
const BASE = `http://127.0.0.1:${PORT}`;
async function newCtx(browser, w, opt = {}) {
  const mobile = w < 700;
  const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? (w <= 360 ? 640 : w === 412 ? 915 : 844) : 800 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, locale: 'ko-KR' });
  await ctx.route('**/*', r => { let h = ''; try { h = new URL(r.request().url()).hostname; } catch (e) {} if (h && h !== '127.0.0.1') return r.fulfill({ status: 200, contentType: 'text/html', body: '<title>바깥 쪽</title>바깥' }); return r.continue(); });
  await ctx.addInitScript(([th, fresh]) => {
    try {
      if (!sessionStorage.getItem('dn-th-set')) { if (th) localStorage.setItem('dn-mode', th); else localStorage.removeItem('dn-mode'); if (!fresh) localStorage.setItem('dn-seen-site', '1'); sessionStorage.setItem('dn-th-set', '1'); }
      localStorage.setItem('dalnara-lang', (document.documentElement && document.documentElement.lang) || 'ko');   // 언어 자동 이동 막기(점검은 주소 그대로)
    } catch (e) {}
    document.addEventListener('DOMContentLoaded', () => { window.__first = [document.documentElement.getAttribute('data-mode'), getComputedStyle(document.body).backgroundColor]; });
  }, [THEME, !!opt.fresh]);
  return ctx;
}
async function openPage(ctx, u) {
  const page = await ctx.newPage(), errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errs.push('콘솔: ' + m.text().slice(0, 140)); });
  page.on('pageerror', e => errs.push('스크립트: ' + String(e).slice(0, 140)));
  page.on('requestfailed', r => { const x = r.url(), t = r.failure() && r.failure().errorText; if (!((/\.mp4/.test(x) || /^mailto:/.test(x)) && /ERR_ABORTED/.test(t))) errs.push('못 받음: ' + x.slice(0, 120) + ' ' + t); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith(u) && !/404\.html$/.test(u)) errs.push(r.status() + ': ' + r.url().slice(0, 120)); });
  await page.goto(BASE + u, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { page, errs };
}
async function pool(items, n, fn) { const q = items.slice(); await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); }

const COMMON = `function moving(el){ for (let e = el, k = 0; e && k < 8; e = e.parentElement, k++) if (e.getAnimations && e.getAnimations().some(a => a.playState === 'running' && !(a.timeline && a.timeline.constructor && /Scroll|View/.test(a.timeline.constructor.name)))) return true; return false; }
function cls(el){ return (el.getAttribute('class') || '').toString(); }
function clipped(el){ const W = document.documentElement.clientWidth; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (o.overflowX !== 'visible') { const r = a.getBoundingClientRect(); if (r.right <= W + 1 && r.left >= -1) return true; } } return false; }`;
const LEAF = `(() => { ${COMMON}
  const W = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.vh,.skip,[hidden],.marq,.loader,svg')) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.bottom < innerHeight * 0.1 || r.top > innerHeight * 0.85) continue;
    if ((r.right > W + 1 || r.left < -1) && !clipped(el) && !moving(el)) out.push(el.tagName + '.' + cls(el) + ' «' + el.textContent.trim().slice(0, 18) + '» ' + Math.round(r.left) + '~' + Math.round(r.right));
  }
  return out.slice(0, 6);
})()`;
const HIDDEN = `(() => { ${COMMON}
  const EX = '.pop,.vh,.skip,[hidden],.copy-msg,.loader,.blink,.cur,.pk-panel:not(.on),.lang-m,.best[hidden],.note';
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < innerHeight * 0.1 || r.top > innerHeight * 0.85 || r.right < 0 || r.left > innerWidth) continue;
    if (el.closest(EX)) continue;
    const cs = getComputedStyle(el);
    if ((el.classList.contains('wait') || +cs.opacity < 0.08 || cs.visibility === 'hidden') && !moving(el)) out.push(el.tagName + '.' + cls(el) + ' «' + (el.textContent || '').trim().slice(0, 16) + '»');
  }
  return out.slice(0, 8);
})()`;
const CONTRAST = `(() => {
  const toRGB = c => { const n = (c.match(/[\\d.]+/g) || []).map(Number); if (/^color\\(srgb/.test(c)) return n.slice(0, 3).map(v => v * 255).concat(n[3] == null ? 1 : n[3]); return n.length >= 3 ? n.slice(0, 3).concat(n[3] == null ? 1 : n[3]) : null; };
  const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none' && !/repeating-linear/.test(cs.backgroundImage)) return null; if (e.tagName === 'VIDEO' || e.tagName === 'IMG' || e.tagName === 'CANVAS') return null; const c = toRGB(cs.backgroundColor); if (c && c[3] > 0.5) return c; } return toRGB(getComputedStyle(document.body).backgroundColor); };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.vh,.skip,[hidden],[aria-hidden="true"],.loader,svg,.marq')) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const cs = getComputedStyle(el); if (+cs.opacity < 0.5 || cs.visibility === 'hidden') continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < 0.5) continue;
    const fg = toRGB(cs.color), bg = bgOf(el); if (!fg || !bg) continue;
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, big = px >= 24 || (bold && px >= 18.66);
    if (ratio < (big ? 3 : 4.5)) out.push(el.tagName + '.' + (el.getAttribute('class') || '') + ' «' + el.textContent.trim().slice(0, 14) + '» ' + ratio.toFixed(2));
  }
  return out.slice(0, 8);
})()`;
// 머리 줄: 로고와 단추가 겹치지 않고, 단추 줄이 화면 안에
const HEADER = `(() => { const l = document.querySelector('.logo'), t = document.querySelector('.tools'), out = []; if (!l || !t) return ['머리 줄 없음'];
  const lr = l.getBoundingClientRect(), tr = t.getBoundingClientRect(); const txt = [...l.querySelectorAll('span')].filter(s => getComputedStyle(s).display !== 'none' && !s.classList.contains('vh'));
  for (const s of txt) { const r = s.getBoundingClientRect(); if (r.width && r.right > tr.left - 2) out.push('로고 글자가 단추와 겹침 ' + Math.round(r.right) + '>' + Math.round(tr.left)); }
  if (tr.right > document.documentElement.clientWidth + 1) out.push('단추 줄이 화면 밖 ' + Math.round(tr.right)); return out; })()`;

async function layout(browser) {
  console.log(`\n[1] 화면 점검 (쪽 ${PAGES.length} × 폭 ${WIDTHS.length}, ${THEME || 'light'})`);
  const jobs = []; for (const p of PAGES) for (const w of WIDTHS) jobs.push([p, w]);
  const results = [];
  await pool(jobs, JOBS, async ([p, w]) => {
    const ctx = await newCtx(browser, w);
    try {
      const { page, errs } = await openPage(ctx, p.u);
      await page.waitForTimeout(900);
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 1e6); }); await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(350);
      const H = await page.evaluate(() => document.documentElement.scrollHeight), vh = await page.evaluate(() => innerHeight);
      let over = 0; const leaks = new Set(), hid = new Set(), low = new Set(), imgs = new Set();
      const hd = await page.evaluate(HEADER);
      for (let y = 0; y <= H; y += Math.round(vh * 0.75)) {
        await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(550);
        over = Math.max(over, await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
        (await page.evaluate(LEAF)).forEach(x => leaks.add(x));
        (await page.evaluate(HIDDEN)).forEach(x => hid.add(x));
        (await page.evaluate(CONTRAST)).forEach(x => low.add(x));
      }
      await page.waitForTimeout(400);
      (await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => { if (i.closest('[hidden]')) return false; const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0 && !(i.complete && i.naturalWidth > 0); }).map(i => i.getAttribute('src')))).forEach(x => imgs.add(x));
      const fonts = await page.evaluate(() => { const want = [...document.fonts].filter(f => /^DN /.test(f.family.replace(/"/g, ''))); return [want.length, want.filter(f => f.status === 'loaded').length]; });
      const st = await page.evaluate(() => [document.documentElement.getAttribute('data-mode'), window.__first]);
      const words = w === WIDTHS[0] ? await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[alt],[aria-label],[title]')].map(e => (e.getAttribute('alt') || '') + (e.getAttribute('aria-label') || '') + (e.getAttribute('title') || '')).join(' ') + document.title + (document.querySelector('meta[name=description]') || {}).content) : '';
      const issues = [];
      if (over > 0) issues.push('가로 넘침 ' + over + 'px');
      if (leaks.size) issues.push('화면 밖 글 ' + [...leaks].join(' | '));
      if (hid.size) issues.push('숨은 채 남음 ' + [...hid].join(' | '));
      if (imgs.size) issues.push('안 뜬 그림 ' + [...imgs].join(', '));
      if (low.size) issues.push('글자 대비 낮음 ' + [...low].join(' | '));
      if (hd.length) issues.push(hd.join(' · '));
      const want = THEME === 'dark' ? 'dark' : 'light';
      if (st[0] !== want || !st[1] || st[1][0] !== want) issues.push('모드 ' + JSON.stringify(st));
      if (!fonts[0] || fonts[1] === 0) issues.push('글꼴 ' + fonts.join('/'));
      const m = words && words.match(NO_WORDS); if (m) issues.push('쓰면 안 되는 말 «' + m[0] + '»');
      if (errs.length) issues.push([...new Set(errs)].join(' | '));
      results.push([p.u + ' ' + w, issues, H]);
      if (w === 390 || w === 1280) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, `${(p.L + '_' + p.k)}_${w}.png`) }); }
    } catch (e) { results.push([p.u + ' ' + w, ['점검 실패 ' + String(e.message).split('\n')[0].slice(0, 140)], 0]); }
    await ctx.close();
  });
  results.sort((a, b) => a[0].localeCompare(b[0]));
  let n = 0;
  for (const [tag, issues, H] of results) { if (issues.length) bad(tag, issues.join(' · ')); else n++; }
  ok(`화면 ${n}/${results.length} 통과`);
}

// ── 링크·단추 ──
async function links(browser) {
  const w = THEME === 'dark' ? 1280 : 390;
  console.log(`\n[2] 링크·단추 점검 (쪽 ${PAGES.length}, 폭 ${w}, ${THEME || 'light'})`);
  let total = 0;
  const lines = [];
  await pool(PAGES, JOBS, async (p) => {
    const ctx = await newCtx(browser, w);
    let pops = 0; ctx.on('page', () => pops++);
    const { page, errs } = await openPage(ctx, p.u);
    const start = page.url(), host = new URL(start).host;
    const prob = [];
    const all = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a, i) => {
      a.setAttribute('data-ck', i);
      return { i, href: a.getAttribute('href'), abs: a.href, target: a.target, rel: a.rel, text: a.textContent.trim().slice(0, 24), inMenu: !!a.closest('.gmenu'), inLang: !!a.closest('.lang-m'), hreflang: a.getAttribute('hreflang'), inHidden: !!a.closest('[hidden]:not(.gmenu):not(.lang-m)') };
    }));
    const alts = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l => [l.getAttribute('hreflang'), new URL(l.href).pathname])));
    for (const a of all) {
      if (a.href.startsWith('mailto:')) {
        const okMail = await page.evaluate(i => { const x = document.querySelector('[data-ck="' + i + '"]'); return !x.target && /^mailto:dalnaragames\.official@gmail\.com/.test(x.getAttribute('href')); }, a.i);
        if (!okMail) prob.push('메일 링크 ' + a.text + ' ' + a.href);
        continue;
      }
      const ext = /^https?:/.test(a.abs) && new URL(a.abs).host !== host;
      if (ext && (a.target !== '_blank' || !/noopener/.test(a.rel))) prob.push('바깥 링크가 같은 창 ' + a.text + ' → ' + a.href);
      if (!ext && a.target === '_blank') prob.push('안쪽 링크가 새 창 ' + a.text + ' → ' + a.href);
      if (ext && !EXT_HOSTS.test(new URL(a.abs).hostname)) report.notes.push(`${p.u} 처음 보는 바깥 주소: ${a.href}`);
      if (/dalnaragames\.com/.test(a.abs)) prob.push('사이트 주소를 통째로 쓴 링크 ' + a.href);
    }
    // 실제로 누르기
    const seen = new Set(); let n = 0;
    for (const a of all) {
      if (a.inHidden || a.href.startsWith('mailto:')) continue;
      const key = a.href + '|' + a.inMenu + '|' + a.inLang; if (seen.has(key)) continue; seen.add(key);
      try {
        await page.goto(start, { waitUntil: 'load' }); await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; }); await page.waitForTimeout(120);
        await page.evaluate(() => [...document.querySelectorAll('a[href]')].forEach((x, i) => x.setAttribute('data-ck', i)));
        if (a.inMenu) { await page.click('.menu-b'); await page.waitForTimeout(300); }
        if (a.inLang) { await page.click('.lang-b'); await page.waitForTimeout(120); }
        const loc = page.locator(`[data-ck="${a.i}"]`);
        if (!(await loc.isVisible())) { await loc.scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(200); }
        if (!(await loc.isVisible())) { report.notes.push(`${p.u} 안 보여서 못 누른 링크: ${a.text} ${a.href}`); continue; }
        const ext = /^https?:/.test(a.abs) && new URL(a.abs).host !== host, before = pops;
        if (ext) {
          const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 5000 }), loc.click({ timeout: 5000 })]);
          await pop.close(); await page.waitForTimeout(100);
          if (page.url() !== start) prob.push('바깥 링크가 이 창도 옮김 ' + a.text);
        } else if (a.href.startsWith('#')) {
          if (a.href === '#main') {   // 본문으로 건너뛰기: 화면 밖에 있다가 Tab 첫 초점에서 보임
            await page.keyboard.press('Tab'); const f = await page.evaluate(() => document.activeElement && document.activeElement.className);
            if (f !== 'skip') prob.push('건너뛰기: Tab 첫 초점이 아님 ' + f); await page.keyboard.press('Enter');
          } else await loc.click({ timeout: 5000 });
          await page.waitForTimeout(700);
          const okk = await page.evaluate(id => { const e = document.querySelector(id); if (!e) return 'no'; const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 ? 'ok' : 'off ' + Math.round(r.top); }, a.href);
          if (okk !== 'ok') prob.push('같은 쪽 이동 ' + a.text + ' ' + a.href + ' ' + okk);
        } else {
          const same = a.abs.split('#')[0] === start.split('#')[0] && a.abs.includes('#');
          if (same) { await loc.click({ timeout: 5000 }); await page.waitForTimeout(700); const okk = await page.evaluate(h => { const e = document.querySelector(h); if (!e) return 'no'; const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 ? 'ok' : 'off'; }, new URL(a.abs).hash); if (okk !== 'ok') prob.push('같은 쪽 이동 ' + a.href + ' ' + okk); n++; continue; }
          const resp = await Promise.all([page.waitForNavigation({ timeout: 8000 }), loc.click({ timeout: 5000 })]).then(r => r[0]);
          if (pops !== before) prob.push('안쪽 링크가 새 창 ' + a.text);
          if (!resp || resp.status() >= 400) prob.push('없는 쪽 ' + a.text + ' → ' + a.href + ' ' + (resp && resp.status()));
          const hash = new URL(a.abs).hash;
          if (hash) { await page.waitForTimeout(300); if (!(await page.evaluate(h => !!document.querySelector(h), hash))) prob.push('링크 자리 없음 ' + a.href); }
          if (a.inLang) {   // 언어 고르기: 같은 쪽의 그 언어(hreflang 짝)로
            const want = p.k === '404' ? '/' + PRE[a.hreflang] + '404.html' : alts[a.hreflang];
            const got = new URL(page.url()).pathname, lang = await page.evaluate(() => document.documentElement.lang);
            if (got !== want || lang !== a.hreflang) prob.push(`언어 ${a.hreflang} → ${got} (바라는 것 ${want}, lang=${lang})`);
          }
        }
        n++;
      } catch (e) { prob.push('누르기 실패 ' + a.text + ' → ' + a.href + ' ' + String(e.message).split('\n')[0].slice(0, 100)); }
    }
    // 단추
    await page.goto(start, { waitUntil: 'load' }); await page.waitForTimeout(250);
    const r = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms)), res = {};
      const s = document.querySelector('[data-sound]'); s.click(); await wait(50); res.sound = s.getAttribute('aria-pressed') === 'true'; s.click(); await wait(50); res.sound = res.sound && s.getAttribute('aria-pressed') === 'false';
      const lb = document.querySelector('.lang-b'), lm = document.querySelector('.lang-m'); lb.click(); await wait(80); const o1 = !lm.hidden; document.body.click(); await wait(80); res.langMenu = o1 && lm.hidden;
      const mb = document.querySelector('.menu-b'), m = document.getElementById('gm'); mb.click(); await wait(300); const mo = !m.hidden;
      m.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(150); res.menu = mo && m.hidden; document.documentElement.style.overflow = '';
      const cps = [...document.querySelectorAll('[data-copy]')]; for (const cp of cps) { cp.scrollIntoView(); cp.click(); await wait(350); } res.copy = cps.every(cp => !!cp.parentNode.querySelector('.copy-msg').textContent);
      const mt = document.querySelector('[data-mode-toggle]'), root = document.documentElement, b0 = root.getAttribute('data-mode'); mt.click(); await wait(80);
      res.mode = root.getAttribute('data-mode') !== b0 && localStorage.getItem('dn-mode') === root.getAttribute('data-mode'); mt.click(); await wait(50); res.modeBack = root.getAttribute('data-mode') === b0;
      return res;
    });
    for (const [k, v] of Object.entries(r)) if (!v) prob.push('단추 ' + k + ' 안 됨');
    // 바로 가기 줄
    const tabs = await page.$$eval('.jump [data-jump]', as => as.map(a => a.getAttribute('data-jump')));
    for (const k of tabs) {
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = ''; });
      await page.click(`.jump [data-jump="${k}"]`); await page.waitForTimeout(1200);
      const st = await page.evaluate(k => { const s = document.getElementById(k), j = document.querySelector('.jump'), a = j.querySelector(`[data-jump="${k}"]`);
        const jr = j.getBoundingClientRect(), ar = a.getBoundingClientRect(), row = j.querySelector('.jump-in').getBoundingClientRect(), sr = s.getBoundingClientRect();
        const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
        return { top: Math.round(sr.top), jb: Math.round(jr.bottom), cur: (j.querySelector('[aria-current="true"]') || {}).dataset?.jump || null, inRow: ar.left >= row.left - 1 && ar.right <= row.right + 1, atEnd,
          menu: (document.querySelector(`#gm [data-jump="${k}"]`) || {}).getAttribute?.('aria-current') || null }; }, k);
      const placed = st.atEnd ? st.top <= st.jb + 12 : (st.top >= st.jb - 16 && st.top <= st.jb + 14);   // 구역 위 여백(44px) 안에서 조금 겹치는 건 괜찮음
      if (!placed || st.cur !== k || !st.inRow || st.menu !== 'true') prob.push('바로 가기 ' + k + ' ' + JSON.stringify(st));
    }
    // 밝게·어둡게가 다른 쪽으로 넘어가도 유지
    const m2 = await page.evaluate(() => { document.querySelector('[data-mode-toggle]').click(); return document.documentElement.getAttribute('data-mode'); });
    const other = p.k === 'index' ? urlOf(p.L, 'hanmari') : urlOf(p.L, 'index');
    await page.goto(BASE + other, { waitUntil: 'load' });
    const kept = await page.evaluate(() => [document.documentElement.getAttribute('data-mode'), window.__first && window.__first[0]]);
    if (kept[0] !== m2 || kept[1] !== m2) prob.push('쪽을 넘기면 모드 유지 안 됨 ' + JSON.stringify(kept));
    await page.evaluate(() => document.querySelector('[data-mode-toggle]').click());
    if (errs.length) prob.push([...new Set(errs)].join(' | '));
    total += n;
    lines.push([p.u, prob, n, tabs.length]);
    await ctx.close();
  });
  lines.sort((a, b) => a[0].localeCompare(b[0]));
  for (const [u, prob, n, tn] of lines) { if (prob.length) bad(u, prob.join(' · ')); else ok(`${u} 링크 ${n}개 · 바로 가기 ${tn}개`); }
  console.log(`  링크 누른 수 합계 ${total}`);
}

// ── 그 밖에 ──
async function extra(browser) {
  console.log(`\n[3] 게임 고르기·소식·물수제비·물고기 카드·불러오기·없는 주소·느린 폰 (${THEME || 'light'})`);
  for (const L of LANGS) for (const w of [390, 1280]) {
    const ctx = await newCtx(browser, w);
    const { page, errs } = await openPage(ctx, urlOf(L, 'index'));
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const pk = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const pk = document.querySelector('[data-picker]'); pk.scrollIntoView(); await wait(400);
      const cards = [...pk.querySelectorAll('.pk-card')], out = [];
      for (let i = 0; i < cards.length; i++) { cards[i].click(); await wait(150); const vis = [...pk.querySelectorAll('.pk-panel')].filter(p => !p.hidden); const img = vis[0] && vis[0].querySelector('img, video'); out.push(vis.length === 1 && +vis[0].getAttribute('data-i') === i && !!img); }
      cards[0].click(); await wait(100); pk.querySelector('[data-pk-step="1"]').click(); await wait(100); const nx = pk.getAttribute('data-cur') === '1';
      pk.querySelector('[data-pk-step="-1"]').click(); pk.querySelector('[data-pk-step="-1"]').click(); await wait(100); const pv = pk.getAttribute('data-cur') === '6';
      cards[6].focus(); cards[6].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await wait(100); const kb = pk.getAttribute('data-cur') === '0';
      const v = pk.querySelector('.pk-panel:not([hidden]) video'); await wait(1500); const playing = v ? !v.paused || v.readyState > 1 : true;
      // 퍼즐 그림이 그 언어 화면인지
      const pz = [...pk.querySelectorAll('.pk-panel img')].map(i => i.getAttribute('src'));
      return { cards: out.every(Boolean), nx, pv, kb, playing, pz };
    });
    const L2 = L; const pzOk = pk.pz.every(s => /wordsort-ko/.test(s) || new RegExp('-' + L2 + '\\.webp').test(s));
    if (!pzOk) bad(`${L} ${w} 퍼즐 화면 언어`, pk.pz.join(', '));
    delete pk.pz;
    for (const [k, v] of Object.entries(pk)) if (!v) bad(`${L} ${w} 게임 고르기 ${k}`, '안 됨');
    for (const lg of LANGS) {
      await page.click(`.nlang button[data-lang="${lg}"]`); await page.waitForTimeout(150);
      const okl = await page.evaluate(lg => { const vis = [...document.querySelectorAll('.news-l')].filter(l => !l.hidden); return vis.length === 1 && vis[0].dataset.lang === lg && vis[0].children.length >= 3; }, lg);
      if (!okl) bad(`${L} ${w} 소식 언어 ${lg}`, '안 바뀜');
    }
    const first = await page.evaluate(L => { const b = document.querySelector('.nlang button[aria-pressed="true"]'); return b && b.dataset.lang; }, L);
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200);
    const pond = page.locator('.pond').first(); await page.evaluate(() => document.querySelector('.pond').scrollIntoView({ block: 'center' })); await page.waitForTimeout(2400);
    const b2 = await pond.boundingBox();
    if (b2) {
      const y = b2.y + b2.height * 0.6; await page.mouse.move(b2.x + 40, y); await page.mouse.down();
      for (let k = 1; k <= 6; k++) { await page.mouse.move(b2.x + 40 + k * 45, y - k); await page.waitForTimeout(16); }
      await page.mouse.up(); await page.waitForTimeout(3400);
      const res = await page.evaluate(() => ({ pop: document.querySelector('.pond .pop').textContent, best: document.querySelector('.pond .best').textContent }));
      if (!/\d/.test(res.pop) || !/\d/.test(res.best)) bad(`${L} ${w} 물수제비`, JSON.stringify(res)); else ok(`${L} ${w} 게임 고르기 · 소식 4개 언어 · 물수제비 ${res.pop} / ${res.best}`);
    }
    if (errs.length) bad(`${L} ${w} 오류`, [...new Set(errs)].join(' | '));
    await page.goto(BASE + urlOf(L, 'hanmari'), { waitUntil: 'load' });
    const fl = await page.evaluate(async () => { const b = document.querySelector('.hw'); b.scrollIntoView(); b.click(); await new Promise(r => setTimeout(r, 600)); const on = b.getAttribute('aria-pressed') === 'true'; b.click(); return on; });
    if (!fl) bad(`${L} ${w} 물고기 카드 뒤집기`, '안 됨');
    await ctx.close();
  }
  // 불러오기: 첫 방문에만
  const ctx = await newCtx(browser, 390, { fresh: true });
  const p1 = await ctx.newPage(); const t0 = Date.now(); await p1.goto(BASE + '/', { waitUntil: 'commit' });
  const seen1 = await p1.waitForSelector('#loader', { timeout: 3000 }).then(() => true).catch(() => false);
  await p1.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 4000 }).catch(() => {}); const gone = Date.now() - t0;
  await p1.goto(BASE + '/ja/', { waitUntil: 'load' }); const again = await p1.evaluate(() => { const l = document.getElementById('loader'); return !!l && getComputedStyle(l).display !== 'none'; });
  if (!seen1 || again || gone > 3000) bad('불러오기', JSON.stringify({ seen1, again, gone })); else ok(`불러오기: 첫 방문에만 보이고 ${gone}ms 뒤 사라짐`);
  // 없는 주소 → 404(그 언어)
  for (const [u, want] of [['/nope', '/404.html'], ['/ja/nope/', '/ja/404.html'], ['/zh-TW/x.html', '/zh-TW/404.html'], ['/en/old/page', '/en/404.html']]) {
    const r = await p1.goto(BASE + u, { waitUntil: 'load' }); await p1.waitForTimeout(500);
    const got = new URL(p1.url()).pathname, h = await p1.evaluate(() => [document.documentElement.lang, !!document.querySelector('.lost')]);
    const okk = h[1] && (want === '/404.html' ? true : got === want);
    if (!okk) bad('없는 주소 ' + u, got + ' ' + JSON.stringify(h)); else ok(`없는 주소 ${u} → ${got === u ? '404 쪽' : got} (${h[0]})`);
  }
  await ctx.close();
  // 느린 폰(CPU 4배·느린 4G) 첫 화면
  for (const u of ['/', '/en/', '/hanmari/']) {
    const c = await newCtx(browser, 390); const pg = await c.newPage(); const cdp = await c.newCDPSession(pg);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0; pg.on('response', async r => { try { const b = await r.body(); bytes += b.length; } catch (e) {} });
    await pg.goto(BASE + u, { waitUntil: 'load' });
    const m = await pg.evaluate(() => { const p = performance.getEntriesByType('paint').find(x => x.name === 'first-contentful-paint'); const n = performance.getEntriesByType('navigation')[0]; return [Math.round(p ? p.startTime : -1), Math.round(n.loadEventEnd)]; });
    console.log(`  느린 폰 ${u}: 첫 글자 ${m[0]}ms · 다 받음 ${m[1]}ms · 받은 양 ${Math.round(bytes / 1024)}KB`);
    await c.close();
  }
}

(async () => {
  const srv = await serve();
  const browser = await chromium.launch();
  try {
    if (WHAT === 'layout' || WHAT === 'all') await layout(browser);
    if (WHAT === 'links' || WHAT === 'all') await links(browser);
    if (WHAT === 'extra' || WHAT === 'all') await extra(browser);
  } finally { await browser.close(); srv.close(); }
  console.log(`\n문제 ${report.problems.length}개` + (report.notes.length ? ` · 메모 ${report.notes.length}개` : '') + ` · 사진 ${OUT}`);
  report.notes.slice(0, 30).forEach(x => console.log('  · ' + x));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
})();
