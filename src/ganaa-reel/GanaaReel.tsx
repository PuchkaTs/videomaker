// GanaaReel «Яагаад танд агент хэрэгтэй вэ?» for real-estate agent М.Гантуяа (Силвер агент, 9099-9884).
// 1080×1920, 60 fps, about 43 s. 2.5D: one CSS-3D world per scene (night skyline, her cut-out, cards in depth)
// under a moving camera. Timeline from cues.json (npm run build:ganaa-reel); media from plan.json "media".
// Plan: docs/ganaa-reel/storyboard.md.
import type {CSSProperties, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Loop, OffthreadVideo, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {Obj, World} from '../kublai-agents-v2/world';
import type {Cam} from '../kublai-agents-v2/world';
import {backOut, clamp01, easeInOut, easeOut, expoOut, lin, mix, ramp, rand, spring, track, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';
import planJson from './plan.json';

export const GANAA_REEL_FPS = 60;
export const GANAA_REEL_DURATION = Math.round(cuesJson.duration * GANAA_REEL_FPS);

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
const HER = 'ganaa-reel/src/gantuya-cut.png';
// RE/MAX logo, keyed out of her office's reel. plan.json "logo" picks remax.png (plain) or remax-win.png (office).
const LOGO = (planJson as {logo?: string}).logo ?? 'ganaa-reel/src/remax.png';
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

// ---------- her: a cut-out still, or the Wan clip with alpha when plan.json names one ----------
const HER_W = 1060;
const HER_H = Math.round((HER_W * 1163) / 720);
const Her = () =>
  MEDIA.herClip ? (
    <Loop durationInFrames={Math.round((Number(MEDIA.herClipSeconds) || 10) * GANAA_REEL_FPS)} layout="none">
      <OffthreadVideo src={staticFile(MEDIA.herClip)} transparent muted style={{width: HER_W, height: HER_H, display: 'block'}} />
    </Loop>
  ) : (
    <Img src={staticFile(HER)} style={{width: HER_W, height: HER_H, display: 'block'}} />
  );

// A soft rim of light behind her that separates her from the city.
const Halo = ({k = 1}: {k?: number}) => (
  <div style={{width: 1500, height: 1500, borderRadius: '50%', background: `radial-gradient(circle, rgba(170,195,255,${0.28 * k}) 0%, rgba(110,140,220,${0.12 * k}) 38%, rgba(0,0,0,0) 66%)`}} />
);

// ---------- icons for the five reasons (drawn, so no generated text) ----------
const Icon = ({k, size = 260}: {k: number; size?: number}) => {
  const st = {fill: 'none', stroke: '#eef2fa', strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const red = {...st, stroke: COL.red};
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      {k === 0 && (
        <g>
          <path d="M30 170 L30 40" {...st} />
          <path d="M30 170 L175 170" {...st} />
          {[50, 85, 120, 155].map((x, i) => (
            <rect key={x} x={x - 12} y={170 - (35 + i * 28)} width={24} height={35 + i * 28} rx={4} fill={i === 3 ? COL.red : '#eef2fa'} />
          ))}
          <path d="M45 115 L85 90 L120 98 L165 52" {...red} />
          <path d="M148 50 L167 50 L167 69" {...red} />
        </g>
      )}
      {k === 1 && (
        <g>
          <circle cx={100} cy={105} r={68} {...st} />
          <path d="M100 105 L100 62" {...st} />
          <path d="M100 105 L132 122" {...red} />
          <path d="M84 24 L116 24" {...st} />
          <path d="M152 52 L164 40" {...st} />
        </g>
      )}
      {k === 2 && (
        <g>
          <path d="M100 22 L165 46 L165 98 C165 140 135 168 100 180 C65 168 35 140 35 98 L35 46 Z" {...st} />
          <path d="M68 102 L92 126 L136 80" {...red} />
        </g>
      )}
      {k === 3 && (
        <g>
          {[
            [100, 40],
            [40, 90],
            [160, 90],
            [62, 160],
            [138, 160],
            [100, 105],
          ].map(([x, y], i, a) => (
            <g key={i}>
              {a.slice(i + 1).map(([x2, y2], j) => (
                <path key={j} d={`M${x} ${y} L${x2} ${y2}`} stroke="rgba(238,242,250,0.45)" strokeWidth={3} />
              ))}
            </g>
          ))}
          {[
            [100, 40],
            [40, 90],
            [160, 90],
            [62, 160],
            [138, 160],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={13} fill="#eef2fa" />
          ))}
          <circle cx={100} cy={105} r={18} fill={COL.red} />
        </g>
      )}
      {k === 4 && (
        <g>
          <path d="M20 100 L58 70 L92 82 L120 64 L180 100" {...st} />
          <path d="M58 70 L58 120 L98 150 C108 158 120 150 114 140 L104 128" {...st} />
          <path d="M104 128 L126 146 C136 152 146 142 138 134 L120 116" {...st} />
          <path d="M120 116 L140 130 C150 136 158 124 150 118 L120 92" {...red} />
          <path d="M180 100 L150 124" {...st} />
        </g>
      )}
    </svg>
  );
};

const REASONS = [
  {title: 'ЗӨВ ҮНЭЛГЭЭ', sub: 'Зах зээлийн судалгаанд үндэслэнэ'},
  {title: 'ЦАГ ХЭМНЭНЭ', sub: 'Зар · Дуудлага · Байр үзүүлэх'},
  {title: 'ЭРСДЭЛЭЭС ХАМГААЛНА', sub: 'Бичиг баримт, өмчлөгчийг шалгана'},
  {title: '1800 АГЕНТ', sub: 'Худалдан авагчид хурдан хүрнэ'},
  {title: 'ХЭЛЭЛЦЭЭР', sub: 'Үнэ, нөхцөлийг зөвшилцөнө'},
];

const CARD_W = 700;
const CARD_H = 840;
const ReasonCard = ({k, t, at, glow = 1}: {k: number; t: number; at: number; glow?: number}) => {
  const r = REASONS[k];
  const counter = k === 3 ? Math.round(1800 * ramp(t, at + 0.25, at + 1.4, easeOut)) : null;
  return (
    <div style={{position: 'relative', width: CARD_W, height: CARD_H, borderRadius: 40, overflow: 'hidden', background: 'linear-gradient(160deg, rgba(38,54,98,0.96) 0%, rgba(16,26,54,0.97) 60%, rgba(10,16,36,0.98) 100%)', border: `2px solid rgba(214,224,242,${0.35 + 0.4 * glow})`, boxShadow: `0 50px 110px rgba(0,0,0,0.65), 0 0 ${70 * glow}px rgba(170,195,255,${0.35 * glow})`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 40%)'}} />
      <div style={{position: 'absolute', top: 44, left: 52, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: COL.red, letterSpacing: '0.02em'}}>
        {String(k + 1).padStart(2, '0')}
      </div>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * clamp01(spring(t, at + 0.15, 1.6, 0.55))})`}}>
        <Icon k={k} />
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 470, textAlign: 'center', fontFamily: SANS, fontWeight: 850, fontSize: k === 2 ? 58 : 76, lineHeight: 1.05, ...SILVER}}>
        {counter !== null ? `${counter} АГЕНТ` : r.title}
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: k === 2 ? 640 : 620, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 46, lineHeight: 1.22, color: COL.dim}}>{r.sub}</div>
    </div>
  );
};

// ---------- S1: hook. Her on frame 0 against the night city, the question in depth ----------
const S1 = ({t}: {t: number}) => {
  const s = SC.S1;
  const lt = t - s.from;
  const end = s.to - s.from;
  const cam: Cam = {x: track([[0, -40], [end + 0.4, 40]], lt), y: track([[0, 40], [end + 0.4, -10]], lt), z: track([[0, 260], [end + 0.4, 40]], lt), yaw: track([[0, -3], [end + 0.4, 2]], lt), pitch: 0, roll: 0};
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        <Obj y={260} z={-300}>
          <Halo />
        </Obj>
        <Obj y={1920 / 2 - HER_H / 2 + 300} z={0}>
          <Her />
        </Obj>
        <Sparkle t={t} n={20} seed={11} zNear={400} zFar={-2000} spread={1300} />
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,7,16,0.55) 0%, rgba(4,7,16,0) 34%, rgba(0,0,0,0) 78%, rgba(4,7,16,0.65) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 160, transform: `translateY(${-60 * exitK(t, s)}px)`, opacity: 1 - exitK(t, s)}}>
        <Rise text="ЯАГААД ТАНД" t={t} at={s.from - 0.55} size={104} weight={800} silver tracking={0.04} />
        <Rise text="АГЕНТ" t={t} at={s.from - 0.45} size={230} weight={900} color={COL.red} tracking={0.02} style={{lineHeight: 0.95, marginTop: 2}} />
        <Rise text="ХЭРЭГТЭЙ ВЭ?" t={t} at={s.from - 0.4} size={104} weight={800} silver tracking={0.04} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Placeholder room art until the Wan apartments arrive: a lit window grid in a frame.
const RoomArt = ({src, label, t, at}: {src?: string; label: string; t: number; at: number}) => (
  <div style={{position: 'relative', width: 560, height: 700, borderRadius: 34, overflow: 'hidden', border: '2px solid rgba(214,224,242,0.6)', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', background: 'linear-gradient(170deg, #2a3c6a 0%, #121c3a 100%)'}}>
    {src ? <Img src={staticFile(src)} style={{width: 560, height: 700, objectFit: 'cover', transform: `scale(${1.05 + (t - at) * 0.01})`}} /> : null}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 220, background: 'linear-gradient(0deg, rgba(6,10,24,0) 0%, rgba(6,10,24,0.9) 70%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontFamily: SANS, fontWeight: 850, fontSize: 66, ...SILVER}}>{label}</div>
  </div>
);

// ---------- S2: selling or buying? ----------
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
        <Obj x={-290} y={-560} z={-240} ry={mix(80, 14, clamp01(sell))} rz={-3}>
          <RoomArt src={MEDIA.sell} label="ЗАРАХ УУ?" t={t} at={s.from} />
        </Obj>
        <Obj x={290} y={-470} z={-200} ry={mix(-80, -14, clamp01(buy))} rz={3}>
          <RoomArt src={MEDIA.buy} label="ХАЙХ УУ?" t={t} at={M.buy} />
        </Obj>
        <Obj y={160} z={-200}>
          <Halo k={0.8} />
        </Obj>
        <Obj y={1920 / 2 - HER_H / 2 + 420} z={60} s={0.9}>
          <Her />
        </Obj>
        <Sparkle t={t} n={16} seed={21} />
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 78%, rgba(4,7,16,0.65) 100%)'}} />
    </AbsoluteFill>
  );
};

// ---------- R1–R5: the five reasons. She stays, each card flies in, earlier cards stack behind ----------
const Reasons = ({t}: {t: number}) => {
  const ids = ['R1', 'R2', 'R3', 'R4', 'R5'];
  const first = SC.R1;
  const last = SC.R5;
  const idx = ids.findIndex((id) => t < SC[id].to);
  const cur = idx < 0 ? 4 : idx;
  const lt = t - first.from;
  const cam: Cam = {x: Math.sin(lt * 0.35) * 40, y: 0, z: 60 - lt * 4, yaw: Math.sin(lt * 0.3) * 3, pitch: 0, roll: 0};
  const ticks = ids.map((id) => SC[id].from);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        {ids.map((id, k) => {
          const at = SC[id].from;
          if (t < at - 0.4) return null;
          const fly = ramp(t, at - 0.15, at + 0.55, expoOut);
          const behind = Math.max(0, cur - k);
          const x = mix(560, 175, fly) - behind * 70;
          const y = -300 - behind * 70;
          const z = mix(-1300, 60, fly) - behind * 260;
          const ry = mix(48, -10, fly) + behind * 4;
          const glow = behind === 0 ? 1 : 0.25;
          return (
            <Obj key={id} x={x} y={y} z={z} ry={ry} rz={mix(6, 0, fly)} s={0.92 - behind * 0.04}>
              <div style={{filter: behind > 0 ? `brightness(${1 - Math.min(0.55, behind * 0.18)})` : undefined}}>
                <ReasonCard k={k} t={t} at={at} glow={glow} />
              </div>
            </Obj>
          );
        })}
        <Obj x={-260} y={160} z={-160}>
          <Halo k={0.75} />
        </Obj>
        <Obj x={-285} y={1920 / 2 - HER_H / 2 + 470} z={120} s={0.84}>
          <Her />
        </Obj>
        <Sparkle t={t} n={16} seed={31} />
      </World>
      <AbsoluteFill style={{padding: '120px 70px 0'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: SANS, fontWeight: 900}}>
          <span style={{fontSize: 150, lineHeight: 1, ...SILVER, transform: `scale(${1 + 0.18 * Math.exp(-(((t - ticks[cur]) / 0.12) ** 2))})`, display: 'inline-block', transformOrigin: 'left bottom'}}>{cur + 1}</span>
          <span style={{fontSize: 70, color: COL.red}}>/5</span>
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 18}}>
          {ids.map((id, k) => (
            <div key={id} style={{width: 66, height: 10, borderRadius: 5, background: k <= cur ? COL.red : 'rgba(220,228,245,0.25)'}} />
          ))}
        </div>
      </AbsoluteFill>
      {t > last.to - 0.4 && <AbsoluteFill style={{background: COL.bg, opacity: lin(t, last.to - 0.4, last.to)}} />}
    </AbsoluteFill>
  );
};

// ---------- S8: name, phone, promise ----------
const S8 = ({t}: {t: number}) => {
  const s = SC.S8;
  const lt = t - s.from;
  const cam: Cam = {x: 0, y: 0, z: track([[-0.3, 220], [1.2, 40], [s.to - s.from, -40]], lt), yaw: track([[-0.3, -4], [1.4, 0]], lt), pitch: 0, roll: 0};
  const fan = ramp(t, s.from - 0.1, s.from + 0.9, easeOut);
  const pill = spring(t, M.name + 0.35, 1.6, 0.6);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <World cam={cam}>
        <City t={t} />
        {REASONS.map((_, k) => {
          const a = (k - 2) * 15 * fan;
          return (
            <Obj key={k} x={Math.sin((a * Math.PI) / 180) * 900} y={-520 + Math.abs(k - 2) * 50 * fan} z={-900 - Math.abs(k - 2) * 80} rz={a * 0.6} s={0.62}>
              <div style={{filter: 'brightness(0.55)'}}>
                <ReasonCard k={k} t={t + 10} at={0} glow={0.2} />
              </div>
            </Obj>
          );
        })}
        <Obj y={60} z={-220}>
          <Halo />
        </Obj>
        <Obj y={1920 / 2 - HER_H / 2 + 40} z={40} s={1.02}>
          <Her />
        </Obj>
        <Sparkle t={t} n={22} seed={41} />
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,7,16,0) 45%, rgba(4,7,16,0.82) 72%, rgba(4,7,16,0.92) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 170}}>
        <Img src={staticFile(LOGO)} style={{height: 84, width: 84 * LOGO_AR, marginBottom: 22, opacity: ramp(t, s.from + 0.2, s.from + 0.7), transform: `translateY(${(1 - ramp(t, s.from + 0.2, s.from + 0.7, easeOut)) * 30}px)`, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))'}} />
        <Rise text="СИЛВЕР АГЕНТ" t={t} at={M.name - 0.35} size={50} weight={600} tracking={0.32} color={COL.dim} />
        <Rise text="М.ГАНТУЯА" t={t} at={M.name} size={150} weight={900} silver tracking={0.02} style={{marginTop: 6}} />
        <div style={{marginTop: 26, padding: '18px 64px 22px', borderRadius: 999, background: COL.red, fontFamily: SANS, fontWeight: 850, fontSize: 92, color: '#fff', letterSpacing: '0.03em', boxShadow: '0 18px 50px rgba(227,38,59,0.45)', transform: `scale(${0.6 + 0.4 * clamp01(pill)})`, opacity: clamp01(pill * 2)}}>
          9099-9884
        </div>
        <Rise text="Таны үл хөдлөх хөрөнгө —" t={t} at={M.promise} size={50} weight={500} color={COL.white} stagger={0.012} style={{marginTop: 34}} />
        <Rise text="миний хариуцлагатай." t={t} at={M.promise + 0.35} size={64} weight={600} font={SERIF} silver stagger={0.015} style={{fontStyle: 'italic'}} />
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
const BLOOM_AT = [SC.S2.from, SC.R1.from, SC.S8.from];
const Bloom = ({t}: {t: number}) => {
  const g = Math.max(...BLOOM_AT.map((at) => Math.exp(-(((t - at) / 0.2) ** 2))));
  if (g < 0.01) return null;
  return <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 42%, rgba(200,215,255,${0.5 * g}) 0%, rgba(120,150,230,${0.22 * g}) 36%, rgba(0,0,0,0) 68%)`}} />;
};

const Scenes = () => {
  const t = useT();
  const exit1 = exitK(t, SC.S1);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {active(t, SC.S1, 0, 0.3) && (
        <AbsoluteFill style={{opacity: 1 - exit1 * 0.0}}>
          <S1 t={t} />
        </AbsoluteFill>
      )}
      {active(t, SC.S2, 0.3, 0.3) && (
        <Fade t={t} at={SC.S2.from} dur={0.4}>
          <S2 t={t} />
        </Fade>
      )}
      {t >= SC.R1.from - 0.3 && t < SC.R5.to + 0.3 && (
        <Fade t={t} at={SC.R1.from} dur={0.4}>
          <Reasons t={t} />
        </Fade>
      )}
      {active(t, SC.S8, 0.3, 0) && (
        <Fade t={t} at={SC.S8.from} dur={0.45}>
          <S8 t={t} />
        </Fade>
      )}
      {t < SC.S8.from + 0.1 && (
        <AbsoluteFill style={{alignItems: 'flex-end', padding: '54px 54px 0 0', opacity: 1 - lin(t, SC.S8.from - 0.3, SC.S8.from + 0.1)}}>
          <Img src={staticFile(LOGO)} style={{height: 62, width: 62 * LOGO_AR, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.55))'}} />
        </AbsoluteFill>
      )}
      <Bloom t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.38) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const GanaaReel = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <Fonts />
    <Scenes />
    <Audio src={staticFile('ganaa-reel/stems/voice.wav')} name="Voice" />
    <Audio src={staticFile('ganaa-reel/stems/music.wav')} name="Music" />
    <Audio src={staticFile('ganaa-reel/stems/sfx.wav')} name="Sound effects" />
  </AbsoluteFill>
);

// Unused helpers kept for the next pass (backOut for pills).
void backOut;
