import {Audio} from '@remotion/media';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FontsV2} from '../kublai-agents-v2/fonts';
import {FPS, rand, ramp, useT} from '../kublai-agents-v2/time';
import {MotionBlur} from '../kublai-agents-v2/world';
import cues from './cues.json';
import {DURATION_S, blurSamples, camAt} from './kit';
import {Bug} from './logo';
import {Hook, Outro, Question, Tips} from './scenes';

// Empire Dental Clinic reel r1: the doctor's talking-head footage (1080 × 1920, 50 fps source) with
// brand motion graphics on top. Timeline: cues.json. Voice and music come from the source clip;
// sfx.wav (scripts/empire-r1-sfx.mjs) adds the sound design.

// Rounded down: a 3610th frame would start after the footage's last frame and render black.
export const EMPIRE_R1_DURATION = Math.floor(DURATION_S * FPS);

const SHUTTER = 1 / 120;

// The footage under one continuous camera: slow scale/pan/roll drift with punches, and a rack
// focus in from soft at the very start.
const Footage = ({t}: {t: number}) => {
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.r}deg) scale(${cam.s})`, filter: cam.focus > 0.05 ? `blur(${cam.focus.toFixed(2)}px)` : undefined}}>
      <OffthreadVideo src={staticFile(cues.source)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

// Navy grade: darkens the lower band so white type reads, plus a soft vignette.
const Grade = ({t}: {t: number}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(8,11,24,0.82) 0%, rgba(8,11,24,0.55) 26%, rgba(8,11,24,0) 50%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 38%, rgba(0,0,0,0) 55%, rgba(5,7,16,0.55) 100%)'}} />
  </AbsoluteFill>
);

// Out-of-focus silver motes in front of the lens near the frame edges. They move with the camera
// at twice its drift (nearer than the subject) and rise slowly, giving the flat footage depth.
const MOTES = Array.from({length: 11}, (_, i) => ({
  x: rand(i, 1) < 0.5 ? 20 + rand(i, 2) * 170 : 890 + rand(i, 2) * 170,
  y: 560 + rand(i, 3) * 1250,
  size: 50 + rand(i, 4) * 120,
  speed: 10 + rand(i, 5) * 22,
  o: 0.12 + rand(i, 6) * 0.2,
}));

const Motes = () => {
  const t = useT();
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {MOTES.map((m, i) => {
        const y = ((m.y - t * m.speed) % 1920 + 1920) % 1920;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: m.x + cam.x * 2 + Math.sin(t * 0.6 + i) * 12 - m.size / 2,
              top: y + cam.y * 2 - m.size / 2,
              width: m.size,
              height: m.size,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(235,241,255,0.9) 0%, rgba(190,205,230,0.35) 38%, rgba(190,205,230,0) 70%)',
              opacity: m.o,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// All graphics in one layer that rides the camera a little more than the footage does, so the
// cards read as floating just in front of the doctor.
const Overlays = () => {
  const t = useT();
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{perspective: 1600}}>
      <AbsoluteFill style={{transform: `translate3d(${cam.x * 1.6}px, ${cam.y * 1.3}px, 0) rotateY(${cam.x * 0.05}deg) rotateZ(${cam.r * 0.5}deg)`}}>
        <Bug />
        <Hook />
        <Question />
        <Tips />
        <Outro />
      </AbsoluteFill>
      <Motes />
    </AbsoluteFill>
  );
};

export const EmpireR1 = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#0E1224'}}>
      <FontsV2 />
      <Footage t={t} />
      <Grade t={t} />
      <MotionBlur t={t} samples={blurSamples(t)} shutter={SHUTTER} render={() => <Overlays />} />
      <Sequence layout="none" name="Sound effects">
        <Audio src={staticFile(cues.sfx)} />
      </Sequence>
    </AbsoluteFill>
  );
};
