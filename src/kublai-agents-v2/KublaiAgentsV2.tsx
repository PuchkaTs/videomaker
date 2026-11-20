import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {T} from '../kublai-agents/theme';
import {DotWall, Particles, Sky, Vignette} from './backdrop';
import {blurSamples, camAt} from './camera';
import {FontsV2} from './fonts';
import {DURATION_S, SCENES, STEMS, VOICES, WHOOSHES, active, c} from './layout';
import type {VoiceVersion} from './layout';
import {FPS, useT} from './time';
import {MotionBlur, World} from './world';
import {CarrierBubble, IntroSet} from './scenes/Intro';
import {ReplySet} from './scenes/Reply';
import {BookingSet} from './scenes/Booking';
import {CommentSet, DmPhone} from './scenes/Comment';
import {LeadSet} from './scenes/Lead';
import {AppSet} from './scenes/App';
import {OutroSet} from './scenes/Outro';

export const KUBLAI_AGENTS_V2_DURATION = DURATION_S * FPS;

// Shutter of 180° at 60 fps.
const SHUTTER = 1 / 120;

const Frame = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{fontFamily: T.font}}>
      <Sky />
      <World cam={camAt(t)}>
        <DotWall />
        <Particles />
        {active(t, SCENES.intro, 0, 0.6) ? <IntroSet /> : null}
        <CarrierBubble />
        {active(t, [SCENES.reply[0], SCENES.carousel[1]], 1.4, 1.2) ? <ReplySet /> : null}
        {active(t, SCENES.booking, 1.0, 1.4) ? <BookingSet /> : null}
        {active(t, SCENES.comment, 1.2, 0.8) ? <CommentSet /> : null}
        {active(t, [c('comment.dm'), c('lead.dive') + 1.0], 0.2, 0) ? <DmPhone /> : null}
        {active(t, SCENES.lead, 0.4, 0.8) ? <LeadSet /> : null}
        {active(t, [SCENES.test[0], SCENES.fix[1]], 1.0, 1.0) ? <AppSet /> : null}
        {active(t, SCENES.outro, 1.0, 0) ? <OutroSet /> : null}
      </World>
      <Vignette />
    </AbsoluteFill>
  );
};

export const KublaiAgentsV2 = ({voice = 'narration'}: {voice?: VoiceVersion}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#070b16'}}>
      <FontsV2 />
      <MotionBlur t={t} samples={blurSamples(t, SHUTTER)} shutter={SHUTTER} render={() => <Frame />} />
      {STEMS[voice].map((s) => (
        <Sequence key={s.file} layout="none" name={s.name}>
          <Audio src={staticFile(s.file)} />
        </Sequence>
      ))}
      {VOICES[voice].map((v) => (
        <Sequence key={v.cue} from={Math.round(v.at * FPS)} layout="none" name={`Voice ${v.cue}`}>
          <Audio src={staticFile(v.file)} volume={v.volume} />
        </Sequence>
      ))}
      {/* Timeline markers only: the whoosh sounds themselves are baked into the score. */}
      <Sequence name="Whooshes (markers)" layout="none">
        {WHOOSHES.map((w) => (
          <Sequence key={w.id} from={Math.round(w.at * FPS)} durationInFrames={Math.max(1, Math.round(w.dur * FPS))} layout="none" name={`${w.id} · ${w.name}`}>
            {null}
          </Sequence>
        ))}
      </Sequence>
    </AbsoluteFill>
  );
};
