import type {ReactNode} from 'react';
import {T} from '../../kublai-agents/theme';
import {Check, Logo, Pill, ProductArt} from '../../kublai-agents/ui';
import {DISPLAY} from '../fonts';
import {SET, c} from '../layout';
import {backOut, clamp01, easeIn, easeOut, hit, lin, mix, ramp, spring, useT} from '../time';
import {Obj} from '../world';

const O = SET.outro;

// One token per capability shown in the film (built lazily: module-level JSX runs before React is in scope).
const tokens = (): ReactNode[] => [
  <div style={{padding: '14px 20px', borderRadius: 26, borderBottomRightRadius: 8, background: T.brand, color: '#fff', fontSize: 22}}>Сайн байна уу!</div>,
  <div style={{width: 150, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}`, background: '#fff'}}>
    <ProductArt tone="#374151" height={90} />
    <div style={{padding: '8px 12px', fontSize: 16, fontWeight: 700}}>129,000₮</div>
  </div>,
  <div style={{padding: '12px 22px', borderRadius: 999, background: T.brand, color: '#fff', fontSize: 21, fontWeight: 700}}>11:30</div>,
  <div style={{padding: '10px 16px', borderRadius: 20, background: T.bubble, fontSize: 20}}>Үнэ хэд вэ?</div>,
  <Pill bg={T.hotSoft} color={T.hot}>HOT LEAD</Pill>,
  <Pill bg={T.greenSoft} color={T.green}>
    <Check size={16} /> Зөв
  </Pill>,
];

const Tokens = () => {
  const t = useT();
  const a = c('fix.pullback') + 0.2;
  const b = c('outro.converge');
  const k = ramp(t, a, b, easeIn);
  if (t < a || t > b + 0.05) return null;
  const list = tokens();
  return (
    <>
      {list.map((tok, i) => {
        const ang = (i / list.length) * Math.PI * 2 + 0.4 + k * Math.PI * 1.4;
        const r = mix(520 + (i % 2) * 120, 0, k);
        const z = mix(O.z - 700 + (i % 3) * 250, O.z, k);
        return (
          <Obj key={i} x={O.x + Math.cos(ang) * r * 1.25} y={O.y - 200 + Math.sin(ang) * r * 0.7} z={z} rz={(1 - k) * (i % 2 ? 12 : -12)} s={mix(1, 0.2, k)} o={ramp(t, a, a + 0.35) * (1 - lin(t, b - 0.08, b))}>
            <div style={{fontFamily: T.font, color: T.text, boxShadow: '0 20px 50px rgba(17,24,39,0.18)', borderRadius: 24}}>{tok}</div>
          </Obj>
        );
      })}
    </>
  );
};

const LogoMark = () => {
  const t = useT();
  const at = c('outro.converge');
  const p = spring(t, at, 2.0, 0.5);
  if (p <= 0) return null;
  const flash = hit(t, at, 0.02, 0.4);
  const ring = lin(t, at, at + 0.8);
  return (
    <>
      <Obj x={O.x} y={O.y - 260} z={O.z} s={p} rz={(1 - p) * -30}>
        <div style={{filter: `drop-shadow(0 0 ${10 + flash * 50}px rgba(0,106,252,${0.35 + flash * 0.5}))`}}>
          <Logo size={110} />
        </div>
      </Obj>
      {ring < 1 ? (
        <Obj x={O.x} y={O.y - 260} z={O.z - 5} s={0.6 + ring * 3} o={(1 - ring) * 0.7}>
          <div style={{width: 130, height: 130, borderRadius: 40, border: `3px solid ${T.brand}`}} />
        </Obj>
      ) : null}
    </>
  );
};

// Tagline words follow the brand voice line.
const TAGLINE = ['Анхны', 'зурвасаас', 'эхлээд', 'эцсийн', 'хүргэлт', 'хүртэл.'];
const WORD_AT = [0.05, 0.3, 0.95, 1.2, 1.8, 2.2];

const Tagline = () => {
  const t = useT();
  const v = c('outro.voice');
  return (
    <Obj x={O.x} y={O.y - 40} z={O.z}>
      <div style={{display: 'flex', gap: 16, fontFamily: DISPLAY, fontSize: 54, fontWeight: 500, color: T.muted, whiteSpace: 'nowrap', letterSpacing: -0.5}}>
        {TAGLINE.map((w, i) => {
          const p = ramp(t, v + WORD_AT[i], v + WORD_AT[i] + 0.4, easeOut);
          const strong = i >= 4;
          return (
            <span key={i} style={{display: 'inline-block', opacity: p, translate: `0 ${(1 - p) * 40}px`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, color: strong ? T.text : T.muted, fontWeight: strong ? 700 : 500}}>
              {w}
            </span>
          );
        })}
      </div>
    </Obj>
  );
};

// "KublAi" lands on the spoken brand name; "Ai" arrives last in brand blue.
const WordmarkDrop = () => {
  const t = useT();
  const at = c('outro.wordmark');
  const letters = [...'KublAi'];
  return (
    <Obj x={O.x} y={O.y + 150} z={O.z}>
      <div style={{display: 'flex', fontFamily: T.font, fontWeight: 700, fontSize: 170, letterSpacing: -5, lineHeight: 1}}>
        {letters.map((ch, i) => {
          const start = at - 0.3 + i * 0.05 + (i >= 4 ? 0.08 : 0);
          const p = lin(t, start, start + 0.3);
          const y = p >= 1 ? 0 : -(1 - backOut(p, 1.8)) * 160;
          const ai = i >= 4;
          const flash = ai ? hit(t, start + 0.22, 0.02, 0.5) : 0;
          return (
            <span key={i} style={{display: 'inline-block', color: ai ? T.brand : T.text, opacity: clamp01(p * 3), translate: `0 ${y}px`, textShadow: ai ? `0 0 ${flash * 50}px rgba(0,106,252,${flash * 0.8})` : undefined}}>
              {ch}
            </span>
          );
        })}
      </div>
    </Obj>
  );
};

export const OutroSet = () => (
  <>
    <Tokens />
    <LogoMark />
    <Tagline />
    <WordmarkDrop />
  </>
);
