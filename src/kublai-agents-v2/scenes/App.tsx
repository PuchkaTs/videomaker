import type {CSSProperties, ReactNode} from 'react';
import {T} from '../../kublai-agents/theme';
import {Check, Logo, Pill, Sparkle} from '../../kublai-agents/ui';
import {CAPTION_X, SET, c} from '../layout';
import {Caption, Numeral} from '../type';
import {Bubble, Cursor, Grow, Typing, stampIn} from '../ui';
import {clamp01, easeIn, easeInOut, easeOut, hit, lin, mix, ramp, rand, spring, track, useT} from '../time';
import {Obj} from '../world';

const A = SET.app;
// Window centre, size and the content grid inside it (relative to the window centre).
const W = {x: A.x + 340, y: A.y, z: A.z, w: 1060, h: 840};
const CONTENT_LEFT = -440;
const CONTENT_W = 944;
const ROW_TOP = -246;
const ROW_H = 600;
const GAP = 18;
const SIDE_TEST = 300;
const SIDE_FIX = 380;

const QUESTION = 'Танайх ямар цүнхтэй вэ?';
const FIX_Q = 'Дархан руу хүргэлт хэд вэ?';
const FIX_TEXT = 'Дархан руу хүргэлт 15,000₮, УБ дотор 5,000₮.';

const typed = (t: number, text: string, a: number, b: number) => text.slice(0, Math.floor(lin(t, a, b) * text.length));

// How far the editor has opened (0 → 1): drives the chat width morph and the 2.5D split.
const editorOpen = (t: number) => ramp(t, c('fix.editor'), c('fix.editor') + 0.6, easeInOut) * (1 - ramp(t, c('fix.out') + 0.2, c('fix.out') + 0.8));
const sideW = (t: number) => mix(SIDE_TEST, SIDE_FIX, editorOpen(t));
const chatW = (t: number) => CONTENT_W - GAP - sideW(t);
// Panels separate in depth while the editor works, and close up again for the re-test.
const split = (t: number) => ramp(t, c('fix.editor'), c('fix.editor') + 0.8, easeInOut) * (1 - ramp(t, c('fix.apply') + 0.6, c('fix.apply') + 1.4, easeInOut));

// Starts as the camera dives, so the window is the target of the move rather than appearing after it.
const windowIn = (t: number) => spring(t, c('lead.dive') + 0.25, 1.2, 0.75);
const windowOut = (t: number) => ramp(t, c('fix.pullback') + 0.3, c('fix.pullback') + 1.3, easeIn);

const Shell = () => {
  const t = useT();
  const p = windowIn(t);
  const out = windowOut(t);
  const title = t < c('fix.caption') ? 'Test agent' : 'Test agent · Agent editor';
  return (
    <Obj x={W.x} y={W.y + (1 - p) * 140} z={W.z - (1 - p) * 900} rx={(1 - p) * 22} s={1 - out * 0.2} o={clamp01(p * 2) * (1 - out)}>
      <div style={{width: W.w, height: W.h, borderRadius: 24, background: T.bg, border: `1px solid ${T.border}`, boxShadow: '0 60px 120px rgba(17,24,39,0.18)', overflow: 'hidden', fontFamily: T.font, color: T.text, position: 'relative'}}>
        <div style={{height: 60, background: '#fff', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px'}}>
          <Logo size={32} />
          <div style={{fontSize: 21, fontWeight: 700}}>KublAi</div>
          <div style={{flex: 1, display: 'flex', justifyContent: 'center', gap: 28, fontSize: 18}}>
            {['Agents', 'Notes', 'Projects', 'ERP'].map((l) => (
              <span key={l} style={{color: l === 'Agents' ? T.brand : T.muted, fontWeight: l === 'Agents' ? 700 : 400}}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, top: 60, bottom: 0, width: 64, background: '#fff', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, paddingTop: 20}}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{width: 34, height: 34, borderRadius: 10, background: i === 2 ? T.brand : T.bubble}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 64 + 26, top: 60 + 26}}>
          <div style={{fontSize: 34, fontWeight: 700}}>{title}</div>
          <div style={{fontSize: 18, color: T.muted, marginTop: 4}}>Хадгалсан мэдлэг, хэрэгслээр хэрэглэгчийн яриаг туршина.</div>
        </div>
        <div style={{position: 'absolute', left: 64 + 26, bottom: 26, fontSize: 16, color: T.muted}}>Хувийн тест. Захиалга, цаг захиалга дуурайлган хийгдэнэ — хэрэглэгчид юу ч илгээгдэхгүй.</div>
      </div>
    </Obj>
  );
};

// Positions a content panel in the window's grid, with optional extra depth.
const Slot = ({left, width, dz = 0, o = 1, dx = 0, children}: {left: number; width: number; dz?: number; o?: number; dx?: number; children: ReactNode}) => {
  const t = useT();
  const p = windowIn(t);
  const out = windowOut(t);
  const s = 1 - out * 0.2;
  return (
    <Obj x={W.x + (left + width / 2 + dx) * s} y={W.y + (ROW_TOP + ROW_H / 2) * s + (1 - p) * 140} z={W.z - (1 - p) * 900 + dz + 1} rx={(1 - p) * 22} s={s} o={clamp01(p * 2) * (1 - out) * o}>
      <div style={{position: 'relative', width, height: ROW_H, fontFamily: T.font, color: T.text}}>{children}</div>
    </Obj>
  );
};

const PanelBox = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div style={{position: 'absolute', inset: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style}}>{children}</div>
);

const SendButton = ({press, ready}: {press: number; ready: boolean}) => (
  <div style={{width: 40, height: 40, borderRadius: 20, background: ready ? T.brand : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: `${1 - press * 0.15}`, flexShrink: 0}}>
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  </div>
);

const Composer = ({text, placeholder, focus, press, height = 56, fontSize = 20}: {text: string; placeholder: string; focus: number; press: number; height?: number; fontSize?: number}) => {
  const t = useT();
  const caret = text && Math.floor(t * 2.4) % 2 === 0;
  return (
    <div style={{margin: '0 16px 16px', minHeight: height, borderRadius: 14, border: `${1 + focus}px solid ${focus > 0.5 ? T.brand : T.border}`, boxShadow: focus > 0 ? `0 0 0 ${4 * focus}px rgba(0,106,252,0.15)` : undefined, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 6px 18px', fontSize, flexShrink: 0}}>
      <div style={{flex: 1, color: text ? T.text : T.faint, lineHeight: 1.3}}>
        {text || placeholder}
        {caret ? <span style={{display: 'inline-block', width: 2, height: fontSize + 4, background: T.brand, marginLeft: 2, verticalAlign: 'middle'}} /> : null}
      </div>
      <SendButton press={press} ready={text.length > 0} />
    </div>
  );
};

const Verdict = ({at, ok}: {at: number; ok: boolean}) => {
  const t = useT();
  const open = ramp(t, at, at + 0.2);
  if (open <= 0) return null;
  const st = stampIn(t, at);
  return (
    <Grow p={open}>
      <div style={{alignSelf: 'flex-start', display: 'inline-block', opacity: st.o, scale: `${st.s}`, transformOrigin: 'left center'}}>
        <Pill bg={ok ? T.greenSoft : T.redSoft} color={ok ? T.green : T.red}>
          {ok ? (
            <>
              <Check size={16} /> Зөв
            </>
          ) : (
            '✕ Буруу мэдээлэл'
          )}
        </Pill>
      </div>
    </Grow>
  );
};

// Brief RGB-split jitter on the wrong answer.
const Glitch = ({at, children}: {at: number; children: ReactNode}) => {
  const t = useT();
  const k = t >= at && t < at + 0.4 ? 1 - (t - at) / 0.4 : 0;
  const step = Math.floor(t * 40);
  const dx = k * (rand(step, 3) - 0.5) * 18;
  return <div style={{translate: `${dx}px 0`, textShadow: k > 0 ? `${3 * k}px 0 rgba(255,0,60,0.8), ${-3 * k}px 0 rgba(0,180,255,0.8)` : undefined}}>{children}</div>;
};

// Chat timeline: the test question (scene 6), the wrong answer, then the corrected re-test (scene 7).
const ChatPanel = () => {
  const t = useT();
  const w = chatW(t);
  const sweep = lin(t, c('fix.apply') + 0.4, c('fix.apply') + 1.0);
  const focus = ramp(t, c('test.click'), c('test.click') + 0.15) * (1 - ramp(t, c('test.send'), c('test.send') + 0.2));
  const draft = t < c('test.send') ? typed(t, QUESTION, c('test.type'), c('test.type') + 1.0) : '';
  const press = hit(t, c('test.send'), 0.04, 0.12);
  const dividerW = ramp(t, c('fix.divider'), c('fix.divider') + 0.4, easeOut);
  return (
    <Slot left={CONTENT_LEFT} width={w} dz={60 * split(t)}>
      <PanelBox style={{boxShadow: `0 ${30 * split(t)}px ${70 * split(t)}px rgba(17,24,39,0.15)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: `1px solid ${T.border}`}}>
          <div style={{width: 44, height: 44, borderRadius: 22, background: T.brandSoft}} />
          <div style={{flex: 1}}>
            <div style={{fontSize: 21, fontWeight: 700}}>Sales agent</div>
            <div style={{fontSize: 16, color: T.muted}}>Messenger · Customer preview</div>
          </div>
          <Pill bg={T.bubble} color={T.muted}>TEST MODE</Pill>
        </div>
        <div style={{flex: 1, padding: '6px 20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', position: 'relative'}}>
          <Bubble at={c('test.send') + 0.05} from="customer" maxWidth={440} until={c('test.clear')}>{QUESTION}</Bubble>
          <Typing from={c('test.typing')} to={c('test.a')} />
          <Bubble at={c('test.a')} from="ai" tag="AI агент" maxWidth={460} until={c('test.clear')}>
            Манайд арьсан цүнх (189,000₮), мини цүнх (129,000₮), түрийвч (59,000₮) байна. Аль нь сонирхож байна вэ?
          </Bubble>
          <Bubble at={c('fix.q')} from="customer" maxWidth={380} until={c('fix.clear')}>{FIX_Q}</Bubble>
          <Typing from={c('fix.typing')} to={c('fix.wrong')} />
          <Glitch at={c('fix.error')}>
            <Bubble at={c('fix.wrong')} from="ai" tag="AI агент" maxWidth={380} until={c('fix.clear')}>Хүргэлт үнэгүй.</Bubble>
          </Glitch>
          {t < c('fix.clear') + 0.3 ? <Verdict at={c('fix.error')} ok={false} /> : null}
          {dividerW > 0 ? (
            <Grow p={ramp(t, c('fix.divider'), c('fix.divider') + 0.25)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, color: T.muted, fontSize: 16, justifyContent: 'center'}}>
                <div style={{width: 160 * dividerW, height: 1, background: T.border}} />
                <span style={{opacity: dividerW}}>Шинэ тест</span>
                <div style={{width: 160 * dividerW, height: 1, background: T.border}} />
              </div>
            </Grow>
          ) : null}
          <Bubble at={c('fix.q2')} from="customer" maxWidth={380}>{FIX_Q}</Bubble>
          <Typing from={c('fix.typing2')} to={c('fix.right')} />
          <Bubble at={c('fix.right')} from="ai" tag="AI агент" maxWidth={400}>Дархан руу хүргэлт 15,000₮, 2–3 хоногт хүргэнэ.</Bubble>
          <Verdict at={c('fix.ok')} ok />
          {sweep > 0 && sweep < 1 ? <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent ${sweep * 130 - 30}%, rgba(0,106,252,0.14) ${sweep * 130 - 12}%, transparent ${sweep * 130}%)`}} /> : null}
        </div>
        <Composer text={draft} placeholder="Хэрэглэгчийн өмнөөс бичих…" focus={focus} press={press} />
      </PanelBox>
      <TestCursor w={w} />
    </Slot>
  );
};

// Scene 6 cursor: composer → type → send.
const TestCursor = ({w}: {w: number}) => {
  const t = useT();
  const a = c('test.cursorIn');
  if (t < a || t > c('test.send') + 0.9) return null;
  const x = track([[a, w + 160], [c('test.click') - 0.05, 230], [c('test.type') + 0.3, 230], [c('test.send') - 0.25, w - 44], [c('test.send') + 0.25, w - 44], [c('test.send') + 0.9, w + 120]], t);
  const y = track([[a, 720], [c('test.click') - 0.05, 562], [c('test.type') + 0.3, 562], [c('test.send') - 0.25, 562], [c('test.send') + 0.25, 562], [c('test.send') + 0.9, 680]], t);
  const down = hit(t, c('test.click'), 0.04, 0.1) + hit(t, c('test.send'), 0.04, 0.1);
  const o = ramp(t, a, a + 0.2) * (1 - ramp(t, c('test.send') + 0.5, c('test.send') + 0.9));
  return <Cursor x={x} y={y} down={Math.min(1, down)} o={o} />;
};

// "What happened" + saved settings: explains which tool produced the answer.
const SidePanel = () => {
  const t = useT();
  const p = spring(t, c('test.panel'), 1.9, 0.68);
  const out = ramp(t, c('test.clear'), c('test.clear') + 0.4, easeIn);
  if (p <= 0 || out >= 1) return null;
  const w = SIDE_TEST;
  return (
    <Slot left={CONTENT_LEFT + CONTENT_W - w} width={w} dz={(1 - p) * 240} dx={(1 - p) * 80 + out * 120} o={clamp01(p * 2) * (1 - out)}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <div style={{background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: 22}}>
          <div style={{fontSize: 21, fontWeight: 700}}>What happened</div>
          <div style={{fontSize: 19, color: T.brand, fontWeight: 600, marginTop: 10, display: 'inline-block', padding: '2px 8px', marginLeft: -8, borderRadius: 8, background: `rgba(224,237,255,${hit(t, c('test.connector'), 0.05, 0.6)})`}}>Product list tool</div>
          <div style={{fontSize: 17, color: T.muted, lineHeight: 1.45, marginTop: 8}}>Хадгалсан каталогоос 3 бараа олж харууллаа.</div>
        </div>
        <div style={{background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: 22}}>
          <div style={{fontSize: 21, fontWeight: 700}}>Using saved settings</div>
          {['Booking', 'Product list', 'Comment to DM'].map((label, i) => {
            const st = stampIn(t, c('test.toggle') + i * 0.2);
            return (
              <div key={label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 18}}>
                {label}
                <span style={{opacity: st.o, scale: `${st.s}`, display: 'inline-block'}}>
                  <Pill bg={T.greenSoft} color={T.green} style={{fontSize: 14, padding: '4px 12px'}}>ON</Pill>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Slot>
  );
};

// Dashed connector from the tool name to the AI answer it produced.
const Connector = () => {
  const t = useT();
  const a = c('test.connector');
  const k = ramp(t, a, a + 0.6, easeInOut);
  const out = ramp(t, c('test.clear') - 0.2, c('test.clear') + 0.1);
  if (k <= 0 || out >= 1) return null;
  const sideLeft = CONTENT_LEFT + CONTENT_W - SIDE_TEST;
  const from = {x: sideLeft + 14, y: ROW_TOP + 76};
  const to = {x: CONTENT_LEFT + 486, y: ROW_TOP + 440};
  const box = {x: Math.min(from.x, to.x) - 40, y: from.y - 40, w: Math.abs(from.x - to.x) + 80, h: to.y - from.y + 80};
  const sx = from.x - box.x;
  const sy = from.y - box.y;
  const ex = to.x - box.x;
  const ey = to.y - box.y;
  const d = `M ${sx} ${sy} C ${sx - 40} ${sy + 300}, ${ex + 120} ${ey}, ${ex} ${ey}`;
  const len = 520;
  return (
    <Obj x={W.x + box.x + box.w / 2} y={W.y + box.y + box.h / 2} z={W.z + 3} o={1 - out}>
      <svg width={box.w} height={box.h} style={{overflow: 'visible'}}>
        <path d={d} fill="none" stroke={T.brand} strokeWidth={3} strokeDasharray={`${len * k} ${len}`} strokeLinecap="round" />
        <circle cx={sx} cy={sy} r={6} fill={T.brand} opacity={k > 0 ? 1 : 0} />
        <circle cx={ex} cy={ey} r={6 * clamp01((k - 0.95) * 20)} fill={T.brand} />
      </svg>
    </Obj>
  );
};

const DiffLine = ({sign, children, strike = 0}: {sign: '+' | '−'; children: ReactNode; strike?: number}) => (
  <div style={{position: 'relative', display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 10, background: sign === '+' ? T.greenSoft : T.redSoft, color: sign === '+' ? T.green : T.red, fontSize: 18, lineHeight: 1.4}}>
    <span style={{fontWeight: 700}}>{sign}</span>
    <span style={{position: 'relative'}}>
      {children}
      {strike > 0 ? <span style={{position: 'absolute', left: 0, top: '52%', height: 2, width: `${strike * 100}%`, background: T.red}} /> : null}
    </span>
  </div>
);

// Agent editor: the owner types the fact in plain words, the editor proposes a diff, «Хэрэглэх» applies it.
const EditorPanel = () => {
  const t = useT();
  const open = editorOpen(t);
  if (open <= 0) return null;
  const w = SIDE_FIX;
  const focus = ramp(t, c('fix.type') - 0.1, c('fix.type')) * (1 - ramp(t, c('fix.send'), c('fix.send') + 0.2));
  const draft = t < c('fix.send') ? typed(t, FIX_TEXT, c('fix.type'), c('fix.type') + 1.05) : '';
  const press = hit(t, c('fix.send'), 0.04, 0.12);
  const reply = ramp(t, c('fix.reply'), c('fix.reply') + 0.3);
  const plus = ramp(t, c('fix.plus'), c('fix.plus') + 0.3);
  const applied = t >= c('fix.apply');
  const applyPress = hit(t, c('fix.apply'), 0.04, 0.15);
  const glow = hit(t, c('fix.apply'), 0.03, 0.5);
  return (
    <Slot left={CONTENT_LEFT + CONTENT_W - w} width={w} dz={180 * split(t) + (1 - open) * 300} dx={(1 - open) * 160} o={clamp01(open * 2)}>
      <PanelBox style={{border: `2px solid ${T.brand}`, boxShadow: `0 ${40 * split(t)}px ${90 * split(t)}px rgba(0,60,160,0.22)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.brandSoft}}>
          <Sparkle size={22} />
          <div style={{fontSize: 21, fontWeight: 700}}>Agent editor</div>
        </div>
        <div style={{flex: 1, padding: '6px 18px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden'}}>
          <div style={{fontSize: 17, color: T.muted}}>Агентын юуг засах вэ?</div>
          <Bubble at={c('fix.send') + 0.05} from="customer" maxWidth={320} fontSize={20}>{FIX_TEXT}</Bubble>
          {reply > 0 ? (
            <Grow p={reply}>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                <div style={{fontSize: 18, fontWeight: 600}}>Зааврыг ингэж шинэчилье:</div>
                <DiffLine sign="−" strike={ramp(t, c('fix.strike'), c('fix.strike') + 0.35, easeInOut)}>Хүргэлт үнэгүй.</DiffLine>
                <Grow p={plus} gap={0}>
                  <DiffLine sign="+">УБ дотор 5,000₮, Дархан руу 15,000₮.</DiffLine>
                </Grow>
                <div style={{marginTop: 6, padding: '12px 0', borderRadius: 12, textAlign: 'center', fontSize: 19, fontWeight: 700, background: applied ? T.greenSoft : T.brand, color: applied ? T.green : '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, scale: `${1 - applyPress * 0.06}`, boxShadow: `0 0 ${glow * 40}px rgba(21,128,61,${glow * 0.8})`}}>
                  {applied ? (
                    <>
                      <Check size={18} /> Хэрэглэсэн
                    </>
                  ) : (
                    'Хэрэглэх'
                  )}
                </div>
              </div>
            </Grow>
          ) : null}
        </div>
        <Composer text={draft} placeholder="Засварыг энгийнээр бичнэ үү…" focus={focus} press={press} height={52} fontSize={17} />
      </PanelBox>
      <EditorCursor w={w} />
    </Slot>
  );
};

// Scene 7 cursor: composer → type → send → «Хэрэглэх».
const EditorCursor = ({w}: {w: number}) => {
  const t = useT();
  const a = c('fix.editor') + 0.3;
  const apply = c('fix.apply');
  if (t < a || t > apply + 0.9) return null;
  const x = track([[a, w + 200], [c('fix.type') - 0.12, 150], [c('fix.type') + 0.4, 150], [c('fix.send') - 0.25, w - 44], [c('fix.send') + 0.2, w - 44], [apply - 0.45, w / 2 + 40], [apply + 0.25, w / 2 + 40], [apply + 0.9, w + 140]], t);
  const y = track([[a, 700], [c('fix.type') - 0.12, 560], [c('fix.type') + 0.4, 560], [c('fix.send') - 0.25, 560], [c('fix.send') + 0.2, 560], [apply - 0.45, 492], [apply + 0.25, 492], [apply + 0.9, 640]], t);
  const down = Math.min(1, hit(t, c('fix.type') - 0.08, 0.04, 0.1) + hit(t, c('fix.send'), 0.04, 0.1) + hit(t, apply, 0.04, 0.12));
  const o = ramp(t, a, a + 0.2) * (1 - ramp(t, apply + 0.5, apply + 0.9));
  return <Cursor x={x} y={y} down={down} o={o} />;
};

// The applied instruction travels from the editor into the chat as a light pulse.
const ApplyPulse = () => {
  const t = useT();
  const a = c('fix.apply');
  const k = ramp(t, a + 0.02, a + 0.45, easeInOut);
  if (t < a || k >= 1) return null;
  const sideLeft = CONTENT_LEFT + CONTENT_W - SIDE_FIX;
  const from = {x: W.x + sideLeft + SIDE_FIX / 2, y: W.y + ROW_TOP + 492, z: W.z + 180};
  const to = {x: W.x + CONTENT_LEFT + chatW(t) / 2, y: W.y + ROW_TOP + 300, z: W.z + 60};
  return (
    <Obj x={mix(from.x, to.x, k)} y={mix(from.y, to.y, k) - Math.sin(k * Math.PI) * 120} z={mix(from.z, to.z, k) + Math.sin(k * Math.PI) * 150} s={0.6 + Math.sin(k * Math.PI) * 0.8} o={1 - k * 0.6}>
      <div style={{width: 90, height: 90, borderRadius: 45, background: 'radial-gradient(circle, #ffffff 0%, rgba(0,106,252,0.9) 35%, rgba(0,106,252,0) 70%)'}} />
    </Obj>
  );
};

// Green sparks when the re-test passes.
const Sparks = () => {
  const t = useT();
  const a = c('fix.ok');
  const k = lin(t, a, a + 0.8);
  if (k <= 0 || k >= 1) return null;
  const origin = {x: W.x + CONTENT_LEFT + 80, y: W.y + ROW_TOP + 520, z: W.z + 10};
  return (
    <>
      {Array.from({length: 10}, (_, i) => {
        const ang = (i / 10) * Math.PI * 2 + rand(i, 9);
        const r = easeOut(k) * (90 + rand(i, 8) * 70);
        return (
          <Obj key={i} x={origin.x + Math.cos(ang) * r} y={origin.y + Math.sin(ang) * r} z={origin.z + rand(i, 7) * 80} s={1 - k} o={1 - k}>
            <Sparkle size={22} color={i % 2 ? T.green : '#4ade80'} />
          </Obj>
        );
      })}
    </>
  );
};

export const AppSet = () => {
  const t = useT();
  const fix = t >= c('fix.caption') - 0.2;
  return (
    <>
      <Obj x={A.x - 120} y={A.y - 60} z={A.z - 1000}>
        {fix ? <Numeral n={7} at={c('fix.caption')} out={c('fix.out')} /> : <Numeral n={6} at={c('test.caption')} out={c('test.out')} />}
      </Obj>
      <Obj x={A.x + CAPTION_X - 20} y={A.y - 10} z={A.z} ry={6} preserve>
        {fix ? (
          <Caption n={7} title="AI-аар засна" sub="Юу буруу байгааг хэлэхэд л зааврыг шинэчилнэ." at={c('fix.caption')} out={c('fix.out')} width={560} />
        ) : (
          <Caption n={6} title="Туршиж үзнэ" sub="Хэрэглэгчид хүрэхээс өмнө тест горимд шалгана." at={c('test.caption')} out={c('test.out')} width={560} />
        )}
      </Obj>
      <Shell />
      <ChatPanel />
      <SidePanel />
      <Connector />
      <EditorPanel />
      <ApplyPulse />
      <Sparks />
    </>
  );
};
