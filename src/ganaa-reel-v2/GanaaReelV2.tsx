// GanaaReelV2: her edits to GanaaReel. Her still photo (not animated) opens and closes it, RE/MAX WIN,
// her name block under the title, her six points as illustrated cards with her full text, then what she
// sells and rents. 1080×1920, 60 fps, about 65 s. Timeline from cues.json (npm run build:ganaa-reel-v2).
// Plan: docs/ganaa-reel/storyboard-v2.md.
import type {CSSProperties, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {Obj, World} from '../kublai-agents-v2/world';
import type {Cam} from '../kublai-agents-v2/world';
import {backOut, clamp01, easeInOut, easeOut, expoOut, lin, mix, ramp, rand, spring, track, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';
import planJson from './plan.json';

export const GANAA_REEL_V2_FPS = 60;
export const GANAA_REEL_V2_DURATION = Math.round(cuesJson.duration * GANAA_REEL_V2_FPS);

type Scene = {id: string; from: number; to: number};
const C = cuesJson;
const SC = Object.fromEntries(C.scenes.map((s) => [s.id, s])) as Record<string, Scene>;
const M = C.marks;
const MEDIA = ((planJson as {media?: Record<string, string>}).media ?? {}) as Record<string, string>;

const SANS = "'Inter', 'Noto Sans', Arial, sans-serif";
const SERIF = "'Cormorant', 'Noto Serif', Georgia, serif";
const COL = {bg: '#060b1a', navy: '#0d1834', red: '#e3263b', white: '#f6f7fb', dim: 'rgba(230,236,248,0.72)'};
const SILVER: CSSProperties = {
  background: 'linear-gradient(180deg, #ffffff 0%, #dfe5ee 30%, #9aa5b8 52%, #f4f7fb 70%, #b7c0cf 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
const HER = 'ganaa-reel-v2/src/gantuya-cut.png';
// RE/MAX WIN logo, keyed out of her office's reel (she asked for RE/MAX WIN). plan.json "logo" can switch it.
const LOGO = (planJson as {logo?: string}).logo ?? 'ganaa-reel-v2/src/remax-win.png';
const LOGO_AR = LOGO.endsWith('remax-win.png') ? 944 / 176 : 604 / 176;

// ---------- fonts ----------
const FACES: [string, string, string][] = [
  ['Inter', 'fonts/Inter-Variable.ttf', '100 900'],
  ['Cormorant', 'fonts/Cormorant-Variable.ttf', '300 700'],
];
let fontsLoading: Promise<unknown> | undefined;
const Fonts = () => {
  const [handle] = useState(() => delayRender('Loading Inter and Cormorant'));
  useEffect(() => {
    fontsLoading ??= Promise.all(
      FACES.map(async ([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, {weight});
        await face.load();
        document.fonts.add(face);
      }),
    );
    fontsLoading.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return null;
};

const active = (t: number, s: Scene, before = 0, after = 0) => t >= s.from - before && t < s.to + after;
const exitK = (t: number, s: Scene) => ramp(t, s.to - 0.32, s.to - 0.05, easeInOut);

// Letters rising into place; each letter carries its own fill so silver works on transformed spans.
const Rise = ({text, t, at, size, weight = 800, silver = false, color = COL.white, tracking = 0.01, stagger = 0.025, dur = 0.5, lift = 50, font = SANS, style}: {text: string; t: number; at: number; size: number; weight?: number; silver?: boolean; color?: string; tracking?: number; stagger?: number; dur?: number; lift?: number; font?: string; style?: CSSProperties}) => (
  <div style={{fontFamily: font, fontSize: size, fontWeight: weight, lineHeight: 1.04, letterSpacing: `${tracking}em`, whiteSpace: 'pre', textAlign: 'center', ...style}}>
    {[...text].map((ch, i) => {
      const k = ramp(t, at + i * stagger, at + i * stagger + dur, expoOut);
      return (
        <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * lift}px)`, ...(silver ? SILVER : {color}), filter: `${k < 0.98 ? `blur(${(1 - k) * 7}px) ` : ''}drop-shadow(0 4px 16px rgba(0,0,0,0.6))`}}>
          {ch === ' ' ? ' ' : ch}
        </span>
      );
    })}
  </div>
);

const Sparkle = ({t, n = 26, seed = 1, spread = 1000, zNear = 300, zFar = -1600}: {t: number; n?: number; seed?: number; spread?: number; zNear?: number; zFar?: number}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const z = mix(zFar, zNear, rand(i, seed));
      const x = (rand(i, seed + 1) - 0.5) * spread * 2 + Math.sin(t * 0.3 + i) * 24;
      const y = (rand(i, seed + 2) - 0.5) * 1900 - ((t * (10 + rand(i, seed + 3) * 18)) % 300);
      const r = 2 + rand(i, seed + 4) * 5;
      const tw = 0.35 + 0.65 * Math.sin(t * (1.4 + rand(i, seed + 5)) + i * 2) ** 2;
      return (
        <Obj key={i} x={x} y={y} z={z}>
          <div style={{width: r * 6, height: r * 6, borderRadius: '50%', background: `radial-gradient(circle, rgba(235,242,255,${0.9 * tw}) 0%, rgba(190,205,235,${0.3 * tw}) 25%, rgba(0,0,0,0) 60%)`}} />
        </Obj>
      );
    })}
  </>
);

// ---------- the night skyline: mountains, towers with lit windows, in depth ----------
const towers = (seed: number, count: number, w: number, minH: number, maxH: number) =>
  Array.from({length: count}, (_, i) => {
    const bw = 70 + rand(i, seed) * 150;
    const x = (i / count) * w + rand(i, seed + 1) * 40;
    const h = minH + rand(i, seed + 2) * (maxH - minH);
    return {x, w: bw, h, roof: rand(i, seed + 3)};
  });
const Skyline = ({seed, w = 2800, h = 1400, minH, maxH, count, color, windows, t}: {seed: number; w?: number; h?: number; minH: number; maxH: number; count: number; color: string; windows: number; t: number}) => {
  const ts = towers(seed, count, w, minH, maxH);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display: 'block', overflow: 'visible'}}>
      {ts.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={h - b.h} width={b.w} height={b.h} fill={color} />
          {b.roof > 0.7 && <rect x={b.x + b.w * 0.4} y={h - b.h - 40} width={6} height={40} fill={color} />}
          {Array.from({length: Math.floor(b.h / 46)}, (_, r) =>
            Array.from({length: Math.floor(b.w / 34)}, (_, c) => {
              const on = rand(i * 97 + r * 13 + c, seed + 7) < windows;
              if (!on) return null;
              const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + rand(r + c, seed)) + i + r);
              return <rect key={`${r}-${c}`} x={b.x + 10 + c * 34} y={h - b.h + 16 + r * 46} width={16} height={22} fill={`rgba(255,${200 + Math.round(rand(r, c) * 40)},${130 + Math.round(rand(c, r) * 60)},${0.55 * tw + 0.2})`} />;
            }),
          )}
        </g>
      ))}
    </svg>
  );
};
const City = ({t}: {t: number}) => (
  <>
    <Obj y={-500} z={-3200}>
      <div style={{width: 6000, height: 4200, background: 'radial-gradient(ellipse at 50% 70%, #23345f 0%, #0c1530 45%, #060b1a 80%)'}} />
    </Obj>
    <Obj y={200} z={-2800}>
      <svg width={4400} height={900} viewBox="0 0 4400 900">
        <path d="M0,900 L0,520 C500,430 900,260 1500,300 C2000,330 2300,180 2900,250 C3500,320 3900,420 4400,470 L4400,900 Z" fill="#14213f" />
      </svg>
    </Obj>
    <Obj y={470} z={-2300}>
      <Skyline seed={3} w={4000} h={1300} minH={300} maxH={900} count={34} color="#0f1a36" windows={0.22} t={t} />
    </Obj>
    <Obj y={760} z={-1500}>
      <Skyline seed={7} w={3400} h={1500} minH={420} maxH={1250} count={18} color="#0a1228" windows={0.3} t={t} />
    </Obj>
    <Obj y={760} z={-1200}>
      <div style={{width: 3600, height: 520, background: 'linear-gradient(180deg, rgba(60,90,150,0) 0%, rgba(80,110,170,0.22) 50%, rgba(60,90,150,0) 100%)'}} />
    </Obj>
  </>
);

// ---------- her: the still photo, in screen space so nothing about her moves ----------
const HER_W = 1000;
const HER_H = Math.round((HER_W * 1163) / 720);
const Her = ({top = 560, k = 1}: {top?: number; k?: number}) => (
  <div style={{position: 'absolute', left: (1080 - HER_W) / 2, top, width: HER_W, height: HER_H, opacity: k}}>
    <Img src={staticFile(HER)} style={{width: HER_W, height: HER_H, display: 'block', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55))'}} />
  </div>
);

// A soft rim of light behind her that separates her from the city.
const Halo = ({k = 1}: {k?: number}) => (
  <div style={{width: 1500, height: 1500, borderRadius: '50%', background: `radial-gradient(circle, rgba(170,195,255,${0.28 * k}) 0%, rgba(110,140,220,${0.12 * k}) 38%, rgba(0,0,0,0) 66%)`}} />
);

// Words appearing one after another (for her longer sentences).
const Words = ({text, t, at, per = 0.07, size = 46, weight = 600, color = COL.dim, style}: {text: string; t: number; at: number; per?: number; size?: number; weight?: number; color?: string; style?: CSSProperties}) => (
  <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, lineHeight: 1.28, color, textAlign: 'center', ...style}}>
    {text.split(' ').map((w, i) => {
      const k = ramp(t, at + i * per, at + i * per + 0.35, easeOut);
      return (
        <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 18}px)`, marginRight: '0.28em'}}>
          {w}
        </span>
      );
    })}
  </div>
);

const Pill = ({t, at, size = 92}: {t: number; at: number; size?: number}) => {
  const p = spring(t, at, 1.6, 0.6);
  return (
    <div style={{padding: `${size * 0.18}px ${size * 0.68}px ${size * 0.22}px`, borderRadius: 999, background: COL.red, fontFamily: SANS, fontWeight: 850, fontSize: size, lineHeight: 1.1, color: '#fff', letterSpacing: '0.03em', boxShadow: '0 18px 50px rgba(227,38,59,0.45)', transform: `scale(${0.6 + 0.4 * clamp01(p)})`, opacity: clamp01(p * 2)}}>
      ☎ 9099-9884
    </div>
  );
};

// Her name block: «Үл хөдлөх хөрөнгийн мэргэжилтэн» · СИЛВЕР АГЕНТ · М.ГАНТУЯА · phone.
const NameBlock = ({t, at, big = 132}: {t: number; at: number; big?: number}) => (
  <>
    <Rise text="Үл хөдлөх хөрөнгийн мэргэжилтэн" t={t} at={at} size={46} weight={600} color={COL.white} stagger={0.012} lift={24} />
    <Rise text="СИЛВЕР АГЕНТ" t={t} at={at + 0.15} size={48} weight={700} tracking={0.3} color={COL.dim} style={{marginTop: 14}} />
    <Rise text="М.ГАНТУЯА" t={t} at={at + 0.3} size={big} weight={900} silver tracking={0.02} style={{marginTop: 2}} />
    <div style={{marginTop: 20}}>
      <Pill t={t} at={at + 0.55} size={80} />
    </div>
  </>
);

// ---------- illustrations for the six points: drawn and animated, no generated text ----------
const LINE = {fill: 'none', stroke: '#eef2fa', strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
const REDL = {...LINE, stroke: COL.red};
// A path that draws itself as k goes 0 → 1.
const Draw = ({d, k, red = false, width = 7, opacity = 1}: {d: string; k: number; red?: boolean; width?: number; opacity?: number}) => (
  <path d={d} {...(red ? REDL : LINE)} strokeWidth={width} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(k)} opacity={opacity} />
);
const Pop = ({x, y, k, children}: {x: number; y: number; k: number; children: ReactNode}) => {
  const s = clamp01(k) === 0 ? 0 : backOut(clamp01(k));
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>;
};
const Building = ({x, y, w, h, k, lit = 1}: {x: number; y: number; w: number; h: number; k: number; lit?: number}) => (
  <g>
    <rect x={x} y={y + h * (1 - clamp01(k))} width={w} height={h * clamp01(k)} rx={6} fill="rgba(238,242,250,0.10)" stroke="#eef2fa" strokeWidth={5} />
    {Array.from({length: Math.floor(h / 46)}, (_, r) =>
      Array.from({length: Math.floor(w / 40)}, (_, c) => {
        const wy = y + 22 + r * 46;
        if (wy > y + h - 30 || wy < y + h * (1 - clamp01(k))) return null;
        const on = rand(r * 7 + c, x) < 0.55 * lit;
        return <rect key={`${r}-${c}`} x={x + 14 + c * 40} y={wy} width={18} height={22} rx={3} fill={on ? 'rgba(255,214,150,0.9)' : 'rgba(238,242,250,0.18)'} />;
      }),
    )}
  </g>
);
const HouseIcon = ({s = 1, red = false}: {s?: number; red?: boolean}) => (
  <g transform={`scale(${s})`}>
    <path d="M-30 4 L0 -24 L30 4 L30 30 L-30 30 Z" fill={red ? COL.red : 'rgba(238,242,250,0.9)'} />
    <rect x={-8} y={10} width={16} height={20} fill={red ? '#fff' : COL.navy} />
  </g>
);

const Art = ({k, t, at}: {k: number; t: number; at: number}) => {
  const lt = t - at;
  const p = (a: number, b: number) => ramp(lt, a, b, easeOut);
  return (
    <svg width={860} height={520} viewBox="0 0 860 520" style={{display: 'block'}}>
      {k === 0 && (
        <g>
          <Building x={70} y={150} w={200} h={330} k={p(0.1, 0.9)} />
          <Building x={290} y={230} w={140} h={250} k={p(0.25, 1.0)} lit={0.6} />
          <Draw d="M470 480 L810 480" k={p(0.2, 0.7)} />
          <Draw d="M470 480 L470 120" k={p(0.2, 0.7)} />
          {[0, 1, 2, 3, 4].map((i) => {
            const h = (60 + i * 55) * p(0.5 + i * 0.12, 1.1 + i * 0.12);
            return <rect key={i} x={500 + i * 62} y={470 - h} width={40} height={h} rx={6} fill={i === 4 ? COL.red : 'rgba(238,242,250,0.85)'} />;
          })}
          <Draw d="M490 390 L560 340 L620 360 L690 270 L790 170" k={p(1.0, 2.0)} red width={9} />
          <Draw d="M755 168 L792 168 L792 205" k={p(1.8, 2.2)} red width={9} />
          <Pop x={360} y={140} k={p(1.5, 2.1)}>
            <g transform={`rotate(${Math.sin(lt * 2.2) * 8})`}>
              <path d="M-70 -36 L40 -36 L70 0 L40 36 L-70 36 Z" fill={COL.red} />
              <circle cx={44} cy={0} r={9} fill="#fff" />
              <text x={-20} y={16} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={46} fill="#fff">₮</text>
            </g>
          </Pop>
        </g>
      )}
      {k === 1 && (
        <g>
          <Draw d="M250 80 L610 80 L470 260 L470 380 L390 420 L390 260 Z" k={p(0.05, 0.8)} />
          {Array.from({length: 9}, (_, i) => {
            const start = 0.4 + i * 0.32;
            const q = clamp01((lt - start) / 1.1);
            if (q <= 0) return null;
            const pass = i % 3 === 0;
            const x0 = 280 + rand(i, 3) * 300;
            const x = pass ? mix(x0, 430, Math.min(1, q * 1.6)) : mix(x0, x0 + (x0 > 430 ? 220 : -220), Math.max(0, q - 0.45) * 1.8);
            const y = pass ? mix(-10, 480, q) : mix(-10, 150, Math.min(1, q * 2.2)) + Math.max(0, q - 0.45) * 380;
            const o = pass ? 1 : 1 - Math.max(0, q - 0.55) * 2.2;
            return (
              <g key={i} transform={`translate(${x} ${y})`} opacity={clamp01(o)}>
                <HouseIcon s={0.9} red={pass} />
              </g>
            );
          })}
          <g transform="translate(730 140)">
            <circle r={78} {...LINE} />
            <path d={`M0 0 L${Math.sin(lt * 4) * 52} ${-Math.cos(lt * 4) * 52}`} {...REDL} />
            <path d={`M0 0 L${Math.sin(lt * 0.5) * 36} ${-Math.cos(lt * 0.5) * 36}`} {...LINE} />
            <circle r={8} fill={COL.red} />
          </g>
        </g>
      )}
      {k === 2 && (
        <g>
          <g transform={`translate(110 ${mix(80, 40, p(0, 0.6))})`}>
            <rect x={0} y={0} width={360} height={440} rx={22} fill="rgba(238,242,250,0.95)" />
            <path d="M300 0 L360 60 L300 60 Z" fill="rgba(13,24,52,0.25)" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={88} y={90 + i * 82} width={220 * p(0.3 + i * 0.1, 0.8 + i * 0.1)} height={18} rx={9} fill="rgba(13,24,52,0.35)" />
                <Pop x={50} y={99 + i * 82} k={p(0.9 + i * 0.45, 1.3 + i * 0.45)}>
                  <circle r={24} fill={COL.red} />
                  <path d="M-11 0 L-3 9 L12 -9" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                </Pop>
              </g>
            ))}
          </g>
          <g transform={`translate(${mix(860, 640, p(0.5, 1.2))} 260) scale(1.45)`}>
            <path d="M0 -120 L95 -86 L95 -10 C95 52 52 94 0 112 C-52 94 -95 52 -95 -10 L-95 -86 Z" fill="rgba(16,26,54,0.92)" {...{stroke: '#eef2fa', strokeWidth: 6}} />
            <Draw d="M-42 -4 L-10 28 L48 -36" k={p(2.6, 3.1)} red width={12} />
          </g>
        </g>
      )}
      {k === 3 && (
        <g>
          <Draw d="M60 470 L820 470" k={p(0.1, 0.6)} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const h = (40 + i * 52) * p(0.3 + i * 0.1, 0.9 + i * 0.1);
            return <rect key={i} x={90 + i * 80} y={460 - h} width={52} height={h} rx={6} fill={`rgba(238,242,250,${0.35 + i * 0.1})`} />;
          })}
          <Draw d="M100 400 L220 360 L320 330 L420 250 L520 180" k={p(0.9, 1.8)} red width={10} />
          <Draw d="M478 170 L524 176 L516 222" k={p(1.6, 2.0)} red width={10} />
          {[0, 1, 2, 3, 4].map((i) => {
            const y = mix(-60, 440 - i * 30, p(1.0 + i * 0.22, 1.5 + i * 0.22));
            return (
              <g key={i} transform={`translate(700 ${y})`} opacity={p(1.0 + i * 0.22, 1.1 + i * 0.22)}>
                <ellipse rx={70} ry={20} fill="#d9a441" stroke="#fff3c4" strokeWidth={4} />
              </g>
            );
          })}
          <Pop x={700} y={150} k={p(2.2, 2.8)}>
            <path d="M-110 -70 L110 -70 Q130 -70 130 -50 L130 30 Q130 50 110 50 L-20 50 L-60 90 L-50 50 L-110 50 Q-130 50 -130 30 L-130 -50 Q-130 -70 -110 -70 Z" fill="rgba(238,242,250,0.95)" />
            <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={70} fill={COL.red}>%</text>
          </Pop>
        </g>
      )}
      {k === 4 && (
        <g>
          {Array.from({length: 36}, (_, i) => {
            const a = rand(i, 41) * Math.PI * 2;
            const r = 90 + rand(i, 42) * 300;
            const x = 430 + Math.cos(a) * r * 1.15;
            const y = 260 + Math.sin(a) * r * 0.62;
            const q = p(0.3 + (r / 390) * 1.6, 0.7 + (r / 390) * 1.6);
            if (q <= 0) return null;
            return (
              <g key={i}>
                <line x1={430} y1={260} x2={mix(430, x, q)} y2={mix(260, y, q)} stroke="rgba(238,242,250,0.35)" strokeWidth={2.5} />
                <circle cx={mix(430, x, q)} cy={mix(260, y, q)} r={9 + rand(i, 43) * 7} fill="#eef2fa" opacity={0.6 + 0.4 * Math.sin(lt * 3 + i) ** 2} />
              </g>
            );
          })}
          <circle cx={430} cy={260} r={48} fill={COL.red} />
          <g transform="translate(430 260)">
            <circle cx={0} cy={-12} r={13} fill="#fff" />
            <path d="M-22 26 C-22 6 22 6 22 26" fill="#fff" />
          </g>
          <g transform="translate(430 470)" opacity={p(0.4, 0.8)}>
            <rect x={-170} y={-44} width={340} height={80} rx={40} fill="rgba(6,11,26,0.85)" stroke="rgba(238,242,250,0.5)" strokeWidth={3} />
            <text x={0} y={14} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={50} fill="#fff">
              {Math.round(1800 * ramp(lt, 0.4, 2.6, easeOut))} агент
            </text>
          </g>
        </g>
      )}
      {k === 5 && (
        <g>
          <g transform={`translate(${mix(-40, 230, p(0.1, 1.2))} 210)`}>
            <path d="M-120 -60 L80 -60 Q100 -60 100 -40 L100 30 Q100 50 80 50 L-40 50 L-80 90 L-70 50 L-120 50 Q-140 50 -140 30 L-140 -40 Q-140 -60 -120 -60 Z" fill="rgba(238,242,250,0.95)" />
            <text x={-20} y={14} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={54} fill={COL.navy}>₮</text>
          </g>
          <g transform={`translate(${mix(900, 630, p(0.5, 1.6))} 150)`}>
            <path d="M120 -60 L-80 -60 Q-100 -60 -100 -40 L-100 30 Q-100 50 -80 50 L40 50 L80 90 L70 50 L120 50 Q140 50 140 30 L140 -40 Q140 -60 120 -60 Z" fill={COL.red} />
            <text x={20} y={14} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={54} fill="#fff">₮</text>
          </g>
          <g transform="translate(430 390) scale(1.5)">
            <Draw d="M-160 0 L-102 -40 L-56 -24 L-18 -48 L60 0" k={p(1.8, 2.5)} />
            <Draw d="M-102 -40 L-102 26 L-48 66 C-34 76 -18 66 -26 52 L-40 36" k={p(2.0, 2.7)} />
            <Draw d="M-40 36 L-10 60 C4 68 16 56 6 46 L-18 22" k={p(2.2, 2.9)} />
            <Draw d="M-18 22 L8 40 C22 48 32 32 22 24 L-18 -12" k={p(2.4, 3.1)} red />
            <Draw d="M60 0 L20 32" k={p(2.4, 3.1)} />
          </g>
        </g>
      )}
    </svg>
  );
};

const POINTS = [
  {title: 'ЗӨВ ҮНЭЛГЭЭ', body: 'Зах зээлийн судалгаанд үндэслэн зөв үнэлгээг тогтооно.'},
  {title: 'ЦАГ ХЭМНЭНЭ', body: 'Зах зээлээс танд тохирох сонголтуудыг шүүж өгнө.', chips: ['Зар сурталчилгаа', 'Дуудлага авах', 'Байр үзүүлэх']},
  {title: 'ЭРСДЭЛЭЭС ХАМГААЛНА', body: 'Бичиг баримт, өмчлөгчтэй холбоотой асуудлыг бүгдийг шалгаж баталгаажуулна.'},
  {title: 'МЭРГЭЖЛИЙН ЗӨВЛӨГӨӨ', body: 'Зах зээлийн бодит үнэ цэнэ болон хөрөнгө оруулалтын өгөөжийг тайлбарлана.'},
  {title: 'МЭРГЭЖЛИЙН БАГ ХАМТ ОЛОН', body: '1800 агенттай системд байршуулснаар зорилтод хэрэглэгчид хурдан хүрнэ.'},
  {title: 'ХЭЛЭЛЦЭЭР ХИЙЖ ӨГНӨ', body: 'Үнэ болон нөхцөл дээр худалдан авагч, худалдагчийн хооронд зөвшилцөлд хүрэхэд туслана.'},
];
const N_POINTS = POINTS.length;

const CARD_W = 920;
const CARD_H = 1120;
const PointCard = ({k, t, at, glow = 1}: {k: number; t: number; at: number; glow?: number}) => {
  const r = POINTS[k];
  const long = r.title.length > 16;
  return (
    <div style={{position: 'relative', width: CARD_W, height: CARD_H, borderRadius: 44, overflow: 'hidden', background: 'linear-gradient(160deg, rgba(38,54,98,0.97) 0%, rgba(16,26,54,0.98) 60%, rgba(10,16,36,0.99) 100%)', border: `2px solid rgba(214,224,242,${0.35 + 0.4 * glow})`, boxShadow: `0 50px 110px rgba(0,0,0,0.65), 0 0 ${70 * glow}px rgba(170,195,255,${0.32 * glow})`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 40%)'}} />
      <div style={{position: 'absolute', left: 30, top: 30, width: 860, height: 560, borderRadius: 30, background: 'radial-gradient(ellipse at 50% 40%, rgba(80,110,180,0.45) 0%, rgba(20,32,66,0.6) 70%)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 30}}>
          <Art k={k} t={t} at={at} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 44, left: 56, fontFamily: SANS, fontWeight: 900, fontSize: 60, color: '#fff', background: COL.red, borderRadius: 18, padding: '0 18px', boxShadow: '0 10px 30px rgba(227,38,59,0.45)'}}>
        {k === N_POINTS - 1 ? '✓' : String(k + 1).padStart(2, '0')}
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 615}}>
        <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: long ? 66 : 80, lineHeight: 1.04, ...SILVER}}>{r.title}</div>
        <Words text={r.body} t={t} at={at + 0.5} per={0.09} size={48} weight={600} color="rgba(236,241,250,0.9)" style={{marginTop: 22}} />
        {r.chips && (
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 30}}>
            {r.chips.map((c, i) => {
              const q = spring(t, at + 2.2 + i * 0.45, 1.8, 0.6);
              return (
                <div key={c} style={{padding: '12px 28px', borderRadius: 999, border: `3px solid ${COL.red}`, background: 'rgba(227,38,59,0.18)', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#fff', transform: `scale(${clamp01(q) === 0 ? 0 : 0.6 + 0.4 * q})`, opacity: clamp01(q * 2)}}>
                  {c}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- S1: her still photo on frame 0, RE/MAX WIN, the question, her name block ----------
const S1 = ({t}: {t: number}) => {
  const s = SC.S1;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: track([[0, -60], [end + 0.4, 60]], lt), y: 0, z: track([[0, 120], [end + 0.4, -80]], lt), yaw: track([[0, -3], [end + 0.4, 3]], lt), pitch: 0, roll: 0};
  const out = exitK(t, s);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        <Obj y={150} z={-500}>
          <Halo />
        </Obj>
        <Sparkle t={t} n={20} seed={11} zNear={300} zFar={-2000} spread={1300} />
      </World>
      <Her top={600} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,7,16,0.7) 0%, rgba(4,7,16,0) 30%, rgba(0,0,0,0) 56%, rgba(4,7,16,0.88) 76%, rgba(4,7,16,0.96) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70, opacity: 1 - out}}>
        <Img src={staticFile(LOGO)} style={{height: 92, width: 92 * LOGO_AR, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))'}} />
        <div style={{marginTop: 40}}>
          <Rise text="ЯАГААД ТАНД" t={t} at={s.from - 0.55} size={96} weight={800} silver tracking={0.04} />
          <Rise text="АГЕНТ" t={t} at={s.from - 0.45} size={200} weight={900} color={COL.red} tracking={0.02} style={{lineHeight: 0.95, marginTop: 2}} />
          <Rise text="ХЭРЭГТЭЙ ВЭ?" t={t} at={s.from - 0.4} size={96} weight={800} silver tracking={0.04} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 130, opacity: 1 - out}}>
        <NameBlock t={t} at={s.from - 1.2} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const RoomArt = ({src, label, t, at}: {src?: string; label: string; t: number; at: number}) => (
  <div style={{position: 'relative', width: 520, height: 680, borderRadius: 34, overflow: 'hidden', border: '2px solid rgba(214,224,242,0.6)', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', background: 'linear-gradient(170deg, #2a3c6a 0%, #121c3a 100%)'}}>
    {src ? <Img src={staticFile(src)} style={{width: 520, height: 680, objectFit: 'cover', transform: `scale(${1.05 + (t - at) * 0.01})`}} /> : null}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'linear-gradient(0deg, rgba(6,10,24,0) 0%, rgba(6,10,24,0.9) 70%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center', fontFamily: SANS, fontWeight: 850, fontSize: 62, ...SILVER}}>{label}</div>
  </div>
);

// ---------- S2: selling or buying? Her two questions written out under the cards ----------
const S2 = ({t}: {t: number}) => {
  const s = SC.S2;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: track([[-0.3, 0], [end + 0.3, 30]], lt), y: 0, z: track([[-0.3, 120], [end + 0.3, -60]], lt), yaw: track([[-0.3, 2], [end + 0.3, -3]], lt), pitch: 0, roll: 0};
  const sell = spring(t, s.from + 0.15, 1.5, 0.62);
  const buy = spring(t, M.buy, 1.5, 0.62);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        <Obj x={-265} y={-330} z={-200} ry={mix(80, 12, clamp01(sell))} rz={-3}>
          <RoomArt src={MEDIA.sell} label="ХУДАЛДАХ" t={t} at={s.from} />
        </Obj>
        <Obj x={265} y={-250} z={-160} ry={mix(-80, -12, clamp01(buy))} rz={3}>
          <RoomArt src={MEDIA.buy} label="ХАЙХ" t={t} at={M.buy} />
        </Obj>
        <Sparkle t={t} n={16} seed={21} />
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(4,7,16,0.85) 72%, rgba(4,7,16,0.92) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', padding: '0 70px 260px'}}>
        <Words text="Та орон сууцаа худалдах гэж байна уу?" t={t} at={s.from + 0.2} per={0.1} size={64} weight={800} color={COL.white} />
        <Words text="Эсвэл мөрөөдлийн орон сууцаа хайж байна уу?" t={t} at={M.buy} per={0.1} size={64} weight={800} color={COL.white} style={{marginTop: 26}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- R1–R6: the six points as illustrated cards; each flies in, earlier ones step back ----------
const POINT_IDS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
const Points = ({t}: {t: number}) => {
  const first = SC.R1;
  const last = SC.R6;
  const idx = POINT_IDS.findIndex((id) => t < SC[id].to);
  const cur = idx < 0 ? N_POINTS - 1 : idx;
  const lt = t - first.from;
  const cam: Cam = {x: Math.sin(lt * 0.3) * 40, y: 0, z: 40 - lt * 2, yaw: Math.sin(lt * 0.25) * 3, pitch: Math.sin(lt * 0.2) * 1.5, roll: 0};
  const ticks = POINT_IDS.map((id) => SC[id].from);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        {POINT_IDS.map((id, k) => {
          const at = SC[id].from;
          if (t < at - 0.4 || k < cur - 2) return null;
          const fly = ramp(t, at - 0.15, at + 0.6, expoOut);
          const behind = Math.max(0, cur - k);
          const step = behind > 0 ? ramp(t, SC[POINT_IDS[k + 1]].from - 0.15, SC[POINT_IDS[k + 1]].from + 0.6, expoOut) + (behind - 1) : 0;
          const x = mix(900, 0, fly) - step * 260;
          const y = 130 - step * 60;
          const z = mix(-1500, 0, fly) - step * 700;
          const ry = mix(55, 0, fly) + step * 14;
          return (
            <Obj key={id} x={x} y={y} z={z} ry={ry} rz={mix(8, 0, fly)} s={0.98}>
              <div style={{filter: step > 0.05 ? `brightness(${1 - Math.min(0.6, step * 0.4)})` : undefined}}>
                <PointCard k={k} t={t} at={at} glow={1 - Math.min(1, step)} />
              </div>
            </Obj>
          );
        })}
        <Sparkle t={t} n={16} seed={31} />
      </World>
      <AbsoluteFill style={{padding: '70px 70px 0'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: SANS, fontWeight: 900}}>
          <span style={{fontSize: 130, lineHeight: 1, ...SILVER, transform: `scale(${1 + 0.18 * Math.exp(-(((t - ticks[cur]) / 0.12) ** 2))})`, display: 'inline-block', transformOrigin: 'left bottom'}}>{cur + 1}</span>
          <span style={{fontSize: 62, color: COL.red}}>/{N_POINTS}</span>
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: 14}}>
          {POINT_IDS.map((id, k) => (
            <div key={id} style={{width: 56, height: 10, borderRadius: 5, background: k <= cur ? COL.red : 'rgba(220,228,245,0.25)'}} />
          ))}
        </div>
      </AbsoluteFill>
      {t > last.to - 0.4 && <AbsoluteFill style={{background: COL.bg, opacity: lin(t, last.to - 0.4, last.to)}} />}
    </AbsoluteFill>
  );
};

// ---------- S7: what she sells and rents, as illustrated tiles ----------
const SERVICES = ['Орон сууц', 'Хаус', 'Оффис', 'Объект', 'Газар'];
const ServiceIcon = ({k}: {k: number}) => (
  <svg width={190} height={170} viewBox="0 0 190 170">
    {k === 0 && (
      <g>
        <rect x={40} y={20} width={110} height={140} rx={6} {...LINE} />
        {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={56 + c * 30} y={36 + r * 30} width={18} height={18} rx={3} fill={(r + c) % 3 === 0 ? COL.red : 'rgba(238,242,250,0.8)'} />))}
      </g>
    )}
    {k === 1 && (
      <g>
        <path d="M20 85 L95 25 L170 85" {...LINE} />
        <path d="M40 72 L40 155 L150 155 L150 72" {...LINE} />
        <rect x={80} y={105} width={30} height={50} fill={COL.red} />
        <rect x={120} y={95} width={20} height={20} fill="rgba(255,214,150,0.9)" />
      </g>
    )}
    {k === 2 && (
      <g>
        <rect x={50} y={10} width={90} height={150} rx={4} {...LINE} />
        {[0, 1, 2, 3, 4, 5, 6].map((r) => <path key={r} d={`M60 ${30 + r * 18} L130 ${30 + r * 18}`} stroke={r === 3 ? COL.red : 'rgba(238,242,250,0.6)'} strokeWidth={5} />)}
        <path d="M95 10 L95 160" stroke="rgba(238,242,250,0.6)" strokeWidth={4} />
      </g>
    )}
    {k === 3 && (
      <g>
        <rect x={25} y={70} width={140} height={85} rx={4} {...LINE} />
        <path d="M20 70 L35 35 L155 35 L170 70 Z" fill={COL.red} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${35 + i * 34} 70 Q${52 + i * 34} 90 ${69 + i * 34} 70`} fill="#fff" />)}
        <rect x={45} y={100} width={50} height={40} fill="rgba(255,214,150,0.85)" />
        <rect x={110} y={100} width={35} height={55} {...LINE} />
      </g>
    )}
    {k === 4 && (
      <g>
        <path d="M10 150 Q60 110 100 130 T180 120 L180 160 L10 160 Z" fill="rgba(120,170,110,0.75)" />
        <path d="M40 140 L40 100 M80 132 L80 92 M120 128 L120 88 M160 124 L160 84" stroke="#eef2fa" strokeWidth={5} />
        <path d="M40 108 L160 92" stroke="#eef2fa" strokeWidth={4} />
        <path d="M95 92 L95 20" stroke="#eef2fa" strokeWidth={5} />
        <path d="M95 22 L140 36 L95 50 Z" fill={COL.red} />
      </g>
    )}
  </svg>
);
const S7 = ({t}: {t: number}) => {
  const s = SC.S7;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: track([[-0.3, -40], [end + 0.3, 40]], lt), y: 0, z: track([[-0.3, 200], [end + 0.3, -40]], lt), yaw: track([[-0.3, -4], [end + 0.3, 3]], lt), pitch: track([[-0.3, 4], [end + 0.3, 0]], lt), roll: 0};
  const pos = [
    [-330, -140],
    [0, -140],
    [330, -140],
    [-170, 270],
    [170, 270],
  ];
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        {SERVICES.map((label, i) => {
          const q = spring(t, s.from + 0.35 + i * 0.16, 1.5, 0.62);
          const k = clamp01(q);
          return (
            <Obj key={label} x={pos[i][0]} y={pos[i][1] + (1 - k) * 300} z={mix(-1200, 0, k) + Math.sin(lt * 1.2 + i) * 20} ry={mix(70, 0, k) + Math.sin(lt * 0.9 + i) * 4} rx={mix(-40, 0, k)}>
              <div style={{width: 300, height: 360, borderRadius: 30, background: 'linear-gradient(160deg, rgba(38,54,98,0.97) 0%, rgba(14,22,48,0.98) 100%)', border: '2px solid rgba(214,224,242,0.6)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
                <ServiceIcon k={i} />
                <div style={{fontFamily: SANS, fontWeight: 850, fontSize: 50, ...SILVER}}>{label}</div>
              </div>
            </Obj>
          );
        })}
        <Sparkle t={t} n={14} seed={51} />
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,7,16,0.85) 0%, rgba(4,7,16,0) 26%)'}} />
      <AbsoluteFill style={{alignItems: 'center', padding: '170px 60px 0'}}>
        <Words text="Үл хөдлөх хөрөнгөө худалдах болон түрээслэх бол" t={t} at={s.from + 0.1} per={0.08} size={52} weight={700} color={COL.white} />
        <Rise text="ХАМТРАН АЖИЛЛААРАЙ" t={t} at={s.from + 0.7} size={74} weight={900} silver tracking={0.02} style={{marginTop: 14}} />
      </AbsoluteFill>
      {t > s.to - 0.4 && <AbsoluteFill style={{background: COL.bg, opacity: lin(t, s.to - 0.4, s.to)}} />}
    </AbsoluteFill>
  );
};

// ---------- S8: her still photo again, her closing line, name, phone, promise ----------
const S8 = ({t}: {t: number}) => {
  const s = SC.S8;
  const lt = t - s.from;
  const cam: Cam = {x: 0, y: 0, z: track([[-0.3, 220], [1.2, 40], [s.to - s.from, -60]], lt), yaw: track([[-0.3, -4], [1.4, 0], [s.to - s.from, 2]], lt), pitch: 0, roll: 0};
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        <Obj y={150} z={-500}>
          <Halo />
        </Obj>
        <Sparkle t={t} n={22} seed={41} />
      </World>
      <Her top={600} k={ramp(t, s.from - 0.1, s.from + 0.5)} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,7,16,0.8) 0%, rgba(4,7,16,0) 30%, rgba(0,0,0,0) 52%, rgba(4,7,16,0.88) 70%, rgba(4,7,16,0.96) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', padding: '70px 70px 0'}}>
        <Img src={staticFile(LOGO)} style={{height: 92, width: 92 * LOGO_AR, opacity: ramp(t, s.from + 0.1, s.from + 0.6), transform: `translateY(${(1 - ramp(t, s.from + 0.1, s.from + 0.6, easeOut)) * 30}px)`, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))'}} />
        <Words text="Илүү дэлгэрэнгүй мэдээллийг үл хөдлөх хөрөнгийн мэргэжилтэн Силвер агент М.Гантуяагаас аваарай." t={t} at={s.from + 0.4} per={0.06} size={50} weight={700} color={COL.white} style={{marginTop: 36}} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110}}>
        <Rise text="СИЛВЕР АГЕНТ" t={t} at={M.name - 0.35} size={48} weight={700} tracking={0.3} color={COL.dim} />
        <Rise text="М.ГАНТУЯА" t={t} at={M.name} size={140} weight={900} silver tracking={0.02} style={{marginTop: 2}} />
        <div style={{marginTop: 18}}>
          <Pill t={t} at={M.name + 0.35} size={84} />
        </div>
        <Rise text="ТАНЫ ҮЛ ХӨДЛӨХ ХӨРӨНГӨ —" t={t} at={M.promise} size={50} weight={700} color={COL.white} stagger={0.012} style={{marginTop: 34}} />
        <Rise text="МИНИЙ ХАРИУЦЛАГА" t={t} at={M.promise + 0.35} size={74} weight={900} silver stagger={0.02} tracking={0.03} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- assembly ----------
const Fade = ({t, at, dur = 0.35, children}: {t: number; at: number; dur?: number; children: ReactNode}) => {
  const k = lin(t, at - dur / 2, at + dur / 2);
  if (k >= 1) return <>{children}</>;
  return <AbsoluteFill style={{opacity: k}}>{children}</AbsoluteFill>;
};
const BLOOM_AT = [SC.S2.from, SC.R1.from, SC.S7.from, SC.S8.from];
const Bloom = ({t}: {t: number}) => {
  const g = Math.max(...BLOOM_AT.map((at) => Math.exp(-(((t - at) / 0.2) ** 2))));
  if (g < 0.01) return null;
  return <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 42%, rgba(200,215,255,${0.5 * g}) 0%, rgba(120,150,230,${0.22 * g}) 36%, rgba(0,0,0,0) 68%)`}} />;
};

const Scenes = () => {
  const t = useT();
  // The small corner logo: on everything between the opening and the end card (both show it large).
  const corner = lin(t, SC.S2.from, SC.S2.from + 0.4) * (1 - lin(t, SC.S8.from - 0.3, SC.S8.from + 0.1));
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {active(t, SC.S1, 0, 0.3) && <S1 t={t} />}
      {active(t, SC.S2, 0.3, 0.3) && (
        <Fade t={t} at={SC.S2.from} dur={0.4}>
          <S2 t={t} />
        </Fade>
      )}
      {t >= SC.R1.from - 0.3 && t < SC.R6.to + 0.3 && (
        <Fade t={t} at={SC.R1.from} dur={0.4}>
          <Points t={t} />
        </Fade>
      )}
      {active(t, SC.S7, 0.3, 0.3) && (
        <Fade t={t} at={SC.S7.from} dur={0.4}>
          <S7 t={t} />
        </Fade>
      )}
      {active(t, SC.S8, 0.3, 0) && (
        <Fade t={t} at={SC.S8.from} dur={0.45}>
          <S8 t={t} />
        </Fade>
      )}
      {corner > 0.01 && (
        <AbsoluteFill style={{alignItems: 'flex-end', padding: '64px 54px 0 0', opacity: corner}}>
          <Img src={staticFile(LOGO)} style={{height: 60, width: 60 * LOGO_AR, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.55))'}} />
        </AbsoluteFill>
      )}
      <Bloom t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.38) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const GanaaReelV2 = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <Fonts />
    <Scenes />
    <Audio src={staticFile('ganaa-reel-v2/stems/voice.wav')} name="Voice" />
    <Audio src={staticFile('ganaa-reel-v2/stems/music.wav')} name="Music" />
    <Audio src={staticFile('ganaa-reel-v2/stems/sfx.wav')} name="Sound effects" />
  </AbsoluteFill>
);
