// AgentVideoReel: 12 test versions of the KublAi promo for AI reels for real-estate agents
// (Black Friday: 5 бичлэг = 500,000₮, was 1,000,000₮).
// Each version opens on one AI presenter whispering the offer (a Wan talking clip, hook/Vxx.mp4), then the same
// body in the KublAi motion style: one CSS-3D world with a continuous camera through four property cards,
// the wall of 12 presenters, three steps and the price. 1080×1920, 60 fps, 35–38 s.
// Timeline from cues.json (npm run build:agent-video-reel). Plan: docs/agent-video-reel/storyboard.md.
import type {CSSProperties, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {MotionBlur, Obj, World} from '../kublai-agents-v2/world';
import type {Cam} from '../kublai-agents-v2/world';
import {backOut, clamp01, easeIn, easeInOut, easeOut, expoOut, lin, mix, ramp, rand, spring, track, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';

export const AGENT_VIDEO_REEL_FPS = 60;
const FPS = AGENT_VIDEO_REEL_FPS;

type Version = {name: string; text: string; hookEnd: number; clipLen: number; speechAt: number; gainDb: number};
type Scene = {id: string; from: number; to: number};
const C = cuesJson;
const VERSIONS = C.versions as Record<string, Version>;
export const AGENT_VIDEO_REEL_IDS = Object.keys(VERSIONS);
const B = C.body;
const SC = Object.fromEntries(B.scenes.map((s) => [s.id, s])) as Record<string, Scene>;
const M = B.marks;
const hookFrames = (v: string) => Math.round(VERSIONS[v].hookEnd * FPS);
export const agentVideoReelDuration = (v: string) => hookFrames(v) + Math.round(B.duration * FPS);

const SANS = "'Inter', 'Noto Sans', Arial, sans-serif";
const COL = {bg: '#07070f', ink: '#10121f', red: '#e3263b', blue: '#2f6bff', white: '#f7f8fc', dim: 'rgba(232,236,248,0.74)', gold: '#ffd27a'};
const GOLD: CSSProperties = {
  background: 'linear-gradient(180deg, #fff6d8 0%, #ffd98a 38%, #f0a93b 62%, #ffe9b0 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
const DIR = 'agent-video-reel';

// ---------- fonts ----------
let fontsLoading: Promise<unknown> | undefined;
const Fonts = () => {
  const [handle] = useState(() => delayRender('Loading Inter'));
  useEffect(() => {
    fontsLoading ??= (async () => {
      const face = new FontFace('Inter', `url(${staticFile('fonts/Inter-Variable.ttf')})`, {weight: '100 900'});
      await face.load();
      document.fonts.add(face);
    })();
    fontsLoading.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return null;
};

// ---------- type ----------
// Letters rising into place, each with its own fill so gradient text survives the transforms.
const Rise = ({text, t, at, size, weight = 900, gold = false, color = COL.white, tracking = 0.01, stagger = 0.022, dur = 0.45, lift = 60, out, style}: {text: string; t: number; at: number; size: number; weight?: number; gold?: boolean; color?: string; tracking?: number; stagger?: number; dur?: number; lift?: number; out?: number; style?: CSSProperties}) => {
  const gone = out === undefined ? 0 : ramp(t, out - 0.22, out, easeIn);
  if (gone >= 1 || t < at - 0.02) return null;
  return (
    <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, lineHeight: 1.04, letterSpacing: `${tracking}em`, whiteSpace: 'pre', textAlign: 'center', opacity: 1 - gone, transform: gone > 0 ? `translateY(${-gone * 40}px)` : undefined, ...style}}>
      {[...text].map((ch, i) => {
        const k = ramp(t, at + i * stagger, at + i * stagger + dur, expoOut);
        return (
          <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * lift}px) rotate(${(1 - k) * 8}deg)`, ...(gold ? GOLD : {color}), filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.7))'}}>
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </div>
  );
};

// Black Friday badge: black plate, gold edge.
const Friday = ({k, size = 40}: {k: number; size?: number}) => (
  <div style={{display: 'inline-block', padding: `${size * 0.3}px ${size * 0.7}px ${size * 0.34}px`, borderRadius: size * 0.36, background: '#08080c', border: `${Math.max(2, size * 0.07)}px solid ${COL.gold}`, fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1.05, letterSpacing: '0.07em', whiteSpace: 'nowrap', boxShadow: '0 16px 44px rgba(0,0,0,0.6), 0 0 30px rgba(255,210,122,0.35)', transform: `scale(${0.5 + 0.5 * k}) rotate(${(1 - k) * -6 - 2}deg)`, opacity: clamp01(k * 2.5)}}>
    <span style={{color: '#fff'}}>BLACK FRIDAY</span> <span style={{color: COL.gold}}>ХЯМДРАЛ</span>
  </div>
);
// The compare price, struck through in red once `cut` passes.
const WasPrice = ({t, at, cut, size}: {t: number; at: number; cut: number; size: number}) => {
  const k = ramp(t, at, at + 0.3);
  const c = ramp(t, cut, cut + 0.22, easeInOut);
  return (
    <div style={{position: 'relative', display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1, color: 'rgba(240,242,250,0.78)', whiteSpace: 'nowrap', opacity: k, transform: `translateY(${(1 - k) * 20}px)`, textShadow: '0 4px 14px rgba(0,0,0,0.8)'}}>
      1,000,000₮
      <div style={{position: 'absolute', left: '-4%', top: '68%', width: `${c * 108}%`, height: Math.max(5, size * 0.1), borderRadius: 4, background: COL.red, transform: 'rotate(-4deg)', transformOrigin: '0 50%', boxShadow: '0 2px 10px rgba(227,38,59,0.6)'}} />
    </div>
  );
};

// ---------- the hook: her talking clip, the offer on screen from the first second ----------
const sentences = (text: string) => text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text];
const Hook = ({v}: {v: string}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ver = VERSIONS[v];
  const H = ver.hookEnd;
  const out = ramp(t, H - 0.08, H + 0.3, easeIn);
  const parts = sentences(ver.text);
  const total = parts.reduce((a, s) => a + s.length, 0);
  const span = H - 0.12 - ver.speechAt;
  let acc = 0;
  const caps = parts.map((s) => {
    const from = ver.speechAt + (acc / total) * span;
    acc += s.length;
    return {s, from, to: ver.speechAt + (acc / total) * span};
  });
  const priceK = clamp01(spring(t, 0.3, 2.2, 0.5));
  const drop = out * 260;
  return (
    <AbsoluteFill style={{background: '#000', opacity: 1 - lin(t, H + 0.12, H + 0.32)}}>
      <AbsoluteFill style={{transform: `scale(${1 + out * 0.3})`, filter: out > 0.02 ? `blur(${out * 16}px)` : undefined}}>
        <OffthreadVideo src={staticFile(`${DIR}/hook/${v}.mp4`)} muted style={{width: 1080, height: 1920, objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,4,10,0.55) 0%, rgba(4,4,10,0) 20%, rgba(4,4,10,0) 50%, rgba(4,4,10,0.72) 72%, rgba(4,4,10,0.9) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 370, transform: `translateY(${drop}px)`, opacity: 1 - out}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px 10px 14px', borderRadius: 14, background: 'rgba(8,8,16,0.6)', border: '1.5px solid rgba(255,255,255,0.28)', fontFamily: SANS, marginBottom: 18, opacity: ramp(t, 0.9, 1.3), transform: `translateY(${(1 - ramp(t, 0.9, 1.3)) * 20}px)`}}>
          <div style={{width: 11, height: 11, borderRadius: 6, background: COL.red}} />
          <div style={{fontSize: 30, fontWeight: 800, color: COL.white}}>{ver.name}</div>
          <div style={{fontSize: 24, fontWeight: 600, color: COL.dim}}>хиймэл оюуны хөтлөгч</div>
        </div>
        <div style={{height: 130, width: 940, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 26}}>
          {caps.map(({s, from, to}, i) => {
            if (t < from || t > to) return null;
            // One sentence at a time: it is gone before the next one starts.
            const k = ramp(t, from, from + 0.18) * (i < caps.length - 1 ? 1 - lin(t, to - 0.1, to) : 1);
            return (
              <div key={i} style={{position: 'absolute', width: 940, fontFamily: SANS, fontWeight: 750, fontSize: 50, lineHeight: 1.18, color: COL.white, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 16}px)`, textShadow: '0 3px 14px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.6)'}}>{s}</div>
            );
          })}
        </div>
        <div style={{marginBottom: 18}}>
          <Friday k={clamp01(spring(t, 0.08, 2, 0.55))} size={46} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <Rise text="5 БИЧЛЭГ" t={t} at={0.18} size={72} tracking={0.05} />
          <WasPrice t={t} at={0.3} cut={0.75} size={58} />
        </div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 176, marginTop: 6, lineHeight: 1, letterSpacing: '-0.01em', transform: `scale(${mix(1.9, 1, priceK)})`, opacity: lin(t, 0.3, 0.42), filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.75))', ...GOLD}}>500,000₮</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- the body world ----------
const GRID = [
  {id: 'apartment', lines: ['ОРОН СУУЦ'], plate: 'Орон сууц', sx: -1, sy: -1},
  {id: 'house', lines: ['ХУВИЙН СУУЦ'], plate: 'Хувийн сууц', sx: 1, sy: -1},
  {id: 'office', lines: ['ОФФИС'], plate: 'Оффис', sx: -1, sy: 1},
  {id: 'shop', lines: ['ҮЙЛЧИЛГЭЭНИЙ', 'ТАЛБАЙ'], plate: 'Үйлчилгээний талбай', sx: 1, sy: 1},
];
// Spread apart while the camera visits each card (no neighbour in frame), gathered into a grid when it pulls back.
const FAR = {x: 380, y: 520};
const NEAR = {x: 270, y: 370};
const gridPos = (i: number, bt: number) => {
  const k = ramp(bt, M.any, M.any + 0.7, easeInOut);
  return {x: GRID[i].sx * mix(FAR.x, NEAR.x, k), y: GRID[i].sy * mix(FAR.y, NEAR.y, k)};
};
const WALL = {x: 0, y: 3000};
const STEPS = {x: 2600, y: 3000};
const END = {x: 2600, y: 6000};
const P_MARKS = [M.p1, M.p2, M.p3, M.p4];
const W0 = SC.W.from;
const T0 = SC.T.from;
const E0 = SC.E.from;
const DUR = B.duration;

// One continuous path: close on each property card, back to the grid, down to the wall, across to the steps,
// down to the price. Every flight lifts back (z) mid-way so the sets pass in depth.
const camAt = (bt: number): Cam => {
  const shake = bt > M.price + 0.1 ? Math.exp(-(bt - M.price - 0.1) / 0.14) * Math.sin((bt - M.price - 0.1) * 70) * 14 : 0;
  return {
    x: track([[-1, -FAR.x], [M.p2 - 0.05, -FAR.x + 8], [M.p2 + 0.42, FAR.x], [M.p3 - 0.05, FAR.x - 6], [M.p3 + 0.45, -FAR.x], [M.p4 - 0.05, -FAR.x + 6], [M.p4 + 0.45, FAR.x], [M.any, FAR.x - 6], [M.any + 0.7, 0], [W0, 0], [T0, 0], [T0 + 0.7, STEPS.x], [DUR, STEPS.x]], bt),
    y: track([[-1, -FAR.y - 28], [M.p2 + 0.42, -FAR.y - 28], [M.p3 - 0.05, -FAR.y - 24], [M.p3 + 0.45, FAR.y - 28], [M.any, FAR.y - 32], [M.any + 0.7, -40], [W0, -60], [W0 + 0.7, WALL.y + 30], [T0, WALL.y + 10], [T0 + 0.7, STEPS.y], [E0, STEPS.y + 20], [E0 + 0.65, END.y - 30], [DUR, END.y - 10]], bt) + shake,
    z: track([[-0.6, 500], [0.4, -590], [M.p2 - 0.05, -620], [M.p2 + 0.2, -300], [M.p2 + 0.42, -590], [M.p3 - 0.05, -620], [M.p3 + 0.22, -200], [M.p3 + 0.45, -590], [M.p4 - 0.05, -620], [M.p4 + 0.22, -300], [M.p4 + 0.45, -590], [M.any, -620], [M.any + 0.7, 270], [W0, 190], [W0 + 0.32, 1200], [W0 + 0.7, 600], [M.pick, 560], [T0, 500], [T0 + 0.32, 1000], [T0 + 0.7, 130], [E0, 70], [E0 + 0.3, 900], [E0 + 0.65, 110], [DUR, -10]], bt),
    yaw: track([[-0.6, -14], [0.4, -5], [M.p2 - 0.05, -2], [M.p2 + 0.42, 5], [M.p3 - 0.05, 2], [M.p3 + 0.45, -5], [M.p4 - 0.05, -2], [M.p4 + 0.45, 5], [M.any, 2], [M.any + 0.7, 0], [W0, -3], [W0 + 0.7, 3], [T0, -1], [T0 + 0.32, -12], [T0 + 0.7, 3], [E0, -2], [E0 + 0.65, 0], [DUR, 2]], bt),
    pitch: track([[-0.6, 8], [0.4, 2], [M.any, 2], [M.any + 0.7, 0], [W0, 1], [W0 + 0.32, -9], [W0 + 0.7, 0], [E0, 1], [E0 + 0.3, -9], [E0 + 0.65, 0], [DUR, 0]], bt),
    roll: track([[-0.6, -3], [0.4, 0], [M.p2 - 0.05, 0], [M.p2 + 0.2, 2.5], [M.p2 + 0.42, 0], [M.p3 - 0.05, 0], [M.p3 + 0.22, -3], [M.p3 + 0.45, 0], [M.p4 - 0.05, 0], [M.p4 + 0.22, 2.5], [M.p4 + 0.45, 0], [T0, 0], [T0 + 0.32, 3], [T0 + 0.7, 0], [DUR, 0]], bt),
  };
};
// Windows with fast camera travel: sub-frame motion blur only there.
const FLIGHTS: [number, number, number][] = [
  [-0.3, 0.45, 6],
  [M.p2 - 0.05, M.p2 + 0.45, 6],
  [M.p3 - 0.05, M.p3 + 0.48, 6],
  [M.p4 - 0.05, M.p4 + 0.48, 6],
  [M.any, M.any + 0.72, 6],
  [W0 - 0.02, W0 + 0.72, 9],
  [T0 - 0.02, T0 + 0.72, 9],
  [E0 - 0.02, E0 + 0.68, 9],
];

// Soft out-of-focus lights in three depth layers; they slide against the camera so depth reads in every move.
const Bokeh = ({cam, bt}: {cam: Cam; bt: number}) => (
  <AbsoluteFill>
    {Array.from({length: 26}, (_, i) => {
      const f = 0.08 + rand(i, 1) * 0.42;
      const W = 1500;
      const H = 2400;
      const x = ((((rand(i, 2) * W - cam.x * f + Math.sin(bt * 0.4 + i) * 20) % W) + W) % W) - 210;
      const y = ((((rand(i, 3) * H - cam.y * f - bt * (8 + rand(i, 4) * 14)) % H) + H) % H) - 240;
      const r = 40 + f * 320;
      const warm = rand(i, 5) > 0.45;
      const a = (0.05 + f * 0.22) * (0.7 + 0.3 * Math.sin(bt * (0.8 + rand(i, 6)) + i));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: `radial-gradient(circle, rgba(${warm ? '255,190,120' : '120,150,255'},${a}) 0%, rgba(${warm ? '227,38,59' : '47,107,255'},${a * 0.45}) 40%, rgba(0,0,0,0) 70%)`}} />;
    })}
  </AbsoluteFill>
);

const cardShell: CSSProperties = {borderRadius: 34, overflow: 'hidden', background: COL.ink, border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 40px 90px rgba(0,0,0,0.65)'};

// A property card: the photo slides inside its frame against the camera (parallax), a plate names it,
// and a tag flips from «Зарна» to «Түрээслүүлнэ».
const PropCard = ({i, bt, cam}: {i: number; bt: number; cam: Cam}) => {
  const g = {...GRID[i], ...gridPos(i, bt)};
  const k = i === 0 ? clamp01(spring(bt, -0.25, 1.8, 0.6)) : clamp01(spring(bt, P_MARKS[i] - 0.02, 1.9, 0.58));
  if (k <= 0.001) return null;
  const dx = cam.x - g.x;
  const dy = cam.y - g.y;
  const float = Math.sin(bt * 1.1 + i * 1.7) * 8;
  const t1 = ramp(bt, M.sale + i * 0.07, M.sale + i * 0.07 + 0.32, backOut);
  const t2 = ramp(bt, M.rent + i * 0.07, M.rent + i * 0.07 + 0.36, easeInOut);
  const rent = t2 > 0.5;
  const tagAngle = (1 - t1) * -90 + (rent ? (t2 - 1) * 180 : t2 * 180);
  return (
    <Obj x={g.x} y={g.y + (1 - k) * 260 + float} z={(1 - k) * -500} ry={(1 - k) * 60 + dx * 0.022} rx={(1 - k) * -30 - dy * 0.016} preserve>
      <div style={{width: 480, height: 640, position: 'relative'}}>
        <div style={{...cardShell, position: 'absolute', inset: 0}}>
          <Img src={staticFile(`${DIR}/img/${g.id}.jpg`)} style={{position: 'absolute', left: -40, top: -44, width: 560, height: 746, objectFit: 'cover', transform: `translate(${clamp01(0.5 + dx / 900) * 60 - 30}px, ${clamp01(0.5 + dy / 1200) * 60 - 30}px) scale(${1.02 + 0.03 * Math.sin(bt * 0.5 + i)})`}} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(6,6,14,0.88) 100%)'}} />
          <div style={{position: 'absolute', left: 26, right: 26, bottom: 24, fontFamily: SANS, fontWeight: 800, fontSize: 36, lineHeight: 1.1, color: COL.white}}>{g.plate}</div>
        </div>
        {t1 > 0.001 && (
          <div style={{position: 'absolute', left: -18, top: -26, transformOrigin: '50% 50%', transform: `translateZ(40px) perspective(900px) rotateX(${tagAngle}deg)`, padding: '12px 24px 14px', borderRadius: 14, background: rent ? COL.blue : COL.red, fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: '0.05em', color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'}}>{rent ? 'ТҮРЭЭСЛҮҮЛНЭ' : 'ЗАРНА'}</div>
        )}
      </div>
    </Obj>
  );
};

// The wall: 12 presenters with their names; a cursor ring wanders, lands on this version's presenter, she lifts forward.
const tilePos = (i: number) => ({x: WALL.x + ((i % 3) - 1) * 320, y: WALL.y + (Math.floor(i / 3) - 1.5) * 440});
const Wall = ({bt, mine}: {bt: number; mine: number}) => {
  const sel = ramp(bt, M.pick + 0.22, M.pick + 0.7, backOut);
  const stops = [(mine + 5) % 12, (mine + 10) % 12, (mine + 3) % 12, mine].map(tilePos);
  const hopFrom = M.twelve + 0.15;
  const hop = (M.pick + 0.2 - hopFrom) / 3;
  const seg = Math.min(2, Math.max(0, Math.floor((bt - hopFrom) / hop)));
  const q = ramp(bt, hopFrom + seg * hop + hop * 0.35, hopFrom + (seg + 1) * hop, easeInOut);
  const ring = {x: mix(stops[seg].x, stops[seg + 1].x, q), y: mix(stops[seg].y, stops[seg + 1].y, q)};
  const ringK = ramp(bt, hopFrom - 0.25, hopFrom + 0.1) * (1 - lin(bt, M.pick + 0.25, M.pick + 0.5));
  return (
    <>
      {AGENT_VIDEO_REEL_IDS.map((id, i) => {
        const p = tilePos(i);
        const k = clamp01(spring(bt, W0 + 0.42 + i * 0.07, 1.7, 0.62));
        if (k <= 0.001) return null;
        const me = i === mine;
        const lift = me ? sel : 0;
        return (
          <Obj key={id} x={mix(p.x, WALL.x + (p.x - WALL.x) * 0.55, lift)} y={mix(p.y, WALL.y + (p.y - WALL.y) * 0.5, lift) + Math.sin(bt * 1.2 + i) * 5} z={(1 - k) * -700 + lift * 330} ry={(1 - k) * 90 + Math.sin(bt * 0.8 + i * 0.9) * 3} rx={(1 - k) * -25}>
            <div style={{width: 290, height: 410, position: 'relative', borderRadius: 26, overflow: 'hidden', background: COL.ink, border: `${me && sel > 0.2 ? 5 : 2}px solid ${me && sel > 0.2 ? COL.gold : 'rgba(255,255,255,0.45)'}`, boxShadow: me ? `0 40px 90px rgba(0,0,0,0.7), 0 0 ${sel * 70}px rgba(255,210,122,${sel * 0.6})` : '0 24px 50px rgba(0,0,0,0.55)'}}>
              <Img src={staticFile(`${DIR}/faces/${id}.jpg`)} style={{position: 'absolute', left: 0, top: 0, width: 290, height: 387, objectFit: 'cover'}} />
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 130, background: 'linear-gradient(180deg, rgba(8,8,16,0) 0%, rgba(8,8,16,0.94) 58%)'}} />
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: SANS, fontWeight: 850, fontSize: 40, color: COL.white}}>{VERSIONS[id].name}</div>
              {!me && sel > 0.01 && <div style={{position: 'absolute', inset: 0, background: `rgba(6,6,14,${sel * 0.62})`}} />}
              {me && sel > 0.3 && (
                <div style={{position: 'absolute', right: 12, top: 12, padding: '7px 14px 8px', borderRadius: 999, background: COL.red, fontFamily: SANS, fontWeight: 900, fontSize: 22, letterSpacing: '0.06em', color: '#fff', transform: `scale(${clamp01((sel - 0.3) * 2.2)})`}}>✓ СОНГОСОН</div>
              )}
            </div>
          </Obj>
        );
      })}
      {ringK > 0.01 && (
        <Obj x={ring.x} y={ring.y} z={30} o={ringK}>
          <div style={{width: 316, height: 436, borderRadius: 34, border: `6px solid ${COL.gold}`, boxShadow: `0 0 34px rgba(255,210,122,0.7), inset 0 0 26px rgba(255,210,122,0.25)`}} />
        </Obj>
      )}
    </>
  );
};

// Three steps: number, words, a small drawing made from the real assets.
const STEP_TEXT = [
  ['Зураг, мэдээллээ', 'илгээнэ'],
  ['Хөтлөгчөө', 'сонгоно'],
  ['Бэлэн бичлэгээ', 'авна'],
];
const StepArt = ({k, mine, bt}: {k: number; mine: string; bt: number}) => {
  if (k === 0) {
    return (
      <div style={{width: 230, height: 270, position: 'relative'}}>
        {['house', 'office', 'apartment'].map((id, i) => (
          <Img key={id} src={staticFile(`${DIR}/img/${id}.jpg`)} style={{position: 'absolute', left: 30 + i * 8, top: 20 + i * 6, width: 160, height: 213, objectFit: 'cover', borderRadius: 14, border: '4px solid #fff', transform: `rotate(${(i - 1) * 9 + Math.sin(bt * 1.3 + i) * 1.5}deg)`, boxShadow: '0 10px 24px rgba(0,0,0,0.5)'}} />
        ))}
      </div>
    );
  }
  if (k === 1) {
    return (
      <div style={{width: 230, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
        <Img src={staticFile(`${DIR}/faces/${mine}.jpg`)} style={{width: 204, height: 204, objectFit: 'cover', objectPosition: '50% 20%', borderRadius: '50%', border: `6px solid ${COL.gold}`, boxShadow: '0 0 30px rgba(255,210,122,0.5)'}} />
        <div style={{position: 'absolute', right: 8, bottom: 30, width: 64, height: 64, borderRadius: 32, background: COL.red, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff'}}>✓</div>
      </div>
    );
  }
  return (
    <div style={{width: 230, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 152, height: 262, borderRadius: 22, overflow: 'hidden', position: 'relative', border: '5px solid #fff', boxShadow: '0 14px 30px rgba(0,0,0,0.55)', background: '#000'}}>
        <Img src={staticFile(`${DIR}/img/apartment.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 + 0.05 * Math.sin(bt * 0.9)})`}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.8) 100%)'}} />
        <Img src={staticFile(`${DIR}/faces/${mine}.jpg`)} style={{position: 'absolute', left: 10, bottom: 46, width: 56, height: 56, objectFit: 'cover', objectPosition: '50% 20%', borderRadius: '50%', border: '3px solid #fff'}} />
        <div style={{position: 'absolute', left: 10, bottom: 26, width: 96, height: 9, borderRadius: 5, background: '#fff'}} />
        <div style={{position: 'absolute', left: 10, bottom: 11, width: 66, height: 8, borderRadius: 4, background: COL.red}} />
        <div style={{position: 'absolute', left: 54, top: 80, width: 0, height: 0, borderLeft: '40px solid rgba(255,255,255,0.92)', borderTop: '24px solid transparent', borderBottom: '24px solid transparent'}} />
      </div>
    </div>
  );
};
const Steps = ({bt, mine}: {bt: number; mine: string}) => (
  <>
    {[M.step1, M.step2, M.step3].map((at, i) => {
      const k = clamp01(spring(bt, at, 1.7, 0.6));
      if (k <= 0.001) return null;
      return (
        <Obj key={i} x={STEPS.x + (1 - k) * (i % 2 ? -760 : 760)} y={STEPS.y + (i - 1) * 430 + 110 + Math.sin(bt * 1.1 + i * 2) * 6} z={(1 - k) * -400} ry={(1 - k) * (i % 2 ? 55 : -55) + Math.sin(bt * 0.7 + i) * 2.5}>
          <div style={{width: 920, height: 340, borderRadius: 40, background: 'linear-gradient(150deg, rgba(34,38,62,0.97) 0%, rgba(14,16,30,0.98) 100%)', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 34px 80px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', padding: '0 34px 0 38px', gap: 30}}>
            <div style={{flex: 'none', width: 116, height: 116, borderRadius: 58, background: COL.red, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 34px rgba(227,38,59,0.55)', transform: `scale(${0.6 + 0.4 * clamp01(spring(bt, at + 0.12, 2.4, 0.45))})`}}>{i + 1}</div>
            <div style={{flex: 1, fontFamily: SANS, fontWeight: 850, fontSize: 56, lineHeight: 1.12, color: COL.white}}>
              {STEP_TEXT[i].map((line) => (
                <div key={line} style={{whiteSpace: 'nowrap'}}>{line}</div>
              ))}
            </div>
            <div style={{flex: 'none', transform: `scale(${clamp01(spring(bt, at + 0.2, 2, 0.55))})`}}>
              <StepArt k={i} mine={mine} bt={bt} />
            </div>
          </div>
        </Obj>
      );
    })}
  </>
);

// The price: «5 БИЧЛЭГ», the number slams in, the pill, a comment box that types "5", the KublAi mark.
const End = ({bt}: {bt: number}) => {
  const slam = ramp(bt, M.price, M.price + 0.26, expoOut);
  const typed = bt > M.cta + 0.5;
  const boxK = clamp01(spring(bt, M.cta, 1.8, 0.6));
  const logoK = ramp(bt, M.logo, M.logo + 0.5);
  return (
    <>
      <Obj x={END.x} y={END.y - 620}>
        <Rise text="5 БИЧЛЭГ" t={bt} at={M.five} size={138} tracking={0.04} />
      </Obj>
      <Obj x={END.x} y={END.y - 490}>
        <WasPrice t={bt} at={M.five + 0.35} cut={M.price - 0.12} size={88} />
      </Obj>
      {bt > M.price && (
        <Obj x={END.x} y={END.y - 350} z={(1 - slam) * 600} rz={(1 - slam) * -8}>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 208, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', opacity: lin(bt, M.price, M.price + 0.07), filter: 'drop-shadow(0 14px 40px rgba(0,0,0,0.8))', ...GOLD}}>500,000₮</div>
        </Obj>
      )}
      <Obj x={END.x} y={END.y - 160}>
        <Friday k={clamp01(spring(bt, M.price + 0.4, 2, 0.55))} size={52} />
      </Obj>
      {boxK > 0.001 && (
        <Obj x={END.x} y={END.y + 140 + (1 - boxK) * 200} z={(1 - boxK) * -300} rx={(1 - boxK) * -40}>
          <div style={{width: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
            <div style={{fontFamily: SANS, fontWeight: 850, fontSize: 54, color: COL.white, whiteSpace: 'nowrap', textShadow: '0 4px 16px rgba(0,0,0,0.7)'}}>
              Сэтгэгдэлд <span style={{color: COL.gold}}>«5»</span> гэж бичээрэй
            </div>
            <div style={{width: 820, height: 132, borderRadius: 66, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px 0 44px', boxShadow: '0 26px 60px rgba(0,0,0,0.55)'}}>
              <div style={{flex: 1, fontFamily: SANS, fontWeight: typed ? 900 : 500, fontSize: typed ? 76 : 44, color: typed ? '#101320' : '#9aa0b4', transform: typed ? `scale(${0.7 + 0.3 * clamp01(spring(bt, M.cta + 0.5, 2.6, 0.45))})` : undefined, transformOrigin: '0 50%'}}>{typed ? '5' : 'Сэтгэгдэл бичих…'}</div>
              <div style={{width: 96, height: 96, borderRadius: 48, background: COL.red, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.12 * Math.max(0, Math.sin((bt - M.cta) * 6))})`, boxShadow: '0 8px 24px rgba(227,38,59,0.5)'}}>
                <div style={{width: 0, height: 0, marginLeft: 8, borderLeft: '34px solid #fff', borderTop: '20px solid transparent', borderBottom: '20px solid transparent'}} />
              </div>
            </div>
          </div>
        </Obj>
      )}
      {logoK > 0.001 && (
        <Obj x={END.x} y={END.y + 470 + (1 - logoK) * 60} o={logoK}>
          <div style={{textAlign: 'center', fontFamily: SANS}}>
            <div style={{fontWeight: 900, fontSize: 124, lineHeight: 1, letterSpacing: '-0.02em', color: COL.white, filter: 'drop-shadow(0 8px 26px rgba(0,0,0,0.7))'}}>
              Kubl<span style={{color: COL.red}}>Ai</span>
            </div>
            <div style={{marginTop: 16, fontWeight: 650, fontSize: 36, color: COL.dim, whiteSpace: 'nowrap'}}>Агентуудад зориулсан хиймэл оюуны бичлэг</div>
          </div>
        </Obj>
      )}
    </>
  );
};

// Big kinetic titles at the top of the frame, one per beat.
const LABELS: {from: number; to: number; lines: string[]; size: number; accent?: number}[] = [
  ...GRID.map((g, i) => ({from: P_MARKS[i] + (i ? 0.2 : 0.15), to: i < 3 ? P_MARKS[i + 1] + 0.05 : M.any + 0.05, lines: g.lines, size: g.lines.length > 1 ? 84 : 100})),
  {from: M.any + 0.25, to: M.sale - 0.02, lines: ['ЯМАР Ч', 'ҮЛ ХӨДЛӨХӨД'], size: 76, accent: 0},
  {from: M.sale + 0.02, to: M.rent - 0.02, lines: ['ЗАРАХ Ч БАЙ'], size: 96},
  {from: M.rent + 0.02, to: W0 + 0.05, lines: ['ТҮРЭЭСЛҮҮЛЭХ Ч БАЙ'], size: 70},
  {from: W0 + 0.5, to: T0 + 0.05, lines: ['12 ХӨТЛӨГЧ'], size: 108, accent: 0},
  {from: T0 + 0.45, to: E0 + 0.05, lines: ['ГУРАВХАН АЛХАМ'], size: 86},
];
const Labels = ({bt}: {bt: number}) => (
  <AbsoluteFill style={{alignItems: 'center', paddingTop: 205}}>
    {LABELS.map((l, i) => {
      if (bt < l.from - 0.05 || bt > l.to + 0.02) return null;
      return (
        <div key={i} style={{position: 'absolute', top: 205, width: 1080}}>
          {l.lines.map((line, j) => (
            <Rise key={j} text={line} t={bt} at={l.from + j * 0.12} out={l.to} size={l.size} gold={l.accent === j} tracking={0.02} />
          ))}
        </div>
      );
    })}
  </AbsoluteFill>
);

const BodyFrame = ({v}: {v: string}) => {
  const bt = useT();
  const cam = camAt(bt);
  const mine = AGENT_VIDEO_REEL_IDS.indexOf(v);
  const bloom = Math.max(...[0, W0 + 0.35, T0 + 0.35, E0 + 0.35].map((at) => Math.exp(-(((bt - at) / 0.2) ** 2))), bt > M.price ? Math.exp(-(bt - M.price - 0.1) / 0.18) * 0.9 : 0);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at ${50 - cam.yaw * 1.5}% ${42 + cam.pitch}%, #241a3a 0%, #100f22 46%, ${COL.bg} 82%)`}}>
      <Bokeh cam={cam} bt={bt} />
      <World cam={cam}>
        {bt < W0 + 0.6 && GRID.map((_, i) => <PropCard key={i} i={i} bt={bt} cam={cam} />)}
        {bt > W0 - 0.1 && bt < T0 + 0.65 && <Wall bt={bt} mine={mine} />}
        {bt > T0 - 0.1 && bt < E0 + 0.6 && <Steps bt={bt} mine={v} />}
        {bt > E0 - 0.1 && <End bt={bt} />}
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,5,12,0.82) 0%, rgba(5,5,12,0) 24%, rgba(5,5,12,0) 80%, rgba(5,5,12,0.7) 100%)', opacity: 1 - lin(bt, E0, E0 + 0.5) * 0.6}} />
      <Labels bt={bt} />
      {bloom > 0.01 && <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 46%, rgba(255,214,170,${0.5 * bloom}) 0%, rgba(227,60,80,${0.2 * bloom}) 38%, rgba(0,0,0,0) 70%)`}} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.42) 100%)'}} />
    </AbsoluteFill>
  );
};

const Body = ({v}: {v: string}) => {
  const frame = useCurrentFrame();
  const bt = (frame - hookFrames(v)) / FPS;
  if (bt < -0.32) return null;
  const flight = FLIGHTS.find(([a, b]) => bt >= a && bt <= b);
  return (
    <AbsoluteFill style={{opacity: bt < 0.02 ? lin(bt, -0.3, 0.02) : undefined}}>
      <MotionBlur t={bt} samples={flight ? flight[2] : 1} shutter={0.6 / FPS} render={() => <BodyFrame v={v} />} />
    </AbsoluteFill>
  );
};

export const AgentVideoReel = ({v}: {v: string}) => {
  const frame = useCurrentFrame();
  const HF = hookFrames(v);
  const ver = VERSIONS[v];
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Fonts />
      {frame < Math.min(HF + 20, Math.floor(ver.clipLen * FPS) - 2) && <Hook v={v} />}
      <Body v={v} />
      <Audio src={staticFile(`${DIR}/hook/${v}.wav`)} name="Her whisper" />
      <Sequence from={HF - Math.round(C.bed * FPS)} name="Hook bed">
        <Audio src={staticFile(`${DIR}/stems/hook-bed.wav`)} />
      </Sequence>
      <Sequence from={HF} name="Body sound">
        <Audio src={staticFile(`${DIR}/stems/body-voice.wav`)} name="Voice" />
        <Audio src={staticFile(`${DIR}/stems/body-music.wav`)} name="Music" />
        <Audio src={staticFile(`${DIR}/stems/body-sfx.wav`)} name="Sound effects" />
      </Sequence>
    </AbsoluteFill>
  );
};
