import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {clamp01, easeInOut, expoOut, ramp} from '../kublai-agents-v2/time';
import cues from './cues.json';

// Shared parts of the Fitzone reel, v2: near-black HUD, thin lines that draw on, flat panels spread
// in depth. Blue is the logo's own, mint marks a finished state, ice is for type.

export const T = cues.t;
export const W = 1080;
export const H = 1920;
export const M = 72;

export const COL = {
  bg: '#05080D',
  panel: 'rgba(13, 22, 34, 0.72)',
  hair: 'rgba(160, 196, 232, 0.2)',
  blue: '#2F9DFF',
  mint: '#4BE3B0',
  ice: '#E8F1FA',
  dim: '#8FA3B8',
};
export const FONT = "'Inter', 'Noto Sans', Arial, sans-serif";

const type = (size: number, weight: number, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color: COL.ice,
  lineHeight: 1.14,
  ...extra,
});

export const LABEL = type(30, 600, {letterSpacing: '0.1em', color: COL.dim, textTransform: 'uppercase'});
export const value = (size: number) => type(size, 200, {letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums', lineHeight: 1});
export const title = (size: number) => type(size, 300, {letterSpacing: '-0.02em'});

// ---------- lines ----------

export const Svg = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

type TraceProps = {d: string; draw?: number; color?: string; width?: number; glow?: number; join?: 'round' | 'miter'};

// A line that draws itself. Three strokes make the glow, with no blur filter and no blown-out core.
export const Trace = ({d, draw = 1, color = COL.blue, width = 2.5, glow = 1, join = 'round'}: TraceProps) => {
  if (draw <= 0) return null;
  const dash = {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - clamp01(draw)};
  const base = {d, fill: 'none', stroke: color, strokeLinecap: 'round', strokeLinejoin: join} as const;
  return (
    <>
      <path {...base} {...dash} strokeWidth={width * 6} opacity={0.06 * glow} />
      <path {...base} {...dash} strokeWidth={width * 2.6} opacity={0.2 * glow} />
      <path {...base} {...dash} strokeWidth={width} />
    </>
  );
};

export const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;

// The heartbeat from the logo, traced from the end card: offsets from where it leaves the left bar.
const BEAT = [[19, 0], [29, -21], [44, 27], [65, -57], [86, 31], [99, 0], [120, 0]] as const;

export const beatPath = (x: number, y: number, s: number) => BEAT.map(([bx, by]) => `L${x + bx * s} ${y + by * s}`).join(' ');

// A rule with the heartbeat in it.
export const pulseRule = (x: number, y: number, w: number, at = 0.62, s = 0.7) => {
  const bx = x + w * at;
  return `M${x} ${y} L${bx} ${y} ${beatPath(bx, y, s)} L${x + w} ${y}`;
};

// ---------- type ----------

type RevealProps = {t: number; at: number; dur?: number; children: ReactNode; style?: CSSProperties};

// Text rises out of a mask, then stays put.
export const Reveal = ({t, at, dur = 0.8, children, style}: RevealProps) => {
  const k = ramp(t, at, at + dur, expoOut);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.14em', ...style}}>
      <div style={{transform: `translateY(${(1 - k) * 118}%)`, visibility: t < at ? 'hidden' : 'visible'}}>{children}</div>
    </div>
  );
};

export const count = (t: number, at: number, dur: number, from: number, to: number) => Math.round(from + (to - from) * ramp(t, at, at + dur, expoOut));

export const fadeOut = (t: number, at: number, dur = 0.35) => 1 - ramp(t, at, at + dur, easeInOut);

// ---------- space ----------

export type Cam = {x: number; y: number; z: number; rx: number; ry: number};

export const Stage = ({cam, children}: {cam: Cam; children: ReactNode}) => (
  <AbsoluteFill style={{perspective: 2400, perspectiveOrigin: '50% 46%'}}>
    <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `translate3d(${cam.x}px, ${cam.y}px, ${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`}}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

export const Layer = ({z = 0, children, style}: {z?: number; children: ReactNode; style?: CSSProperties}) => (
  <AbsoluteFill style={{transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d', ...style}}>{children}</AbsoluteFill>
);

// ---------- logo ----------

const BARS = [
  [224, 33, 15, 53],
  [248, 19, 18, 81],
  [386, 19, 19, 81],
  [411, 33, 14, 53],
];
const LOGO_PULSE = `M266 60 ${beatPath(266, 60, 1)}`;

// The logo's mark redrawn as vector: the pulse draws, the bars grow from their centres.
export const Mark = ({width, pulse = 1, bars = 1, color = COL.blue, glow = 1}: {width: number; pulse?: number; bars?: number; color?: string; glow?: number}) => (
  <svg width={width} height={width * (106 / 201)} viewBox="224 -1 201 106" style={{overflow: 'visible', display: 'block'}}>
    {BARS.map(([x, y, w, h]) => (
      <rect key={x} x={x} y={y + (h * (1 - bars)) / 2} width={w} height={h * bars} rx={6} fill={color} />
    ))}
    <Trace d={LOGO_PULSE} draw={pulse} color={color} width={11} glow={glow} />
  </svg>
);

export const LOGO_WORD = 'fitzone-v2/logo-word.png';

// Same place and size as the watermark in the client's footage, so cuts to the HUD don't jump.
export const CornerLogo = ({opacity = 1}: {opacity?: number}) => (
  <div style={{position: 'absolute', left: 76, top: 78, width: 224, opacity}}>
    <div style={{marginLeft: 37}}>
      <Mark width={150} color="#FFFFFF" glow={0} />
    </div>
    <Img src={staticFile(LOGO_WORD)} style={{width: 224, display: 'block', marginTop: 16}} />
  </div>
);
