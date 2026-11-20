import type {CSSProperties, ReactNode} from 'react';
import {T} from '../kublai-agents/theme';
import {Logo, Sparkle} from '../kublai-agents/ui';
import {backOut, clamp01, easeIn, easeOut, lin, ramp, spring, useT} from './time';

export const UI_FONT = T.font;

// Grows a row's height from 0 to its content height (p = 0..1) so the rows above
// slide up smoothly instead of jumping when a message arrives.
export const Grow = ({p, children, gap = 12, style}: {p: number; children: ReactNode; gap?: number; style?: CSSProperties}) => {
  if (p <= 0) return null;
  return (
    <div style={{display: 'grid', gridTemplateRows: `${Math.min(1, p)}fr`, flexShrink: 0, ...style}}>
      <div style={{minHeight: 0, overflow: p < 1 ? 'hidden' : 'visible', paddingTop: gap}}>{children}</div>
    </div>
  );
};

// Chat bubble: the row opens, then the bubble springs out of its tail corner.
// `until` collapses it again (used when a conversation is cleared).
// `landed` skips the pop for a bubble that arrives already formed (it flew in).
export const Bubble = ({at, from, children, maxWidth = 340, tag, until, fontSize = 22, landed = false}: {at: number; from: 'customer' | 'ai'; children: ReactNode; maxWidth?: number; tag?: string; until?: number; fontSize?: number; landed?: boolean}) => {
  const t = useT();
  const open = (landed ? (t >= at ? 1 : 0) : ramp(t, at, at + 0.3, easeOut)) * (until ? 1 - ramp(t, until, until + 0.3, easeIn) : 1);
  if (open <= 0) return null;
  const p = landed ? 1 : spring(t, at + 0.04, 2.6, 0.58);
  const mine = from === 'customer';
  const sweep = lin(t, at + 0.12, at + 0.75);
  return (
    <Grow p={open}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', opacity: clamp01(p * 1.6), scale: `${0.55 + 0.45 * p}`, transformOrigin: mine ? 'right bottom' : 'left bottom'}}>
        {tag ? (
          <div style={{fontSize: 16, color: T.muted, margin: '0 8px 4px', display: 'flex', alignItems: 'center', gap: 6}}>
            <Sparkle size={14} /> {tag}
          </div>
        ) : null}
        <div
          style={{
            position: 'relative',
            maxWidth,
            padding: '14px 20px',
            borderRadius: 26,
            borderBottomRightRadius: mine ? 8 : 26,
            borderBottomLeftRadius: mine ? 26 : 8,
            background: mine ? T.brand : T.bubble,
            color: mine ? '#fff' : T.text,
            fontSize,
            lineHeight: 1.4,
            overflow: 'hidden',
          }}
        >
          {children}
          {!mine && sweep > 0 && sweep < 1 ? (
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(100deg, transparent ${sweep * 140 - 40}%, rgba(0,106,252,0.22) ${sweep * 140 - 20}%, transparent ${sweep * 140}%)`}} />
          ) : null}
        </div>
      </div>
    </Grow>
  );
};

// Three-dot typing indicator; its row closes as the reply opens.
export const Typing = ({from, to}: {from: number; to: number}) => {
  const t = useT();
  const open = ramp(t, from, from + 0.2) * (1 - ramp(t, to - 0.05, to + 0.2, easeIn));
  if (open <= 0) return null;
  return (
    <Grow p={open}>
      <div style={{alignSelf: 'flex-start', display: 'inline-flex', gap: 7, padding: '18px 22px', borderRadius: 26, borderBottomLeftRadius: 8, background: T.bubble}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 11, height: 11, borderRadius: 6, background: T.faint, translate: `0 ${-5 * Math.max(0, Math.sin((t - from) * 9 - i * 0.9))}px`}} />
        ))}
      </div>
    </Grow>
  );
};

// Customer's phone. Content stacks from the bottom like a real chat.
export const PhoneBody = ({channel = 'Messenger', children, width = 470, height = 900, name = 'KublAi Store', status}: {channel?: string; children?: ReactNode; width?: number; height?: number; name?: string; status?: string}) => (
  <div style={{width, height, borderRadius: 64, background: '#0b0f19', padding: 14, boxShadow: '0 50px 90px rgba(17,24,39,0.22), inset 0 0 0 2px #262b38', fontFamily: UI_FONT, color: T.text}}>
    <div style={{width: '100%', height: '100%', borderRadius: 52, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      <div style={{height: 44, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0}}>
        <div style={{width: 120, height: 30, borderRadius: 15, background: '#0b0f19'}} />
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0}}>
        <Logo size={48} />
        <div>
          <div style={{fontSize: 24, fontWeight: 700}}>{name}</div>
          <div style={{fontSize: 18, color: T.muted}}>{status ?? `${channel} · Идэвхтэй`}</div>
        </div>
      </div>
      <div style={{flex: 1, padding: '6px 18px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', position: 'relative'}}>{children}</div>
      <div style={{margin: '0 16px 22px', height: 58, borderRadius: 29, background: T.bubble, display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: 21, color: T.faint, flexShrink: 0}}>Зурвас бичих…</div>
    </div>
  </div>
);

// Touch indicator: approaches, presses (shrinks, ring bursts), lifts.
export const Finger = ({x, y, press, show = [press - 0.6, press + 0.5]}: {x: number; y: number; press: number; show?: [number, number]}) => {
  const t = useT();
  const vis = ramp(t, show[0], show[0] + 0.2) * (1 - ramp(t, show[1] - 0.2, show[1]));
  if (vis <= 0) return null;
  const down = ramp(t, press - 0.08, press, easeOut) * (1 - ramp(t, press + 0.1, press + 0.3));
  const ring = lin(t, press, press + 0.45);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none'}}>
      {ring > 0 && ring < 1 ? <div style={{position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: 40, border: `4px solid ${T.brand}`, opacity: 1 - ring, scale: `${0.4 + ring * 1.1}`}} /> : null}
      <div style={{position: 'absolute', left: -28, top: -28, width: 56, height: 56, borderRadius: 28, background: 'rgba(17,24,39,0.22)', border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 20px rgba(17,24,39,0.25)', opacity: vis, scale: `${1.25 - 0.3 * down + (1 - vis) * 0.4}`}} />
    </div>
  );
};

// Pointer cursor; the hotspot is the arrow tip at (x, y).
export const Cursor = ({x, y, down = 0, o = 1}: {x: number; y: number; down?: number; o?: number}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: o, pointerEvents: 'none'}}>
    <svg width={44} height={52} viewBox="0 0 22 26" style={{position: 'absolute', left: -3, top: -2, scale: `${1 - down * 0.14}`, transformOrigin: '3px 2px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))'}}>
      <path d="M2 1.5 L2 20 L7 15.5 L10.5 23.5 L13.8 22 L10.4 14.3 L17 14 Z" fill="#111827" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  </div>
);

// Stamp-in for verdicts and status pills: overshoots from big, then settles.
export const stampIn = (t: number, at: number) => {
  const p = lin(t, at, at + 0.32);
  return {o: clamp01(p * 3), s: p >= 1 ? 1 : 1.9 - 0.9 * backOut(p, 2.2)};
};

