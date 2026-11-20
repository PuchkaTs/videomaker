import type {ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {AppWindow, Bubble, Check, Panel, Pill, SceneShell, Sparkle, Stage, Tap, Typing, usePop} from '../ui';
import {Divider, TestChat, TestHeader, typed} from '../chat';

export const FIX_DURATION = 330;

const QUESTION = 'Дархан руу хүргэлт хэд вэ?';
const FIX = 'Дархан руу хүргэлт 15,000₮, УБ дотор 5,000₮.';
const FIX_SEND = 136;
const APPLY_AT = 206;
const RETEST = 226;

const Verdict = ({at, ok}: {at: number; ok: boolean}) => {
  const p = usePop(at);
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{flexShrink: 0, alignSelf: 'flex-start', opacity: p, scale: `${0.8 + p * 0.2}`, transformOrigin: 'left center'}}>
      <Pill bg={ok ? T.greenSoft : T.redSoft} color={ok ? T.green : T.red}>{ok ? <><Check size={16} /> Зөв</> : '✕ Буруу мэдээлэл'}</Pill>
    </div>
  );
};

const Line = ({sign, children}: {sign: '+' | '−'; children: ReactNode}) => (
  <div style={{display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 10, background: sign === '+' ? T.greenSoft : T.redSoft, color: sign === '+' ? T.green : T.red, fontSize: 18, lineHeight: 1.4, textDecoration: sign === '−' ? 'line-through' : 'none'}}>
    <span style={{fontWeight: 700}}>{sign}</span>
    <span>{children}</span>
  </div>
);

const EditorPanel = () => {
  const frame = useCurrentFrame();
  const p = usePop(88);
  const reply = usePop(FIX_SEND + 28);
  const applied = frame >= APPLY_AT;
  return (
    <Panel style={{width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: p, translate: `${(1 - p) * 40}px 0`, border: `2px solid ${T.brand}`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.brandSoft}}>
        <Sparkle size={22} />
        <div style={{fontSize: 21, fontWeight: 700}}>Agent editor</div>
      </div>
      <div style={{flex: 1, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12}}>
        <div style={{fontSize: 17, color: T.muted}}>Агентын юуг засах вэ?</div>
        <Bubble at={FIX_SEND} from="customer" maxWidth={320}>{FIX}</Bubble>
        {frame >= FIX_SEND + 28 ? (
          <div style={{flexShrink: 0, opacity: reply, translate: `0 ${(1 - reply) * 14}px`, display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{fontSize: 18, fontWeight: 600}}>Зааврыг ингэж шинэчилье:</div>
            <Line sign="−">Хүргэлт үнэгүй.</Line>
            <Line sign="+">УБ дотор 5,000₮, Дархан руу 15,000₮.</Line>
            <div style={{marginTop: 6, padding: '12px 0', borderRadius: 12, textAlign: 'center', fontSize: 19, fontWeight: 700, background: applied ? T.greenSoft : T.brand, color: applied ? T.green : '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8}}>
              {applied ? <><Check size={18} /> Хэрэглэсэн</> : 'Хэрэглэх'}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{margin: '0 14px 14px', minHeight: 52, borderRadius: 12, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 17, color: frame < FIX_SEND && frame > 100 ? T.text : T.faint}}>
        {frame < FIX_SEND && frame > 100 ? typed(frame, FIX, 100, 0.8) : 'Засварыг энгийнээр бичнэ үү…'}
      </div>
    </Panel>
  );
};

export const FixWithEditor = () => {
  const frame = useCurrentFrame();
  const retesting = frame >= RETEST;
  return (
    <SceneShell duration={FIX_DURATION} n={7} title="AI-аар засна" sub="Юу буруу байгааг хэлэхэд л зааврыг шинэчилнэ.">
      <Stage>
        <div style={{position: 'relative'}}>
          <AppWindow width={1060} height={840}>
            <TestHeader title="Test agent" sub="Буруу хариултыг Agent editor-оор шууд засна." />
            <div style={{flex: 1, display: 'flex', gap: 18, minHeight: 0}}>
              <TestChat>
                {retesting ? null : (
                  <>
                    <Bubble at={12} from="customer" maxWidth={380}>{QUESTION}</Bubble>
                    <Typing from={24} to={44} />
                    <Bubble at={44} from="ai" tag="AI агент" maxWidth={380}>Хүргэлт үнэгүй.</Bubble>
                    <Verdict at={64} ok={false} />
                  </>
                )}
                <Divider at={RETEST} label="Шинэ тест" />
                {retesting ? (
                  <>
                    <Bubble at={RETEST + 10} from="customer" maxWidth={380}>{QUESTION}</Bubble>
                    <Typing from={RETEST + 22} to={RETEST + 44} />
                    <Bubble at={RETEST + 44} from="ai" tag="AI агент" maxWidth={400}>Дархан руу хүргэлт 15,000₮, 2–3 хоногт хүргэнэ.</Bubble>
                    <Verdict at={RETEST + 62} ok />
                  </>
                ) : null}
              </TestChat>
              <EditorPanel />
            </div>
          </AppWindow>
          <Tap at={APPLY_AT - 4} x={850} y={700} />
        </div>
      </Stage>
    </SceneShell>
  );
};
