import {useEffect, useState} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import cues from './cues.json';
import {SCENES} from './scenes';
import {loadFonts} from './text';

// Fitzone reel, layout pass: the client's footage and voice run underneath and each scene's 3D pose
// holds still for its stretch of the script. Nothing is animated yet.

export const FITZONE_FPS = 60;
export const FITZONE_DURATION = Math.floor(cues.duration * FITZONE_FPS);
const W = 1080;
const H = 1920;

export const Fitzone = () => {
  const frame = useCurrentFrame();
  const t = frame / FITZONE_FPS;
  const scene = cues.scenes.find((s) => t >= s.from && t < s.to) ?? cues.scenes[cues.scenes.length - 1];
  const Pose = SCENES[scene.id as keyof typeof SCENES];

  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Fitzone fonts'));
  useEffect(() => {
    loadFonts().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={scene.blur ? {filter: `blur(${scene.blur}px)`, transform: 'scale(1.05)'} : undefined}>
        <OffthreadVideo src={staticFile(cues.source)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {scene.dim ? <AbsoluteFill style={{background: `rgba(6, 9, 14, ${scene.dim})`}} /> : null}
      {ready ? (
        <ThreeCanvas width={W} height={H} shadows="variance" style={{position: 'absolute', inset: 0}}>
          <Pose key={scene.id} />
        </ThreeCanvas>
      ) : null}
      {cues.scenes.map((s) => (
        <Sequence key={s.id} name={`${s.id} ${s.name}`} from={Math.round(s.from * FITZONE_FPS)} durationInFrames={Math.round((s.to - s.from) * FITZONE_FPS)} layout="none">
          <></>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
