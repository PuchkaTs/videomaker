import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../video1/Fonts';
import {ease} from '../video1/motion';

export type KublaiGuideStep = {title: string; body: string};
export type KublaiGuideProps = {title: string; subtitle: string; steps: KublaiGuideStep[]; tagline: string};

export const KUBLAI_FPS = 30;
const INTRO = 120;
const STEP = 150;
// brand-voice-ending.mp3 is 4.28 s; leave a short tail after it.
const ENDING = 150;

export const kublaiGuideDuration = (steps: KublaiGuideStep[]) => INTRO + steps.length * STEP + ENDING;

export const KUBLAI_GUIDE_DEFAULTS: KublaiGuideProps = {
  title: 'KublAi гарын авлага',
  subtitle: 'Эхний агентаа 3 алхамд тохируулах',
  steps: [
    {title: 'Агент үүсгэх', body: 'Agents хэсэгт орж шинэ агентын нэр, зааварчилгааг оруулна.'},
    {title: 'Сувгаа холбох', body: 'Facebook Messenger эсвэл Instagram хуудсаа агенттай холбоно.'},
    {title: 'Дэлгүүрээ холбох', body: 'Бүтээгдэхүүн, захиалгаа агентад харуулж борлуулалтаа автоматжуулна.'},
  ],
  tagline: 'Анхны зурвасаас эхлээд эцсийн хүргэлт хүртэл.',
};

const C = {bg: '#041f27', panel: '#06414f', accent: '#5fd4e8', soft: '#d9f6fc', text: '#f4fbfd'};
const font = "'Noto Sans', Arial, sans-serif";

const Backdrop = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        background: `radial-gradient(ellipse at ${25 + frame / 12}% 70%, ${C.panel} 0%, transparent 60%), radial-gradient(ellipse at 85% 15%, #0b5b6e 0%, transparent 50%), ${C.bg}`,
      }}
    />
  );
};

const Wordmark = ({size}: {size: number}) => (
  <div style={{fontFamily: font, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.03, color: C.text}}>
    Kubl<span style={{color: C.accent}}>Ai</span>
  </div>
);

const Intro = ({title, subtitle}: {title: string; subtitle: string}) => {
  const frame = useCurrentFrame();
  const a = ease(frame, 0, 30);
  const b = ease(frame, 14, 30);
  const out = interpolate(frame, [INTRO - 15, INTRO], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: 140, opacity: out}}>
      <div style={{opacity: a, transform: `translateY(${(1 - a) * 40}px)`}}>
        <Wordmark size={44} />
        <div style={{fontFamily: font, fontWeight: 700, fontSize: 110, lineHeight: 1.08, color: C.text, marginTop: 36}}>{title}</div>
      </div>
      <div style={{opacity: b, transform: `translateY(${(1 - b) * 30}px)`, fontFamily: font, fontSize: 48, color: C.soft, marginTop: 28}}>{subtitle}</div>
      <div style={{width: 320 * b, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 48}} />
    </AbsoluteFill>
  );
};

const Step = ({step, index, total}: {step: KublaiGuideStep; index: number; total: number}) => {
  const frame = useCurrentFrame();
  const a = ease(frame, 0, 26);
  const b = ease(frame, 10, 26);
  const out = interpolate(frame, [STEP - 12, STEP], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: 140, opacity: out}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 32, opacity: a, transform: `translateX(${(1 - a) * -40}px)`}}>
        <div style={{width: 120, height: 120, borderRadius: 60, backgroundColor: C.accent, color: C.bg, fontFamily: font, fontWeight: 700, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {index + 1}
        </div>
        <div style={{fontFamily: font, fontSize: 32, color: C.soft, letterSpacing: 4}}>АЛХАМ {index + 1} / {total}</div>
      </div>
      <div style={{fontFamily: font, fontWeight: 700, fontSize: 96, color: C.text, marginTop: 44, opacity: a}}>{step.title}</div>
      <div style={{fontFamily: font, fontSize: 46, lineHeight: 1.4, color: C.soft, marginTop: 24, maxWidth: 1400, opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>{step.body}</div>
    </AbsoluteFill>
  );
};

const Ending = ({tagline}: {tagline: string}) => {
  const frame = useCurrentFrame();
  const a = ease(frame, 0, 28);
  const b = ease(frame, 40, 30);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
      <div style={{fontFamily: font, fontSize: 56, color: C.soft, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>{tagline}</div>
      <div style={{marginTop: 40, opacity: b, transform: `scale(${0.92 + b * 0.08})`}}>
        <Wordmark size={170} />
      </div>
      <Audio src={staticFile('kublai/brand-voice-ending.mp3')} />
    </AbsoluteFill>
  );
};

export const KublaiGuide = ({title, subtitle, steps, tagline}: KublaiGuideProps) => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <Fonts />
    <Backdrop />
    <Sequence durationInFrames={INTRO} name="Intro">
      <Intro title={title} subtitle={subtitle} />
    </Sequence>
    {steps.map((step, i) => (
      <Sequence key={i} from={INTRO + i * STEP} durationInFrames={STEP} name={`Step ${i + 1}`}>
        <Step step={step} index={i} total={steps.length} />
      </Sequence>
    ))}
    <Sequence from={INTRO + steps.length * STEP} durationInFrames={ENDING} name="Brand ending">
      <Ending tagline={tagline} />
    </Sequence>
  </AbsoluteFill>
);
