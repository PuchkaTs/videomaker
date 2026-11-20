// Sound design for the Empire Dental reel r1 (npm run audio:empire-r1).
// Writes public/empire-r1/sfx.wav: 48 kHz stereo float, the length of the reel, every effect placed
// at its event in src/empire-r1/cues.json. The source clip already carries the voice and a music bed,
// so this stem is only the moves (whooshes), landings, pops, ticks and the silver shimmers, kept
// well under the voice. Synth recipes follow scripts/kublai-agents-v2-audio.mjs.
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/empire-r1/cues.json'), 'utf8'));
const C = cues.t;
const SR = 48000;
const N = Math.ceil(cues.duration * SR);
const dry = [new Float32Array(N), new Float32Array(N)];
const wet = [new Float32Array(N), new Float32Array(N)];

// Deterministic noise so every run renders the same file.
let seed = 7654321;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

// Mix a mono buffer in at `at` seconds; `pan` is a number or a function of progress 0..1.
const put = (at, mono, gain = 1, pan = 0, send = 0.15) => {
  const start = Math.round(at * SR);
  for (let i = 0; i < mono.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const p = typeof pan === 'function' ? pan(i / mono.length) : pan;
    const [gl, gr] = panGains(p);
    const v = mono[i] * gain;
    dry[0][j] += v * gl;
    dry[1][j] += v * gr;
    wet[0][j] += v * gl * send;
    wet[1][j] += v * gr * send;
  }
};

// ---------- DSP ----------
const biquad = (type, freq, q = 0.707) => {
  const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  else [b0, b1, b2] = [alpha, 0, -alpha];
  const a0 = 1 + alpha;
  return {b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0};
};

const filter = (x, type, freqAt, q = 0.707) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, k = null;
  for (let i = 0; i < x.length; i++) {
    if (i % 32 === 0) k = biquad(type, typeof freqAt === 'function' ? freqAt(i / x.length) : freqAt, q);
    const v = k.b0 * x[i] + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};

// ---------- sounds ----------
// Band-passed noise sweep with a bell-shaped level.
const whoosh = (dur, {from = 400, peak = 3500, to = 800} = {}) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.pow(Math.sin(Math.PI * Math.min(1, (i / n) * 1.15)), 1.6);
  return filter(raw, 'bp', (p) => (p < 0.55 ? from + (peak - from) * (p / 0.55) : peak + (to - peak) * ((p - 0.55) / 0.45)), 1.1);
};
const swipe = (dur = 0.3) => whoosh(dur, {from: 1500, peak: 5200, to: 2600});

// FM bell for the silver shimmers.
const bell = (note, dur = 1.4, index = 2.0, ratio = 3.5) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  const f = midi(note);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * ratio * t) * index * Math.exp(-t / 0.25);
    out[i] = Math.sin(2 * Math.PI * f * t + mod) * Math.exp(-t / (dur * 0.35)) * (t < 0.003 ? t / 0.003 : 1);
  }
  return out;
};

// Pitch-dropping sine blip for chips and pills.
const pop = (hi = true) => {
  const len = Math.round(0.09 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += ((hi ? 820 : 520) * Math.exp(-t * 14) + (hi ? 420 : 260)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.03) * (t < 0.002 ? t / 0.002 : 1);
  }
  return out;
};

const click = (freq = 2600, len = 0.025) => {
  const n = Math.round(len * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = (noise() * 0.6 + Math.sin((2 * Math.PI * freq * i) / SR) * 0.6) * Math.exp(-(i / SR) / (len / 5));
  return filter(raw, 'bp', freq, 1.4);
};

// Low sub thump with a short noise transient: the big «ҮЗ!» and the panel landing.
const impact = () => {
  const n = Math.round(1.2 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (40 + 70 * Math.exp(-t * 10)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.4) * 0.9 + noise() * Math.exp(-t / 0.04) * 0.3;
  }
  return filter(out, 'lp', 2400);
};

// Rubber-stamp hit for «БҮРЭН БОЛОМЖТОЙ».
const stamp = () => {
  const n = Math.round(0.3 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * (95 + 80 * Math.exp(-t * 40)) * t) * Math.exp(-t / 0.08) + noise() * Math.exp(-t / 0.012) * 0.4;
  }
  return out;
};

// Short rising noise into the logo snap.
const riser = (dur) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.pow(i / n, 2.2);
  return filter(raw, 'bp', (p) => 400 + 6000 * p * p, 0.9);
};

// ---------- events (all times from cues.json) ----------
const W = 0.5; // whooshes sit under the landings
const sweepLR = (p) => -0.6 + 1.2 * p;
const sweepRL = (p) => 0.6 - 1.2 * p;

// 0 – 3.9 s: the hook is already on screen (frame 0 is the thumbnail); a shimmer rides the light
// sweep across the logo and «ҮЗ!», then «ҮЗ!» pulses with the camera punch.
[84, 91, 96].forEach((n, i) => put(C.hookSheen + i * 0.14, bell(n, 1.3), 0.08, -0.5 + i * 0.4, 0.4));
put(C.hookBar - 0.18, whoosh(0.22, {from: 600, peak: 3000, to: 400}), W);
put(C.hookBar, impact(), 0.6);
put(C.hookBar, stamp(), 0.35);
put(C.hookOut, swipe(0.4), W * 0.8, sweepLR);

// 3.9 – 13.3 s: question, answer, healing sparkle.
put(C.faq, pop(true), 0.4, -0.5);
put(C.tooth, whoosh(0.35, {from: 700, peak: 3000, to: 1200}), W * 0.6, -0.4);
put(C.tooth + 0.3, pop(false), 0.35, -0.4);
put(C.q1, click(2400), 0.25, 0.2);
put(C.cavity, pop(false), 0.3, -0.4);
put(C.q2, click(2200), 0.25, 0.2);
put(C.gumRed, pop(false), 0.25, -0.4);
put(C.qOut, swipe(0.35), W * 0.7, sweepLR);
put(C.answer, stamp(), 0.6);
put(C.answer, impact(), 0.35);
[88, 91, 96].forEach((n, i) => put(C.heal + 0.3 + i * 0.12, bell(n, 1.1), 0.09, -0.5 + i * 0.25, 0.4));
put(C.answerOut, swipe(0.35), W * 0.7, sweepLR);

// 13.5 – 17.4 s: «Мөрдөх 4 зүйл» and the four bars dropping in, one tick each.
put(C.four, pop(true), 0.35);
[0, 1, 2, 3].forEach((i) => put(C.fourWord + i * 0.09, click(1800 + i * 450, 0.03), 0.4, -0.45 + i * 0.3));

// 17.4 – 51.9 s: card swaps and the facts inside them.
put(C.tip1, whoosh(0.45, {from: 400, peak: 3600, to: 900}), W, sweepLR);
put(C.tip1Title, pop(true), 0.3);
put(C.rule, pop(true), 0.35, 0.3);
put(C.minutes, click(2600), 0.3, 0.2);
put(C.daily, click(3000), 0.3, 0.4);
put(C.gums, pop(false), 0.3, 0.3);
for (const [at, title] of [[C.tip2, C.tip2Title], [C.tip3, C.tip3Title], [C.tip4, C.tip4Title]]) {
  put(at - 0.05, whoosh(0.5, {from: 400, peak: 3800, to: 800}), W, sweepRL);
  put(title, pop(true), 0.3);
}
put(C.floss, pop(true), 0.3, 0.3);
put(C.acid, pop(false), 0.3, 0.2);
put(C.risk, pop(true), 0.32, 0.4);
put(C.checkup, pop(true), 0.3, 0.3);
put(C.prevent, bell(91, 0.9), 0.08, 0.3, 0.35);

// 51.9 – 60.16 s: the bars fold into the mark, the panel rises, the lockup gleams.
put(C.outro, whoosh(0.5, {from: 500, peak: 3800, to: 900}), W, sweepRL);
put(C.merge - 0.05, riser(0.4), 0.35);
put(C.merge + 0.3, click(3400, 0.03), 0.4);
[79, 86, 91].forEach((n, i) => put(C.merge + 0.32 + i * 0.05, bell(n, 1.6), 0.07, -0.3 + i * 0.3, 0.45));
put(C.slogan, swipe(0.3), W * 0.5);
put(C.panel - 0.1, whoosh(0.7, {from: 200, peak: 1800, to: 300}), W * 0.9);
put(C.panel + 0.35, impact(), 0.3);
[84, 88, 91, 96].forEach((n, i) => put(C.sheen + i * 0.1, bell(n, 1.8), 0.07, -0.45 + i * 0.3, 0.5));

// ---------- reverb ----------
const reverb = (x, seedOffset) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round(((d + seedOffset) * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round(((d + seedOffset) * SR) / 44100));
  const out = new Float32Array(x.length);
  for (const d of combs) {
    const buf = new Float32Array(d);
    let idx = 0, lp = 0;
    for (let i = 0; i < x.length; i++) {
      const y = buf[idx];
      lp = y * 0.6 + lp * 0.4;
      buf[idx] = x[i] + lp * 0.82;
      idx = (idx + 1) % d;
      out[i] += y / combs.length;
    }
  }
  for (const d of aps) {
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < x.length; i++) {
      const b = buf[idx];
      buf[idx] = out[i] + b * 0.5;
      out[i] = b - out[i];
      idx = (idx + 1) % d;
    }
  }
  return out;
};
const verb = [reverb(wet[0], 0), reverb(wet[1], 23)];
const mix = [new Float32Array(N), new Float32Array(N)];
for (let ch = 0; ch < 2; ch++) for (let i = 0; i < N; i++) mix[ch][i] = dry[ch][i] + verb[ch][i] * 0.9;

// Peak-normalise the stem to -10 dBFS: the effects stay clearly under the voice (the source clip
// peaks near full scale) and Studio's track volume can trim them further.
let peak = 0;
for (let ch = 0; ch < 2; ch++) for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(mix[ch][i]));
const gain = Math.pow(10, -10 / 20) / peak;

const data = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) {
  data.writeFloatLE(mix[0][i] * gain, i * 8);
  data.writeFloatLE(mix[1][i] * gain, i * 8 + 4);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(3, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 8, 28);
header.writeUInt16LE(8, 32);
header.writeUInt16LE(32, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
const out = join(ROOT, 'public', cues.sfx);
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, Buffer.concat([header, data]));

const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const lufs = probe.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
console.log(`${cues.sfx}: ${cues.duration}s, peak -10 dBFS, integrated ${lufs ?? 'n/a'}`);
