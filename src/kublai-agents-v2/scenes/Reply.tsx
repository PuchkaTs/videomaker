import {T} from '../../kublai-agents/theme';
import {CardButton, Check, Panel, ProductArt} from '../../kublai-agents/ui';
import {PRODUCTS} from '../../kublai-agents/scenes/Carousel';
import {dayness} from '../backdrop';
import {DISPLAY} from '../fonts';
import {CAPTION_X, SET, c} from '../layout';
import {Caption, Numeral} from '../type';
import {Bubble, Finger, PhoneBody, Typing, stampIn} from '../ui';
import {clamp01, easeIn, easeInOut, easeOut, hit, mix, ramp, spring, useT} from '../time';
import {Obj} from '../world';

const S = SET.reply;
const PHONE_X = 360;
const PHONE_YAW = -8;
const CARD = 280;
const GAP = 14;

export const ProductCard = ({i, active = false}: {i: number; active?: boolean}) => {
  const prod = PRODUCTS[i];
  return (
    <div style={{width: CARD, flexShrink: 0, borderRadius: 22, border: `1px solid ${T.border}`, overflow: 'hidden', background: '#fff', fontFamily: T.font, color: T.text}}>
      <ProductArt tone={prod.tone} kind={prod.kind} height={190} />
      <div style={{padding: '14px 18px'}}>
        <div style={{fontSize: 22, fontWeight: 700}}>{prod.name}</div>
        <div style={{fontSize: 18, color: T.muted, marginTop: 2}}>{prod.detail}</div>
        <div style={{fontSize: 22, fontWeight: 700, marginTop: 6}}>{prod.price}</div>
      </div>
      <CardButton active={active}>Захиалах</CardButton>
      <CardButton>Дэлгэрэнгүй</CardButton>
    </div>
  );
};

// The carousel inside the phone after the cards dock; a finger swipes it, then taps «Захиалах».
const Carousel = () => {
  const t = useT();
  const docked = c('carousel.docked');
  if (t < docked) return null;
  const swipe = c('carousel.swipe');
  const x = -(CARD + GAP) * ramp(t, swipe + 0.1, swipe + 0.5, easeInOut);
  const tap = c('carousel.tap');
  return (
    <div style={{flexShrink: 0, paddingTop: 12, marginLeft: -4, marginRight: -18, overflow: 'hidden'}}>
      <div style={{display: 'flex', gap: GAP, translate: `${x}px 0`}}>
        {PRODUCTS.map((_, i) => (
          <ProductCard key={i} i={i} active={i === 1 && t >= tap + 0.04} />
        ))}
      </div>
    </div>
  );
};

const MessengerChat = () => (
  <PhoneBody channel="Messenger" status="Messenger · 23:48">
    <Bubble at={c('reply.land')} from="customer" landed>Сайн байна уу! Улаанбаатар дотор хүргэлт хэд вэ?</Bubble>
    <Typing from={c('reply.typing')} to={c('reply.a1')} />
    <Bubble at={c('reply.a1')} from="ai" tag="AI агент">Сайн байна уу! УБ дотор хүргэлт 5,000₮, 24 цагийн дотор хүргэнэ.</Bubble>
    <Bubble at={c('reply.q2')} from="customer">Маргааш авч болох уу?</Bubble>
    <Typing from={c('reply.typing2')} to={c('reply.a2')} />
    <Bubble at={c('reply.a2')} from="ai" tag="AI агент">Тийм ээ! Өнөөдөр 18:00-оос өмнө захиалбал маргааш хүргэнэ.</Bubble>
  </PhoneBody>
);

const InstagramChat = () => {
  const t = useT();
  const swipe = c('carousel.swipe');
  const tap = c('carousel.tap');
  const swipeX = mix(400, 130, ramp(t, swipe + 0.1, swipe + 0.5, easeInOut));
  return (
    <div style={{position: 'relative'}}>
      <PhoneBody channel="Instagram" status="Instagram · 09:12">
        <Bubble at={c('carousel.q')} from="customer">Хар өнгийн цүнх байна уу?</Bubble>
        <Typing from={c('carousel.typing')} to={c('carousel.a')} />
        <Bubble at={c('carousel.a')} from="ai" tag="AI агент">Тийм ээ, эдгээрээс сонгоорой:</Bubble>
        <Carousel />
        <Bubble at={c('carousel.reply')} from="customer">Мини цүнхийг авъя!</Bubble>
      </PhoneBody>
      <Finger x={swipeX} y={600} press={swipe + 0.12} show={[swipe - 0.3, swipe + 0.6]} />
      <Finger x={172} y={742} press={tap} />
    </div>
  );
};

// One phone, two faces: the night Messenger chat flips to the morning Instagram chat.
const Phone = () => {
  const t = useT();
  const flip = ramp(t, c('reply.flip'), c('reply.flip') + 0.7, easeInOut);
  const lift = Math.sin(flip * Math.PI);
  const enter = ramp(t, c('intro.exit'), c('reply.land'), easeOut);
  // Hidden until the title starts to leave: behind the title, CSS depth sorting can draw it on top.
  const show = ramp(t, c('intro.exit'), c('intro.exit') + 0.3);
  return (
    <Obj x={S.x + PHONE_X + lift * -60} y={S.y + Math.sin(t * 1.3) * 6} z={S.z + lift * 240 + (1 - enter) * -900} ry={PHONE_YAW + flip * 180} rz={lift * -4} o={show} preserve>
      <div style={{position: 'relative', transformStyle: 'preserve-3d'}}>
        <div style={{backfaceVisibility: 'hidden'}}>
          <MessengerChat />
        </div>
        <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
          <InstagramChat />
        </div>
      </div>
    </Obj>
  );
};

// Glow from the phone screen at night; gone by sunrise.
const ScreenGlow = () => {
  const t = useT();
  const o = (1 - dayness(t)) * ramp(t, 3.4, 4.6);
  return (
    <Obj x={S.x + PHONE_X} y={S.y} z={S.z - 260} o={o}>
      <div style={{width: 1300, height: 1300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(70,140,255,0.45) 0%, rgba(0,106,252,0.12) 40%, transparent 68%)'}} />
    </Obj>
  );
};

// Big far-plane clock: 23:48 at night, time-lapses to the morning at the cut.
const Clock = () => {
  const t = useT();
  const k = ramp(t, c('reply.timelapse'), c('reply.timelapse') + 1.0, easeInOut);
  const minutes = Math.floor(23 * 60 + 48 + k * (9 * 60 + 24)) % (24 * 60);
  const label = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const day = dayness(t);
  const o = ramp(t, 4.0, 5.0) * (1 - ramp(t, 13.0, 14.0));
  return (
    <Obj x={S.x - 250} y={S.y - 930} z={S.z - 2300} o={o}>
      <div style={{fontFamily: DISPLAY, fontWeight: 200, fontSize: 360, letterSpacing: -10, fontVariantNumeric: 'tabular-nums', color: day < 0.5 ? 'rgba(150,185,255,0.20)' : 'rgba(0,106,252,0.10)'}}>{label}</div>
    </Obj>
  );
};

// «Хариулсан · 2 сек» card: flies in from the front, the number stamps on the beat.
const StatCard = () => {
  const t = useT();
  const at = c('reply.stat');
  const p = spring(t, at, 1.9, 0.62);
  const out = ramp(t, c('reply.out'), c('reply.out') + 0.5, easeIn);
  if (p <= 0) return null;
  const st = stampIn(t, c('reply.stamp'));
  const flash = hit(t, c('reply.stamp'), 0.02, 0.3);
  return (
    <Obj x={S.x + CAPTION_X + 30 - (1 - p) * 300 - out * 500} y={S.y + 330} z={S.z + 120 + (1 - p) * 700} ry={10 - (1 - p) * 40} o={clamp01(p * 2) * (1 - out)}>
      <Panel style={{width: 300, padding: '24px 28px', fontFamily: T.font, color: T.text, boxShadow: `0 30px 70px rgba(0,30,90,0.35), 0 0 ${flash * 80}px rgba(0,106,252,${flash * 0.8})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, color: T.green, fontSize: 22, fontWeight: 700}}>
          <Check /> Хариулсан
        </div>
        <div style={{fontFamily: DISPLAY, fontSize: 80, fontWeight: 800, letterSpacing: -2, marginTop: 6, opacity: st.o, scale: `${st.s}`, transformOrigin: 'left center'}}>2 сек</div>
        <div style={{fontSize: 20, color: T.muted, marginTop: 4}}>Шөнийн 23:48 цагт</div>
      </Panel>
    </Obj>
  );
};

// Product cards burst out of the phone into a fan, then dock back as the carousel.
const CardFan = () => {
  const t = useT();
  const burst = c('carousel.burst');
  const dock = c('carousel.dock');
  if (t < burst || t > c('carousel.docked') + 0.05) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = spring(t, burst + i * 0.12, 1.7, 0.62);
        const d = ramp(t, dock + i * 0.05, dock + 0.4 + i * 0.05, easeInOut);
        const from = {x: PHONE_X, y: 120, z: 0, ry: PHONE_YAW, rz: 0, s: 0.3};
        const fan = {x: PHONE_X - 360 + i * 340, y: -40 + Math.abs(i - 1) * 50, z: 420 - Math.abs(i - 1) * 90, ry: (i - 1) * -18, rz: (i - 1) * 5, s: 1};
        const slot = {x: PHONE_X - 63 + i * (CARD + GAP), y: 172, z: 0, ry: PHONE_YAW, rz: 0, s: 1};
        const a = {x: mix(from.x, fan.x, p), y: mix(from.y, fan.y, p), z: mix(from.z, fan.z, p), ry: mix(from.ry, fan.ry, p), rz: mix(from.rz, fan.rz, p), s: mix(from.s, fan.s, p)};
        const pos = {x: mix(a.x, slot.x, d), y: mix(a.y, slot.y, d) - Math.sin(d * Math.PI) * 80, z: mix(a.z, slot.z, d), ry: mix(a.ry, slot.ry, d), rz: mix(a.rz, slot.rz, d), s: mix(a.s, slot.s, d)};
        // The third card docks beyond the phone's edge, so it fades as it slides under the frame.
        const clip = i === 2 ? 1 - ramp(t, dock + 0.3, dock + 0.5) : 1;
        return (
          <Obj key={i} x={S.x + pos.x} y={S.y + pos.y} z={S.z + pos.z + 2} ry={pos.ry} rz={pos.rz} s={pos.s} o={clamp01(p * 3) * clip}>
            <div style={{boxShadow: `0 ${40 * (1 - d)}px ${80 * (1 - d)}px rgba(17,24,39,${0.25 * (1 - d)})`, borderRadius: 22}}>
              <ProductCard i={i} />
            </div>
          </Obj>
        );
      })}
    </>
  );
};

export const ReplySet = () => {
  const t = useT();
  const night = dayness(t) < 0.5;
  return (
    <>
      <ScreenGlow />
      <Clock />
      <Obj x={S.x - 60} y={S.y - 80} z={S.z - 1000}>
        {t < 12 ? <Numeral n={1} at={c('reply.caption')} out={c('reply.out')} night /> : <Numeral n={2} at={c('carousel.caption')} out={c('carousel.out')} />}
      </Obj>
      <Obj x={S.x + CAPTION_X} y={S.y - 10} z={S.z} ry={6} preserve>
        {t < 12 ? (
          <Caption n={1} title="AI шууд хариулна" sub="Өдөр шөнөгүй, хэдхэн секундэд." at={c('reply.caption')} out={c('reply.out')} night={night} />
        ) : (
          <Caption n={2} title="Бүтээгдэхүүний карусель" sub="Каталогоос зураг, үнэтэй нь харуулна." at={c('carousel.caption')} out={c('carousel.out')} />
        )}
      </Obj>
      <Phone />
      <StatCard />
      <CardFan />
    </>
  );
};

