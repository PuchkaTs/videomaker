// Score and sound design for the PythonVariables lesson (npm run audio:python-variables).
// There is no voiceover here (the author records it), so both stems sit low and leave the voice
// range clear: music.wav (F major, 96 BPM, soft electric piano, bass, light drums; every scene starts
// on a downbeat) and sfx.wav (card drops, typing, ticks and crosses, whooshes on the seams), all
// driven by cues.json. 48 kHz stereo float, written to public/python-variables/stems/.
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/python-variables/cues.json'), 'utf8'));
const SR = 48000;
const DUR = cues.duration;
const N = Math.ceil(DUR * SR);
const BEAT = 60 / cues.bpm;
const BAR = BEAT * 4;

const scene = Object.fromEntries(cues.scenes.map((s) => [s.id, s]));
// Absolute time of a scene event.
const at = (id, key) => scene[id].start + (typeof key === 'number' ? key : scene[id].t[key]);

let seed = 20261111;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

const makeBus = () => ({dry: [new Float32Array(N), new Float32Array(N)], wet: [new Float32Array(N), new Float32Array(N)]});
const music = makeBus();
const sfx = makeBus();

// Adds a mono buffer at time `t` with gain, equal-power pan and a reverb send.
const put = (bus, t, mono, gain = 1, pan = 0, send = 0.2) => {
  const start = Math.round(t * SR);
  const l = Math.cos(((pan + 1) * Math.PI) / 4);
  const r = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < mono.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    const v = mono[i] * gain;
    bus.dry[0][j] += v * l;
    bus.dry[1][j] += v * r;
    bus.wet[0][j] += v * l * send;
    bus.wet[1][j] += v * r * send;
  }
};

const buf = (sec, fn) => {
  const out = new Float32Array(Math.round(sec * SR));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / SR, i);
  return out;
};

const onePoleLP = (x, hz) => {
  const a = Math.exp((-2 * Math.PI * hz) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) x[i] = y = (1 - a) * x[i] + a * y;
  return x;
};
const onePoleHP = (x, hz) => {
  const a = Math.exp((-2 * Math.PI * hz) / SR);
  let y = 0;
  let prev = 0;
  for (let i = 0; i < x.length; i++) {
    y = a * (y + x[i] - prev);
    prev = x[i];
    x[i] = y;
  }
  return x;
};

// ---------- instruments ----------

// Soft electric piano: a few sine partials with a bell-ish attack, longer decay low down.
const ep = (f, len, vel = 1) =>
  buf(len, (t) => {
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 1.6) * (t > len - 0.08 ? (len - t) / 0.08 : 1);
    const bell = Math.exp(-t * 9);
    return vel * env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * 2 * f * t) * bell + 0.12 * Math.sin(2 * Math.PI * 3.01 * f * t) * bell + 0.05 * Math.sin(2 * Math.PI * 7.1 * f * t) * Math.exp(-t * 30));
  });

const pluck = (f, len = 0.9) =>
  buf(len, (t) => {
    const env = Math.min(1, t / 0.003) * Math.exp(-t * 5);
    return env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * 2 * f * t) * Math.exp(-t * 12));
  });

const bass = (f, len) =>
  buf(len, (t) => {
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * (t > len - 0.05 ? (len - t) / 0.05 : 1);
    return env * (Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(2 * Math.PI * 2 * f * t));
  });

const kick = () =>
  buf(0.35, (t) => {
    const f = 48 + 70 * Math.exp(-t * 30);
    return Math.exp(-t * 11) * Math.sin(2 * Math.PI * f * t * (1 + 0 * t));
  });

const hat = (open = false) => onePoleHP(buf(open ? 0.18 : 0.05, (t) => noise() * Math.exp(-t * (open ? 22 : 70))), 7000);

const pad = (freqs, len) =>
  buf(len, (t) => {
    const env = Math.min(1, t / 0.8) * Math.min(1, (len - t) / 0.8);
    let v = 0;
    for (const f of freqs) v += Math.sin(2 * Math.PI * f * t + Math.sin(t * 0.7) * 0.4) + 0.25 * Math.sin(2 * Math.PI * f * 1.003 * t);
    return (env * v) / freqs.length;
  });

// ---------- music ----------

// One chord per bar: Fmaj7, Dm7, Bbmaj7, C/E (voicings in MIDI, root separately for the bass).
const CHORDS = [
  {root: 41, notes: [57, 60, 64, 65]},
  {root: 38, notes: [57, 60, 62, 65]},
  {root: 46, notes: [57, 62, 65, 69]},
  {root: 40, notes: [55, 60, 64, 67]},
];
const MOTIF = [72, 74, 77, 79, 77, 74]; // F-major pentatonic answer phrase

const bars = Math.ceil(DUR / BAR);
const sceneAt = (t) => cues.scenes.findLast((s) => s.start <= t + 1e-6).id;

for (let b = 0; b < bars; b++) {
  const t0 = b * BAR;
  if (t0 >= DUR - BAR + 1e-6 && t0 < DUR) {
    // Last bar: the home chord rings out.
    for (const n of [53, 57, 60, 64, 69]) put(music, t0, ep(midi(n), DUR - t0, 0.5), 0.09, (n - 60) / 30, 0.45);
    put(music, t0, bass(midi(29), DUR - t0), 0.25, 0, 0.05);
    continue;
  }
  const id = sceneAt(t0);
  const c = CHORDS[b % 4];
  const intro = id === 'S01';
  const quiet = id === 'S06' || id === 'S11';
  const drums = !intro && !quiet;

  put(music, t0, pad(c.notes.map(midi), BAR + 0.6), 0.05, 0, 0.5);
  // Comp on 1 and the and-of-2.
  for (const [beat, vel] of [[0, 0.8], [1.5, 0.5], [3, 0.35]]) {
    c.notes.forEach((n, k) => put(music, t0 + beat * BEAT + k * 0.008, ep(midi(n), BEAT * 1.6, vel), 0.06, (k - 1.5) * 0.25, 0.35));
  }
  if (!intro) {
    put(music, t0, bass(midi(c.root), BEAT * 1.7), 0.32, 0, 0.03);
    put(music, t0 + 2.5 * BEAT, bass(midi(c.root + 7), BEAT * 1.2), 0.22, 0, 0.03);
  }
  if (drums) {
    put(music, t0, kick(), 0.38, 0, 0.02);
    put(music, t0 + 2 * BEAT, kick(), 0.28, 0, 0.02);
    for (let e = 0; e < 8; e++) put(music, t0 + (e + 0.5) * (BEAT / 2) - BEAT / 4, hat(e === 7), e % 2 ? 0.05 : 0.035, 0.3, 0.1);
  }
  // A short answer phrase on the motif in the intro and the summary.
  if (intro || id === 'S11') {
    MOTIF.forEach((n, k) => put(music, t0 + BEAT * 2 + k * (BEAT / 2), pluck(midi(n)), 0.07, 0.35 - k * 0.1, 0.5));
  }
}

// ---------- sound effects ----------

const tok = () =>
  buf(0.25, (t) => {
    const f = 140 + 120 * Math.exp(-t * 40);
    return Math.exp(-t * 18) * Math.sin(2 * Math.PI * f * t) + 0.5 * Math.exp(-t * 60) * Math.sin(2 * Math.PI * 1700 * t) + (t < 0.004 ? noise() * 0.6 : 0);
  });

const whoosh = (len, up = true) => {
  const x = buf(len, (t) => {
    const p = t / len;
    return noise() * Math.pow(Math.sin(Math.PI * Math.pow(p, up ? 1.4 : 0.7)), 2);
  });
  // Sweep a band by cross-fading two low-passes.
  const lo = onePoleLP(Float32Array.from(x), 900);
  const hi = onePoleHP(onePoleLP(Float32Array.from(x), 5000), 1200);
  return buf(len, (t, i) => {
    const p = t / len;
    const k = up ? p : 1 - p;
    return lo[i] * (1 - k) + hi[i] * k;
  });
};

const key = () => {
  const f = 1800 + noise() * 400;
  return onePoleHP(buf(0.03, (t) => Math.exp(-t * 180) * (noise() * 0.8 + Math.sin(2 * Math.PI * f * t) * 0.5)), 1500);
};

const blip = (f, len = 0.08) => buf(len, (t) => Math.min(1, t / 0.002) * Math.exp(-t * 45) * Math.sin(2 * Math.PI * f * t));

const ding = () => {
  const a = buf(0.6, (t) => Math.exp(-t * 7) * (Math.sin(2 * Math.PI * 1046.5 * t) + 0.2 * Math.sin(2 * Math.PI * 2093 * t)));
  const b = buf(0.8, (t) => Math.exp(-t * 6) * (Math.sin(2 * Math.PI * 1568 * t) + 0.2 * Math.sin(2 * Math.PI * 3136 * t)));
  return {a, b};
};

const buzz = () =>
  onePoleLP(
    buf(0.32, (t) => {
      const gate = t < 0.12 || (t > 0.17 && t < 0.29) ? 1 : 0;
      return gate * Math.exp(-t * 3) * Math.sign(Math.sin(2 * Math.PI * 104 * t));
    }),
    1800,
  );

const clank = () => buf(0.5, (t) => Math.exp(-t * 9) * (Math.sin(2 * Math.PI * 930 * t) + 0.7 * Math.sin(2 * Math.PI * 1410 * t) + 0.5 * Math.sin(2 * Math.PI * 2270 * t)) * 0.4 + (t < 0.01 ? noise() * 0.8 : 0));

const sparkle = () => {
  const out = new Float32Array(Math.round(0.9 * SR));
  [84, 88, 91, 96].forEach((n, k) => {
    const p = pluck(midi(n), 0.6);
    const o = Math.round(k * 0.06 * SR);
    for (let i = 0; i < p.length && o + i < out.length; i++) out[o + i] += p[i] * 0.5;
  });
  return out;
};

const thump = () => buf(0.4, (t) => Math.exp(-t * 9) * Math.sin(2 * Math.PI * (60 + 40 * Math.exp(-t * 25)) * t));

const typing = (t0, text, cps = 16) => {
  for (let i = 0; i < text.length; i++) if (text[i] !== ' ') put(sfx, t0 + i / cps + noise() * 0.008, key(), 0.1 + 0.04 * noise(), 0.15 * noise(), 0.05);
};

const land = (t, pan = 0.2) => put(sfx, t, tok(), 0.45, pan, 0.12);
const exitWhoosh = (t) => put(sfx, t, whoosh(0.55, true), 0.12, 0.5, 0.15);
const ok = (t) => {
  const d = ding();
  put(sfx, t, d.a, 0.11, 0.1, 0.3);
  put(sfx, t + 0.08, d.b, 0.1, 0.1, 0.3);
};
const no = (t) => put(sfx, t, buzz(), 0.09, 0, 0.1);
const pop = (t, f = 880, g = 0.08, pan = 0) => put(sfx, t, blip(f), g, pan, 0.2);

// Seams: a whoosh that peaks on the cut, then a soft low thump.
for (const s of cues.scenes.slice(1)) {
  put(sfx, s.start - 0.7, whoosh(0.9, true), 0.16, -0.2, 0.25);
  put(sfx, s.start + 0.05, thump(), 0.22, 0, 0.1);
}

// S01
put(sfx, at('S01', 'title'), sparkle(), 0.12, -0.3, 0.5);
land(at('S01', 'drop'));
pop(at('S01', 'drop') + 0.5, 990);

// S02
typing(at('S02', 'type1'), 'onoo = 5');
typing(at('S02', 'type2'), 'onoo = 12');
typing(at('S02', 'type3'), 'onoo = 7');
for (const k of ['v1', 'v2', 'v3']) land(at('S02', k));
exitWhoosh(at('S02', 'v2') - 0.75);
exitWhoosh(at('S02', 'v3') - 0.75);
pop(at('S02', 'chip'), 660, 0.1);

// S03: the memory grid pops in from the centre out.
for (let r = -1; r <= 1; r++) for (let c = -2; c <= 3; c++) if (r || c) pop(at('S03', 'pull') + 0.5 + Math.hypot(c, r) * 0.14, 520 + 90 * (c + 2) + 40 * r, 0.05, c / 4);
put(sfx, at('S03', 'glow'), sparkle(), 0.1, 0, 0.5);
pop(at('S03', 'use'), 700, 0.08);

// S04
for (const k of ['c1', 'c2', 'c3']) land(at('S04', k), 0);
for (const k of ['c1', 'c2', 'c3']) put(sfx, at('S04', k) + 0.3, clank(), 0.06, 0, 0.2);
put(sfx, at('S04', 'bounce') - 0.9, whoosh(0.8, false), 0.1, 0.4, 0.15);
put(sfx, at('S04', 'bounce'), clank(), 0.16, 0.4, 0.25);
no(at('S04', 'bounce') + 0.15);

// S05
typing(at('S05', 'in1'), 'urt = int(input())');
typing(at('S05', 'in2'), 'orgon = int(input())');
typing(at('S05', 'calc'), 'talbai = urt * orgon');
typing(at('S05', 'print'), 'print(talbai)');
for (const k of ['v1', 'v2', 'v3']) land(at('S05', k), 0.35);
for (let i = 0; i < 40; i++) pop(at('S05', 'area') + (i / 40) * 1.6, 600 + i * 12, 0.035, 0.35);
pop(at('S05', 'out'), 990, 0.09);
for (let i = 0; i < 3; i++) pop(at('S05', 'three') + i * 0.25, [523, 659, 784][i], 0.1, 0.2 + i * 0.15);

// S06
pop(at('S06', 'name'), 880, 0.08);
put(sfx, at('S06', 'type') + 0.2, thump(), 0.3, 0.3, 0.1);
put(sfx, at('S06', 'type') + 0.2, tok(), 0.25, 0.3, 0.1);

// S07
for (let i = 0; i < 3; i++) pop(at('S07', 'chips') + i * 0.25, 700 + i * 120, 0.08, -0.3 + i * 0.3);
for (const [k, good] of [['r1', true], ['r2', true], ['r3', false], ['r4', true]]) {
  pop(at('S07', k), 600, 0.06);
  (good ? ok : no)(at('S07', k) + 0.55);
}
put(sfx, at('S07', 'note'), sparkle(), 0.08, 0, 0.5);

// S08
land(at('S08', 'b1'), -0.4);
land(at('S08', 'b2'), 0.4);
put(sfx, at('S08', 'letters') - 0.3, whoosh(0.6, true), 0.12, 0, 0.2);
put(sfx, at('S08', 'letters') + 0.45, thump(), 0.25, 0, 0.1);

// S09
typing(at('S09', 'type'), 'print(x1)', 12);
put(sfx, at('S09', 'fly'), whoosh(0.9, true), 0.13, 0.2, 0.2);
ok(at('S09', 'land'));

// S10
for (let i = 0; i < 35; i++) pop(at('S10', 'wall') + (i % 7) * 0.06 + Math.floor(i / 7) * 0.12, 420 + (i % 7) * 70, 0.03, ((i % 7) - 3) / 4);
put(sfx, at('S10', 'tag'), whoosh(1.0, true), 0.13, 0, 0.2);
no(at('S10', 'reject'));
put(sfx, at('S10', 'reject'), thump(), 0.3, 0, 0.1);
pop(at('S10', 'cap2'), 700, 0.07);

// S11
for (let i = 0; i < 3; i++) pop(at('S11', 'labels') + i * 0.3, 784 + i * 100, 0.07);
for (const k of ['b1', 'b2', 'b3', 'b4']) pop(at('S11', k), 880, 0.06);

// ---------- reverb, mixdown, write ----------

// Small Schroeder room (4 combs + 2 allpasses per side) on the wet bus.
const reverb = (x, offset) => {
  const out = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422].map((d) => d + offset);
  for (const d of combs) {
    const line = new Float32Array(d);
    let p = 0;
    let lp = 0;
    for (let i = 0; i < N; i++) {
      const y = line[p];
      lp = y * 0.6 + lp * 0.4;
      line[p] = x[i] + lp * 0.8;
      out[i] += y * 0.25;
      p = (p + 1) % d;
    }
  }
  for (const d of [225 + offset, 556 + offset]) {
    const line = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < N; i++) {
      const b = line[p];
      const v = out[i] + b * 0.5;
      line[p] = v;
      out[i] = b - v * 0.5;
      p = (p + 1) % d;
    }
  }
  return out;
};

const mixdown = (bus) => {
  const l = reverb(bus.wet[0], 0);
  const r = reverb(bus.wet[1], 23);
  return [bus.dry[0].map((v, i) => v + l[i] * 0.5), bus.dry[1].map((v, i) => v + r[i] * 0.5)];
};

const writeWav = (file, [l, r]) => {
  const data = Buffer.alloc(N * 8);
  for (let i = 0; i < N; i++) {
    data.writeFloatLE(l[i], i * 8);
    data.writeFloatLE(r[i], i * 8 + 4);
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

// Integrated loudness of a stem, measured by ffmpeg.
const lufs = (file) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8'});
  return Number(/I:\s+(-?[\d.]+) LUFS/.exec(r.stderr.split('Summary:').pop())[1]);
};

// Music and effects stay well under a voice at about -16 LUFS.
const TARGET = {music: -27, sfx: -28};
const dir = join(ROOT, 'public/python-variables/stems');
mkdirSync(dir, {recursive: true});
for (const [name, bus] of [['music', music], ['sfx', sfx]]) {
  const file = join(dir, `${name}.wav`);
  const st = mixdown(bus);
  writeWav(file, st);
  const gain = Math.pow(10, (TARGET[name] - lufs(file)) / 20);
  for (const ch of st) for (let i = 0; i < N; i++) ch[i] *= gain;
  writeWav(file, st);
  const peak = Math.max(...st.map((ch) => ch.reduce((m, v) => Math.max(m, Math.abs(v)), 0)));
  console.log(`${name}.wav  ${lufs(file).toFixed(1)} LUFS  peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS`);
}
