import type {ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../theme';
import {Bubble, Logo, Panel, Phone, ProductArt, SceneShell, Sparkle, Stage, Typing, usePop} from '../ui';

export const COMMENT_DURATION = 270;

const Comment = ({at, name, avatar, children, ai = false, indent = false}: {at: number; name: string; avatar: ReactNode; children: ReactNode; ai?: boolean; indent?: boolean}) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  if (frame < at) return null;
  return (
    <div style={{display: 'flex', gap: 12, marginLeft: indent ? 56 : 0, opacity: p, translate: `0 ${(1 - p) * 14}px`}}>
      {avatar}
      <div>
        <div style={{background: T.bubble, borderRadius: 20, padding: '10px 16px'}}>
          <div style={{fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8}}>
            {name}
            {ai ? <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15, color: T.brand}}><Sparkle size={13} /> AI</span> : null}
          </div>
          <div style={{fontSize: 20, marginTop: 2}}>{children}</div>
        </div>
        <div style={{fontSize: 15, color: T.muted, margin: '4px 0 0 14px'}}>Саяхан · Like · Reply</div>
      </div>
    </div>
  );
};

const Initials = ({text, bg}: {text: string; bg: string}) => (
  <div style={{width: 44, height: 44, borderRadius: 22, background: bg, color: '#fff', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{text}</div>
);

const Post = () => {
  const p = usePop(0);
  return (
    <Panel style={{width: 560, overflow: 'hidden', opacity: p, translate: `0 ${(1 - p) * 50}px`, flexShrink: 0}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px'}}>
        <Logo size={44} />
        <div>
          <div style={{fontSize: 20, fontWeight: 700}}>KublAi Store</div>
          <div style={{fontSize: 16, color: T.muted}}>Facebook · 2 цагийн өмнө</div>
        </div>
      </div>
      <div style={{fontSize: 20, padding: '0 20px 14px'}}>Шинэ улирлын арьсан цүнх ирлээ!</div>
      <ProductArt tone="#1f2937" height={250} />
      <div style={{padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 14}}>
        <Comment at={28} name="Солонго Э." avatar={<Initials text="СЭ" bg="#db2777" />}>Үнэ хэд вэ?</Comment>
        <Comment at={78} name="KublAi Store" avatar={<Logo size={44} />} ai indent>
          Сайн байна уу! Дэлгэрэнгүйг мессежээр илгээлээ.
        </Comment>
      </div>
    </Panel>
  );
};

export const CommentToDm = () => (
  <SceneShell duration={COMMENT_DURATION} n={4} title="Коммент → мессеж" sub="Коммент бүрд хариулж, дэлгэрэнгүйг мессежээр илгээнэ.">
    <Stage style={{gap: 40}}>
      <Post />
      <Phone enterAt={96} width={420} height={820}>
        <div style={{alignSelf: 'center', fontSize: 16, color: T.muted, marginBottom: 4}}>Таны коммент: «Үнэ хэд вэ?»</div>
        <Typing from={110} to={128} />
        <Bubble at={128} from="ai" tag="AI агент" maxWidth={320}>Сайн байна уу, Солонго! Арьсан цүнх 189,000₮. Хар, бор өнгөтэй байгаа.</Bubble>
        <Bubble at={190} from="customer" maxWidth={320}>Хар өнгийг авъя!</Bubble>
      </Phone>
    </Stage>
  </SceneShell>
);
