// Offline synth and audio I/O shared by the reel build scripts (48 kHz stereo float).
// Lifted from scripts/agent-video-reel-build.mjs; older build scripts keep their own copies.
import {execFileSync, spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';

export const SR = 48000;
export const db = (v) => Math.pow(10, v / 20);
export const r3 = (v) => +v.toFixed(3);

export const lufs = (file) => {
  const err = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  const all = err.match(/I:\s+(-?[\d.]+) LUFS/g);
  if (!all) throw new Error(`No loudness for ${file}`);
  return Number(all.pop().match(/-?[\d.]+/)[0]);
};
export const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'}));
export const decode = (file) => {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), 'pipe:1'], {maxBuffer: 1 << 30});
  const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  const n = all.length / 2;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    l[i] = all[2 * i];
    r[i] = all[2 * i + 1];
  }
  return [l, r];
};
export const writeWav = (file, [l, r], gain = 1) => {
  const n = l.length;
  const data = Buffer.alloc(n * 8);
  for (let i = 0; i < n; i++) {
    data.writeFloatLE(l[i] * gain, i * 8);
    data.writeFloatLE(r[i] * gain, i * 8 + 4);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28);
  h.writeUInt16LE(8, 32);
  h.writeUInt16LE(32, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};
export const peak = ([l, r]) => {
  let p = 0;
  for (let i = 0; i < l.length; i++) p = Math.max(p, Math.abs(l[i]), Math.abs(r[i]));
  return p;
};

// ---------- synth ----------
let seed = 20261119;
export const reseed = (v) => {
  seed = v >>> 0;
};
export const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
export const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);
export const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];
export const makeBus = (n) => ({n, dry: [new Float32Array(n), new Float32Array(n)], wet: [new Float32Array(n), new Float32Array(n)]});
export const put = (bus, at, mono, gain = 1, pan = 0, send = 0.15) => {
  const start = Math.round(at * SR);
  for (let i = 0; i < mono.length; i++) {
    const j = start + i;
    if (j < 0 || j >= bus.n) continue;
    const p = typeof pan === 'function' ? pan(i / mono.length) : pan;
    const [gl, gr] = panGains(p);
    const v = mono[i] * gain;
    bus.dry[0][j] += v * gl;
    bus.dry[1][j] += v * gr;
    bus.wet[0][j] += v * gl * send;
    bus.wet[1][j] += v * gr * send;
  }
};
export const biquad = (type, freq, q = 0.707) => {
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
export const filter = (x, type, freqAt, q = 0.707) => {
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
export const reverb = (x, off) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round(((d + off) * SR) / 44100 * 1.25));
  const aps = [556, 441, 341, 225].map((d) => Math.round(((d + off) * SR) / 44100));
  const out = new Float32Array(x.length);
  for (const d of combs) {
    const buf = new Float32Array(d);
    let idx = 0, lp = 0;
    for (let i = 0; i < x.length; i++) {
      const y = buf[idx];
      lp = y * 0.55 + lp * 0.45;
      buf[idx] = x[i] + lp * 0.86;
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
export const flatten = (bus, send = 0.9) => {
  const verb = [reverb(bus.wet[0], 0), reverb(bus.wet[1], 23)];
  return [0, 1].map((ch) => {
    const out = new Float32Array(bus.n);
    for (let i = 0; i < bus.n; i++) out[i] = bus.dry[ch][i] + verb[ch][i] * send;
    return out;
  });
};
export const pluck = (note, dur = 1.2, bright = 0.6) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const p = Math.round(SR / midi(note));
  const buf = new Float32Array(p);
  let last = 0;
  for (let i = 0; i < p; i++) {
    last = last * (1 - bright) + noise() * bright;
    buf[i] = last;
  }
  let idx = 0;
  const decay = 0.4985 + Math.min(0.0012, 0.0006 * (60 / note));
  for (let i = 0; i < n; i++) {
    const nxt = (idx + 1) % p;
    const v = (buf[idx] + buf[nxt]) * decay;
    out[i] = buf[idx];
    buf[idx] = v;
    idx = nxt;
  }
  for (let i = 0; i < n; i++) out[i] *= Math.min(1, (n - i) / (0.2 * SR));
  return filter(out, 'lp', 4200);
};
export const pad = (notes, dur, detune = 0, cutoff = 1100) => {
  const rel = 1.4;
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
    const tt = i / SR;
    out[i] *= Math.min(1, tt / 0.6) * Math.min(1, Math.max(0, (dur + rel - tt) / rel));
  }
  return filter(out, 'lp', cutoff);
};
export const bass = (note, dur) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    ph += f / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) + 0.35 * (((ph * 2) % 1) * 2 - 1)) * Math.min(1, tt / 0.008) * Math.exp(-tt / (dur * 0.6));
  }
  return filter(out, 'lp', 420);
};
export const drum = (dur = 0.5, pitch = 52) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    ph += (pitch * (1 + 0.9 * Math.exp(-tt * 34))) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.2) * Math.min(1, tt / 0.002) + noise() * 0.2 * Math.exp(-tt / 0.012);
  }
  return filter(out, 'lp', 1600);
};
export const snare = () => {
  const n = Math.round(0.22 * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    raw[i] = noise() * Math.exp(-tt / 0.05) + Math.sin(2 * Math.PI * 190 * tt) * 0.5 * Math.exp(-tt / 0.03);
  }
  return filter(raw, 'bp', 2200, 0.7);
};
export const bell = (note, dur = 2.4, index = 1.1, ratio = 3.5) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const mod = Math.sin(2 * Math.PI * f * ratio * tt) * index * Math.exp(-tt / 0.3);
    out[i] = Math.sin(2 * Math.PI * f * tt + mod) * Math.exp(-tt / (dur * 0.35)) * Math.min(1, tt / 0.003);
  }
  return out;
};
export const wood = (pitch = 900) => {
  const n = Math.round(0.25 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    out[i] = (Math.sin(2 * Math.PI * pitch * tt) * 0.8 + Math.sin(2 * Math.PI * pitch * 2.7 * tt) * 0.3 + noise() * 0.4 * Math.exp(-tt / 0.004)) * Math.exp(-tt / 0.045);
  }
  return filter(out, 'bp', pitch * 1.2, 1.2);
};
export const air = (dur, {from = 300, peak: top = 1800, to = 500, q = 0.9} = {}) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.pow(Math.sin(Math.PI * Math.min(1, (i / n) * 1.05)), 1.6);
  return filter(raw, 'bp', (p) => (p < 0.6 ? from + (top - from) * (p / 0.6) : top + (to - top) * ((p - 0.6) / 0.4)), q);
};
export const click = (freq = 2600) => {
  const n = Math.round(0.03 * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = (noise() * 0.6 + Math.sin((2 * Math.PI * freq * i) / SR) * 0.5) * Math.exp(-(i / SR) / 0.005);
  return filter(raw, 'bp', freq, 1.4);
};

