import {T} from '../../kublai-agents/theme';
import {Logo} from '../../kublai-agents/ui';
import {DISPLAY} from '../fonts';
import {c} from '../layout';
import {backOut, clamp01, easeIn, easeInOut, hit, lin, mix, ramp, rand, spring, useT} from '../time';
import {Obj, dof, useCam} from '../world';

const NIGHT_MESSAGES = [
  ['Нээлттэй юу?', '23:12'],
  ['Үнэ хэд вэ?', '00:41'],
  ['Хүргэлт байгаа юу?', '01:07'],
  ['Хэмжээ байна уу?', '02:33'],
  ['Захиалъя!', '03:58'],
  ['Хаана байрладаг вэ?', '05:20'],
  ['Өнөөдөр авч болох уу?', '06:02'],
  ['Бор өнгө бий юу?', '23:31'],
  ['Карт уншдаг уу?', '00:15'],
  ['Буцаалт хийдэг үү?', '01:49'],
  ['Сайн байна уу?', '04:26'],
  ['Хямдрал хэзээ вэ?', '22:57'],
  ['Утас нь хэд вэ?', '02:02'],
  ['Маргааш ирж болох уу?', '03:14'],
];

// Late-night customer messages the camera flies through.
const Tunnel = () => {
  const t = useT();
  const cam = useCam();
  const fade = 1 - ramp(t, 3.6, 4.6);
  return (
    <>
      {NIGHT_MESSAGES.map(([text, time], i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (430 + rand(i, 11) * 760);
        const y = -560 + rand(i, 12) * 1120;
        const z = 3300 - i * 240 - rand(i, 13) * 120;
        const mine = i % 3 !== 1;
        return (
          <Obj key={i} x={x} y={y} z={z} ry={side * -14} o={fade} blur={Math.min(6, dof(z, cam, 0.6))}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 6, fontFamily: T.font}}>
              <div style={{padding: '16px 24px', borderRadius: 28, borderBottomRightRadius: mine ? 8 : 28, borderBottomLeftRadius: mine ? 28 : 8, background: mine ? T.brand : '#1d2a47', color: '#fff', fontSize: 30, whiteSpace: 'nowrap'}}>{text}</div>
              <div style={{fontSize: 20, color: '#7f93bd', padding: '0 10px'}}>{time}</div>
            </div>
          </Obj>
        );
      })}
    </>
  );
};

// "AI агент" assembles from letters scattered through depth, landing on 16th notes.
const Title = () => {
  const t = useT();
  const at = c('intro.letters');
  const exit = c('intro.exit');
  const letters = [...'AI агент'];
  return (
    <div style={{display: 'flex', fontFamily: DISPLAY, fontWeight: 800, fontSize: 210, letterSpacing: -7, color: '#fff', lineHeight: 1, transformStyle: 'preserve-3d'}}>
      {letters.map((ch, i) => {
        if (ch === ' ') return <span key={i} style={{width: 56}} />;
        const p = spring(t, at + i * 0.1, 2.3, 0.6);
        const side = i < 2 ? -1 : 1;
        const q = ramp(t, exit + Math.abs(i - 2.5) * 0.02, exit + 0.75, easeIn);
        const x = (1 - p) * (rand(i, 21) - 0.5) * 1800 + q * side * (500 + i * 60);
        const y = (1 - p) * (rand(i, 22) - 0.5) * 1100 - q * 80;
        const z = (1 - p) * (-1500 + rand(i, 23) * 2600) + q * 600;
        const ry = (1 - p) * (rand(i, 24) - 0.5) * 220 + q * side * 70;
        const rx = (1 - p) * (rand(i, 25) - 0.5) * 140;
        return (
          <span key={i} style={{display: 'inline-block', opacity: clamp01(p * 2) * (1 - q), transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// "24/7 таны борлуулалтыг хариуцана.": the phrase sets first with an empty slot,
// then "24/7" slams into the slot on the music hit.
const Pitch = () => {
  const t = useT();
  const setup = ramp(t, c('intro.setup'), c('intro.setup') + 0.4);
  const punchAt = c('intro.punch');
  const punch = lin(t, punchAt, punchAt + 0.3);
  const exit = ramp(t, c('intro.exit'), c('intro.exit') + 0.5, easeIn);
  const flash = hit(t, punchAt, 0.03, 0.25);
  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: 22, fontFamily: DISPLAY, fontSize: 64, whiteSpace: 'nowrap', opacity: 1 - exit, translate: `0 ${exit * 60}px`}}>
      {/* Fixed-width slot so the phrase never shifts when the number lands. */}
      <span
        style={{
          display: 'inline-block',
          width: PUNCH_W,
          textAlign: 'center',
          fontWeight: 900,
          letterSpacing: -1,
          color: '#5aa2ff',
          opacity: clamp01(punch * 3),
          scale: `${punch >= 1 ? 1 : 2.2 - 1.2 * backOut(punch, 2.4)}`,
          textShadow: `0 0 ${20 + flash * 60}px rgba(0,106,252,${0.4 + flash * 0.5})`,
        }}
      >
        24/7
      </span>
      <span style={{fontWeight: 400, color: '#c3d0ee', opacity: setup, translate: `${(1 - setup) * 40}px 0`, filter: setup < 1 ? `blur(${(1 - setup) * 10}px)` : undefined}}>таны борлуулалтыг хариуцана.</span>
    </div>
  );
};

const PUNCH_W = 170;
// Centre of the "24/7" slot relative to the line's centre (line ≈ slot + gap + 920 px phrase).
const PUNCH_X = -(PUNCH_W + 22 + 920) / 2 + PUNCH_W / 2;

// The first customer's question rides along with the camera into the phone.
export const CarrierBubble = () => {
  const t = useT();
  const a = c('intro.exit') - 0.5;
  const b = c('reply.land');
  if (t < a - 0.5 || t > b + 0.05) return null;
  const k = ramp(t, a, b, easeInOut);
  const appear = ramp(t, a - 0.5, a);
  return (
    <Obj x={mix(760, 393, k)} y={mix(520, 286, k)} z={mix(950, -2396, k)} ry={mix(-24, -8, k)} rz={mix(-8, 0, k)} o={appear}>
      <div style={{width: 340, padding: '14px 20px', borderRadius: 26, borderBottomRightRadius: 8, background: T.brand, color: '#fff', fontFamily: T.font, fontSize: 22, lineHeight: 1.4, boxShadow: `0 20px 60px rgba(0,106,252,${0.5 * (1 - k)})`}}>
        Сайн байна уу! Улаанбаатар дотор хүргэлт хэд вэ?
      </div>
    </Obj>
  );
};

export const IntroSet = () => {
  const t = useT();
  const k = spring(t, c('intro.k'), 2, 0.55);
  const kExit = ramp(t, c('intro.exit'), c('intro.exit') + 0.4, easeIn);
  const ring = lin(t, c('intro.punch'), c('intro.punch') + 0.7);
  return (
    <>
      <Tunnel />
      <Obj x={0} y={-250} z={0} ry={(1 - k) * 100 + kExit * -90} s={0.6 + 0.4 * k} o={clamp01(k * 2) * (1 - kExit)}>
        <div style={{filter: 'drop-shadow(0 0 40px rgba(0,106,252,0.7))'}}>
          <Logo size={120} />
        </div>
      </Obj>
      <Obj x={0} y={-20} z={-40} o={ramp(t, c('intro.letters') + 0.3, c('intro.letters') + 1.0) * (1 - kExit)}>
        <div style={{width: 1300, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,106,252,0.38) 0%, rgba(0,106,252,0.10) 45%, transparent 70%)'}} />
      </Obj>
      <Obj x={0} y={-20} z={0} preserve>
        <Title />
      </Obj>
      <Obj x={0} y={170} z={0}>
        <Pitch />
      </Obj>
      {ring > 0 && ring < 1 ? (
        <Obj x={PUNCH_X} y={168} z={-10} s={0.4 + ring * 2.4} o={(1 - ring) * 0.8}>
          <div style={{width: 210, height: 110, borderRadius: 55, border: '3px solid #5aa2ff'}} />
        </Obj>
      ) : null}
    </>
  );
};
