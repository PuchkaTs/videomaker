import {Audio} from '@remotion/media';
import {AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

type Props = {title: string; subtitle: string; videoFile: string};

export const Starter = ({title, subtitle, videoFile}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame, fps, config: {damping: 18}});
  const fade = interpolate(frame, [125, 149], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <>
      <AbsoluteFill style={{backgroundColor: '#090d18', color: '#f7f8fc', fontFamily: 'Arial, sans-serif'}}>
        {videoFile ? <OffthreadVideo src={staticFile(videoFile)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : (
          <AbsoluteFill style={{background: `radial-gradient(ellipse at ${30 + frame / 5}% 65%, #153f57 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #3b225e 0%, transparent 55%)`}} />
        )}
        <AbsoluteFill style={{backgroundColor: videoFile ? 'rgba(0,0,0,0.35)' : 'transparent', justifyContent: 'center', padding: 120}}>
          <div style={{opacity: fade, transform: `translateY(${(1 - entrance) * 60}px)`}}>
            <div style={{fontSize: 23, letterSpacing: 8, color: '#80e8d2', marginBottom: 40}}>REMOTION + HIGGSFIELD</div>
            <div style={{fontSize: 112, fontWeight: 800, lineHeight: 1.06, letterSpacing: -5}}>{title}<br /><span style={{color: '#80e8d2'}}>{subtitle}</span></div>
            <div style={{width: interpolate(frame, [10, 65], [0, 270], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), height: 5, backgroundColor: '#80e8d2', marginTop: 48}} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Audio
        src={staticFile('voiceover.mp3')}
        durationInFrames={150}
        trimBefore={15}
      />
    </>
  );
};
