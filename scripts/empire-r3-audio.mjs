// Sound for the Empire Dental reel 3 (npm run audio:empire-r3). Writes three stems to public/empire-r3/:
//   voice.wav  the doctor, cleaned and raised from -33.7 to -16 LUFS, padded to the reel's length
//   music.wav  an original score synthesised here, ducked under the voice
//   sfx.wav    sound design, every effect placed at its event in src/empire-r3/cues.json
// All 48 kHz stereo float. The score's harmony changes on the reel's story beats: each section holds a
// whole number of beats, so the pulse stays near 100 BPM while chords land on the events.
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/empire-r3/cues.json'), 'utf8'));
const C = cues.t;
const SR = 48000;
const N = Math.ceil(cues.duration * SR);
const PUB = join(ROOT, 'public');

const dbGain = (db) => Math.pow(10, db / 20);
const lufsOf = (file) => {
  const log = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  return {lufs: Number(log.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0]), peak: Number(log.match(/Peak:\s+(-?[\d.]+) dBFS/g).pop().match(/-?[\d.]+/)[0])};
};

// ---------- voice ----------
// The clip is dual mono with a noise floor near -48 dB. High-pass, gentle denoise and a light
// compressor before the gain, so the room does not rise with the voice. The mono file is set to -19
// because duplicating it to two channels adds 3 LU.
const voiceOut = join(PUB, cues.voice);
mkdirSync(dirname(voiceOut), {recursive: true});
// afftdn and alimiter delay the voice by this much, measured against the source; trimmed off after the limiter.
const chainDelay = 0.02696;
const cleanChain = `pan=mono|c0=0.5*c0+0.5*c1,highpass=f=70,afftdn=nr=10:nf=-46,acompressor=threshold=-27dB:ratio=2.2:attack=6:release=140,afade=t=out:st=${cues.voiceEnd - 0.06}:d=0.05`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(PUB, cues.source), '-af', cleanChain, '-ar', String(SR), '-c:a', 'pcm_f32le', voiceOut]);
const raw = lufsOf(voiceOut);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(PUB, cues.source), '-af', `${cleanChain},volume=${(-19 - raw.lufs).toFixed(2)}dB,alimiter=limit=0.8:attack=2:release=50:level=disabled,atrim=start=${chainDelay},asetpts=PTS-STARTPTS,pan=stereo|c0=c0|c1=c0,apad,atrim=end=${cues.duration}`, '-ar', String(SR), '-c:a', 'pcm_f32le', voiceOut]);

// Voice level envelope for ducking (mono, one value per 10 ms).
const voicePcm = execFileSync('ffmpeg', ['-v', 'error', '-i', voiceOut, '-ac', '1', '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
const voice = new Float32Array(voicePcm.buffer, voicePcm.byteOffset, Math.floor(voicePcm.length / 4));
const STEP = SR / 100;
const voiceEnv = new Float32Array(Math.ceil(voice.length / STEP));
for (let i = 0; i < voiceEnv.length; i++) {
  let e = 0;
  for (let j = 0; j < STEP; j++) e += (voice[i * STEP + j] ?? 0) ** 2;
  voiceEnv[i] = Math.sqrt(e / STEP);
}

// ---------- shared synthesis ----------
let seed = 8675309;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

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

const bus = () => ({dry: [new Float32Array(N), new Float32Array(N)], wet: [new Float32Array(N), new Float32Array(N)]});
const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];
const put = (b, at, mono, gain = 1, pan = 0, send = 0.15) => {
  const start = Math.round(at * SR);
  for (let i = 0; i < mono.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const [gl, gr] = panGains(typeof pan === 'function' ? pan(i / mono.length) : pan);
    const v = mono[i] * gain;
    b.dry[0][j] += v * gl;
    b.dry[1][j] += v * gr;
    b.wet[0][j] += v * gl * send;
    b.wet[1][j] += v * gr * send;
  }
};

const reverb = (x, spread, feedback = 0.84) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round(((d + spread) * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round(((d + spread) * SR) / 44100));
  const out = new Float32Array(x.length);
  for (const d of combs) {
    const buf = new Float32Array(d);
    let idx = 0, lp = 0;
    for (let i = 0; i < x.length; i++) {
      const y = buf[idx];
      lp = y * 0.55 + lp * 0.45;
      buf[idx] = x[i] + lp * feedback;
      idx = (idx + 1) % d;
      out[i] += y / combs.length;
    }
  }
  for (const d of aps) {
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < x.length; i++) {
      const v = buf[idx];
      buf[idx] = out[i] + v * 0.5;
      out[i] = v - out[i];
      idx = (idx + 1) % d;
    }
  }
  return out;
};

const writeWav = (file, ch) => {
  const data = Buffer.alloc(N * 8);
  for (let i = 0; i < N; i++) {
    data.writeFloatLE(ch[0][i], i * 8);
    data.writeFloatLE(ch[1][i], i * 8 + 4);
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

const render = (b, wetLevel, feedback) => {
  const v = [reverb(b.wet[0], 0, feedback), reverb(b.wet[1], 23, feedback)];
  const out = [new Float32Array(N), new Float32Array(N)];
  for (let ch = 0; ch < 2; ch++) for (let i = 0; i < N; i++) out[ch][i] = b.dry[ch][i] + v[ch][i] * wetLevel;
  return out;
};

// ---------- instruments ----------
// Felt piano: decaying harmonics, higher ones faster, a soft hammer thump, rounded by a low-pass.
const piano = (note, dur = 2.6, bright = 2600) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  const f = midi(note);
  [1, 0.46, 0.2, 0.09, 0.05, 0.025].forEach((amp, h) => {
    const tau = (dur * 0.42) / (1 + h * 0.7);
    const w = 2 * Math.PI * f * (h + 1) * (1 + h * h * 0.00018);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      out[i] += Math.sin(w * t) * amp * Math.exp(-t / tau);
    }
  });
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = out[i] * Math.min(1, t / 0.005) * Math.min(1, (len - i) / (0.05 * SR)) + noise() * Math.exp(-t / 0.006) * 0.05;
  }
  return filter(out, 'lp', bright);
};

// Warm pad: a few detuned, softly filtered voices with a slow swell.
const pad = (notes, dur) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  for (const n of notes) {
    const f = midi(n);
    for (const det of [-0.11, 0, 0.09]) {
      const ff = f * Math.pow(2, det / 12);
      for (const [h, a] of [[1, 1], [2, 0.28], [3, 0.1]]) {
        const w = 2 * Math.PI * ff * h;
        const ph = det * 40;
        for (let i = 0; i < len; i++) out[i] += Math.sin((w * i) / SR + ph) * a;
      }
    }
  }
  const atk = Math.min(0.9, dur * 0.35) * SR, rel = Math.min(1.1, dur * 0.4) * SR;
  for (let i = 0; i < len; i++) out[i] *= (Math.min(1, i / atk) * Math.min(1, (len - i) / rel)) / (notes.length * 3);
  return filter(out, 'lp', 1500);
};

const bass = (note, dur) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  const f = midi(note);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.28 * Math.sin(4 * Math.PI * f * t)) * Math.min(1, t / 0.012) * Math.exp(-t / (dur * 0.55)) * Math.min(1, (len - i) / (0.06 * SR));
  }
  return out;
};

const mallet = (note, dur = 0.5) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  const f = midi(note);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.32 * Math.sin(2 * Math.PI * f * 3.93 * t) * Math.exp(-t / 0.03)) * Math.exp(-t / (dur * 0.26)) * Math.min(1, t / 0.0015);
  }
  return out;
};

const softKick = () => {
  const len = Math.round(0.26 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (46 + 54 * Math.exp(-t * 26)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.09);
  }
  return out;
};

const shaker = () => {
  const len = Math.round(0.07 * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = noise() * Math.exp(-(i / SR) / 0.016) * Math.min(1, i / (0.004 * SR));
  return filter(out, 'hp', 7200);
};

// ---------- score ----------
const D = {
  Dadd9: [38, 57, 62, 66, 69, 76],
  Dmaj9: [38, 57, 61, 66, 69, 76],
  D: [38, 57, 62, 66, 69, 74],
  Bm9: [35, 57, 61, 62, 66, 69],
  Bm7: [35, 54, 59, 62, 66, 69],
  Bm: [35, 54, 59, 62, 66, 71],
  Gmaj7: [43, 55, 59, 62, 66, 71],
  G: [43, 55, 59, 62, 67, 71],
  A6: [45, 57, 61, 64, 66, 73],
  Asus: [45, 57, 62, 64, 69, 74],
  Em9: [40, 55, 59, 62, 66, 71],
  Cmaj7: [36, 55, 59, 60, 64, 71],
  Am9: [33, 55, 60, 64, 67, 71],
  Fsm: [42, 57, 61, 64, 69, 73],
  Bbmaj7: [34, 53, 57, 62, 65, 69],
};

const S = [
  {at: 0, end: C.world, beats: 10, chords: ['Dadd9', 'Bm9'], style: 'intro'},
  {at: C.world, end: C.some, beats: 13, chords: ['Gmaj7', 'A6', 'Bm7', 'D'], style: 'calm'},
  {at: C.some, end: C.oral, beats: 12, chords: ['Em9', 'Cmaj7', 'Am9', 'Bm7'], style: 'descent'},
  {at: C.oral, end: C.smell, beats: 15, chords: ['Bm', 'G', 'Em9', 'Fsm'], style: 'tense'},
  {at: C.smell, end: C.prevent, beats: 3, chords: ['Bbmaj7'], style: 'swell'},
  {at: C.prevent, end: C.habit, beats: 12, chords: ['D', 'A6', 'Bm7', 'G'], style: 'bright'},
  {at: C.habit, end: C.still, beats: 7, chords: ['Dadd9', 'Gmaj7'], style: 'open'},
  {at: C.still, end: C.doctor, beats: 2, chords: ['Em9'], style: 'doubt'},
  {at: C.doctor, end: C.key, beats: 4, chords: ['Gmaj7', 'Asus'], style: 'warm'},
  {at: C.key, end: C.press, beats: 2, chords: ['Bm'], style: 'tense'},
  {at: C.root, end: C.treat, beats: 2, chords: ['G', 'Asus'], style: 'rise'},
  {at: C.treat, end: C.lock, beats: 2, chords: ['Dadd9'], style: 'open'},
  {at: C.lock, end: cues.duration, beats: 4, chords: ['Dmaj9'], style: 'final'},
];

const music = bus();
const LV = {intro: 0.9, calm: 0.95, descent: 0.9, tense: 1, swell: 1.05, bright: 1.1, open: 1, doubt: 0.85, warm: 1, rise: 1.05, final: 1.25};
for (const s of S) {
  const beat = (s.end - s.at) / s.beats;
  const perChord = s.beats / s.chords.length;
  const lv = LV[s.style];
  s.chords.forEach((name, c) => {
    const [root, ...tones] = D[name];
    const at = s.at + c * perChord * beat;
    const dur = perChord * beat;
    put(music, at - 0.15, pad(tones.slice(0, 5), dur + (s.style === 'final' ? 0.2 : 0.9)), 0.36 * lv, 0, 0.45);
    put(music, at, bass(root + (root < 36 ? 12 : 0), Math.min(dur + 0.4, 3.2)), 0.24 * lv, 0, 0.1);
    const arp = (steps, every, gain, octave = 0, len = 2.8) => {
      for (let i = 0; i * every < perChord; i++) {
        const tone = tones[steps[i % steps.length]] + octave;
        put(music, at + i * every * beat, piano(tone, len), gain * lv * (i % 2 ? 0.8 : 1), -0.3 + (steps[i % steps.length] / 5) * 0.6, 0.42);
      }
    };
    if (s.style === 'intro') arp([1, 2, 3, 4], 2, 0.42);
    if (s.style === 'calm') arp([1, 3, 2, 4], 1, 0.36);
    if (s.style === 'descent') arp([4, 3, 2, 1], 1.5, 0.36, -12);
    if (s.style === 'tense') {
      arp([0, 2, 1, 3], 1, 0.3, -12, 1.5);
      for (let i = 0; i < perChord; i += 1) put(music, at + i * beat, softKick(), 0.13 * lv * (1 + (c / s.chords.length) * 0.5), 0, 0.06);
      for (let i = 0; i < perChord * 2; i++) if (i % 2) put(music, at + (i / 2) * beat, shaker(), 0.05, 0.2, 0.1);
    }
    if (s.style === 'swell') arp([0, 1, 2, 3, 4], 0.75, 0.34, 0, 3);
    if (s.style === 'bright') {
      arp([1, 3, 4, 3], 2, 0.34, 0, 2.4);
      for (let i = 0; i < perChord * 2; i++) {
        const tone = tones[[1, 2, 3, 4, 3, 2][i % 6]] + 12;
        put(music, at + (i / 2) * beat, mallet(tone), 0.17 * lv, i % 2 ? 0.35 : -0.35, 0.34);
      }
      for (let i = 0; i < perChord; i++) put(music, at + i * beat, softKick(), 0.1, 0, 0.05);
      for (let i = 0; i < perChord * 4; i++) put(music, at + (i / 4) * beat, shaker(), i % 2 ? 0.03 : 0.05, 0.2, 0.1);
    }
    if (s.style === 'open') arp([2, 3, 4, 3], 2, 0.34, 0, 3.2);
    if (s.style === 'doubt') arp([3, 1], 1, 0.3, -12, 2);
    if (s.style === 'warm') arp([1, 2, 3], 1, 0.34);
    if (s.style === 'rise') arp([1, 2, 3, 4], 0.5, 0.3, 0, 2);
    if (s.style === 'final') {
      tones.forEach((tone, i) => put(music, at + i * 0.07, piano(tone, 4.2, 3200), 0.28, -0.4 + i * 0.2, 0.55));
      put(music, at, piano(root + 12, 4.2), 0.3, 0, 0.3);
    }
  });
}
const score = render(music, 0.85, 0.85);

// Duck under the voice, with a fast attack and a slow release so it breathes between phrases.
let duck = 0;
const hold = dbGain(-6.5);
for (let i = 0; i < N; i++) {
  if (i % 48 === 0) {
    const e = voiceEnv[Math.min(voiceEnv.length - 1, Math.floor(i / STEP))];
    const want = e > 0.012 ? 1 : 0;
    duck += (want - duck) * (want > duck ? 0.03 : 0.0035);
  }
  const g = 1 + (hold - 1) * duck;
  const fade = Math.min(1, (N - i) / (0.5 * SR)) * Math.min(1, (i + 2400) / 4800);
  score[0][i] *= g * fade;
  score[1][i] *= g * fade;
}
const musicOut = join(PUB, cues.music);
writeWav(musicOut, score);
const scoreLoud = lufsOf(musicOut).lufs;
const scoreGain = dbGain(-24.5 - scoreLoud);
for (let ch = 0; ch < 2; ch++) for (let i = 0; i < N; i++) score[ch][i] *= scoreGain;
writeWav(musicOut, score);

// ---------- sound design ----------
const fx = bus();
const whoosh = (dur, {from = 400, peak = 3200, to = 700} = {}) => {
  const n = Math.round(dur * SR);
  const rawN = new Float32Array(n);
  for (let i = 0; i < n; i++) rawN[i] = noise() * Math.pow(Math.sin(Math.PI * Math.min(1, (i / n) * 1.12)), 1.8);
  return filter(rawN, 'bp', (p) => (p < 0.55 ? from + (peak - from) * (p / 0.55) : peak + (to - peak) * ((p - 0.55) / 0.45)), 0.9);
};
const thud = (f = 82, dur = 0.22, body = 1) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (f + f * 1.4 * Math.exp(-t * 34)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / (dur * 0.34)) * body + noise() * Math.exp(-t / 0.004) * 0.12;
  }
  return filter(out, 'lp', 1400);
};
const knock = (f = 620) => {
  const n = Math.round(0.07 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) * 0.8 + Math.sin(2 * Math.PI * f * 2.3 * t) * 0.3) * Math.exp(-t / 0.014);
  }
  return out;
};
const pop = (hi = 780, lo = 360) => {
  const n = Math.round(0.11 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (lo + hi * Math.exp(-t * 26)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.032) * Math.min(1, t / 0.0015);
  }
  return out;
};
const bloop = (from, to, dur = 0.16) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    ph += (from + (to - from) * p) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.sin(Math.PI * p) ** 0.8;
  }
  return out;
};
const bell = (note, dur = 1.5, index = 1.6) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * 3.5 * t) * index * Math.exp(-t / 0.22);
    out[i] = Math.sin(2 * Math.PI * f * t + mod) * Math.exp(-t / (dur * 0.33)) * Math.min(1, t / 0.002);
  }
  return out;
};
const clink = () => {
  const n = Math.round(0.5 * SR);
  const out = new Float32Array(n);
  for (const [f, a, tau] of [[2350, 1, 0.09], [3720, 0.6, 0.06], [5410, 0.35, 0.04], [7300, 0.2, 0.025]]) {
    for (let i = 0; i < n; i++) out[i] += Math.sin((2 * Math.PI * f * i) / SR) * a * Math.exp(-(i / SR) / tau);
  }
  return out;
};
const scrub = (dur, rate) => {
  const n = Math.round(dur * SR);
  const raw2 = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const stroke = Math.abs(Math.sin(Math.PI * rate * t)) ** 1.6;
    raw2[i] = noise() * (0.25 + stroke) * Math.min(1, t / 0.05) * Math.min(1, (n - i) / (0.1 * SR));
  }
  return filter(filter(raw2, 'hp', 2200), 'lp', 8200);
};
const scrape = (dur) => {
  const n = Math.round(dur * SR);
  const raw3 = new Float32Array(n);
  for (let i = 0; i < n; i++) raw3[i] = noise() * Math.sin((Math.PI * i) / n) ** 0.7;
  return filter(raw3, 'bp', (p) => 900 + 1600 * p, 2.4);
};
const fizz = (dur) => {
  const n = Math.round(dur * SR);
  const raw4 = new Float32Array(n);
  for (let i = 0; i < n; i++) raw4[i] = (noise() > 0.86 ? noise() : 0) * Math.sin((Math.PI * i) / n) ** 0.6;
  return filter(raw4, 'hp', 3200);
};
const swell = (dur, f = 180) => {
  const n = Math.round(dur * SR);
  const raw5 = new Float32Array(n);
  for (let i = 0; i < n; i++) raw5[i] = noise() * Math.pow(i / n, 1.4) * Math.min(1, (n - i) / (0.25 * SR));
  return filter(raw5, 'lp', (p) => f + 1400 * p * p);
};
const riser = (at, end, a, b, gain) => put(fx, at, bloop(a, b, end - at), gain, 0, 0.3);
const LR = (p) => -0.6 + 1.2 * p;
const RL = (p) => 0.6 - 1.2 * p;

// 0 – 5.9: hook letters fall, ХАЛИТОЗ lands with weight.
[...Array(9).keys()].forEach((i) => put(fx, C.pull + 0.02 + i * 0.016 + 0.3, knock(560 + i * 34), 0.13, -0.4 + i * 0.1, 0.12));
[...Array(4).keys()].forEach((i) => put(fx, C.pull + 0.14 + i * 0.02 + 0.3, knock(380 + i * 26), 0.16, -0.2 + i * 0.13, 0.12));
put(fx, C.pull - 0.05, whoosh(0.8, {from: 240, peak: 1500, to: 340}), 0.16, LR);
[...Array(7).keys()].forEach((i) => put(fx, C.halitosis + i * 0.03, thud(74 + i * 3, 0.2, 0.8), 0.3 - i * 0.015, -0.4 + i * 0.13, 0.1));

// Flights.
put(fx, C.leave + 0.1, whoosh(0.85), 0.22, LR, 0.22);
put(fx, C.spin + 0.2, whoosh(0.95, {from: 500, peak: 3600, to: 800}), 0.2, LR, 0.22);
put(fx, C.back - 0.05, whoosh(0.95, {from: 300, peak: 2800, to: 500}), 0.24, RL, 0.22);
put(fx, 31.3, whoosh(1.1, {from: 240, peak: 1500, to: 300}), 0.1, LR, 0.2);
put(fx, C.doctor - 0.02, whoosh(0.7), 0.2, RL, 0.22);
put(fx, 45.72, whoosh(0.95, {from: 280, peak: 2200, to: 400}), 0.18, RL, 0.22);

// Globe, pins, ring, number.
put(fx, C.world, pop(520, 200), 0.28, 0, 0.25);
[...Array(7).keys()].forEach((i) => put(fx, C.research + i * 0.09, pop(1100 + i * 90, 520), 0.13, -0.4 + i * 0.13, 0.25));
put(fx, C.ring - 0.1, whoosh(0.5, {from: 800, peak: 2600, to: 1000}), 0.1, RL, 0.3);
riser(C.n80 - 0.32, C.n80 + 0.1, 300, 720, 0.1);
put(fx, C.n80 + 0.02, pop(760, 300), 0.24, -0.15, 0.25);
riser(C.n95 - 0.14, C.n95 + 0.2, 720, 980, 0.1);
put(fx, C.n95, bell(86, 1.2), 0.1, 0.1, 0.4);
put(fx, C.n95, pop(900, 380), 0.22, 0.2, 0.25);
put(fx, C.mouth - 0.25, bloop(180, 460, 0.32), 0.18, 0, 0.3);

// The tract: the butter bead pops free, lands on the nose; each organ arrives.
put(fx, C.spin - 0.08, pop(980, 420), 0.2, 0, 0.3);
put(fx, C.nose, thud(150, 0.16, 1), 0.3, 0, 0.2);
put(fx, C.nose + 0.2, whoosh(1.2, {from: 500, peak: 1100, to: 420}), 0.06, 0, 0.2);
put(fx, C.gullet, pop(640, 280), 0.2, 0.1, 0.25);
put(fx, C.stomach, thud(92, 0.2, 1), 0.3, 0, 0.2);
for (let i = 0; i < 12; i++) put(fx, C.stomach + 0.3 + i * 0.2, bloop(300 + i * 40, 620 + i * 60, 0.09), 0.06, -0.3 + (i % 5) * 0.15, 0.3);

// Plaque, chain, gas.
for (let i = 0; i < 6; i++) put(fx, C.tooth + i * 0.09, pop(520, 240), 0.13, 0.3, 0.2);
for (let i = 0; i < 7; i++) put(fx, C.tongue + i * 0.07, pop(460, 210), 0.11, -0.3 + i * 0.1, 0.2);
put(fx, C.plaque, pop(620, 260), 0.2, 0, 0.25);
for (let i = 0; i < 9; i++) put(fx, C.margin + 0.1 + i * 0.085, pop(560, 250), 0.1, 0.3 - i * 0.07, 0.2);
put(fx, C.protein - 0.1, bloop(300, 620, 0.2), 0.14, 0, 0.3);
for (let i = 0; i < 8; i++) put(fx, C.split + i * 0.075, knock(1300 + i * 80), 0.15, -0.4 + i * 0.11, 0.2);
put(fx, C.gas, fizz(1.9), 0.17, 0.15, 0.3);
for (let i = 0; i < 16; i++) put(fx, C.gas + i * 0.115, bloop(320 + i * 34, 760 + i * 50, 0.07), 0.07, -0.4 + ((i * 7) % 9) * 0.1, 0.32);
put(fx, C.smell - 0.2, swell(1.3), 0.3, 0, 0.3);

// Cleaning: brush strokes at twice the scrub rate, foam, scraper, sparkle.
put(fx, C.brushOn, scrub(C.brushOff - C.brushOn, 4.5), 0.11, LR, 0.1);
put(fx, C.brushOn + 0.1, fizz(C.brushOff - C.brushOn + 0.7), 0.09, LR, 0.25);
put(fx, C.brushIn, whoosh(0.7, {from: 500, peak: 2100, to: 800}), 0.14, RL, 0.2);
put(fx, C.scraperOn - 0.02, whoosh(0.4, {from: 500, peak: 2400, to: 900}), 0.12, 0, 0.2);
put(fx, C.scraperOn + 0.4, thud(190, 0.09, 1), 0.14, 0, 0.15);
put(fx, C.scraperOn + 0.46, scrape(C.habit - C.scraperOn - 0.6), 0.12, 0, 0.12);
[81, 86, 88, 93, 98].forEach((n, i) => put(fx, C.habit + 0.04 + i * 0.1, bell(n, 1.5), 0.075, -0.45 + i * 0.22, 0.5));

// Doubt, then the doctor.
put(fx, C.still - 0.04, swell(0.7, 120), 0.14, 0, 0.3);
[...Array(4).keys()].forEach((i) => put(fx, C.doctor + 0.55 + i * 0.05, knock(760 + i * 60), 0.05, 0, 0.2));

// The cloche: falls, shuts everything out, the cloud throws it off.
put(fx, C.press - 0.26, whoosh(0.3, {from: 300, peak: 1500, to: 240}), 0.22, 0, 0.1);
put(fx, C.press, thud(62, 0.42, 1), 0.46, 0, 0.14);
put(fx, C.press, clink(), 0.11, 0, 0.4);
put(fx, C.not, bloop(240, 780, 0.2), 0.18, 0, 0.3);
put(fx, C.not + 0.03, whoosh(0.42, {from: 700, peak: 3000, to: 1200}), 0.16, LR, 0.3);
put(fx, C.not + 0.32, clink(), 0.045, 0.5, 0.5);

// The lens finds the cause; treated.
put(fx, C.root - 0.1, whoosh(0.7, {from: 400, peak: 1800, to: 700}), 0.13, RL, 0.25);
put(fx, C.find, bell(88, 1.3, 2.2), 0.13, 0, 0.45);
put(fx, C.find, knock(1650), 0.15, 0, 0.3);
put(fx, C.treat, pop(980, 420), 0.24, 0, 0.3);
[84, 88, 91, 96, 100].forEach((n, i) => put(fx, C.treat + 0.05 + i * 0.07, bell(n, 1.4), 0.075, -0.45 + i * 0.22, 0.5));

// Logo.
put(fx, C.logo - 0.03, whoosh(0.8, {from: 300, peak: 2400, to: 500}), 0.17, 0, 0.25);
put(fx, C.lock, thud(70, 0.36, 1), 0.3, 0, 0.2);
[...Array(6).keys()].forEach((i) => put(fx, C.word + i * 0.05 + 0.3, knock(420 + i * 30), 0.16, -0.4 + i * 0.16, 0.15));
[79, 86, 91, 98].forEach((n, i) => put(fx, C.word + 0.62 + i * 0.09, bell(n, 2), 0.06, -0.4 + i * 0.26, 0.55));

const sfx = render(fx, 0.8, 0.8);
const sfxOut = join(PUB, cues.sfx);
writeWav(sfxOut, sfx);

const report = (name, file) => {
  const m = lufsOf(file);
  console.log(`${name}: ${m.lufs} LUFS, true peak ${m.peak} dBFS`);
};
report('voice', voiceOut);
report('music', musicOut);
report('sfx', sfxOut);
