import {Audio} from '@remotion/media';
import {createContext, useContext} from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {easeInOut, expoOut, ramp, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';

// Altman series, episode 3 («Бүгд биднийг солиотой гэж боддог байсан»): Sam Altman with Garry Tan at
// Y Combinator's Startup School 2026, with a Mongolian voiceover. 1080×1920, 60 fps. Copied from
// AltmanEp2 (episode 2 stays as it is): kinetic headline on top, a 4:5 footage panel, word-by-word
// captions inside it, every cut with its own framing. Everything is timed by cues.json, which
// scripts/altman-ep3-build.mjs writes from plan.json and the voice clips. Four audio stems.
// The episode badge stays in the panel's top-right corner and the end card asks the episode's
// question and announces the next episode (cues.part, cues.question, cues.next). Over the opening a
// lower third names the speaker and cycles through his roles (cues.lowerThirds).

type Cue = {
  duration: number;
  credit: string;
  part: string | null;
  question: string;
  next: {kicker: string; title: string} | null;
  stems: string;
  clips: Record<string, {file: string; start: number}>;
  beats: {id: string; name: string; from: number; to: number; graphic: string | null}[];
  cuts: {beat: string; clip: string; from: number; to: number; trim: number; src: number; x?: number; cy?: number; zoom?: number}[];
  headlines: {text: string; tone?: string; big?: boolean; from: number; to: number}[];
  labels: {text: string; from: number; to: number}[];
  lowerThirds: {name: string; roles: string[]; from: number; to: number}[];
  eras: {era: string; from: number; to: number}[];
  captions: {words: {w: string; at: number; end: number}[]}[];
  graphics: {type: string; from: number; to: number; events: number[]}[];
};
const LONG = cuesJson as unknown as Cue;
const Cues = createContext<Cue>(LONG);

export const ALTMAN_EP3_FPS = 60;
export const ALTMAN_EP3_DURATION = Math.round(LONG.duration * ALTMAN_EP3_FPS);

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

// ---------- footage ----------

// How a cut sits in the 1080×1350 panel: zoom 1 fills the panel's height (a 4:5 crop of the 16:9
// source) centred on source x; a larger zoom crops in around (x, cy); a zoom under 1 shows more
// of the frame on black (a headline card or a page that has to be read whole).
const BASE = PANEL.h / 1080;

const Cut = ({cut, t}: {cut: Cue['cuts'][number]; t: number}) => {
  const C = useContext(Cues);
  const clip = C.clips[cut.clip];
  const start = cut.from / ALTMAN_EP3_FPS;
  const end = cut.to / ALTMAN_EP3_FPS;
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

// The lower third: a name bar just above the captions, left-aligned. The plate wipes in behind an
// amber bar, the name rises, then the role line cycles through the roles (each one rises in as the
// last lifts out). All roles share one grid cell, so the plate is as wide as the longest from the start.
const LowerThird = ({l, t}: {l: Cue['lowerThirds'][number]; t: number}) => {
  const bar = ramp(t, l.from, l.from + 0.35, expoOut);
  const wipe = ramp(t, l.from + 0.08, l.from + 0.6, expoOut);
  const out = ramp(t, l.to - 0.35, l.to, easeInOut);
  if (bar <= 0 || out >= 1) return null;
  const name = ramp(t, l.from + 0.2, l.from + 0.75, expoOut);
  const step = (l.to - l.from) / l.roles.length;
  return (
    <div style={{position: 'absolute', left: 44, bottom: 1920 - (PANEL.y + PANEL.h - 250) + 34, display: 'flex', fontFamily: FONT, opacity: 1 - out, transform: `translateX(${-50 * out}px)`}}>
      <div style={{width: 8, borderRadius: 4, background: COL.accent, transform: `scaleY(${bar})`, transformOrigin: '50% 100%', boxShadow: '0 0 18px rgba(255, 178, 63, 0.45)'}} />
      <div style={{padding: '14px 28px 18px 22px', background: 'linear-gradient(90deg, rgba(5, 7, 10, 0.82) 0%, rgba(5, 7, 10, 0.66) 100%)', borderRadius: '0 16px 16px 0', clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
        <div style={{overflow: 'hidden', paddingBottom: '0.06em'}}>
          <div style={{fontWeight: 900, fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.015em', color: COL.ink, transform: `translateY(${(1 - name) * 105}%)`}}>{l.name}</div>
        </div>
        <div style={{display: 'grid', overflow: 'hidden', marginTop: 6}}>
          {l.roles.map((role, i) => {
            const a = l.from + 0.35 + i * step;
            const inP = i === 0 ? ramp(t, l.from + 0.35, l.from + 0.85, expoOut) : ramp(t, a, a + 0.45, expoOut);
            const outP = i === l.roles.length - 1 ? 0 : ramp(t, a + step - 0.05, a + step + 0.25, easeInOut);
            return (
              <div key={i} style={{gridArea: '1 / 1', whiteSpace: 'nowrap', fontWeight: 750, fontSize: 36, lineHeight: 1.2, color: COL.accent, opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * 100 - outP * 100}%)`}}>
                {role}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// The episode badge: top-right of the panel for the whole reel, so a viewer who lands mid-way knows
// it is one part of a series. It pops once at the start.
const Part = ({t, out}: {t: number; out: number}) => {
  const C = useContext(Cues);
  if (!C.part) return null;
  const k = ramp(t, 0.5, 1.0, expoOut);
  const pulse = 1 - ramp(t, 1.0, 1.7, easeInOut);
  return (
    <div style={{position: 'absolute', right: 40, top: PANEL.y + 44, opacity: k * (1 - out), transform: `translateX(${(1 - k) * 40}px) scale(${1 + 0.12 * pulse * k})`, transformOrigin: '100% 50%'}}>
      <div style={{padding: '9px 22px 11px', borderRadius: 999, background: COL.accent, color: '#0B0D10', fontFamily: FONT, fontWeight: 850, fontSize: 32, letterSpacing: '0.01em', boxShadow: '0 6px 22px rgba(0, 0, 0, 0.45)'}}>{C.part}</div>
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
  const next = C.next;
  // The episode's question to the viewer, lines split with |, the last one amber.
  const question = C.question.split('|');
  // The question first; the next episode's card comes in as the narrator announces it.
  const nextAt = g.from + 1.45;
  return (
    <AbsoluteFill style={{background: `rgba(5, 6, 9, ${0.8 * dark})`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
      <div style={{fontWeight: 900, fontSize: 104, lineHeight: 1.04, letterSpacing: '-0.02em'}}>
        {question.map((line, i) => (
          <div key={i} style={{whiteSpace: 'nowrap', color: i === question.length - 1 ? COL.accent : COL.ink, ...rise(g.from + 0.15 + 0.12 * i)}}>{line}</div>
        ))}
      </div>
      <div style={{marginTop: 36, fontWeight: 600, fontSize: 46, color: COL.ink, ...rise(g.from + 0.6)}}>Сэтгэгдлээ үлдээгээрэй</div>
      {next ? (
        <div style={{marginTop: 84, width: 880, padding: '34px 30px 38px', borderRadius: 34, border: `3px solid ${COL.accent}`, background: 'rgba(8, 10, 14, 0.78)', ...rise(nextAt)}}>
          <div style={{display: 'inline-block', padding: '8px 24px 10px', borderRadius: 999, background: COL.accent, color: '#0B0D10', fontWeight: 850, fontSize: 34}}>{next.kicker}</div>
          <div style={{marginTop: 24, fontWeight: 900, fontSize: 74, lineHeight: 1.06, letterSpacing: '-0.015em', color: COL.ink}}>
            {next.title.split('|').map((line, i) => (
              <div key={i} style={{whiteSpace: 'nowrap'}}>{line}</div>
            ))}
          </div>
          <div style={{marginTop: 26, fontWeight: 700, fontSize: 40, color: COL.accent, ...rise(nextAt + 0.9)}}>Дагаад хүлээж байгаарай →</div>
        </div>
      ) : null}
      <div style={{marginTop: 56, fontWeight: 500, fontSize: 28, color: COL.dim, ...rise(g.from + 0.9)}}>{C.credit}</div>
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
      <Sequence name="Altman (talk audio)" layout="none">
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
      {C.lowerThirds.map((l) => (t >= l.from && t < l.to ? <LowerThird key={l.from} l={l} t={t} /> : null))}
      <Part t={t} out={creditOut} />
      {end && t >= end.from ? null : <Captions t={t} />}
      {end && t >= end.from ? (
        <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h}}>
          <EndCard g={end} t={t} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: PANEL.y + PANEL.h + 28, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 26, color: COL.dim, opacity: 1 - creditOut}}>{C.credit}</div>

      {C.beats.map((b) => (
        <Sequence key={b.id} name={`${b.id} ${b.name}`} from={Math.round(b.from * ALTMAN_EP3_FPS)} durationInFrames={Math.max(1, Math.round((b.to - b.from) * ALTMAN_EP3_FPS))} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const AltmanEp3 = () => (
  <Cues.Provider value={LONG}>
    <Reel />
  </Cues.Provider>
);
