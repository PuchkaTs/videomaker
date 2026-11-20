// Score and sound design for the Fitzone reel v2 (npm run audio:fitzone-v2).
// The client's clip is voice only and goes silent at 72.7 s, so this writes two stems to
// public/fitzone-v2/stems/: music.wav (D major, 96 BPM, ducked under the voice, with a soft
// heartbeat taken from the logo) and sfx.wav (ticks and sweeps on the line events in cues.json).
// 48 kHz stereo float, the length of the reel. Synth recipes follow scripts/empire-r1-sfx.mjs.
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/fitzone-v2/cues.json'), 'utf8'));
const words = JSON.parse(readFileSync(join(ROOT, 'docs/fitzone/scribe.json'), 'utf8')).words.filter((w) => w.type === 'word');
const C = cues.t;
const SR = 48000;
const N = Math.ceil(cues.duration * SR);

// Downbeats sit on .25 + 2.5k, which lands on the HUD (10.25), the aerial (37.75) and the logo's bars (70.25).
const BEAT = 60 / 96;
const BAR = BEAT * 4;
const FIRST = 0.25;

let seed = 7654321;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

const makeBus = () => ({dry: [new Float32Array(N), new Float32Array(N)], wet: [new Float32Array(N), new Float32Array(N)]});
const music = makeBus();
const sfx = makeBus();

const put = (bus, at, mono, gain = 1, pan = 0, send = 0.15) => {
  const start = Math.round(at * SR);
  for (let i = 0; i < mono.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const p = typeof pan === 'function' ? pan(i / mono.length) : pan;
    const [gl, gr] = panGains(p);
    const v = mono[i] * gain;
    bus.dry[0][j] += v * gl;
    bus.dry[1][j] += v * gr;
    bus.wet[0][j] += v * gl * send;
    bus.wet[1][j] += v * gr * send;
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
      buf[idx] = x[i] + lp * 0.84;
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

const flatten = (bus, send = 0.9) => {
  const verb = [reverb(bus.wet[0], 0), reverb(bus.wet[1], 23)];
  return [0, 1].map((ch) => {
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = bus.dry[ch][i] + verb[ch][i] * send;
    return out;
  });
};

// ---------- instruments ----------
// Warm additive pad: soft harmonics, slow attack, long release.
const pad = (notes, dur, detune = 0) => {
  const rel = 1.1;
  const n = Math.round((dur + rel) * SR);
  const out = new Float32Array(n);
  for (const note of notes) {
    const f = midi(note) * Math.pow(2, detune / 1200);
    for (let h = 1; h <= 5; h++) {
      const w = (2 * Math.PI * f * h) / SR;
      const a = 1 / (h * h * 0.8 + 0.2);
      for (let i = 0; i < n; i++) out[i] += Math.sin(w * i) * a;
    }
  }
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] *= Math.min(1, t / 0.7) * Math.min(1, Math.max(0, (dur + rel - t) / rel));
  }
  return filter(out, 'lp', 1500);
};

const pluck = (note, dur = 0.5) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * 2 * t) * 1.1 * Math.exp(-t / 0.07);
    out[i] = Math.sin(2 * Math.PI * f * t + mod) * Math.exp(-t / (dur * 0.3)) * Math.min(1, t / 0.002);
  }
  return out;
};

const bass = (note, dur = 0.26) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = Math.tanh(Math.sin(2 * Math.PI * f * t) * 1.6) * Math.exp(-t / 0.1) * Math.min(1, t / 0.004);
  }
  return filter(out, 'lp', 420);
};

// One beat of the heart: a soft low thump.
const thump = (dur = 0.34) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (46 + 34 * Math.exp(-t * 26)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.09) * Math.min(1, t / 0.003);
  }
  return out;
};

const bell = (note, dur = 1.4, index = 1.4, ratio = 3.5) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  const f = midi(note);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * ratio * t) * index * Math.exp(-t / 0.2);
    out[i] = Math.sin(2 * Math.PI * f * t + mod) * Math.exp(-t / (dur * 0.35)) * Math.min(1, t / 0.003);
  }
  return out;
};

const sweep = (dur, {from = 500, peak = 2600, to = 700} = {}) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.pow(Math.sin(Math.PI * Math.min(1, (i / n) * 1.1)), 1.8);
  return filter(raw, 'bp', (p) => (p < 0.6 ? from + (peak - from) * (p / 0.6) : peak + (to - peak) * ((p - 0.6) / 0.4)), 1.2);
};

const tick = (freq = 2400, len = 0.03) => {
  const n = Math.round(len * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = (noise() * 0.4 + Math.sin((2 * Math.PI * freq * i) / SR) * 0.8) * Math.exp(-(i / SR) / (len / 5));
  return filter(raw, 'bp', freq, 1.6);
};

const blip = (hi = 1400) => {
  const n = Math.round(0.1 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * hi * t) * Math.exp(-t / 0.028) * Math.min(1, t / 0.002);
  }
  return out;
};

const riser = (dur) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.pow(i / n, 2.4);
  return filter(raw, 'bp', (p) => 300 + 3600 * p * p, 0.9);
};

// ---------- the score ----------
const CHORDS = [
  [47, 54, 57, 61, 62], // Bm9
  [43, 50, 54, 59, 62], // Gmaj7
  [50, 57, 61, 62, 66], // D
  [45, 52, 57, 61, 64], // A
];
const FINAL = [38, 50, 57, 62, 66, 69];

// How full the band is in each stretch of the reel.
const LEVELS = [
  [-3, {pad: 0.7, beat: 0.5, arp: 0, low: 0}], // presenter: pad and heart only
  [10.2, {pad: 0.85, beat: 0.6, arp: 0.7, low: 0}], // first HUD
  [27.7, {pad: 0.7, beat: 0.5, arp: 0.25, low: 0}], // presenter again
  [37.7, {pad: 0.9, beat: 0.7, arp: 0.8, low: 0.6}], // aerials
  [47.7, {pad: 1, beat: 0.8, arp: 1, low: 0.8}], // second HUD
];
const level = (t) => LEVELS.filter(([at]) => t >= at).pop()[1];

const END = FIRST + BAR * 28;
for (let k = -1; FIRST + k * BAR < END; k++) {
  const at = FIRST + k * BAR;
  const chord = CHORDS[((k % 4) + 4) % 4];
  const l = level(at);
  put(music, at, pad(chord, BAR, -4), 0.05 * l.pad, -0.5, 0.25);
  put(music, at, pad(chord, BAR, 4), 0.05 * l.pad, 0.5, 0.25);
  // Lub-dub on every bar: the logo's heartbeat.
  put(music, at, thump(), 0.5 * l.beat, 0, 0.04);
  put(music, at + 0.2, thump(), 0.3 * l.beat, 0, 0.04);
  for (let s = 0; s < 8; s++) {
    const st = at + (s * BEAT) / 2;
    if (l.arp) {
      const tones = [chord[1] + 12, chord[3] + 12, chord[2] + 12, chord[4] + 12];
      put(music, st, pluck(tones[s % 4]), 0.05 * l.arp * (s % 2 ? 0.7 : 1), s % 2 ? 0.4 : -0.4, 0.4);
    }
    if (l.low) put(music, st, bass(chord[0] - 12), 0.2 * l.low * (s % 4 === 0 ? 1 : 0.65), 0, 0);
  }
}
// Brands: the bell line answers the arp.
[74, 78, 81, 86].forEach((note, i) => put(music, FIRST + BAR * 25 + i * BEAT * 2, bell(note, 2.2), 0.05, -0.3 + i * 0.2, 0.5));
// The logo's chord rings out to the end of the reel.
put(music, END, pad(FINAL, cues.duration - END - 1.1, -3), 0.05, -0.5, 0.3);
put(music, END, pad(FINAL, cues.duration - END - 1.1, 3), 0.05, 0.5, 0.3);

// ---------- sound design ----------
const lr = (p) => -0.5 + p;
for (const [a] of cues.hud) put(sfx, a - 0.1, sweep(0.75), 0.3, 0, 0.3);
put(sfx, 28.45, sweep(0.75), 0.26, 0, 0.3);
put(sfx, 37.5, sweep(0.4, {from: 800, peak: 3000, to: 900}), 0.2, 0, 0.3);

const settle = (at, note = 86) => {
  put(sfx, at, blip(1250), 0.14, 0, 0.3);
  put(sfx, at, bell(note, 0.9), 0.05, 0, 0.4);
};
settle(C.years + 0.75);
settle(C.year2011 + 0.75);
settle(C.clients + 0.85);
settle(C.wh + 0.85);
settle(C.show + 0.75);

[C.place1, C.place2, C.place3, C.place4, C.place5, C.place6, C.place7].forEach((at, i) => put(sfx, at, tick(1900 + i * 160), 0.22, -0.3 + i * 0.1, 0.3));
[C.step1, C.step2, C.step3, C.step4, C.step5, C.step6, C.step7].forEach((at, i) => {
  put(sfx, at, tick(2100 + i * 120), 0.24, -0.4 + i * 0.13, 0.25);
  put(sfx, at - 0.04, sweep(0.28, {from: 1200, peak: 3400, to: 1600}), 0.08, lr, 0.2);
});
put(sfx, C.step5 - 0.05, sweep(0.6, {from: 200, peak: 900, to: 260}), 0.24, lr, 0.2);
put(sfx, C.whole, bell(81, 1.2), 0.06, -0.2, 0.4);
put(sfx, C.oneRoof, bell(86, 1.4), 0.06, 0.2, 0.4);
put(sfx, C.wh + 0.2, sweep(0.5, {from: 900, peak: 3000, to: 1200}), 0.08, lr, 0.3);
put(sfx, C.show, sweep(0.6, {from: 900, peak: 3000, to: 1200}), 0.08, lr, 0.3);

[C.see, C.try, C.compare].forEach((at, i) => put(sfx, at, blip(1000 + i * 180), 0.16, i === 1 ? -0.3 : 0.3, 0.3));
put(sfx, C.choose, bell(86, 1.1), 0.07, 0.3, 0.4);
put(sfx, C.choose, blip(1500), 0.14, 0.3, 0.3);
put(sfx, 47.3, riser(2.2), 0.05, lr, 0.3);

put(sfx, C.noNeed, sweep(0.3, {from: 1800, peak: 5000, to: 2500}), 0.14, lr, 0.3);
put(sfx, C.time, tick(1700), 0.24, -0.3, 0.3);
put(sfx, C.money, tick(2100), 0.24, 0.3, 0.3);
put(sfx, C.save, bell(86, 1), 0.06, 0, 0.4);

[C.brand1, C.brand2, C.brand3, C.brand4].forEach((at, i) => put(sfx, at, blip(900 + i * 120), 0.16, -0.3 + i * 0.2, 0.3));
put(sfx, C.official + 0.2, bell(90, 1.2), 0.06, 0.3, 0.4);

put(sfx, C.mark - 0.3, riser(0.85), 0.1, 0, 0.3);
[74, 81, 86, 90].forEach((note, i) => put(sfx, C.mark + 0.55 + i * 0.05, bell(note, 2.4), 0.05, -0.3 + i * 0.2, 0.5));

// ---------- mix ----------
// Duck the score under the voice: 80 ms down, 350 ms back up.
const speaking = new Uint8Array(Math.ceil(cues.duration * 100));
for (const w of words) for (let i = Math.floor(w.start * 100); i < w.end * 100 + 6; i++) speaking[i] = 1;
const duck = (i) => (speaking[Math.floor(i / 480)] ? 0.5 : 1);

const writeStem = (file, [l, r], gainDb) => {
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const gain = Math.pow(10, gainDb / 20) / peak;
  const data = Buffer.alloc(N * 8);
  for (let i = 0; i < N; i++) {
    data.writeFloatLE(l[i] * gain, i * 8);
    data.writeFloatLE(r[i] * gain, i * 8 + 4);
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
  const out = join(ROOT, 'public/fitzone-v2/stems', file);
  mkdirSync(dirname(out), {recursive: true});
  writeFileSync(out, Buffer.concat([header, data]));
  const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  console.log(`${file}: peak ${gainDb} dBFS, integrated ${probe.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop() ?? 'n/a'}`);
};

const score = flatten(music);
let env = 1;
for (let i = 0; i < N; i++) {
  const target = duck(i);
  env += (target - env) * (target < env ? 1 / (0.08 * SR) : 1 / (0.35 * SR));
  // The last chord fades out with the reel, and the first second comes up from nothing.
  const fade = Math.min(1, i / SR / 0.8) * Math.min(1, (cues.duration - i / SR) / 1.6);
  score[0][i] *= env * fade;
  score[1][i] *= env * fade;
}
writeStem('music.wav', score, -11);
writeStem('sfx.wav', flatten(sfx), -13);
