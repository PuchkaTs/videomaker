import {Audio} from '@remotion/media';
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, getRemotionEnvironment, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import cues from './cues.json';
import {H, Studio, W} from './gfx/studio';
import {loadFonts} from './gfx/text3d';
import {World} from './world';

// Empire Dental Clinic reel 3 in premium stylised 3D: one continuous Three.js world (world.ts) carried
// by the doctor's own voice. Timeline: cues.json. Plan: docs/empire-r3/storyboard.md.
// Every output frame averages SAMPLES jittered renders (gfx/studio.ts). Studio shows a light preview
// while playing and refines a paused frame to full quality.

export const EMPIRE_R3_FPS = 60;
export const EMPIRE_R3_DURATION = Math.round(cues.duration * EMPIRE_R3_FPS);

const SAMPLES = 32;
const PREVIEW_SAMPLES = 5;
const SHUTTER = 1 / 120;

// The doctor appears only in these windows, so the footage is decoded only there.
const DOCTOR: [number, number][] = [
  [0, 6.9],
  [43.3, 47.3],
];

const Footage = ({onFrame}: {onFrame: (image: HTMLVideoElement | HTMLImageElement) => void}) => (
  <>
    {DOCTOR.map(([a, b]) => {
      const from = Math.round(a * EMPIRE_R3_FPS);
      return (
        <Sequence key={a} from={from} durationInFrames={Math.round((b - a) * EMPIRE_R3_FPS)} layout="none" name={`Doctor ${a}`}>
          <OffthreadVideo src={staticFile(cues.source)} trimBefore={from} muted onVideoFrame={(image) => onFrame(image as HTMLVideoElement | HTMLImageElement)} style={{position: 'absolute', right: 0, top: 0, width: 2, height: 2, opacity: 0.01}} />
        </Sequence>
      );
    })}
  </>
);

export const EmpireR3 = () => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<{studio: Studio; world: World} | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const refine = useRef(0);
  const drawn = useRef(0);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Building the 3D world', {timeoutInMilliseconds: 120000}));
  const rendering = getRemotionEnvironment().isRendering;

  const draw = useCallback(
    (f: number) => {
      const e = engine.current;
      if (!e) return;
      const {studio, world} = e;
      const t = f / EMPIRE_R3_FPS;
      const sample = (i: number, n: number) => {
        const st = t + ((i + 0.5) / n - 0.5) * SHUTTER;
        studio.sample(i, world.update(st, studio.jitter(i)), world.rig(st));
      };
      cancelAnimationFrame(refine.current);
      drawn.current = performance.now();
      studio.begin();
      const first = rendering ? SAMPLES : PREVIEW_SAMPLES;
      for (let i = 0; i < first; i++) sample(i, first);
      studio.present(1);
      if (rendering) return;
      // A held frame keeps improving until it matches the final quality.
      let i = first;
      const more = () => {
        for (let k = 0; k < 3 && i < SAMPLES; k++, i++) sample(i, SAMPLES);
        studio.present(1);
        if (i < SAMPLES) refine.current = requestAnimationFrame(more);
      };
      refine.current = requestAnimationFrame(more);
    },
    [rendering],
  );

  const latest = useRef(frame);
  latest.current = frame;
  const onFrame = useCallback(
    (image: HTMLVideoElement | HTMLImageElement) => {
      engine.current?.world.frame(image);
      // While playing, the next timeline frame picks up the new texture on its own.
      if (rendering || performance.now() - drawn.current > 30) draw(latest.current);
    },
    [draw, rendering],
  );

  // In Studio the frame callback only fires when the video presents a new frame, so a paused or
  // freshly seeked frame also reads the element directly and redraws once it has data.
  useEffect(() => {
    if (rendering || !ready) return;
    const video = root.current?.querySelector('video');
    if (!video) return;
    const pull = () => onFrame(video);
    pull();
    video.addEventListener('loadeddata', pull);
    video.addEventListener('seeked', pull);
    return () => {
      video.removeEventListener('loadeddata', pull);
      video.removeEventListener('seeked', pull);
    };
  }, [frame, ready, rendering, onFrame]);

  useEffect(() => {
    let alive = true;
    loadFonts().then(() => {
      if (!alive || !canvas.current || engine.current) return;
      const studio = new Studio(canvas.current);
      engine.current = {studio, world: new World(studio)};
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (ready) draw(frame);
  }, [frame, ready, draw]);

  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);

  return (
    <AbsoluteFill ref={root} style={{backgroundColor: '#EAE2F7'}}>
      <canvas ref={canvas} width={W} height={H} style={{width: '100%', height: '100%'}} />
      <Footage onFrame={onFrame} />
      <Sequence layout="none" name="Voice">
        <Audio src={staticFile(cues.voice)} />
      </Sequence>
      <Sequence layout="none" name="Music">
        <Audio src={staticFile(cues.music)} />
      </Sequence>
      <Sequence layout="none" name="Sound effects">
        <Audio src={staticFile(cues.sfx)} />
      </Sequence>
    </AbsoluteFill>
  );
};
