import type {CSSProperties, ReactNode} from 'react';
import {clamp01, easeIn, easeInOut, hit, ramp, spring, track, useT} from '../kublai-agents-v2/time';
import cues from './cues.json';

// Shared pieces for the Empire Dental reel: brand colours, the footage camera, kinetic letters
// and the slanted "Empire bar" shape that every card is cut from.

export const C = cues.t;
export const DURATION_S = cues.duration;
export const W = 1080;
export const H = 1920;

// Navy and silver come from the logo EPS (CMYK .82 .77 .56 .73 ≈ #0E1224); ice blue is the one accent.
export const COL = {
  navy: '#0E1224',
  navy2: '#1A2244',
  white: '#F7F9FC',
  silver: '#C9CFD9',
  dim: '#8E97A8',
  ice: '#8FD8FF',
  tooth: '#FAFBFD',
  cavity: '#4A3115',
  amber: '#D08A2E',
  gum: '#E0566D',
  gumHealthy: '#F2A7B5',
};
export const SILVER = 'linear-gradient(105deg, #FFFFFF 0%, #E3E7EE 28%, #9AA3B3 50%, #F4F6F9 66%, #B5BCC9 100%)';
export const FONT = "'Inter', 'Noto Sans', Arial, sans-serif";

// The strokes of the Empire mark lean so that their ends run at about 60°: the horizontal offset
// of a bar's end is 0.58 × its height.
export const SLANT = 0.58;

export const mixColor = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp01(k)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

// ---------- camera on the footage ----------
// One continuous drift through the whole reel (scale, pan, roll) with spring punches on «ҮЗ!», the
// answer and each tip title. The overlays read the same camera for parallax. Frame 0 is the
// thumbnail, so the camera starts level and sharp and only then begins its slow push.
const S_KEYS = [[0, 1.04], [3.9, 1.06], [7.0, 1.085], [11.9, 1.07], [13.4, 1.05], [17.4, 1.065], [33.0, 1.1], [37.0, 1.065], [43.7, 1.1], [51.7, 1.08], [55.4, 1.0], [60.2, 1.025]] as const;
const X_KEYS = [[0, 0], [3.9, -14], [11.9, 12], [17.4, -10], [33.0, 14], [37.0, -12], [43.7, 12], [51.7, -6], [60.2, 0]] as const;
const Y_KEYS = [[0, 0], [12.0, 10], [33.0, -8], [51.7, 0], [60.2, -12]] as const;
const R_KEYS = [[0, 0], [17.4, 0.45], [33.0, -0.4], [43.7, 0.4], [51.7, 0], [60.2, 0]] as const;

export type Cam = {s: number; x: number; y: number; r: number; focus: number};

const punch = (t: number, at: number, amp: number) => amp * hit(t, at, 0.07, 0.45);

export const camAt = (t: number): Cam => ({
  s:
    track(S_KEYS, t) +
    punch(t, C.hookBar, 0.02) +
    punch(t, C.answer, 0.05) +
    punch(t, C.tip1Title, 0.025) +
    punch(t, C.tip2Title, 0.025) +
    punch(t, C.tip3Title, 0.025) +
    punch(t, C.tip4Title, 0.025),
  x: track(X_KEYS, t),
  y: track(Y_KEYS, t),
  r: track(R_KEYS, t),
  // Sharp from frame 0; the footage softens only behind the closing logo panel.
  focus: 3 * ramp(t, C.panel, C.panel + 1.2, easeInOut),
});

// Sub-frame motion-blur samples: only while overlays fly, so held text stays sharp.
export const blurSamples = (t: number) => (cues.flights.some(([a, b]) => t >= a && t <= b) ? 6 : 1);

export const during = (t: number, a: number, b: number) => t >= a && t <= b;

// ---------- kinetic letters ----------
type LettersProps = {
  text: string;
  // Omit `at` for text that is already in place on the first frame (the thumbnail hook).
  at?: number;
  // A white light band that sweeps across silver letters, starting at this time.
  sheenAt?: number;
  out?: number;
  size: number;
  weight?: number;
  silver?: boolean;
  color?: string;
  stagger?: number;
  tracking?: number;
  align?: 'center' | 'flex-start';
  // Letters also gain weight as they land (300 → weight).
  grow?: boolean;
  style?: CSSProperties;
};

// Each letter falls in from depth, tipping forward like a card, and settles with a little overshoot.
// On exit the letters peel off up and to the right, along the slant of the brand bars.
export const Letters = ({text, at, sheenAt, out, size, weight = 800, silver = false, color = COL.white, stagger = 0.022, tracking = -0.01, align = 'center', grow = false, style}: LettersProps) => {
  const t = useT();
  // The sweep travels across the whole line, letter by letter, as one band.
  const band = sheenAt === undefined ? -1 : ramp(t, sheenAt, sheenAt + 0.9, easeInOut);
  const total = text.replace(/ /g, '').length;
  let i = 0;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align, columnGap: size * 0.26, perspective: 900, fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.05, letterSpacing: `${tracking}em`, ...style}}>
      {text.split(' ').map((word, wi) => (
        <span key={wi} style={{display: 'inline-flex', whiteSpace: 'nowrap'}}>
          {[...word].map((ch) => {
            const idx = i++;
            const k = at === undefined ? 1 : spring(t, at + idx * stagger, 2.3, 0.62);
            const o = out === undefined ? 0 : ramp(t, out + idx * stagger * 0.45, out + idx * stagger * 0.45 + 0.34, easeIn);
            // Position of the light band relative to this letter, in percent of its width.
            const p = (band * (total + 4) - 2 - idx) * 100;
            const glint = band > 0 && band < 1 ? `linear-gradient(105deg, rgba(255,255,255,0) ${p - 70}%, rgba(255,255,255,0.95) ${p}%, rgba(255,255,255,0) ${p + 70}%), ` : '';
            const fill: CSSProperties = silver ? {backgroundImage: glint + SILVER, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {color};
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  transformOrigin: '50% 100%',
                  transform: `translate3d(${o * 260}px, ${(1 - k) * size * 0.75 - o * 150}px, ${(1 - k) * -620}px) rotateX(${(1 - k) * -70}deg)`,
                  opacity: clamp01(k * 2.6) * (1 - o),
                  fontWeight: grow ? Math.round(300 + (weight - 300) * clamp01(k)) : weight,
                  ...fill,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

// ---------- the Empire bar ----------
// A parallelogram with rounded corners whose ends lean like the logo's strokes. `fill` may be a
// colour or "silver"; an optional hairline edge gives the glass cards their rim. Tall cards pass a
// smaller `lean` (px) so their contents stay inside the shape.
export const Slab = ({id, w, h, fill, edge, r = 12, lean, children, style}: {id: string; w: number; h: number; fill: string; edge?: string; r?: number; lean?: number; children?: ReactNode; style?: CSSProperties}) => {
  const o = lean ?? h * SLANT;
  const pts = `${o + r},${r} ${w - r},${r} ${w - o - r},${h - r} ${r},${h - r}`;
  const paint = fill === 'silver' ? `url(#${id}-g)` : fill;
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {fill === 'silver' ? (
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0.6">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.3" stopColor="#E3E7EE" />
              <stop offset="0.52" stopColor="#9AA3B3" />
              <stop offset="0.7" stopColor="#F4F6F9" />
              <stop offset="1" stopColor="#B5BCC9" />
            </linearGradient>
          </defs>
        ) : null}
        <polygon points={pts} fill={paint} stroke={paint} strokeWidth={r * 2} strokeLinejoin="round" />
        {edge ? <polygon points={pts} fill="none" stroke={edge} strokeWidth={2} strokeLinejoin="round" /> : null}
      </svg>
      <div style={{position: 'absolute', inset: 0}}>{children}</div>
    </div>
  );
};

// A light sweep across a silver surface, 0 → 1 over `dur` seconds from `at`.
export const sheen = (t: number, at: number, dur = 0.9) => ramp(t, at, at + dur, easeInOut);
