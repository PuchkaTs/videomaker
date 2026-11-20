import {T} from '../theme';
import {Bubble, Check, Panel, Phone, SceneShell, Stage, Typing, usePop} from '../ui';

export const AI_REPLY_DURATION = 240;

const ReplyTime = ({at}: {at: number}) => {
  const p = usePop(at);
  return (
    <Panel style={{padding: '24px 28px', opacity: p, translate: `${(1 - p) * -30}px 0`, alignSelf: 'center', width: 300}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, color: T.green, fontSize: 22, fontWeight: 700}}>
        <Check /> Хариулсан
      </div>
      <div style={{fontSize: 72, fontWeight: 700, marginTop: 8}}>2 сек</div>
      <div style={{fontSize: 20, color: T.muted, marginTop: 4}}>Шөнийн 23:48 цагт</div>
    </Panel>
  );
};

export const AiReply = () => (
  <SceneShell duration={AI_REPLY_DURATION} n={1} title="AI шууд хариулна" sub="Өдөр шөнөгүй, хэдхэн секундэд.">
    <Stage>
      <Phone>
        <Bubble at={20} from="customer">Сайн байна уу! Улаанбаатар дотор хүргэлт хэд вэ?</Bubble>
        <Typing from={38} to={70} />
        <Bubble at={70} from="ai" tag="AI агент">Сайн байна уу! УБ дотор хүргэлт 5,000₮, 24 цагийн дотор хүргэнэ.</Bubble>
        <Bubble at={140} from="customer">Маргааш авч болох уу?</Bubble>
        <Typing from={155} to={180} />
        <Bubble at={180} from="ai" tag="AI агент">Тийм ээ! Өнөөдөр 18:00-оос өмнө захиалбал маргааш хүргэнэ.</Bubble>
      </Phone>
      <ReplyTime at={85} />
    </Stage>
  </SceneShell>
);
