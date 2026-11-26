// 밤 호수 소리 — 기본 꺼짐. 켤 때만 소리 파일을 받는다. 잔향은 브라우저에서 만든다.
const FILES = { cr: 'amb_crickets.mp3', wa: 'amb_water.mp3', d1: 'drop_1.mp3', d2: 'drop_2.mp3', d3: 'drop_3.mp3', s1: 'skip_1.mp3', s2: 'skip_2.mp3', sk: 'sink.mp3' };

export function createSound(base = 'snd/') {
  let ctx = null, master, sfx, bed, loading = null, on = false, wanted = false, bedOn = false;
  const buf = {};

  function impulse(c, sec) {   // 잔향(밤 호숫가 정도의 긴 꼬리)
    const len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4);
    }
    return b;
  }
  function init() {
    if (loading) return loading;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return (loading = Promise.reject(new Error('no audio')));
    if (!ctx) ctx = new AC();
    if (master) return (loading = loadAll());
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const rev = ctx.createConvolver(); rev.buffer = impulse(ctx, 2.8);
    const wet = ctx.createGain(); wet.gain.value = 0.32; rev.connect(wet); wet.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master); sfx.connect(rev);
    bed = ctx.createGain(); bed.gain.value = 1; bed.connect(master);
    return (loading = loadAll());
  }
  function loadAll() {
    return Promise.all(Object.entries(FILES).map(async ([k, f]) => {
      if (buf[k]) return;
      const r = await fetch(base + f);
      if (!r.ok) throw new Error(f + ' ' + r.status);
      const ab = await r.arrayBuffer();
      buf[k] = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
    })).catch((e) => { loading = null; throw e; });   // 실패하면 다음 누름에서 다시 받음
  }
  function loopBed(key, gain) {   // mp3 앞뒤 빈칸이 들리지 않게 1.5초씩 겹쳐 이어 붙임
    const b = buf[key], xf = 1.5, g = ctx.createGain();
    g.gain.value = gain; g.connect(bed);
    let next = ctx.currentTime + 0.05;
    const schedule = () => {
      while (next < ctx.currentTime + 4) {
        const s = ctx.createBufferSource(), e = ctx.createGain(), st = next, dur = b.duration;
        s.buffer = b; s.connect(e); e.connect(g);
        e.gain.setValueAtTime(0, st); e.gain.linearRampToValueAtTime(1, st + xf);
        e.gain.setValueAtTime(1, st + dur - xf); e.gain.linearRampToValueAtTime(0, st + dur);
        s.start(st); s.stop(st + dur + 0.05);
        next = st + dur - xf;
      }
    };
    schedule(); setInterval(schedule, 1000);
  }
  async function setOn(v) {
    wanted = v;
    if (v) {
      await init();
      await ctx.resume();
      if (!wanted) return;
      if (!bedOn) { loopBed('cr', 0.30); loopBed('wa', 0.42); bedOn = true; }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
      on = true;
    } else if (ctx) {
      on = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      setTimeout(() => { if (!wanted && ctx.state === 'running') ctx.suspend(); }, 900);
    }
  }
  function play(key, o = {}) {
    if (!on || !buf[key]) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf[key]; s.playbackRate.value = o.rate || 1; g.gain.value = o.gain == null ? 1 : o.gain;
    s.connect(g);
    let out = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan || 0)); g.connect(p); out = p; }
    out.connect(sfx);
    s.start(ctx.currentTime + (o.when || 0));
  }
  // 다른 탭으로 가면 소리도 쉼, 돌아오면 켜 둔 경우만 다시
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (ctx.state === 'running') ctx.suspend(); }
    else if (on) ctx.resume();
  });
  const pick = () => ['d1', 'd2', 'd3'][Math.floor(Math.random() * 3)];
  return {
    setOn,
    get on() { return on; },
    get state() { return ctx ? ctx.state : 'none'; },
    skip(n, sx, V) {
      const pan = (sx - 0.5) * 1.6;
      play(n % 2 ? 's1' : 's2', { rate: 0.92 + n * 0.06, gain: 0.32 + 0.33 * Math.min(1, V / 3.2), pan });
      play(pick(), { rate: 1 + n * 0.05, gain: 0.24, pan, when: 0.03 });
    },
    sink(sx) { play('sk', { rate: 0.95, gain: 0.7, pan: (sx - 0.5) * 1.4 }); },
    drop(sx) { play(pick(), { rate: 0.85 + Math.random() * 0.3, gain: 0.12, pan: (sx - 0.5) * 1.4 }); },
  };
}
