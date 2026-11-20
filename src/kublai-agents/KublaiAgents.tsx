import type {ComponentType} from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {Fonts} from '../video1/Fonts';
import {T} from './theme';
import {Intro, INTRO_DURATION} from './scenes/Intro';
import {AiReply, AI_REPLY_DURATION} from './scenes/AiReply';
import {Carousel, CAROUSEL_DURATION} from './scenes/Carousel';
import {Appointment, APPOINTMENT_DURATION} from './scenes/Appointment';
import {CommentToDm, COMMENT_DURATION} from './scenes/CommentToDm';
import {LeadCapture, LEAD_DURATION} from './scenes/LeadCapture';
import {TestAgent, TEST_DURATION} from './scenes/TestAgent';
import {FixWithEditor, FIX_DURATION} from './scenes/FixWithEditor';
import {Outro, OUTRO_DURATION} from './scenes/Outro';

// Order and length of the agents segment (docs/kublai-launch/agents-segment.md).
export const AGENT_SCENES = [
  {id: 'Agents-Intro', component: Intro, duration: INTRO_DURATION},
  {id: 'Agents-AiReply', component: AiReply, duration: AI_REPLY_DURATION},
  {id: 'Agents-Carousel', component: Carousel, duration: CAROUSEL_DURATION},
  {id: 'Agents-Appointment', component: Appointment, duration: APPOINTMENT_DURATION},
  {id: 'Agents-CommentToDm', component: CommentToDm, duration: COMMENT_DURATION},
  {id: 'Agents-LeadCapture', component: LeadCapture, duration: LEAD_DURATION},
  {id: 'Agents-TestAgent', component: TestAgent, duration: TEST_DURATION},
  {id: 'Agents-FixWithEditor', component: FixWithEditor, duration: FIX_DURATION},
  {id: 'Agents-Outro', component: Outro, duration: OUTRO_DURATION},
];

export const KUBLAI_AGENTS_DURATION = AGENT_SCENES.reduce((sum, s) => sum + s.duration, 0);

export const AgentsBackdrop = () => (
  <AbsoluteFill
    style={{
      backgroundColor: T.bg,
      backgroundImage: `radial-gradient(circle at 85% 20%, ${T.brandSoft} 0%, transparent 45%), radial-gradient(circle at 10% 90%, #eef2ff 0%, transparent 40%)`,
    }}
  />
);

export const KublaiAgents = () => (
  <AbsoluteFill>
    <Fonts />
    <AgentsBackdrop />
    <Series>
      {AGENT_SCENES.map(({id, component: Scene, duration}) => (
        <Series.Sequence key={id} durationInFrames={duration} name={id.replace('Agents-', '')}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

// Wraps one scene with the fonts and backdrop so it can be previewed on its own.
export const withBackdrop = (Scene: ComponentType) => () => (
  <AbsoluteFill>
    <Fonts />
    <AgentsBackdrop />
    <Scene />
  </AbsoluteFill>
);
