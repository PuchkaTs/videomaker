import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 0→1 spring that starts at `at` (frames, relative to the current Sequence).
export const usePop = (at: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping: 16, stiffness: 140}});
};

export const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});

// Fades a whole scene in and out over the shared background.
export const SceneShell = ({duration, n, title, sub, children}: {duration: number; n?: number; title?: string; sub?: string; children: ReactNode}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      name="Scene"
      style={{
        fontFamily: T.font,
        color: T.text,
        opacity: interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], clamp),
      }}
    >
      {title ? <Caption n={n} title={title} sub={sub ?? ''} /> : null}
      {children}
    </AbsoluteFill>
  );
};

const Caption = ({n, title, sub}: {n?: number; title: string; sub: string}) => {
  const frame = useCurrentFrame();
  const a = ease(frame, 4, 30);
  const b = ease(frame, 14, 40);
  return (
    <div style={{position: 'absolute', left: 120, top: 0, bottom: 0, width: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      {n ? (
        <div style={{opacity: a, translate: `0 ${(1 - a) * 20}px`, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28}}>
          <div style={{width: 56, height: 56, borderRadius: 16, background: T.brand, color: '#fff', fontWeight: 700, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
          <div style={{fontSize: 24, letterSpacing: 3, color: T.brand, fontWeight: 700}}>AI АГЕНТ</div>
        </div>
      ) : null}
      <div style={{opacity: a, translate: `0 ${(1 - a) * 30}px`, fontSize: 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5}}>{title}</div>
      <div style={{opacity: b, translate: `0 ${(1 - b) * 20}px`, fontSize: 38, lineHeight: 1.4, color: T.muted, marginTop: 28}}>{sub}</div>
    </div>
  );
};

// Right-hand stage for the product visual.
export const Stage = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div style={{position: 'absolute', left: 780, right: 80, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, ...style}}>{children}</div>
);

export const Logo = ({size = 40}: {size?: number}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.28, background: T.brand, color: '#fff', fontWeight: 700, fontSize: size * 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>K</div>
);

export const Wordmark = ({size}: {size: number}) => (
  <div style={{fontWeight: 700, fontSize: size, letterSpacing: -size * 0.03, color: T.text}}>
    Kubl<span style={{color: T.brand}}>Ai</span>
  </div>
);

// Customer's phone (Messenger / Instagram), messages stack from the bottom.
export const Phone = ({channel = 'Messenger', children, enterAt = 0, width = 470, height = 900}: {channel?: string; children: ReactNode; enterAt?: number; width?: number; height?: number}) => {
  const p = usePop(enterAt);
  return (
    <div style={{width, height, borderRadius: 64, background: '#0b0f19', padding: 14, boxShadow: '0 40px 80px rgba(17,24,39,0.18)', opacity: p, translate: `0 ${(1 - p) * 60}px`, flexShrink: 0}}>
      <div style={{width: '100%', height: '100%', borderRadius: 52, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        <div style={{height: 44, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{width: 120, height: 30, borderRadius: 15, background: '#0b0f19'}} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px 16px', borderBottom: `1px solid ${T.border}`}}>
          <Logo size={48} />
          <div>
            <div style={{fontSize: 24, fontWeight: 700}}>KublAi Store</div>
            <div style={{fontSize: 18, color: T.muted}}>{channel} · Идэвхтэй</div>
          </div>
        </div>
        <div style={{flex: 1, padding: '18px 18px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12, overflow: 'hidden'}}>{children}</div>
        <div style={{margin: '0 16px 22px', height: 58, borderRadius: 29, background: T.bubble, display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: 21, color: T.faint}}>Зурвас бичих…</div>
      </div>
    </div>
  );
};

// A chat bubble that pops in at `at`. Customer on the right, AI/page on the left.
export const Bubble = ({at, from, children, maxWidth = 340, tag}: {at: number; from: 'customer' | 'ai'; children: ReactNode; maxWidth?: number; tag?: string}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  if (frame < at) return null;
  const mine = from === 'customer';
  return (
    <div style={{flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', opacity: p, scale: `${0.9 + p * 0.1}`, transformOrigin: mine ? 'right bottom' : 'left bottom'}}>
      {tag ? <div style={{fontSize: 16, color: T.muted, margin: '0 8px 4px', display: 'flex', alignItems: 'center', gap: 6}}><Sparkle size={14} /> {tag}</div> : null}
      <div
        style={{
          maxWidth,
          padding: '14px 20px',
          borderRadius: 26,
          borderBottomRightRadius: mine ? 8 : 26,
          borderBottomLeftRadius: mine ? 26 : 8,
          background: mine ? T.brand : T.bubble,
          color: mine ? '#fff' : T.text,
          fontSize: 22,
          lineHeight: 1.4,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Three-dot typing indicator shown between `from` and `to`.
export const Typing = ({from, to}: {from: number; to: number}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{flexShrink: 0, alignSelf: 'flex-start', display: 'flex', gap: 7, padding: '18px 22px', borderRadius: 26, borderBottomLeftRadius: 8, background: T.bubble}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 11, height: 11, borderRadius: 6, background: T.faint, opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame - from) / 5 - i * 0.9))}} />
      ))}
    </div>
  );
};

export const Sparkle = ({size = 18, color = T.brand}: {size?: number; color?: string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z" />
  </svg>
);

export const Check = ({size = 20, color = T.green}: {size?: number; color?: string}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

// Simple product art: a bag silhouette on a tinted tile (no real product photos yet).
export const ProductArt = ({tone, height = 200, kind = 'bag'}: {tone: string; height?: number; kind?: 'bag' | 'wallet'}) => (
  <div style={{height, background: `linear-gradient(160deg, #f8fafc, ${tone}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={height * 0.62} height={height * 0.62} viewBox="0 0 100 100">
      {kind === 'bag' ? (
        <>
          <path d="M32 34 C32 18 68 18 68 34" fill="none" stroke={tone} strokeWidth="6" strokeLinecap="round" />
          <rect x="18" y="34" width="64" height="54" rx="10" fill={tone} />
          <rect x="18" y="34" width="64" height="10" rx="5" fill="#ffffff" opacity="0.15" />
        </>
      ) : (
        <>
          <rect x="14" y="30" width="72" height="44" rx="9" fill={tone} />
          <rect x="54" y="44" width="32" height="16" rx="6" fill="#ffffff" opacity="0.25" />
        </>
      )}
    </svg>
  </div>
);

// Messenger-style button row under a card.
export const CardButton = ({children, active = false}: {children: ReactNode; active?: boolean}) => (
  <div style={{borderTop: `1px solid ${T.border}`, padding: '14px 0', textAlign: 'center', fontSize: 21, fontWeight: 600, color: active ? '#fff' : T.brand, background: active ? T.brand : 'transparent'}}>{children}</div>
);

export const Pill = ({children, bg, color, style}: {children: ReactNode; bg: string; color: string; style?: CSSProperties}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: bg, color, fontSize: 18, fontWeight: 700, letterSpacing: 0.6, ...style}}>{children}</div>
);

// Expanding ring that marks a tap or click.
export const Tap = ({at, x, y}: {at: number; x: number; y: number}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 18) return null;
  return (
    <div style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30, border: `4px solid ${T.brand}`, opacity: 1 - t / 18, scale: `${0.5 + t / 18}`, pointerEvents: 'none'}} />
  );
};

// KublAi web app window: top bar plus icon rail, like the Figma "Agents" frames.
export const AppWindow = ({children, width = 1040, height = 820, enterAt = 0, active = 'Agents'}: {children: ReactNode; width?: number; height?: number; enterAt?: number; active?: string}) => {
  const p = usePop(enterAt);
  return (
    <div style={{width, height, borderRadius: 24, background: T.bg, border: `1px solid ${T.border}`, boxShadow: '0 40px 80px rgba(17,24,39,0.14)', overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: p, translate: `0 ${(1 - p) * 50}px`, flexShrink: 0}}>
      <div style={{height: 60, background: '#fff', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px'}}>
        <Logo size={32} />
        <div style={{fontSize: 21, fontWeight: 700}}>KublAi</div>
        <div style={{flex: 1, display: 'flex', justifyContent: 'center', gap: 28, fontSize: 18, color: T.muted}}>
          {['Agents', 'Notes', 'Projects', 'ERP'].map((l) => (
            <span key={l} style={{color: l === active ? T.brand : T.muted, fontWeight: l === active ? 700 : 400}}>{l}</span>
          ))}
        </div>
      </div>
      <div style={{flex: 1, display: 'flex', minHeight: 0}}>
        <div style={{width: 64, background: '#fff', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 20}}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{width: 34, height: 34, borderRadius: 10, background: i === 2 ? T.brand : T.bubble}} />
          ))}
        </div>
        <div style={{flex: 1, minWidth: 0, padding: 26, display: 'flex', flexDirection: 'column', gap: 18}}>{children}</div>
      </div>
    </div>
  );
};

export const Panel = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div style={{background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, ...style}}>{children}</div>
);
