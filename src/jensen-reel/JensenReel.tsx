import {Audio} from '@remotion/media';
import {createContext, useContext} from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {easeInOut, expoOut, ramp, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';
import cuesShortJson from './cues-short.json';

// Jensen reel («Хиймэл оюун ганц хүнээс хамаарч болох уу?»): clips from Bloomberg's "The Rise and
// Reckoning of Jensen Huang" (The Circuit with Emily Chang) with a Mongolian voiceover. 1080×1920,
// 60 fps. Same layout as AbundanceReel (copied, that reel stays as approved): kinetic headline on
// top, a 4:5 footage panel, word-by-word captions inside it. Everything is timed by cues.json, which
// scripts/jensen-reel-build.mjs writes from plan.json and the voice clips. Four audio stems.
// New here: every cut carries its own framing, a red "danger" tone, a timeline tag (October, the
// peak / November, the crisis), a dimmed quote card, and a 90-second cut (cues-short.json).

type Cue = {
  duration: number;
  credit: string;
  stems: string;
  clips: Record<string, {file: string; start: number}>;
  beats: {id: string; name: string; from: number; to: number; graphic: string | null}[];
  cuts: {beat: string; clip: string; from: number; to: number; trim: number; src: number; x?: number; cy?: number; zoom?: number}[];
  headlines: {text: string; tone?: string; big?: boolean; from: number; to: number}[];
  labels: {text: string; from: number; to: number}[];
  eras: {era: string; from: number; to: number}[];
  captions: {words: {w: string; at: number; end: number}[]}[];
  graphics: {type: string; from: number; to: number; events: number[]}[];
};
const LONG = cuesJson as unknown as Cue;
const SHORT = cuesShortJson as unknown as Cue;
const Cues = createContext<Cue>(LONG);

export const JENSEN_REEL_FPS = 60;
export const JENSEN_REEL_DURATION = Math.round(LONG.duration * JENSEN_REEL_FPS);
export const JENSEN_REEL_SHORT_DURATION = Math.round(SHORT.duration * JENSEN_REEL_FPS);

const W = 1080;
const PANEL = {y: 370, h: 1350};
const COL = {
  bg: '#07090C',
  ink: '#F5F7FA',
  dim: 'rgba(245, 247, 250, 0.58)',
  accent: '#FFB23F',
  danger: '#FF3B3B',
};
const FONT = "'Inter', 'Noto Sans', Arial, sans-serif";
const toneColor = (tone?: string) => (tone === 'danger' ? COL.danger : tone === 'accent' ? COL.accent : COL.ink);
const ERAS: Record<string, {text: string; color: string}> = {
  oct: {text: '10-р сар · оргил', color: COL.accent},
  nov: {text: '11-р сар · хямрал', color: COL.danger},
};

// ---------- footage ----------

// How a cut sits in the 1080×1350 panel: zoom 1 fills the panel's height (a 4:5 crop of the 16:9
// source) centred on source x; a larger zoom crops in around (x, cy); a zoom under 1 shows more
// of the frame on black (a headline card or a page that has to be read whole).
const BASE = PANEL.h / 1080;

const Cut = ({cut, t}: {cut: Cue['cuts'][number]; t: number}) => {
  const C = useContext(Cues);
  const clip = C.clips[cut.clip];
  const start = cut.from / JENSEN_REEL_FPS;
  const end = cut.to / JENSEN_REEL_FPS;
  const zoom = cut.zoom ?? 1;
  const s = BASE * zoom;
  let left = W / 2 - (cut.x ?? 960) * s;
  let top = PANEL.h / 2 - (cut.cy ?? 540) * s;
  if (zoom >= 1) {
    left = Math.min(0, Math.max(W - 1920 * s, left));
    top = Math.min(0, Math.max(PANEL.h - 1080 * s, top));
  }
  // A short punch-in on every cut, then a slow push.
  const punch = 1 - ramp(t, start, start + 0.45, expoOut);
  const push = (t - start) / Math.max(0.1, end - start);
  const scale = 1 + 0.07 * punch + 0.03 * push;
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 42%'}}>
      <OffthreadVideo
        src={staticFile(clip.file)}
        trimBefore={cut.trim}
        muted
        style={{position: 'absolute', left, top, width: 1920 * s, height: 1080 * s, filter: 'contrast(1.05) saturate(1.02)'}}
      />
    </AbsoluteFill>
  );
};

// ---------- type ----------

const Headline = ({h, t}: {h: Cue['headlines'][number]; t: number}) => {
  const lines = h.text.split('|');
  const longest = Math.max(...lines.map((l) => l.length));
  // Bold Cyrillic capitals average about 0.74 em; each line stays on one line. The opening title
  // is "big": three short lines that fill the space above the footage.
  const size = Math.min(h.big ? 96 : 92, Math.floor(990 / (longest * 0.74)));
  const out = ramp(t, h.to, h.to + 0.18, easeInOut);
  const glow = h.tone === 'danger' ? '0 0 34px rgba(255, 59, 59, 0.45)' : h.tone === 'accent' ? '0 0 34px rgba(255, 178, 63, 0.35)' : 'none';
  let k = 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        bottom: 1920 - PANEL.y + (h.big ? 22 : 34),
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 850,
        fontSize: size,
        lineHeight: h.big ? 1.0 : 1.04,
        letterSpacing: '-0.015em',
        opacity: 1 - out,
        transform: `translateY(${-30 * out}px)`,
      }}
    >
      {lines.map((line, li) => {
        const last = li === lines.length - 1;
        return (
          <div key={li} style={{whiteSpace: 'nowrap', color: last ? toneColor(h.tone) : COL.ink, textShadow: last ? glow : 'none'}}>
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
        );
      })}
    </div>
  );
};

const Captions = ({t}: {t: number}) => {
  const C = useContext(Cues);
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

// Which part of the story a beat belongs to: stays in the panel's bottom-left corner, under the
// captions, for as long as that part runs.
const Era = ({e, t}: {e: Cue['eras'][number]; t: number}) => {
  const k = ramp(t, e.from, e.from + 0.4, expoOut) * (1 - ramp(t, e.to - 0.25, e.to, easeInOut));
  const era = ERAS[e.era];
  if (k <= 0 || !era) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: PANEL.y + PANEL.h - 76, display: 'flex', justifyContent: 'center', opacity: k}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '7px 20px 9px', borderRadius: 999, background: 'rgba(5, 7, 10, 0.66)', fontFamily: FONT, fontWeight: 700, fontSize: 28, color: COL.ink}}>
        <div style={{width: 14, height: 14, borderRadius: 7, background: era.color, boxShadow: `0 0 14px ${era.color}`}} />
        {era.text}
      </div>
    </div>
  );
};

// ---------- graphics ----------

// The letter: the page behind is dimmed so the spoken words (captions) carry the beat.
const Quote = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const k = ramp(t, g.from, g.from + 0.4, easeInOut) * (1 - ramp(t, g.to - 0.3, g.to, easeInOut));
  return (
    <AbsoluteFill style={{background: `rgba(4, 6, 10, ${0.6 * k})`}}>
      <div style={{position: 'absolute', left: 70, top: 300, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 420, lineHeight: 1, color: COL.danger, opacity: 0.85 * k, transform: `translateY(${(1 - k) * 30}px)`}}>“</div>
    </AbsoluteFill>
  );
};

const EndCard = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const C = useContext(Cues);
  const dark = ramp(t, g.from, g.from + 0.5, easeInOut);
  const rise = (at: number): CSSProperties => {
    const p = ramp(t, at, at + 0.6, expoOut);
    return {opacity: p, transform: `translateY(${(1 - p) * 40}px)`};
  };
  return (
    <AbsoluteFill style={{background: `rgba(5, 6, 9, ${0.72 * dark})`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
      <div style={{fontWeight: 900, fontSize: 92, lineHeight: 1.04, letterSpacing: '-0.02em'}}>
        <div style={{color: COL.ink, ...rise(g.from + 0.15)}}>ТА ТҮҮНТЭЙ</div>
        <div style={{color: COL.accent, ...rise(g.from + 0.27)}}>САНАЛ НИЙЛЖ</div>
        <div style={{color: COL.accent, ...rise(g.from + 0.39)}}>БАЙНА УУ?</div>
      </div>
      <div style={{marginTop: 44, fontWeight: 600, fontSize: 46, color: COL.ink, ...rise(g.from + 0.65)}}>Сэтгэгдлээ үлдээгээрэй</div>
      <div style={{marginTop: 70, fontWeight: 500, fontSize: 28, color: COL.dim, ...rise(g.from + 0.9)}}>{C.credit}</div>
    </AbsoluteFill>
  );
};

// ---------- reel ----------

const Reel = () => {
  const C = useContext(Cues);
  const t = useT();
  const headlines = C.headlines.filter((h) => t >= h.from - 0.01 && t < h.to + 0.2);
  const graphics = C.graphics.filter((g) => t >= g.from && t < g.to + 0.05);
  const end = C.graphics.find((g) => g.type === 'end');
  const creditOut = end ? ramp(t, end.from, end.from + 0.4) : 0;
  const stem = (name: string) => staticFile(`${C.stems}/${name}.wav`);
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 40%, #0E1520 0%, ${COL.bg} 70%)`}}>
      <FontsV2 />
      <Sequence name="Voice (Mongolian)" layout="none">
        <Audio src={stem('voice')} />
      </Sequence>
      <Sequence name="Huang (interview audio)" layout="none">
        <Audio src={stem('source')} />
      </Sequence>
      <Sequence name="Music" layout="none">
        <Audio src={stem('music')} />
      </Sequence>
      <Sequence name="Sound effects" layout="none">
        <Audio src={stem('sfx')} />
      </Sequence>

      <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h, overflow: 'hidden', background: '#000'}}>
        {C.cuts.map((cut, i) => (
          <Sequence key={i} name={`${cut.beat} ${cut.clip} @${cut.src}`} from={cut.from} durationInFrames={cut.to - cut.from} layout="none">
            <Cut cut={cut} t={t} />
          </Sequence>
        ))}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.6) 100%)'}} />
        {graphics.map((g) => (g.type === 'quote' ? <Quote key={g.from} g={g} t={t} /> : null))}
      </div>

      {headlines.map((h) => (
        <Headline key={`${h.from}-${h.text}`} h={h} t={t} />
      ))}
      {C.labels.map((l) => (t >= l.from && t < l.to ? <Label key={l.from} l={l} t={t} /> : null))}
      {C.eras.map((e) => (t >= e.from && t < e.to ? <Era key={e.from} e={e} t={t} /> : null))}
      <Captions t={t} />
      {end && t >= end.from ? (
        <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h}}>
          <EndCard g={end} t={t} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: PANEL.y + PANEL.h + 28, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 26, color: COL.dim, opacity: 1 - creditOut}}>{C.credit}</div>

      {C.beats.map((b) => (
        <Sequence key={b.id} name={`${b.id} ${b.name}`} from={Math.round(b.from * JENSEN_REEL_FPS)} durationInFrames={Math.max(1, Math.round((b.to - b.from) * JENSEN_REEL_FPS))} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const JensenReel = () => (
  <Cues.Provider value={LONG}>
    <Reel />
  </Cues.Provider>
);

export const JensenReelShort = () => (
  <Cues.Provider value={SHORT}>
    <Reel />
  </Cues.Provider>
);
