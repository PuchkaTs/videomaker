import type {CSSProperties, ReactNode} from 'react';
import {clamp01, easeIn, easeInOut, easeOut, expoOut, hit, mix, ramp, spring, useT} from '../kublai-agents-v2/time';
import {BrushIcon, CalendarIcon, ClockIcon, FlossIcon, QuestionTooth} from './icons';
import {C, COL, FONT, Letters, SILVER, SLANT, Slab} from './kit';
import {OutroLogo} from './logo';

// The reel's one idea: the slanted strokes of the Empire mark become the four tip cards, and at the
// end the four cards fold back into the mark. Text lives in the band y ≈ 1060–1560, over the dark
// scrubs and clear of the face and of the Reels interface at the bottom.

const abs = (style: CSSProperties): CSSProperties => ({position: 'absolute', ...style});

// ---------- 0 – 3.9 s: hook ----------
// Frame 0 is the thumbnail, so the whole hook is already set: a small set-up line, a medium line
// and a huge silver «ҮЗ!». A light sweep crosses «ҮЗ!», then it pulses with the camera punch;
// everything peels off along the brand slant before the question.
export const Hook = () => {
  const t = useT();
  if (t > C.hookOut + 1) return null;
  const pulse = 1 + 0.1 * hit(t, C.hookBar, 0.05, 0.28);
  return (
    <div style={abs({left: 30, right: 30, top: 1040})}>
      <Letters text="ШҮДЭЭ ХАМГААЛАХЫН ТУЛД" out={C.hookOut} size={56} weight={700} tracking={0.05} color={COL.silver} />
      <Letters text="ҮҮНИЙГ ЗААВАЛ" out={C.hookOut + 0.05} size={96} weight={900} style={{marginTop: 10}} />
      <div style={{transform: `scale(${pulse})`, transformOrigin: '50% 40%'}}>
        <Letters text="ҮЗ!" sheenAt={C.hookSheen} out={C.hookOut + 0.1} size={250} weight={900} silver stagger={0.06} tracking={-0.03} style={{marginTop: -6, lineHeight: 0.95}} />
      </div>
    </div>
  );
};

// ---------- 3.9 – 13.3 s: question and answer ----------
export const Question = () => {
  const t = useT();
  if (t < C.faq - 0.1 || t > C.answerOut + 1.2) return null;
  const chip = spring(t, C.faq, 2.4, 0.72);
  const chipOut = ramp(t, C.qOut, C.qOut + 0.35, easeIn);
  const toothIn = spring(t, C.tooth, 1.9, 0.6);
  const toothOut = ramp(t, C.answerOut, C.answerOut + 0.45, easeIn);
  const stamp = spring(t, C.answer, 3.2, 0.48);
  const stampOut = ramp(t, C.answerOut + 0.05, C.answerOut + 0.4, easeIn);
  const line = spring(t, C.answer + 0.12, 2.6, 0.8);
  return (
    <>
      <Slab id="faq" w={430} h={62} fill={COL.navy} edge={COL.ice} r={8} style={abs({left: 64, top: 1060, transform: `translateX(${(1 - chip) * -560 - chipOut * 700}px)`, opacity: clamp01(chip * 3) * (1 - chipOut)})}>
        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 28, fontWeight: 700, letterSpacing: '0.2em', color: COL.ice}}>ТҮГЭЭМЭЛ АСУУЛТ</div>
      </Slab>
      <div style={abs({left: 44, top: 1160, transformOrigin: '50% 60%', transform: `translate(${toothOut * -520}px, ${(1 - toothIn) * 260 - toothOut * 200}px) scale(${0.35 + 0.65 * toothIn}) rotate(${(1 - toothIn) * -30 + toothOut * -25}deg)`, opacity: clamp01(toothIn * 3) * (1 - toothOut)})}>
        <QuestionTooth cavityAt={C.cavity} gumAt={C.gumRed} healAt={C.heal} size={280} />
      </div>
      {/* A pulsing silver "?" holds the space until the question is spoken. */}
      <Letters text="?" at={C.tooth + 0.3} out={C.q1 - 0.3} size={300} weight={900} silver style={abs({left: 380, width: 520, top: 1110, transform: `scale(${1 + 0.04 * Math.sin(t * 5)})`})} />
      <div style={abs({left: 372, width: 660, top: 1180})}>
        <Letters text="Шүд цоорохгүй," at={C.q1} out={C.qOut} size={68} weight={800} align="flex-start" />
        <Letters text="буйл өвчлөхгүй" at={C.q2} out={C.qOut + 0.04} size={68} weight={800} align="flex-start" />
        <Letters text="байж болох уу?" at={C.q2 + 0.4} out={C.qOut + 0.08} size={68} weight={800} align="flex-start" silver />
      </div>
      {t >= C.answer - 0.05 ? (
        <div style={abs({left: 372, width: 660, top: 1190, transformOrigin: '30% 50%', transform: `translateX(${stampOut * 700}px) scale(${1.9 - 0.9 * stamp}) rotate(${-6 + 2 * stamp}deg)`, opacity: clamp01(stamp * 4) * (1 - stampOut)})}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 104, lineHeight: 1, letterSpacing: '-0.02em', backgroundImage: SILVER, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>БҮРЭН</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, lineHeight: 1.05, color: COL.white}}>БОЛОМЖТОЙ</div>
          <Slab id="ans" w={560 * line} h={16} fill={COL.ice} r={5} style={{marginTop: 18}} />
        </div>
      ) : null}
    </>
  );
};

// ---------- 13.4 s – 51.9 s: four bars become four tip cards ----------
const ROW = {y: 1250, w: 210, h: 160, gap: 10};
const rowX = (i: number) => (1080 - (4 * ROW.w + 3 * ROW.gap)) / 2 + i * (ROW.w + ROW.gap);
// Cards lean less than the bars (100 px over their height) so the numeral and icon stay inside.
const CARD = {x: 40, y: 1110, w: 1000, h: 330, lean: 100};
const TIPS = [C.tip1, C.tip2, C.tip3, C.tip4];
const tipEnd = (n: number) => (n < 3 ? TIPS[n + 1] : C.outro);

// A small slanted chip used for the facts inside a card.
const Pill = ({id, text, at, out, size = 32, accent = false}: {id: string; text: string; at: number; out?: number; size?: number; accent?: boolean}) => {
  const t = useT();
  const k = spring(t, at, 2.8, 0.62);
  const o = out === undefined ? 0 : ramp(t, out, out + 0.3, easeIn);
  if (k <= 0.001 || o >= 1) return null;
  const h = size * 1.75;
  const w = 36 + [...text].length * size * 0.6 + h * SLANT;
  return (
    <Slab id={id} w={w} h={h} fill={accent ? COL.ice : COL.navy2} edge={accent ? undefined : COL.ice} r={8} style={{transformOrigin: '0 50%', transform: `translateX(${(1 - k) * 120 + o * -80}px) scale(${0.6 + 0.4 * k})`, opacity: clamp01(k * 3) * (1 - o), flexShrink: 0}}>
      <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: h * SLANT * 0.3, fontFamily: FONT, fontSize: size, fontWeight: 700, color: accent ? COL.navy : COL.white, whiteSpace: 'nowrap'}}>{text}</div>
    </Slab>
  );
};

const Row = ({children, style}: {children: ReactNode; style?: CSSProperties}) => <div style={{display: 'flex', gap: 14, alignItems: 'center', marginTop: 18, ...style}}>{children}</div>;

const TipBody = ({n}: {n: number}) => {
  if (n === 0)
    return (
      <>
        <Letters text="Шүдээ угаах" at={C.tip1Title} size={64} align="flex-start" />
        <div style={{position: 'relative', height: 64, marginTop: 18}}>
          <div style={abs({left: 0, top: 0})}>
            <Pill id="t1r" text="«2 × 2» дүрэм" at={C.rule} out={C.minutes - 0.15} size={34} accent />
          </div>
          <Row style={abs({left: 0, top: 0, marginTop: 0})}>
            <Pill id="t1m" text="2 минут" at={C.minutes} />
            <Pill id="t1d" text="Өдөрт 2 удаа" at={C.daily} />
          </Row>
        </div>
        <Row>
          <Letters text="+ Буйлны орчмыг сайн цэвэрлэ" at={C.gums} size={34} weight={600} color={COL.ice} align="flex-start" stagger={0.014} />
        </Row>
      </>
    );
  if (n === 1)
    return (
      <>
        <Letters text="Шүдний утас" at={C.tip2Title} size={64} align="flex-start" />
        <Row>
          <Pill id="t2" text="Өдөр бүр хэрэглэ" at={C.floss} accent />
        </Row>
      </>
    );
  if (n === 2)
    return (
      <>
        <Letters text="Ойр ойрхон идэхгүй байх" at={C.tip3Title} size={56} align="flex-start" stagger={0.018} />
        <Row>
          <Pill id="t3a" text="Хүчил ↑" at={C.acid} />
          <Pill id="t3b" text="Цоорох эрсдэл ↑" at={C.risk} accent />
        </Row>
      </>
    );
  return (
    <>
      <Letters text="Өвдөхөөс өмнө үзүүл" at={C.tip4Title} size={58} align="flex-start" stagger={0.018} />
      {/* Too long for a pill inside the card; it runs as a text line instead. */}
      <Row>
        <Letters text="Урьдчилан сэргийлэх үзлэг" at={C.checkup} size={36} weight={700} color={COL.ice} align="flex-start" stagger={0.014} />
      </Row>
    </>
  );
};

const TipIcon = ({n}: {n: number}) =>
  n === 0 ? <BrushIcon gumsAt={C.gums} /> : n === 1 ? <FlossIcon /> : n === 2 ? <ClockIcon at={C.tip3Title} /> : <CalendarIcon dayAt={C.checkup} tickAt={C.prevent} />;

// Card n: tip 1 grows out of its bar in the row; later cards slide in from the right as a bar and
// open up, while the previous card is thrown off to the left along the slant.
const TipCard = ({n}: {n: number}) => {
  const t = useT();
  const start = TIPS[n];
  const end = tipEnd(n);
  if (t < start - 0.05 || t > end + 0.6) return null;
  // Later cards wait 0.15 s so the previous card is mostly gone before the next one opens.
  const delay = n === 0 ? 0 : 0.15;
  const m = ramp(t, start + delay, start + delay + 0.6, expoOut);
  const from = n === 0 ? {x: rowX(0), y: ROW.y} : {x: 1180, y: ROW.y};
  const x = mix(from.x, CARD.x, m);
  const y = mix(from.y, CARD.y, m);
  const w = mix(ROW.w, CARD.w, m);
  const h = mix(ROW.h, CARD.h, m);
  const out = ramp(t, end - 0.12, end + 0.3, easeIn);
  const content = ramp(t, start + 0.3, start + 0.65, easeOut);
  const bob = Math.sin((t - start) * 1.3) * 5;
  return (
    <div style={abs({left: x - out * 1250, top: y + bob - out * 120, opacity: 1 - out * 0.9})}>
      <Slab id={`card${n}`} w={w} h={h} lean={mix(ROW.h * SLANT, CARD.lean, m)} fill="rgba(14,18,36,0.86)" edge="rgba(201,207,217,0.55)" r={16}>
        {/* The numeral starts centred in the bar and slides to the card's left end, so the bar visibly becomes the card. */}
        <div style={abs({left: mix(0, 92, m), top: 0, width: mix(ROW.w, 150, m), height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: mix(112, 190, m), lineHeight: 1, backgroundImage: SILVER, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'})}>{n + 1}</div>
        <div style={abs({left: 246, top: (CARD.h - 240) / 2, opacity: content, transform: `translateY(${(1 - content) * 40}px)`})}>
          <TipIcon n={n} />
        </div>
        <div style={abs({left: 490, top: 50, width: 440, opacity: content})}>
          <TipBody n={n} />
        </div>
      </Slab>
    </div>
  );
};

// The four numbered bars, shown after «дөрвөн» and dispersed when tip 1 opens.
const FourBars = () => {
  const t = useT();
  if (t < C.fourWord - 0.05 || t > C.tip1 + 1.2) return null;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const k = spring(t, C.fourWord + i * 0.09, 2.2, 0.62);
        // Bar 1 is replaced by card 1 in place; bars 2–4 scatter right.
        if (i === 0 && t >= C.tip1) return null;
        const away = i === 0 ? 0 : ramp(t, C.tip1 + (i - 1) * 0.06, C.tip1 + 0.45 + (i - 1) * 0.06, easeIn);
        return (
          <div key={i} style={abs({left: rowX(i) + away * 900, top: ROW.y + (1 - k) * 320 - away * 160, transform: `scale(${1 + (1 - k) * 1.6}) rotate(${(1 - k) * 12}deg)`, opacity: clamp01(k * 3) * (1 - away)})}>
            <Slab id={`bar${i}`} w={ROW.w} h={ROW.h} fill="rgba(14,18,36,0.86)" edge="rgba(201,207,217,0.55)" r={16}>
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 112, lineHeight: 1, backgroundImage: SILVER, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>{i + 1}</div>
            </Slab>
          </div>
        );
      })}
    </>
  );
};

// Progress: four small slants above the card; the active tip glows ice blue. At the end they fly
// to the centre and become the Empire mark.
const PROG = {x: 64, y: 1068, w: 58, h: 18, gap: 12};
const Progress = () => {
  const t = useT();
  if (t < C.tip1 + 0.3 || t > C.merge + 0.6) return null;
  const inK = ramp(t, C.tip1 + 0.3, C.tip1 + 0.7, easeOut);
  const current = TIPS.filter((s) => t >= s).length - 1;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const x0 = PROG.x + i * (PROG.w + PROG.gap);
        // Each bar accelerates into the centre of the mark, swelling mid-flight and shrinking as it
        // arrives, just as the mark snaps together there.
        const f = ramp(t, C.merge - 0.1 + i * 0.05, C.merge + 0.32 + i * 0.05, easeIn);
        const fill = f > 0 ? 'rgba(235,239,245,0.95)' : i === current && t < C.outro ? COL.ice : i <= current ? 'rgba(201,207,217,0.6)' : 'rgba(26,34,68,0.9)';
        return (
          <div key={i} style={abs({left: mix(x0, 540 - PROG.w / 2, f), top: mix(PROG.y, 1150, f), transform: `translateY(${(1 - inK) * -30}px) scale(${1 + Math.sin(f * Math.PI) * 2.2 - f * 0.6}) rotate(${f * (i % 2 ? 24 : -24)}deg)`, opacity: inK * (1 - ramp(f, 0.75, 1))})}>
            <Slab id={`prog${i}`} w={PROG.w} h={PROG.h} fill={fill} r={4} />
          </div>
        );
      })}
    </>
  );
};

export const Tips = () => {
  const t = useT();
  const title = spring(t, C.four, 2.2, 0.7);
  const titleOut = ramp(t, C.tip1 - 0.1, C.tip1 + 0.25, easeIn);
  return (
    <>
      {t > C.four - 0.1 && t < C.tip1 + 0.6 ? (
        <div style={abs({left: 0, right: 0, top: 1080, opacity: clamp01(title * 3) * (1 - titleOut), transform: `translateY(${(1 - title) * 60 - titleOut * 80}px)`})}>
          <Letters text="Мөрдөх 4 зүйл" at={C.four} size={84} weight={900} />
        </div>
      ) : null}
      <FourBars />
      {[0, 1, 2, 3].map((n) => (
        <TipCard key={n} n={n} />
      ))}
      <Progress />
    </>
  );
};

// ---------- 51.9 – 60.16 s: the bars fold into the mark, then the lockup ----------
export const Outro = () => {
  const t = useT();
  if (t < C.outro) return null;
  const panel = spring(t, C.panel, 1.6, 0.85);
  const down = ramp(t, C.panel, C.panel + 0.7, easeInOut);
  return (
    <>
      <div style={abs({left: 0, right: 0, top: 940 + (1 - panel) * 1100, height: 1100, clipPath: 'polygon(0 130px, 100% 0, 100% 100%, 0 100%)', background: 'linear-gradient(180deg, rgba(14,18,36,0.9) 0%, rgba(10,13,26,0.97) 60%)'})} />
      <svg width={1080} height={200} style={abs({left: 0, top: 940 + (1 - panel) * 1100})}>
        <line x1={0} y1={130} x2={1080} y2={0} stroke="url(#panel-edge)" strokeWidth={3} />
        <defs>
          <linearGradient id="panel-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <OutroLogo markIn={C.merge + 0.3} lockupAt={C.panel} sheenAt={C.sheen} top={mix(1010, 1050, down)} height={470} />
      <div style={abs({left: 30, right: 30, top: mix(1330, 1560, down), transform: `scale(${1 - 0.2 * down})`})}>
        <Letters text="Цоорол, буйлны өвчнөөс" at={C.slogan} size={56} weight={800} stagger={0.016} />
        <Letters text="урьдчилан сэргийлье" at={C.slogan + 0.35} size={56} weight={800} silver stagger={0.016} />
      </div>
    </>
  );
};
