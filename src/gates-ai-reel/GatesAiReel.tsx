import {Audio} from '@remotion/media';
import type {CSSProperties} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {backOut, clamp01, easeInOut, expoOut, hit, ramp, useT} from '../kublai-agents-v2/time';
import cuesJson from './cues.json';

// Gates AI reel: clips from The Ezra Klein Show with a Mongolian voiceover. 1080×1920, 60 fps.
// Layout: kinetic headline on top, a 4:5 footage panel, word-by-word captions inside the panel.
// Everything is timed by cues.json, which scripts/gates-ai-reel-build.mjs writes from plan.json and
// the voice clips. The audio is four stems from the same script (voice, Gates, music, sfx).

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

export const GATES_REEL_FPS = 60;
export const GATES_REEL_DURATION = Math.round(C.duration * GATES_REEL_FPS);

const W = 1080;
const PANEL = {y: 370, h: 1350};
const COL = {
  bg: '#07090C',
  ink: '#F5F7FA',
  dim: 'rgba(245, 247, 250, 0.58)',
  accent: '#FFD23F',
  danger: '#FF3B3B',
};
const FONT = "'Inter', 'Noto Sans', Arial, sans-serif";
const MONO = "Menlo, 'SF Mono', Monaco, monospace";
const toneColor = (tone?: string) => (tone === 'danger' ? COL.danger : tone === 'accent' ? COL.accent : COL.ink);

// ---------- footage ----------

// How a camera shot sits in the 1080×1350 panel: s is pixels per source pixel, (cx, cy) the source
// point at the panel's centre. Close-ups are a 4:5 crop on the face, wide shots a 1.6× crop on Gates,
// and the 1996 archive box is shown whole.
const BASE = PANEL.h / 1080;
const framing = (shot: Shot) => {
  const [, kind, x] = shot;
  if (kind === 'inset') return {s: 1.04, cx: 960, cy: 540, clamp: false};
  if (kind === 'wide') return {s: BASE * 1.6, cx: 1500, cy: 480, clamp: true};
  return {s: BASE, cx: x ?? 1200, cy: 540, clamp: true};
};

const Cut = ({cut, t}: {cut: Cue['cuts'][number]; t: number}) => {
  const clip = C.clips[cut.clip];
  const start = cut.from / GATES_REEL_FPS;
  const end = cut.to / GATES_REEL_FPS;
  const into = cut.trim / GATES_REEL_FPS + (t - start);
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
  const shotStart = Math.max(start, start + (shot[0] - cut.trim / GATES_REEL_FPS));
  const punch = 1 - ramp(t, shotStart, shotStart + 0.45, expoOut);
  const push = (t - start) / Math.max(0.1, end - start);
  const scale = 1 + 0.07 * punch + 0.03 * push;
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 42%'}}>
      <OffthreadVideo
        src={staticFile(clip.file)}
        trimBefore={cut.trim}
        muted
        style={{position: 'absolute', left, top, width: 1920 * f.s, height: 1080 * f.s, filter: 'contrast(1.06) saturate(0.92)'}}
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
        <div key={li} style={{whiteSpace: 'nowrap', color: li === lines.length - 1 && h.tone ? toneColor(h.tone) : COL.ink, textShadow: h.tone === 'danger' && li === lines.length - 1 ? '0 0 34px rgba(255, 59, 59, 0.45)' : 'none'}}>
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
        padding: '10px 22px 12px 18px',
        borderLeft: `6px solid ${COL.danger}`,
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

// A short piece of C with an unchecked copy: the scan finds it on the seventh line.
const CODE = [
  'int parse_packet(const uint8_t *buf, size_t len) {',
  '    header_t h;',
  '    if (len < sizeof(h)) return -1;',
  '    memcpy(&h, buf, sizeof(h));',
  '',
  '    size_t body = h.length;',
  '    uint8_t out[512];',
  '    memcpy(out, buf + sizeof(h), body);',
  '',
  '    if (h.flags & FLAG_SIGNED)',
  '        verify(out, body, h.sig);',
  '    return checksum(out, body) == h.crc;',
  '}',
  '',
  'static void on_receive(conn_t *c) {',
  '    uint8_t frame[2048];',
  '    size_t n = read_frame(c, frame);',
  '    parse_packet(frame, n);',
  '}',
];
const BUG = 7;
const LINE_H = 50;

const CodeScan = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const vis = ramp(t, g.from, g.from + 0.25) * (1 - ramp(t, g.to - 0.25, g.to));
  const found = g.events[0];
  const scan = ramp(t, g.from + 0.3, found, easeInOut);
  const flag = ramp(t, found, found + 0.35, expoOut);
  const top = 230;
  const y = (i: number) => top + i * LINE_H;
  return (
    <AbsoluteFill style={{background: 'rgba(8, 11, 15, 0.95)', opacity: vis}}>
      <AbsoluteFill style={{transform: `translateY(${-(t - g.from) * 14}px)`}}>
        {CODE.map((line, i) => (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y(i), height: LINE_H, display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: 25, color: i === BUG && flag > 0 ? '#FFD9D9' : 'rgba(205, 220, 235, 0.82)', background: i === BUG ? `rgba(255, 59, 59, ${0.24 * flag})` : 'none', borderLeft: i === BUG ? `6px solid rgba(255, 59, 59, ${flag})` : '6px solid transparent'}}>
            <span style={{width: 74, textAlign: 'right', marginRight: 26, color: 'rgba(205, 220, 235, 0.3)'}}>{i + 1}</span>
            <span style={{whiteSpace: 'pre'}}>{line}</span>
          </div>
        ))}
        {scan < 1 ? <div style={{position: 'absolute', left: 0, right: 0, top: y(BUG * scan) - 6, height: LINE_H + 12, background: 'linear-gradient(180deg, rgba(255, 210, 63, 0) 0%, rgba(255, 210, 63, 0.16) 50%, rgba(255, 210, 63, 0) 100%)', borderBottom: '2px solid rgba(255, 210, 63, 0.7)'}} /> : null}
        <div style={{position: 'absolute', right: 40, top: y(BUG) - 64, padding: '8px 18px', borderRadius: 10, background: COL.danger, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: '0.06em', opacity: flag, transform: `scale(${0.6 + 0.4 * backOut(flag)})`, transformOrigin: '100% 100%'}}>
          АЛДАА
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Built inside a function: module-level JSX fails in the Remotion bundle.
const icon = (i: number) => {
  if (i === 0)
    // Three linked rings: the hazard mark.
    return (
      <g fill="none" strokeWidth={7}>
        <circle cx={50} cy={31} r={19} />
        <circle cx={33.5} cy={59.5} r={19} />
        <circle cx={66.5} cy={59.5} r={19} />
        <circle cx={50} cy={50} r={8} />
      </g>
    );
  if (i === 1)
    // A bank: pediment, four columns, base.
    return (
      <g fill="none" strokeWidth={6} strokeLinejoin="round">
        <path d="M14 38 L50 16 L86 38 Z" />
        <path d="M24 44 V76 M41 44 V76 M59 44 V76 M76 44 V76" />
        <path d="M12 84 H88" />
      </g>
    );
  // A lightning bolt: the power grid.
  return (
    <g fill="none" strokeWidth={6} strokeLinejoin="round">
      <path d="M57 8 L25 56 H48 L41 92 L75 41 H52 Z" />
    </g>
  );
};

const Threats = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const gone = ramp(t, g.to - 0.3, g.to, easeInOut);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', gap: 56, opacity: 1 - gone}}>
      {g.events.map((at, i) => {
        const k = ramp(t, at - 0.04, at + 0.4, (x) => backOut(x, 1.9));
        const ring = hit(t, at, 0.02, 0.5);
        return (
          <div key={i} style={{width: 170, height: 170, borderRadius: 85, background: 'rgba(12, 6, 8, 0.72)', border: `4px solid ${COL.danger}`, boxShadow: `0 0 ${30 + 60 * ring}px rgba(255, 59, 59, ${0.35 + 0.5 * ring})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp01(k * 3), transform: `scale(${k})`}}>
            <svg width={100} height={100} viewBox="0 0 100 100" style={{stroke: COL.danger, overflow: 'visible'}}>
              {icon(i)}
            </svg>
          </div>
        );
      })}
    </div>
  );
};

const EndCard = ({g, t}: {g: Cue['graphics'][number]; t: number}) => {
  const dark = ramp(t, g.from, g.from + 0.5, easeInOut);
  const rise = (at: number): CSSProperties => {
    const p = ramp(t, at, at + 0.6, expoOut);
    return {opacity: p, transform: `translateY(${(1 - p) * 40}px)`};
  };
  return (
    <AbsoluteFill style={{background: `rgba(5, 6, 9, ${0.86 * dark})`, alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
      <div style={{fontWeight: 900, fontSize: 104, lineHeight: 1.02, letterSpacing: '-0.02em'}}>
        <div style={{color: COL.ink, ...rise(g.from + 0.15)}}>ТА ЮУ ГЭЖ</div>
        <div style={{color: COL.accent, ...rise(g.from + 0.27)}}>БОДОЖ БАЙНА?</div>
      </div>
      <div style={{marginTop: 44, fontWeight: 600, fontSize: 46, color: COL.ink, ...rise(g.from + 0.55)}}>Сэтгэгдлээ үлдээгээрэй</div>
      <div style={{marginTop: 70, fontWeight: 500, fontSize: 28, color: COL.dim, ...rise(g.from + 0.8)}}>{C.credit}</div>
    </AbsoluteFill>
  );
};

// ---------- reel ----------

export const GatesAiReel = () => {
  const t = useT();
  const headlines = C.headlines.filter((h) => t >= h.from - 0.01 && t < h.to + 0.2);
  const danger = C.headlines.some((h) => h.tone === 'danger' && t >= h.from && t < h.to);
  const glow = danger ? 0.55 + 0.25 * Math.sin(t * 5.2) : 0;
  const graphics = C.graphics.filter((g) => t >= g.from && t < g.to + 0.05);
  const end = C.graphics.find((g) => g.type === 'end');
  const creditOut = end ? ramp(t, end.from, end.from + 0.4) : 0;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 40%, #10151C 0%, ${COL.bg} 70%)`}}>
      <FontsV2 />
      <Sequence name="Voice (Mongolian)" layout="none">
        <Audio src={staticFile('gates-ai-reel/stems/voice.wav')} />
      </Sequence>
      <Sequence name="Gates (interview audio)" layout="none">
        <Audio src={staticFile('gates-ai-reel/stems/gates.wav')} />
      </Sequence>
      <Sequence name="Music" layout="none">
        <Audio src={staticFile('gates-ai-reel/stems/music.wav')} />
      </Sequence>
      <Sequence name="Sound effects" layout="none">
        <Audio src={staticFile('gates-ai-reel/stems/sfx.wav')} />
      </Sequence>

      <div style={{position: 'absolute', left: 0, top: PANEL.y, width: W, height: PANEL.h, overflow: 'hidden', background: '#000'}}>
        {C.cuts.map((cut, i) => (
          <Sequence key={i} name={`${cut.beat} ${cut.clip} @${cut.src}`} from={cut.from} durationInFrames={cut.to - cut.from} layout="none">
            <Cut cut={cut} t={t} />
          </Sequence>
        ))}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.6) 100%)'}} />
        <AbsoluteFill style={{boxShadow: `inset 0 0 160px rgba(255, 40, 40, ${0.42 * glow})`}} />
        {graphics.map((g) => (g.type === 'code' ? <CodeScan key={g.from} g={g} t={t} /> : g.type === 'threats' ? <Threats key={g.from} g={g} t={t} /> : null))}
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
        <Sequence key={b.id} name={`${b.id} ${b.name}`} from={Math.round(b.from * GATES_REEL_FPS)} durationInFrames={Math.max(1, Math.round((b.to - b.from) * GATES_REEL_FPS))} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
