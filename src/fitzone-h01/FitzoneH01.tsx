import {Audio} from '@remotion/media';
import type {CSSProperties} from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Mark, LOGO_WORD} from '../fitzone-v2/kit';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {easeInOut, expoOut, ramp, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';

// Fitzone H01 «Ажлын дараах стресс»: Andrew Huberman (Huberman Lab) on walking after work, with a
// Mongolian voiceover and generated b-roll. 1080×1920, 60 fps. Same layout as SpacexReel (frozen):
// kinetic headline on top, a 4:5 footage panel, word-by-word captions inside it, in Fitzone's blue.
// Everything is timed by cues.json, which scripts/fitzone-h01-build.mjs writes from plan.json and the
// voice clips. Four audio stems.

type Shot = [number, string, number?];
type Cue = {
  duration: number;
  credit: string;
  clips: Record<string, {file: string; start: number; w: number; h: number; shots: Shot[]}>;
  beats: {id: string; name: string; from: number; to: number; graphic: string | null}[];
  cuts: {beat: string; clip: string; from: number; to: number; trim: number; src: number; fx: string | null}[];
  headlines: {text: string; tone?: string; from: number; to: number}[];
  labels: {text: string; from: number; to: number}[];
  captions: {words: {w: string; at: number; end: number}[]}[];
  graphics: {type: string; from: number; to: number; events: number[]}[];
};
const C = cuesJson as unknown as Cue;

export const FITZONE_H01_FPS = 60;
export const FITZONE_H01_DURATION = Math.round(C.duration * FITZONE_H01_FPS);

const W = 1080;
const PANEL = {y: 370, h: 1350};
const COL = {
  bg: '#05080D',
  ink: '#F5F7FA',
  dim: 'rgba(232, 241, 250, 0.58)',
  accent: '#2F9DFF',
  mint: '#4BE3B0',
};
const FONT = "'Inter', 'Noto Sans', Arial, sans-serif";
const toneColor = (tone?: string) => (tone === 'accent' ? COL.accent : COL.ink);

// ---------- footage ----------

// How a shot sits in the 1080×1350 panel: s is pixels per source pixel, (cx, cy) the source point at
// the panel's centre. med = Huberman's medium shot pushed in a little, close = his close-up as a 4:5
// crop, cover = a vertical clip filling the panel, x being the source height kept at the centre.
const framing = (shot: Shot, w: number, h: number) => {
  const [, kind, x] = shot;
  if (kind === 'cover') return {s: Math.max(W / w, PANEL.h / h), cx: w / 2, cy: x ?? h / 2};
  if (kind === 'close') return {s: PANEL.h / h, cx: x ?? 1020, cy: h / 2};
  return {s: (PANEL.h / h) * 1.22, cx: x ?? 900, cy: 470};
};

const Cut = ({cut, t}: {cut: Cue['cuts'][number]; t: number}) => {
  const clip = C.clips[cut.clip];
  const start = cut.from / FITZONE_H01_FPS;
  const end = cut.to / FITZONE_H01_FPS;
  const into = cut.trim / FITZONE_H01_FPS + (t - start);
  const shotIndex = clip.shots.reduce((k, s, i) => (s[0] <= into + 0.001 ? i : k), 0);
  const shot = clip.shots[shotIndex];
  const f = framing(shot, clip.w, clip.h);
  const left = Math.min(0, Math.max(W - clip.w * f.s, W / 2 - f.cx * f.s));
  const top = Math.min(0, Math.max(PANEL.h - clip.h * f.s, PANEL.h / 2 - f.cy * f.s));
  // A short punch-in on every cut and on every camera change inside the clip, then a slow push.
  const shotStart = Math.max(start, start + (shot[0] - cut.trim / FITZONE_H01_FPS));
  const punch = 1 - ramp(t, shotStart, shotStart + 0.45, expoOut);
  const push = (t - start) / Math.max(0.1, end - start);
  const scale = 1 + 0.07 * punch + 0.03 * push;
  // Tunnel vision: narrow closes the edges in over the cut, widen opens them out from the same point.
  const open = cut.fx === 'narrow' ? 1 - 0.62 * ramp(t, start + 0.2, end - 0.3, easeInOut) : cut.fx === 'widen' ? 0.38 + 0.9 * ramp(t, start, start + 1.6, expoOut) : null;
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 42%'}}>
      <OffthreadVideo
        src={staticFile(clip.file)}
        trimBefore={cut.trim}
        muted
        style={{position: 'absolute', left, top, width: clip.w * f.s, height: clip.h * f.s, filter: 'contrast(1.04) saturate(1.02)'}}
      />
      {open !== null ? <AbsoluteFill style={{background: `radial-gradient(ellipse ${78 * open}% ${62 * open}% at 50% 44%, rgba(0,0,0,0) 55%, rgba(2,4,8,0.97) 100%)`}} /> : null}
    </AbsoluteFill>
  );
};

// ---------- type ----------

const Headline = ({h, t}: {h: Cue['headlines'][number]; t: number}) => {
  const lines = h.text.split('|');
  const longest = Math.max(...lines.map((l) => l.length));
  // Bold Cyrillic capitals average about 0.74 em; each line stays on one line.
  const size = Math.min(92, Math.floor(990 / (longest * 0.74)));
  const out = ramp(t, h.to, h.to + 0.18, easeInOut);
  let k = 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        bottom: 1920 - PANEL.y + 34,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 850,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: '-0.015em',
        opacity: 1 - out,
        transform: `translateY(${-30 * out}px)`,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{whiteSpace: 'nowrap', color: li === lines.length - 1 && h.tone ? toneColor(h.tone) : COL.ink, textShadow: h.tone === 'accent' && li === lines.length - 1 ? '0 0 34px rgba(47, 157, 255, 0.4)' : 'none'}}>
          {line.split(' ').map((word, wi) => {
            const at = h.from + 0.055 * k++;
            const p = ramp(t, at, at + 0.5, expoOut);
            return (
              <span key={wi} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.08em', marginRight: '0.24em'}}>
                <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`}}>{word}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Captions = ({t}: {t: number}) => {
  const i = C.captions.findIndex((c, k) => {
    const next = C.captions[k + 1];
    const from = c.words[0].at - 0.05;
    const last = c.words[c.words.length - 1].end;
    const to = next && next.words[0].at - last < 0.6 ? next.words[0].at - 0.05 : last + 0.35;
    return t >= from && t < to;
  });
  if (i < 0) return null;
  const c = C.captions[i];
  const pop = ramp(t, c.words[0].at - 0.05, c.words[0].at + 0.09, expoOut);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: PANEL.y + PANEL.h - 250, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 56,
          lineHeight: 1.18,
          textAlign: 'center',
          padding: '12px 26px 16px',
          borderRadius: 20,
          background: 'rgba(5, 7, 10, 0.5)',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
          transform: `scale(${0.94 + 0.06 * pop})`,
          opacity: pop,
        }}
      >
        {c.words.map((w, k) => (
          <span key={k} style={{color: t >= w.at - 0.02 && t < (c.words[k + 1] ? c.words[k + 1].at - 0.02 : w.end + 0.3) ? COL.accent : COL.ink}}>
            {w.w}
            {k < c.words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

const Label = ({l, t}: {l: Cue['labels'][number]; t: number}) => {
  const k = ramp(t, l.from, l.from + 0.5, expoOut) * (1 - ramp(t, l.to - 0.3, l.to, easeInOut));
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 44,
        top: PANEL.y + 44,
        maxWidth: W - 88,
        padding: '10px 22px 12px 18px',
        borderLeft: `6px solid ${COL.accent}`,
        background: 'rgba(5, 7, 10, 0.62)',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 34,
        color: COL.ink,
        opacity: k,
        transform: `translateX(${(1 - k) * -40}px)`,
      }}
    >
      {l.text}
    </div>
  );
};

// ---------- study card ----------

// Bratman et al. 2015 (PNAS): a 90-minute walk in nature against one along a busy road.
const Study = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const at = g.events[0];
  const k = ramp(t, at - 0.1, at + 0.5, expoOut) * (1 - ramp(t, g.to - 0.3, g.to, easeInOut));
  if (k <= 0) return null;
  const row = (delay: number): CSSProperties => {
    const p = ramp(t, at + delay, at + delay + 0.5, expoOut);
    return {opacity: p, transform: `translateX(${(1 - p) * -30}px)`};
  };
  return (
    <AbsoluteFill style={{background: `rgba(4, 8, 13, ${0.45 * k})`}}>
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 50,
          top: 110,
          padding: '30px 34px 34px',
          borderRadius: 26,
          background: 'rgba(8, 15, 24, 0.86)',
          border: `2px solid rgba(47, 157, 255, ${0.55 * k})`,
          fontFamily: FONT,
          opacity: k,
          transform: `translateY(${(1 - k) * 30}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div style={{fontWeight: 800, fontSize: 30, letterSpacing: '0.1em', color: COL.accent}}>СТЭНФОРД · PNAS, 2015</div>
        <div style={{fontWeight: 800, fontSize: 50, lineHeight: 1.1, color: COL.ink}}>90 минут алхсан 38 хүн</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, ...row(2.2)}}>
          <div style={{fontWeight: 700, fontSize: 36, color: COL.mint}}>Байгальд алхсан</div>
          <div style={{fontWeight: 600, fontSize: 34, color: COL.ink}}>↓ давтан бодох&nbsp;&nbsp;↓ тархины идэвх</div>
        </div>
        <div style={{height: 2, background: 'rgba(160, 196, 232, 0.2)'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, ...row(3.6)}}>
          <div style={{fontWeight: 700, fontSize: 36, color: COL.dim}}>Хотын зам дагуу алхсан</div>
          <div style={{fontWeight: 600, fontSize: 34, color: COL.dim}}>өөрчлөлтгүй</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- end card ----------

// The pulse draws the Fitzone mark, then the wordmark, the brand line and the call to save.
const EndCard = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const dark = ramp(t, g.from, g.from + 0.5, easeInOut);
  const rise = (at: number): CSSProperties => {
    const p = ramp(t, at, at + 0.6, expoOut);
    return {opacity: p, transform: `translateY(${(1 - p) * 40}px)`};
  };
  const pulse = ramp(t, g.from + 0.2, g.from + 1.2, easeInOut);
  const bars = ramp(t, g.from + 0.9, g.from + 1.4, expoOut);
  return (
    <AbsoluteFill style={{background: `rgba(5, 8, 13, ${0.78 * dark})`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
      <Mark width={300} pulse={pulse} bars={bars} />
      <Img src={staticFile(LOGO_WORD)} style={{width: 420, marginTop: 30, ...rise(g.from + 1.1)}} />
      <div style={{marginTop: 70, fontWeight: 800, fontSize: 54, lineHeight: 1.15, color: COL.ink, ...rise(g.from + 1.4)}}>
        Өдөр тутмын хөдөлгөөнөөр
        <br />
        <span style={{color: COL.accent}}>эрүүл мэндээ дэмжье</span>
      </div>
      <div style={{marginTop: 54, padding: '14px 34px', borderRadius: 40, border: `2px solid ${COL.mint}`, fontWeight: 700, fontSize: 38, color: COL.mint, ...rise(g.from + 1.8)}}>Хадгалаарай</div>
    </AbsoluteFill>
  );
};

// ---------- reel ----------

export const FitzoneH01 = () => {
  const t = useT();
  const headlines = C.headlines.filter((h) => t >= h.from - 0.01 && t < h.to + 0.2);
  const end = C.graphics.find((g) => g.type === 'end');
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 40%, #0C1624 0%, ${COL.bg} 70%)`}}>
      <FontsV2 />
      <Sequence name="Voice (Mongolian)" layout="none">
        <Audio src={staticFile('fitzone-h01/stems/voice.wav')} />
      </Sequence>
      <Sequence name="Huberman (interview audio)" layout="none">
        <Audio src={staticFile('fitzone-h01/stems/source.wav')} />
      </Sequence>
      <Sequence name="Music" layout="none">
        <Audio src={staticFile('fitzone-h01/stems/music.wav')} />
      </Sequence>
      <Sequence name="Sound effects" layout="none">
        <Audio src={staticFile('fitzone-h01/stems/sfx.wav')} />
      </Sequence>

      <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h, overflow: 'hidden', background: '#000'}}>
        {C.cuts.map((cut, i) => (
          <Sequence key={i} name={`${cut.beat} ${cut.clip} @${cut.src}`} from={cut.from} durationInFrames={cut.to - cut.from} layout="none">
            <Cut cut={cut} t={t} />
          </Sequence>
        ))}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.6) 100%)'}} />
        {C.graphics.map((g) => (g.type === 'study' && t >= g.from && t < g.to + 0.05 ? <Study key={g.from} g={g} t={t} /> : null))}
      </div>

      {headlines.map((h) => (
        <Headline key={`${h.from}-${h.text}`} h={h} t={t} />
      ))}
      {C.labels.map((l) => (t >= l.from && t < l.to ? <Label key={l.from} l={l} t={t} /> : null))}
      {end && t >= end.from ? (
        <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h}}>
          <EndCard g={end} t={t} />
        </div>
      ) : null}
      <Captions t={t} />
      <div style={{position: 'absolute', left: 0, right: 0, top: PANEL.y + PANEL.h + 28, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 26, color: COL.dim}}>{C.credit}</div>

      {C.beats.map((b) => (
        <Sequence key={b.id} name={`${b.id} ${b.name}`} from={Math.round(b.from * FITZONE_H01_FPS)} durationInFrames={Math.max(1, Math.round((b.to - b.from) * FITZONE_H01_FPS))} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
