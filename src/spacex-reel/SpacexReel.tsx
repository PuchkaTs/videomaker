import {Audio} from '@remotion/media';
import type {CSSProperties} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {backOut, easeInOut, expoOut, hit, ramp, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';

// SpaceX reel: clips from "Brighter with Herbert" (Elon Musk on SpaceX's plans) with a Mongolian
// voiceover. 1080×1920, 60 fps. Same layout as GatesAiReel (frozen): kinetic headline on top, a 4:5
// footage panel, word-by-word captions inside it. Everything is timed by cues.json, which
// scripts/spacex-reel-build.mjs writes from plan.json and the voice clips. Four audio stems.

type Shot = [number, string, number?];
type Cue = {
  duration: number;
  credit: string;
  clips: Record<string, {file: string; start: number; shots: Shot[]}>;
  beats: {id: string; name: string; from: number; to: number; graphic: string | null}[];
  cuts: {beat: string; clip: string; from: number; to: number; trim: number; src: number}[];
  headlines: {text: string; tone?: string; from: number; to: number}[];
  labels: {text: string; from: number; to: number}[];
  captions: {words: {w: string; at: number; end: number}[]}[];
  graphics: {type: string; from: number; to: number; events: number[]}[];
};
const C = cuesJson as unknown as Cue;

export const SPACEX_REEL_FPS = 60;
export const SPACEX_REEL_DURATION = Math.round(C.duration * SPACEX_REEL_FPS);

const W = 1080;
const PANEL = {y: 370, h: 1350};
const COL = {
  bg: '#06080C',
  ink: '#F5F7FA',
  dim: 'rgba(245, 247, 250, 0.58)',
  accent: '#FFB23F',
  cool: '#7FD4FF',
};
const FONT = "'Inter', 'Noto Sans', Arial, sans-serif";
const toneColor = (tone?: string) => (tone === 'accent' ? COL.accent : COL.ink);

// ---------- footage ----------

// How a camera shot sits in the 1080×1350 panel: s is pixels per source pixel, (cx, cy) the source
// point at the panel's centre. elon/herb/anim are a 4:5 crop centred on x; wide is a 1.6× crop on Elon
// in the two-shot; three is the whole-set shot; fit shows a wide graphic nearly whole on black.
const BASE = PANEL.h / 1080;
const framing = (shot: Shot) => {
  const [, kind, x] = shot;
  if (kind === 'wide') return {s: BASE * 1.6, cx: 1470, cy: 470, clamp: true};
  if (kind === 'three') return {s: BASE * 1.3, cx: x ?? 820, cy: 480, clamp: true};
  // The Kardashev animation: zoomed so its English captions sit below the panel.
  if (kind === 'kard') return {s: BASE * 1.45, cx: x ?? 1060, cy: 370, clamp: true};
  if (kind === 'fit') return {s: 0.78, cx: x ?? 960, cy: 540, clamp: false};
  return {s: BASE, cx: x ?? 960, cy: 540, clamp: true};
};

const Cut = ({cut, t}: {cut: Cue['cuts'][number]; t: number}) => {
  const clip = C.clips[cut.clip];
  const start = cut.from / SPACEX_REEL_FPS;
  const end = cut.to / SPACEX_REEL_FPS;
  const into = cut.trim / SPACEX_REEL_FPS + (t - start);
  const shotIndex = clip.shots.reduce((k, s, i) => (s[0] <= into + 0.001 ? i : k), 0);
  const shot = clip.shots[shotIndex];
  const f = framing(shot);
  let left = W / 2 - f.cx * f.s;
  let top = PANEL.h / 2 - f.cy * f.s;
  if (f.clamp) {
    left = Math.min(0, Math.max(W - 1920 * f.s, left));
    top = Math.min(0, Math.max(PANEL.h - 1080 * f.s, top));
  }
  // A short punch-in on every cut and on every camera change inside the clip, then a slow push.
  const shotStart = Math.max(start, start + (shot[0] - cut.trim / SPACEX_REEL_FPS));
  const punch = 1 - ramp(t, shotStart, shotStart + 0.45, expoOut);
  const push = (t - start) / Math.max(0.1, end - start);
  const scale = 1 + 0.07 * punch + 0.03 * push;
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 42%'}}>
      <OffthreadVideo
        src={staticFile(clip.file)}
        trimBefore={cut.trim}
        muted
        style={{position: 'absolute', left, top, width: 1920 * f.s, height: 1080 * f.s, filter: 'contrast(1.05) saturate(1.02)'}}
      />
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
        <div key={li} style={{whiteSpace: 'nowrap', color: li === lines.length - 1 && h.tone ? toneColor(h.tone) : COL.ink, textShadow: h.tone === 'accent' && li === lines.length - 1 ? '0 0 34px rgba(255, 178, 63, 0.35)' : 'none'}}>
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

// ---------- graphics ----------

// The three things it takes: each row lands on the word that names it.
const NEEDS = ['Сансарт асар их ачаа', 'Асар их нарны эрчим хүч', 'Асар олон чип'];

const Needs = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const gone = ramp(t, g.to - 0.3, g.to, easeInOut);
  const dim = ramp(t, g.from, g.from + 0.4, easeInOut) * (1 - gone);
  return (
    <AbsoluteFill style={{background: `rgba(4, 6, 10, ${0.55 * dim})`}}>
      <div style={{position: 'absolute', left: 70, right: 70, top: 480, display: 'flex', flexDirection: 'column', gap: 34}}>
        {g.events.map((at, i) => {
          const k = ramp(t, at - 0.05, at + 0.45, (x) => backOut(x, 1.6));
          const ring = hit(t, at, 0.02, 0.5);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                padding: '24px 30px',
                borderRadius: 22,
                background: 'rgba(10, 14, 20, 0.82)',
                border: `3px solid rgba(255, 178, 63, ${0.35 + 0.6 * ring})`,
                boxShadow: `0 0 ${20 + 50 * ring}px rgba(255, 178, 63, ${0.15 + 0.4 * ring})`,
                opacity: Math.min(1, k * 2) * (1 - gone),
                transform: `translateX(${(1 - k) * -80}px)`,
                fontFamily: FONT,
              }}
            >
              <div style={{fontWeight: 900, fontSize: 64, color: COL.accent, width: 70, textAlign: 'center'}}>{i + 1}</div>
              <div style={{fontWeight: 800, fontSize: 48, color: COL.ink, lineHeight: 1.1}}>{NEEDS[i]}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const EndCard = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const dark = ramp(t, g.from, g.from + 0.5, easeInOut);
  const rise = (at: number): CSSProperties => {
    const p = ramp(t, at, at + 0.6, expoOut);
    return {opacity: p, transform: `translateY(${(1 - p) * 40}px)`};
  };
  return (
    <AbsoluteFill style={{background: `rgba(5, 6, 9, ${0.72 * dark})`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
      <div style={{fontWeight: 900, fontSize: 112, lineHeight: 1.02, letterSpacing: '-0.02em'}}>
        <div style={{color: COL.ink, ...rise(g.from + 0.15)}}>ТА САР ЛУУ</div>
        <div style={{color: COL.accent, ...rise(g.from + 0.27)}}>ЯВАХ УУ?</div>
      </div>
      <div style={{marginTop: 44, fontWeight: 600, fontSize: 46, color: COL.ink, ...rise(g.from + 0.55)}}>Сэтгэгдлээ үлдээгээрэй</div>
      <div style={{marginTop: 70, fontWeight: 500, fontSize: 28, color: COL.dim, ...rise(g.from + 0.8)}}>{C.credit}</div>
    </AbsoluteFill>
  );
};

// ---------- reel ----------

export const SpacexReel = () => {
  const t = useT();
  const headlines = C.headlines.filter((h) => t >= h.from - 0.01 && t < h.to + 0.2);
  const graphics = C.graphics.filter((g) => t >= g.from && t < g.to + 0.05);
  const end = C.graphics.find((g) => g.type === 'end');
  const creditOut = end ? ramp(t, end.from, end.from + 0.4) : 0;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 40%, #0E1520 0%, ${COL.bg} 70%)`}}>
      <FontsV2 />
      <Sequence name="Voice (Mongolian)" layout="none">
        <Audio src={staticFile('spacex-reel/stems/voice.wav')} />
      </Sequence>
      <Sequence name="Elon (interview audio)" layout="none">
        <Audio src={staticFile('spacex-reel/stems/elon.wav')} />
      </Sequence>
      <Sequence name="Music" layout="none">
        <Audio src={staticFile('spacex-reel/stems/music.wav')} />
      </Sequence>
      <Sequence name="Sound effects" layout="none">
        <Audio src={staticFile('spacex-reel/stems/sfx.wav')} />
      </Sequence>

      <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h, overflow: 'hidden', background: '#000'}}>
        {C.cuts.map((cut, i) => (
          <Sequence key={i} name={`${cut.beat} ${cut.clip} @${cut.src}`} from={cut.from} durationInFrames={cut.to - cut.from} layout="none">
            <Cut cut={cut} t={t} />
          </Sequence>
        ))}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.6) 100%)'}} />
        {graphics.map((g) => (g.type === 'needs' ? <Needs key={g.from} g={g} t={t} /> : null))}
      </div>

      {headlines.map((h) => (
        <Headline key={`${h.from}-${h.text}`} h={h} t={t} />
      ))}
      {C.labels.map((l) => (t >= l.from && t < l.to ? <Label key={l.from} l={l} t={t} /> : null))}
      <Captions t={t} />
      {end && t >= end.from ? (
        <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h}}>
          <EndCard g={end} t={t} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: PANEL.y + PANEL.h + 28, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 26, color: COL.dim, opacity: 1 - creditOut}}>{C.credit}</div>

      {C.beats.map((b) => (
        <Sequence key={b.id} name={`${b.id} ${b.name}`} from={Math.round(b.from * SPACEX_REEL_FPS)} durationInFrames={Math.max(1, Math.round((b.to - b.from) * SPACEX_REEL_FPS))} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
