import type {CSSProperties, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {clamp01, easeIn, easeInOut, easeOut, hit, lin, mix, ramp, spring} from '../kublai-agents-v2/time';

// Shared parts of the Python variables lesson: a night-blue classroom, the variable as a box with a
// name tag, value cards that drop in and fly out, code panels that type themselves. Everything is
// plain CSS 3D (no WebGL, no blur filters) so the whole film renders quickly.

export const COL = {
  bg: '#0A1222',
  bg2: '#13213B',
  blue: '#3E7FC1',
  blueHi: '#6FA8E0',
  yellow: '#FFD43B',
  ink: '#EEF3FA',
  dim: '#8EA3BF',
  panel: 'rgba(16, 28, 50, 0.92)',
  hair: 'rgba(150, 185, 230, 0.22)',
  red: '#FF6B6B',
  green: '#4ADE80',
  orange: '#FFAA5C',
  violet: '#C59BFF',
};

export const SANS = "'Inter', 'Noto Sans', Arial, sans-serif";
export const MONO = "'JetBrains Mono', Menlo, monospace";

const FACES: [string, string, string][] = [
  ['Inter', 'fonts/Inter-Variable.ttf', '100 900'],
  ['Noto Sans', 'fonts/NotoSans-Regular.ttf', '400'],
  ['Noto Sans', 'fonts/NotoSans-Bold.ttf', '700'],
  ['JetBrains Mono', 'fonts/JetBrainsMono-400.woff2', '400'],
  ['JetBrains Mono', 'fonts/JetBrainsMono-700.woff2', '700'],
];

let loading: Promise<unknown> | undefined;

export const Fonts = () => {
  const [handle] = useState(() => delayRender('Loading Inter, Noto Sans and JetBrains Mono'));
  useEffect(() => {
    loading ??= Promise.all(
      FACES.map(async ([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, {weight});
        await face.load();
        document.fonts.add(face);
      }),
    );
    loading.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return null;
};

// ---------- space ----------

export type Cam = {x: number; y: number; z: number; rx: number; ry: number; rz: number};
export const CAM0: Cam = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0};

// One scene's 3D space. The outer layer (flat) carries the fade, so preserve-3d inside is never
// flattened. The camera orbits a target at (x, y) on the screen plane; z pulls it back.
export const Stage = ({cam, opacity = 1, children}: {cam: Cam; opacity?: number; children: ReactNode}) => (
  <AbsoluteFill style={{perspective: 1500, opacity}}>
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transformStyle: 'preserve-3d',
        transform: `translateZ(${-cam.z}px) rotateZ(${cam.rz}deg) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate3d(${-cam.x}px, ${-cam.y}px, 0)`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

type ObjProps = {x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number; children: ReactNode; style?: CSSProperties};

// Places its children centred on a point in the scene.
export const Obj = ({x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, children, style}: ObjProps) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 'max-content',
      transformStyle: 'preserve-3d',
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,
      ...style,
    }}
  >
    <div style={{transform: 'translate(-50%, -50%)', transformStyle: 'preserve-3d'}}>{children}</div>
  </div>
);

// ---------- the variable: a box with a name tag ----------

export type Value = {v: string; at: number; color?: string};

type BoxProps = {
  t: number;
  name?: string;
  type?: string;
  values?: Value[];
  w?: number;
  h?: number;
  d?: number;
  tint?: string;
  glow?: number;
  locked?: boolean;
  tagAt?: number;
  typeAt?: number;
  bounceAt?: number;
  bounceValue?: string;
  tagSize?: number;
};

// Where a value card is at time t: it drops in on a spring, landing at `at`, and flies out up and to the right
// just before the next value lands.
const cardPose = (t: number, at: number, next: number | undefined) => {
  if (t < at - 0.4) return null;
  // Lands (first reaches the seat) 0.22 s after it starts falling, i.e. exactly at `at`.
  const s = spring(t, at - 0.22, 2.1, 0.62);
  let y = mix(-560, 0, s);
  let x = 0;
  let rz = mix(-8, 0, s);
  let op = clamp01((t - (at - 0.4)) / 0.12);
  if (next !== undefined) {
    const k = ramp(t, next - 0.75, next - 0.1, easeIn);
    if (k >= 1) return null;
    y -= 520 * k;
    x += 380 * k;
    rz += 24 * k;
    op *= 1 - ramp(t, next - 0.4, next - 0.1, easeIn);
  }
  return {x, y, rz, op};
};

export const ValueCard = ({v, color = COL.ink, w, h}: {v: string; color?: string; w: number; h: number}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 18,
      background: 'linear-gradient(180deg, #FFFFFF 0%, #E4ECF7 100%)',
      boxShadow: 'inset 0 -6px 0 rgba(30, 60, 110, 0.12)',
      display: 'flex',
      justifyContent: 'center',
      paddingTop: 14,
      boxSizing: 'border-box',
    }}
  >
    <span style={{fontFamily: MONO, fontWeight: 700, fontSize: v.length > 6 ? 46 : v.length > 3 ? 62 : 80, color: color === COL.ink ? '#14213A' : color, lineHeight: 1.1}}>{v}</span>
  </div>
);

export const Box = ({t, name, type, values = [], w = 300, h = 210, d = 210, tint = COL.blue, glow = 0, locked = false, tagAt = -99, typeAt = 99, bounceAt, bounceValue, tagSize = 44}: BoxProps) => {
  // A small squash on every landing.
  const land = values.reduce((m, val) => Math.max(m, hit(t, val.at - 0.02, 0.03, 0.16)), 0);
  const sy = 1 - 0.07 * land;
  const sx = 1 + 0.04 * land;
  const face = (extra: CSSProperties, light: number): CSSProperties => ({
    position: 'absolute',
    boxSizing: 'border-box',
    border: `2px solid rgba(255,255,255,${0.18 + 0.25 * glow})`,
    background: `linear-gradient(180deg, ${shade(tint, light + 0.12)} 0%, ${shade(tint, light)} 100%)`,
    ...extra,
  });
  const cw = w * 0.66;
  const ch = h * 0.92;
  const tag = spring(t, tagAt, 2.6, 0.5);
  const stamp = spring(t, typeAt, 3, 0.5);
  const shake = bounceAt === undefined ? 0 : Math.sin((t - bounceAt) * 46) * hit(t, bounceAt, 0.02, 0.22) * 10;
  return (
    <div style={{position: 'relative', width: w, height: h, transformStyle: 'preserve-3d', transform: `translateX(${shake}px) translateY(${(h * (1 - sy)) / 2}px) scale(${sx}, ${sy})`}}>
      {/* glow pool on the floor */}
      <div style={{position: 'absolute', left: -w * 0.35, top: h / 2 - d * 0.75, width: w * 1.7, height: d * 1.5, borderRadius: '50%', transform: `translateY(${h / 2}px) rotateX(90deg)`, background: `radial-gradient(closest-side, ${tint}${glow > 0 ? 'AA' : '55'}, transparent)`, opacity: 0.55 + 0.45 * glow}} />
      <div style={face({width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)`}, -0.45)} />
      <div style={face({width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)`}, -0.3)} />
      <div style={face({width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)`}, -0.5)} />
      {values.map((val, i) => {
        const pose = cardPose(t, val.at, values[i + 1]?.at);
        if (!pose) return null;
        return (
          <div key={i} style={{position: 'absolute', left: (w - cw) / 2, top: -ch * 0.55, opacity: pose.op, transform: `translate3d(${pose.x}px, ${pose.y}px, 0) rotateZ(${pose.rz}deg)`}}>
            <ValueCard v={val.v} color={val.color} w={cw} h={ch} />
          </div>
        );
      })}
      {bounceAt !== undefined && bounceValue ? <Bouncer t={t} at={bounceAt} v={bounceValue} w={cw} h={ch} boxW={w} /> : null}
      <div style={face({width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)`}, -0.2)}>
        {type ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp01(stamp * 1.4), transform: `scale(${mix(1.8, 1, stamp)})`}}>
            <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 40, color: COL.ink, border: `3px solid ${COL.ink}`, borderRadius: 10, padding: '4px 14px'}}>{type}</span>
          </div>
        ) : null}
      </div>
      <div style={face({width: w, height: h, transform: `translateZ(${d / 2}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}, 0)}>
        {name ? (
          <div style={{transform: `translateY(${mix(-40, 0, tag)}px) rotateZ(${mix(-10, -3, tag)}deg)`, opacity: clamp01(tag * 2)}}>
            <NameTag name={name} size={tagSize} />
          </div>
        ) : null}
        {locked ? <Lock /> : null}
      </div>
    </div>
  );
};

// The card that tries to get into a locked box and is thrown back.
const Bouncer = ({t, at, v, w, h, boxW}: {t: number; at: number; v: string; w: number; h: number; boxW: number}) => {
  if (t < at - 0.9) return null;
  const fall = ramp(t, at - 0.9, at, easeIn);
  const back = ramp(t, at, at + 0.9, easeOut);
  const y = mix(-620, -h * 0.85, fall) - 360 * Math.sin(back * Math.PI * 0.9);
  const x = 460 * back;
  const op = 1 - ramp(t, at + 0.6, at + 1.0);
  return (
    <div style={{position: 'absolute', left: (boxW - w) / 2, top: -h * 0.55, opacity: op, transform: `translate3d(${x}px, ${y}px, 30px) rotateZ(${50 * back}deg)`}}>
      <ValueCard v={v} color={COL.red} w={w} h={h} />
    </div>
  );
};

export const NameTag = ({name, color = COL.yellow, size = 44}: {name: string; color?: string; size?: number}) => (
  <div style={{background: color, borderRadius: 12, padding: `${size * 0.16}px ${size * 0.45}px`, boxShadow: '0 6px 0 rgba(0,0,0,0.25)', fontFamily: MONO, fontWeight: 700, fontSize: size, color: '#1A1A1A', whiteSpace: 'nowrap', lineHeight: 1.15}}>{name}</div>
);

const Lock = () => (
  <svg width={64} height={74} viewBox="0 0 64 74" style={{position: 'absolute', right: 18, top: 16}}>
    <path d="M16 32 V22 a16 16 0 0 1 32 0 V32" fill="none" stroke={COL.ink} strokeWidth={7} strokeLinecap="round" />
    <rect x={6} y={30} width={52} height={40} rx={8} fill={COL.ink} />
    <circle cx={32} cy={48} r={6} fill={COL.bg} />
  </svg>
);

// Lighten (k > 0) or darken (k < 0) a hex colour.
export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return `rgb(${ch.join(',')})`;
};

// ---------- code ----------

const KEYWORDS = new Set(['print', 'int', 'input', 'float', 'True', 'False', 'for', 'if', 'import']);

const tokenColor = (tok: string) => {
  if (/^\d/.test(tok)) return COL.orange;
  if (KEYWORDS.has(tok)) return COL.violet;
  if (/^[A-Za-z_]/.test(tok)) return COL.ink;
  if (tok.startsWith('#')) return COL.dim;
  return COL.blueHi;
};

export const Code = ({text, shown = text.length, size = 44, cursor = false}: {text: string; shown?: number; size?: number; cursor?: boolean}) => {
  const visible = text.slice(0, Math.max(0, Math.floor(shown)));
  const tokens = visible.match(/#.*$|\d+(?:\.\d+)?|[A-Za-z_]\w*|\s+|./g) ?? [];
  return (
    <span style={{fontFamily: MONO, fontSize: size, whiteSpace: 'pre', lineHeight: 1.5}}>
      {tokens.map((tok, i) => (
        <span key={i} style={{color: tokenColor(tok)}}>{tok}</span>
      ))}
      {cursor ? <span style={{display: 'inline-block', width: size * 0.55, height: size * 1.05, marginLeft: 2, verticalAlign: 'middle', background: COL.yellow}} /> : null}
    </span>
  );
};

export type CodeLine = {text: string; at: number; cps?: number; out?: string; outAt?: number; dim?: number};

// An editor panel whose lines type themselves. `out` shows what the user typed or what Python printed.
export const CodePanel = ({t, lines, width = 760, title = 'main.py', size = 42}: {t: number; lines: CodeLine[]; width?: number; title?: string; size?: number}) => {
  const typingIdx = lines.findIndex((l) => {
    const cps = l.cps ?? 16;
    return t >= l.at && t < l.at + l.text.length / cps + 0.6;
  });
  return (
    <div style={{width, borderRadius: 22, background: COL.panel, border: `2px solid ${COL.hair}`, boxShadow: '0 30px 60px rgba(0,0,0,0.35)', overflow: 'hidden'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: `2px solid ${COL.hair}`}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />
        ))}
        <span style={{fontFamily: MONO, fontSize: 24, color: COL.dim, marginLeft: 10}}>{title}</span>
      </div>
      <div style={{padding: '18px 28px 24px'}}>
        {lines.map((l, i) => {
          if (t < l.at) return <div key={i} style={{height: size * 1.5}} />;
          const shown = (t - l.at) * (l.cps ?? 16);
          const outK = l.out && l.outAt !== undefined ? spring(t, l.outAt, 3, 0.6) : 0;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, opacity: 1 - 0.55 * (l.dim ?? 0)}}>
              <span style={{fontFamily: MONO, fontSize: size * 0.6, color: 'rgba(142,163,191,0.5)', width: size * 0.6}}>{i + 1}</span>
              <Code text={l.text} shown={shown} size={size} cursor={i === typingIdx} />
              {l.out && outK > 0 ? (
                <span style={{fontFamily: MONO, fontSize: size * 0.75, color: COL.green, opacity: clamp01(outK * 2), transform: `translateX(${mix(-20, 0, outK)}px)`}}>{l.out}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- type ----------

// A line of words that rise out of a mask one after another.
export const Words = ({t, at, text, size = 64, weight = 700, color = COL.ink, gap = 0.07, style, highlight}: {t: number; at: number; text: string; size?: number; weight?: number; color?: string; gap?: number; style?: CSSProperties; highlight?: Record<string, string>}) => {
  const words = text.split(' ');
  return (
    <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, color, lineHeight: 1.18, letterSpacing: '-0.015em', display: 'flex', flexWrap: 'wrap', columnGap: size * 0.28, ...style}}>
      {words.map((w, i) => {
        const k = ramp(t, at + i * gap, at + i * gap + 0.55, easeOut);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - k) * 110}%)`, color: highlight?.[w] ?? color}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

// A small label pill above a heading: «Тэмдэглэл», «Жишээ».
export const Kicker = ({t, at, text, color = COL.yellow}: {t: number; at: number; text: string; color?: string}) => {
  const k = spring(t, at, 2.6, 0.7);
  return (
    <div style={{display: 'inline-block', transform: `translateX(${mix(-30, 0, k)}px)`, opacity: clamp01(k * 1.5), fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: '0.08em', textTransform: 'uppercase', color, border: `2px solid ${color}`, borderRadius: 40, padding: '6px 20px'}}>{text}</div>
  );
};

// A tick or a cross stamped on a row.
export const Mark = ({ok, k, size = 70}: {ok: boolean; k: number; size?: number}) => {
  if (k <= 0) return null;
  const draw = clamp01(k * 1.6);
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" style={{transform: `scale(${mix(1.6, 1, clamp01(k))})`, opacity: clamp01(k * 3)}}>
      <circle cx={35} cy={35} r={32} fill={ok ? COL.green : COL.red} />
      <path d={ok ? 'M20 36 L31 47 L51 24' : 'M23 23 L47 47 M47 23 L23 47'} fill="none" stroke="#0A1222" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
    </svg>
  );
};

// Fade in on a short spring and slide up a little.
export const rise = (t: number, at: number, dist = 40): CSSProperties => {
  const k = spring(t, at, 2.4, 0.75);
  return {opacity: clamp01(k * 1.6), transform: `translateY(${(1 - Math.min(k, 1.05)) * dist}px)`};
};

export {clamp01, easeIn, easeInOut, easeOut, hit, lin, mix, ramp, spring};
