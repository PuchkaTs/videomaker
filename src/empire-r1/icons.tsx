import {clamp01, easeInOut, easeOut, hit, ramp, spring, useT} from '../kublai-agents-v2/time';
import {COL, mixColor} from './kit';

// Line-and-fill icons in a 200 × 220 box. Every icon keeps a small idle motion so held cards stay alive.

const TOOTH = 'M100 22 C70 2 30 12 25 57 C20 97 40 122 45 152 C50 187 55 212 70 212 C85 212 85 172 100 152 C115 172 115 212 130 212 C145 212 150 187 155 152 C160 122 180 97 175 57 C170 12 130 2 100 22 Z';
// Gum: a scalloped mound hugging the tooth's neck, rounded underneath.
const GUM = 'M18 136 C40 116 66 142 100 130 C134 142 160 116 182 136 C196 150 194 178 176 192 C150 210 50 210 24 192 C6 178 4 150 18 136 Z';
const SHIELD = 'M100 -14 L192 18 L192 108 C192 170 146 208 100 232 C54 208 8 170 8 108 L8 18 Z';
const STAR = 'M0 -14 C2 -3 3 -2 14 0 C3 2 2 3 0 14 C-2 3 -3 2 -14 0 C-3 -2 -2 -3 0 -14 Z';

const Tooth = ({x = 0, y = 0, s = 1, gum = COL.gumHealthy, cavity = 0}: {x?: number; y?: number; s?: number; gum?: string; cavity?: number}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={TOOTH} fill={COL.tooth} stroke="#AEB6C3" strokeWidth={4} />
    <path d="M62 48 C70 34 88 32 96 40" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.9} />
    {cavity > 0.01 ? (
      <g transform="translate(128 74)">
        <ellipse rx={20 * cavity} ry={15 * cavity} fill={COL.amber} opacity={0.55} />
        <ellipse rx={12 * cavity} ry={9 * cavity} fill={COL.cavity} />
      </g>
    ) : null}
    <path d={GUM} fill={gum} />
    <path d="M18 136 C40 116 66 142 100 130 C134 142 160 116 182 136" fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={4} />
  </g>
);

const Sparkle = ({x, y, k}: {x: number; y: number; k: number}) => (k <= 0.01 ? null : <path d={STAR} transform={`translate(${x} ${y}) scale(${k * 1.4}) rotate(${k * 45})`} fill="#FFFFFF" opacity={clamp01(k)} />);

// The question tooth: a cavity spot grows, the gum turns red and throbs, then the answer heals it
// inside a silver shield that draws itself around the tooth.
export const QuestionTooth = ({cavityAt, gumAt, healAt, size}: {cavityAt: number; gumAt: number; healAt: number; size: number}) => {
  const t = useT();
  const heal = ramp(t, healAt, healAt + 0.6, easeInOut);
  const cavity = spring(t, cavityAt, 2.2, 0.6) * (1 - heal);
  const red = ramp(t, gumAt, gumAt + 0.4) * (1 - heal);
  const throb = red * (0.5 + 0.5 * Math.sin((t - gumAt) * Math.PI * 2 * 1.6));
  const shield = ramp(t, healAt - 0.25, healAt + 0.45, easeOut);
  const bob = Math.sin(t * 1.7) * 6;
  return (
    <svg width={size} height={size * 1.15} viewBox="-20 -30 240 270" style={{overflow: 'visible'}}>
      <g transform={`translate(0 ${bob}) rotate(${Math.sin(t * 1.1) * 3} 100 110)`}>
        <Tooth gum={mixColor(COL.gumHealthy, COL.gum, red + throb * 0.25)} cavity={cavity} />
        <path d={SHIELD} fill="none" stroke="url(#qt-silver)" strokeWidth={9} strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - shield} opacity={shield > 0 ? 1 : 0} />
        <defs>
          <linearGradient id="qt-silver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#9CA5B5" />
            <stop offset="1" stopColor="#F3F5F8" />
          </linearGradient>
        </defs>
        <Sparkle x={170} y={20} k={hit(t, healAt + 0.35, 0.08, 0.35)} />
        <Sparkle x={30} y={70} k={hit(t, healAt + 0.5, 0.08, 0.3) * 0.7} />
        <Sparkle x={150} y={170} k={hit(t, healAt + 0.62, 0.08, 0.3) * 0.6} />
      </g>
    </svg>
  );
};

// Tip 1: a brush scrubs the crown with its handle trailing down-left (away from the title); from
// `gumsAt` it drops to the gum line.
export const BrushIcon = ({gumsAt}: {gumsAt: number}) => {
  const t = useT();
  const toGum = ramp(t, gumsAt, gumsAt + 0.5, easeInOut);
  const scrub = Math.sin(t * Math.PI * 2 * 3.2) * 12;
  return (
    <svg width={220} height={240} viewBox="-10 -20 220 260" style={{overflow: 'visible'}}>
      <Tooth x={30} y={40} s={0.7} />
      <g transform={`translate(${124 + scrub} ${52 + toGum * 70}) rotate(${28 + toGum * 6})`}>
        <rect x={-150} y={-11} width={128} height={22} rx={11} fill="url(#br-g)" />
        <rect x={-26} y={-15} width={48} height={30} rx={8} fill="#E9EDF3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={-22 + i * 9} y={12} width={6} height={22} rx={3} fill={COL.ice} />
        ))}
      </g>
      <defs>
        <linearGradient id="br-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F4F6F9" />
          <stop offset="1" stopColor="#9CA5B5" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Tip 2: floss slides up and down between two teeth.
export const FlossIcon = () => {
  const t = useT();
  const y = 70 + Math.sin(t * Math.PI * 2 * 1.4) * 34;
  return (
    <svg width={220} height={240} viewBox="-10 -20 220 260" style={{overflow: 'visible'}}>
      <Tooth x={-6} y={50} s={0.56} />
      <Tooth x={94} y={50} s={0.56} />
      <path d={`M100 -10 L100 ${y} M100 ${y} L60 -10 M100 ${y} L140 -10`} stroke={COL.ice} strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={100} cy={y} r={6} fill={COL.white} />
    </svg>
  );
};

// Tip 3: the clock races while snacks keep popping in around it.
export const ClockIcon = ({at}: {at: number}) => {
  const t = useT();
  const e = Math.max(0, t - at);
  const snacks = [0, 1, 2, 3, 4, 5];
  return (
    <svg width={220} height={240} viewBox="-10 -20 220 260" style={{overflow: 'visible'}}>
      <circle cx={100} cy={110} r={78} fill={COL.navy2} stroke="url(#ck-g)" strokeWidth={8} />
      {Array.from({length: 12}, (_, i) => (
        <line key={i} x1={100} y1={44} x2={100} y2={54} stroke={COL.silver} strokeWidth={4} transform={`rotate(${i * 30} 100 110)`} />
      ))}
      <line x1={100} y1={110} x2={100} y2={60} stroke={COL.white} strokeWidth={6} strokeLinecap="round" transform={`rotate(${e * 300} 100 110)`} />
      <line x1={100} y1={110} x2={100} y2={78} stroke={COL.ice} strokeWidth={7} strokeLinecap="round" transform={`rotate(${e * 25} 100 110)`} />
      <circle cx={100} cy={110} r={7} fill={COL.white} />
      {snacks.map((i) => {
        const k = spring(t, at + 0.5 + i * 0.55, 3, 0.5);
        const a = (-60 + i * 52) * (Math.PI / 180);
        return k <= 0.01 ? null : <circle key={i} cx={100 + Math.cos(a) * 104} cy={110 + Math.sin(a) * 104} r={11 * k} fill={i % 2 ? COL.amber : COL.gum} opacity={0.9} />;
      })}
      <defs>
        <linearGradient id="ck-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#9CA5B5" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Tip 4: a calendar; one day lights up for the check-up and a tick draws over it.
export const CalendarIcon = ({dayAt, tickAt}: {dayAt: number; tickAt: number}) => {
  const t = useT();
  const day = spring(t, dayAt, 2.6, 0.55);
  const tick = ramp(t, tickAt, tickAt + 0.45, easeOut);
  return (
    <svg width={220} height={240} viewBox="-10 -20 220 260" style={{overflow: 'visible'}}>
      <rect x={14} y={30} width={172} height={168} rx={20} fill={COL.navy2} stroke="url(#cl-g)" strokeWidth={7} />
      <rect x={14} y={30} width={172} height={44} rx={20} fill="url(#cl-g)" />
      {[56, 144].map((x) => (
        <rect key={x} x={x - 6} y={14} width={12} height={34} rx={6} fill={COL.white} />
      ))}
      {Array.from({length: 12}, (_, i) => {
        const cx = 42 + (i % 4) * 39;
        const cy = 98 + Math.floor(i / 4) * 34;
        const lit = i === 6;
        return lit ? (
          <rect key={i} x={cx - 16 * day} y={cy - 14 * day} width={32 * day} height={28 * day} rx={8} fill={COL.ice} />
        ) : (
          <circle key={i} cx={cx} cy={cy} r={5} fill={COL.dim} />
        );
      })}
      <path d="M104 166 L128 188 L178 126" fill="none" stroke={COL.white} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - tick} opacity={tick > 0 ? 1 : 0} />
      <defs>
        <linearGradient id="cl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#9CA5B5" />
        </linearGradient>
      </defs>
    </svg>
  );
};
