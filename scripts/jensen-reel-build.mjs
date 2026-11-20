// Timeline and sound for the Jensen reel (npm run build:jensen-reel [-- --short]).
// Reads src/jensen-reel/plan.json and the voice clips in public/jensen-reel/vo/, lays the beats out
// end to end from the real voice lengths, and writes:
//   src/jensen-reel/cues.json     timeline for the composition (cuts, headlines, captions, graphics)
//   public/jensen-reel/stems/     voice.wav (Mongolian VO), source.wav (the film's own audio, ducked
//                                under the VO), music.wav (synth score), sfx.wav (whooshes, hits, ticks)
// With --short it lays out only the beats listed in plan.short (the 90-second cut) and writes
// cues-short.json and stems-short/. Copied from scripts/abundance-reel-build.mjs (that reel is approved
// and stays as it is). New here: every cut carries its own framing (x, zoom, cy), a beat can hold two
// subtitles (a question and its answer), beats carry an "era" tag and a "score" preset, and a missing
// voice clip is laid out at an estimated length with silence (a draft, said in the log).
// 48 kHz stereo float. Each voice clip and each film clip is gained to about -17.5 LUFS.
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const plan = JSON.parse(readFileSync(join(ROOT, 'src/jensen-reel/plan.json'), 'utf8'));
const SHORT = process.argv.includes('--short');
const beats = SHORT ? plan.short.map((id) => plan.beats.find((b) => b.id === id) ?? (() => { throw new Error(`short: no beat ${id}`); })()) : plan.beats;
const CUES_FILE = SHORT ? 'cues-short.json' : 'cues.json';
const STEMS_DIR = SHORT ? 'jensen-reel/stems-short' : 'jensen-reel/stems';
const DRAFT_RATE = 15; // characters per second, for a line with no voice clip yet
let drafts = 0;
const SR = 48000;
const FPS = 60;
const TARGET = -17.5; // LUFS for every voice clip and interview clip
const UNDER_DB = -16; // interview audio under the Mongolian voice
const AFTER_DB = -10; // interview audio after the Mongolian voice ends, until the cut
const BED_DB = -24; // archive footage under the narrator
const MUSIC_LUFS = -30; // score, measured with its ducking
const SFX_PEAK_DB = -8;

const db = (v) => Math.pow(10, v / 20);

// ---------- measuring and decoding ----------
const lufs = (file, args = []) => {
  const err = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args, '-i', file, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  const all = err.match(/I:\s+(-?[\d.]+) LUFS/g);
  if (!all) throw new Error(`No loudness for ${file}`);
  return Number(all.pop().match(/-?[\d.]+/)[0]);
};
const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'}));
const decode = (file, from = 0, dur = null) => {
  const args = ['-v', 'error', '-ss', String(from), ...(dur ? ['-t', String(dur)] : []), '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), 'pipe:1'];
  const buf = execFileSync('ffmpeg', args, {maxBuffer: 1 << 30});
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

// ---------- voice clips ----------
const lines = Object.fromEntries(
  plan.lines.map((line) => {
    const base = join(PUB, 'jensen-reel/vo', line.take ? `${line.id}_${line.take}` : line.id);
    const file = `${base}.mp3`;
    if (!existsSync(file)) {
      // No voice yet: an estimated length, evenly spread caption words, silence.
      drafts++;
      const ws = line.text.split(/\s+/);
      const dur = line.text.length / DRAFT_RATE;
      return [line.id, {...line, file: null, rel: null, dur, gain: 0, words: ws.map((w, k) => ({w, at: (k / ws.length) * dur, end: ((k + 1) / ws.length) * dur - 0.04}))}];
    }
    const meta = JSON.parse(readFileSync(`${base}.json`, 'utf8'));
    return [line.id, {...line, file, rel: file.slice(PUB.length + 1), dur: duration(file), gain: TARGET - lufs(file), words: words(meta.alignment, line.captionMap ?? [])}];
  }),
);

// Words with times from ElevenLabs' character alignment; captionMap swaps spelled-out text back.
function words(al, map) {
  const out = [];
  let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = {w: '', at: al.character_start_times_seconds[i], end: 0};
    cur.w += ch;
    cur.end = al.character_end_times_seconds[i];
  });
  if (cur) out.push(cur);
  const bare = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  for (const [from, to] of map) {
    const seq = from.split(/\s+/).map(bare);
    const i = out.findIndex((_, k) => seq.every((s, j) => out[k + j] && bare(out[k + j].w) === s));
    if (i < 0) throw new Error(`captionMap "${from}" not found`);
    out.splice(i, seq.length, {w: to, at: out[i].at, end: out[i + seq.length - 1].end});
  }
  return out;
}

// Caption chunks: about 22 characters and up to four words, breaking after punctuation.
// The particles «л» and «ч» stay with the word before them, and a word left alone joins the
// chunk before it unless that one ends a sentence.
const text = (ws) => ws.map((x) => x.w).join(' ');
const chunk = (ws) => {
  const out = [];
  let cur = [];
  for (const w of ws) {
    if (cur.length && (cur.length >= 4 || text([...cur, w]).length > 22)) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.,!?…»”"]$/.test(w.w)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  for (let i = 1; i < out.length; i++) {
    while (out[i].length && /^(л|ч)$/i.test(out[i][0].w)) out[i - 1].push(out[i].shift());
    if (!out[i].length) out.splice(i--, 1);
  }
  for (let i = out.length - 1; i > 0; i--) {
    const prev = out[i - 1];
    if (out[i].length === 1 && !/[.!?…]$/.test(prev.at(-1).w) && text([...prev, ...out[i]]).length <= 30) {
      prev.push(...out[i]);
      out.splice(i, 1);
    }
  }
  return out;
};

// ---------- clips ----------
const clips = Object.fromEntries(
  Object.entries(plan.clips).map(([id, c]) => {
    const file = join(PUB, c.file);
    return [id, {...c, path: file, gain: TARGET - lufs(file)}];
  }),
);

// Share a beat's time between its cuts in proportion to len, never past the end of a clip.
const allot = (defs, total) => {
  const avail = defs.map((c) => clips[c.clip].end - c.from - 0.05);
  const lens = defs.map(() => null);
  for (let k = 0; k <= defs.length; k++) {
    const free = defs.map((_, i) => i).filter((i) => lens[i] === null);
    const rem = total - lens.reduce((s, v) => s + (v ?? 0), 0);
    const w = free.reduce((s, i) => s + defs[i].len, 0);
    const over = free.filter((i) => (defs[i].len / w) * rem > avail[i]);
    if (!over.length) {
      for (const i of free) lens[i] = (defs[i].len / w) * rem;
      break;
    }
    for (const i of over) lens[i] = avail[i];
  }
  if (lens.some((v) => v === null) || Math.abs(lens.reduce((s, v) => s + v, 0) - total) > 1e-6) throw new Error(`Not enough footage for ${total.toFixed(2)} s in ${defs.map((d) => d.clip).join(', ')}`);
  return lens;
};

// ---------- timeline ----------
const cues = {
  fps: FPS,
  duration: 0,
  credit: plan.credit,
  stems: STEMS_DIR,
  clips: Object.fromEntries(Object.entries(plan.clips).map(([id, c]) => [id, {file: c.file, start: c.start}])),
  beats: [],
  cuts: [],
  headlines: [],
  labels: [],
  eras: [],
  captions: [],
  graphics: [],
  voices: [],
  sfx: [],
};
const sourceParts = [];
const speech = [];
const sfx = (type, at, extra = {}) => cues.sfx.push({type, at: +at.toFixed(3), ...extra});

let t = 0;
for (const b of beats) {
  const start = t;
  const line = b.voice ? lines[b.voice] : null;
  const vStart = line ? start + (b.lead ?? 0) + (b.pre ?? 0) : null;
  const vEnd = line ? vStart + line.dur : null;
  const end = b.hold ? start + b.hold : vEnd + (b.post ?? 0);
  cues.beats.push({id: b.id, name: b.name, from: +start.toFixed(3), to: +end.toFixed(3), graphic: b.graphic ?? null, score: b.score ?? 'mid'});
  if (b.era) {
    const last = cues.eras.at(-1);
    if (last && last.era === b.era && Math.abs(last.to - start) < 0.01) last.to = +end.toFixed(3);
    else cues.eras.push({era: b.era, from: +start.toFixed(3), to: +end.toFixed(3)});
  }

  if (line) {
    if (line.rel) cues.voices.push({id: line.id, file: line.rel, at: +vStart.toFixed(3), dur: +line.dur.toFixed(3), gainDb: +line.gain.toFixed(2)});
    speech.push([vStart, vEnd]);
    for (const c of chunk(line.words)) {
      cues.captions.push({words: c.map((w) => ({w: w.w, at: +(vStart + w.at).toFixed(3), end: +(vStart + w.end).toFixed(3)}))});
    }
  }

  // A translated line under someone speaking English: words spread evenly over its time.
  for (const sub of [b.subtitle ?? []].flat()) {
    const ws = sub.text.split(' ');
    const a = start + sub.at;
    const step = (sub.to - sub.at) / ws.length;
    cues.captions.push({words: ws.map((w, k) => ({w, at: +(a + k * step).toFixed(3), end: +(a + (k + 1) * step - 0.05).toFixed(3)}))});
  }

  const lens = allot(b.cuts, end - start);
  let at = start;
  b.cuts.forEach((c, i) => {
    const clip = clips[c.clip];
    const dur = lens[i];
    const f0 = Math.round(at * FPS);
    const f1 = Math.round((at + dur) * FPS);
    cues.cuts.push({beat: b.id, clip: c.clip, from: f0, to: f1, trim: Math.round((c.from - clip.start) * FPS), src: c.from, x: c.x, cy: c.cy, zoom: c.zoom});
    if (c.headline) cues.headlines.push({...c.headline, from: +(at + 0.05).toFixed(3), to: +(at + dur).toFixed(3)});
    if (b.source !== 'mute' && !c.mute) {
      const duckAt = line ? vStart - 0.08 : Infinity;
      // Two cuts that continue each other in the film (a camera change mid-sentence) get no fade between them.
      const prev = sourceParts.at(-1);
      const cont = !!prev && prev.clip === clip && Math.abs(prev.from + prev.dur - c.from) < 0.02 && Math.abs(prev.at + prev.dur - at) < 1e-6;
      if (cont) prev.contOut = true;
      sourceParts.push({clip, from: c.from, at, dur, mode: b.source, duckAt, restoreAt: line ? vEnd + 0.15 : Infinity, contIn: cont});
      if (b.source === 'full' || b.source === 'under') speech.push([at, Math.min(at + dur, duckAt)]);
    }
    if (i > 0 || cues.cuts.length > 1) sfx(c.headline?.tone === 'danger' ? 'glitch' : 'whoosh', at);

    at += dur;
  });

  if (b.headline) cues.headlines.push({...b.headline, from: +(start + 0.1).toFixed(3), to: +end.toFixed(3)});

  if (b.label) cues.labels.push({text: b.label, from: +(start + 0.35).toFixed(3), to: +Math.min(start + (b.labelFor ?? 3.6), end).toFixed(3)});

  if (b.graphic) {
    const g = {type: b.graphic, from: +start.toFixed(3), to: +end.toFixed(3), events: []};
    cues.graphics.push(g);
  }
  t = end;
}
cues.duration = +t.toFixed(3);
cues.headlines.sort((a, b) => a.from - b.from);
for (const h of cues.headlines) sfx('tick', h.from);
for (const g of cues.graphics) {
  if (g.type === 'end') sfx('end', g.from);
}
// The turn (plan.turn) gets a riser and a hit; the end card gets a riser.
const beatAt = (id) => cues.beats.find((b) => b.id === id)?.from;
sfx('boom', 0.05);
if (beatAt(plan.turn) != null) {
  sfx('riser', beatAt(plan.turn) - 1.2, {dur: 1.2});
  sfx('boom', beatAt(plan.turn));
}
if (beatAt('END') != null) sfx('riser', beatAt('END') - 1.2, {dur: 1.2});
cues.sfx.sort((a, b) => a.at - b.at);

writeFileSync(join(ROOT, 'src/jensen-reel', CUES_FILE), JSON.stringify(cues, null, 1));
if (drafts) console.log(`DRAFT: ${drafts} line(s) have no voice clip yet; their lengths are estimates and they are silent.`);
console.log(`${CUES_FILE}: ${cues.duration.toFixed(2)} s, ${cues.cuts.length} cuts, ${cues.captions.length} caption chunks`);

// ---------- audio ----------
const N = Math.ceil(cues.duration * SR);
const stereo = () => [new Float32Array(N), new Float32Array(N)];

// Mongolian voice.
const voice = stereo();
for (const v of cues.voices) {
  const [l, r] = decode(join(PUB, v.file));
  const g = db(v.gainDb);
  const s = Math.round(v.at * SR);
  for (let i = 0; i < l.length && s + i < N; i++) {
    voice[0][s + i] += l[i] * g;
    voice[1][s + i] += r[i] * g;
  }
}

// The interview's own audio: full until the Mongolian voice starts, then ducked; archive clips stay low.
const source = stereo();
for (const p of sourceParts) {
  const [l, r] = decode(p.clip.path, p.from - p.clip.start, p.dur + 0.05);
  const s = Math.round(p.at * SR);
  const n = Math.min(l.length, Math.round(p.dur * SR));
  for (let i = 0; i < n && s + i < N; i++) {
    const tt = p.at + i / SR;
    let lvl;
    if (p.mode === 'bed') lvl = BED_DB;
    else {
      const down = Math.min(1, Math.max(0, (tt - p.duckAt) / 0.2));
      const up = Math.min(1, Math.max(0, (tt - p.restoreAt) / 0.3));
      lvl = down * UNDER_DB + up * (AFTER_DB - UNDER_DB);
    }
    const edge = Math.min(1, p.contIn ? 1 : i / (0.012 * SR), p.contOut ? 1 : (n - i) / (0.012 * SR));
    const g = db(p.clip.gain + lvl) * edge;
    source[0][s + i] += l[i] * g;
    source[1][s + i] += r[i] * g;
  }
}

// ---------- synth ----------
let seed = 20261111;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];
const makeBus = () => ({dry: stereo(), wet: stereo()});
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
const reverb = (x, off) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round(((d + off) * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round(((d + off) * SR) / 44100));
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

const pad = (notes, dur, detune = 0, cutoff = 1400) => {
  const rel = 1.2;
  const n = Math.round((dur + rel) * SR);
  const out = new Float32Array(n);
  for (const note of notes) {
    const f = midi(note) * Math.pow(2, detune / 1200);
    for (let h = 1; h <= 6; h++) {
      const w = (2 * Math.PI * f * h) / SR;
      const a = 1 / (h * h * 0.7 + 0.3);
      for (let i = 0; i < n; i++) out[i] += Math.sin(w * i) * a;
    }
  }
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    out[i] *= Math.min(1, tt / 0.8) * Math.min(1, Math.max(0, (dur + rel - tt) / rel));
  }
  return filter(out, 'lp', cutoff);
};
// A dark low drone: detuned saws through a slowly breathing low-pass.
const drone = (note, dur) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (const d of [-7, 0, 6]) {
    const ff = f * Math.pow(2, d / 1200);
    let ph = Math.random === undefined ? 0 : (d + 7) / 20;
    for (let i = 0; i < n; i++) {
      ph += ff / SR;
      out[i] += ((ph % 1) * 2 - 1) / 3;
    }
  }
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    out[i] *= Math.min(1, tt / 0.6) * Math.min(1, (dur - tt) / 0.6);
  }
  return filter(out, 'lp', (p) => 180 + 140 * Math.sin(p * Math.PI * 2 * (dur / 6)) ** 2);
};
const pluck = (note, dur = 0.4) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const mod = Math.sin(2 * Math.PI * f * 2 * tt) * 1.3 * Math.exp(-tt / 0.06);
    out[i] = Math.sin(2 * Math.PI * f * tt + mod) * Math.exp(-tt / (dur * 0.28)) * Math.min(1, tt / 0.002);
  }
  return out;
};
const bass = (note, dur = 0.22, drive = 1.8) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    out[i] = Math.tanh(Math.sin(2 * Math.PI * f * tt) * drive + Math.sin(4 * Math.PI * f * tt) * 0.3) * Math.exp(-tt / 0.09) * Math.min(1, tt / 0.004);
  }
  return filter(out, 'lp', 520);
};
const bell = (note, dur = 1.6, index = 1.2, ratio = 3.5) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const f = midi(note);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const mod = Math.sin(2 * Math.PI * f * ratio * tt) * index * Math.exp(-tt / 0.25);
    out[i] = Math.sin(2 * Math.PI * f * tt + mod) * Math.exp(-tt / (dur * 0.35)) * Math.min(1, tt / 0.003);
  }
  return out;
};
const tick = (freq = 7000, len = 0.035) => {
  const n = Math.round(len * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.exp(-(i / SR) / (len / 6));
  return filter(raw, 'hp', freq);
};
const keyClick = (freq = 2600) => {
  const n = Math.round(0.03 * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = (noise() * 0.6 + Math.sin((2 * Math.PI * freq * i) / SR) * 0.5) * Math.exp(-(i / SR) / 0.005);
  return filter(raw, 'bp', freq, 1.4);
};
const sweep = (dur, {from = 400, peak = 2800, to = 600} = {}) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = noise() * Math.pow(Math.sin(Math.PI * Math.min(1, (i / n) * 1.1)), 1.8);
  return filter(raw, 'bp', (p) => (p < 0.6 ? from + (peak - from) * (p / 0.6) : peak + (to - peak) * ((p - 0.6) / 0.4)), 1.1);
};
const riser = (dur) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    raw[i] = noise() * Math.pow(p, 2.2) + Math.sin(2 * Math.PI * (110 + 500 * p * p) * (i / SR)) * 0.25 * p * p;
  }
  return filter(raw, 'bp', (p) => 300 + 4200 * p * p, 0.8);
};
// Sub impact: a falling sine with a short noise crack on top.
const boom = (dur = 2.4) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    ph += (32 + 78 * Math.exp(-tt * 9)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.6) * Math.min(1, tt / 0.003) + noise() * 0.45 * Math.exp(-tt / 0.035);
  }
  return filter(out, 'lp', 1600);
};
// Digital stutter: gated bursts of band-passed noise.
const glitch = (dur = 0.22) => {
  const n = Math.round(dur * SR);
  const raw = new Float32Array(n);
  const step = Math.round(0.018 * SR);
  for (let i = 0; i < n; i++) {
    const gate = Math.floor(i / step) % 3 !== 1 ? 1 : 0;
    raw[i] = noise() * gate * (1 - i / n);
  }
  return filter(raw, 'bp', (p) => 2400 + 1800 * Math.sin(p * 40), 2.2);
};
const tapeStop = (dur = 0.7) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    ph += (420 * (1 - p) ** 2 + 30) / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) * 0.6 + noise() * 0.3) * (1 - p);
  }
  return filter(out, 'lp', 2200);
};

// ---------- score: D minor, 100 BPM ----------
const BEAT = 60 / 100;
const BAR = BEAT * 4;
const CHORDS = [
  {root: 38, pad: [50, 53, 57, 62]}, // Dm
  {root: 34, pad: [50, 53, 58, 62]}, // Bb
  {root: 31, pad: [50, 55, 58, 62]}, // Gm
  {root: 33, pad: [49, 52, 57, 61]}, // A
];
// A beat names its preset with "score" in plan.json.
const PRESET = {
  dark: {drone: 1, pad: 0.5, pulse: 0, arp: 0, hat: 0.3, bell: 0},
  tense: {drone: 0.9, pad: 0.7, pulse: 0.55, arp: 0.3, hat: 0.5, bell: 0},
  still: {drone: 0.4, pad: 0.7, pulse: 0, arp: 0, hat: 0, bell: 0.6},
  mid: {drone: 0.6, pad: 0.8, pulse: 0.6, arp: 0.6, hat: 0.6, bell: 0},
  drive: {drone: 0.8, pad: 0.9, pulse: 0.9, arp: 1, hat: 1, bell: 0},
  soft: {drone: 0.5, pad: 0.9, pulse: 0.3, arp: 0.4, hat: 0.2, bell: 0.7},
  end: {drone: 0.6, pad: 0.8, pulse: 0, arp: 0, hat: 0, bell: 0.6},
};
const presetAt = (tt) => {
  const beat = [...cues.beats].reverse().find((b) => tt >= b.from) ?? cues.beats[0];
  return PRESET[beat.score] ?? PRESET.mid;
};

const music = makeBus();
for (let k = 0; k * BAR < cues.duration; k++) {
  const at = k * BAR;
  const chord = CHORDS[k % 4];
  const l = presetAt(at + 0.01);
  put(music, at, pad(chord.pad, BAR, -5), 0.045 * l.pad, -0.5, 0.3);
  put(music, at, pad(chord.pad, BAR, 5), 0.045 * l.pad, 0.5, 0.3);
  put(music, at, drone(chord.root - 12 + (chord.root < 36 ? 12 : 0), BAR + 0.6), 0.16 * l.drone, 0, 0.1);
  for (let s = 0; s < 16; s++) {
    const st = at + (s * BEAT) / 4;
    const ls = presetAt(st);
    if (ls.pulse && s % 2 === 0) put(music, st, bass(chord.root, 0.2), 0.22 * ls.pulse * (s % 8 === 0 ? 1 : 0.7), 0, 0);
    if (ls.arp) {
      const tones = [chord.pad[0] + 12, chord.pad[2] + 12, chord.pad[1] + 12, chord.pad[3] + 12];
      put(music, st, pluck(tones[s % 4]), 0.035 * ls.arp * (s % 2 ? 0.7 : 1), s % 2 ? 0.45 : -0.45, 0.35);
    }
    if (ls.hat) put(music, st, tick(), 0.05 * ls.hat * (s % 4 === 2 ? 1.4 : s % 2 ? 0.55 : 0.8), s % 2 ? 0.3 : -0.3, 0.08);
  }
  if (l.bell) [74, 77, 81, 77].forEach((note, i) => put(music, at + i * BEAT, bell(note, 2), 0.04 * l.bell, -0.3 + i * 0.2, 0.5));
}

const fx = makeBus();
const lr = (p) => -0.6 + 1.2 * p;
for (const e of cues.sfx) {
  if (e.type === 'whoosh') put(fx, e.at - 0.22, sweep(0.45), 0.28, lr, 0.25);
  if (e.type === 'glitch') {
    put(fx, e.at - 0.05, glitch(), 0.22, 0, 0.15);
    put(fx, e.at - 0.22, sweep(0.4, {from: 600, peak: 3800, to: 900}), 0.2, lr, 0.2);
  }
  if (e.type === 'boom') put(fx, e.at, boom(), 0.9, 0, 0.25);
  if (e.type === 'tick') put(fx, e.at, keyClick(3200), 0.18, 0.2, 0.2);
  if (e.type === 'pop') {
    put(fx, e.at, boom(0.9), 0.3, -0.4 + e.k * 0.4, 0.2);
    put(fx, e.at, bell(81 + e.k * 2, 0.9, 1.5, 2), 0.06, -0.4 + e.k * 0.4, 0.4);
  }
  if (e.type === 'riser') put(fx, e.at, riser(e.dur), 0.22, lr, 0.3);
  if (e.type === 'end') {
    put(fx, e.at, boom(3.2), 1, 0, 0.35);
    [62, 66, 69, 74].forEach((note, i) => put(fx, e.at + 0.05 * i, bell(note, 3), 0.05, -0.3 + i * 0.3, 0.6));
  }
}

// ---------- mix ----------
// The score ducks to -6 dB under any speech (Mongolian voice or the film at full level): 80 ms down, 400 ms up.
const talking = new Uint8Array(Math.ceil(cues.duration * 100) + 1);
for (const [a, b] of speech) for (let i = Math.max(0, Math.floor(a * 100)); i < Math.min(talking.length, Math.ceil(b * 100) + 8); i++) talking[i] = 1;
const score = flatten(music);
let env = 1;
for (let i = 0; i < N; i++) {
  const target = talking[Math.floor(i / 480)] ? 0.5 : 1;
  env += (target - env) * (target < env ? 1 / (0.08 * SR) : 1 / (0.4 * SR));
  const fade = Math.min(1, i / SR / 0.05) * Math.min(1, (cues.duration - i / SR) / 2.2);
  score[0][i] *= env * fade;
  score[1][i] *= env * fade;
}

const STEMS = join(PUB, STEMS_DIR);
mkdirSync(STEMS, {recursive: true});
const writeWav = (file, [l, r], gain = 1) => {
  const data = Buffer.alloc(N * 8);
  for (let i = 0; i < N; i++) {
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
  writeFileSync(join(STEMS, file), Buffer.concat([h, data]));
};
const peak = ([l, r]) => {
  let p = 0;
  for (let i = 0; i < N; i++) p = Math.max(p, Math.abs(l[i]), Math.abs(r[i]));
  return p;
};

writeWav('voice.wav', voice);
writeWav('source.wav', source);
writeWav('music.wav', score);
writeWav('music.wav', score, db(MUSIC_LUFS - lufs(join(STEMS, 'music.wav'))));
const effects = flatten(fx);
writeWav('sfx.wav', effects, db(SFX_PEAK_DB) / peak(effects));
for (const f of ['voice', 'source', 'music', 'sfx']) {
  const p = join(STEMS, `${f}.wav`);
  console.log(`${f}.wav: ${lufs(p).toFixed(1)} LUFS integrated`);
}
