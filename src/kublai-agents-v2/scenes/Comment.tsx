import type {ReactNode} from 'react';
import {T} from '../../kublai-agents/theme';
import {Logo, Panel, ProductArt, Sparkle} from '../../kublai-agents/ui';
import {CAPTION_X, SET, c} from '../layout';
import {Caption, Numeral} from '../type';
import {Bubble, Grow, PhoneBody, Typing} from '../ui';
import {clamp01, easeIn, easeInOut, expoOut, mix, ramp, spring, useT} from '../time';
import {Obj} from '../world';

const S = SET.comment;
const L = SET.lead;
const POST_X = 150;
export const DM = {x: 660, w: 420, h: 820};
// The DM phone ends up here in the lead-capture layout.
export const DM_LEAD_X = -20;

const Initials = ({text, bg}: {text: string; bg: string}) => (
  <div style={{width: 44, height: 44, borderRadius: 22, background: bg, color: '#fff', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{text}</div>
);

const Comment = ({at, name, avatar, children, ai = false, indent = false}: {at: number; name: string; avatar: ReactNode; children: ReactNode; ai?: boolean; indent?: boolean}) => {
  const t = useT();
  const open = ramp(t, at, at + 0.3);
  if (open <= 0) return null;
  const p = spring(t, at, 2.4, 0.6);
  return (
    <Grow p={open} gap={14}>
      <div style={{display: 'flex', gap: 12, marginLeft: indent ? 56 : 0, opacity: clamp01(p * 2), translate: `${(1 - p) * -30}px 0`}}>
        {avatar}
        <div>
          <div style={{background: ai ? T.aiBubble : T.bubble, borderRadius: 20, padding: '10px 16px'}}>
            <div style={{fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8}}>
              {name}
              {ai ? (
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15, color: T.brand}}>
                  <Sparkle size={13} /> AI
                </span>
              ) : null}
            </div>
            <div style={{fontSize: 20, marginTop: 2}}>{children}</div>
          </div>
          <div style={{fontSize: 15, color: T.muted, margin: '4px 0 0 14px'}}>Саяхан · Like · Reply</div>
        </div>
      </div>
    </Grow>
  );
};

// Skeleton posts from other pages, so the feed reads as a feed without inventing brands.
const OtherPost = ({seed}: {seed: number}) => (
  <Panel style={{width: 560, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 30px 70px rgba(17,24,39,0.10)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{width: 44, height: 44, borderRadius: 22, background: seed % 2 ? '#e5e7eb' : '#dbeafe'}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <div style={{width: 160 + seed * 20, height: 14, borderRadius: 7, background: '#e5e7eb'}} />
        <div style={{width: 90, height: 10, borderRadius: 5, background: '#f1f3f6'}} />
      </div>
    </div>
    <div style={{width: '85%', height: 14, borderRadius: 7, background: '#eef0f3'}} />
    <div style={{height: 260, borderRadius: 14, background: seed % 2 ? 'linear-gradient(160deg,#f3f4f6,#e5e7eb)' : 'linear-gradient(160deg,#eef4ff,#dbe7ff)'}} />
  </Panel>
);

const StorePost = () => (
  <Panel style={{width: 560, overflow: 'hidden', fontFamily: T.font, color: T.text, boxShadow: '0 40px 90px rgba(17,24,39,0.16)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px'}}>
      <Logo size={44} />
      <div>
        <div style={{fontSize: 20, fontWeight: 700}}>KublAi Store</div>
        <div style={{fontSize: 16, color: T.muted}}>Facebook · 2 цагийн өмнө</div>
      </div>
    </div>
    <div style={{fontSize: 20, padding: '0 20px 14px'}}>Шинэ улирлын арьсан цүнх ирлээ!</div>
    <ProductArt tone="#1f2937" height={230} />
    <div style={{padding: '4px 20px 22px', display: 'flex', flexDirection: 'column'}}>
      <Comment at={c('comment.c1')} name="Солонго Э." avatar={<Initials text="СЭ" bg="#db2777" />}>Үнэ хэд вэ?</Comment>
      <Comment at={c('comment.c2')} name="KublAi Store" avatar={<Logo size={44} />} ai indent>
        Сайн байна уу! Дэлгэрэнгүйг мессежээр илгээлээ.
      </Comment>
    </div>
  </Panel>
);

// The feed scrolls up fast while lying back, then stands up as it settles on the store's post.
const Feed = () => {
  const t = useT();
  const a = c('comment.scroll');
  const b = c('comment.settle');
  const scroll = ramp(t, a, b, expoOut);
  const stand = ramp(t, a + 0.3, b + 0.2, easeInOut);
  const exit = ramp(t, c('comment.exit'), c('comment.exit') + 0.7, easeIn);
  const offset = mix(2600, 0, scroll);
  const posts = [-2, -1, 0, 1, 2];
  return (
    <>
      {posts.map((k) => {
        const y = k * 760 + (k > 0 ? 40 : 0) + offset;
        const fade = k === 0 ? 1 : 1 - ramp(t, b, b + 0.8) * 0.85;
        return (
          <Obj key={k} x={S.x + POST_X} y={S.y + y} z={S.z - (k === 0 ? 0 : 60)} rx={mix(55, 0, stand) + exit * -70} o={fade * (1 - exit)}>
            {k === 0 ? <StorePost /> : <OtherPost seed={k + 3} />}
          </Obj>
        );
      })}
    </>
  );
};

// The AI's public reply launches the details into a private message.
const Plane = () => {
  const t = useT();
  const a = c('comment.plane');
  const b = c('comment.planeLand');
  if (t < a - 0.1 || t > b + 0.05) return null;
  const k = ramp(t, a, b, easeInOut);
  const from = {x: S.x + POST_X - 60, y: S.y + 280, z: S.z + 20};
  const to = {x: S.x + DM.x - 60, y: S.y + 230, z: S.z + 10};
  const arc = Math.sin(k * Math.PI);
  const pop = ramp(t, a - 0.1, a + 0.08);
  return (
    <Obj x={mix(from.x, to.x, k)} y={mix(from.y, to.y, k) - arc * 330} z={mix(from.z, to.z, k) + arc * 300} rz={mix(-20, 20, k)} s={pop * (1 - ramp(t, b - 0.08, b) * 0.6)}>
      <div style={{width: 76, height: 76, borderRadius: 38, background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,106,252,0.45)'}}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round">
          <path d="M3 11.5L21 3l-6.5 18-3.2-7.3L3 11.5z" />
          <path d="M11.3 13.7L21 3" />
        </svg>
      </div>
    </Obj>
  );
};

const SystemLine = ({at, until, children}: {at: number; until: number; children: ReactNode}) => {
  const t = useT();
  const open = ramp(t, at, at + 0.3) * (1 - ramp(t, until, until + 0.3, easeIn));
  if (open <= 0) return null;
  return (
    <Grow p={open}>
      <div style={{textAlign: 'center', fontSize: 16, color: T.muted}}>{children}</div>
    </Grow>
  );
};

// Солонго's DM chat, then (after a swipe) Нараа's lead-capture chat.
const DmChat = () => {
  const swap = c('lead.swap');
  return (
    <>
      <SystemLine at={c('comment.planeLand')} until={swap}>Таны коммент: «Үнэ хэд вэ?»</SystemLine>
      <Typing from={c('comment.typing')} to={c('comment.a')} />
      <Bubble at={c('comment.a')} from="ai" tag="AI агент" maxWidth={320} until={swap}>
        Сайн байна уу, Солонго! Арьсан цүнх 189,000₮. Хар, бор өнгөтэй байгаа.
      </Bubble>
      <Bubble at={c('comment.reply')} from="customer" maxWidth={320} until={swap}>
        Хар өнгийг авъя!
      </Bubble>
      <Bubble at={c('lead.a1')} from="ai" tag="AI агент" maxWidth={320}>Захиалгаа баталгаажуулахын тулд утасны дугаараа үлдээнэ үү?</Bubble>
      <Bubble at={c('lead.phone')} from="customer" maxWidth={320}>9911 2345</Bubble>
      <Typing from={c('lead.typing')} to={c('lead.a2')} />
      <Bubble at={c('lead.a2')} from="ai" tag="AI агент" maxWidth={320}>Баярлалаа! Хүргэлтийн хаягаа бичнэ үү.</Bubble>
      <Bubble at={c('lead.addr')} from="customer" maxWidth={320}>БЗД, 26-р хороо, 15-р байр</Bubble>
      <Typing from={c('lead.typing2')} to={c('lead.a3')} />
      <Bubble at={c('lead.a3')} from="ai" tag="AI агент" maxWidth={320}>Захиалгыг тань бүртгэлээ. Удахгүй холбогдоно!</Bubble>
    </>
  );
};

// One phone for scenes 4 and 5: it slides in beside the post, then travels with the
// camera into the lead-capture layout and dives away to the left at the end.
export const DmPhone = () => {
  const t = useT();
  const enter = spring(t, c('comment.dm'), 1.6, 0.68);
  const travel = ramp(t, c('comment.exit'), c('comment.exit') + 1.05, easeInOut);
  const dive = ramp(t, c('lead.dive'), c('lead.dive') + 0.9, easeIn);
  const x = mix(S.x + DM.x, L.x + DM_LEAD_X, travel) + (1 - enter) * 520 - dive * 1500;
  return (
    <Obj x={x} y={mix(S.y, L.y, travel) + Math.sin(t * 1.1) * 5} z={S.z - (1 - enter) * 300} ry={-8 - (1 - enter) * 35 + dive * 50} o={clamp01(enter * 2) * (1 - dive)}>
      <div style={{position: 'relative'}}>
        <WhoTag />
        <PhoneBody channel="Messenger" width={DM.w} height={DM.h}>
          <DmChat />
        </PhoneBody>
      </div>
    </Obj>
  );
};

// Small tag above the phone naming the customer; it flips when the chat changes hands.
const WhoTag = () => {
  const t = useT();
  const swap = c('lead.swap');
  const flip = ramp(t, swap - 0.1, swap + 0.3, easeInOut);
  const show = ramp(t, c('comment.planeLand'), c('comment.planeLand') + 0.3);
  const second = flip > 0.5;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: -66, display: 'flex', justifyContent: 'center', opacity: show}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 8px', borderRadius: 999, background: '#fff', border: `1px solid ${T.border}`, boxShadow: '0 10px 30px rgba(17,24,39,0.10)', fontSize: 19, fontWeight: 700, transform: `rotateX(${second ? (1 - flip) * 90 : flip * -90}deg)`}}>
        <Initials text={second ? 'НБ' : 'СЭ'} bg={second ? T.brand : '#db2777'} />
        {second ? 'Нараа Б.' : 'Солонго Э.'}
      </div>
    </div>
  );
};

export const CommentSet = () => (
  <>
    <Obj x={S.x - 120} y={S.y - 60} z={S.z - 1000}>
      <Numeral n={4} at={c('comment.caption')} out={c('comment.out')} />
    </Obj>
    <Feed />
    <Obj x={S.x + CAPTION_X} y={S.y - 10} z={S.z} ry={6} preserve>
      <Caption n={4} title="Коммент → мессеж" sub="Коммент бүрд хариулж, дэлгэрэнгүйг мессежээр илгээнэ." at={c('comment.caption')} out={c('comment.out')} />
    </Obj>
    <Plane />
  </>
);
