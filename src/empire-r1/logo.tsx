import {clamp01, easeInOut, easeOut, ramp, spring, useT} from '../kublai-agents-v2/time';
import {C, sheen} from './kit';
import {LOGO_W, MARK, TAGLINE, WORDMARK, WORDMARK_BOXES} from './logo-paths';

// The Empire logo built from the EPS outlines, so every bar and letter can move on its own.
// Logo units: the stacked lockup is 1386 × 1375; the mark spans x 253–1130, y 0–818.

type Piece = {x?: number; y?: number; s?: number; r?: number; o?: number};

const MARK_CENTERS: [number, number][] = [
  [691.5, 142.5],
  [691.5, 551.5],
];
const TAG_Y = 1352;

const place = ([cx, cy]: [number, number], {x = 0, y = 0, s = 1, r = 0}: Piece) => `translate(${cx + x} ${cy + y}) rotate(${r}) scale(${s}) translate(${-cx} ${-cy})`;

// Silver body plus a moving white band (sheenX in logo units) drawn over the same outlines.
const Defs = ({id, sheenX}: {id: string; sheenX: number}) => (
  <defs>
    <linearGradient id={`${id}-silver`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1386" y2="900">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.32" stopColor="#E1E5EC" />
      <stop offset="0.55" stopColor="#9CA5B5" />
      <stop offset="0.72" stopColor="#F3F5F8" />
      <stop offset="1" stopColor="#AEB6C3" />
    </linearGradient>
    <linearGradient id={`${id}-sheen`} gradientUnits="userSpaceOnUse" x1={sheenX - 260} y1="-200" x2={sheenX + 260} y2="200">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.95" />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
    </linearGradient>
  </defs>
);

// Silver by default; a solid `fill` (the navy logo for light walls, or the tagline grey) can still
// catch the sheen with `shine`.
const Shape = ({id, d, transform, o = 1, fill, shine = !fill}: {id: string; d: string; transform?: string; o?: number; fill?: string; shine?: boolean}) =>
  o <= 0.001 ? null : (
    <g transform={transform} opacity={Math.min(1, o)}>
      <path d={d} fill={fill ?? `url(#${id}-silver)`} />
      {shine ? <path d={d} fill={`url(#${id}-sheen)`} /> : null}
    </g>
  );

// Sheen position: sweeps the whole lockup diagonally from left to right.
const sweep = (k: number) => -500 + k * 2600;

// ---------- top-left badge: mark + EMPIRE + DENTAL CLINIC ----------
// Navy (the logo's light-background version), since it sits on the pale clinic wall. It is
// already in place on frame 0 (the thumbnail); a light sweep crosses it together with «ҮЗ!».
// It leaves when the closing panel arrives.
const BUG_INK = '#0E1224';
export const Bug = () => {
  const t = useT();
  const out = ramp(t, C.panel - 0.2, C.panel + 0.3, easeInOut);
  if (out >= 1) return null;
  const sx = sweep(ramp(t, C.hookSheen, C.hookSheen + 0.9, easeInOut));
  // Mark is 92 px tall; EMPIRE 44 px tall beside it.
  const sm = 92 / 818;
  const sw = 44 / 258;
  return (
    <svg width={420} height={120} style={{position: 'absolute', left: 58, top: 86, overflow: 'visible', opacity: 1 - out}}>
      <Defs id="bug" sheenX={sx} />
      <g transform={`scale(${sm}) translate(-253.5 0)`}>
        {MARK.map((d, i) => (
          <Shape key={i} id="bug" d={d} fill={BUG_INK} shine />
        ))}
      </g>
      <g transform={`translate(116 14) scale(${sw}) translate(0 -976)`}>
        {WORDMARK.map((d, i) => (
          <Shape key={i} id="bug" d={d} fill={BUG_INK} shine />
        ))}
      </g>
      <g transform={`translate(116 66) scale(0.26) translate(-225 -1330)`}>
        {TAGLINE.map((d, i) => (
          <Shape key={i} id="bug" d={d} fill={BUG_INK} />
        ))}
      </g>
    </svg>
  );
};

// ---------- closing mark and lockup ----------
// markIn: the time the mark snaps together (from the four tip bars); lockupAt: when EMPIRE and
// DENTAL CLINIC assemble under it on the navy panel.
export const OutroLogo = ({markIn, lockupAt, sheenAt, top, height}: {markIn: number; lockupAt: number; sheenAt: number; top: number; height: number}) => {
  const t = useT();
  if (t < markIn - 0.05) return null;
  const sc = height / 1375;
  const pieces: Piece[] = [0, 1].map((i) => {
    const k = spring(t, markIn + i * 0.07, 2.2, 0.6);
    return {x: (1 - k) * (i === 0 ? -160 : 160), y: (1 - k) * (i === 0 ? -120 : 120), s: 1.25 - 0.25 * k, o: clamp01(k * 4)};
  });
  // Two sweeps: one as the mark snaps together, one on the finished lockup.
  const sx = t < sheenAt - 0.5 ? sweep(sheen(t, markIn + 0.15, 0.8)) : sweep(sheen(t, sheenAt, 1.1));
  return (
    <svg width={LOGO_W * sc} height={height} style={{position: 'absolute', left: (1080 - LOGO_W * sc) / 2, top, overflow: 'visible'}}>
      <Defs id="outro" sheenX={sx} />
      <g transform={`scale(${sc})`}>
        {MARK.map((d, i) => (
          <Shape key={i} id="outro" d={d} transform={place(MARK_CENTERS[i], pieces[i])} o={pieces[i].o} />
        ))}
        {WORDMARK.map((d, i) => {
          const k = spring(t, lockupAt + 0.25 + i * 0.06, 2.1, 0.66);
          const [x0, , x1] = WORDMARK_BOXES[i];
          return <Shape key={i} id="outro" d={d} transform={place([(x0 + x1) / 2, 1105], {y: (1 - k) * 220, r: (1 - k) * (i % 2 ? 8 : -8)})} o={clamp01(k * 2.5)} />;
        })}
        <g opacity={ramp(t, lockupAt + 0.75, lockupAt + 1.3)}>
          {TAGLINE.map((d, i) => (
            <Shape key={i} id="outro" d={d} transform={`translate(${(1 - ramp(t, lockupAt + 0.75, lockupAt + 1.5, easeOut)) * (i - 5.5) * 40} 0)`} fill="#C9CFD9" />
          ))}
        </g>
      </g>
    </svg>
  );
};

export const TAGLINE_Y = TAG_Y;
