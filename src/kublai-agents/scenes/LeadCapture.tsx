import {interpolate, useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {Bubble, Check, Panel, Phone, Pill, SceneShell, Stage, Typing, usePop} from '../ui';

export const LEAD_DURATION = 300;

const HOT_AT = 158;

const Field = ({label, value, at}: {label: string; value: string; at: number}) => {
  const frame = useCurrentFrame();
  const filled = frame >= at;
  const flash = interpolate(frame, [at, at + 6, at + 30], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{padding: '14px 16px', borderRadius: 14, background: `rgba(224,237,255,${flash})`}}>
      <div style={{fontSize: 17, color: T.muted}}>{label}</div>
      <div style={{fontSize: 23, fontWeight: filled ? 600 : 400, color: filled ? T.text : T.faint, marginTop: 4}}>{filled ? value : '—'}</div>
    </div>
  );
};

const CustomerPanel = () => {
  const frame = useCurrentFrame();
  const p = usePop(6);
  const hot = frame >= HOT_AT;
  const pulse = interpolate(frame, [HOT_AT, HOT_AT + 8, HOT_AT + 20], [1, 1.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const toast = usePop(206);
  return (
    <div style={{position: 'relative', alignSelf: 'center'}}>
      <Panel style={{width: 500, padding: 26, opacity: p, translate: `${(1 - p) * 40}px 0`}}>
        <div style={{display: 'flex', gap: 24, fontSize: 19, borderBottom: `1px solid ${T.border}`, paddingBottom: 14}}>
          <span style={{fontWeight: 700, color: T.brand}}>Customer</span>
          <span style={{color: T.muted}}>Order</span>
          <span style={{color: T.muted}}>Notes</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 20}}>
          <div style={{width: 56, height: 56, borderRadius: 28, background: T.brandSoft, color: T.brand, fontWeight: 700, fontSize: 21, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>НБ</div>
          <div>
            <div style={{fontSize: 24, fontWeight: 700}}>Нараа Б.</div>
            <div style={{fontSize: 18, color: T.muted}}>Messenger · Sales agent</div>
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '22px 0 8px', fontSize: 19}}>
          <span style={{color: T.muted}}>Lifecycle</span>
          <Pill bg={hot ? T.hotSoft : T.brandSoft} color={hot ? T.hot : T.brand} style={{scale: `${pulse}`}}>{hot ? 'HOT LEAD' : 'NEW LEAD'}</Pill>
        </div>
        <Field label="Утас" value="9911 2345" at={76} />
        <Field label="Хүргэлтийн хаяг" value="БЗД, 26-р хороо, 15-р байр" at={152} />
        <Field label="Сонирхсон бараа" value="Мини цүнх · Хар" at={10} />
      </Panel>
      <div style={{position: 'absolute', left: 26, right: 26, bottom: -34, opacity: toast, translate: `0 ${(1 - toast) * 20}px`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', background: T.text, color: '#fff', borderRadius: 16, padding: '14px 18px', fontSize: 21, fontWeight: 600}}>
          <Check color="#4ade80" /> CRM-д лид хадгалагдлаа
        </div>
      </div>
    </div>
  );
};

export const LeadCapture = () => (
  <SceneShell duration={LEAD_DURATION} n={5} title="Лид цуглуулна" sub="Утас, хаягийг асууж CRM-д автоматаар хадгална.">
    <Stage>
      <Phone width={430} height={860}>
        <Bubble at={18} from="ai" tag="AI агент" maxWidth={320}>Захиалгаа баталгаажуулахын тулд утасны дугаараа үлдээнэ үү?</Bubble>
        <Bubble at={66} from="customer" maxWidth={320}>9911 2345</Bubble>
        <Typing from={82} to={104} />
        <Bubble at={104} from="ai" tag="AI агент" maxWidth={320}>Баярлалаа! Хүргэлтийн хаягаа бичнэ үү.</Bubble>
        <Bubble at={142} from="customer" maxWidth={320}>БЗД, 26-р хороо, 15-р байр</Bubble>
        <Typing from={160} to={186} />
        <Bubble at={186} from="ai" tag="AI агент" maxWidth={320}>Захиалгыг тань бүртгэлээ. Удахгүй холбогдоно!</Bubble>
      </Phone>
      <CustomerPanel />
    </Stage>
  </SceneShell>
);
