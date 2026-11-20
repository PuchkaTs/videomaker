import {useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {Bubble, CardButton, Check, Panel, Phone, SceneShell, Stage, Tap, Typing, usePop} from '../ui';

export const APPOINTMENT_DURATION = 270;

const SLOTS = ['10:00', '11:30', '14:00', 'Өөр өдөр'];

const TimeChips = ({at, pickAt}: {at: number; pickAt: number}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  if (frame < at) return null;
  return (
    <div style={{flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 10, opacity: p, translate: `0 ${(1 - p) * 16}px`}}>
      {SLOTS.map((s) => {
        const picked = s === '11:30' && frame >= pickAt;
        return (
          <div key={s} style={{padding: '12px 22px', borderRadius: 999, border: `2px solid ${picked ? T.brand : T.border}`, background: picked ? T.brand : '#fff', color: picked ? '#fff' : T.brand, fontSize: 21, fontWeight: 600}}>
            {s}
          </div>
        );
      })}
    </div>
  );
};

const Confirmed = ({at}: {at: number}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  if (frame < at) return null;
  return (
    <div style={{flexShrink: 0, alignSelf: 'flex-start', width: 340, borderRadius: 22, border: `1px solid ${T.border}`, overflow: 'hidden', background: '#fff', opacity: p, scale: `${0.92 + p * 0.08}`, transformOrigin: 'left bottom'}}>
      <div style={{padding: '16px 20px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700}}>
          <Check /> Таны цаг баталгаажлаа
        </div>
        <div style={{fontSize: 19, color: T.muted, marginTop: 6}}>Бямба, 10/24 · 11:30 · KublAi Store</div>
      </div>
      <CardButton>Цаг өөрчлөх</CardButton>
      <CardButton>Цуцлах</CardButton>
    </div>
  );
};

const CalendarCard = ({at}: {at: number}) => {
  const p = usePop(at);
  return (
    <Panel style={{width: 320, padding: 24, opacity: p, translate: `${(1 - p) * -30}px 0`, alignSelf: 'center'}}>
      <div style={{fontSize: 20, color: T.muted, fontWeight: 700, letterSpacing: 1}}>ЦАГ ЗАХИАЛГА</div>
      <div style={{marginTop: 16, borderRadius: 14, background: T.brandSoft, borderLeft: `6px solid ${T.brand}`, padding: '14px 16px'}}>
        <div style={{fontSize: 22, fontWeight: 700}}>11:30 – 12:00</div>
        <div style={{fontSize: 19, color: T.muted, marginTop: 4}}>Дэлгүүрт ирж үзэх · Нараа Б.</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 19, color: T.green, fontWeight: 600}}>
        <Check size={18} /> Хуанлид нэмэгдлээ
      </div>
    </Panel>
  );
};

export const Appointment = () => (
  <SceneShell duration={APPOINTMENT_DURATION} n={3} title="Цаг захиалга" sub="Сул цагийг санал болгож, баталгаажуулна.">
    <Stage>
      <div style={{position: 'relative'}}>
        <Phone>
          <Bubble at={20} from="customer">Бямба гарагт дэлгүүрт ирж үзэх цаг авч болох уу?</Bubble>
          <Typing from={38} to={68} />
          <Bubble at={68} from="ai" tag="AI агент">Мэдээж! Бямба, 10/24-нд сул цагууд:</Bubble>
          <TimeChips at={84} pickAt={146} />
          <Bubble at={160} from="customer">11:30</Bubble>
          <Confirmed at={192} />
        </Phone>
        <Tap at={142} x={192} y={702} />
      </div>
      <CalendarCard at={212} />
    </Stage>
  </SceneShell>
);
