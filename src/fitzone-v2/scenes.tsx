import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FPS, easeInOut, expoOut, ramp, track} from '../kublai-agents-v2/time';
import cues from './cues.json';
import {COL, Cam, CornerLogo, H, LABEL, LOGO_WORD, Layer, M, Mark, Reveal, Stage, Svg, T, Trace, W, count, fadeOut, pulseRule, rrect, title, value} from './kit';
import {MONGOLIA, MONGOLIA_H, UB} from './mongolia';

const scene = (id: string) => cues.scenes.find((s) => s.id === id)!;
const active = (t: number, id: string, pad = 0.5) => {
  const s = scene(id);
  return t >= s.from - 0.2 && t <= s.to + pad;
};

// ---------- camera ----------

// One slow path through the HUD. Each scene arrives pushed back and tilted, then settles and drifts.
const Z = [[11.3, -200], [12.4, -30], [20.3, 30], [21.0, -40], [28.8, 40], [46.8, -200], [48, -30], [54.6, 30], [55.2, -30], [59, 30], [59.5, -20], [61.2, 20], [61.9, -30], [69.5, 40], [70.2, -40], [77.5, 30]] as const;
const RY = [[11.3, -7], [13, -2.4], [20.3, 2.4], [21.2, -3], [28.8, 3], [46.8, 7], [48.5, 2.6], [54.6, -2.4], [55.4, 2.4], [59, -1.6], [59.6, 2], [61.2, -1.6], [62, -3], [69.5, 3], [70.4, 0], [77.5, 0]] as const;
const RX = [[11.3, 5], [13, 2], [20.3, -1.4], [21.2, 2], [28.8, -2], [46.8, 5], [48.5, 1.8], [54.6, -1.6], [55.4, 1.6], [59, -1], [59.6, 1.4], [61.2, -1], [62, 3], [69.5, -1.6], [70.4, 0], [77.5, 0]] as const;

const camAt = (t: number): Cam => ({x: 0, y: 0, z: track(Z, t), rx: track(RX, t), ry: track(RY, t)});

// ---------- HUD background ----------

const GRID = 108;

const GridLines = () => {
  const lines = [];
  for (let x = -GRID * 3; x <= W + GRID * 3; x += GRID) lines.push(<line key={`v${x}`} x1={x} x2={x} y1={-GRID * 3} y2={H + GRID * 3} />);
  for (let y = -GRID * 3; y <= H + GRID * 3; y += GRID) lines.push(<line key={`h${y}`} x1={-GRID * 3} x2={W + GRID * 3} y1={y} y2={y} />);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'visible'}}>
      <g stroke={COL.blue} strokeWidth={1} opacity={0.1}>
        {lines}
      </g>
    </svg>
  );
};

export const Backdrop = ({t}: {t: number}) => {
  const sweep = ((t * 0.16) % 1) * (H + 600) - 300;
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Stage cam={camAt(t)}>
        <Layer z={-420}>
          <GridLines />
          <div style={{position: 'absolute', left: -400, right: -400, top: sweep, height: 2, background: COL.blue, opacity: 0.16}} />
          <div style={{position: 'absolute', left: -400, right: -400, top: sweep - 220, height: 220, background: `linear-gradient(0deg, ${COL.blue}1F, ${COL.blue}00)`}} />
        </Layer>
      </Stage>
      <AbsoluteFill style={{background: `radial-gradient(90% 62% at 50% 46%, ${COL.bg}00 30%, ${COL.bg} 100%)`}} />
    </AbsoluteFill>
  );
};

// The strip along the bottom of the HUD: the logo's heartbeat travelling through every scene.
const PulseStrip = ({t}: {t: number}) => {
  const y = 1810;
  const w = W - M * 2;
  const bx = ((t * 150) % (w - 70)) + M;
  return (
    <Svg>
      <Trace d={`M${M} ${y} L${bx} ${y} L${bx + 7} ${y} L${bx + 11} ${y - 8} L${bx + 18} ${y + 10} L${bx + 26} ${y - 21} L${bx + 34} ${y + 12} L${bx + 40} ${y} L${M + w} ${y}`} width={2} color={COL.blue} />
    </Svg>
  );
};

// ---------- presenter: text only ----------

type StatProps = {t: number; at: number; out: number; label: string; big: string; unit?: string; size?: number; unitSize?: number};

const Stat = ({t, at, out, label, big, unit, size = 236, unitSize = 68}: StatProps) => {
  if (t < at - 0.5 || t > out + 0.4) return null;
  return (
    <AbsoluteFill style={{opacity: fadeOut(t, out)}}>
      <Svg>
        <Trace d={pulseRule(M, 1312, W - M * 2)} draw={ramp(t, at - 0.3, at + 0.8, easeInOut)} width={2.5} />
      </Svg>
      <div style={{position: 'absolute', left: M, right: M, top: 1354}}>
        <Reveal t={t} at={at + 0.05}>
          <div style={LABEL}>{label}</div>
        </Reveal>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 8, whiteSpace: 'nowrap'}}>
          <Reveal t={t} at={at + 0.12}>
            <div style={{...value(size), color: '#FFFFFF'}}>{big}</div>
          </Reveal>
          {unit ? (
            <Reveal t={t} at={at + 0.3}>
              <div style={{...title(unitSize), color: COL.blue}}>{unit}</div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Ready = ({t}: {t: number}) => {
  const at = 8.8;
  const out = scene('A02').to - 0.3;
  if (t < at - 0.5 || t > out + 0.4) return null;
  return (
    <AbsoluteFill style={{opacity: fadeOut(t, out)}}>
      <Svg>
        <Trace d={pulseRule(M, 1312, W - M * 2)} draw={ramp(t, at - 0.3, at + 0.8, easeInOut)} width={2.5} />
      </Svg>
      <div style={{position: 'absolute', left: M, right: M, top: 1354}}>
        <Reveal t={t} at={at + 0.05}>
          <div style={LABEL}>Таны төсөлд тохирсон</div>
        </Reveal>
        <Reveal t={t} at={T.ready}>
          <div style={{...title(86), marginTop: 18, color: '#FFFFFF'}}>Хамтарч ажиллахад</div>
        </Reveal>
        <Reveal t={t} at={T.readyWord}>
          <div style={{...title(86), color: COL.blue}}>бэлэн</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

// The soft dark floor under the presenter's text. It stays between lines so the frame never pumps.
const LOWER: readonly (readonly [number, number])[] = [[2.6, 0], [3.1, 1], [4.5, 1], [5.0, 0], [8.4, 0], [8.9, 1], [11.0, 1], [11.3, 0], [28.9, 0], [29.3, 1], [36.7, 1], [37.1, 0]];

export const PresenterText = ({t}: {t: number}) => (
  <>
    <AbsoluteFill style={{opacity: track(LOWER, t), background: `linear-gradient(0deg, ${COL.bg}F2 0%, ${COL.bg}CC 22%, ${COL.bg}00 44%)`}} />
    <Stat t={t} at={T.years} out={scene('A01').to - 0.1} label="Спорт тоног төхөөрөмж" big={String(count(t, T.years, 0.9, 1, 16))} unit="жилийн туршлага" />
    <Ready t={t} />
    <Stat t={t} at={T.year2011} out={scene('A05').to - 0.2} label="Үйл ажиллагаа" big={String(count(t, T.year2011, 0.9, 1996, 2011))} unit="оноос хойш" />
    <Stat t={t} at={T.clients} out={scene('A06').to - 0.95} label="Төрийн болон хувийн хэвшил" big={`${count(t, T.clients, 1.1, 0, 140)}+`} unit="байгууллага" size={212} unitSize={62} />
  </>
);

// ---------- footage with thin overlays ----------

// Darkens the drone shots so that thin lines read, without turning them into a different film.
const Grade = ({top = 0.62}: {top?: number}) => (
  <>
    <AbsoluteFill style={{background: `${COL.bg}40`}} />
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${COL.bg}${Math.round(top * 255).toString(16)} 0%, ${COL.bg}00 42%)`}} />
  </>
);

// A survey grid lying on the ground of the aerial.
const GroundGrid = ({t, at, horizon = 792}: {t: number; at: number; horizon?: number}) => {
  const k = ramp(t, at, at + 0.9, easeInOut);
  const lines = [];
  for (let i = -24; i <= 24; i++) lines.push(<line key={`a${i}`} x1={1440 + i * 120} x2={1440 + i * 120} y1={0} y2={2600} />);
  for (let i = 0; i <= 22; i++) lines.push(<line key={`b${i}`} x1={0} x2={2880} y1={i * 120} y2={i * 120} />);
  return (
    <AbsoluteFill style={{perspective: 1100, perspectiveOrigin: `50% ${horizon - 300}px`, overflow: 'hidden', clipPath: `inset(${horizon}px 0 ${(1 - k) * (H - horizon)}px 0)`}}>
      <svg width={2880} height={2600} viewBox="0 0 2880 2600" style={{position: 'absolute', left: -900, top: horizon, transformOrigin: '50% 0', transform: 'rotateX(74deg)', opacity: 0.42, maskImage: 'linear-gradient(180deg, transparent 0%, black 30%)'}}>
        <g stroke={COL.blue} strokeWidth={2.4}>
          {lines}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Brackets = ({x, y, w, h, draw, color = COL.mint}: {x: number; y: number; w: number; h: number; draw: number; color?: string}) => {
  const c = 44;
  const corners = [
    `M${x} ${y + c} L${x} ${y} L${x + c} ${y}`,
    `M${x + w - c} ${y} L${x + w} ${y} L${x + w} ${y + c}`,
    `M${x + w} ${y + h - c} L${x + w} ${y + h} L${x + w - c} ${y + h}`,
    `M${x + c} ${y + h} L${x} ${y + h} L${x} ${y + h - c}`,
  ];
  return (
    <>
      {corners.map((d) => (
        <Trace key={d} d={d} draw={draw} color={color} width={3} join="miter" />
      ))}
    </>
  );
};

const Warehouse = ({t}: {t: number}) => {
  const {from, to} = scene('A07');
  const x = track([[37.3, 352], [40.4, 340]], t);
  const y = track([[37.3, 1222], [40.4, 1240]], t);
  const k = fadeOut(t, to - 0.25);
  return (
    <AbsoluteFill style={{opacity: k}}>
      <Grade />
      <GroundGrid t={t} at={from + 0.1} />
      <Svg>
        <Brackets x={x} y={y} w={540} h={340} draw={ramp(t, T.wh - 0.1, T.wh + 0.5, easeInOut)} />
        <Trace d={`M${x + 270} ${y} L${x + 270} 690 L${M} 690`} draw={ramp(t, T.wh + 0.2, T.wh + 1, easeInOut)} width={2} />
      </Svg>
      <div style={{position: 'absolute', left: M, top: 330}}>
        <Reveal t={t} at={T.wh}>
          <div style={{...LABEL, color: COL.ice}}>Агуулах</div>
        </Reveal>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8}}>
          <Reveal t={t} at={T.wh + 0.08}>
            <div style={{...value(220), color: '#FFFFFF'}}>{count(t, T.wh, 1, 0, 2500).toLocaleString('en-US').replace(',', ' ')}</div>
          </Reveal>
          <Reveal t={t} at={T.wh + 0.3}>
            <div style={{...title(72), color: COL.ice}}>м²</div>
          </Reveal>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Showroom = ({t}: {t: number}) => {
  const {to} = scene('A08');
  const roof = 'M68 912 L356 1268 L1080 1062';
  const k = fadeOut(t, to - 0.25);
  return (
    <AbsoluteFill style={{opacity: k}}>
      <AbsoluteFill style={{background: `linear-gradient(0deg, ${COL.bg}F0 0%, ${COL.bg}B0 20%, ${COL.bg}00 40%)`}} />
      <Svg>
        <Trace d={roof} draw={ramp(t, T.show - 0.1, T.show + 1, easeInOut)} color={COL.mint} width={3} />
        <Trace d={pulseRule(M, 1446, W - M * 2)} draw={ramp(t, T.show, T.show + 0.9, easeInOut)} width={2.5} />
      </Svg>
      <div style={{position: 'absolute', left: M, top: 1478}}>
        <Reveal t={t} at={T.show2 - 0.6}>
          <div style={{...LABEL, color: COL.ice}}>Шоурум</div>
        </Reveal>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8}}>
          <Reveal t={t} at={T.show + 0.05}>
            <div style={{...value(220), color: '#FFFFFF'}}>{count(t, T.show, 0.9, 0, 600)}</div>
          </Reveal>
          <Reveal t={t} at={T.show + 0.3}>
            <div style={{...title(72), color: COL.ice}}>м²</div>
          </Reveal>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Stock = ({t}: {t: number}) => {
  const {from, to} = scene('A09');
  const k = fadeOut(t, to - 0.2);
  return (
    <AbsoluteFill style={{opacity: k}}>
      <Grade />
      <GroundGrid t={t} at={from + 0.1} />
      <Svg>
        <Trace d={pulseRule(M, 340, W - M * 2, 0.7)} draw={ramp(t, T.stock - 0.2, T.stock + 0.7, easeInOut)} width={2.5} />
      </Svg>
      <div style={{position: 'absolute', left: M, right: M, top: 384}}>
        <Reveal t={t} at={T.stock}>
          <div style={{...LABEL, color: COL.ice}}>Олон төрлийн тоног төхөөрөмж</div>
        </Reveal>
        <Reveal t={t} at={T.stock2}>
          <div style={{...title(96), marginTop: 18, color: '#FFFFFF'}}>Урьдчилан</div>
        </Reveal>
        <Reveal t={t} at={T.stock2 + 0.3}>
          <div style={{...title(96), color: '#FFFFFF'}}>нөөцөлдөг</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

export const FootageScenes = ({t}: {t: number}) => (
  <>
    {active(t, 'A07', 0.1) ? <Warehouse t={t} /> : null}
    {active(t, 'A08', 0.1) ? <Showroom t={t} /> : null}
    {active(t, 'A09', 0.1) ? <Stock t={t} /> : null}
    {t > scene('A07').from + 0.2 && t < scene('A09').to ? <CornerLogo /> : null}
  </>
);

// ---------- A03: where the equipment goes ----------

const PLACES = [
  {label: 'Албан газар', at: T.place1, pin: [430, 150]},
  {label: 'Зочид буудал', at: T.place2, pin: [690, 262]},
  {label: 'Амралтын газар', at: T.place3, pin: [300, 268]},
  {label: 'Жуулчны бааз', at: T.place4, pin: [150, 120]},
  {label: 'Сувилал', at: T.place5, pin: [806, 196]},
  {label: 'Фитнес клуб', at: T.place6, pin: [520, 330]},
  {label: 'Орон сууц', at: T.place7, pin: [640, 110]},
];

const TILT = 44;
const MAP_W = 936;

const Pin = ({t, at, x, y, hub = false}: {t: number; at: number; x: number; y: number; hub?: boolean}) => {
  const k = ramp(t, at, at + 0.5, expoOut);
  const stem = hub ? 96 : 62;
  const ping = ((t - at) % 1.6) / 1.6;
  return (
    <div style={{position: 'absolute', left: (x / 1000) * MAP_W, top: (y / MONGOLIA_H) * MAP_W * (MONGOLIA_H / 1000), width: 0, height: 0, transformStyle: 'preserve-3d'}}>
      {t > at ? <div style={{position: 'absolute', left: -60, top: -60, width: 120, height: 120, borderRadius: 60, border: `2px solid ${hub ? COL.mint : COL.blue}`, opacity: (1 - ping) * 0.7, transform: `scale(${ping})`}} /> : null}
      <div style={{position: 'absolute', left: -1, bottom: 0, width: 2, height: stem * k, background: hub ? COL.mint : COL.blue, transformOrigin: '50% 100%', transform: `rotateX(${-TILT}deg)`}} />
      <div style={{position: 'absolute', left: -7, bottom: stem * k * 1 - 7, width: 14, height: 14, borderRadius: 7, background: hub ? COL.mint : COL.blue, transformOrigin: `50% ${stem * k + 7}px`, transform: `rotateX(${-TILT}deg)`, opacity: k}} />
    </div>
  );
};

const A03 = ({t}: {t: number}) => {
  const {from, to} = scene('A03');
  const out = ramp(t, to - 0.3, to + 0.2, easeInOut);
  const mapDraw = ramp(t, from + 0.15, from + 1.5, easeInOut);
  const mapH = MAP_W * (MONGOLIA_H / 1000);
  return (
    <Layer z={-out * 260} style={{opacity: 1 - out}}>
      <Layer z={70}>
        <div style={{position: 'absolute', left: M, right: M, top: 330}}>
          <Reveal t={t} at={from + 0.3}>
            <div style={title(84)}>Таны төсөлд</div>
          </Reveal>
          <Reveal t={t} at={from + 0.5}>
            <div style={{...title(84), color: COL.blue}}>тохирсон</div>
          </Reveal>
        </div>
      </Layer>
      <div style={{position: 'absolute', left: M, top: 590, width: MAP_W, height: mapH, transform: `rotateX(${TILT}deg)`, transformOrigin: '50% 50%', transformStyle: 'preserve-3d'}}>
        <svg width={MAP_W} height={mapH} viewBox={`0 0 1000 ${MONGOLIA_H}`} style={{position: 'absolute', overflow: 'visible'}}>
          <defs>
            <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.7" fill={COL.blue} />
            </pattern>
            <clipPath id="land">
              <path d={MONGOLIA} />
            </clipPath>
          </defs>
          <g clipPath="url(#land)" opacity={ramp(t, from + 1, from + 1.9) * 0.34}>
            <rect x={0} y={0} width={1000} height={MONGOLIA_H} fill="url(#dots)" />
          </g>
          <Trace d={MONGOLIA} draw={mapDraw} width={3} />
          {PLACES.map((p) => (
            <Trace key={p.label} d={`M${UB[0]} ${UB[1]} Q${(UB[0] + p.pin[0]) / 2} ${(UB[1] + p.pin[1]) / 2 - 40} ${p.pin[0]} ${p.pin[1]}`} draw={ramp(t, p.at - 0.25, p.at + 0.3, easeInOut)} width={2} color={COL.mint} glow={0.7} />
          ))}
        </svg>
        <Pin t={t} at={from + 0.9} x={UB[0]} y={UB[1]} hub />
        {PLACES.map((p) => (
          <Pin key={p.label} t={t} at={p.at + 0.2} x={p.pin[0]} y={p.pin[1]} />
        ))}
      </div>
      <Layer z={110}>
        <Svg>
          {PLACES.map((p, i) => {
            const [x, y] = [M + (i % 2) * 484, 1130 + Math.floor(i / 2) * 118];
            const k = ramp(t, p.at - 0.1, p.at + 0.35, easeInOut);
            return <Trace key={p.label} d={rrect(x, y, 452, 94, 47)} draw={k} width={2} glow={0.6} />;
          })}
        </Svg>
        {PLACES.map((p, i) => {
          const [x, y] = [M + (i % 2) * 484, 1130 + Math.floor(i / 2) * 118];
          return (
            <div key={p.label} style={{position: 'absolute', left: x + 38, top: y + 22, width: 400}}>
              <Reveal t={t} at={p.at} dur={0.6}>
                <div style={{...title(40), fontWeight: 400}}>{p.label}</div>
              </Reveal>
            </div>
          );
        })}
      </Layer>
    </Layer>
  );
};

// ---------- A04: seven steps, one pipeline ----------

type Clip = {from: number; y: number; s: number; rate?: number};
type Step = {label: string; at: number; end: number; clip?: Clip};

const STEPS: Step[] = [
  {label: 'Зураг төсөл', at: T.step1, end: T.step2, clip: {from: 21.95, y: 1440, s: 1}},
  {label: 'Интерьер', at: T.step2, end: T.step3, clip: {from: 17.0, y: 960, s: 1.3}},
  {label: 'Сонголт', at: T.step3, end: T.step4, clip: {from: 19.8, y: 960, s: 1.3}},
  {label: 'Байрлал', at: T.step4, end: T.step5, clip: {from: 23.0, y: 1180, s: 1}},
  {label: 'Хүргэлт', at: T.step5, end: T.step6},
  {label: 'Угсралт', at: T.step6, end: T.step7, clip: {from: 25.0, y: 1100, s: 1}},
  {label: 'Зөвлөгөө', at: T.step7, end: 28.8, clip: {from: 26.2, y: 760, s: 1, rate: 0.7}},
];

const CARD = {x: M, y: 300, w: 936, h: 700};

const ClipCard = ({clip, at}: {clip: Clip; at: number}) => {
  const w = CARD.w * clip.s;
  const scale = w / 1080;
  return (
    <Sequence from={Math.round(at * FPS)} layout="none">
      <OffthreadVideo
        src={staticFile(cues.source)}
        muted
        trimBefore={Math.round(clip.from * FPS)}
        playbackRate={clip.rate ?? 1}
        style={{position: 'absolute', width: w, height: w * (16 / 9), left: (CARD.w - w) / 2, top: CARD.h / 2 - clip.y * scale}}
      />
    </Sequence>
  );
};

const Delivery = ({t}: {t: number}) => {
  const k = ramp(t, T.step5 - 0.05, T.step5 + 0.55, expoOut);
  const w = 860;
  const scale = w / 1182;
  return (
    <div style={{position: 'absolute', inset: 0, background: '#070C14'}}>
      <svg width={CARD.w} height={CARD.h} style={{position: 'absolute'}}>
        <Trace d={`M0 ${556} L${CARD.w} ${556}`} width={2} glow={0.7} />
      </svg>
      <div style={{position: 'absolute', left: 38 - (1 - k) * 260, top: 556 - 518 * scale + 8, width: w}}>
        <Img src={staticFile('fitzone-v2/truck.png')} style={{width: w, display: 'block'}} />
        <div style={{position: 'absolute', left: 150 * scale, top: 74 * scale, width: 560 * scale}}>
          <Mark width={190} color={COL.blue} glow={0} />
          <Img src={staticFile(LOGO_WORD)} style={{position: 'absolute', left: 200, top: 16, width: 170, filter: 'brightness(0.16)'}} />
        </div>
      </div>
    </div>
  );
};

const Steps = ({t}: {t: number}) => {
  let on = 0;
  STEPS.forEach((s, i) => {
    if (t >= s.at) on = i;
  });
  return (
    <>
      {[on - 1, on].filter((i) => i >= 0).map((i) => {
        const s = STEPS[i];
        const isOn = i === on;
        const k = ramp(t, s.at, s.at + 0.42, expoOut);
        const prev = isOn ? 0 : ramp(t, STEPS[on].at, STEPS[on].at + 0.42, expoOut);
        const x = isOn ? (1 - k) * 170 : -prev * 70;
        const z = isOn ? (1 - k) * 60 : -prev * 150;
        return (
          <div
            key={s.label}
            style={{position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 28, overflow: 'hidden', background: '#070C14', transform: `translate3d(${x}px, 0, ${z}px)`, opacity: isOn ? k : 1 - prev * 0.8, boxShadow: `0 0 0 1.5px ${COL.hair}`}}
          >
            {s.clip ? <ClipCard clip={s.clip} at={s.at} /> : <Delivery t={t} />}
          </div>
        );
      })}
    </>
  );
};

const A04 = ({t}: {t: number}) => {
  const {from, to} = scene('A04');
  const enter = ramp(t, from - 0.1, from + 0.5, easeInOut);
  const out = ramp(t, to - 0.2, to + 0.2, easeInOut);
  let on = -1;
  STEPS.forEach((s, i) => {
    if (t >= s.at) on = i;
  });
  const whole = ramp(t, T.whole, T.whole + 0.5, easeInOut);
  const gap = (W - M * 2) / (STEPS.length - 1);
  const nodeY = 1124;
  // The tracker glides between stops; it takes the last 0.3 s of each step to get there.
  const at = STEPS.reduce((v, s, i) => (i === 0 ? v : v + ramp(t, s.at - 0.16, s.at + 0.2, easeInOut)), 0);
  const tipX = Math.min(W - M - 150, Math.max(M + 150, M + at * gap));
  const shown = on >= 0 ? STEPS[on] : STEPS[0];
  return (
    <Layer style={{opacity: enter * (1 - out)}}>
      <Layer z={30}>
        <Steps t={t} />
      </Layer>
      <Layer z={110}>
        <Svg>
          <line x1={M} x2={W - M} y1={nodeY} y2={nodeY} stroke={COL.hair} strokeWidth={2} />
          <Trace d={`M${M} ${nodeY} L${M + Math.min(at + 0.001, STEPS.length - 1) * gap} ${nodeY}`} color={COL.mint} width={3} />
          {STEPS.map((s, i) => {
            const done = i <= at + 0.01;
            return (
              <g key={s.label}>
                <circle cx={M + i * gap} cy={nodeY} r={done ? 11 : 8} fill={done ? COL.mint : COL.bg} stroke={done ? COL.mint : COL.dim} strokeWidth={2} />
                {i === on && whole < 1 ? <circle cx={M + i * gap} cy={nodeY} r={11 + ramp(t, s.at, s.at + 0.6) * 22} fill="none" stroke={COL.mint} strokeWidth={2} opacity={1 - ramp(t, s.at, s.at + 0.6)} /> : null}
              </g>
            );
          })}
        </Svg>
        <div style={{position: 'absolute', left: tipX - 150, top: nodeY - 88, width: 300, display: 'flex', justifyContent: 'center', opacity: 1 - whole}}>
          <div style={{background: '#FFFFFF', color: COL.bg, fontFamily: "'Inter', sans-serif", fontSize: 30, fontWeight: 600, padding: '9px 24px', borderRadius: 30}}>{shown.label}</div>
        </div>
        <div style={{position: 'absolute', left: M, right: M, top: 1190, display: 'flex', justifyContent: 'space-between', opacity: 1 - whole}}>
          <div style={LABEL}>Алхам</div>
          <div style={{...LABEL, color: COL.ice, fontVariantNumeric: 'tabular-nums'}}>{String(Math.max(on, 0) + 1).padStart(2, '0')} / 07</div>
        </div>
        <div style={{position: 'absolute', left: M, right: M, top: 1262}}>
          {STEPS.map((s, i) =>
            i === on ? (
              <div key={s.label} style={{position: 'absolute', opacity: 1 - ramp(t, T.whole - 0.24, T.whole, easeInOut)}}>
                <Reveal t={t} at={s.at} dur={0.5}>
                  <div style={value(120)}>{s.label}</div>
                </Reveal>
              </div>
            ) : null,
          )}
          <Reveal t={t} at={T.whole}>
            <div style={{...title(118), color: '#FFFFFF'}}>Иж бүрэн</div>
          </Reveal>
          <Reveal t={t} at={T.oneRoof}>
            <div style={{...title(118), color: COL.blue}}>нэг дор</div>
          </Reveal>
        </div>
      </Layer>
    </Layer>
  );
};

// ---------- A10: see it yourself ----------

const HERO = {x: 62, y: 700, w: 956, h: 772};

type Call = {label: string; at: number; px: number; py: number; lx: number; ly: number; tone?: string};

const CALLS: Call[] = [
  {label: 'Үзэх', at: T.see, px: 196, py: 738, lx: M, ly: 530},
  {label: 'Турших', at: T.try, px: 650, py: 1198, lx: 190, ly: 1560},
  {label: 'Харьцуулах', at: T.compare, px: 612, py: 846, lx: 708, ly: 530},
  {label: 'Сонгох', at: T.choose, px: 952, py: 1282, lx: 708, ly: 1560, tone: COL.mint},
];

const A10 = ({t}: {t: number}) => {
  const {from, to} = scene('A10');
  const enter = ramp(t, from, from + 0.4, easeInOut);
  const out = ramp(t, to - 0.25, to + 0.15, easeInOut);
  const scan = ramp(t, from + 0.4, from + 2.6, easeInOut);
  const scanY = HERO.y + scan * HERO.h;
  const photo = ramp(t, from + 2.5, from + 3.5, easeInOut);
  const self = ramp(t, T.self - 0.26, T.self, easeInOut);
  return (
    <Layer style={{opacity: enter * (1 - out)}}>
      <Layer z={20}>
        <Img src={staticFile('fitzone-v2/treadmill.png')} style={{position: 'absolute', left: HERO.x, top: HERO.y, width: HERO.w, opacity: photo}} />
        <div style={{position: 'absolute', left: HERO.x, top: HERO.y, width: HERO.w, height: HERO.h, clipPath: `inset(0 0 ${(1 - scan) * 100}% 0)`, opacity: 1 - photo * 0.72}}>
          <Img src={staticFile('fitzone-v2/treadmill-lines.png')} style={{width: HERO.w, display: 'block'}} />
        </div>
        {scan > 0 && scan < 1 ? (
          <Svg>
            <Trace d={`M${HERO.x - 20} ${scanY} L${HERO.x + HERO.w + 20} ${scanY}`} width={2.5} />
          </Svg>
        ) : null}
      </Layer>
      <Layer z={90}>
        <div style={{position: 'absolute', left: M, right: M, top: 340}}>
          <div style={{position: 'absolute', opacity: 1 - self}}>
            <Reveal t={t} at={T.notPhoto}>
              <div style={LABEL}>Зураг хараад биш</div>
            </Reveal>
          </div>
          <Reveal t={t} at={T.self}>
            <div style={{...title(112), color: '#FFFFFF'}}>Өөрийн биеэр</div>
          </Reveal>
        </div>
      </Layer>
      <Layer z={140}>
        <Svg>
          {CALLS.map((c) => {
            const k = ramp(t, c.at - 0.2, c.at + 0.3, easeInOut);
            const tone = c.tone ?? COL.blue;
            const textY = c.ly > c.py ? c.ly : c.ly + 88;
            return (
              <g key={c.label}>
                {k > 0 ? <circle cx={c.px} cy={c.py} r={7 + 3 * k} fill={tone} /> : null}
                <Trace d={`M${c.px} ${c.py} L${c.px} ${(c.py + textY) / 2} L${c.lx + 130} ${(c.py + textY) / 2} L${c.lx + 130} ${textY}`} draw={k} color={tone} width={2} glow={0.7} join="miter" />
                <Trace d={rrect(c.lx, c.ly, 300, 88, 44)} draw={ramp(t, c.at, c.at + 0.4, easeInOut)} color={tone} width={2} glow={0.7} />
              </g>
            );
          })}
        </Svg>
        {CALLS.map((c) => (
          <div key={c.label} style={{position: 'absolute', left: c.lx, top: c.ly + 19, width: 300, textAlign: 'center'}}>
            <Reveal t={t} at={c.at + 0.1} dur={0.5}>
              <div style={{...title(40), fontWeight: 400, color: c.tone ?? COL.ice}}>{c.label}</div>
            </Reveal>
          </div>
        ))}
      </Layer>
    </Layer>
  );
};

// ---------- A11: no waiting ----------

const A11 = ({t}: {t: number}) => {
  const {from, to} = scene('A11');
  const enter = ramp(t, from, from + 0.4, easeInOut);
  const out = ramp(t, to - 0.2, to + 0.15, easeInOut);
  const bar = ramp(t, T.order, T.months + 0.3, easeInOut);
  const strike = ramp(t, T.noNeed - 0.1, T.noNeed + 0.35, easeInOut);
  const y = 1040;
  return (
    <Layer style={{opacity: enter * (1 - out)}}>
      <Layer z={60}>
        <div style={{position: 'absolute', left: M, right: M, top: 560}}>
          <Reveal t={t} at={T.order}>
            <div style={LABEL}>Захиалгын хугацаа</div>
          </Reveal>
          <Reveal t={t} at={T.months - 0.05}>
            <div style={{...value(230), marginTop: 18, opacity: 1 - strike * 0.68}}>2–3 сар</div>
          </Reveal>
        </div>
      </Layer>
      <Layer z={110}>
        <Svg>
          <line x1={M} x2={W - M} y1={y} y2={y} stroke={COL.hair} strokeWidth={2} />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={M + i * 312} x2={M + i * 312} y1={y - 12} y2={y + 12} stroke={COL.dim} strokeWidth={2} />
          ))}
          <Trace d={`M${M} ${y} L${W - M} ${y}`} draw={bar} width={3} />
          <Trace d={`M${M - 12} 824 L${W - M + 12} 742`} draw={strike} color={COL.mint} width={4} />
        </Svg>
        <div style={{position: 'absolute', left: M, right: M, top: 1104}}>
          <Reveal t={t} at={T.noNeed} dur={0.6}>
            <div style={{...title(96), color: '#FFFFFF'}}>Хүлээх</div>
          </Reveal>
          <Reveal t={t} at={T.noNeed + 0.14} dur={0.6}>
            <div style={{...title(96), color: COL.mint}}>шаардлагагүй</div>
          </Reveal>
        </div>
      </Layer>
    </Layer>
  );
};

// ---------- A12: time and money ----------

const Ring = ({t, at, cx, label}: {t: number; at: number; cx: number; label: string}) => {
  const r = 200;
  const cy = 800;
  return (
    <>
      <Svg>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.hair} strokeWidth={2} />
        <Trace d={`M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.1} ${cy - r}`} draw={ramp(t, at - 0.3, at + 0.4, easeInOut)} width={4} />
      </Svg>
      <div style={{position: 'absolute', left: cx - r, top: cy - 44, width: r * 2, textAlign: 'center'}}>
        <Reveal t={t} at={at - 0.05} dur={0.5}>
          <div style={{...title(68), color: '#FFFFFF'}}>{label}</div>
        </Reveal>
      </div>
    </>
  );
};

const A12 = ({t}: {t: number}) => {
  const {from, to} = scene('A12');
  const enter = ramp(t, from, from + 0.3, easeInOut);
  const out = ramp(t, to - 0.2, to + 0.1, easeInOut);
  return (
    <Layer style={{opacity: enter * (1 - out)}}>
      <Layer z={70}>
        <Ring t={t} at={T.time} cx={294} label="Цаг" />
        <Ring t={t} at={T.money} cx={786} label="Санхүү" />
      </Layer>
      <Layer z={120}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1090, textAlign: 'center'}}>
          <Reveal t={t} at={T.save} dur={0.5}>
            <div style={{...value(170), color: COL.blue}}>хэмнэнэ</div>
          </Reveal>
        </div>
      </Layer>
    </Layer>
  );
};

// ---------- A13: the brands ----------

const BRANDS = [
  {file: 'nordictrack', at: T.brand1, w: 376},
  {file: 'proform', at: T.brand2, w: 214},
  {file: 'dhz', at: T.brand3, w: 300},
  {file: 'realleader', at: T.brand4, w: 356},
];

const A13 = ({t}: {t: number}) => {
  const {from, to} = scene('A13');
  const enter = ramp(t, from, from + 0.3, easeInOut);
  const out = ramp(t, to - 0.25, to + 0.1, easeInOut);
  const check = ramp(t, T.official - 0.1, T.official + 0.5, easeInOut);
  return (
    <Layer style={{opacity: enter * (1 - out)}}>
      {BRANDS.map((b, i) => {
        const [x, y] = [M + (i % 2) * 484, 330 + Math.floor(i / 2) * 306];
        const k = ramp(t, b.at - 0.15, b.at + 0.5, expoOut);
        return (
          <Layer key={b.file} z={40 + i * 26}>
            <div style={{position: 'absolute', left: x, top: y, width: 452, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COL.panel, borderRadius: 24, opacity: k}}>
              <Img src={staticFile(`fitzone-v2/brand-${b.file}.png`)} style={{width: b.w, transform: `scale(${0.94 + 0.06 * k})`}} />
            </div>
            <Svg>
              <Trace d={rrect(x, y, 452, 280, 24)} draw={ramp(t, b.at - 0.15, b.at + 0.4, easeInOut)} width={2} glow={0.7} />
            </Svg>
          </Layer>
        );
      })}
      <Layer z={150}>
        <div style={{position: 'absolute', left: M, right: M, top: 1000}}>
          <Reveal t={t} at={T.world}>
            <div style={LABEL}>Дэлхийд танигдсан брендүүд</div>
          </Reveal>
          <Reveal t={t} at={T.official}>
            <div style={{...title(92), marginTop: 22, color: '#FFFFFF'}}>Албан ёсны</div>
          </Reveal>
          <Reveal t={t} at={T.official + 0.5}>
            <div style={{...title(92), color: COL.blue}}>онцгой эрхтэй</div>
          </Reveal>
        </div>
        <Svg>
          <Trace d="M892 1254 L920 1282 L976 1220" draw={check} color={COL.mint} width={5} />
        </Svg>
      </Layer>
    </Layer>
  );
};

// ---------- A14: the pulse becomes the logo ----------

const A14 = ({t}: {t: number}) => {
  const {from} = scene('A14');
  const enter = ramp(t, from, from + 0.3, easeInOut);
  const pulse = ramp(t, T.mark, T.mark + 1, easeInOut);
  const bars = ramp(t, T.mark + 0.55, T.mark + 1.2, expoOut);
  const word = ramp(t, T.mark + 0.9, T.mark + 1.5, easeInOut);
  const beat = Math.sin((t - T.mark) * 2.4) * 0.5 + 0.5;
  return (
    <Layer z={40} style={{opacity: enter}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center'}}>
        <Mark width={560} pulse={pulse} bars={bars} glow={0.45 + beat * 0.3} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 882, display: 'flex', justifyContent: 'center', opacity: word}}>
        <Img src={staticFile(LOGO_WORD)} style={{width: 560}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1210, textAlign: 'center'}}>
        <Reveal t={t} at={T.tagline}>
          <div style={{...title(62), color: COL.dim}}>Таны фитнесийн</div>
        </Reveal>
        <Reveal t={t} at={T.tagline + 0.8}>
          <div style={{...title(88), marginTop: 8, color: '#FFFFFF'}}>найдвартай түнш</div>
        </Reveal>
        <Reveal t={t} at={T.url}>
          <div style={{...LABEL, fontSize: 44, marginTop: 52, color: COL.blue, textTransform: 'none', letterSpacing: '0.04em'}}>fitzone.mn</div>
        </Reveal>
      </div>
    </Layer>
  );
};

export const HudScenes = ({t}: {t: number}) => (
  <>
    <Stage cam={camAt(t)}>
      {active(t, 'A03') ? <A03 t={t} /> : null}
      {active(t, 'A04', 0.3) ? <A04 t={t} /> : null}
      {active(t, 'A10', 0.2) ? <A10 t={t} /> : null}
      {active(t, 'A11', 0.2) ? <A11 t={t} /> : null}
      {active(t, 'A12', 0.2) ? <A12 t={t} /> : null}
      {active(t, 'A13', 0.2) ? <A13 t={t} /> : null}
      {active(t, 'A14') ? <A14 t={t} /> : null}
    </Stage>
    {t < scene('A14').from ? (
      <>
        <CornerLogo />
        <PulseStrip t={t} />
      </>
    ) : null}
  </>
);
