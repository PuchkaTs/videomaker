import type {CSSProperties} from 'react';
import {DISPLAY} from './fonts';
import {clamp01, easeIn, easeOut, lin, ramp, rand, spring, useT} from './time';

type KProps = {
  text: string;
  at: number;
  out?: number;
  size: number;
  weight?: number;
  color: string;
  stagger?: number;
  style?: CSSProperties;
  seed?: number;
};

// Kinetic title: each letter rises out of depth, tipping forward onto its baseline.
// On `out` the letters scatter up and toward the camera.
export const KTitle = ({text, at, out, size, weight = 800, color, stagger = 0.028, style, seed = 1}: KProps) => {
  const t = useT();
  let idx = 0;
  return (
    <div style={{fontFamily: DISPLAY, fontSize: size, fontWeight: weight, color, lineHeight: 1.08, letterSpacing: -size * 0.03, transformStyle: 'preserve-3d', ...style}}>
      {text.split(' ').map((word, w) => (
        <span key={w} style={{display: 'inline-block', whiteSpace: 'nowrap', transformStyle: 'preserve-3d'}}>
          {[...word].map((ch) => {
            const i = idx++;
            const p = spring(t, at + i * stagger, 2.1, 0.62);
            const q = out === undefined ? 0 : ramp(t, out + i * 0.014, out + i * 0.014 + 0.5, easeIn);
            if (q >= 1) return <span key={i} style={{display: 'inline-block', opacity: 0}}>{ch}</span>;
            const r1 = rand(i, seed);
            const r2 = rand(i, seed + 7);
            const y = (1 - p) * size * 1.1 - q * (180 + r1 * 420);
            const x = q * (r2 - 0.5) * 520;
            const z = (1 - p) * -260 + q * (300 + r1 * 900);
            const rx = (1 - p) * 85 - q * (r2 - 0.3) * 160;
            const rz = q * (r1 - 0.5) * 90;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: clamp01(p * 2.2) * (1 - q),
                  transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg)`,
                  transformOrigin: '50% 100%',
                }}
              >
                {ch}
              </span>
            );
          })}
          {w < text.split(' ').length - 1 ? <span style={{display: 'inline-block', width: size * 0.28}} /> : null}
        </span>
      ))}
    </div>
  );
};

// Word-by-word reveal for supporting lines.
export const Words = ({text, at, out, size, color, weight = 400, stagger = 0.06, style}: {text: string; at: number; out?: number; size: number; color: string; weight?: number; stagger?: number; style?: CSSProperties}) => {
  const t = useT();
  return (
    <div style={{fontFamily: DISPLAY, fontSize: size, fontWeight: weight, color, lineHeight: 1.35, ...style}}>
      {text.split(' ').map((word, i) => {
        const p = ramp(t, at + i * stagger, at + i * stagger + 0.45, easeOut);
        const q = out === undefined ? 0 : ramp(t, out + i * 0.02, out + i * 0.02 + 0.3, easeIn);
        return (
          <span key={i} style={{display: 'inline-block', marginRight: size * 0.28, opacity: p * (1 - q), translate: `0 ${(1 - p) * size * 0.6 - q * 40}px`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined}}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

// The scene caption: number tile + label wipe, kinetic title, word-by-word subline.
export const Caption = ({n, title, sub, at, out, night = false, width = 640}: {n: number; title: string; sub: string; at: number; out: number; night?: boolean; width?: number}) => {
  const t = useT();
  const label = ramp(t, at, at + 0.5, easeOut) * (1 - ramp(t, out, out + 0.3, easeIn));
  const tile = spring(t, at, 2.4, 0.5);
  return (
    <div style={{width, transformStyle: 'preserve-3d'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26, opacity: label > 0 ? 1 : 0}}>
        <div style={{width: 56, height: 56, borderRadius: 16, background: '#006afc', color: '#fff', fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: `${tile * (1 - ramp(t, out, out + 0.25, easeIn))}`, rotate: `${(1 - tile) * -40}deg`}}>
          {n}
        </div>
        <div style={{fontFamily: DISPLAY, fontSize: 24, letterSpacing: 6, color: night ? '#7fb2ff' : '#006afc', fontWeight: 700, clipPath: `inset(0 ${(1 - label) * 100}% 0 0)`}}>AI АГЕНТ</div>
      </div>
      <KTitle text={title} at={at + 0.12} out={out} size={78} color={night ? '#ffffff' : '#111827'} seed={n} />
      <Words text={sub} at={at + 0.5} out={out} size={36} color={night ? '#a9b8d6' : '#6b7280'} style={{marginTop: 26}} />
    </div>
  );
};

// Giant outlined scene numeral for the far plane.
export const Numeral = ({n, at, out, night = false}: {n: number; at: number; out: number; night?: boolean}) => {
  const t = useT();
  const p = ramp(t, at, at + 0.9, easeOut) * (1 - lin(t, out, out + 0.5));
  return (
    <div style={{fontFamily: DISPLAY, fontSize: 620, fontWeight: 900, lineHeight: 1, letterSpacing: -30, color: 'transparent', WebkitTextStroke: `3px ${night ? 'rgba(127,178,255,0.35)' : 'rgba(0,106,252,0.16)'}`, opacity: p, translate: `0 ${(1 - p) * 120}px`}}>
      {String(n).padStart(2, '0')}
    </div>
  );
};
