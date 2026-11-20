import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {Logo, SceneShell, ease} from '../ui';

export const INTRO_DURATION = 90;

export const Intro = () => {
  const frame = useCurrentFrame();
  const a = ease(frame, 0, 26);
  const b = ease(frame, 16, 44);
  return (
    <SceneShell duration={INTRO_DURATION}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <div style={{opacity: a, scale: `${0.8 + a * 0.2}`}}>
          <Logo size={110} />
        </div>
        <div style={{opacity: a, translate: `0 ${(1 - a) * 30}px`, fontSize: 132, fontWeight: 700, letterSpacing: -3, marginTop: 40}}>AI агент</div>
        <div style={{opacity: b, translate: `0 ${(1 - b) * 20}px`, fontSize: 48, color: T.muted, marginTop: 16}}>Тохиргоо биш — үр дүн.</div>
      </AbsoluteFill>
    </SceneShell>
  );
};
