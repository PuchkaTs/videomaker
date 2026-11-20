import type {CSSProperties, ReactNode} from 'react';
import {track} from '../kublai-agents-v2/time';
import cues from './cues.json';
import {Box, COL, Code, CodePanel, Kicker, MONO, Mark, NameTag, Obj, SANS, ValueCard, Words, clamp01, easeInOut, easeOut, hit, lin, mix, ramp, rise, spring, type Cam} from './kit';

// The eleven scenes of lesson 4.1. Each returns its camera, its 3D world and a flat HUD layer
// (headings, code) for local time u in seconds. Event times come from cues.json.

export type Shot = {cam: Partial<Cam>; world: ReactNode; hud?: ReactNode};

const at = (id: string) => cues.scenes.find((s) => s.id === id)!.t as unknown as Record<string, number>;
const dur = (id: string) => cues.scenes.find((s) => s.id === id)!.dur;

const Abs = ({children, style}: {children: ReactNode; style: CSSProperties}) => <div style={{position: 'absolute', ...style}}>{children}</div>;

// The heading block every scene shares: optional kicker, then the line.
const Heading = ({u, kicker, text, size = 62, kAt = 0.1, at: tAt = 0.25, highlight, width = 1500}: {u: number; kicker?: string; text: string; size?: number; kAt?: number; at?: number; highlight?: Record<string, string>; width?: number}) => (
  <Abs style={{left: 110, top: 80, width}}>
    {kicker ? (
      <div style={{marginBottom: 20}}>
        <Kicker t={u} at={kAt} text={kicker} />
      </div>
    ) : null}
    <Words t={u} at={tAt} text={text} size={size} highlight={highlight} />
  </Abs>
);

// ---------- S01: title ----------

const Letters = ({u, at: a, text, size, color = COL.ink, weight = 800}: {u: number; at: number; text: string; size: number; color?: string; weight?: number}) => (
  <div style={{fontFamily: SANS, fontWeight: weight, fontSize: size, color, letterSpacing: '-0.03em', whiteSpace: 'nowrap', transformStyle: 'preserve-3d', lineHeight: 1.05}}>
    {[...text].map((ch, i) => {
      const k = spring(u, a + i * 0.035, 1.9, 0.7);
      return (
        <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: clamp01(k * 2), transform: `translate3d(0, ${(1 - k) * 60}px, ${(1 - k) * -700}px) rotateY(${(1 - k) * -50}deg)`}}>
          {ch}
        </span>
      );
    })}
  </div>
);

const S01 = (u: number): Shot => {
  const T = at('S01');
  const num = spring(u, T.title, 1.6, 0.6);
  return {
    cam: {z: mix(380, 0, ramp(u, 0, 4, easeOut)) + 20 * u, rx: mix(-6, -11, lin(u, 0, 7)), ry: mix(12, -5, ramp(u, 0, 7, easeInOut)), x: 40},
    world: (
      <>
        <Obj x={-430} y={-170} z={40}>
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 230, color: COL.yellow, letterSpacing: '-0.04em', transform: `translateZ(${(1 - num) * -500}px) scale(${mix(0.6, 1, Math.min(num, 1.1))})`, opacity: clamp01(num * 2), lineHeight: 1}}>4.1</div>
        </Obj>
        <Obj x={-260} y={40} z={60}>
          <Letters u={u} at={T.title + 0.35} text="Хувьсагч" size={150} />
        </Obj>
        <Obj x={-300} y={190} z={60}>
          <Letters u={u} at={T.title + 0.75} text="гэж юу вэ?" size={110} color={COL.blueHi} weight={700} />
        </Obj>
        <Obj x={500} y={90} z={-60} ry={-24}>
          <Box t={u} name="x" values={[{v: '?', at: T.drop}]} tagAt={T.drop + 0.5} w={340} h={240} d={240} />
        </Obj>
      </>
    ),
    hud: (
      <Abs style={{left: 110, top: 80}}>
        <Kicker t={u} at={0.15} text="Python · 4-р бүлэг" color={COL.blueHi} />
      </Abs>
    ),
  };
};

// ---------- S02: the value changes ----------

const S02 = (u: number): Shot => {
  const T = at('S02');
  const punch = 40 * (hit(u, T.v1 - 0.1, 0.05, 0.4) + hit(u, T.v2 - 0.1, 0.05, 0.4) + hit(u, T.v3 - 0.1, 0.05, 0.4));
  const chip = spring(u, T.chip, 2.2, 0.7);
  return {
    cam: {z: mix(160, -40, ramp(u, 0, dur('S02'))) - punch, rx: -10, ry: track([[0, -14], [6, -2], [14, 10]], u), x: 120, y: 30},
    world: (
      <Obj x={420} y={110} ry={-18}>
        <Box t={u} name="onoo" values={[{v: '5', at: T.v1}, {v: '12', at: T.v2}, {v: '7', at: T.v3}]} tagAt={0.4} w={340} h={240} d={240} glow={0.4 * hit(u, T.v3, 0.05, 0.8)} />
      </Obj>
    ),
    hud: (
      <>
        <Heading u={u} text="Хувьсагч — программ ажиллах явцад өөр өөр утга авч болдог хэмжигдэхүүн" size={60} width={1550} highlight={{'Хувьсагч': COL.yellow}} />
        <Abs style={{left: 110, top: 400}}>
          <div style={rise(u, 0.6)}>
            <CodePanel
              t={u}
              width={620}
              size={50}
              lines={[
                {text: 'onoo = 5', at: T.type1, dim: ramp(u, T.type2, T.type2 + 0.4)},
                {text: 'onoo = 12', at: T.type2, dim: ramp(u, T.type3, T.type3 + 0.4)},
                {text: 'onoo = 7', at: T.type3},
              ]}
            />
          </div>
        </Abs>
        <Abs style={{left: 110, top: 850}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: clamp01(chip * 1.5), transform: `translateY(${(1 - Math.min(chip, 1)) * 40}px)`, background: 'rgba(255, 212, 59, 0.12)', border: `2px solid ${COL.yellow}`, borderRadius: 60, padding: '16px 34px'}}>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: COL.yellow}}>1</span>
            <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 42, color: COL.ink}}>Аль ч мөчид зөвхөн нэг утга</span>
          </div>
        </Abs>
      </>
    ),
  };
};

// ---------- S03: memory ----------

const ADDR = ['0x1A08', '0x1A10', '0x1A18', '0x1A20', '0x1A28', '0x1A30'];

const S03 = (u: number): Shot => {
  const T = at('S03');
  const pull = ramp(u, T.pull, T.pull + 2.8, easeInOut);
  const glow = ramp(u, T.glow, T.glow + 0.5) * (0.75 + 0.25 * Math.sin((u - T.glow) * 5));
  const cells: ReactNode[] = [];
  for (let r = -1; r <= 1; r++) {
    for (let c = -2; c <= 3; c++) {
      const isVar = r === 0 && c === 0;
      const k = isVar ? 1 : spring(u, T.pull + 0.5 + Math.hypot(c, r) * 0.14, 2.2, 0.7);
      const x = c * 400;
      const y = r * 320;
      cells.push(
        <Obj key={`${r}${c}`} x={x} y={y} ry={isVar ? mix(-18, 0, pull) : 0} s={Math.max(0.001, Math.min(k, 1.05))}>
          {isVar ? (
            <Box t={u} name="onoo" values={[{v: '7', at: -2}]} tagAt={-2} w={mix(340, 300, pull)} h={mix(240, 210, pull)} d={mix(240, 210, pull)} glow={glow} />
          ) : (
            <Box t={u} w={300} h={210} d={210} tint="#2A4066" />
          )}
        </Obj>,
        <Obj key={`a${r}${c}`} x={x} y={y + 150} z={106} s={Math.max(0.001, Math.min(k, 1))}>
          <span style={{fontFamily: MONO, fontSize: 30, color: isVar ? COL.yellow : COL.dim}}>{ADDR[c + 2].replace('1A', (r + 2).toString(16).toUpperCase() + 'A')}</span>
        </Obj>,
      );
    }
  }
  const use = spring(u, T.use, 2.2, 0.7);
  return {
    cam: {z: mix(-40, 1050, pull), rx: mix(-10, -20, pull), ry: 10 + Math.sin(u * 0.4) * 2, x: mix(-300, 140, pull), y: mix(-80, -150, pull)},
    world: (
      <>
        {cells}
        <Obj x={200} y={520} z={160} style={{opacity: ramp(u, T.pull + 1.4, T.pull + 2.4)}}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 110, color: 'rgba(142, 163, 191, 0.6)', letterSpacing: '0.12em'}}>САНАХ ОЙ</span>
        </Obj>
      </>
    ),
    hud: (
      <>
        <Heading u={u} text="Хувьсагчийн утга компьютерийн санах ойд хадгалагдана," at={T.pull + 0.6} size={58} width={1400} />
        <Abs style={{left: 110, top: 240}}>
          <Words t={u} at={T.cap2} text="дараа нь ашиглагдана." size={58} color={COL.blueHi} />
        </Abs>
        <Abs style={{left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center'}}>
          <div style={{opacity: clamp01(use * 1.5), transform: `scale(${mix(0.9, 1, Math.min(use, 1))})`, background: COL.panel, border: `2px solid ${COL.hair}`, borderRadius: 26, padding: '22px 44px', fontFamily: SANS, fontSize: 48, fontWeight: 600, color: COL.ink}}>
            Тиймээс хувьсагчийг <span style={{color: COL.yellow}}>мэдээлэл хадгалахад</span> ашигладаг
          </div>
        </Abs>
      </>
    ),
  };
};

// ---------- S04: constants ----------

const S04 = (u: number): Shot => {
  const T = at('S04');
  const sealed = [
    {name: 'True', v: 'үнэн', at: T.c1, x: -520},
    {name: 'False', v: 'худал', at: T.c2, x: 0},
    {name: 'pi', v: '3.14159', at: T.c3, x: 520},
  ];
  const no = spring(u, T.bounce + 0.15, 2.6, 0.6);
  return {
    cam: {z: 150, rx: -12, ry: track([[0, 14], [6, 0], [12, -10]], u), y: 120},
    world: (
      <>
        {sealed.map((c) => {
          const k = spring(u, c.at - 0.6, 2, 0.7);
          return (
            <Obj key={c.name} x={c.x} y={260} z={(1 - Math.min(k, 1)) * -600} ry={-12} style={{opacity: clamp01(k * 2)}}>
              <Box t={u} name={c.name} values={[{v: c.v, at: c.at}]} tagAt={c.at + 0.3} tint="#5B4BC4" locked w={320} h={220} d={220} bounceAt={c.name === 'pi' ? T.bounce : undefined} bounceValue="4" />
            </Obj>
          );
        })}
        <Obj x={560} y={-30} z={140} style={{opacity: clamp01(no * 1.5)}} s={mix(0.8, 1, Math.min(no, 1))}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 700, fontSize: 38, color: COL.red}}>
            <Mark ok={false} k={no} size={54} /> өөрчлөгдөхгүй
          </div>
        </Obj>
      </>
    ),
    hud: (
      <>
        <Abs style={{left: 110, top: 80, width: 1600}}>
          <div style={{marginBottom: 20}}>
            <Kicker t={u} at={0.1} text="Тэмдэглэл" />
          </div>
          <Words t={u} at={0.3} text="Тогтмол (константа)" size={84} weight={800} highlight={{'Тогтмол': COL.violet}} />
          <div style={{height: 14}} />
          <Words t={u} at={0.8} text="— программ ажиллах явцад өөрчлөгддөггүй хэмжигдэхүүн" size={46} weight={500} color={COL.dim} gap={0.05} />
          <div style={{height: 14}} />
          <Words t={u} at={T.cap} text="Python-д «суурилуулсан» тогтмолууд бий" size={46} weight={600} color={COL.ink} gap={0.05} />
        </Abs>
      </>
    ),
  };
};

// ---------- S05: the rectangle program ----------

const UNIT = 46;

const S05 = (u: number): Shot => {
  const T = at('S05');
  const wK = spring(u, T.v1, 1.8, 0.75);
  const hK = spring(u, T.v2, 1.8, 0.75);
  const W8 = 8 * UNIT * Math.min(wK, 1.04);
  const H5 = 5 * UNIT * Math.min(hK, 1.04);
  const fill = lin(u, T.area, T.area + 1.6);
  const count = Math.floor(fill * 40);
  const three = (i: number) => hit(u, T.three + i * 0.25, 0.05, 0.6);
  const boxes = [
    {name: 'urt', v: '8', at: T.v1, x: 200},
    {name: 'orgon', v: '5', at: T.v2, x: 520},
    {name: 'talbai', v: '40', at: T.v3, x: 840},
  ];
  const big = spring(u, T.three + 0.6, 2, 0.6);
  return {
    cam: {z: 120, rx: -9, ry: track([[0, -8], [9, 2], [18, 8]], u), x: 60, y: 40},
    world: (
      <>
        {boxes.map((b, i) => {
          const k = spring(u, b.at - 1.3, 2.2, 0.7);
          return (
            <Obj key={b.name} x={b.x} y={-60} ry={-14} s={Math.max(0.001, Math.min(k, 1.04))}>
              <Box t={u} name={b.name} values={[{v: b.v, at: b.at}]} tagAt={b.at - 0.9} w={220} h={150} d={150} glow={three(i)} tagSize={34} />
            </Obj>
          );
        })}
        <Obj x={520} y={310} rx={56} style={{opacity: ramp(u, T.v1 - 0.3, T.v1)}}>
          <div style={{position: 'relative', width: 8 * UNIT, height: 5 * UNIT}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: W8, height: Math.max(4, H5), border: `4px solid ${COL.yellow}`, background: 'rgba(255, 212, 59, 0.08)', boxSizing: 'border-box'}} />
            {Array.from({length: 40}, (_, i) => {
              const cx = i % 8;
              const cy = Math.floor(i / 8);
              return i < count ? <div key={i} style={{position: 'absolute', left: cx * UNIT + 3, top: cy * UNIT + 3, width: UNIT - 6, height: UNIT - 6, borderRadius: 6, background: 'rgba(255, 212, 59, 0.4)'}} /> : null;
            })}
            <div style={{position: 'absolute', left: 0, width: 8 * UNIT, top: 5 * UNIT + 14, textAlign: 'center', fontFamily: MONO, fontSize: 40, fontWeight: 700, color: COL.yellow, opacity: ramp(u, T.v1, T.v1 + 0.4)}}>urt = 8</div>
            <div style={{position: 'absolute', right: 8 * UNIT + 18, top: 5 * UNIT * 0.5 - 26, whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 40, fontWeight: 700, color: COL.yellow, opacity: ramp(u, T.v2, T.v2 + 0.4)}}>orgon = 5</div>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 84, fontWeight: 700, color: COL.ink, opacity: fill > 0 ? 1 : 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)'}}>{count}</div>
          </div>
        </Obj>
      </>
    ),
    hud: (
      <>
        <Heading u={u} kicker="1-р бүлгийн «математик» программ" text="Тэгш өнцөгтийн талбайг олох нь" size={60} width={1500} />
        <Abs style={{left: 110, top: 340}}>
          <div style={rise(u, 0.5)}>
            <CodePanel
              t={u}
              width={830}
              size={38}
              lines={[
                {text: 'urt = int(input())', at: T.in1, out: '← 8', outAt: T.v1 - 0.9},
                {text: 'orgon = int(input())', at: T.in2, out: '← 5', outAt: T.v2 - 0.9},
                {text: 'talbai = urt * orgon', at: T.calc},
                {text: 'print(talbai)', at: T.print, out: '→ 40', outAt: T.out},
              ]}
            />
          </div>
        </Abs>
        <Abs style={{left: 110, top: 760, width: 830}}>
          <div style={{opacity: clamp01(big * 1.5), transform: `translateY(${(1 - Math.min(big, 1)) * 30}px)`, fontFamily: SANS, fontSize: 52, fontWeight: 700, color: COL.ink}}>
            Энэ программд <span style={{color: COL.yellow, fontSize: 80}}>3</span> хувьсагч бий
          </div>
        </Abs>
      </>
    ),
  };
};

// ---------- S06: name and type ----------

const S06 = (u: number): Shot => {
  const T = at('S06');
  const nameK = spring(u, T.name, 2.4, 0.7);
  const typeK = spring(u, T.type, 2.4, 0.7);
  return {
    cam: {z: 260, rx: -12, ry: track([[0, -6], [T.type - 0.6, -10], [T.type + 1.2, -38], [8, -42]], u), y: 120},
    world: (
      <>
        <Obj x={0} y={150}>
          <Box t={u} name="talbai" type="int" values={[{v: '40', at: -2}]} tagAt={-2} typeAt={T.type + 0.2} w={420} h={290} d={290} />
        </Obj>
        <Obj x={0} y={400} z={200} style={{opacity: clamp01(nameK * 1.5)}} s={Math.min(nameK, 1.05)}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 56, color: COL.yellow, letterSpacing: '0.04em'}}>↑ нэр</span>
        </Obj>
        <Obj x={330} y={-90} z={-10} ry={90} style={{opacity: clamp01(typeK * 1.5)}} s={Math.min(typeK, 1.05)}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 56, color: COL.green, letterSpacing: '0.04em'}}>төрөл ↓</span>
        </Obj>
      </>
    ),
    hud: <Heading u={u} text="Хувьсагч бүр нэр ба төрөлтэй" size={76} highlight={{'нэр': COL.yellow, 'төрөлтэй': COL.green}} />,
  };
};

// ---------- S07: naming rules ----------

const S07 = (u: number): Shot => {
  const T = at('S07');
  const keys = [
    {k: 'a–z  A–Z', label: 'үсэг'},
    {k: '0–9', label: 'цифр'},
    {k: '_', label: 'доогуур зураас'},
  ];
  const rows = [
    {name: 'urt1', ok: true, at: T.r1, note: ''},
    {name: 'niit_dun', ok: true, at: T.r2, note: ''},
    {name: '1urt', ok: false, at: T.r3, note: 'цифрээр эхэлж болохгүй'},
    {name: 'yalgavar', ok: true, at: T.r4, note: 'дискриминант: D = b² − 4ac'},
  ];
  const meaning = ramp(u, T.note, T.note + 0.6);
  return {
    cam: {z: 120, rx: -8, ry: track([[0, 10], [8, 0], [17, -8]], u), x: 200, y: track([[0, -60], [T.r1, -40], [T.r4 + 0.6, 40], [17, 50]], u)},
    world: (
      <>
        {keys.map((key, i) => {
          const k = spring(u, T.chips + i * 0.25, 2.4, 0.6);
          return (
            <Obj key={key.k} x={-60 + i * 330} y={-170} z={(1 - Math.min(k, 1)) * -500} rx={-10} style={{opacity: clamp01(k * 2)}}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 56, color: COL.ink, background: 'linear-gradient(180deg, #2B4A7A, #1B2F52)', border: `2px solid ${COL.hair}`, borderRadius: 20, boxShadow: '0 10px 0 #0E1A30', padding: '14px 30px', minWidth: 120}}>{key.k}</div>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: COL.dim, marginTop: 22}}>{key.label}</div>
              </div>
            </Obj>
          );
        })}
        {rows.map((r, i) => {
          const k = spring(u, r.at, 2.2, 0.7);
          const mark = ramp(u, r.at + 0.55, r.at + 0.9);
          const shake = r.ok ? 0 : Math.sin((u - r.at - 0.6) * 50) * hit(u, r.at + 0.6, 0.02, 0.2) * 12;
          const glow = i === 3 ? meaning : 0;
          return (
            <Obj key={r.name} x={60} y={60 + i * 120} z={(1 - Math.min(k, 1)) * -400} style={{opacity: clamp01(k * 2)}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 34, width: 1100}}>
                <div style={{width: 320, display: 'flex', justifyContent: 'flex-end', transform: `translateX(${shake}px)`}}>
                  <NameTag name={r.name} color={r.ok ? COL.yellow : '#FFB4B4'} size={46} />
                </div>
                <Mark ok={r.ok} k={mark} size={66} />
                <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: r.ok ? COL.green : COL.red, opacity: ramp(u, r.at + 0.8, r.at + 1.2), textShadow: glow ? `0 0 ${24 * glow}px rgba(74, 222, 128, 0.6)` : undefined}}>{r.note}</span>
              </div>
            </Obj>
          );
        })}
      </>
    ),
    hud: (
      <>
        <Heading u={u} text="Нэрэнд үсэг, цифр, доогуур зураас ашиглана" size={60} width={1700} />
        <Abs style={{left: 110, bottom: 70}}>
          <div style={{opacity: meaning, transform: `translateY(${(1 - meaning) * 30}px)`, background: COL.panel, border: `2px solid ${COL.hair}`, borderRadius: 24, padding: '18px 36px', fontFamily: SANS, fontSize: 44, fontWeight: 600, color: COL.ink}}>
            Хувьсагчид <span style={{color: COL.yellow}}>«утгатай»</span> нэр өгөх нь зүйтэй
          </div>
        </Abs>
      </>
    ),
  };
};

// ---------- S08: case matters ----------

const S08 = (u: number): Shot => {
  const T = at('S08');
  const lk = spring(u, T.letters, 2, 0.55);
  const neq = spring(u, T.letters + 0.45, 2.4, 0.5);
  return {
    cam: {z: 180, rx: -11, ry: track([[0, -12], [5, 4], [10, 10]], u), y: 60},
    world: (
      <>
        <Obj x={-380} y={220} ry={10}>
          <Box t={u} name="urt" values={[{v: '5', at: T.b1}]} tagAt={T.b1 - 0.6} w={320} h={220} d={220} />
        </Obj>
        <Obj x={380} y={220} ry={-10}>
          <Box t={u} name="Urt" values={[{v: '9', at: T.b2}]} tagAt={T.b2 - 0.6} w={320} h={220} d={220} tint="#2F8F7A" />
        </Obj>
        <Obj x={-380} y={-180} z={mix(-600, 160, Math.min(lk, 1.05))} style={{opacity: clamp01(lk * 2)}}>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 180, color: COL.ink}}><span style={{color: COL.yellow, fontSize: 150}}>u</span>rt</span>
        </Obj>
        <Obj x={0} y={-160} z={160} s={Math.max(0.001, neq)}>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 170, color: COL.red}}>≠</span>
        </Obj>
        <Obj x={380} y={-180} z={mix(-600, 160, Math.min(lk, 1.05))} style={{opacity: clamp01(lk * 2)}}>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 180, color: COL.ink}}><span style={{color: '#6FE3C8', fontSize: 240}}>U</span>rt</span>
        </Obj>
      </>
    ),
    hud: (
      <>
        <Heading u={u} text="Жижиг ба том үсгийг ялгадаг" size={70} />
        <Abs style={{left: 0, right: 0, bottom: 60, display: 'flex', justifyContent: 'center'}}>
          <Words t={u} at={T.cap} text="urt ба Urt — хоёр өөр хувьсагч" size={56} weight={700} highlight={{'urt': COL.yellow, 'Urt': '#6FE3C8'}} />
        </Abs>
      </>
    ),
  };
};

// ---------- S09: using a value by its name ----------

const S09 = (u: number): Shot => {
  const T = at('S09');
  const fly = ramp(u, T.fly, T.land, easeInOut);
  const from = {x: -420, y: 40, z: 40};
  const to = {x: 430, y: 60, z: 40};
  const out = spring(u, T.land, 2.6, 0.6);
  const flash = hit(u, T.fly - 0.1, 0.05, 0.5);
  return {
    cam: {z: 150, rx: -10, ry: track([[0, 8], [9, -8]], u), y: 80},
    world: (
      <>
        <Obj x={-420} y={200} ry={14}>
          <Box t={u} name="x1" values={[{v: '3', at: -2}]} tagAt={-2} w={320} h={220} d={220} glow={flash} />
        </Obj>
        {u >= T.fly && u < T.land + 0.05 ? (
          <Obj x={mix(from.x, to.x, fly)} y={mix(from.y, to.y, fly) - 300 * Math.sin(Math.PI * fly)} z={from.z + 200 * Math.sin(Math.PI * fly)} rz={mix(-6, 0, fly)} s={mix(1, 0.7, fly)}>
            <ValueCard v="3" w={211} h={202} />
          </Obj>
        ) : null}
        <Obj x={430} y={120} ry={-14}>
          <div style={{width: 560, height: 360, borderRadius: 24, background: '#060B16', border: `3px solid ${COL.hair}`, boxShadow: '0 30px 60px rgba(0,0,0,0.4)', padding: 30, boxSizing: 'border-box'}}>
            <div style={{fontFamily: MONO, fontSize: 26, color: COL.dim}}>Дэлгэц</div>
            <div style={{fontFamily: MONO, fontSize: 34, color: COL.dim, marginTop: 20}}>&gt;&gt;&gt; print(x1)</div>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 120, color: COL.green, marginTop: 6, opacity: clamp01(out * 2), transform: `scale(${mix(1.5, 1, Math.min(out, 1))})`, transformOrigin: 'left center'}}>3</div>
          </div>
        </Obj>
      </>
    ),
    hud: (
      <>
        <Heading u={u} kicker="Тэмдэглэл" text="Утгыг хувьсагчийн нэрээр нь ашиглана" size={64} />
        <Abs style={{left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center'}}>
          <div style={{...rise(u, T.type - 0.3), background: COL.panel, border: `2px solid ${COL.hair}`, borderRadius: 22, padding: '10px 40px'}}>
            <Code text="print(x1)" shown={(u - T.type) * 12} size={76} cursor={u < T.fly} />
          </div>
        </Abs>
      </>
    ),
  };
};

// ---------- S10: reserved words ----------

const KEYWORDS = ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'];
const FOR = KEYWORDS.indexOf('for');
const chipPos = (i: number) => ({x: ((i % 7) - 3) * 205 - 300, y: Math.floor(i / 7) * 92 - 200});

const S10 = (u: number): Shot => {
  const T = at('S10');
  const go = ramp(u, T.tag, T.reject - 0.05, easeInOut);
  const knock = ramp(u, T.reject, T.reject + 0.9, easeOut);
  const src = chipPos(FOR);
  const dst = {x: 560, y: 150, z: 120};
  const flash = hit(u, T.reject, 0.03, 0.9);
  const cap = ramp(u, T.cap2, T.cap2 + 0.6);
  return {
    cam: {z: 240, rx: -12, ry: track([[0, -10], [7, -2], [15, 6]], u), x: track([[0, -120], [T.tag, -60], [T.reject + 1, 60], [15, 60]], u), y: 0},
    world: (
      <>
        {KEYWORDS.map((w, i) => {
          const p = chipPos(i);
          const k = spring(u, T.wall + (i % 7) * 0.06 + Math.floor(i / 7) * 0.12, 2.2, 0.7);
          const isFor = i === FOR;
          const red = isFor ? Math.max(flash, ramp(u, T.tag, T.tag + 0.3) * 0.6) : 0;
          return (
            <Obj key={w} x={p.x} y={p.y} z={-40 + (1 - Math.min(k, 1)) * -700} style={{opacity: clamp01(k * 2) * (isFor && u > T.tag ? 0.35 : 1)}}>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, color: red > 0.3 ? COL.red : COL.violet, background: 'rgba(197, 155, 255, 0.1)', border: `2px solid rgba(197, 155, 255, ${0.25 + red * 0.6})`, borderRadius: 14, padding: '6px 20px'}}>{w}</div>
            </Obj>
          );
        })}
        <Obj x={dst.x} y={dst.y + 20} z={0} ry={-16}>
          <Box t={u} w={300} h={200} d={200} tint="#33507F" bounceAt={T.reject} />
        </Obj>
        {u >= T.tag ? (
          <Obj
            x={mix(src.x, dst.x, go) + 520 * knock}
            y={mix(src.y, dst.y, go) - 200 * Math.sin(Math.PI * go) - 260 * Math.sin(Math.PI * knock * 0.8)}
            z={mix(-40, dst.z, go)}
            rz={mix(0, -4, go) + 40 * knock}
            style={{opacity: 1 - ramp(u, T.reject + 0.6, T.reject + 1)}}
          >
            <NameTag name="for" size={50} />
          </Obj>
        ) : null}
        <Obj x={dst.x + 210} y={dst.y - 150} z={200} s={Math.max(0.001, Math.min(spring(u, T.reject, 3, 0.5), 1.1))}>
          <Mark ok={false} k={ramp(u, T.reject, T.reject + 0.4)} size={90} />
        </Obj>
      </>
    ),
    hud: (
      <>
        <Heading u={u} text="Зарим үгийг хувьсагчийн нэр болгож болохгүй" size={60} width={1700} />
        <Abs style={{left: 0, right: 0, bottom: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: cap, transform: `translateY(${(1 - cap) * 30}px)`}}>
          <div style={{fontFamily: SANS, fontSize: 48, fontWeight: 700, color: COL.ink, background: COL.panel, borderRadius: 24, padding: '14px 36px', border: `2px solid ${COL.hair}`}}>
            <span style={{color: COL.violet}}>нөөцлөгдсөн үг</span> · үйлчилгээний үг · түлхүүр үг
          </div>
          <div style={{fontFamily: SANS, fontSize: 34, fontWeight: 500, color: COL.dim}}>Бүрэн жагсаалт — 1-р хавсралтад</div>
        </Abs>
      </>
    ),
  };
};

// ---------- S11: summary ----------

const S11 = (u: number): Shot => {
  const T = at('S11');
  const bullets = [
    {at: T.b1, text: 'Утга нь өөрчлөгдөнө, нэг мөчид — нэг утга'},
    {at: T.b2, text: 'Нэр: үсэг, цифр, _ — цифрээр эхлэхгүй'},
    {at: T.b3, text: 'urt ба Urt — өөр хувьсагч'},
    {at: T.b4, text: 'Түлхүүр үг нэр болохгүй'},
  ];
  const lab = (i: number) => spring(u, T.labels + i * 0.3, 2.4, 0.7);
  const label = (text: string, color: string, i: number, x: number, y: number, z: number, ry = 0) => (
    <Obj x={x} y={y} z={z} ry={ry} s={Math.max(0.001, Math.min(lab(i), 1.05))}>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color, letterSpacing: '0.03em'}}>{text}</span>
    </Obj>
  );
  return {
    cam: {z: 200, rx: -12, ry: track([[0, -26], [9, -14]], u), x: 120, y: 80},
    world: (
      <>
        <Obj x={-480} y={160}>
          <Box t={u} name="urt" type="int" values={[{v: '8', at: -2}]} tagAt={-2} typeAt={-2} w={360} h={250} d={250} />
        </Obj>
        {label('утга', COL.ink, 0, -480, -190, 0)}
        {label('нэр ↑', COL.yellow, 1, -480, 360, 180)}
        {label('← төрөл', COL.green, 2, -160, 150, 0)}
      </>
    ),
    hud: (
      <>
        <Abs style={{left: 960, top: 150, width: 860}}>
          <div style={{marginBottom: 20}}>
            <Kicker t={u} at={0.1} text="Дүгнэлт" />
          </div>
          <Words t={u} at={0.3} text="4.1 Хувьсагч" size={96} weight={800} highlight={{'4.1': COL.yellow}} />
          <div style={{height: 40}} />
          {bullets.map((b) => (
            <div key={b.text} style={{...rise(u, b.at, 30), display: 'flex', gap: 22, alignItems: 'baseline', marginBottom: 26}}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: COL.yellow, flexShrink: 0, transform: 'translateY(-6px)'}} />
              <span style={{fontFamily: SANS, fontSize: 44, fontWeight: 600, color: COL.ink, lineHeight: 1.25}}>{b.text}</span>
            </div>
          ))}
        </Abs>
      </>
    ),
  };
};

export const SCENES: Record<string, (u: number) => Shot> = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11};
