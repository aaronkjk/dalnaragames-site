// 달나라 게임즈 첫 화면 — 불러오기 · 달밤 호수 · 소리 · 관성 스크롤
import { gsap } from 'gsap';
import Lenis from 'lenis';
import { createSound } from './sound.js';

run();

function run() {
  // 라이브러리가 늦게 와서 이미 그림 한 장으로 바뀌었으면 아무것도 안 함(쪽 머리의 4초 지킴이)
  if (window.__v2fallback) return;
  window.__v2ok = true; clearTimeout(window.__v2wd);

  const $ = (s, r = document) => r.querySelector(s);
  const D = document.documentElement;
  const Q = new URLSearchParams(location.search);
  const FULL = D.classList.contains('intro-full');
  const LITE = Q.has('lite') || matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 560;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  const pre = $('#pre'), bar = $('#bar'), heroEl = $('.hero'), play = $('#lake'), titleEl = $('.title');
  pre.style.animation = 'none';   // 스크립트가 돌면 자동 걷힘을 끔(대신 아래에서 직접 걷음)
  gsap.set('.bar, .c3w, .moon-cap, .en, .hint', { opacity: 0 });
  gsap.set('.title .col.c1, .title .col.c2', { clipPath: 'inset(0% 0% 100% 0%)' });
  bar.inert = true; $('main').inert = true;   // 불러오는 동안 안 보이는 단추로 초점이 가지 않게

  // ── 오늘 달 · 서울 시각 (지금 홈페이지와 같은 계산) ──
  const SYN = 29.530588853, REF = Date.UTC(2000, 0, 6, 18, 14);
  function moonOf(d) {
    const age = (((d - REF) / 864e5) % SYN + SYN) % SYN, k = (1 - Math.cos(2 * Math.PI * age / SYN)) / 2;
    const names = [[1.5, '삭'], [6.4, '초승달'], [8.9, '상현달'], [13.8, '차오르는 달'], [15.8, '보름달'], [20.6, '기우는 달'], [23.1, '하현달'], [28.0, '그믐달'], [99, '삭']];
    return { age, k, waxing: age < SYN / 2, name: names.find((n) => age < n[0])[1] };
  }
  function moonPath(r, k, waxing) {
    const x = Math.abs(r * (1 - 2 * k)).toFixed(2), ls = waxing ? 1 : 0, ts = waxing ? (k < 0.5 ? 0 : 1) : (k < 0.5 ? 1 : 0);
    if (k < 0.02) return '';
    if (k > 0.98) return `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`;
    return `M0 ${-r}A${r} ${r} 0 0 ${ls} 0 ${r}A${x} ${r} 0 0 ${ts} 0 ${-r}Z`;
  }
  const MOON = moonOf(new Date());
  if (Q.has('still')) Object.assign(MOON, { k: 1, waxing: true });   // 그림 한 장 만들 때만
  $('#moonName').textContent = MOON.name;
  const tick = () => { try { $('#clock').textContent = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) {} };
  tick(); setInterval(tick, 20000);

  // ── 불러오기: 진행에 맞춰 초승달 → 보름달(시간 기준이라 화면 빠르기와 상관없음) ──
  const litEl = $('.lit', pre), numEl = $('.pre-num span', pre);
  const load = { target: FULL ? 0.12 : 1, shown: FULL ? 0 : 1, t0: performance.now(), last: performance.now() };
  const MIN = FULL ? 900 : 0;   // 달이 차는 데 최소 0.9초 + 먹 번짐 0.6초 ≈ 1.5초
  function drawPre() {
    if (!FULL) { litEl.setAttribute('d', moonPath(47, 1, true)); return; }
    const t = performance.now(), dt = (t - load.last) / 1000; load.last = t;
    const goal = Math.min(load.target, Math.min(1, (t - load.t0) / MIN));
    load.shown += (goal - load.shown) * (1 - Math.exp(-dt * 14));
    if (goal >= 1 && load.shown > 0.99) load.shown = 1;
    litEl.setAttribute('d', moonPath(47, 0.04 + 0.96 * load.shown, true));
    numEl.textContent = Math.round(load.shown * 100);
  }
  gsap.ticker.add(drawPre);
  if (document.fonts) document.fonts.ready.then(() => { if (FULL) load.target = Math.max(load.target, 0.35); });

  // ── 소리 ──
  const snd = createSound(new URL('snd/', import.meta.url).href);   // 소리 파일은 이 파일 옆 snd/ 폴더
  window.__v2 = { sound: snd };   // 점검·기기 확인용
  const sBtn = $('#snd'), sTxt = $('.snd-t', sBtn);
  let soundWanted = store.get('dn-v2-sound') === '1';
  function showSound(v, note) {
    sBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    const label = note || (v ? '소리 끄기' : '소리 켜기');
    sTxt.textContent = label; sBtn.setAttribute('aria-label', label);
  }
  function soundFail() {
    soundWanted = false; store.set('dn-v2-sound', '0');
    showSound(false, '잠깐 안 불러와져요. 다시 눌러 볼까요?');
    setTimeout(() => { if (!soundWanted) showSound(false); }, 3500);
  }
  showSound(soundWanted);
  sBtn.addEventListener('click', () => {
    soundWanted = !soundWanted; store.set('dn-v2-sound', soundWanted ? '1' : '0'); showSound(soundWanted);
    snd.setOn(soundWanted).catch(soundFail);
  });
  if (soundWanted) {   // 켜 두셨으면 첫 누름에서 켬(브라우저가 누르기 전엔 소리를 막음)
    const wake = () => { if (soundWanted) snd.setOn(true).catch(soundFail); };
    addEventListener('pointerdown', wake, { once: true, capture: true });
    addEventListener('keydown', wake, { once: true, capture: true });
  }

  // ── 점수 ── (새 물수제비는 지금 홈페이지 놀이와 물리가 달라 최고 기록을 따로 둠)
  const cnt = $('#cnt'), bestEl = $('#best'), hint = $('#hint'), say = $('#say');
  let best = parseInt(store.get('dn-v2-skip-best') || '0', 10) || 0;
  const showBest = () => { bestEl.textContent = best ? `최고 ${best}번` : ''; };
  showBest();
  let thrown = false;
  function userThrew() { if (!thrown) { thrown = true; gsap.to(hint, { opacity: 0, duration: 0.5, overwrite: true }); } }

  // ── 관성 스크롤 ──
  const lenis = new Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.1 });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('data-go')); if (!t) return;
    e.preventDefault();
    lenis.scrollTo(t, { offset: -(bar.offsetHeight + 16), duration: 1.1, onComplete: () => t.focus({ preventScroll: true }) });
  }));
  const onScroll = (y) => {
    const hh = heroEl.offsetHeight;
    bar.classList.toggle('on-paper', y > hh - bar.offsetHeight);
    titleEl.style.transform = `translate3d(0, ${(-Math.min(1, y / hh) * hh * 0.18).toFixed(1)}px, 0)`;
  };
  lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  onScroll(scrollY);

  // ── 달밤 호수 ──
  const cvs = $('#gl'), still = $('#still');
  let hero = null, introDone = false, revealed = false, onScreen = true;
  const wantRun = () => hero && revealed && onScreen && !document.hidden;
  const sync = () => { if (!hero) return; wantRun() ? hero.start() : hero.stop(); };
  function fallback() {
    D.classList.add('v2-still');
    still.src = still.getAttribute(innerWidth / innerHeight < 0.8 ? 'data-src-tall' : 'data-src'); still.hidden = false;
    if (hero) { const h = hero; hero = null; h.dispose(); }
    gsap.ticker.remove(drawPre);
    gsap.to(pre, { opacity: 0, duration: 0.45, delay: MIN / 1000, onComplete: () => pre.classList.add('gone') });
    gsap.delayedCall(MIN / 1000, intro);
  }
  // 그래픽 칩 없이 소프트웨어로 그리는 기기(가상 머신·막힌 그래픽)는 그림 한 장으로. 시험할 때만 ?sw
  function glKind() {
    try {
      const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 'none';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return /swiftshader|llvmpipe|software|basic render/i.test(name) ? 'soft' : 'gpu';
    } catch (e) { return 'none'; }
  }
  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

  async function boot() {
    const kind = glKind();
    if (Q.has('nogl') || kind === 'none' || (kind === 'soft' && !Q.has('sw'))) return fallback();
    let mod;
    try { mod = await Promise.race([import('./hero.js'), timeout(6000)]); } catch (e) { return fallback(); }   // three.js가 6초 안에 안 오면 그림 한 장
    if (FULL) load.target = Math.max(load.target, 0.7);
    try {
      hero = mod.createHero(cvs, {
        lite: LITE, phase: MOON, adapt: !Q.has('fixed'), scale: Q.has('q') ? parseFloat(Q.get('q')) || 1 : 0,
        onBounce(n, sx, V, auto) {
          if (auto) return;
          cnt.innerHTML = `${n}<em>번</em>`;
          snd.skip(n, sx, V);
        },
        onSink(n, sx, auto) {
          snd.sink(sx);
          if (auto) return;
          if (!n) cnt.innerHTML = `0<em>번</em>`;
          const rec = n > best;
          if (rec) { best = n; store.set('dn-v2-skip-best', String(best)); showBest(); }
          say.textContent = `${n}번 튀었어요${rec ? '. 최고 기록이에요' : ''}`;
        },
        onDrop(sx) { snd.drop(sx); },
        onLayout() { requestAnimationFrame(placeMoonCap); },
        onLost() { fallback(); },
      });
    } catch (e) { return fallback(); }
    load.target = 1;
    Object.assign(window.__v2, { hero, lenis, moon: MOON, lite: LITE });
    waitFull();
  }
  function waitFull() {
    if (!hero) return;
    if (load.shown < 1) return requestAnimationFrame(waitFull);
    revealed = true; sync();
    if (!onScreen) hero.start();   // 처음 한 번은 그려야 걷힘이 보임(화면 밖이면 걷힌 뒤 바로 멈춤)
    placeMoonCap();
    const r = pre.querySelector('.pre-moon').getBoundingClientRect();
    const rv = hero.reveal;
    rv.x = (r.left + r.width / 2) / innerWidth; rv.y = 1 - (r.top + r.height / 2) / innerHeight; rv.z = 0;
    pre.classList.add('clear');
    gsap.ticker.remove(drawPre);
    gsap.to(rv, { z: 1, duration: FULL ? 0.6 : 0.45, ease: 'power2.in', onComplete: () => { pre.classList.add('gone'); sync(); } });
    gsap.to(pre.children, { opacity: 0, scale: 1.04, duration: 0.4, delay: 0.12, ease: 'power1.in' });
    gsap.delayedCall(FULL ? 0.42 : 0.3, intro);
  }
  function intro() {
    if (introDone) return; introDone = true;
    bar.inert = false; $('main').inert = false;
    window.__v2.introAt = performance.now();
    const cols = gsap.utils.toArray('.title .col.c1, .title .col.c2');
    gsap.fromTo(cols, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power3.out', stagger: 0.14 });
    gsap.fromTo('.c3w, .moon-cap, .en, .hint, .bar', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.45, stagger: 0.05 });
    if (hero && !Q.has('still')) gsap.delayedCall(1.3, () => hero && hero.throwStone({ lateral: 0.22, V: 3.4, auto: true }));   // 한 번 보여 주기
  }
  function placeMoonCap() {
    if (!hero) return;
    const L = hero.layout, cap = $('#moonCap');
    const top = (1 - L.moon[1] + L.moon[2] * 1.75) * L.h;   // 달 바로 아래 가운데
    cap.style.top = `${top.toFixed(0)}px`;
    cap.style.right = 'auto';
    cap.classList.add('placed');
    const half = cap.offsetWidth / 2, gut = Math.max(16, L.w * 0.04);
    const tr = titleEl.getBoundingClientRect(), hr = heroEl.getBoundingClientRect();
    const maxL = L.w - gut - half, under = top < tr.bottom - hr.top + 8;
    const clear = under ? tr.right - hr.left + 12 + half : 0;   // 제목과 겹치면 오른쪽으로
    if (clear > maxL) {   // 오른쪽에 자리가 없으면(좁은 폰) 제목 아래로
      cap.style.top = `${(tr.bottom - hr.top + 14).toFixed(0)}px`;
      cap.style.left = `${(tr.left - hr.left + half).toFixed(0)}px`;
      return;
    }
    cap.style.left = `${Math.min(maxL, Math.max(gut + half, clear, L.moon[0] * L.w)).toFixed(0)}px`;
  }

  // 손 입력: 그으면 던짐(가로), 누르면 그쪽으로, 움직이면 먹·물결. 두 손가락이면 던지지 않음
  const uvOf = (e) => { const r = cvs.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
  const touching = new Set();
  let down = null, trail = [], multi = false;
  cvs.addEventListener('pointerdown', (e) => {
    touching.add(e.pointerId);
    if (touching.size > 1) { multi = true; down = null; return; }
    multi = false;
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    trail = [[e.clientX, e.clientY, performance.now()]];
  });
  cvs.addEventListener('pointermove', (e) => {
    if (!hero || multi) return;
    const [sx, sy] = uvOf(e);
    if (e.pointerType === 'mouse' || down) hero.pointer(sx, sy);
    if (down && e.pointerId === down.id) { trail.push([e.clientX, e.clientY, performance.now()]); if (trail.length > 10) trail.shift(); }
  });
  const end = (e) => { touching.delete(e.pointerId); if (!touching.size) setTimeout(() => { if (!touching.size) multi = false; }, 0); };
  cvs.addEventListener('pointerup', (e) => {
    const was = down && e.pointerId === down.id && !multi ? down : null;
    end(e); down = null;
    if (!hero || !was) return;
    const dist = Math.hypot(e.clientX - was.x, e.clientY - was.y), dt = performance.now() - was.t;
    if (dist < 12 && dt < 650) { const [sx, sy] = uvOf(e); if (hero.throwToward(sx, sy) !== false) userThrew(); }
    else if (dist >= 24) {
      const tn = performance.now(), recent = trail.filter((p) => tn - p[2] < 140), a = recent[0] || trail[0];
      const span = Math.max(16, tn - a[2]);
      if (hero.swipe((e.clientX - a[0]) / span, (e.clientY - a[1]) / span) !== false) userThrew();
    }
  });
  cvs.addEventListener('pointercancel', (e) => { end(e); down = null; });
  play.addEventListener('keydown', (e) => {
    if (!hero || e.target !== play) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (hero.throwStone({ lateral: (Math.random() - 0.5) * 0.6, V: 3 + Math.random() }) !== false) userThrew(); }
  });

  // 화면 밖·다른 탭이면 멈춤
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(heroEl);
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => { if (hero) hero.stop(); });
  addEventListener('resize', () => requestAnimationFrame(placeMoonCap));

  // ?fps 또는 #fps — 실제 기기에서 확인용(미리보기 링크는 #만 넘어감)
  if (Q.has('fps') || location.hash === '#fps') {
    const f = $('#fps'); f.hidden = false;
    setInterval(() => { if (!hero) { f.textContent = '그림 한 장 모드'; return; } const s = hero.stats(); f.textContent = `fps ${s.fps} · 해상도 ${s.scale} · ${s.lite ? '가벼운 모드' : '보통 모드'}`; }, 500);
  }

  boot();
}
