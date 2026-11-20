import {useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {AppWindow, Bubble, Panel, Pill, SceneShell, Stage, Typing, usePop} from '../ui';
import {TestChat, TestHeader, typed} from '../chat';

export const TEST_DURATION = 270;

const QUESTION = 'Танайх ямар цүнхтэй вэ?';
const SEND_AT = 48;

const WhatHappened = ({at}: {at: number}) => {
  const p = usePop(at);
  return (
    <div style={{width: 300, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0}}>
      <Panel style={{padding: 22, opacity: p, translate: `0 ${(1 - p) * 20}px`}}>
        <div style={{fontSize: 21, fontWeight: 700}}>What happened</div>
        <div style={{fontSize: 19, color: T.brand, fontWeight: 600, marginTop: 10}}>Product list tool</div>
        <div style={{fontSize: 17, color: T.muted, lineHeight: 1.45, marginTop: 8}}>Хадгалсан каталогоос 3 бараа олж харууллаа.</div>
      </Panel>
      <Panel style={{padding: 22}}>
        <div style={{fontSize: 21, fontWeight: 700}}>Using saved settings</div>
        {['Booking', 'Product list', 'Comment to DM'].map((t) => (
          <div key={t} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 18}}>
            {t}
            <Pill bg={T.greenSoft} color={T.green} style={{fontSize: 14, padding: '4px 12px'}}>ON</Pill>
          </div>
        ))}
      </Panel>
    </div>
  );
};

export const TestAgent = () => {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={TEST_DURATION} n={6} title="Туршиж үзнэ" sub="Хэрэглэгчид хүрэхээс өмнө тест горимд шалгана.">
      <Stage>
        <AppWindow width={1060} height={840}>
          <TestHeader title="Test agent" sub="Хадгалсан мэдлэг, хэрэгслээр хэрэглэгчийн яриаг туршина." />
          <div style={{flex: 1, display: 'flex', gap: 18, minHeight: 0}}>
            <TestChat draft={frame < SEND_AT ? typed(frame, QUESTION, 14) : ''}>
              <Bubble at={SEND_AT} from="customer" maxWidth={440}>{QUESTION}</Bubble>
              <Typing from={SEND_AT + 14} to={SEND_AT + 40} />
              <Bubble at={SEND_AT + 40} from="ai" tag="AI агент" maxWidth={460}>
                Манайд арьсан цүнх (189,000₮), мини цүнх (129,000₮), түрийвч (59,000₮) байна. Аль нь сонирхож байна вэ?
              </Bubble>
            </TestChat>
            <WhatHappened at={SEND_AT + 56} />
          </div>
          <div style={{fontSize: 16, color: T.muted}}>Хувийн тест. Захиалга, цаг захиалга дуурайлган хийгдэнэ — хэрэглэгчид юу ч илгээгдэхгүй.</div>
        </AppWindow>
      </Stage>
    </SceneShell>
  );
};
