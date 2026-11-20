// ListingReel: the template for customers' property reels ordered on kublai.online/agent-reels.
// 1080×1920, 60 fps; length comes from the job. Everything it shows is in its `cues` prop, which
// scripts/listing-reel-build.mjs writes to public/reel-jobs/<jobId>/cues.json (the worker passes it with --props).
// One CSS-3D world: the listing photos hang in a row, the camera travels to one per beat; the presenter
// (a ready presenter, or the agent's own photo, always as a still) stays in the corner; the title, captions,
// price and the agent's contact card are kinetic type on top.
import type {CSSProperties} from 'react';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {MotionBlur, Obj, World} from '../kublai-agents-v2/world';
import type {Cam} from '../kublai-agents-v2/world';
import {clamp01, easeIn, expoOut, lin, ramp, rand, spring, track, useT} from '../kublai-agents-v2/time';

export const LISTING_REEL_FPS = 60;
const FPS = LISTING_REEL_FPS;

type Beat = {kind: string; caption: string; photo: number; from: number; to: number; at: number};
export type ListingCues = {
  dir: string;
  duration: number;
  title: string;
  tag: string;
  rent: boolean;
  type: string;
  location: string;
  price: string;
  agent: {name: string; phone: string; office: string};
  presenter: {name: string; own: boolean};
  photos: number;
  beats: Beat[];
  demo?: boolean;
};
export type ListingReelProps = {cues: ListingCues};
export const listingReelFrames = (cues: ListingCues) => Math.max(1, Math.round(cues.duration * FPS));

// Shown in Studio when no job is passed: the promo's own property photos.
export const LISTING_REEL_DEMO: ListingCues = {
  dir: 'agent-video-reel',
  demo: true,
  duration: 14,
  title: 'Зайсанд 3 өрөө байр',
  tag: 'ЗАРНА',
  rent: false,
  type: 'Орон сууц',
  location: 'Хан-Уул дүүрэг',
  price: '480 сая ₮',
  agent: {name: 'Агентын нэр', phone: '9900-0000', office: ''},
  presenter: {name: 'Хулан', own: false},
  photos: 3,
  beats: [
    {kind: 'hook', caption: 'Зайсанд 3 өрөө байр зарна', photo: 0, from: 0, to: 3.5, at: 0.4},
    {kind: 'feature', caption: 'Нарлаг, том цонхтой зочны өрөө', photo: 1, from: 3.5, to: 6.5, at: 3.8},
    {kind: 'price', caption: 'Үнэ', photo: 2, from: 6.5, to: 9.5, at: 6.8},
    {kind: 'cta', caption: 'Одоо залгаарай', photo: 0, from: 9.5, to: 14, at: 9.8},
  ],
};

const SANS = "'Inter', 'Noto Sans', Arial, sans-serif";
const COL = {bg: '#07070f', red: '#e3263b', blue: '#2f6bff', white: '#f7f8fc', dim: 'rgba(232,236,248,0.78)', gold: '#ffd27a'};
const GOLD: CSSProperties = {background: 'linear-gradient(180deg, #fff6d8 0%, #ffd98a 38%, #f0a93b 62%, #ffe9b0 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

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

const DEMO_PHOTOS = ['img/apartment.jpg', 'img/office.jpg', 'img/house.jpg'];
const photoSrc = (c: ListingCues, i: number, blur = false) => staticFile(c.demo ? `${c.dir}/${DEMO_PHOTOS[i % 3]}` : `${c.dir}/img/${blur ? 'b' : 'p'}${i}.jpg`);
const presenterSrc = (c: ListingCues) => staticFile(c.demo ? `${c.dir}/faces/V04.jpg` : `${c.dir}/presenter.jpg`);

// Fit a line of text into the frame width: long titles and prices get smaller, never clipped.
const fit = (text: string, max: number, perChar = 0.6, width = 960) => Math.min(max, Math.floor(width / Math.max(1, text.length * perChar)));

const Rise = ({text, t, at, size, out, gold = false, color = COL.white, weight = 900}: {text: string; t: number; at: number; size: number; out?: number; gold?: boolean; color?: string; weight?: number}) => {
  const gone = out === undefined ? 0 : ramp(t, out - 0.25, out, easeIn);
  if (gone >= 1 || t < at - 0.02) return null;
  return (
    <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, lineHeight: 1.06, whiteSpace: 'pre', textAlign: 'center', opacity: 1 - gone, transform: gone > 0 ? `translateY(${-gone * 36}px)` : undefined}}>
      {[...text].map((ch, i) => {
        const k = ramp(t, at + i * 0.02, at + i * 0.02 + 0.45, expoOut);
        return (
          <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 56}px) rotate(${(1 - k) * 7}deg)`, ...(gold ? GOLD : {color}), filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.75))'}}>
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </div>
  );
};

const SPACING = 1500;
const camAt = (c: ListingCues, t: number): Cam => {
  const xs: [number, number][] = [];
  const zs: [number, number][] = [];
  const yaw: [number, number][] = [];
  c.beats.forEach((b, i) => {
    const x = b.photo * SPACING;
    const arrive = i ? b.from + 0.55 : -0.5;
    const side = i % 2 ? 1 : -1;
    xs.push([arrive, x - side * 40], [b.to, x + side * 40]);
    if (i) zs.push([b.from + 0.27, 620]);
    zs.push([arrive, -60], [b.to, -230]);
    yaw.push([arrive, -side * 5], [b.to, side * 4]);
  });
  // Same photo twice in a row: keep the keys strictly increasing in time.
  const clean = (keys: [number, number][]) => keys.filter((k, i) => i === 0 || k[0] > keys[i - 1][0] + 0.01);
  return {x: track(clean(xs), t), y: Math.sin(t * 0.5) * 14, z: track(clean(zs), t), yaw: track(clean(yaw), t), pitch: Math.sin(t * 0.4) * 1.2, roll: 0};
};

const Frame = ({cues: c}: ListingReelProps) => {
  const t = useT();
  const cam = camAt(c, t);
  const bi = Math.max(0, c.beats.findIndex((b) => t < b.to));
  const beat = c.beats[bi === -1 ? c.beats.length - 1 : bi];
  const last = c.beats[c.beats.length - 1];
  const hook = c.beats[0];
  const cta = last.kind === 'cta' ? last : undefined;
  const priceBeat = c.beats.find((b) => b.kind === 'price');
  const ctaK = cta ? clamp01(spring(t, cta.from + 0.45, 1.6, 0.62)) : 0;
  const used = [...new Set(c.beats.map((b) => b.photo))];
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {c.beats.map((b, i) => {
        const k = lin(t, b.from - 0.2, b.from + 0.45) * (i < c.beats.length - 1 ? 1 - lin(t, b.to - 0.2, b.to + 0.45) : 1);
        if (k <= 0.01) return null;
        return <Img key={i} src={photoSrc(c, b.photo, true)} style={{position: 'absolute', width: 1080, height: 1920, objectFit: 'cover', opacity: k * 0.5, transform: 'scale(1.25)'}} />;
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(10,10,22,0.25) 0%, rgba(7,7,15,0.82) 78%)'}} />
      <World cam={cam}>
        {used.map((p) => {
          const dx = cam.x - p * SPACING;
          if (Math.abs(dx) > 2600) return null;
          return (
            <Obj key={p} x={p * SPACING} y={-60 + Math.sin(t * 0.9 + p) * 8} ry={dx * 0.012} rx={-1.5}>
              <div style={{width: 930, height: 1300, borderRadius: 44, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.55)', boxShadow: '0 50px 110px rgba(0,0,0,0.7)', background: '#111'}}>
                <Img src={photoSrc(c, p)} style={{width: 1010, height: 1400, marginLeft: -40, marginTop: -50, objectFit: 'cover', transform: `translate(${clamp01(0.5 + dx / 900) * 70 - 35}px, 0) scale(${1.03 + 0.03 * Math.sin(t * 0.45 + p)})`}} />
              </div>
            </Obj>
          );
        })}
        {Array.from({length: 14}, (_, i) => (
          <Obj key={`s${i}`} x={cam.x + (rand(i, 1) - 0.5) * 1700} y={(rand(i, 2) - 0.5) * 1900 - ((t * (14 + rand(i, 3) * 20)) % 260)} z={200 + rand(i, 4) * 500}>
            <div style={{width: 46, height: 46, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,226,170,${0.22 + 0.2 * Math.sin(t * 1.3 + i) ** 2}) 0%, rgba(0,0,0,0) 65%)`}} />
          </Obj>
        ))}
      </World>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,5,12,0.86) 0%, rgba(5,5,12,0) 24%, rgba(5,5,12,0) 58%, rgba(5,5,12,0.9) 84%)'}} />

      {/* top: deal tag, type and place; then the presenter chip */}
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: ramp(t, 0.15, 0.5), transform: `translateY(${(1 - ramp(t, 0.15, 0.5)) * -30}px)`}}>
          <div style={{padding: '12px 26px 14px', borderRadius: 14, background: c.rent ? COL.blue : COL.red, fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: '0.05em', color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.5)'}}>{c.tag}</div>
          <div style={{fontFamily: SANS, fontWeight: 750, fontSize: fit(`${c.type} · ${c.location}`, 38, 0.56, 640), color: COL.white, textShadow: '0 3px 12px rgba(0,0,0,0.9)', whiteSpace: 'nowrap'}}>{[c.type, c.location].filter(Boolean).join(' · ')}</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{padding: '250px 0 0 60px', opacity: ramp(t, 0.6, 1) * (1 - ctaK)}}>
        <div style={{display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 16, padding: '10px 26px 10px 10px', borderRadius: 60, background: 'rgba(8,8,16,0.66)', border: '1.5px solid rgba(255,255,255,0.3)', fontFamily: SANS}}>
          <Img src={presenterSrc(c)} style={{width: 84, height: 84, borderRadius: 42, objectFit: 'cover', objectPosition: '50% 18%', border: `3px solid ${COL.gold}`}} />
          <div>
            <div style={{fontSize: 34, fontWeight: 800, color: COL.white, lineHeight: 1.1}}>{c.presenter.name}</div>
            <div style={{fontSize: 24, fontWeight: 600, color: COL.dim}}>{c.presenter.own ? 'Үл хөдлөхийн агент' : 'хөтлөгч'}</div>
          </div>
        </div>
      </AbsoluteFill>

      {/* bottom third: the hook title, then one caption per beat, the price, the contact card */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 380}}>
        <div style={{position: 'absolute', bottom: 380, width: 1080}}>
          <Rise text={c.title} t={t} at={0.25} out={hook.to} size={fit(c.title, 104)} />
        </div>
        {c.beats.map((b, i) => {
          if (i === 0 || b === cta || t < b.from || t > b.to + 0.02) return null;
          if (b.kind === 'price' && c.price) {
            const k = ramp(t, b.at, b.at + 0.3, expoOut);
            return (
              <div key={i} style={{position: 'absolute', bottom: 360, width: 1080, textAlign: 'center', opacity: lin(t, b.at, b.at + 0.08) * (1 - lin(t, b.to - 0.25, b.to))}}>
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: COL.dim, letterSpacing: '0.12em'}}>ҮНЭ</div>
                <div style={{fontFamily: SANS, fontWeight: 900, fontSize: fit(c.price, 170, 0.62), lineHeight: 1.05, whiteSpace: 'nowrap', transform: `scale(${2.2 - 1.2 * k})`, filter: 'drop-shadow(0 12px 34px rgba(0,0,0,0.8))', ...GOLD}}>{c.price}</div>
              </div>
            );
          }
          const k = ramp(t, b.from + 0.35, b.from + 0.7) * (1 - lin(t, b.to - 0.25, b.to));
          return (
            <div key={i} style={{position: 'absolute', bottom: 390, width: 940, fontFamily: SANS, fontWeight: 850, fontSize: b.caption.length > 34 ? 60 : 72, lineHeight: 1.14, color: COL.white, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 30}px)`, textShadow: '0 4px 18px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.6)'}}>{b.caption}</div>
          );
        })}
      </AbsoluteFill>
      {cta && ctaK > 0.001 && (
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 330, opacity: clamp01(ctaK * 2), transform: `translateY(${(1 - ctaK) * 300}px)`}}>
          <div style={{width: 940, borderRadius: 48, padding: '40px 40px 46px', background: 'linear-gradient(160deg, rgba(34,38,62,0.97) 0%, rgba(12,14,28,0.98) 100%)', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: SANS}}>
            <Img src={presenterSrc(c)} style={{width: 200, height: 200, borderRadius: 100, objectFit: 'cover', objectPosition: '50% 18%', border: `5px solid ${COL.gold}`, marginTop: -140, boxShadow: '0 16px 40px rgba(0,0,0,0.6)'}} />
            <div style={{marginTop: 20, fontSize: 40, fontWeight: 700, color: COL.dim, textAlign: 'center'}}>{cta.caption}</div>
            <div style={{marginTop: 6, fontSize: fit(c.agent.name, 84, 0.62, 860), fontWeight: 900, color: COL.white, whiteSpace: 'nowrap'}}>{c.agent.name}</div>
            {c.agent.office && <div style={{fontSize: 36, fontWeight: 650, color: COL.dim}}>{c.agent.office}</div>}
            <div style={{marginTop: 26, padding: '18px 60px 22px', borderRadius: 999, background: COL.red, color: '#fff', fontSize: 86, fontWeight: 900, letterSpacing: '0.03em', boxShadow: '0 18px 50px rgba(227,38,59,0.5)', transform: `scale(${1 + 0.04 * Math.max(0, Math.sin((t - cta.from) * 5))})`}}>☎ {c.agent.phone}</div>
          </div>
        </AbsoluteFill>
      )}
      {priceBeat && <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 50% 70%, rgba(255,214,170,${0.45 * Math.exp(-(((t - priceBeat.at - 0.1) / 0.2) ** 2))}) 0%, rgba(0,0,0,0) 65%)`}} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.4) 100%)'}} />
      {beat && t < 0.3 && <AbsoluteFill style={{background: '#000', opacity: 1 - lin(t, 0, 0.3)}} />}
    </AbsoluteFill>
  );
};

export const ListingReel = ({cues}: ListingReelProps) => {
  const t = useT();
  const flight = cues.beats.some((b, i) => i > 0 && t >= b.from - 0.05 && t <= b.from + 0.6);
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Fonts />
      <MotionBlur t={t} samples={flight ? 7 : 1} shutter={0.6 / FPS} render={() => <Frame cues={cues} />} />
      {!cues.demo && (
        <>
          <Audio src={staticFile(`${cues.dir}/stems/voice.wav`)} name="Voice" />
          <Audio src={staticFile(`${cues.dir}/stems/music.wav`)} name="Music" />
          <Audio src={staticFile(`${cues.dir}/stems/sfx.wav`)} name="Sound effects" />
        </>
      )}
    </AbsoluteFill>
  );
};
