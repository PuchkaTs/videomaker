import {T} from '../../kublai-agents/theme';
import {CardButton, Check} from '../../kublai-agents/ui';
import {DISPLAY} from '../fonts';
import {CAPTION_X, SET, c} from '../layout';
import {Caption, Numeral} from '../type';
import {Bubble, Finger, Grow, PhoneBody, Typing, stampIn} from '../ui';
import {clamp01, easeIn, easeInOut, hit, lin, mix, ramp, spring, useT} from '../time';
import {Obj} from '../world';

const S = SET.booking;
const PHONE = {x: 85, y: 0, yaw: -6};
const CAL = {x: 710, y: -20, z: -250, w: 690};
const TILE_W = 84;
const TILE_H = 70;
const TILE_GAP = 10;
const PAD = 21;
const SLOTS = ['10:00', '11:30', '14:00', 'Өөр өдөр'];
// October 2026 starts on a Thursday; the grid starts on Monday 28 September.
const DAYS = Array.from({length: 35}, (_, i) => {
  const d = i - 2;
  return d < 1 ? 28 + i : d > 31 ? d - 31 : d;
});
const DAY24 = 2 + 24;
const outsideMonth = (i: number) => i < 3 || i - 2 > 31;
const CAL_H = PAD + 60 + 30 + 5 * (TILE_H + TILE_GAP) - TILE_GAP + PAD;

// Centre of a calendar tile relative to the calendar's centre.
const tilePos = (i: number) => ({
  x: -CAL.w / 2 + PAD + (i % 7) * (TILE_W + TILE_GAP) + TILE_W / 2,
  y: -CAL_H / 2 + PAD + 60 + 30 + Math.floor(i / 7) * (TILE_H + TILE_GAP) + TILE_H / 2,
});

// Where the 11:30 chip sits inside the phone (offset from the phone's centre) when it is tapped.
const CHIP_LOCAL = {x: -36, y: 267};

const TimeChips = () => {
  const t = useT();
  const at = c('booking.chips');
  const tap = c('booking.tap');
  const open = ramp(t, at, at + 0.3);
  if (open <= 0) return null;
  return (
    <Grow p={open}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
        {SLOTS.map((s, i) => {
          const p = spring(t, at + i * 0.0625, 2.6, 0.55);
          const picked = s === '11:30' && t >= tap;
          const press = s === '11:30' ? hit(t, tap, 0.05, 0.15) : 0;
          return (
            <div key={s} style={{padding: '12px 22px', borderRadius: 999, border: `2px solid ${picked ? T.brand : T.border}`, background: picked ? T.brand : '#fff', color: picked ? '#fff' : T.brand, fontSize: 21, fontWeight: 600, opacity: clamp01(p * 2), scale: `${(0.5 + 0.5 * p) * (1 - press * 0.1)}`}}>
              {s}
            </div>
          );
        })}
      </div>
    </Grow>
  );
};

const Confirmed = () => {
  const t = useT();
  const at = c('booking.confirm');
  const open = ramp(t, at, at + 0.3);
  if (open <= 0) return null;
  const p = spring(t, at, 2.4, 0.6);
  return (
    <Grow p={open}>
      <div style={{width: 340, borderRadius: 22, border: `1px solid ${T.border}`, overflow: 'hidden', background: '#fff', opacity: clamp01(p * 2), scale: `${0.7 + 0.3 * p}`, transformOrigin: 'left bottom'}}>
        <div style={{padding: '16px 20px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700}}>
            <Check /> Таны цаг баталгаажлаа
          </div>
          <div style={{fontSize: 19, color: T.muted, marginTop: 6}}>Бямба, 10/24 · 11:30 · KublAi Store</div>
        </div>
        <CardButton>Цаг өөрчлөх</CardButton>
        <CardButton>Цуцлах</CardButton>
      </div>
    </Grow>
  );
};

const Phone = () => {
  const t = useT();
  const settle = spring(t, c('carousel.whip') + 0.5, 1.6, 0.55);
  return (
    <Obj x={S.x + PHONE.x} y={S.y + PHONE.y + Math.sin(t * 1.2) * 6} z={S.z} ry={PHONE.yaw - (1 - settle) * 30}>
      <div style={{position: 'relative'}}>
        <PhoneBody channel="Messenger" status="Messenger · Идэвхтэй">
          <Bubble at={c('booking.q')} from="customer">Бямба гарагт дэлгүүрт ирж үзэх цаг авч болох уу?</Bubble>
          <Typing from={c('booking.typing')} to={c('booking.a')} />
          <Bubble at={c('booking.a')} from="ai" tag="AI агент">Мэдээж! Бямба, 10/24-нд сул цагууд:</Bubble>
          <TimeChips />
          <Bubble at={c('booking.reply')} from="customer">11:30</Bubble>
          <Confirmed />
        </PhoneBody>
        <Finger x={235 + CHIP_LOCAL.x} y={450 + CHIP_LOCAL.y} press={c('booking.tap')} />
      </div>
    </Obj>
  );
};

// Month wall: tiles flip in as a wave, Saturday 24 lights up when the AI offers it,
// and racks into focus when the chosen time lands on it.
const Calendar = () => {
  const t = useT();
  const wave = c('booking.wave');
  const exit = c('booking.exit');
  const land = c('booking.land');
  const offered = ramp(t, c('booking.a'), c('booking.a') + 0.4);
  const focus = Math.max(1 - lin(t, wave + 0.9, wave + 1.4), ramp(t, c('booking.flight') + 0.1, land, easeInOut) * (1 - lin(t, land + 1.6, land + 2.3)));
  const blur = 2.6 * (1 - focus);
  const filled = lin(t, land, land + 0.15);
  const landFlash = hit(t, land, 0.02, 0.35);
  const header = ramp(t, wave, wave + 0.4) * (1 - ramp(t, exit, exit + 0.4));
  return (
    <Obj x={S.x + CAL.x} y={S.y + CAL.y} z={S.z + CAL.z} ry={-10} blur={blur}>
      <div style={{width: CAL.w, height: CAL_H, padding: PAD, boxSizing: 'border-box', borderRadius: 28, background: `rgba(255,255,255,${0.75 * header})`, boxShadow: `0 40px 90px rgba(17,24,39,${0.12 * header})`, fontFamily: T.font, color: T.text}}>
        <div style={{height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: header}}>
          <div style={{fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, letterSpacing: -0.5}}>10-р сар 2026</div>
          <div style={{fontSize: 18, color: T.muted, fontWeight: 700, letterSpacing: 1}}>ЦАГ ЗАХИАЛГА</div>
        </div>
        <div style={{height: 30, display: 'flex', gap: TILE_GAP, opacity: header}}>
          {['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'].map((d) => (
            <div key={d} style={{width: TILE_W, textAlign: 'center', fontSize: 16, color: T.faint, fontWeight: 700}}>{d}</div>
          ))}
        </div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: TILE_GAP}}>
          {DAYS.map((d, i) => {
            const col = i % 7;
            const row = Math.floor(i / 7);
            const inP = spring(t, wave + (col + row) * 0.045, 2.2, 0.62);
            const outP = ramp(t, exit + (col + row) * 0.035, exit + 0.35 + (col + row) * 0.035, easeIn);
            const other = outsideMonth(i);
            const target = i === DAY24;
            const bg = target && filled > 0 ? T.brand : target ? `rgba(224,237,255,${offered})` : other ? '#f3f4f6' : '#ffffff';
            return (
              <div
                key={i}
                style={{
                  width: TILE_W,
                  height: TILE_H,
                  borderRadius: 14,
                  background: bg,
                  border: `1px solid ${target ? T.brand : T.border}`,
                  boxShadow: target ? `0 0 ${landFlash * 50}px rgba(0,106,252,${landFlash})` : undefined,
                  padding: '8px 10px',
                  boxSizing: 'border-box',
                  fontSize: 20,
                  fontWeight: target ? 800 : 600,
                  color: target && filled > 0 ? '#fff' : other ? T.faint : T.text,
                  opacity: clamp01(inP * 2) * (1 - outP),
                  transform: `rotateX(${(1 - inP) * -90 + outP * 90}deg)`,
                  transformOrigin: '50% 0%',
                  scale: target ? `${1 + landFlash * 0.12}` : undefined,
                }}
              >
                {d}
                {target && filled > 0 ? <div style={{fontSize: 13, fontWeight: 700, marginTop: 6}}>11:30</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </Obj>
  );
};

// The tapped chip lifts out of the chat and arcs into Saturday 24.
const ChipFlight = () => {
  const t = useT();
  const a = c('booking.flight');
  const b = c('booking.land');
  if (t < a || t > b + 0.02) return null;
  const k = ramp(t, a, b, easeInOut);
  const tile = tilePos(DAY24);
  const from = {x: S.x + PHONE.x + CHIP_LOCAL.x, y: S.y + CHIP_LOCAL.y, z: S.z + 10};
  const to = {x: S.x + CAL.x + tile.x, y: S.y + CAL.y + tile.y, z: S.z + CAL.z + 6};
  return (
    <Obj x={mix(from.x, to.x, k)} y={mix(from.y, to.y, k) - Math.sin(k * Math.PI) * 260} z={mix(from.z, to.z, k) + Math.sin(k * Math.PI) * 260} rz={Math.sin(k * Math.PI) * -12} s={1 + Math.sin(k * Math.PI) * 0.25}>
      <div style={{padding: '12px 22px', borderRadius: 999, background: T.brand, color: '#fff', fontSize: 21, fontWeight: 700, fontFamily: T.font, boxShadow: '0 20px 40px rgba(0,106,252,0.45)'}}>11:30</div>
    </Obj>
  );
};

// Event card unfolds out of tile 24.
const EventCard = () => {
  const t = useT();
  const at = c('booking.land') + 0.05;
  const p = spring(t, at, 1.9, 0.62);
  const out = ramp(t, c('booking.exit'), c('booking.exit') + 0.4, easeIn);
  if (p <= 0) return null;
  const tile = tilePos(DAY24);
  const check = stampIn(t, c('booking.check'));
  const from = {x: S.x + CAL.x + tile.x, y: S.y + CAL.y + tile.y};
  const to = {x: S.x + CAL.x + 40, y: S.y + CAL.y + CAL_H / 2 + 20};
  return (
    <Obj x={mix(from.x, to.x, p)} y={mix(from.y, to.y, p)} z={S.z + CAL.z + 140 * p} ry={-10} s={0.25 + 0.75 * p} o={clamp01(p * 2) * (1 - out)}>
      <div style={{width: 400, padding: 22, borderRadius: 22, background: '#fff', border: `1px solid ${T.border}`, boxShadow: '0 30px 70px rgba(17,24,39,0.18)', fontFamily: T.font, color: T.text}}>
        <div style={{borderRadius: 14, background: T.brandSoft, borderLeft: `6px solid ${T.brand}`, padding: '14px 16px'}}>
          <div style={{fontSize: 22, fontWeight: 700}}>11:30 – 12:00</div>
          <div style={{fontSize: 19, color: T.muted, marginTop: 4}}>Дэлгүүрт ирж үзэх · Нараа Б.</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 19, color: T.green, fontWeight: 600, opacity: check.o}}>
          <span style={{display: 'inline-flex', scale: `${check.s}`}}>
            <Check size={18} />
          </span>
          Хуанлид нэмэгдлээ
        </div>
      </div>
    </Obj>
  );
};

export const BookingSet = () => (
  <>
    <Obj x={S.x - 140} y={S.y - 60} z={S.z - 1000}>
      <Numeral n={3} at={c('booking.caption')} out={c('booking.out')} />
    </Obj>
    <Calendar />
    <Obj x={S.x + CAPTION_X} y={S.y - 10} z={S.z} ry={6} preserve>
      <Caption n={3} title="Цаг захиалга" sub="Сул цагийг санал болгож, баталгаажуулна." at={c('booking.caption')} out={c('booking.out')} />
    </Obj>
    <Phone />
    <EventCard />
    <ChipFlight />
  </>
);

