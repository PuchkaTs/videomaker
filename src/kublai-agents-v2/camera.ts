import {track} from './time';
import type {Cam} from './world';

type Keys = readonly (readonly [number, number])[];

// One continuous path through every set. Repeated values are holds; everything
// else keeps its velocity through the key (monotone cubic, no overshoot).
const X: Keys = [
  [0, 0], [19.45, 0], [20.35, 3000], [23.1, 3010], [23.7, 3080], [24.7, 3080], [25.6, 3020], [30.4, 3020], [31.4, 3110], [35.3, 3110],
  [36.45, 5800], [55.42, 5800], [55.64, 5835], [56.5, 5850], [60.5, 5820], [63.2, 5800], [70, 5800],
];
const Y: Keys = [
  [0, 0], [27.25, 0], [28.55, 2400], [55.42, 2400], [55.64, 2584], [56.5, 2410], [63.2, 2400], [70, 2400],
];
const Z: Keys = [
  [0, 3600], [0.9, 1150], [1.9, 200], [3.25, 0], [4.3, -2330], [11.3, -2400], [12.1, -2330], [13.6, -2330], [14.4, -2180], [15.5, -2310],
  [19.45, -2350], [20.35, -2300], [23.2, -2330], [23.8, -2150], [24.8, -2150], [25.7, -2310], [27.2, -2340], [28.55, -2300], [35.3, -2350],
  [36.45, -2300], [41.45, -2330], [41.62, -2365], [42.4, -2340], [45.3, -2360], [46.45, -5300], [54, -5360], [55.42, -5370], [55.64, -5800],
  [56.5, -5320], [59.95, -5350], [60.1, -5400], [60.7, -5340], [63.2, -5360], [64.8, -3880], [68.6, -3940], [70, -3940],
];
const YAW: Keys = [
  [0, 0], [3.3, 0], [4.3, -12], [11, 5], [12.1, 0], [13.7, 0], [14.4, 13], [15.3, 10], [15.9, 0], [19.4, -3], [19.9, -14], [20.4, -7],
  [23.1, -2], [23.8, 7], [24.8, 6], [25.8, 0], [27.2, 2], [28.55, 0], [35.3, -4], [35.9, -10], [36.5, -7], [41, 2], [45.2, 7], [46.4, -8],
  [53.5, 0], [55.42, -2], [55.64, -1], [56.5, 14], [59.5, 9], [61, 0], [63.2, -3], [64.8, 0], [70, 0],
];
const PITCH: Keys = [[0, 0], [27.2, 0], [27.85, -16], [28.7, 0], [45.3, 0], [45.9, 6], [46.5, 0], [70, 0]];
const ROLL: Keys = [[0, 0], [3.4, 0], [3.9, -4], [4.4, 0], [19.6, 0], [19.95, 3], [20.4, 0], [45.6, 0], [46, -5], [46.5, 0], [70, 0]];

// Slow handheld-like drift so held shots still breathe; it settles for the final frame.
const drift = (t: number) => {
  const settle = t > 68.4 ? Math.max(0, 1 - (t - 68.4) / 0.6) : 1;
  return {
    x: (Math.sin(t * 0.83) * 16 + Math.sin(t * 0.37 + 1) * 10) * settle,
    y: (Math.sin(t * 0.61 + 2) * 9) * settle,
    yaw: Math.sin(t * 0.47 + 0.5) * 1.1 * settle,
    pitch: Math.sin(t * 0.53 + 1.7) * 0.7 * settle,
  };
};

export const camAt = (t: number): Cam => {
  const d = drift(t);
  return {
    x: track(X, t) + d.x,
    y: track(Y, t) + d.y,
    z: track(Z, t),
    yaw: track(YAW, t) + d.yaw,
    pitch: track(PITCH, t) + d.pitch,
    roll: track(ROLL, t),
  };
};

// Fast object moves that need sub-frame samples even when the camera is calm.
const FLIGHTS: [number, number][] = [
  [0.7, 1.9], [1.95, 2.25], [3.25, 4.35], [11.3, 12.2], [13.7, 14.45], [14.95, 15.55], [15.95, 16.5], [23.1, 24.0], [27.1, 29.1], [30.45, 31.4],
  [35.3, 36.5], [38.0, 38.7], [40.4, 41.1], [45.2, 46.7], [55.4, 55.95], [59.95, 60.55], [63.2, 65.1], [68.3, 68.75],
];

// Motion-blur sample count from the camera's screen speed (px per shutter).
export const blurSamples = (t: number, shutter: number) => {
  const a = camAt(t - shutter / 2);
  const b = camAt(t + shutter / 2);
  const speed =
    Math.abs(b.x - a.x) + Math.abs(b.y - a.y) + Math.abs(b.z - a.z) * 0.35 + (Math.abs(b.yaw - a.yaw) + Math.abs(b.pitch - a.pitch) + Math.abs(b.roll - a.roll)) * 30;
  const fromCam = speed < 4 ? 1 : Math.min(12, Math.ceil(speed / 3));
  const flight = FLIGHTS.some(([s, e]) => t >= s && t <= e) ? 8 : 1;
  return Math.max(fromCam, flight);
};
