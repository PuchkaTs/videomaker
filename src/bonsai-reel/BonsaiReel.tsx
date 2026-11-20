// BonsaiReel «Байгалийг гэртээ ургуул» for Бонсай мод mongolia: 1080×1920, 60 fps, about 30 s.
// 2.5D: every scene is a CSS-3D world of planes (ink mountains, photo/clip plates, cards, type) under a
// moving camera. Timeline from cues.json (npm run build:bonsai-reel); footage and images from plan.json
// "media" (Wan clips); until a clip exists the scene uses the client's photo. Plan: docs/bonsai-reel/storyboard.md.
import type {CSSProperties, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {MotionBlur, Obj, World} from '../kublai-agents-v2/world';
import type {Cam} from '../kublai-agents-v2/world';
import {backOut, clamp01, easeInOut, easeOut, expoOut, lin, mix, ramp, rand, spring, track, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';
import mapJson from './map.json';
import planJson from './plan.json';

export const BONSAI_REEL_FPS = 60;
export const BONSAI_REEL_DURATION = Math.round(cuesJson.duration * BONSAI_REEL_FPS);

type Scene = {id: string; from: number; to: number};
const C = cuesJson;
const SC = Object.fromEntries(C.scenes.map((s) => [s.id, s])) as Record<string, Scene>;
const M = C.marks;
const MEDIA = ((planJson as {media?: Record<string, string>}).media ?? {}) as Record<string, string>;
const MEDIA_SECONDS = ((planJson as {mediaSeconds?: Record<string, number>}).mediaSeconds ?? {}) as Record<string, number>;

const SERIF = "'Cormorant', 'Noto Serif', Georgia, serif";
const SANS = "'Inter', 'Noto Sans', Arial, sans-serif";
const COL = {bg: '#0b0806', gold: '#d9b26a', goldHi: '#f6dca0', cream: '#f4ead8', ink: '#1a1410', green: '#8fb460'};
const GOLD_TEXT: CSSProperties = {
  background: 'linear-gradient(180deg, #fff1c9 0%, #f0cf86 38%, #c9973f 70%, #f3d79b 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

const P1 = 'bonsai-reel/src/p1-juniper-black-pot.jpg';
const P2 = 'bonsai-reel/src/p2-boxwood-blue-pot.jpg';
const P3 = 'bonsai-reel/src/p3-landscape-pagoda-real.jpg';
const LOGO = 'bonsai-reel/src/logo-alpha.png';

// ---------- fonts ----------
const FACES: [string, string, string][] = [
  ['Cormorant', 'fonts/Cormorant-Variable.ttf', '300 700'],
  ['Inter', 'fonts/Inter-Variable.ttf', '100 900'],
];
let fontsLoading: Promise<unknown> | undefined;
const Fonts = () => {
  const [handle] = useState(() => delayRender('Loading Cormorant and Inter'));
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

// ---------- shared pieces ----------
const active = (t: number, s: Scene, before = 0, after = 0) => t >= s.from - before && t < s.to + after;
// Titles leave before the cut (rise and fade), so two titles never overlap in a transition.
const exitK = (t: number, s: Scene) => ramp(t, s.to - 0.38, s.to - 0.08, easeInOut);
const exitStyle = (t: number, s: Scene): CSSProperties => {
  const k = exitK(t, s);
  return k > 0 ? {opacity: 1 - k, transform: `translateY(${-50 * k}px)`, filter: `blur(${6 * k}px)`} : {};
};

// A plate: a clip if plan.json names one, else the still photo with a slow drift of its own.
const Plate = ({clip, still, t, from, w, h, rate = 1, fit = 'cover', pos = '50% 50%'}: {clip?: string; still: string; t: number; from: number; w: number; h: number; rate?: number; fit?: 'cover' | 'contain'; pos?: string}) => {
  const style: CSSProperties = {width: w, height: h, objectFit: fit, objectPosition: pos, display: 'block'};
  if (clip)
    return (
      <Sequence from={Math.round(from * BONSAI_REEL_FPS)} layout="none">
        <OffthreadVideo src={staticFile(clip)} muted playbackRate={rate} style={style} />
      </Sequence>
    );
  const k = Math.max(0, t - from);
  return (
    <div style={{width: w, height: h, overflow: 'hidden'}}>
      <Img src={staticFile(still)} style={{...style, transform: `scale(${1.04 + k * 0.012}) translateY(${-k * 3}px)`}} />
    </div>
  );
};

// Letters that rise into place one by one; leaf spans only, so opacity is safe in 3D.
// gold: each letter carries its own gradient (background-clip text does not reach transformed children).
const Rise = ({text, t, at, size, style, gold = false, shadow = 0.6, stagger = 0.035, dur = 0.55, lift = 60, weight = 600, tracking = 0.02}: {text: string; t: number; at: number; size: number; style?: CSSProperties; gold?: boolean; shadow?: number; stagger?: number; dur?: number; lift?: number; weight?: number; tracking?: number}) => (
  <div style={{fontFamily: SERIF, fontSize: size, fontWeight: weight, lineHeight: 1.02, letterSpacing: `${tracking}em`, whiteSpace: 'pre', textAlign: 'center', ...style}}>
    {[...text].map((ch, i) => {
      const k = ramp(t, at + i * stagger, at + i * stagger + dur, expoOut);
      const blur = k < 0.98 ? `blur(${(1 - k) * 8}px) ` : '';
      return (
        <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * lift}px) scale(${0.92 + 0.08 * k})`, ...(gold ? GOLD_TEXT : null), filter: `${blur}drop-shadow(0 4px ${18 * shadow + 4}px rgba(0,0,0,${shadow}))`}}>
          {ch === ' ' ? ' ' : ch}
        </span>
      );
    })}
  </div>
);

// Soft golden dust drifting through a scene, spread in depth.
const Dust = ({t, n = 26, seed = 1, spread = 900, zNear = 300, zFar = -1200, y0 = 0}: {t: number; n?: number; seed?: number; spread?: number; zNear?: number; zFar?: number; y0?: number}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const z = mix(zFar, zNear, rand(i, seed));
      const x = (rand(i, seed + 1) - 0.5) * spread * 2 + Math.sin(t * 0.4 + i) * 30;
      const y = y0 + (rand(i, seed + 2) - 0.5) * 1700 - ((t * (14 + rand(i, seed + 3) * 22)) % 400);
      const r = 3 + rand(i, seed + 4) * 7;
      const tw = 0.45 + 0.55 * Math.sin(t * (1.2 + rand(i, seed + 5)) + i * 2) ** 2;
      return (
        <Obj key={i} x={x} y={y} z={z}>
          <div style={{width: r * 6, height: r * 6, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,226,160,${0.9 * tw}) 0%, rgba(255,200,110,${0.35 * tw}) 22%, rgba(255,190,90,0) 60%)`}} />
        </Obj>
      );
    })}
  </>
);

// An ink-wash ridge: a filled mountain line built from layered sines, deterministic per seed.
const ridgeY = (seed: number, w: number, base: number, amp: number, peaks: number, x: number) => {
  const u = x / w;
  let y = 0;
  for (let k = 1; k <= 4; k++) y += Math.sin(u * Math.PI * (peaks * k * 0.9) + rand(k, seed) * 6.28) / (k * 1.3);
  const env = Math.sin(u * Math.PI) ** 0.6;
  return base - amp * (0.55 + 0.45 * y) * env;
};
const ridgePath = (seed: number, w: number, h: number, base: number, amp: number, peaks = 3) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 24) pts.push(`${x},${ridgeY(seed, w, base, amp, peaks, x).toFixed(1)}`);
  return `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
};
const Ridge = ({seed, w = 3000, h = 1500, base, amp, top, bottom, peaks, children}: {seed: number; w?: number; h?: number; base: number; amp: number; top: string; bottom: string; peaks?: number; children?: ReactNode}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display: 'block', overflow: 'visible'}}>
    <defs>
      <linearGradient id={`rg${seed}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset={`${((base - amp) / h) * 100}%`} stopColor={top} />
        <stop offset={`${((base + 40) / h) * 100}%`} stopColor={top} stopOpacity={0.92} />
        <stop offset={`${Math.min(100, ((base + 420) / h) * 100)}%`} stopColor={bottom} stopOpacity={1} />
      </linearGradient>
    </defs>
    <path d={ridgePath(seed, w, h, base, amp, peaks)} fill={`url(#rg${seed})`} />
    <path d={ridgePath(seed, w, h, base, amp, peaks)} fill="none" stroke={top} strokeWidth={5} strokeOpacity={0.7} />
    {children}
  </svg>
);

// ---------- S2: the opening. The living tree fills frame 0, the title is already there and settling ----------
const Leaf = ({flip = false, color = '#0d1a10'}: {flip?: boolean; color?: string}) => (
  <svg width={620} height={900} viewBox="0 0 620 900" style={{transform: flip ? 'scaleX(-1)' : undefined}}>
    <g fill={color}>
      <path d="M40,900 C60,600 120,380 210,120 C215,110 225,112 222,124 C150,400 110,620 90,900 Z" />
      {Array.from({length: 7}, (_, i) => (
        <path key={i} d={`M${120 + i * 14},${760 - i * 95} q${120 + i * 10},-${40 + i * 8} ${230 - i * 12},-${150 - i * 6} q-${150 - i * 8},${20 + i * 3} -${230 - i * 12},${150 - i * 6} Z`} />
      ))}
    </g>
  </svg>
);
const S2 = ({t}: {t: number}) => {
  const s = SC.S2;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {
    x: track([[0, -70], [end + 0.4, 50]], lt),
    y: track([[0, 60], [end + 0.4, -20]], lt),
    z: track([[0, 300], [0.9, 60], [end + 0.4, -240]], lt),
    yaw: track([[0, 3], [end + 0.4, -2]], lt),
    pitch: 0,
    roll: track([[0, -1.2], [1, 0]], lt),
  };
  return (
    <AbsoluteFill style={{background: '#120c08'}}>
      <World cam={cam}>
        <Obj z={-700}>
          <Plate clip={MEDIA.W1} still={P1} t={t} from={s.from} w={2070} h={2760} />
        </Obj>
        <Dust t={t} n={22} seed={21} zNear={600} zFar={-500} spread={800} y0={-100} />
        <Obj x={-640} y={420} z={520} blur={10}>
          <Leaf color="#07100a" />
        </Obj>
        <Obj x={680} y={-560} z={420} rz={190} blur={9}>
          <Leaf flip color="#0a140c" />
        </Obj>
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(8,5,3,0.8) 88%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300, ...exitStyle(t, s)}}>
        <Rise text="БОНСАЙ МОД" t={t} at={s.from - 0.6} size={104} weight={600} tracking={0.16} stagger={0.02} style={{color: COL.cream}} shadow={0.8} />
        <Rise text="АМЬД УРЛАГ" t={t} at={s.from - 0.5} size={142} weight={700} tracking={0.01} stagger={0.025} gold shadow={0.8} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S3: every design is different ----------
const Card = ({src, w, h, t, from, clip, rate = 1, glow = 0, dim = 0}: {src: string; w: number; h: number; t: number; from: number; clip?: string; rate?: number; glow?: number; dim?: number}) => (
  <div style={{position: 'relative', width: w, height: h, borderRadius: 26, overflow: 'hidden', boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 ${60 * glow}px rgba(246,214,150,${0.55 * glow})`, outline: `2px solid rgba(232,196,128,${0.35 + glow * 0.6})`, outlineOffset: -2}}>
    <Plate clip={clip} still={src} t={t} from={from} w={w} h={h} rate={rate} />
    {dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(8,5,3,${dim})`}} />}
  </div>
);
const S3 = ({t}: {t: number}) => {
  const s = SC.S3;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {
    x: track([[-0.4, 220], [end + 0.4, -160]], lt),
    y: track([[-0.4, 60], [end + 0.4, -30]], lt),
    z: track([[-0.4, 900], [0.7, 120], [end + 0.4, -120]], lt),
    yaw: track([[-0.4, 9], [end + 0.4, -7]], lt),
    pitch: track([[-0.4, -3], [end, 1]], lt),
    roll: 0,
  };
  const enter = ramp(t, s.from - 0.3, s.from + 0.6, easeOut);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #6a4a2b 0%, #2a1c12 38%, #0d0906 75%)'}}>
      <World cam={cam}>
        <Obj z={-1600} y={-200}>
          <div style={{width: 2000, height: 2000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,214,150,0.55) 0%, rgba(255,190,110,0.18) 38%, rgba(0,0,0,0) 62%)'}} />
        </Obj>
        <Obj x={-470} y={-120} z={-1000} ry={22}>
          <Card src={P3} w={560} h={725} t={t} from={s.from} dim={0.25} />
        </Obj>
        <Obj x={470} y={-160} z={-1050} ry={-22}>
          <Card src={P1} w={560} h={747} t={t} from={s.from} dim={0.25} />
        </Obj>
        <Obj x={0} y={-80} z={-260} s={mix(1.25, 1, enter)}>
          <Card src={P2} clip={MEDIA.W2} w={880} h={1056} t={t} from={s.from - 0.3} glow={0.6} />
        </Obj>
        <Obj x={cam.x * 0.9} y={560 - 50 * exitK(t, s)} z={60} ry={-cam.yaw * 0.6} o={1 - exitK(t, s)}>
          <Rise text="ЗАГВАР БҮР" t={t} at={s.from + 0.3} size={104} weight={500} tracking={0.12} style={{color: COL.cream}} shadow={0.75} />
          <Rise text="ӨВӨРМӨЦ" t={t} at={s.from + 0.75} size={160} weight={700} gold shadow={0.75} />
        </Obj>
        <Dust t={t} n={20} seed={31} zNear={400} zFar={-1400} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- S4: the tree in four places, then all four at once ----------
const ROOMS = [
  {id: 'R1', label: 'ГЭР', still: P2},
  {id: 'R2', label: 'АЖЛЫН ӨРӨӨ', still: P1},
  {id: 'R3', label: 'ХООЛНЫ ГАЗАР', still: P2},
  {id: 'R4', label: 'ЗОЧИД БУУДАЛ', still: P1},
];
const ROOM_W = 900;
const ROOM_H = 1600;
const ROOM_GAP = 1060;
const S4 = ({t}: {t: number}) => {
  const s = SC.S4;
  const rooms = M.rooms;
  const wall = ramp(t, M.everywhere, M.everywhere + 0.9, easeInOut);
  // Carousel position: which room the camera faces, moving quickly between words.
  const keys: [number, number][] = [[s.from - 0.4, -0.25]];
  rooms.forEach((at, i) => {
    keys.push([at - 0.22, i === 0 ? 0 : i - 1]);
    keys.push([at + 0.18, i]);
  });
  keys.push([M.everywhere, 3]);
  const idx = track(keys, t);
  const vel = (track(keys, t + 0.02) - track(keys, t - 0.02)) / 0.04;
  const camCarousel: Cam = {x: idx * ROOM_GAP, y: 0, z: 140 - (t - s.from) * 18, yaw: clamp01(Math.abs(vel) / 6) * Math.sign(vel) * -6, pitch: 0, roll: 0};
  const camWall: Cam = {x: 0, y: 30, z: 900, yaw: -8 + (t - M.everywhere) * 2.2, pitch: 4, roll: 0};
  const cam: Cam = {
    x: mix(camCarousel.x, camWall.x, wall),
    y: mix(camCarousel.y, camWall.y, wall),
    z: mix(camCarousel.z, camWall.z, wall),
    yaw: mix(camCarousel.yaw, camWall.yaw, wall),
    pitch: mix(0, camWall.pitch, wall),
    roll: 0,
  };
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #3b2817 0%, #140e09 60%, #080605 100%)'}}>
      <World cam={cam}>
        {ROOMS.map((r, i) => {
          const gx = (i % 2 === 0 ? -1 : 1) * 470;
          const gy = (i < 2 ? -1 : 1) * 820 - 60;
          const x = mix(i * ROOM_GAP, gx, wall);
          const y = mix(0, gy, wall);
          const z = mix(-300, -420, wall);
          const sc = mix(1, 0.5, wall);
          const near = 1 - clamp01(Math.abs(idx - i) - 0.2) * (1 - wall);
          const pop = spring(t, rooms[i] - 0.05, 2.2, 0.6);
          const clip = MEDIA[r.id + 'v'];
          const image = MEDIA[r.id];
          return (
            <Obj key={r.id} x={x} y={y} z={z} s={sc} ry={mix((i - idx) * -10, 0, wall)} preserve>
              <div style={{position: 'relative'}}>
                <Card src={image ?? r.still} clip={clip} rate={Math.min(0.9, ((MEDIA_SECONDS[r.id + 'v'] ?? 5) - 0.1) / (s.to + 0.35 - (rooms[i] - 0.3)))} w={ROOM_W} h={ROOM_H} t={t} from={rooms[i] - 0.3} glow={0.3 + 0.4 * near} dim={0.45 * (1 - near)} />
                <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%', borderRadius: '0 0 26px 26px', background: 'linear-gradient(180deg, rgba(8,5,3,0) 0%, rgba(8,5,3,0.55) 45%, rgba(8,5,3,0.88) 100%)'}} />
                <div style={{position: 'absolute', left: 0, right: 0, bottom: 120 * mix(1, 1.6, wall), textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: mix(132, 150, wall), letterSpacing: '0.06em', ...GOLD_TEXT, transform: `translateY(${(1 - clamp01(pop)) * 60}px)`, filter: 'drop-shadow(0 6px 22px rgba(0,0,0,0.85))'}}>
                  {r.label}
                </div>
              </div>
            </Obj>
          );
        })}
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 60%, rgba(6,4,3,0.55) 100%)'}} />
      {t > M.everywhere && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', ...exitStyle(t, s)}}>
          <div style={{padding: '30px 60px 40px', background: `radial-gradient(ellipse, rgba(10,7,4,${0.82 * wall}) 0%, rgba(10,7,4,${0.6 * wall}) 55%, rgba(10,7,4,0) 75%)`}}>
            <Rise text="ХААНА Ч" t={t} at={M.everywhere + 0.25} size={120} weight={500} tracking={0.14} style={{color: COL.cream}} />
            <Rise text="ТАНСАГ" t={t} at={M.everywhere + 0.55} size={210} weight={700} gold />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------- S5: delivery across Mongolia ----------
const smooth = (pts: number[][]) => {
  const n = pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[(i + 2) % n];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + ' Z';
};
const OUTLINE = smooth(mapJson.outline);
const UB = (mapJson.cities as Record<string, number[]>)['Улаанбаатар'];
const DEST = Object.entries(mapJson.cities as Record<string, number[]>).filter(([k]) => k !== 'Улаанбаатар');
const S5 = ({t}: {t: number}) => {
  const s = SC.S5;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {
    x: track([[-0.4, -80], [end + 0.4, 60]], lt),
    y: track([[-0.4, 160], [end + 0.4, 40]], lt),
    z: track([[-0.4, 600], [0.6, 120], [end + 0.4, -60]], lt),
    yaw: track([[-0.4, -10], [end + 0.4, 6]], lt),
    pitch: track([[-0.4, 8], [end + 0.4, 2]], lt),
    roll: 0,
  };
  const draw = ramp(t, s.from - 0.1, s.from + 0.7, easeOut);
  const MW = mapJson.width;
  const MH = mapJson.height;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 60%, #2b1d12 0%, #0d0906 70%)'}}>
      <World cam={cam}>
        <Obj y={-60} z={-1800}>
          <Ridge seed={7} base={600} amp={260} top="#4a3524" bottom="#1a120c" peaks={2.6} />
        </Obj>
        <Obj x={0} y={300} z={-200} rx={50} s={1.45}>
          <svg width={MW + 80} height={MH + 80} viewBox={`-40 -40 ${MW + 80} ${MH + 80}`} style={{overflow: 'visible'}}>
            <defs>
              <linearGradient id="mapfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2c3a1f" />
                <stop offset="100%" stopColor="#141a0e" />
              </linearGradient>
            </defs>
            <path d={OUTLINE} fill="url(#mapfill)" fillOpacity={0.85 * draw} stroke={COL.gold} strokeWidth={3.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            {DEST.map(([name, [x, y]], i) => {
              const at = s.from + 0.3 + i * 0.09;
              const k = ramp(t, at, at + 0.55, easeInOut);
              const mx = (UB[0] + x) / 2;
              const my = Math.min(UB[1], y) - 60 - Math.abs(x - UB[0]) * 0.12;
              const land = spring(t, at + 0.5, 2.6, 0.5);
              return (
                <g key={name}>
                  <path d={`M${UB[0]},${UB[1]} Q${mx},${my} ${x},${y}`} fill="none" stroke={COL.goldHi} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} opacity={0.9} />
                  {land > 0.01 && <circle cx={x} cy={y} r={7 * clamp01(land) + 0.01} fill={COL.goldHi} />}
                  {land > 0.01 && <circle cx={x} cy={y} r={7 + 18 * clamp01(t - at - 0.5)} fill="none" stroke={COL.goldHi} strokeOpacity={Math.max(0, 0.7 - (t - at - 0.5))} strokeWidth={2} />}
                </g>
              );
            })}
            <circle cx={UB[0]} cy={UB[1]} r={12 + Math.sin(t * 6) * 1.5} fill={COL.goldHi} />
            <circle cx={UB[0]} cy={UB[1]} r={30} fill="none" stroke={COL.goldHi} strokeOpacity={0.5} strokeWidth={2} />
          </svg>
        </Obj>
        <Obj y={-460 - 50 * exitK(t, s)} z={40} ry={-cam.yaw * 0.5} o={1 - exitK(t, s)}>
          <Rise text="МОНГОЛ ДАЯАР" t={t} at={s.from + 0.15} size={104} weight={500} tracking={0.1} style={{color: COL.cream}} />
          <Rise text="ХҮРГЭНЭ" t={t} at={s.from + 0.5} size={204} weight={700} gold />
        </Obj>
        <Dust t={t} n={16} seed={51} zNear={300} zFar={-1500} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- S6: pick a tree, comment «1» ----------
const S6 = ({t}: {t: number}) => {
  const s = SC.S6;
  const lt = t - s.from;
  const end = s.to - s.from;
  const pick = ramp(t, M.pick, M.pick + 0.7, easeInOut);
  const bar = spring(t, M.comment, 1.8, 0.7);
  const typed = t >= M.one;
  const sent = ramp(t, M.one + 0.45, M.one + 0.75, easeOut);
  const big = spring(t, M.one + 0.1, 1.6, 0.55);
  const cam: Cam = {
    x: track([[-0.4, 0], [end + 0.4, 20]], lt),
    y: track([[-0.4, 120], [end + 0.4, 0]], lt),
    z: track([[-0.4, 700], [0.6, 160], [end + 0.4, 40]], lt),
    yaw: track([[-0.4, 6], [end + 0.4, -3]], lt),
    pitch: 0,
    roll: 0,
  };
  const cards = [
    {src: P1, x: -380, ry: 24},
    {src: P2, x: 0, ry: 0},
    {src: P3, x: 380, ry: -24},
  ];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 38%, #4a3220 0%, #150e09 55%, #080605 100%)'}}>
      <World cam={cam}>
        {cards.map((c, i) => {
          const chosen = i === 0;
          const x = chosen ? mix(c.x, 0, pick) : mix(c.x, c.x * 1.35, pick);
          const z = chosen ? mix(-560, -160, pick) : mix(i === 1 ? -420 : -560, -900, pick);
          const ry = chosen ? mix(c.ry, 0, pick) : c.ry;
          const y = mix(-90, chosen ? -120 : -40, pick);
          return (
            <Obj key={i} x={x} y={y} z={z} ry={ry}>
              <Card src={c.src} w={500} h={666} t={t} from={s.from} glow={chosen ? 0.2 + pick * 0.8 : 0.2} dim={chosen ? 0 : 0.5 * pick} />
            </Obj>
          );
        })}
        <Obj x={300} y={150} z={60} s={0.5 + 0.5 * clamp01(big)} rz={(1 - clamp01(big)) * 12}>
          <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 520, lineHeight: 1, ...GOLD_TEXT, opacity: clamp01(big), filter: 'drop-shadow(0 0 40px rgba(246,214,150,0.45)) drop-shadow(0 20px 40px rgba(0,0,0,0.7))'}}>1</div>
        </Obj>
        {bar > 0.01 && (
          <Obj y={540} z={80} rx={(1 - clamp01(bar)) * -80}>
            <div style={{width: 920, height: 136, borderRadius: 68, background: 'rgba(28,22,17,0.92)', border: '2px solid rgba(232,196,128,0.55)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 22, boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
              <div style={{width: 92, height: 92, borderRadius: '50%', overflow: 'hidden', background: '#000', flexShrink: 0}}>
                <Img src={staticFile(LOGO)} style={{width: 92, height: 92}} />
              </div>
              <div style={{flex: 1, fontFamily: SANS, fontSize: 44, color: typed ? COL.cream : 'rgba(244,234,216,0.45)', fontWeight: typed ? 700 : 400}}>
                {typed ? '1' : 'Сэтгэгдэл бичих…'}
                {typed && sent < 0.5 && <span style={{opacity: Math.sin(t * 12) > 0 ? 1 : 0, color: COL.gold}}>|</span>}
              </div>
              <div style={{width: 92, height: 92, borderRadius: '50%', background: typed ? COL.gold : 'rgba(232,196,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.25 * Math.sin(Math.PI * sent)})`}}>
                <svg width={44} height={44} viewBox="0 0 24 24"><path d="M3 11.5 21 3l-8.5 18-2.2-7.3L3 11.5Z" fill={typed ? '#1a120a' : 'rgba(244,234,216,0.6)'} /></svg>
              </div>
            </div>
          </Obj>
        )}
        <Dust t={t} n={16} seed={61} zNear={300} zFar={-1200} />
      </World>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 210, ...exitStyle(t, s)}}>
        <div style={{position: 'relative', width: 1000, height: 330}}>
          <AbsoluteFill style={{alignItems: 'center', opacity: 1 - lin(t, M.comment - 0.2, M.comment + 0.05), transform: `translateY(${-40 * lin(t, M.comment - 0.2, M.comment + 0.05)}px)`}}>
            <Rise text="ТААЛАГДСАН" t={t} at={s.from + 0.25} size={104} weight={500} tracking={0.12} style={{color: COL.cream}} />
            <Rise text="ЗАГВАРАА СОНГООД" t={t} at={s.from + 0.5} size={98} weight={700} gold />
          </AbsoluteFill>
          <AbsoluteFill style={{alignItems: 'center'}}>
            <Rise text="СЭТГЭГДЭЛД" t={t} at={M.comment + 0.05} size={104} weight={500} tracking={0.12} style={{color: COL.cream}} />
            <Rise text="«1» ГЭЖ БИЧЭЭРЭЙ" t={t} at={M.comment + 0.25} size={100} weight={700} gold />
          </AbsoluteFill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- S7: the light closes into the logo ring ----------
const S7 = ({t}: {t: number}) => {
  const s = SC.S7;
  const lt = t - s.from;
  const ring = ramp(t, s.from - 0.2, M.logo + 0.5, easeInOut);
  const logoK = ramp(t, M.logo + 0.1, M.logo + 0.9, easeOut);
  const sweep = lin(t, M.logo + 0.6, M.logo + 1.8);
  const LOGO_SIZE = 900;
  const cam: Cam = {x: 0, y: 0, z: track([[-0.3, 500], [1, 60], [s.to - s.from, -60]], lt), yaw: track([[-0.3, 5], [1.2, 0]], lt), pitch: 0, roll: 0};
  const r = mix(1500, 400, ring);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <Obj y={-200} z={-400}>
          <div style={{width: r * 2.4, height: r * 2.4, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,214,150,${0.35 * (1 - logoK * 0.6)}) 0%, rgba(255,190,110,${0.12}) 40%, rgba(0,0,0,0) 62%)`}} />
        </Obj>
        <Obj y={-200} z={-100} s={mix(1.18, 1, logoK)}>
          <div style={{position: 'relative', width: LOGO_SIZE, height: LOGO_SIZE, opacity: logoK}}>
            <Img src={staticFile(LOGO)} style={{width: LOGO_SIZE, height: LOGO_SIZE, filter: 'drop-shadow(0 0 30px rgba(246,200,120,0.25))'}} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep * 140 - 30}%, rgba(255,248,225,0.75) ${sweep * 140 - 15}%, rgba(255,255,255,0) ${sweep * 140}%)`,
                WebkitMaskImage: `url(${staticFile(LOGO)})`,
                maskImage: `url(${staticFile(LOGO)})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />
          </div>
        </Obj>
        <Dust t={t} n={22} seed={71} zNear={300} zFar={-900} />
      </World>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
        <Rise text="БАЙГАЛИЙГ" t={t} at={M.tagline} size={92} weight={500} tracking={0.14} stagger={0.03} style={{color: COL.cream}} />
        <Rise text="ГЭРТЭЭ УРГУУЛ" t={t} at={M.tagline + 0.3} size={124} weight={700} tracking={0.03} stagger={0.03} gold />
        <div style={{marginTop: 46, padding: '18px 46px', borderRadius: 999, border: '2px solid rgba(232,196,128,0.6)', fontFamily: SANS, fontWeight: 600, fontSize: 50, color: COL.cream, letterSpacing: '0.04em', opacity: ramp(t, M.tagline + 0.6, M.tagline + 1.1), transform: `translateY(${(1 - ramp(t, M.tagline + 0.6, M.tagline + 1.1, backOut)) * 30}px)`}}>
          ☎ 8009 1440
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- transitions ----------
const Fade = ({t, at, dur = 0.35, children}: {t: number; at: number; dur?: number; children: ReactNode}) => {
  const k = lin(t, at - dur / 2, at + dur / 2);
  if (k >= 1) return <>{children}</>;
  return <AbsoluteFill style={{opacity: k}}>{children}</AbsoluteFill>;
};

const Scenes = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {active(t, SC.S2, 0, 0.3) && (
        <S2 t={t} />
      )}
      {active(t, SC.S3, 0.3, 0.3) && (
        <Fade t={t} at={SC.S3.from} dur={0.45}>
          <S3 t={t} />
        </Fade>
      )}
      {active(t, SC.S4, 0.3, 0.3) && (
        <Fade t={t} at={SC.S4.from} dur={0.4}>
          <S4 t={t} />
        </Fade>
      )}
      {active(t, SC.S5, 0.3, 0.3) && (
        <Fade t={t} at={SC.S5.from} dur={0.4}>
          <S5 t={t} />
        </Fade>
      )}
      {active(t, SC.S6, 0.3, 0.3) && (
        <Fade t={t} at={SC.S6.from} dur={0.4}>
          <S6 t={t} />
        </Fade>
      )}
      {active(t, SC.S7, 0.3, 0) && (
        <Fade t={t} at={SC.S7.from} dur={0.5}>
          <S7 t={t} />
        </Fade>
      )}
      <Bloom t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
// The warm round light swells over each cut and carries one scene into the next.
const BLOOM_AT = [SC.S3.from, SC.S4.from, SC.S5.from, SC.S6.from, SC.S7.from];
const Bloom = ({t}: {t: number}) => {
  const g = Math.max(...BLOOM_AT.map((at) => Math.exp(-(((t - at) / 0.2) ** 2))));
  if (g < 0.01) return null;
  return <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 44%, rgba(255,222,165,${0.62 * g}) 0%, rgba(255,186,100,${0.28 * g}) 34%, rgba(0,0,0,0) 68%)`}} />;
};

export const BonsaiReel = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <Fonts />
    <Scenes />
    <Audio src={staticFile('bonsai-reel/stems/voice.wav')} name="Voice" />
    <Audio src={staticFile('bonsai-reel/stems/music.wav')} name="Music" />
    <Audio src={staticFile('bonsai-reel/stems/sfx.wav')} name="Sound effects" />
  </AbsoluteFill>
);
