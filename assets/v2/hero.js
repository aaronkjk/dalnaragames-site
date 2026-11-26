// 달밤 호수 — 한지에 먹으로 그린 밤 호수와 물수제비
// 그림(하늘·산·달·종이결)은 화면 크기가 바뀔 때만 한 장 그려 두고, 매 장면은 물·파문·먹 번짐·돌만 계산한다.
import * as THREE from 'three';

const GLSL_NOISE = /* glsl */`
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1.,0.)), u.x), mix(hash12(i+vec2(0.,1.)), hash12(i+vec2(1.,1.)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a*vnoise(p); p = mat2(1.6,1.2,-1.2,1.6)*p + 3.1; a *= .5; } return s; }
`;
const GLSL_COLORS = /* glsl */`
const vec3 INK = vec3(0.110, 0.106, 0.118);
const vec3 PAPER = vec3(0.953, 0.933, 0.890);
`;
const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

// ── 한 장 그려 두는 그림: R = 먹 농담(0 먹 … 1 한지), G = 종이결 ──
const PAINT = /* glsl */`
uniform vec2 uRes; uniform float uAspect, uH, uSeed; uniform vec3 uMoon; uniform vec2 uPhase;
varying vec2 vUv;
${GLSL_NOISE}
void main(){
  vec2 uv = vUv; float a = uAspect;
  vec2 p = vec2(uv.x*a, uv.y);
  // 종이결: 여러 방향으로 누운 섬유 + 고운 얼룩
  vec2 wp = p + 0.04*vec2(vnoise(p*7.), vnoise(p*7. + 4.));   // 섬유가 줄 맞춰 보이지 않게 비틂
  vec2 pr1 = mat2(0.87, 0.5, -0.5, 0.87)*wp, pr2 = mat2(0.26, -0.97, 0.97, 0.26)*wp;
  float fib = 0.2*vnoise(vec2(pr1.x*150., pr1.y*20.) + uSeed) + 0.2*vnoise(vec2(pr2.x*130., pr2.y*17.) + 3.3)
            + 0.45*(0.5*vnoise(p*11.) + 0.5*vnoise(p*38.)) + 0.15*hash12(floor(uv*uRes));
  float t = clamp((uv.y - uH)/(1. - uH), 0., 1.);
  float v = mix(0.64, 0.20, pow(t, 0.7));
  // 구름 바림
  vec2 q = vec2(p.x*1.1, p.y*2.2) + uSeed;
  vec2 w = vec2(fbm(q*1.2), fbm(q*1.2 + 5.2));
  float c = fbm(q + 1.7*w);
  float cl = smoothstep(0.50, 0.68, c);
  float edge = smoothstep(0.47, 0.51, c)*(1. - smoothstep(0.51, 0.58, c));
  float skyw = smoothstep(0.02, 0.3, t);
  v -= (0.16*cl + 0.09*edge)*skyw;
  // 제목이 놓이는 왼쪽 위는 한 번 더 바림 — 한지색 글자가 읽히게
  // 달: 칠하지 않고 둘레를 칠해 드러냄
  vec2 mc = vec2(uMoon.x*a, uMoon.y); float r = uMoon.z;
  float d = length(p - mc);
  v += 0.20*(1. - smoothstep(r*1.05, r*3.6, d))*(1. - cl*0.5);
  v -= 0.06*smoothstep(r*2.8, r*4.4, d)*(1. - smoothstep(r*4.4, r*8.0, d));
  vec2 m = (p - mc)/r;
  float aa = 2.2/(r*uRes.y);
  float disk = 1. - smoothstep(1. - aa, 1. + aa, length(m));
  float ct = (1. - 2.*uPhase.x)*sqrt(max(0., 1. - m.y*m.y));
  float lit = smoothstep(ct - 0.04, ct + 0.04, uPhase.y > 0. ? m.x : -m.x);
  float maria = 0.06*smoothstep(0.52, 0.72, fbm(m*2.4 + 3.)) + 0.03*vnoise(m*9.);
  v = mix(v, mix(v + 0.035, 0.965 - maria, lit), disk);
  // 먼 산 두 겹, 아래는 안개로 흐려짐
  float x = p.x;
  float brush = 0.6*vnoise(p*vec2(26., 20.)) + 0.4*vnoise(p*vec2(70., 55.)) - 0.5;
  float r1 = uH + 0.045 + 0.075*fbm(vec2(x*1.4 + 2.3, 0.7));
  float e2 = max(1. - smoothstep(0.0, 0.48, uv.x), smoothstep(0.80, 1.0, uv.x)*0.75);
  float r2 = uH + 0.008 + 0.16*e2*pow(fbm(vec2(x*2.2 + 8.1, 1.9)), 1.4);
  float m1 = 1. - smoothstep(r1 - 0.003, r1 + 0.003 + brush*0.004, uv.y);
  float m2 = 1. - smoothstep(r2 - 0.003, r2 + 0.003 + brush*0.006, uv.y);
  float mv1 = mix(0.62, 0.44 + brush*0.05, smoothstep(uH, uH + (r1 - uH)*0.7, uv.y));
  float mv2 = mix(0.58, 0.20 + brush*0.07, smoothstep(uH, uH + max(r2 - uH, 0.001)*0.8, uv.y));
  if (uv.y >= uH) { v = mix(v, mv1, m1*(1. - disk)); v = mix(v, mv2, m2*(1. - disk)); }
  // 제목이 놓이는 왼쪽은 산·안개까지 한 번 더 바림 — 한지색 글자가 읽히게
  v -= 0.2*(1. - smoothstep(0.12, 0.55, uv.x))*step(uH, uv.y)*(0.55 + 0.45*smoothstep(0.0, 0.4, t));
  gl_FragColor = vec4(clamp(v, 0., 1.), fib, 0., 1.);
}`;

// ── 매 장면: 물·파문·먹·돌 ──
const LIVE = /* glsl */`
uniform sampler2D uPaint; uniform float uAspect, uH, uTime, uMoonLit;
uniform vec3 uMoon; uniform vec3 uReveal;
uniform vec4 uRip[NR]; uniform vec4 uInk[NI]; uniform vec4 uStone[NS]; uniform vec4 uShadow[NS];
varying vec2 vUv;
${GLSL_NOISE}
${GLSL_COLORS}
void main(){
  vec2 uv = vUv; float a = uAspect;
  vec4 P = texture2D(uPaint, uv);
  float v;
  if (uv.y >= uH) {
    v = P.r;
  } else {
    float dy = max(uH - uv.y, 1e-4);
    float z = min(uH/dy, 300.);
    vec2 w = vec2((uv.x - 0.5)*a*z/(2.*uH), z);
    vec2 grad = vec2(0.);
    grad += vec2(0.20, 0.98)*0.9*cos(dot(vec2(0.20, 0.98), w)*7.0 + uTime*1.1);
    grad += vec2(-0.55, 0.83)*0.6*cos(dot(vec2(-0.55, 0.83), w)*11.0 - uTime*1.5);
    grad += vec2(0.80, 0.60)*0.35*cos(dot(vec2(0.80, 0.60), w)*17.0 + uTime*2.1);
#ifndef LITE
    grad += vec2(-0.90, 0.44)*0.25*cos(dot(vec2(-0.90, 0.44), w)*26.0 - uTime*2.6);
#endif
    grad *= 0.035;
    float inkW = 0.;
    for (int i = 0; i < NR; i++) {
      vec4 R = uRip[i];
      float age = uTime - R.z;
      if (age < 0. || age > 9. || R.w <= 0.) continue;
      vec2 dv = w - R.xy; float d = length(dv) + 1e-4;
      float xx = d - 0.30*age;
      float wid = 0.04 + 0.09*age;
      float env = R.w*exp(-age*(R.w < 0.3 ? 1.2 : 0.5))/(1. + 2.5*d);   // 손으로 낸 작은 파문은 빨리 잦아듦
      grad += (env*exp(-xx*xx/(wid*wid))*3.2*cos(xx*48.))*dv/d;
      if (R.w > 0.3) {
        float rc = 0.025 + 0.06*sqrt(age);
        float nn = vnoise(w*16. + R.xy*9.) - 0.5;
        inkW += (1. - smoothstep(rc*0.5, rc, d + nn*rc*0.7))*min(R.w, 1.)*exp(-age*0.32);
      }
    }
    float s = 0.55/(0.7 + z*0.35);
    vec2 ruv = vec2(uv.x + grad.x*s*0.9, clamp(uH + dy + grad.y*s*0.6, uH + 0.001, 0.998));
    float td = dy/uH;
    float refl = texture2D(uPaint, ruv).r;
    refl = mix(refl, min(refl, 0.6), smoothstep(0.35, 0.85, td));
    float dm = length(vec2((ruv.x - uMoon.x)*a, ruv.y - uMoon.y))/uMoon.z;   // 거울에 비친 달 원판
    refl = mix(refl, refl*0.62, (1. - smoothstep(0.7, 1.6, dm))*smoothstep(0.2, 0.6, td));   // 가까운 물엔 달 그림자가 덩어리로 비치지 않게(달빛은 반짝임으로)
    v = mix(0.09, refl*0.88, mix(0.94, 0.34, smoothstep(0., 1., td)));
    float dxm = (uv.x - uMoon.x)*a;
    float pw = 0.012 + 0.11*td;
    float sp = vnoise(vec2(w.x*36., w.y*5.) + vec2(uTime*0.55, -uTime*0.25) + grad*22.);
    v = mix(v, 0.94, smoothstep(0.70, 0.84, sp)*exp(-dxm*dxm/(pw*pw))*uMoonLit*0.9);
    v += 0.07*(1. - smoothstep(0., 0.01, dy));
    v -= inkW*0.22;
  }
  for (int j = 0; j < NI; j++) {
    vec4 K = uInk[j];
    float age = uTime - K.z;
    if (age < 0. || age > 4.5 || K.w <= 0.) continue;
    float dd = length(vec2((uv.x - K.x)*a, uv.y - K.y));
    float rad = K.w*(0.35 + 0.85*sqrt(age));
    if (dd > rad*1.5) continue;
    float d2 = dd + (vnoise(vec2(uv.x*a, uv.y)*26. + float(j)*3.7) - 0.5)*rad*0.55;
    float mk = 1. - smoothstep(rad*0.7, rad, d2);
    float rim = mk*smoothstep(rad*0.5, rad*0.95, d2);
    v -= (0.08*mk + 0.11*rim)*exp(-age*0.5)*(1. - smoothstep(3., 4.5, age));
  }
  for (int k = 0; k < NS; k++) {
    vec4 S = uShadow[k];
    if (S.w > 0.) { float e = length(vec2((uv.x - S.x)*a, (uv.y - S.y)*3.2))/S.z; v -= 0.10*S.w*(1. - smoothstep(0.6, 1., e)); }
    vec4 T = uStone[k];
    if (T.w > 0.) {
      vec2 o = vec2((uv.x - T.x)*a, (uv.y - T.y)*1.7);
      float e = length(o)/T.z;
      float mk = (1. - smoothstep(0.82, 1., e))*T.w;
      v = mix(v, 0.06, mk);
      v = mix(v, 0.55, mk*smoothstep(0.15, 0.55, o.y/T.z)*(1. - smoothstep(0.6, 0.85, e))*0.6);
    }
  }
  vec3 col = mix(INK, PAPER, clamp(v, 0., 1.))*(0.962 + 0.06*P.g);
  if (uReveal.z < 1.) {
    float dd = length(vec2((uv.x - uReveal.x)*a, uv.y - uReveal.y));
    float R = uReveal.z*1.6*max(a, 1.);
    float d2 = dd + fbm(vec2(uv.x*a, uv.y)*5.)*0.16 + vnoise(vec2(uv.x*a, uv.y)*30.)*0.03 - 0.08;
    float inside = 1. - smoothstep(R - 0.015, R, d2);
    float rim = inside*smoothstep(R - 0.12, R - 0.005, d2);
    col = mix(PAPER*(0.962 + 0.06*P.g), mix(col, INK*0.85, rim*0.75), inside);
  }
  gl_FragColor = vec4(col, 1.);
}`;

// 화면 모양에 따른 자리(수평선·달)
function layout(w, h) {
  const a = w / h;
  if (a < 0.8) return { h: 0.47, moon: [0.74, 0.835, 0.040] };   // 세로 폰
  if (a < 1.25) return { h: 0.44, moon: [0.72, 0.81, 0.046] };
  if (h < 500) return { h: 0.40, moon: [0.71, 0.70, 0.07] };   // 가로로 눕힌 폰: 머리 줄 밑에 달이 묻히지 않게
  return { h: 0.42, moon: [0.71, 0.80, 0.052] };
}

export function createHero(canvas, opts = {}) {
  const lite = !!opts.lite;
  const NR = lite ? 16 : 32, NI = lite ? 10 : 24, NS = 3;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0xf3eee3, 1);
  renderer.autoClear = false;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.PlaneGeometry(2, 2);

  const phase = opts.phase || { k: 1, waxing: true };
  const vec4s = (n, z = -100) => Array.from({ length: n }, () => new THREE.Vector4(0, 0, z, 0));
  const paintMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: PAINT, depthTest: false, depthWrite: false,
    uniforms: { uRes: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uH: { value: 0.42 }, uSeed: { value: 11.7 },
      uMoon: { value: new THREE.Vector3() }, uPhase: { value: new THREE.Vector2(phase.k, phase.waxing ? 1 : -1) } },
  });
  const liveMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: LIVE, depthTest: false, depthWrite: false,
    defines: Object.assign({ NR, NI, NS }, lite ? { LITE: 1 } : {}),
    uniforms: { uPaint: { value: null }, uAspect: { value: 1 }, uH: { value: 0.42 }, uTime: { value: 0 }, uMoonLit: { value: phase.k },
      uMoon: { value: new THREE.Vector3() }, uReveal: { value: new THREE.Vector3(0.5, 0.5, opts.revealed ? 1 : 0) },
      uRip: { value: vec4s(NR) }, uInk: { value: vec4s(NI) }, uStone: { value: vec4s(NS, 0) }, uShadow: { value: vec4s(NS, 0) } },
  });
  const paintScene = new THREE.Scene(); paintScene.add(new THREE.Mesh(quad, paintMat));
  const liveScene = new THREE.Scene(); liveScene.add(new THREE.Mesh(quad, liveMat));
  let rt = null;

  // 크기·품질
  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5);
  let scale = (opts.scale || 1) * dpr * (lite ? 0.75 : 1);
  { const r0 = canvas.getBoundingClientRect(), px = Math.max(1, r0.width * r0.height), budget = lite ? 0.45e6 : 2.6e6;   // 그리는 점 수 상한
    if (!opts.scale) scale = Math.min(scale, Math.sqrt(budget / px)); }
  const minScale = Math.min(scale, lite ? 0.45 : 0.6);
  const adapt = opts.adapt !== false;
  let W = 1, H = 1, L = layout(1, 1);
  function paint() {
    const bw = Math.max(2, Math.round(W * scale)), bh = Math.max(2, Math.round(H * scale));
    if (!rt || rt.width !== bw || rt.height !== bh) {
      if (rt) rt.dispose();
      rt = new THREE.WebGLRenderTarget(bw, bh, { depthBuffer: false, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter });
    }
    const u = paintMat.uniforms;
    u.uRes.value.set(bw, bh); u.uAspect.value = W / H; u.uH.value = L.h; u.uMoon.value.set(...L.moon);
    renderer.setRenderTarget(rt); renderer.render(paintScene, camera); renderer.setRenderTarget(null);
    liveMat.uniforms.uPaint.value = rt.texture;
  }
  function resize(force) {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    if (!force && w === W && h === H) return;
    W = w; H = h; L = layout(W, H);
    renderer.setSize(Math.round(W * scale), Math.round(H * scale), false);
    const u = liveMat.uniforms; u.uAspect.value = W / H; u.uH.value = L.h; u.uMoon.value.set(...L.moon);
    paint();
    if (opts.onLayout) opts.onLayout();
  }

  // ── 파문·먹·돌 ──
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  const NRS = lite ? 6 : 12;   // 앞 칸은 돌 몫(손 파문이 덮어쓰지 않게), 나머지는 손 몫
  let rs = 0, rp = NRS, ii = 0;
  const addRipple = (wx, wz, amp) => {
    const U = liveMat.uniforms.uRip.value;
    if (amp >= 0.3) { U[rs].set(wx, wz, now(), amp); rs = (rs + 1) % NRS; }
    else { U[rp].set(wx, wz, now(), amp); rp = rp + 1 >= NR ? NRS : rp + 1; }
  };
  const addInk = (sx, sy, size) => { liveMat.uniforms.uInk.value[ii].set(sx, sy, now(), size); ii = (ii + 1) % NI; };
  const toWorld = (sx, sy) => { const z = L.h / Math.max(L.h - sy, 1e-3); return [(sx - 0.5) * (W / H) * z / (2 * L.h), z]; };
  const toScreen = (wx, z, y) => [0.5 + (2 * L.h * wx / z) / (W / H), L.h - L.h / z + 2 * L.h * y / z];

  const stones = [];
  const G = 2.2;
  const cb = { bounce: opts.onBounce || (() => {}), sink: opts.onSink || (() => {}), drop: opts.onDrop || (() => {}) };
  function throwStone({ lateral = 0, V = 3, auto = false } = {}) {
    lateral = Math.max(-0.8, Math.min(0.8, lateral));
    const n = Math.hypot(lateral, 1);
    for (let k = stones.length - 1; k >= 0; k--) if (!stones[k].alive) stones.splice(k, 1);   // 가라앉은 돌부터 치움
    if (stones.length >= NS) return false;   // 날고 있는 돌이 꽉 차면 이번 던지기는 받지 않음
    stones.push({ wx: -lateral * 0.3, z: 0.75, y: 0.30, dx: lateral / n, dz: 1 / n, V: Math.max(1.6, Math.min(4.6, V)), vy: 0.36, n: 0, auto, alive: true, fade: 1 });
  }
  function throwToward(sx, sy) {
    let wx, z;
    if (sy < L.h - 0.004) [wx, z] = toWorld(sx, sy); else { z = 9; wx = (sx - 0.5) * (W / H) * z / (2 * L.h); }
    const lateral = wx / Math.max(z - 0.75, 0.4);
    return throwStone({ lateral, V: 1.8 + Math.hypot(wx, z - 0.75) * 0.34 });
  }
  function swipe(vx, vy) {   // 화면 px/ms
    const sp = Math.hypot(vx, vy) || 1;
    return throwStone({ lateral: (vx / sp) * 0.55, V: 1.5 + sp * 1.5 });
  }
  let lastRip = 0, lastInk = 0, lastDrop = 0;
  const RIP_EVERY = lite ? 0.2 : 0.1, INK_EVERY = lite ? 0.42 : 0.18;   // 칸 수 × 간격 ≈ 먹·파문 수명이라 앞 것이 중간에 끊기지 않음
  function pointer(sx, sy) {
    const t = now();
    if (t - lastInk >= INK_EVERY) { lastInk = t; addInk(sx, sy, lite ? 0.05 : 0.04); }
    if (sy < L.h - 0.01 && t - lastRip >= RIP_EVERY) {
      lastRip = t;
      const [wx, z] = toWorld(sx, sy); addRipple(wx, z, 0.11);
      if (t - lastDrop > 0.35) { lastDrop = t; cb.drop(sx); }
    }
  }
  function stepStones(dt) {
    const uS = liveMat.uniforms.uStone.value, uSh = liveMat.uniforms.uShadow.value;
    for (let k = 0; k < NS; k++) { uS[k].w = 0; uSh[k].w = 0; }
    for (let k = stones.length - 1; k >= 0; k--) {
      const s = stones[k];
      if (s.alive) {
        s.y += s.vy * dt; s.vy -= G * dt; s.wx += s.dx * s.V * dt; s.z += s.dz * s.V * dt;
        if (s.y <= 0 && s.vy < 0) {
          s.y = 0;
          const [sx] = toScreen(s.wx, s.z, 0);
          if (s.V > 0.72 && s.z < 60) {
            s.n++; addRipple(s.wx, s.z, 0.32 + 0.3 * Math.min(1, s.V / 3.2));
            s.vy = 0.215 * s.V * (0.9 + Math.random() * 0.2); s.V *= 0.79 + Math.random() * 0.05;
            const ang = (Math.random() - 0.5) * 0.08, c = Math.cos(ang), sn = Math.sin(ang);
            [s.dx, s.dz] = [s.dx * c - s.dz * sn, s.dx * sn + s.dz * c];
            cb.bounce(s.n, sx, s.V, s.auto);
          } else {
            s.alive = false; addRipple(s.wx, s.z, 0.95); cb.sink(s.n, sx, s.auto);
          }
        }
      } else { s.fade -= dt * 3; }
      if (s.fade <= 0) { stones.splice(k, 1); continue; }
    }
    stones.slice(-NS).forEach((s, k) => {
      if (!s.alive) return;
      const [sx, sy] = toScreen(s.wx, s.z, s.y);
      const r = Math.max(0.0035, 2 * L.h * 0.03 / s.z);
      uS[k].set(sx, sy, r, 1);
      const [hx, hy] = toScreen(s.wx, s.z, 0);
      uSh[k].set(hx, hy, r * 1.25, 0.8 * Math.exp(-s.y * 3));
    });
  }

  // ── 그리기 고리 ──
  let raf = 0, running = false, last = performance.now(), ema = 16.7, slow = 0, frames = 0, fpsN = 0, fpsT = performance.now(), fps = 0;
  function frame(tn) {
    raf = requestAnimationFrame(frame);
    const dtm = Math.min(100, tn - last); last = tn; frames++; fpsN++;
    if (tn - fpsT >= 1000) { fps = Math.round(fpsN * 1000 / (tn - fpsT)); fpsN = 0; fpsT = tn; }
    ema = ema * 0.92 + dtm * 0.08;
    if (adapt && frames > 30) {
      if (ema > 24) { if (++slow > 45 && scale > minScale + 1e-3) { scale = Math.max(minScale, scale * 0.82); slow = 0; resize(true); } }
      else slow = 0;
    }
    const dts = Math.min(0.1, dtm / 1000), n = Math.ceil(dts / 0.034);   // 느린 기기에서도 돌이 제 빠르기로(나눠서 계산)
    for (let k = 0; k < n; k++) stepStones(dts / n);
    liveMat.uniforms.uTime.value = now();
    renderer.render(liveScene, camera);
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize(true);
  liveMat.uniforms.uTime.value = now();
  renderer.render(liveScene, camera);   // 첫 장(한지만)
  let rt0 = 0;
  const ro = new ResizeObserver(() => { clearTimeout(rt0); rt0 = setTimeout(() => resize(false), 120); }); ro.observe(canvas);   // 크기 바꾸는 동안은 한 번만 다시 그림
  let disposed = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); if (!disposed && opts.onLost) opts.onLost(); });

  function dispose() { disposed = true; stop(); ro.disconnect(); try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} }
  return {
    renderer, start, stop, dispose, pointer, throwToward, swipe, throwStone,
    reveal: liveMat.uniforms.uReveal.value,
    get layout() { return { w: W, h: H, horizon: L.h, moon: L.moon }; },
    stats: () => ({ fps, scale: +scale.toFixed(2), lite, frames, ema: +ema.toFixed(1), stones: stones.length }),
  };
}
