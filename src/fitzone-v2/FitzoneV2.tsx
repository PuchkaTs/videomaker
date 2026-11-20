import {Audio} from '@remotion/media';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {FPS, easeInOut, ramp, useT} from '../kublai-agents-v2/time';
import cues from './cues.json';
import {COL, H, Svg, Trace, W} from './kit';
import {Backdrop, FootageScenes, HudScenes, PresenterText} from './scenes';

// Fitzone reel v2. The client's footage carries the voice from start to finish. The presenter gets
// text only; everything else is a near-black 2.5D HUD. Timeline: cues.json. The clip is voice only,
// so music.wav and sfx.wav (scripts/fitzone-v2-audio.mjs) carry the score and sound design.

export const FITZONE_V2_DURATION = Math.floor(cues.duration * FPS);

// The HUD arrives and leaves behind one scan line, so the footage is never faded or cut to black.
// The footage dips to white at 10.5 s and 37.3 s; a pass lands just ahead of each and hides it.
const wipe = (t: number, [a, b, d]: number[]) => {
  const open = ramp(t, a - d / 6, a + (5 * d) / 6, easeInOut);
  const close = b < cues.duration - 1 ? ramp(t, b - d / 2, b + d / 2, easeInOut) : 0;
  return {bottom: 1 - open, top: close};
};

export const FitzoneV2 = () => {
  const t = useT();
  const window = cues.hud.find(([a, b]) => t >= a - 0.1 && t <= b + 0.3);
  const edge = window ? wipe(t, window) : null;
  const line = edge ? (edge.bottom > 0 ? (1 - edge.bottom) * H : edge.top > 0 ? edge.top * H : null) : null;
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <FontsV2 />
      <Sequence name="Music" layout="none">
        <Audio src={staticFile('fitzone-v2/stems/music.wav')} />
      </Sequence>
      <Sequence name="Sound effects" layout="none">
        <Audio src={staticFile('fitzone-v2/stems/sfx.wav')} />
      </Sequence>
      <OffthreadVideo src={staticFile(cues.source)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <FootageScenes t={t} />
      {edge ? (
        <AbsoluteFill style={{clipPath: `inset(${edge.top * 100}% 0 ${edge.bottom * 100}% 0)`}}>
          <Backdrop t={t} />
          <HudScenes t={t} />
        </AbsoluteFill>
      ) : null}
      {line !== null ? (
        <Svg>
          <Trace d={`M0 ${line} L${W} ${line}`} width={2.5} />
        </Svg>
      ) : null}
      <PresenterText t={t} />
      {cues.scenes.map((s) => (
        <Sequence key={s.id} name={`${s.id} ${s.name}`} from={Math.round(s.from * FPS)} durationInFrames={Math.round((s.to - s.from) * FPS)} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
