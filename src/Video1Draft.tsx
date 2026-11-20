import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Scene} from './video1/Scene';
import {sceneData} from './video1/scene-data';
import {Fonts} from './video1/Fonts';
export const VIDEO1_DURATION = 4765;
export const Video1Draft = ({pendingMedia = false}: {pendingMedia?: boolean}) => (
  <AbsoluteFill style={{backgroundColor:'#0A3028'}}>
    <Fonts />
    <Audio src={staticFile('video1/voiceover.mp3')} />
    {sceneData.map(scene=><Sequence key={scene.n} from={scene.fromFrame} durationInFrames={scene.duration} name={`${String(scene.n).padStart(2,'0')} / ${scene.title}`}><Scene scene={scene} pending={pendingMedia}/></Sequence>)}
  </AbsoluteFill>
);
