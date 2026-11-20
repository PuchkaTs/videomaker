import {createContext, useContext} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

export const FPS = 60;

// Global time in seconds. The motion-blur pass overrides it with sub-frame
// sample times, so every animated value must be computed from useT().
export const TimeContext = createContext<number | null>(null);

export const useT = () => {
  const ctx = useContext(TimeContext);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return ctx ?? frame / fps;
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lin = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const backOut = (x: number, k = 1.6) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);

export const ramp = (t: number, a: number, b: number, fn: (x: number) => number = easeOut) => fn(lin(t, a, b));

// Damped spring 0→1 starting at `at` (seconds). freq in Hz, damp is the damping ratio.
export const spring = (t: number, at: number, freq = 2.4, damp = 0.55) => {
  const x = t - at;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (damp >= 1) return 1 - Math.exp(-w * x) * (1 + w * x);
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + ((damp * w) / wd) * Math.sin(wd * x));
};

// Quick rise then exponential decay, for flashes, kicks and impacts.
export const hit = (t: number, at: number, attack = 0.04, decay = 0.35) => {
  const x = t - at;
  if (x < 0) return 0;
  if (x < attack) return x / attack;
  return Math.exp(-(x - attack) / decay);
};

// Deterministic pseudo-random in [0, 1) for scattering letters and particles.
export const rand = (i: number, salt = 0) => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Monotone cubic (Fritsch–Carlson) through [time, value] keys: velocity carries
// through moving keys, and repeated values give true holds without overshoot.
export const track = (keys: readonly (readonly [number, number])[], t: number) => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  // End keys start and finish at rest.
  const m: number[] = [0];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : harmonic(d[i - 1], d[i], keys, i));
  m.push(0);
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const [t0, v0] = keys[i];
  const [t1, v1] = keys[i + 1];
  const h = t1 - t0;
  const s = (t - t0) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * m[i + 1];
};

// Weighted harmonic mean of neighbouring slopes (Fritsch–Butland), which keeps the curve monotone.
const harmonic = (a: number, b: number, keys: readonly (readonly [number, number])[], i: number) => {
  const h0 = keys[i][0] - keys[i - 1][0];
  const h1 = keys[i + 1][0] - keys[i][0];
  const w1 = 2 * h1 + h0;
  const w2 = h1 + 2 * h0;
  return (w1 + w2) / (w1 / a + w2 / b);
};
