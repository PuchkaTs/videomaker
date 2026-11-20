import type {ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from './theme';
import {Panel, Pill} from './ui';

// Text typed into a composer, one character every `speed` frames from `at`.
export const typed = (frame: number, text: string, at: number, speed = 1.2) =>
  text.slice(0, Math.max(0, Math.floor((frame - at) / speed)));

// The Test agent chat card from the Figma "Agents 04 · Test agent" frames.
export const TestChat = ({children, draft = '', title = 'Sales agent'}: {children: ReactNode; draft?: string; title?: string}) => (
  <Panel style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: `1px solid ${T.border}`}}>
      <div style={{width: 44, height: 44, borderRadius: 22, background: T.brandSoft}} />
      <div style={{flex: 1}}>
        <div style={{fontSize: 21, fontWeight: 700}}>{title}</div>
        <div style={{fontSize: 16, color: T.muted}}>Messenger · Customer preview</div>
      </div>
      <Pill bg={T.bubble} color={T.muted}>TEST MODE</Pill>
    </div>
    <div style={{flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12, overflow: 'hidden'}}>{children}</div>
    <div style={{margin: '0 16px 16px', height: 56, borderRadius: 14, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 20, color: draft ? T.text : T.faint}}>
      {draft || 'Хэрэглэгчийн өмнөөс бичих…'}
      {draft ? <span style={{width: 2, height: 24, background: T.brand, marginLeft: 2}} /> : null}
    </div>
  </Panel>
);

export const TestHeader = ({title, sub}: {title: string; sub: string}) => (
  <div>
    <div style={{fontSize: 34, fontWeight: 700}}>{title}</div>
    <div style={{fontSize: 18, color: T.muted, marginTop: 4}}>{sub}</div>
  </div>
);

export const Divider = ({at, label}: {at: number; label: string}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, color: T.muted, fontSize: 16}}>
      <div style={{flex: 1, height: 1, background: T.border}} />
      {label}
      <div style={{flex: 1, height: 1, background: T.border}} />
    </div>
  );
};
