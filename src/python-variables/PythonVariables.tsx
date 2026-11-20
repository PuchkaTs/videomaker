import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {FPS, easeIn, easeInOut, easeOut, lin, rand, useT} from '../kublai-agents-v2/time';
import cues from './cues.json';
import {CAM0, COL, Fonts, MONO, Stage} from './kit';
import {SCENES, type Shot} from './scenes';

// Python lesson 4.1 «Хувьсагч гэж юу вэ?» for students. 1920×1080, 60 fps, no voiceover (the author
// records it). Scene timing: cues.json. Sound: music.wav and sfx.wav from scripts/python-variables-audio.mjs.

export const PYTHON_VARIABLES_DURATION = Math.round(cues.duration * FPS);

const ENTER = 0.5;
const EXIT = 0.45;

// Every scene arrives from deep in the room and leaves past the camera, overlapping the next one.
// A `match` scene opens on the same object the last one ended on, so that seam is a plain cross-fade.
const SceneShell = ({t, start, dur, shot, match, nextMatch}: {t: number; start: number; dur: number; shot: (u: number) => Shot; match?: boolean; nextMatch?: boolean}) => {
  const u = t - start;
  const last = start + dur >= cues.duration;
  if (u < -ENTER || (!last && u > dur + 0.06)) return null;
  const e = easeOut(lin(u, -ENTER, 0.42));
  const x = last ? 0 : easeIn(lin(u, dur - EXIT, dur + 0.05));
  const {cam, world, hud} = shot(u);
  const c = {...CAM0, ...cam};
  c.z += (match ? 0 : (1 - e) * 1700) - (nextMatch ? 0 : x * 1000);
  c.ry += (match ? 0 : (1 - e) * 10) - (nextMatch ? 0 : x * 6);
  const opacity = Math.min(e * 1.2, 1 - x);
  return (
    <>
      <Stage cam={c} opacity={opacity}>{world}</Stage>
      {hud ? (
        <AbsoluteFill style={{opacity, transform: `translate(${-c.ry * 2.2}px, ${(1 - e) * 40 - x * 30}px) scale(${1 + x * 0.06})`}}>{hud}</AbsoluteFill>
      ) : null}
    </>
  );
};

// Scene seams push the room forward too, so the background keeps moving with the cuts.
const pushAt = (t: number) => cues.scenes.slice(1).reduce((sum, s) => sum + easeInOut(lin(t, s.start - 0.6, s.start + 0.5)), 0);

const GLYPHS = ['x', '=', '0', '1', '_', '"', 'a', '()', '#', '5', 'y', '+', '7', ':', 'urt', '[ ]'];

// Night-blue room: a floor grid in perspective and code glyphs floating at many depths. Near glyphs
// are big and faint, far ones small and dim, which reads as depth of field without any blur.
const Backdrop = ({t}: {t: number}) => {
  const travel = t * 55 + pushAt(t) * 520;
  const sway = Math.sin(t * 0.21) * 4;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 38%, ${COL.bg2} 0%, ${COL.bg} 70%)`}}>
      <AbsoluteFill style={{perspective: 900}}>
        <div style={{position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d', transform: `rotateY(${sway}deg)`}}>
          <div
            style={{
              position: 'absolute',
              left: -3000,
              top: -3000,
              width: 6000,
              height: 6000,
              transform: `translateY(420px) rotateX(90deg)`,
              backgroundImage: `linear-gradient(${COL.hair} 2px, transparent 2px), linear-gradient(90deg, ${COL.hair} 2px, transparent 2px)`,
              backgroundSize: '160px 160px',
              backgroundPosition: `0 ${travel % 160}px`,
              maskImage: 'radial-gradient(closest-side, black 20%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(closest-side, black 20%, transparent 100%)',
              opacity: 0.55,
            }}
          />
          {Array.from({length: 46}, (_, i) => {
            const span = 3600;
            const z = ((rand(i, 1) * span + travel * (0.8 + rand(i, 4) * 0.4)) % span) - span + 700;
            const side = rand(i, 2) < 0.5 ? -1 : 1;
            const x = side * (420 + rand(i, 3) * 1500);
            const y = (rand(i, 5) - 0.6) * 1100;
            const near = z > 200 ? 1 - lin(z, 200, 700) : 1;
            const far = lin(z, -span + 700, -1600);
            const op = 0.04 + 0.1 * far * near;
            return (
              <div key={i} style={{position: 'absolute', transform: `translate3d(${x}px, ${y}px, ${z}px)`, fontFamily: MONO, fontWeight: 700, fontSize: 60 + rand(i, 6) * 70, color: rand(i, 7) < 0.3 ? COL.yellow : COL.blueHi, opacity: op, whiteSpace: 'nowrap'}}>
                {GLYPHS[i % GLYPHS.length]}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const PythonVariables = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: COL.bg, overflow: 'hidden'}}>
      <Fonts />
      <Sequence name="Music" layout="none">
        <Audio src={staticFile('python-variables/stems/music.wav')} />
      </Sequence>
      <Sequence name="Sound effects" layout="none">
        <Audio src={staticFile('python-variables/stems/sfx.wav')} />
      </Sequence>
      <Backdrop t={t} />
      {cues.scenes.map((s, i) => (
        <SceneShell key={s.id} t={t} start={s.start} dur={s.dur} shot={SCENES[s.id]} match={'match' in s} nextMatch={'match' in (cues.scenes[i + 1] ?? {})} />
      ))}
    </AbsoluteFill>
  );
};
