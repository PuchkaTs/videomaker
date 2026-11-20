import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {SceneShell, Wordmark, ease} from '../ui';

export const OUTRO_DURATION = 150;

export const Outro = () => {
  const frame = useCurrentFrame();
  const a = ease(frame, 0, 28);
  const b = ease(frame, 36, 66);
  return (
    <SceneShell duration={OUTRO_DURATION}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <div style={{opacity: a, translate: `0 ${(1 - a) * 24}px`, fontSize: 54, color: T.muted}}>Анхны зурвасаас эхлээд эцсийн хүргэлт хүртэл.</div>
        <div style={{opacity: b, scale: `${0.92 + b * 0.08}`, marginTop: 36}}>
          <Wordmark size={170} />
        </div>
      </AbsoluteFill>
      <Sequence from={6} layout="none" name="Brand voice">
        <Audio src={staticFile('kublai/brand-voice-ending.mp3')} />
      </Sequence>
    </SceneShell>
  );
};
