import type {ReactNode} from 'react';
import {T} from '../../kublai-agents/theme';
import {Check, Pill} from '../../kublai-agents/ui';
import {CAPTION_X, SET, c} from '../layout';
import {Caption, Numeral} from '../type';
import {stampIn} from '../ui';
import {clamp01, easeIn, easeInOut, hit, lin, mix, ramp, spring, useT} from '../time';
import {Obj} from '../world';
import {DM_LEAD_X} from './Comment';

const L = SET.lead;
const PANEL = {x: 520, w: 500};
// Field centres relative to the panel centre (measured from the panel layout below).
const FIELD_Y = {phone: 3, addr: 91};
const FIELD_X = -120;
// Customer bubbles in the phone, relative to the phone centre, at the moment they fly.
const BUBBLE = {phone: {x: 113, y: 276}, addr: {x: 28, y: 276}};

// One row of the CRM card: flies in from the front-right and lands in place.
const Piece = ({i, children}: {i: number; children: ReactNode}) => {
  const t = useT();
  const p = spring(t, c('lead.crm') + i * 0.07, 2.0, 0.64);
  return <div style={{opacity: clamp01(p * 2), transform: `translate3d(${(1 - p) * 260}px, ${(1 - p) * 30}px, ${(1 - p) * 420}px) rotateY(${(1 - p) * -40}deg)`}}>{children}</div>;
};

const Field = ({label, value, at}: {label: string; value: string; at: number}) => {
  const t = useT();
  const chars = Math.floor(lin(t, at, at + 0.3) * value.length);
  const flash = hit(t, at, 0.03, 0.5);
  return (
    <div style={{padding: '14px 16px', borderRadius: 14, background: `rgba(224,237,255,${flash})`, boxShadow: flash > 0.05 ? `inset 0 0 0 2px rgba(0,106,252,${flash})` : undefined}}>
      <div style={{fontSize: 17, color: T.muted}}>{label}</div>
      <div style={{fontSize: 23, fontWeight: chars > 0 ? 600 : 400, color: chars > 0 ? T.text : T.faint, marginTop: 4, height: 32}}>{chars > 0 ? value.slice(0, chars) : '—'}</div>
    </div>
  );
};

const Lifecycle = () => {
  const t = useT();
  const at = c('lead.hot');
  const hot = t >= at;
  const st = stampIn(t, at);
  return (
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '22px 0 8px', fontSize: 19}}>
      <span style={{color: T.muted}}>Lifecycle</span>
      <div style={{scale: `${hot ? st.s : 1}`}}>
        <Pill bg={hot ? T.hotSoft : T.brandSoft} color={hot ? T.hot : T.brand} style={{boxShadow: hot ? `0 0 ${hit(t, at, 0.03, 0.6) * 40}px rgba(234,88,12,0.7)` : undefined}}>
          {hot ? 'HOT LEAD' : 'NEW LEAD'}
        </Pill>
      </div>
    </div>
  );
};

const CrmPanel = () => {
  const t = useT();
  const base = spring(t, c('lead.crm'), 1.8, 0.7);
  const dive = ramp(t, c('lead.dive'), c('lead.dive') + 0.9, easeIn);
  const toast = spring(t, c('lead.toast'), 2.0, 0.6);
  return (
    <Obj x={L.x + PANEL.x + dive * 1500} y={L.y} z={L.z} ry={-6 - dive * 50} preserve o={clamp01(base * 3) * (1 - dive)}>
      <div style={{position: 'relative', transformStyle: 'preserve-3d', fontFamily: T.font, color: T.text}}>
        <div style={{width: PANEL.w, padding: 26, boxSizing: 'border-box', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, boxShadow: '0 40px 90px rgba(17,24,39,0.14)', scale: `${0.9 + 0.1 * base}`, transformStyle: 'preserve-3d'}}>
          <Piece i={0}>
            <div style={{display: 'flex', gap: 24, fontSize: 19, borderBottom: `1px solid ${T.border}`, paddingBottom: 14}}>
              <span style={{fontWeight: 700, color: T.brand}}>Customer</span>
              <span style={{color: T.muted}}>Order</span>
              <span style={{color: T.muted}}>Notes</span>
            </div>
          </Piece>
          <Piece i={1}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 20}}>
              <div style={{width: 56, height: 56, borderRadius: 28, background: T.brandSoft, color: T.brand, fontWeight: 700, fontSize: 21, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>НБ</div>
              <div>
                <div style={{fontSize: 24, fontWeight: 700}}>Нараа Б.</div>
                <div style={{fontSize: 18, color: T.muted}}>Messenger · Sales agent</div>
              </div>
            </div>
          </Piece>
          <Piece i={2}>
            <Lifecycle />
          </Piece>
          <Piece i={3}>
            <Field label="Утас" value="9911 2345" at={c('lead.fill1')} />
          </Piece>
          <Piece i={4}>
            <Field label="Хүргэлтийн хаяг" value="БЗД, 26-р хороо, 15-р байр" at={c('lead.fill2')} />
          </Piece>
          <Piece i={5}>
            <Field label="Сонирхсон бараа" value="Мини цүнх · Хар" at={c('lead.crm') + 0.7} />
          </Piece>
        </div>
        {toast > 0 ? (
          <div style={{position: 'absolute', left: 26, right: 26, bottom: -40, opacity: clamp01(toast * 2), transform: `translate3d(0, ${(1 - toast) * 60}px, ${30 + (1 - toast) * 120}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', background: T.text, color: '#fff', borderRadius: 16, padding: '14px 18px', fontSize: 21, fontWeight: 600, boxShadow: '0 20px 40px rgba(17,24,39,0.3)'}}>
              <Check color="#4ade80" /> CRM-д лид хадгалагдлаа
            </div>
          </div>
        ) : null}
      </div>
    </Obj>
  );
};

// A value lifts out of the customer's bubble and arcs into its CRM field.
const DataFlight = ({at, land, text, from, toY}: {at: number; land: number; text: string; from: {x: number; y: number}; toY: number}) => {
  const t = useT();
  if (t < at - 0.05 || t > land + 0.02) return null;
  const k = ramp(t, at, land, easeInOut);
  const a = {x: L.x + DM_LEAD_X + from.x, y: L.y + from.y, z: L.z + 8};
  const b = {x: L.x + PANEL.x + FIELD_X, y: L.y + toY, z: L.z + 8};
  const arc = Math.sin(k * Math.PI);
  return (
    <Obj x={mix(a.x, b.x, k)} y={mix(a.y, b.y, k) - arc * 200} z={mix(a.z, b.z, k) + arc * 320} rz={arc * -6} s={1 + arc * 0.15} o={ramp(t, at - 0.05, at + 0.05)}>
      <div style={{padding: '10px 18px', borderRadius: 18, background: T.brand, color: '#fff', fontSize: 22, fontWeight: 600, fontFamily: T.font, whiteSpace: 'nowrap', boxShadow: `0 ${20 * arc}px ${40 * arc}px rgba(0,106,252,0.45)`}}>{text}</div>
    </Obj>
  );
};

// Orange shock ring when the lead turns hot.
const HotRing = () => {
  const t = useT();
  const k = lin(t, c('lead.hot'), c('lead.hot') + 0.6);
  if (k <= 0 || k >= 1) return null;
  return (
    <Obj x={L.x + PANEL.x + 160} y={L.y - 86} z={L.z + 20} s={0.5 + k * 2.2} o={1 - k}>
      <div style={{width: 170, height: 60, borderRadius: 30, border: '4px solid #f97316'}} />
    </Obj>
  );
};

export const LeadSet = () => (
  <>
    <Obj x={L.x - 120} y={L.y - 60} z={L.z - 1000}>
      <Numeral n={5} at={c('lead.caption')} out={c('lead.out')} />
    </Obj>
    <Obj x={L.x + CAPTION_X} y={L.y - 10} z={L.z} ry={6} preserve>
      <Caption n={5} title="Лид цуглуулна" sub="Утас, хаягийг асууж CRM-д автоматаар хадгална." at={c('lead.caption')} out={c('lead.out')} width={560} />
    </Obj>
    <CrmPanel />
    <HotRing />
    <DataFlight at={c('lead.fly1')} land={c('lead.fill1')} text="9911 2345" from={BUBBLE.phone} toY={FIELD_Y.phone} />
    <DataFlight at={c('lead.fly2')} land={c('lead.fill2')} text="БЗД, 26-р хороо, 15-р байр" from={BUBBLE.addr} toY={FIELD_Y.addr} />
  </>
);

