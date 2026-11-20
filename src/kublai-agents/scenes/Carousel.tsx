import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {T} from '../theme';
import {Bubble, CardButton, Phone, ProductArt, SceneShell, Stage, Tap, Typing, usePop} from '../ui';

export const CAROUSEL_DURATION = 270;

export const PRODUCTS = [
  {name: 'Арьсан цүнх', detail: 'Хар · Бэлэн байгаа', price: '189,000₮', tone: '#1f2937', kind: 'bag' as const},
  {name: 'Мини цүнх', detail: 'Хар · Бэлэн байгаа', price: '129,000₮', tone: '#374151', kind: 'bag' as const},
  {name: 'Түрийвч', detail: 'Хар · Бэлэн байгаа', price: '59,000₮', tone: '#111827', kind: 'wallet' as const},
];

const CARD = 280;
const GAP = 14;

const ProductCarousel = ({at, swipeAt, pickAt}: {at: number; swipeAt: number; pickAt: number}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  if (frame < at) return null;
  const x = interpolate(frame, [swipeAt, swipeAt + 30], [0, -(CARD + GAP)], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return (
    <div style={{flexShrink: 0, opacity: p, translate: `${(1 - p) * 40}px 0`, marginLeft: -4, marginRight: -18, overflow: 'hidden'}}>
      <div style={{display: 'flex', gap: GAP, translate: `${x}px 0`}}>
        {PRODUCTS.map((prod, i) => (
          <div key={prod.name} style={{width: CARD, flexShrink: 0, borderRadius: 22, border: `1px solid ${T.border}`, overflow: 'hidden', background: '#fff'}}>
            <ProductArt tone={prod.tone} kind={prod.kind} height={190} />
            <div style={{padding: '14px 18px'}}>
              <div style={{fontSize: 22, fontWeight: 700}}>{prod.name}</div>
              <div style={{fontSize: 18, color: T.muted, marginTop: 2}}>{prod.detail}</div>
              <div style={{fontSize: 22, fontWeight: 700, marginTop: 6}}>{prod.price}</div>
            </div>
            <CardButton active={i === 1 && frame >= pickAt}>Захиалах</CardButton>
            <CardButton>Дэлгэрэнгүй</CardButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Carousel = () => (
  <SceneShell duration={CAROUSEL_DURATION} n={2} title="Бүтээгдэхүүний карусель" sub="Каталогоос зураг, үнэтэй нь харуулна.">
    <Stage>
      <div style={{position: 'relative'}}>
        <Phone channel="Instagram">
          <Bubble at={20} from="customer">Хар өнгийн цүнх байна уу?</Bubble>
          <Typing from={36} to={66} />
          <Bubble at={66} from="ai" tag="AI агент">Тийм ээ, эдгээрээс сонгоорой:</Bubble>
          <ProductCarousel at={82} swipeAt={140} pickAt={196} />
          <Bubble at={214} from="customer">Мини цүнхийг авъя!</Bubble>
        </Phone>
        <Tap at={192} x={162} y={706} />
      </div>
    </Stage>
  </SceneShell>
);
