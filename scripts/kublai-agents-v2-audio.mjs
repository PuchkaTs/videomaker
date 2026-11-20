// Synthesises the KublaiAgentsV2 score (music + SFX) offline from the same cue sheet
// the animation uses, so picture and sound share one timeline.
//   node scripts/kublai-agents-v2-audio.mjs [narration|dialogue]
// Writes three stems to public/kublai-v2/stems/<version>/: music.wav, sfx.wav and whooshes.wav
// (48 kHz stereo). They share one loudness gain, so together they are the full score; the music
// and SFX duck under that version's voice clips. Voices are separate files, mixed at render time.
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/kublai-agents-v2/cues.json'), 'utf8'));
const C = cues.t;
const VERSION = process.argv[2] ?? 'narration';
if (!['narration', 'dialogue'].includes(VERSION)) throw new Error(`Unknown voice version: ${VERSION}`);
const VOICE_LIST = VERSION === 'dialogue' ? cues.voiceDialogue : cues.voice;

const SR = 48000;
const DUR = cues.duration;
const N = Math.ceil(DUR * SR);
const BEAT = 60 / cues.bpm;
const BAR = BEAT * 4;

// ---------- buses ----------
const bus = () => [new Float32Array(N), new Float32Array(N)];
const B = {drums: bus(), bass: bus(), pad: bus(), keys: bus(), sfx: bus(), whoosh: bus(), verbMusic: bus(), verbSfx: bus(), verbWhoosh: bus()};
// Each stem gets its own reverb send so the stems can be written separately.
const verbFor = (target) => (target === B.sfx ? B.verbSfx : target === B.whoosh ? B.verbWhoosh : B.verbMusic);

// Deterministic noise so every run renders the same file.
let seed = 1234567;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

// Mix a mono buffer into a bus at time `at` (s); `pan` may be a number or a function of progress.
const put = (target, at, mono, gain = 1, pan = 0, send = 0) => {
  const start = Math.round(at * SR);
  for (let i = 0; i < mono.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const p = typeof pan === 'function' ? pan(i / mono.length) : pan;
    const [gl, gr] = panGains(p);
    const v = mono[i] * gain;
    target[0][j] += v * gl;
    target[1][j] += v * gr;
    if (send) {
      verbFor(target)[0][j] += v * gl * send;
      verbFor(target)[1][j] += v * gr * send;
    }
  }
};

// ---------- DSP helpers ----------
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

// Filter with a cutoff that may change over the buffer (recomputed every 32 samples).
const filter = (x, type, freqAt, q = 0.707) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, k = null;
  for (let i = 0; i < x.length; i++) {
    if (i % 32 === 0) k = biquad(type, typeof freqAt === 'function' ? freqAt(i / x.length, i / SR) : freqAt, q);
    const v = k.b0 * x[i] + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
};

const env = (t, a, d, len) => (t < a ? t / a : t < len ? Math.exp(-(t - a) / d) : Math.exp(-(len - a) / d) * Math.max(0, 1 - (t - len) / 0.05));
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));

// ---------- instruments ----------
const kick = (gain = 1) => {
  const len = 0.45 * SR;
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (45 + 115 * Math.exp(-t * 30)) / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) * Math.exp(-t * 7.5) + (t < 0.004 ? noise() * 0.5 * (1 - t / 0.004) : 0)) * gain;
  }
  return out;
};

const clap = () => {
  const len = Math.round(0.3 * SR);
  const raw = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const bursts = [0, 0.011, 0.022].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) / 0.007) : 0), 0) * 0.6 + Math.exp(-t / 0.12) * 0.5;
    raw[i] = noise() * bursts;
  }
  return filter(raw, 'bp', 1300, 0.9);
};

const hat = (open = false) => {
  const len = Math.round((open ? 0.25 : 0.06) * SR);
  const raw = new Float32Array(len);
  for (let i = 0; i < len; i++) raw[i] = noise() * Math.exp(-(i / SR) / (open ? 0.09 : 0.018));
  return filter(raw, 'hp', 7500, 0.8);
};

const snare = (gain = 1) => {
  const len = Math.round(0.22 * SR);
  const raw = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    raw[i] = (noise() * Math.exp(-t / 0.06) * 0.7 + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.04) * 0.5) * gain;
  }
  return filter(raw, 'hp', 400);
};

// Detuned saw voice with a lowpass envelope; used for bass, pads and plucks.
const synth = (note, dur, {voices = 1, detune = 0, cut = 1200, cutEnv = 0, cutDecay = 0.2, attack = 0.005, decay = 9, release = 0.08, sub = 0, q = 0.9, side = 0} = {}) => {
  const len = Math.round((dur + release) * SR);
  const out = [new Float32Array(len), new Float32Array(len)];
  const f = midi(note);
  for (let ch = 0; ch < 2; ch++) {
    const raw = new Float32Array(len);
    for (let v = 0; v < voices; v++) {
      const spread = voices > 1 ? (v / (voices - 1) - 0.5) * 2 : 0;
      const ff = f * Math.pow(2, (spread * detune + (ch ? side : -side)) / 1200);
      let ph = (v * 0.37 + ch * 0.13) % 1;
      for (let i = 0; i < len; i++) {
        ph += ff / SR;
        raw[i] += saw(ph) / Math.sqrt(voices);
      }
    }
    if (sub) for (let i = 0; i < len; i++) raw[i] += Math.sin((2 * Math.PI * f * i) / SR / 2) * sub;
    const filtered = filter(raw, 'lp', (_, t) => cut + cutEnv * Math.exp(-t / cutDecay), q);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const a = t < attack ? t / attack : 1;
      const d = Math.exp(-t / decay);
      const r = t > dur ? Math.max(0, 1 - (t - dur) / release) : 1;
      out[ch][i] = filtered[i] * a * d * r;
    }
  }
  return out;
};

const putStereo = (target, at, st, gain = 1, send = 0) => {
  const start = Math.round(at * SR);
  for (let i = 0; i < st[0].length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    target[0][j] += st[0][i] * gain;
    target[1][j] += st[1][i] * gain;
    if (send) {
      verbFor(target)[0][j] += st[0][i] * gain * send;
      verbFor(target)[1][j] += st[1][i] * gain * send;
    }
  }
};

// FM bell: chimes, the lead motif and success sounds.
const bell = (note, dur = 1.2, index = 2.2, ratio = 3.5) => {
  const len = Math.round(dur * SR);
  const out = new Float32Array(len);
  const f = midi(note);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const e = Math.exp(-t / (dur * 0.35));
    const mod = Math.sin(2 * Math.PI * f * ratio * t) * index * Math.exp(-t / 0.25);
    out[i] = Math.sin(2 * Math.PI * f * t + mod) * e * (t < 0.003 ? t / 0.003 : 1);
  }
  return out;
};

const pop = (hi = true) => {
  const len = Math.round(0.09 * SR);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += ((hi ? 820 : 560) * Math.exp(-t * 14) + (hi ? 420 : 300)) / SR;
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

// Band-passed noise sweep with a bell-shaped level: camera moves and flights.
// Every whoosh, swipe and riser sits about 8 dB under the rest of the SFX, so moves stay subtle.
const WHOOSH_LEVEL = 0.4;

const whoosh = (dur, {from = 400, peak = 3500, to = 800, gain = 1} = {}) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    raw[i] = noise() * Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 1.6) * gain * WHOOSH_LEVEL;
  }
  return filter(raw, 'bp', (p) => (p < 0.55 ? from + (peak - from) * (p / 0.55) : peak + (to - peak) * ((p - 0.55) / 0.45)), 1.1);
};

const riser = (dur) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    ph += (180 + 700 * p * p) / SR;
    raw[i] = (noise() * 0.7 + saw(ph) * 0.25) * Math.pow(p, 2.2);
  }
  return filter(raw, 'bp', (p) => 300 + 6000 * p * p, 0.9);
};

const impact = (gain = 1) => {
  const n = Math.round(1.4 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (38 + 70 * Math.exp(-t * 10)) / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.45) * 0.9 + noise() * Math.exp(-t / 0.05) * 0.35) * gain;
  }
  return filter(out, 'lp', 2500);
};

const stamp = () => {
  const n = Math.round(0.3 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * (95 + 80 * Math.exp(-t * 40)) * t) * Math.exp(-t / 0.08) + noise() * Math.exp(-t / 0.012) * 0.4;
  }
  return out;
};

const buzz = (dur = 0.4) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const sq = Math.sign(Math.sin(2 * Math.PI * 110 * t)) * 0.5 + Math.sign(Math.sin(2 * Math.PI * 116.5 * t)) * 0.5;
    const crushed = Math.round(sq * 4) / 4;
    out[i] = crushed * (0.6 + 0.4 * Math.sign(Math.sin(2 * Math.PI * 18 * t))) * Math.exp(-t / (dur * 0.6));
  }
  return filter(out, 'lp', 3000);
};

const swipe = (dur = 0.3) => whoosh(dur, {from: 1500, peak: 5000, to: 2500, gain: 0.8});

// ---------- arrangement ----------
// F – C – Dm – B♭, one chord per bar.
const PROG = [
  {root: 41, tones: [53, 57, 60, 64]},
  {root: 36, tones: [48, 52, 55, 62]},
  {root: 38, tones: [50, 53, 57, 60]},
  {root: 34, tones: [46, 50, 53, 57]},
];
const chordAt = (t) => PROG[Math.floor(t / BAR) % 4];
const kicks = [];

const section = (t) => {
  if (t < 4) return 'intro';
  if (t < 12) return 'night';
  if (t < 46) return t >= 36 ? 'main2' : 'main';
  if (t < 55.5) return 'test';
  if (t < 56.2) return 'drop';
  if (t < 60) return 'build';
  if (t < 64) return 'full';
  return 'outro';
};

// Pads: one chord per bar, everywhere except the error dropout.
for (let bar = 0; bar < DUR / BAR; bar++) {
  const t = bar * BAR;
  const sec = section(t + 0.01);
  if (sec === 'drop' || t >= 64) continue;
  const ch = chordAt(t);
  const dark = sec === 'intro' || sec === 'night';
  for (const n of ch.tones) {
    const st = synth(n, BAR + 0.05, {voices: 5, detune: 18, side: 6, cut: dark ? 700 : 1500, attack: dark ? 0.9 : 0.25, decay: 20, release: 0.9, q: 0.6});
    putStereo(B.pad, t, st, 0.045, 0.35);
  }
}

// Final chord for the ending, long tail.
for (const n of [41, 53, 57, 60, 64, 67]) putStereo(B.pad, 64.0, synth(n, 5.4, {voices: 5, detune: 16, side: 7, cut: 1700, attack: 0.08, decay: 9, release: 0.6, q: 0.6}), 0.05, 0.5);

// Drums, bass and plucks per 16th note.
const STEP = BEAT / 4;
for (let s = 0; s < DUR / STEP; s++) {
  const t = s * STEP;
  const sec = section(t + 0.001);
  const inBeat = s % 4;
  const beat = Math.floor(s / 4) % 4;
  const ch = chordAt(t);
  const main = sec === 'main' || sec === 'main2' || sec === 'full';
  // Kick
  if ((main && inBeat === 0) || (sec === 'night' && inBeat === 0 && beat % 2 === 0) || (sec === 'test' && inBeat === 0) || (sec === 'build' && inBeat === 0 && t >= 58)) {
    put(B.drums, t, kick(), sec === 'night' ? 0.55 : 0.8);
    kicks.push(t);
  }
  // Clap on 2 and 4
  if (main && inBeat === 0 && (beat === 1 || beat === 3)) put(B.drums, t, clap(), 0.32, 0.05, 0.15);
  // Hats
  if (main && inBeat === 2) put(B.drums, t, hat(beat === 3 && s % 32 > 28), 0.16, 0.25);
  if ((main || sec === 'test') && inBeat % 2 === 1) put(B.drums, t, hat(), 0.06, -0.25);
  if (sec === 'night' && inBeat === 2) put(B.drums, t, hat(), 0.05, 0.3);
  // Bass: 8ths on the root, octave lift on the last 8th of each beat pair.
  if ((main || sec === 'build') && inBeat % 2 === 0) {
    const n = ch.root + (inBeat === 2 && beat % 2 === 1 ? 12 : 0) + 12;
    putStereo(B.bass, t, synth(n, STEP * 1.8, {voices: 2, detune: 8, cut: sec === 'build' ? 300 + 1200 * ((t - 56.2) / 3.8) : 520, cutEnv: 900, cutDecay: 0.08, decay: 0.5, release: 0.04, sub: 0.6}), 0.22);
  }
  if (sec === 'night' && inBeat === 0 && beat % 2 === 0) putStereo(B.bass, t, synth(ch.root + 12, BEAT * 1.8, {cut: 300, cutEnv: 300, decay: 1.2, sub: 0.8, release: 0.2}), 0.2);
  // Pluck arpeggio
  const arpOn = main || sec === 'night' || sec === 'build';
  if (arpOn && (sec !== 'night' || inBeat % 2 === 0)) {
    const tones = ch.tones.concat(ch.tones.map((x) => x + 12));
    const pattern = sec === 'main2' || sec === 'full' ? [0, 2, 4, 6, 7, 5, 3, 1] : [0, 1, 2, 3, 4, 3, 2, 1];
    const n = tones[pattern[s % 8]] + 12;
    const bright = sec === 'night' ? 900 : 1600;
    const st = synth(n, STEP * 0.9, {voices: 2, detune: 6, side: 4, cut: 400, cutEnv: bright, cutDecay: 0.06, decay: 0.18, release: 0.05});
    putStereo(B.keys, t, st, sec === 'night' ? 0.05 : 0.07, 0.3);
    putStereo(B.keys, t + STEP * 3, [st[1], st[0]], sec === 'night' ? 0.02 : 0.03, 0.2);
  }
}

// Bell motif over the comment scene and the fixed re-test.
const MOTIF = [[0, 69], [0.5, 72], [1, 69], [1.5, 67], [2, 67], [2.5, 64], [3, 60], [4, 65], [4.5, 69], [5, 74], [5.5, 72], [6, 70], [6.5, 69], [7, 65]];
for (const start of [28, 60]) for (const [o, n] of MOTIF) put(B.keys, start + o, bell(n + 12, 0.9, 1.4, 2), 0.045, 0.15, 0.4);

// Snare roll into the re-entry.
for (let t = 58; t < 60; ) {
  const p = (t - 58) / 2;
  put(B.drums, t, snare(0.25 + p * 0.5), 0.35, 0, 0.2);
  t += p < 0.5 ? STEP : STEP / 2;
}

// Risers into the big moments.

// ---------- SFX from the cue sheet ----------
const sfx = (at, mono, gain, pan = 0, send = 0.12) => put(B.sfx, at, mono, gain, pan, send);

// Intro letters: tuned ticks rising through the pentatonic scale.
[...'AI агент'].forEach((ch, i) => {
  if (ch === ' ') return;
  sfx(C['intro.letters'] + i * 0.1 + 0.12, bell([65, 67, 69, 72, 74, 77, 79, 81][i], 0.4, 1.2, 3), 0.06, -0.4 + i * 0.12, 0.3);
});
sfx(C['intro.k'], pop(false), 0.25);
sfx(C['intro.punch'], impact(), 0.55, 0, 0.35);
sfx(C['intro.punch'], bell(77, 1.6, 1.8, 2), 0.08, 0, 0.5);
sfx(C['reply.land'], pop(true), 0.22);
sfx(4.0, impact(0.6), 0.3, 0, 0.3);

// Every chat bubble: customer pops higher, AI pops lower with a small sparkle.
const customer = ['reply.q2', 'carousel.q', 'carousel.reply', 'booking.q', 'booking.reply', 'comment.c1', 'comment.reply', 'lead.phone', 'lead.addr', 'fix.q', 'fix.q2'];
const ai = ['reply.a1', 'reply.a2', 'carousel.a', 'booking.a', 'booking.confirm', 'comment.c2', 'comment.a', 'lead.a1', 'lead.a2', 'lead.a3', 'test.a', 'fix.wrong', 'fix.reply', 'fix.right'];
for (const k of customer) sfx(C[k], pop(true), 0.2, 0.25);
for (const k of ai) {
  sfx(C[k], pop(false), 0.22, -0.2);
  if (k !== 'fix.wrong') sfx(C[k] + 0.05, bell(96, 0.5, 0.8, 2), 0.025, -0.3, 0.4);
}
sfx(C['test.send'] + 0.05, pop(true), 0.2, 0.2);
sfx(C['fix.send'] + 0.05, pop(true), 0.2, 0.3);

sfx(C['reply.stamp'], stamp(), 0.4, -0.3);
for (let i = 0; i < 16; i++) sfx(C['reply.timelapse'] + 1.0 * Math.pow(i / 16, 0.6), click(3200, 0.012), 0.08, 0.3);

[0, 1, 2].forEach((i) => sfx(C['carousel.burst'] + 0.1 + i * 0.12, pop(i !== 1), 0.18, -0.4 + i * 0.4));
sfx(C['carousel.docked'], stamp(), 0.2);
sfx(C['carousel.tap'], click(2200), 0.35, 0.3);

for (let i = 0; i < 10; i++) sfx(C['booking.wave'] + i * 0.05, click(3400 + i * 120, 0.015), 0.05, 0.2 + i * 0.05);
[0, 1, 2, 3].forEach((i) => sfx(C['booking.chips'] + i * 0.0625, pop(true), 0.1, 0.1 * i));
sfx(C['booking.tap'], click(2200), 0.35, 0.1);
sfx(C['booking.land'], bell(81, 1.4, 1.6, 3.5), 0.12, 0.5, 0.4);
sfx(C['booking.land'], stamp(), 0.2, 0.5);
sfx(C['booking.check'], bell(88, 0.8, 1, 2), 0.06, 0.5, 0.4);
for (let i = 0; i < 10; i++) sfx(C['booking.exit'] + i * 0.04, click(3000 - i * 100, 0.015), 0.05, 0.4);

sfx(C['comment.planeLand'], pop(false), 0.25, 0.5);

for (let i = 0; i < 6; i++) sfx(C['lead.crm'] + i * 0.07 + 0.12, click(1800 + i * 200, 0.02), 0.12, 0.5);
for (const fill of ['lead.fill1', 'lead.fill2']) {
  sfx(C[fill], bell(84, 0.5, 0.6, 1), 0.07, 0.5, 0.2);
  for (let i = 0; i < 8; i++) sfx(C[fill] + i * 0.035, click(4000, 0.008), 0.04, 0.5);
}
sfx(C['lead.hot'], stamp(), 0.45, 0.5);
sfx(C['lead.hot'], impact(0.5), 0.3, 0.5, 0.3);
sfx(C['lead.toast'], bell(76, 1.0, 1.2, 2), 0.07, 0.5, 0.4);
sfx(C['lead.toast'] + 0.1, bell(83, 1.0, 1.2, 2), 0.06, 0.5, 0.4);

sfx(C['test.land'], impact(0.7), 0.35, 0.2, 0.3);
sfx(C['test.click'], click(2400), 0.3, 0.2);
for (let i = 0; i < 23; i++) sfx(C['test.type'] + (i / 23) * 1.0, click(1800 + ((i * 37) % 7) * 150, 0.015), 0.08, 0.1);
sfx(C['test.send'], click(2400), 0.3, 0.4);
sfx(C['test.connector'], bell(79, 0.8, 0.6, 1), 0.05, 0.4, 0.3);
[0, 1, 2].forEach((i) => sfx(C['test.toggle'] + i * 0.2, click(2600 + i * 400, 0.03), 0.18, 0.6));

sfx(C['fix.error'], buzz(0.45), 0.22, -0.1);
sfx(C['fix.error'], stamp(), 0.35, -0.1);
const stab = synth(40, 0.6, {voices: 3, detune: 25, cut: 1400, decay: 0.4, release: 0.3});
for (const n of [52, 53, 59]) putStereo(B.sfx, C['fix.error'], synth(n, 0.6, {voices: 3, detune: 25, cut: 1600, decay: 0.4, release: 0.3}), 0.06, 0.4);
putStereo(B.sfx, C['fix.error'], stab, 0.08, 0.3);
sfx(C['fix.type'] - 0.08, click(2400), 0.25, 0.5);
for (let i = 0; i < 44; i++) sfx(C['fix.type'] + (i / 44) * 1.05, click(1800 + ((i * 53) % 7) * 150, 0.015), 0.07, 0.5);
sfx(C['fix.send'], click(2400), 0.3, 0.6);
sfx(C['fix.apply'], click(2000), 0.4, 0.5);
sfx(C['fix.apply'], impact(), 0.5, 0, 0.35);
sfx(C['fix.ok'], stamp(), 0.3);
[76, 81, 84, 88].forEach((n, i) => sfx(C['fix.ok'] + i * 0.07, bell(n, 1.2, 1.4, 2), 0.07, -0.3 + i * 0.2, 0.45));

sfx(C['outro.converge'], impact(0.8), 0.35, 0, 0.4);
[69, 72, 76, 81].forEach((n, i) => sfx(C['outro.converge'] + i * 0.05, bell(n + 12, 2.0, 1.0, 2), 0.04, -0.3 + i * 0.2, 0.6));
[65, 69, 72, 76, 79].forEach((n, i) => sfx(C['outro.wordmark'] + i * 0.035, bell(n + 12, 2.4, 0.9, 2), 0.035, -0.4 + i * 0.2, 0.6));

// Whooshes, swipes (W01–W22) and risers (R01–R04), named in cues.json (`whooshes`). Each entry's
// `level` trims that one sound; WHOOSH_LEVEL trims every whoosh, swipe and riser.
// `pan` is fixed, [from, to], or "arc".
const panOf = (pan) => (typeof pan === 'number' ? pan : Array.isArray(pan) ? (p) => pan[0] + (pan[1] - pan[0]) * p : (p) => Math.sin(p * Math.PI) * 0.3);
const whooshSound = (w) => {
  if (w.kind === 'riser') return riser(w.dur).map((v) => v * WHOOSH_LEVEL);
  if (w.kind === 'swipe') return swipe(w.dur);
  return whoosh(w.dur, {from: w.band[0], peak: w.band[1], to: w.band[2], gain: w.shape ?? 1});
};
for (const w of cues.whooshes) put(B.whoosh, C[w.cue] + w.offset, whooshSound(w), w.gain * w.level, panOf(w.pan), w.send ?? 0.12);

// ---------- mixing ----------
// Sidechain: duck bass, pad and keys under every kick.
const duck = new Float32Array(N).fill(1);
for (const k of kicks) {
  const s = Math.round(k * SR);
  for (let i = 0; i < 0.35 * SR && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.55 * Math.exp(-(i / SR) / 0.09));
}

// Music level over time: test-mode filter, error dropout, build, voice duck, fade-out.
const music = [new Float32Array(N), new Float32Array(N)];
for (let ch = 0; ch < 2; ch++) {
  for (let i = 0; i < N; i++) {
    const d = duck[i];
    music[ch][i] = B.drums[ch][i] + (B.bass[ch][i] + B.pad[ch][i]) * d + B.keys[ch][i] * (0.6 + 0.4 * d);
  }
  music[ch] = filter(music[ch], 'lp', (p) => {
    const t = p * DUR;
    if (t < 46) return 18000;
    if (t < 47) return 18000 - 16800 * (t - 46);
    if (t < 55.5) return 1200;
    if (t < 56.2) return 600;
    if (t < 60) return 600 + 9000 * Math.pow((t - 56.2) / 3.8, 2);
    return 18000;
  });
}
// Voice activity from the narration and brand-voice clips listed in cues.json:
// 1 while a clip plays, eased in 0.15 s before it and released over 0.5 s after.
const voiceWindows = VOICE_LIST.map((v) => {
  const start = C[v.cue];
  const len = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(ROOT, 'public', v.file)], {encoding: 'utf8'}));
  return [start, start + len];
});
const VA_RATE = 200;
const voiceActivity = new Float32Array(Math.ceil(DUR * VA_RATE) + 1);
for (let k = 0; k < voiceActivity.length; k++) {
  const t = k / VA_RATE;
  let a = 0;
  for (const [s0, s1] of voiceWindows) {
    if (t >= s0 - 0.15 && t <= s1) a = Math.max(a, Math.min(1, (t - (s0 - 0.15)) / 0.15));
    else if (t > s1 && t < s1 + 0.5) a = Math.max(a, 1 - (t - s1) / 0.5);
  }
  voiceActivity[k] = a;
}
const voiceAt = (t) => voiceActivity[Math.min(voiceActivity.length - 1, Math.round(t * VA_RATE))];

// Music ducks about 9 dB under voice; SFX about 4.4 dB so actions stay audible but behind the narration.
const level = (t) => {
  let g = 1 - 0.65 * voiceAt(t);
  if (t > DUR - 0.8) g *= Math.max(0, (DUR - t) / 0.8);
  return g;
};
const sfxLevel = (t) => (1 - 0.4 * voiceAt(t)) * (t > DUR - 0.8 ? Math.max(0, (DUR - t) / 0.8) : 1);

// Freeverb-style reverb on the send bus.
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
const stereoVerb = (b) => [reverb(b[0], 0), reverb(b[1], 23)];
const verbMusic = stereoVerb(B.verbMusic);
const verbSfx = stereoVerb(B.verbSfx);
const verbWhoosh = stereoVerb(B.verbWhoosh);

// ---------- stems ----------
const stem = () => [new Float32Array(N), new Float32Array(N)];
const STEMS = {music: stem(), sfx: stem(), whooshes: stem()};
for (let ch = 0; ch < 2; ch++) {
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const m = level(t);
    const s = sfxLevel(t);
    STEMS.music[ch][i] = (music[ch][i] + verbMusic[ch][i] * 0.9) * m;
    STEMS.sfx[ch][i] = (B.sfx[ch][i] + verbSfx[ch][i] * 0.9) * s;
    STEMS.whooshes[ch][i] = (B.whoosh[ch][i] + verbWhoosh[ch][i] * 0.9) * s;
  }
}

// 32-bit float WAV: stems can go above full scale without clipping (the render's limiter
// handles the summed mix).
const writeWav = (path, st, gain) => {
  const data = Buffer.alloc(N * 8);
  for (let i = 0; i < N; i++) {
    data.writeFloatLE(st[0][i] * gain, i * 8);
    data.writeFloatLE(st[1][i] * gain, i * 8 + 4);
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
  writeFileSync(path, Buffer.concat([header, data]));
};

// ---------- loudness ----------
// The summed stems are measured once; the same gain goes to every stem so they still add up to
// the full score. Target -18 LUFS, so the voices (about -17.5 LUFS) sit on top.
const total = stem();
for (let ch = 0; ch < 2; ch++) {
  for (let i = 0; i < N; i++) total[ch][i] = STEMS.music[ch][i] + STEMS.sfx[ch][i] + STEMS.whooshes[ch][i];
}
const raw = join(tmpdir(), 'kublai-agents-v2-score-raw.wav');
writeWav(raw, total, 1);
const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const measured = JSON.parse(probe.slice(probe.lastIndexOf('{'), probe.lastIndexOf('}') + 1));
const gainDb = -18 - Number(measured.input_i);
const gain = Math.pow(10, gainDb / 20);

const outDir = join(ROOT, 'public/kublai-v2/stems', VERSION);
mkdirSync(outDir, {recursive: true});
for (const [name, st] of Object.entries(STEMS)) writeWav(join(outDir, `${name}.wav`), st, gain);
console.log(`stems/${VERSION}: music, sfx, whooshes written (${DUR}s, mix ${measured.input_i} LUFS before ${gainDb.toFixed(1)} dB gain, ${kicks.length} kicks)`);
