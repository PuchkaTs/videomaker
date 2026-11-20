// GanaaHouse: property reel for М.Гантуяа (RE/MAX WIN), house for sale in Чингэлтэй, 22-р хороо.
// 1080×1920, 60 fps, about 59 s, 2.5D (CSS 3D layers and drawn SVG, only her two photos; nothing generated).
// Through-line: the plot opens up: the house photo, then the plot drawn as a plan where every fact rises,
// then the map, then the price. Timeline from cues.json (npm run build:ganaa-house).
// Plan: docs/ganaa-reel/storyboard-house.md.
import type {CSSProperties, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {Obj, World} from '../kublai-agents-v2/world';
import type {Cam} from '../kublai-agents-v2/world';
import {backOut, clamp01, easeInOut, easeOut, expoOut, lin, mix, ramp, rand, spring, track, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';
import planJson from './plan.json';

export const GANAA_HOUSE_FPS = 60;
export const GANAA_HOUSE_DURATION = Math.round(cuesJson.duration * GANAA_HOUSE_FPS);

type Scene = {id: string; from: number; to: number};
const C = cuesJson;
const SC = Object.fromEntries(C.scenes.map((s) => [s.id, s])) as Record<string, Scene>;
const M = C.marks;
const VAT = Object.fromEntries(C.voices.map((v) => [v.id, v.at])) as Record<string, number>;
const OUTSIDE = planJson.media.outside;
const INSIDE = planJson.media.inside;
const LOGO = planJson.logo;
const LOGO_AR = 944 / 176;

const SANS = "'Inter', 'Noto Sans', Arial, sans-serif";
const COL = {bg: '#060b1a', navy: '#0d1834', red: '#e3263b', white: '#f6f7fb', dim: 'rgba(230,236,248,0.75)', ice: '#8fd3ff', leaf: '#7cc77a', warm: 'rgba(255,214,150,0.9)'};
const SILVER: CSSProperties = {
  background: 'linear-gradient(180deg, #ffffff 0%, #dfe5ee 30%, #9aa5b8 52%, #f4f7fb 70%, #b7c0cf 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
// A light grade on her photos: a touch warmer and crisper, nothing about the property changed.
const GRADE = 'saturate(1.12) contrast(1.06) brightness(1.03) sepia(0.06)';

// ---------- fonts ----------
const FACES: [string, string, string][] = [['Inter', 'fonts/Inter-Variable.ttf', '100 900']];
let fontsLoading: Promise<unknown> | undefined;
const Fonts = () => {
  const [handle] = useState(() => delayRender('Loading Inter'));
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
const pop = (t: number, at: number) => {
  const q = spring(t, at, 1.7, 0.6);
  return {q, k: clamp01(q)};
};

// ---------- type ----------
const Rise = ({text, t, at, size, weight = 800, silver = false, color = COL.white, tracking = 0.01, stagger = 0.025, dur = 0.5, lift = 50, style}: {text: string; t: number; at: number; size: number; weight?: number; silver?: boolean; color?: string; tracking?: number; stagger?: number; dur?: number; lift?: number; style?: CSSProperties}) => (
  <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, lineHeight: 1.04, letterSpacing: `${tracking}em`, whiteSpace: 'pre', textAlign: 'center', ...style}}>
    {[...text].map((ch, i) => {
      const k = ramp(t, at + i * stagger, at + i * stagger + dur, expoOut);
      return (
        <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * lift}px)`, ...(silver ? SILVER : {color}), filter: `${k < 0.98 ? `blur(${(1 - k) * 7}px) ` : ''}drop-shadow(0 4px 16px rgba(0,0,0,0.6))`}}>
          {ch === ' ' ? ' ' : ch}
        </span>
      );
    })}
  </div>
);
const Words = ({text, t, at, per = 0.07, size = 46, weight = 600, color = COL.dim, style}: {text: string; t: number; at: number; per?: number; size?: number; weight?: number; color?: string; style?: CSSProperties}) => (
  <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, lineHeight: 1.25, color, textAlign: 'center', textShadow: '0 4px 18px rgba(0,0,0,0.6)', ...style}}>
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
// A number that counts up to its value as it lands.
const Count = ({to, t, at, dur = 0.9, suffix = '', size = 150, color, silver = true}: {to: number; t: number; at: number; dur?: number; suffix?: string; size?: number; color?: string; silver?: boolean}) => {
  const k = ramp(t, at, at + dur, expoOut);
  const {q} = pop(t, at);
  return (
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: '-0.01em', opacity: clamp01(q * 3), transform: `scale(${0.7 + 0.3 * clamp01(q) + 0.05 * Math.max(0, q - 1)})`, display: 'inline-block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))', ...(silver && !color ? SILVER : {color: color ?? COL.white})}}>
      {Math.round(to * k)}
      <span style={{fontSize: size * 0.48, marginLeft: size * 0.08}}>{suffix}</span>
    </div>
  );
};
const Chip = ({text, t, at, red = false, size = 40}: {text: string; t: number; at: number; red?: boolean; size?: number}) => {
  const {q, k} = pop(t, at);
  return (
    <div style={{padding: `${size * 0.3}px ${size * 0.7}px`, borderRadius: 999, border: `3px solid ${red ? COL.red : 'rgba(214,224,242,0.7)'}`, background: red ? COL.red : 'rgba(16,26,54,0.78)', fontFamily: SANS, fontWeight: 750, fontSize: size, color: '#fff', whiteSpace: 'nowrap', transform: `scale(${k === 0 ? 0 : 0.6 + 0.4 * q})`, opacity: clamp01(q * 2), boxShadow: red ? '0 14px 40px rgba(227,38,59,0.45)' : '0 14px 40px rgba(0,0,0,0.45)'}}>
      {text}
    </div>
  );
};

// ---------- the world behind the drawn scenes: dusk sky over the hills around the city ----------
const Sparkle = ({t, n = 18, seed = 1, spread = 1100}: {t: number; n?: number; seed?: number; spread?: number}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const z = mix(-1700, 250, rand(i, seed));
      const x = (rand(i, seed + 1) - 0.5) * spread * 2 + Math.sin(t * 0.3 + i) * 24;
      const y = (rand(i, seed + 2) - 0.5) * 1900 - ((t * (10 + rand(i, seed + 3) * 18)) % 300);
      const r = 2 + rand(i, seed + 4) * 5;
      const tw = 0.35 + 0.65 * Math.sin(t * (1.4 + rand(i, seed + 5)) + i * 2) ** 2;
      return (
        <Obj key={i} x={x} y={y} z={z}>
          <div style={{width: r * 6, height: r * 6, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,236,205,${0.85 * tw}) 0%, rgba(255,205,150,${0.25 * tw}) 25%, rgba(0,0,0,0) 60%)`}} />
        </Obj>
      );
    })}
  </>
);
const hillPath = (seed: number, w: number, h: number, base: number, amp: number) => {
  let d = `M0 ${h} L0 ${base}`;
  for (let i = 1; i <= 12; i++) {
    const x = (i / 12) * w;
    const y = base - amp * (0.4 + 0.6 * rand(i, seed));
    d += ` Q${x - w / 24} ${y - amp * 0.3} ${x} ${y}`;
  }
  return `${d} L${w} ${h} Z`;
};
const Hills = ({t}: {t: number}) => (
  <>
    <Obj y={-300} z={-3200}>
      <div style={{width: 6400, height: 4600, background: 'linear-gradient(180deg, #0a1430 0%, #1b2b58 42%, #4a4a78 58%, #a0705f 68%, #23284a 76%)'}} />
    </Obj>
    <Obj x={600} y={-80} z={-3000}>
      <div style={{width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,140,0.55) 0%, rgba(255,160,110,0.18) 30%, rgba(0,0,0,0) 65%)'}} />
    </Obj>
    <Obj y={420} z={-2700}>
      <svg width={5200} height={1400} viewBox="0 0 5200 1400">
        <path d={hillPath(3, 5200, 1400, 520, 300)} fill="#2a2f55" />
      </svg>
    </Obj>
    <Obj y={760} z={-2000}>
      <svg width={4400} height={1500} viewBox="0 0 4400 1500">
        <path d={hillPath(7, 4400, 1500, 560, 260)} fill="#1a2245" />
        {Array.from({length: 40}, (_, i) => {
          const x = 120 + i * 105 + rand(i, 9) * 50;
          const y = 640 + rand(i, 10) * 200;
          const on = 0.5 + 0.5 * Math.sin(t * (0.8 + rand(i, 11)) + i);
          return <rect key={i} x={x} y={y} width={10} height={8} fill={`rgba(255,214,150,${0.35 + 0.45 * on})`} />;
        })}
      </svg>
    </Obj>
    <Obj y={1050} z={-1300}>
      <svg width={3600} height={1300} viewBox="0 0 3600 1300">
        <path d={hillPath(13, 3600, 1300, 380, 160)} fill="#0e1533" />
      </svg>
    </Obj>
  </>
);
const Stage = ({cam, t, children, seed = 1}: {cam: Cam; t: number; children: ReactNode; seed?: number}) => (
  <World cam={cam}>
    <Hills t={t} />
    {children}
    <Sparkle t={t} seed={seed} />
  </World>
);

// ---------- her photos ----------
// The exterior photo filling the portrait frame, centred on fx (0–1 across the photo).
const PH_W = 2560;
const PH_H = 1920;
const Outside = ({fx = 0.5, scale = 1, oy = 0, style}: {fx?: number; scale?: number; oy?: number; style?: CSSProperties}) => (
  <div style={{position: 'absolute', left: 540 - fx * PH_W, top: oy, width: PH_W, height: PH_H, transformOrigin: `${fx * 100}% 70%`, transform: `scale(${scale})`, ...style}}>
    <Img src={staticFile(OUTSIDE)} style={{width: PH_W, height: PH_H, display: 'block', filter: GRADE}} />
  </div>
);
const PhotoCard = ({src, w, h, pos = '50% 50%', t, label, zoom = 1}: {src: string; w: number; h: number; pos?: string; t: number; label?: string; zoom?: number}) => (
  <div style={{position: 'relative', width: w, height: h, borderRadius: 30, overflow: 'hidden', border: '6px solid #f2f4f9', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', background: COL.navy}}>
    <Img src={staticFile(src)} style={{width: w, height: h, objectFit: 'cover', objectPosition: pos, filter: GRADE, transformOrigin: pos, transform: `scale(${zoom * (1.04 + Math.sin(t * 0.2) * 0.02)})`}} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 35%)'}} />
    {label && <div style={{position: 'absolute', left: 22, bottom: 22, padding: '8px 22px', borderRadius: 999, background: 'rgba(6,11,26,0.78)', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#fff'}}>{label}</div>}
  </div>
);

// ---------- S1: the house, a dolly up the driveway in two planes; the title ----------
const S1 = ({t}: {t: number}) => {
  const s = SC.S1;
  const lt = t - s.from;
  const end = s.to - s.from + 0.4;
  const k = easeInOut(clamp01(lt / end));
  const sway = Math.sin(lt * 0.6) * 10;
  return (
    <AbsoluteFill style={{background: COL.bg, overflow: 'hidden'}}>
      {/* back plane: the house and sky */}
      <Outside fx={0.5} scale={1.02 + 0.07 * k} style={{transform: `translateX(${sway * 0.4}px) scale(${1.02 + 0.07 * k})`}} />
      {/* front plane: the driveway, moving faster towards us */}
      <div style={{position: 'absolute', inset: 0, WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, #000 76%)', maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, #000 76%)'}}>
        <Outside fx={0.5} scale={1.02 + 0.2 * k} style={{transform: `translateX(${sway * 1.4}px) scale(${1.02 + 0.2 * k})`, transformOrigin: '50% 100%'}} />
      </div>
      {/* a slow sweep of warm light across the facade */}
      <AbsoluteFill style={{mixBlendMode: 'soft-light', background: `linear-gradient(105deg, rgba(255,190,120,0) ${-30 + lt * 18}%, rgba(255,200,130,0.55) ${-10 + lt * 18}%, rgba(255,190,120,0) ${10 + lt * 18}%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,11,26,0.92) 0%, rgba(6,11,26,0.55) 26%, rgba(6,11,26,0) 40%, rgba(6,11,26,0) 66%, rgba(6,11,26,0.85) 88%, rgba(6,11,26,0.95) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img src={staticFile(LOGO)} style={{height: 84, width: 84 * LOGO_AR, opacity: ramp(t, 0, 0.4), filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))'}} />
        <div style={{marginTop: 46}}>
          <Rise text="ХАШАА БАЙШИН" t={t} at={M.title} size={104} weight={900} silver tracking={0.02} stagger={0.03} />
          <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
            <div style={{background: COL.red, borderRadius: 18, padding: '6px 34px 12px', transform: `scaleX(${ramp(t, M.title + 0.3, M.title + 0.75, expoOut)})`, boxShadow: '0 16px 50px rgba(227,38,59,0.5)'}}>
              <Rise text="ХУДАЛДАНА" t={t} at={M.title + 0.45} size={100} weight={900} color="#fff" tracking={0.04} />
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150}}>
        <Rise text="Чингэлтэй дүүрэг" t={t} at={M.title + 0.9} size={64} weight={800} color={COL.white} stagger={0.018} />
        <Rise text="22-р хороо" t={t} at={M.title + 1.1} size={64} weight={800} color={COL.dim} stagger={0.02} style={{marginTop: 6}} />
        <div style={{display: 'flex', gap: 14, marginTop: 34}}>
          <Chip text="Амины орон сууц" t={t} at={M.title + 1.8} size={34} />
          <Chip text="Агуулах" t={t} at={M.title + 2.0} size={34} />
          <Chip text="Ногооны цех" t={t} at={M.title + 2.2} size={34} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S2: the house in numbers: her photos fan in one by one, 224 м², 700 м² ----------
// Yard (photo5, cropped right so the parked car and its plate stay out), then the rooms.
const GALLERY: {src: string; pos: string; label: string; zoom?: number}[] = [
  {src: 'ganaa-house/src/photo5.jpg', pos: '85% 45%', label: 'Хашаа', zoom: 1.45},
  {src: 'ganaa-house/src/photo3.jpg', pos: '45% 50%', label: 'Дотор'},
  {src: 'ganaa-house/src/photo4.jpg', pos: '50% 50%', label: 'Дотор'},
  {src: 'ganaa-house/src/photo6.jpg', pos: '50% 55%', label: 'Дотор'},
  {src: INSIDE, pos: '45% 50%', label: 'Шат'},
];
const S2 = ({t}: {t: number}) => {
  const s = SC.S2;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: track([[-0.3, -50], [end + 0.3, 50]], lt), y: track([[-0.3, 30], [end + 0.3, -20]], lt), z: track([[-0.3, 240], [1.2, 60], [end + 0.3, -40]], lt), yaw: track([[-0.3, -5], [end + 0.3, 4]], lt), pitch: track([[-0.3, 3], [end + 0.3, -1]], lt), roll: 0};
  const step = (end - 0.6) / GALLERY.length;
  const land = ramp(t, M.land - 0.1, M.land + 0.8, expoOut);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Stage cam={cam} t={t} seed={21}>
        {GALLERY.map((g, k) => {
          const at = s.from + 0.1 + k * step;
          if (t < at - 0.3) return null;
          const fly = ramp(t, at - 0.15, at + 0.7, expoOut);
          // How far this card has been pushed back by the later ones (0 while it is the front card).
          let back = 0;
          for (let j = k + 1; j < GALLERY.length; j++) back += ramp(t, s.from + 0.1 + j * step - 0.15, s.from + 0.1 + j * step + 0.6, expoOut);
          if (back > 3.2) return null;
          const side = k % 2 ? 1 : -1;
          return (
            <Obj key={k} x={mix(side * 900, 0, fly) + side * back * 120} y={-430 - back * 40} z={mix(-1200, 40, fly) - back * 380} ry={mix(-side * 60, side * -4, fly) + side * back * 10} rz={side * (2 + back * 2)}>
              <div style={{filter: back > 0.05 ? `brightness(${1 - Math.min(0.55, back * 0.3)})` : undefined}}>
                <PhotoCard src={g.src} w={820} h={600} pos={g.pos} t={t} label={g.label} zoom={g.zoom} />
              </div>
            </Obj>
          );
        })}
      </Stage>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(6,11,26,0.85) 64%, rgba(6,11,26,0.95) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 80px 170px'}}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 30}}>
          <Count to={224} suffix="м²" t={t} at={VAT.V2 + 0.1} size={170} />
          <div style={{paddingBottom: 20}}>
            <Words text="2 давхар амины орон сууц" t={t} at={s.from + 0.6} size={44} weight={750} color={COL.white} style={{textAlign: 'left'}} />
            <Words text="палк тоосгоор барьсан" t={t} at={s.from + 1.1} size={40} weight={600} style={{textAlign: 'left'}} />
          </div>
        </div>
        <div style={{height: 4, background: 'rgba(214,224,242,0.25)', margin: '34px 0', transform: `scaleX(${land})`, transformOrigin: 'left'}} />
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 30}}>
          <Count to={700} suffix="м²" t={t} at={M.land} size={170} color={COL.red} />
          <div style={{paddingBottom: 20}}>
            <Words text="өмчлөх эрхийн газар" t={t} at={M.land + 0.3} size={44} weight={750} color={COL.white} style={{textAlign: 'left'}} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S3: the plot as an isometric plan; the store and the workshop rise out of it ----------
const ISO = (x: number, y: number, z = 0): [number, number] => [(x - y) * 0.866, (x + y) * 0.5 - z];
const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
// A box on the plan: footprint (x, y, w, d), height h scaled by k, three shaded faces.
const Box = ({x, y, w, d, h, k, top, side, front, roof = false}: {x: number; y: number; w: number; d: number; h: number; k: number; top: string; side: string; front: string; roof?: boolean}) => {
  const z = h * clamp01(k);
  if (z <= 0.5) return null;
  const P = (px: number, py: number, pz: number) => ISO(px, py, pz);
  return (
    <g>
      <polygon points={pts([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, z), P(x + w, y, z)])} fill={side} />
      <polygon points={pts([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, z), P(x, y + d, z)])} fill={front} />
      {roof ? (
        <>
          <polygon points={pts([P(x, y, z), P(x + w, y, z), P(x + w, y + d / 2, z + 70 * k), P(x, y + d / 2, z + 70 * k)])} fill={top} />
          <polygon points={pts([P(x, y + d / 2, z + 70 * k), P(x + w, y + d / 2, z + 70 * k), P(x + w, y + d, z), P(x, y + d, z)])} fill={side} />
          <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d / 2, z + 70 * k)])} fill={front} />
        </>
      ) : (
        <polygon points={pts([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)])} fill={top} />
      )}
    </g>
  );
};
const Plot = ({t}: {t: number}) => {
  const s = SC.S3;
  const g = ramp(t, s.from - 0.2, s.from + 0.8, easeOut);
  const house = ramp(t, s.from + 0.1, s.from + 1.0, backOut);
  const store = ramp(t, M.store - 0.2, M.store + 0.7, backOut);
  const shop = ramp(t, M.shop - 0.2, M.shop + 0.7, backOut);
  const fence = ramp(t, s.from, s.from + 1.4, easeInOut);
  const corners: [number, number][] = [ISO(0, 0), ISO(700, 0), ISO(700, 520), ISO(0, 520)];
  const per = 2 * (700 + 520);
  // Frost and steam: tiny particles over the store and the workshop once they are up.
  const flakes = Array.from({length: 14}, (_, i) => {
    const ph = (t * 0.5 + rand(i, 3)) % 1;
    const [fx, fy] = ISO(80 + rand(i, 4) * 200, 300 + rand(i, 5) * 160, 180 + ph * 120);
    return <circle key={i} cx={fx} cy={fy} r={3 + rand(i, 6) * 3} fill={COL.ice} opacity={store * (1 - ph) * 0.9} />;
  });
  return (
    <svg width={1300} height={900} viewBox="-660 -260 1300 900" style={{display: 'block', overflow: 'visible'}}>
      <polygon points={pts(corners)} fill={`rgba(110,150,90,${0.55 * g})`} stroke="none" />
      {/* plot grid */}
      {Array.from({length: 8}, (_, i) => (
        <g key={i} opacity={0.25 * g}>
          <polyline points={pts([ISO((i + 1) * 87, 0), ISO((i + 1) * 87, 520)])} stroke="#eef2fa" strokeWidth={1.5} fill="none" />
        </g>
      ))}
      {/* fence drawing itself around the plot */}
      <polygon points={pts(corners)} fill="none" stroke="#f2f4f9" strokeWidth={6} strokeDasharray={`${fence * per * 1.2} ${per * 2}`} />
      {/* driveway */}
      <polygon points={pts([ISO(560, 0), ISO(660, 0), ISO(660, 520), ISO(560, 520)])} fill={`rgba(190,170,140,${0.6 * g})`} />
      {/* greenhouse (arched, drawn flat) */}
      <polygon points={pts([ISO(40, 40), ISO(240, 40), ISO(240, 140), ISO(40, 140)])} fill={`rgba(200,240,210,${0.35 * g})`} stroke={`rgba(200,240,210,${0.7 * g})`} strokeWidth={3} />
      <Box x={300} y={60} w={220} d={190} h={190} k={house} top="#c8553d" side="#9c3b2b" front="#b5452f" roof />
      <Box x={60} y={300} w={240} d={180} h={130} k={store} top="#cfe9ff" side="#5d8fbf" front="#7fb3e0" />
      <Box x={340} y={320} w={150} d={140} h={100} k={shop} top="#c9efc0" side="#4f8f4a" front="#6fb468" />
      {flakes}
      {/* labels on the blocks */}
      {(() => {
        const [hx, hy] = ISO(410, 155, 300);
        const [sx, sy] = ISO(180, 390, 190);
        const [wx, wy] = ISO(415, 390, 150);
        const tag = (x: number, y: number, k: number, text: string, color: string) => (
          <g transform={`translate(${x} ${y}) scale(${clamp01(k)})`} opacity={clamp01(k)}>
            <rect x={-text.length * 14 - 20} y={-38} width={text.length * 28 + 40} height={60} rx={30} fill={color} />
            <text x={0} y={4} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={38} fill="#fff">{text}</text>
          </g>
        );
        return (
          <>
            {tag(hx, hy, house, '224 м²', '#9c3b2b')}
            {tag(sx, sy, store, '228 м²', '#3c6f9f')}
            {tag(wx, wy, shop, '56 м²', '#3f7a3b')}
          </>
        );
      })()}
    </svg>
  );
};
const S3 = ({t}: {t: number}) => {
  const s = SC.S3;
  const lt = t - s.from;
  const end = s.to - s.from;
  // The camera circles slowly over the plan.
  const cam: Cam = {x: track([[-0.3, 0], [end + 0.3, 30]], lt), y: track([[-0.3, -60], [end + 0.3, -20]], lt), z: track([[-0.3, 300], [1.4, 80], [end + 0.3, -40]], lt), yaw: track([[-0.3, -10], [end + 0.3, 8]], lt), pitch: track([[-0.3, 10], [end + 0.3, 2]], lt), roll: track([[-0.3, -2], [end + 0.3, 1]], lt)};
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Stage cam={cam} t={t} seed={31}>
        <Obj x={40} y={-260} z={-60} s={1.1}>
          <Plot t={t} />
        </Obj>
      </Stage>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,11,26,0.75) 0%, rgba(6,11,26,0) 18%, rgba(0,0,0,0) 52%, rgba(6,11,26,0.88) 66%, rgba(6,11,26,0.96) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 70px 150px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <Snow k={ramp(t, M.store, M.store + 0.5)} t={t} />
          <div>
            <Words text="228 м² хөргүүртэй" t={t} at={M.store} size={56} weight={850} color={COL.white} style={{textAlign: 'left'}} />
            <Words text="зоорь агуулах · гэрчилгээтэй" t={t} at={M.store + 0.4} size={42} weight={600} style={{textAlign: 'left'}} />
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 34}}>
          <Veg k={ramp(t, M.shop, M.shop + 0.5)} t={t} />
          <div>
            <Words text="56 м² хэрчсэн" t={t} at={M.shop} size={56} weight={850} color={COL.white} style={{textAlign: 'left'}} />
            <Words text="ногооны цех" t={t} at={M.shop + 0.3} size={42} weight={600} style={{textAlign: 'left'}} />
          </div>
        </div>
        <div style={{display: 'flex', marginTop: 36}}>
          <Chip text="✓ Тоног төхөөрөмж хэвийн" t={t} at={M.equip} red size={38} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const IconDisc = ({k, color, children}: {k: number; color: string; children: ReactNode}) => (
  <svg width={130} height={130} viewBox="-65 -65 130 130" style={{flex: 'none', transform: `scale(${k === 0 ? 0 : backOut(k)})`}}>
    <circle r={60} fill={color} />
    {children}
  </svg>
);
const Snow = ({k, t}: {k: number; t: number}) => (
  <IconDisc k={k} color="#3c6f9f">
    <g transform={`rotate(${t * 20})`} stroke="#fff" strokeWidth={6} strokeLinecap="round">
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <line x1={0} y1={-36} x2={0} y2={36} />
          <line x1={-10} y1={-26} x2={0} y2={-16} />
          <line x1={10} y1={-26} x2={0} y2={-16} />
          <line x1={-10} y1={26} x2={0} y2={16} />
          <line x1={10} y1={26} x2={0} y2={16} />
        </g>
      ))}
    </g>
  </IconDisc>
);
const Veg = ({k, t}: {k: number; t: number}) => (
  <IconDisc k={k} color="#3f7a3b">
    <g transform={`rotate(${Math.sin(t * 2) * 6})`}>
      <path d="M-6 -10 L22 36 L-30 6 Z" fill="#ff9a3c" />
      <path d="M-8 -12 Q-20 -40 -2 -36 Q4 -48 14 -34 Q30 -36 14 -14 Z" fill="#9be08f" />
    </g>
    {[0, 1, 2].map((i) => (
      <line key={i} x1={-30 + i * 12} y1={22 - i * 6} x2={-22 + i * 12} y2={30 - i * 6} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
    ))}
  </IconDisc>
);

// ---------- S4: the utilities as four tiles flipping onto the plan ----------
const UTIL = [
  {mark: 'u1', title: 'Гүний худаг', color: '#2f6fb0'},
  {mark: 'u2', title: 'Цэвэр, бохир шийдсэн', color: '#3c8f9f'},
  {mark: 'u3', title: '380-ийн тог', color: '#c9821e'},
  {mark: 'u4', title: 'Цахилгаан халаалт', color: COL.red},
] as const;
const UtilIcon = ({i, t}: {i: number; t: number}) => (
  <svg width={170} height={170} viewBox="-85 -85 170 170">
    <circle r={78} fill={UTIL[i].color} />
    {i === 0 && (
      <g>
        <path d="M0 -50 C22 -18 34 0 34 18 A34 34 0 0 1 -34 18 C-34 0 -22 -18 0 -50 Z" fill="#fff" />
        <path d="M-14 16 A14 14 0 0 0 0 30" stroke={UTIL[0].color} strokeWidth={6} fill="none" strokeLinecap="round" />
        <circle cx={0} cy={60 - ((t * 60) % 60)} r={5} fill="#fff" opacity={0.6} />
      </g>
    )}
    {i === 1 && (
      <g stroke="#fff" strokeWidth={12} strokeLinecap="round" fill="none">
        <path d="M-50 -20 L0 -20 Q20 -20 20 0 L20 40" />
        <path d="M-50 30 L-10 30" strokeDasharray="10 14" strokeDashoffset={-t * 40} />
      </g>
    )}
    {i === 2 && (
      <g>
        <path d="M10 -56 L-30 8 L-2 8 L-14 56 L30 -12 L2 -12 Z" fill="#fff" opacity={0.75 + 0.25 * Math.sin(t * 9) ** 2} />
      </g>
    )}
    {i === 3 && (
      <g>
        {[-30, -10, 10, 30].map((x) => (
          <rect key={x} x={x - 7} y={-28} width={14} height={62} rx={7} fill="#fff" />
        ))}
        <rect x={-42} y={30} width={84} height={10} rx={5} fill="#fff" />
        {[-20, 0, 20].map((x, j) => (
          <path key={x} d={`M${x} -38 q-8 -10 0 -20 q8 -10 0 -20`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.4 + 0.5 * Math.sin(t * 3 + j) ** 2} />
        ))}
      </g>
    )}
  </svg>
);
const S4 = ({t}: {t: number}) => {
  const s = SC.S4;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: track([[-0.3, 50], [end + 0.3, -40]], lt), y: 0, z: track([[-0.3, 240], [1.2, 60], [end + 0.3, -50]], lt), yaw: track([[-0.3, 6], [end + 0.3, -5]], lt), pitch: track([[-0.3, -4], [end + 0.3, 2]], lt), roll: 0};
  const pos = [
    [-235, -330],
    [235, -260],
    [-235, 200],
    [235, 270],
  ];
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Stage cam={cam} t={t} seed={41}>
        <Obj y={-60} z={-900} rz={-3} ry={Math.sin(lt * 0.4) * 4}>
          <div style={{filter: 'brightness(0.55) saturate(0.9)'}}>
            <PhotoCard src="ganaa-house/src/photo4.jpg" w={1300} h={1700} pos="62% 50%" t={t} />
          </div>
        </Obj>
        {UTIL.map((u, i) => {
          const at = M[u.mark];
          const q = spring(t, at - 0.15, 1.5, 0.62);
          const k = clamp01(q);
          if (t < at - 0.2) return null;
          return (
            <Obj key={u.mark} x={pos[i][0]} y={pos[i][1] + (1 - k) * 200} z={mix(-900, 0, k) + Math.sin(lt * 1.1 + i) * 18} rx={mix(-85, 0, k) + Math.sin(lt * 0.8 + i) * 3} ry={Math.sin(lt * 0.7 + i * 2) * 5}>
              <div style={{width: 420, height: 470, borderRadius: 36, background: 'linear-gradient(160deg, rgba(38,54,98,0.97) 0%, rgba(14,22,48,0.98) 100%)', border: '2px solid rgba(214,224,242,0.6)', boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 ${60 * Math.exp(-(((t - at) / 0.4) ** 2))}px rgba(255,220,170,0.5)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: 20}}>
                <UtilIcon i={i} t={t} />
                <div style={{fontFamily: SANS, fontWeight: 850, fontSize: 46, lineHeight: 1.1, textAlign: 'center', ...SILVER}}>{u.title}</div>
                <div style={{position: 'absolute', top: 22, right: 26, width: 54, height: 54, borderRadius: 27, background: COL.red, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ramp(t, at + 0.35, at + 0.7, backOut)})`}}>✓</div>
              </div>
            </Obj>
          );
        })}
      </Stage>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(6,11,26,0.85) 85%, rgba(6,11,26,0.95) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150}}>
        <Rise text="БҮХ ДЭД БҮТЭЦ ШИЙДЭГДСЭН" t={t} at={s.from + 0.2} size={54} weight={900} silver stagger={0.015} tracking={0.03} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S5: the location on a tilted map; pins stand up from it ----------
const MAP_W = 980;
const MAP_H = 1300;
const MAP_TILT = 52;
const MAP_Y = 120;
const PLOT = [520, 900] as const;
const MARKET = [400, 260] as const;
const SCHOOL = [720, 560] as const;
const BUS = [700, 1120] as const;
// Where a point of the tilted map lands in the world (map centred at (0, MAP_Y, 0), tilted back by MAP_TILT).
const onMap = ([px, py]: readonly [number, number]) => {
  const dy = py - MAP_H / 2;
  const a = (MAP_TILT * Math.PI) / 180;
  return {x: px - MAP_W / 2, y: MAP_Y + dy * Math.cos(a), z: dy * Math.sin(a)};
};
const Pin = ({k, color, label, sub, children}: {k: number; color: string; label: string; sub?: string; children?: ReactNode}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(-50%) scale(${k === 0 ? 0 : backOut(k)})`, transformOrigin: '50% 100%'}}>
    <div style={{padding: '14px 26px', borderRadius: 24, background: 'rgba(8,14,32,0.92)', border: `3px solid ${color}`, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.55)'}}>
      <div style={{fontFamily: SANS, fontWeight: 850, fontSize: 40, color: '#fff', whiteSpace: 'nowrap'}}>{label}</div>
      {sub && <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color, whiteSpace: 'nowrap'}}>{sub}</div>}
    </div>
    <svg width={70} height={90} viewBox="-35 0 70 90">
      <path d="M0 88 C-6 60 -30 48 -30 28 A30 30 0 0 1 30 28 C30 48 6 60 0 88 Z" fill={color} />
      <circle cx={0} cy={28} r={12} fill="#fff" />
      {children}
    </svg>
  </div>
);
const MapArt = ({t}: {t: number}) => {
  const s = SC.S5;
  const road = ramp(t, M.road - 0.3, M.road + 1.2, easeInOut);
  const route = ramp(t, M.market - 0.1, M.market + 1.6, easeInOut);
  const g = ramp(t, s.from - 0.3, s.from + 0.6);
  return (
    <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{display: 'block'}}>
      <rect width={MAP_W} height={MAP_H} rx={40} fill={`rgba(20,32,66,${0.92 * g})`} stroke={`rgba(214,224,242,${0.5 * g})`} strokeWidth={4} />
      {/* blocks of the district */}
      {Array.from({length: 46}, (_, i) => {
        const x = 40 + rand(i, 61) * 1000;
        const y = 40 + rand(i, 62) * 1200;
        return <rect key={i} x={x} y={y} width={40 + rand(i, 63) * 60} height={30 + rand(i, 64) * 50} rx={6} fill="rgba(110,135,190,0.22)" opacity={g} />;
      })}
      {/* hills */}
      <path d="M0 0 L0 300 Q160 220 260 120 T520 0 Z" fill="rgba(120,140,120,0.22)" />
      {/* the paved road, drawing in */}
      <path d="M-20 980 C300 940 420 900 1120 760" stroke="#e8ecf4" strokeWidth={40} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - road} opacity={0.9} />
      <path d="M-20 980 C300 940 420 900 1120 760" stroke="#f2c14e" strokeWidth={5} fill="none" strokeDasharray="0.02 0.02" pathLength={1} opacity={road} />
      {/* route to the market */}
      <path d={`M${PLOT[0]} ${PLOT[1]} C540 640 380 420 ${MARKET[0]} ${MARKET[1]}`} stroke={COL.red} strokeWidth={14} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - route} />
      <circle cx={PLOT[0]} cy={PLOT[1]} r={40 + 10 * Math.sin(t * 4)} fill="none" stroke={COL.red} strokeWidth={6} opacity={g * 0.7} />
      <text x={150} y={1060} fontFamily={SANS} fontWeight={800} fontSize={40} fill="#e8ecf4" opacity={road}>Засмал зам</text>
    </svg>
  );
};
const S5 = ({t}: {t: number}) => {
  const s = SC.S5;
  const lt = t - s.from;
  const end = s.to - s.from;
  // The camera starts low over the plot and lifts back to see the whole route.
  const cam: Cam = {x: track([[-0.3, 30], [end + 0.3, -20]], lt), y: track([[-0.3, 260], [end + 0.3, 0]], lt), z: track([[-0.3, 380], [end + 0.3, -60]], lt), yaw: track([[-0.3, 8], [end + 0.3, -6]], lt), pitch: track([[-0.3, -8], [end + 0.3, 4]], lt), roll: 0};
  const pins = [
    {p: PLOT, at: s.from + 0.2, color: COL.red, label: 'Худалдах байшин'},
    {p: MARKET, at: M.market + 0.6, color: '#f2c14e', label: 'Хүчит шонхор зах', sub: '2.5 км'},
    {p: SCHOOL, at: M.school, color: '#6fc2ff', label: 'Сургууль, цэцэрлэг'},
    {p: BUS, at: M.transit, color: '#7cc77a', label: 'Нийтийн тээвэр'},
  ];
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Stage cam={cam} t={t} seed={51}>
        <Obj y={MAP_Y} rx={MAP_TILT}>
          <MapArt t={t} />
        </Obj>
        {pins.map((pin) => {
          const w = onMap(pin.p);
          const k = ramp(t, pin.at, pin.at + 0.5);
          if (k <= 0) return null;
          return (
            <Obj key={pin.label} x={w.x} y={w.y} z={w.z + 2}>
              <Pin k={k} color={pin.color} label={pin.label} sub={pin.sub} />
            </Obj>
          );
        })}
      </Stage>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,11,26,0.85) 0%, rgba(6,11,26,0) 20%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 190}}>
        <Rise text="БАЙРШИЛ" t={t} at={s.from + 0.1} size={92} weight={900} silver tracking={0.08} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S6: back to the photo; the camera pans to the greenhouse and rings it ----------
const S6 = ({t}: {t: number}) => {
  const s = SC.S6;
  const k = ramp(t, s.from - 0.2, s.from + 2.2, easeInOut);
  const fx = mix(0.5, 0.26, k);
  const sc = mix(1.1, 1.32, k);
  // The greenhouse sits at about (0.23, 0.6) of the photo; in this framing its centre is near (540, 1150).
  const ring = ramp(t, M.green - 0.1, M.green + 0.9, easeInOut);
  return (
    <AbsoluteFill style={{background: COL.bg, overflow: 'hidden'}}>
      <Outside fx={fx} scale={sc} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,11,26,0.9) 0%, rgba(6,11,26,0.3) 24%, rgba(6,11,26,0) 40%, rgba(6,11,26,0) 72%, rgba(6,11,26,0.9) 88%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={410} cy={1010} rx={440} ry={210} fill="none" stroke={COL.red} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(-3 410 1010)`} style={{filter: 'drop-shadow(0 0 16px rgba(227,38,59,0.7))'}} />
      </svg>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 200}}>
        <Rise text="ХҮЛЭМЖ," t={t} at={M.green} size={96} weight={900} silver tracking={0.03} />
        <Rise text="НОГООН БАЙГУУЛАМЖ" t={t} at={M.green + 0.3} size={70} weight={900} color={COL.white} stagger={0.018} tracking={0.02} style={{marginTop: 6}} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 170}}>
        <Chip text="Үйлдвэрлэл эрхлэх боломжтой" t={t} at={M.prod} red size={46} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S7: the price tag swings in on its string ----------
const S7 = ({t}: {t: number}) => {
  const s = SC.S7;
  const lt = t - s.from;
  const drop = ramp(t, M.price - 0.5, M.price + 0.1, (x) => x * x);
  const swing = t < M.price ? 0 : 18 * Math.exp(-(t - M.price) * 1.6) * Math.sin((t - M.price) * 7);
  const blurK = ramp(t, s.from - 0.3, s.from + 0.6);
  return (
    <AbsoluteFill style={{background: COL.bg, overflow: 'hidden'}}>
      <Outside fx={0.48} scale={1.12 + lt * 0.01} style={{filter: `blur(${10 * blurK}px) brightness(${1 - 0.45 * blurK})`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(6,11,26,0.2) 0%, rgba(6,11,26,0.8) 75%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 230}}>
        <Rise text="ҮНЭ" t={t} at={s.from + 0.1} size={80} weight={900} silver tracking={0.3} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 540, top: -60, transformOrigin: '0 0', transform: `translateY(${(drop - 1) * 1400}px) rotate(${swing}deg)`}}>
        <div style={{position: 'absolute', left: -2, top: 0, width: 4, height: 520, background: 'linear-gradient(180deg, rgba(240,240,240,0.2), #f2f4f9)'}} />
        <div style={{position: 'absolute', left: -380, top: 500, width: 760, height: 520, borderRadius: 40, background: 'linear-gradient(160deg, #f0364b 0%, #c81c30 100%)', boxShadow: '0 50px 110px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', top: 26, width: 44, height: 44, borderRadius: 22, background: COL.bg, border: '4px solid #f2f4f9'}} />
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 210, lineHeight: 1, color: '#fff', marginTop: 40, letterSpacing: '-0.02em'}}>500</div>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 90, color: '#fff', letterSpacing: '0.06em'}}>САЯ ₮</div>
        </div>
      </div>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 260}}>
        <Chip text="💰 Банкны зээл шийднэ" t={t} at={M.loan} size={54} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S8: RE/MAX WIN and her name; no phone (she puts it in the post text) ----------
const S8 = ({t}: {t: number}) => {
  const s = SC.S8;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: 0, y: 0, z: track([[-0.3, 260], [1.4, 40], [end, -60]], lt), yaw: track([[-0.3, -5], [1.4, 0], [end, 2]], lt), pitch: 0, roll: 0};
  const card = ramp(t, s.from - 0.1, s.from + 0.9, expoOut);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Stage cam={cam} t={t} seed={61}>
        {[
          {src: 'ganaa-house/src/photo3.jpg', x: -330, rz: -9, d: 0.25},
          {src: 'ganaa-house/src/photo6.jpg', x: 330, rz: 9, d: 0.4},
          {src: OUTSIDE, x: 0, rz: -2, d: 0},
        ].map((c) => {
          const k = ramp(t, s.from - 0.1 + c.d, s.from + 0.9 + c.d, expoOut);
          return (
            <Obj key={c.src} x={c.x * k} y={-60 + (c.x ? 40 : 0)} z={mix(-800, c.x ? -320 : -200, k)} ry={mix(30, -6 + Math.sin(lt * 0.6) * 3, card)} rz={c.rz * k}>
              <PhotoCard src={c.src} w={c.x ? 560 : 760} h={c.x ? 420 : 560} pos="47% 55%" t={t} />
            </Obj>
          );
        })}
      </Stage>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,11,26,0.85) 0%, rgba(6,11,26,0.2) 22%, rgba(0,0,0,0) 40%, rgba(6,11,26,0.85) 62%, rgba(6,11,26,0.96) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 110}}>
        <Img src={staticFile(LOGO)} style={{height: 110, width: 110 * LOGO_AR, opacity: ramp(t, s.from + 0.1, s.from + 0.6), transform: `translateY(${(1 - ramp(t, s.from + 0.1, s.from + 0.6, easeOut)) * 30}px)`, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', padding: '0 70px 200px'}}>
        <Words text="Дэлгэрэнгүй мэдээллийг" t={t} at={s.from + 0.35} per={0.08} size={54} weight={700} color={COL.white} />
        <Rise text="СИЛВЕР АГЕНТ" t={t} at={M.name - 0.1} size={50} weight={700} tracking={0.3} color={COL.dim} style={{marginTop: 30}} />
        <Rise text="М.ГАНТУЯА" t={t} at={M.name + 0.15} size={150} weight={900} silver tracking={0.02} />
        <Rise text="-гаас аваарай" t={t} at={M.name + 0.7} size={54} weight={700} color={COL.white} stagger={0.02} style={{marginTop: 4}} />
        <div style={{marginTop: 40, width: 360, height: 8, borderRadius: 4, background: COL.red, transform: `scaleX(${ramp(t, M.name + 0.9, M.name + 1.5, expoOut)})`}} />
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
const ORDER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'] as const;
const VIEWS: Record<(typeof ORDER)[number], (p: {t: number}) => ReactNode> = {S1, S2, S3, S4, S5, S6, S7, S8};
const Bloom = ({t}: {t: number}) => {
  const g = Math.max(...ORDER.slice(1).map((id) => Math.exp(-(((t - SC[id].from) / 0.18) ** 2))));
  if (g < 0.01) return null;
  return <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 45%, rgba(255,225,190,${0.42 * g}) 0%, rgba(200,170,230,${0.18 * g}) 36%, rgba(0,0,0,0) 68%)`}} />;
};

const Scenes = () => {
  const t = useT();
  const corner = lin(t, SC.S2.from + 0.25, SC.S2.from + 0.65) * (1 - lin(t, SC.S8.from - 0.3, SC.S8.from + 0.1));
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {ORDER.map((id, i) => {
        const s = SC[id];
        const View = VIEWS[id];
        if (!active(t, s, i === 0 ? 0 : 0.3, i === ORDER.length - 1 ? 0 : 0.3)) return null;
        return i === 0 ? (
          <View key={id} t={t} />
        ) : (
          <Fade key={id} t={t} at={s.from} dur={0.4}>
            <View t={t} />
          </Fade>
        );
      })}
      {corner > 0.01 && (
        <AbsoluteFill style={{alignItems: 'flex-end', padding: '64px 54px 0 0', opacity: corner}}>
          <Img src={staticFile(LOGO)} style={{height: 56, width: 56 * LOGO_AR, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.55))'}} />
        </AbsoluteFill>
      )}
      <Bloom t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.38) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const GanaaHouse = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <Fonts />
    <Scenes />
    <Audio src={staticFile('ganaa-house/stems/voice.wav')} name="Voice" />
    <Audio src={staticFile('ganaa-house/stems/music.wav')} name="Music" />
    <Audio src={staticFile('ganaa-house/stems/sfx.wav')} name="Sound effects" />
  </AbsoluteFill>
);
