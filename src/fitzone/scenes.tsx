import * as THREE from 'three';
import {BarRig, Cam, ContactShadow, HexHead, Kettlebell, M, Plate, Rod, ShadowFloor, ShadowWall, Studio, blueText, box, deepText, inkText, knurledRod, redText, skyText, whiteText} from './kit';
import {Text3D, WrapText} from './text';

// The fourteen key poses. The thread: every proof in the script is cast as weight. Plates pile up on one
// bar and the stack ends as the tower under the logo. This pass holds each pose still.

const WARM_GOLD = {warm: '#ffd9a0', cool: '#a9c4ea', rim: '#fff0da'};
const RED_ROOM = {warm: '#fff0ea', cool: '#ffc9c0', rim: '#ff8473', power: 0.8};
const DAYLIGHT = {warm: '#fff8ee', cool: '#bcd8ff', rim: '#ffffff'};

const P16 = {top: '16', topSize: 0.5, bottom: 'ЖИЛИЙН ТУРШЛАГА', bottomSize: 0.136};
const P2011 = {top: '2011', topSize: 0.4, bottom: 'ОНООС ХОЙШ', bottomSize: 0.17};
const P140 = {top: '140+', topSize: 0.4, bottom: 'БАЙГУУЛЛАГА', bottomSize: 0.16};

// ---------- S01–S02: the first plate ----------

const BarLow = ({plates}: {plates: (typeof P16)[]}) => (
  <group position={[-0.52, -1.36, 2]} rotation={[0.03, -0.42, 0.05]}>
    <BarRig plates={plates} />
  </group>
);

export const S01 = () => (
  <>
    <Cam pos={[0, 0, 16]} />
    <Studio {...WARM_GOLD} sun={[-5, 7, 9]} lamp={[-1.5, 0.1, 3.5]} lampPower={7} />
    <BarLow plates={[P16]} />
    <ShadowWall z={0.2} />
  </>
);

export const S02 = () => (
  <>
    <Cam pos={[1.5, 0.9, 16]} />
    <Studio {...WARM_GOLD} sun={[-3, 8, 8]} sunPower={1.2} />
    <group position={[0, -1.72, 0.6]} rotation={[0, -0.16, 0.012]}>
      <group position={[0, 0.74, 0]}>
        <Text3D text="ХАМТАРЧ АЖИЛЛАХАД" size={0.19} depth={0.08} bevel={0.009} weight={800} {...inkText} />
      </group>
      <group position={[0, 0.1, 0]}>
        <Text3D text="БЭЛЭН" size={0.74} depth={0.26} bevel={0.022} {...blueText} />
      </group>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.02, 0.13]} material={knurledRod(8, 0.08)} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 8, 32]} />
      </mesh>
    </group>
    <ShadowWall z={0} opacity={0.34} />
  </>
);

// ---------- S03: seven kinds of project on a kettlebell rack ----------

const RACK: {y: number; items: {x: number; lines: string[]}[]}[] = [
  {y: 0.02, items: [{x: -0.62, lines: ['АЛБАН', 'ГАЗАР']}, {x: 0.62, lines: ['ЗОЧИД', 'БУУДАЛ']}]},
  {y: -1.48, items: [{x: -1.2, lines: ['АМРАЛТЫН', 'ГАЗАР']}, {x: 0, lines: ['ЖУУЛЧНЫ', 'БААЗ']}, {x: 1.2, lines: ['СУВИЛАЛ']}]},
  {y: -2.98, items: [{x: -0.62, lines: ['ФИТНЕС', 'КЛУБ']}, {x: 0.62, lines: ['ОРОН', 'СУУЦ']}]},
];

export const S03 = () => (
  <>
    <Cam pos={[1.6, 0.7, 20]} target={[0, -0.28, 0]} fov={18} />
    <Studio {...DAYLIGHT} sun={[-5, 9, 9]} shadowSize={5} />
    <group position={[0, 2.24, 0]}>
      <Text3D text="ТАНЫ ТӨСӨЛД" size={0.3} depth={0.09} bevel={0.01} {...whiteText} />
      <group position={[0, -0.36, 0]}>
        <Text3D text="ТОХИРСОН" size={0.3} depth={0.09} bevel={0.01} {...blueText} />
      </group>
    </group>
    {RACK.map((row) => (
      <group key={row.y}>
        <mesh geometry={box(3.9, 0.07, 0.86, 0.03)} material={M.gunmetal} position={[0, row.y - 0.03, 0]} castShadow receiveShadow />
        {row.items.map((kb) => (
          <group key={kb.lines[0]} position={[kb.x, row.y + 0.55 * 0.86, 0]} scale={0.56}>
            <Kettlebell lines={kb.lines} />
          </group>
        ))}
      </group>
    ))}
    {[-2, 2].map((x) => (
      <mesh key={x} geometry={box(0.09, 3.3, 0.6, 0.03)} material={M.gunmetal} position={[x, -1.5, -0.1]} castShadow />
    ))}
  </>
);

// ---------- S04: seven services as one weight stack ----------

const STACK = ['ЗУРАГ ТӨСӨЛ', 'ИНТЕРЬЕР', 'СОНГОЛТ', 'БАЙРЛАЛ', 'ХҮРГЭЛТ', 'УГСРАЛТ', 'ЗӨВЛӨГӨӨ'];
const STACK_H = 0.43;
const STACK_GAP = 0.03;

export const S04 = () => {
  const y = (i: number) => 1.16 - i * (STACK_H + STACK_GAP);
  return (
    <>
      <Cam pos={[-2.6, 1.3, 19]} target={[0, -0.2, 0]} fov={18} />
      <Studio {...DAYLIGHT} sun={[-6, 8, 10]} shadowSize={5} lamp={[-2, 1.6, 3]} lampPower={5} />
      <group position={[0, 1.86, 0]}>
        <Text3D text="ИЖ БҮРЭН" size={0.36} depth={0.1} bevel={0.012} {...whiteText} />
      </group>
      <mesh geometry={box(2.9, 0.22, 1.2, 0.05)} material={M.gunmetal} position={[0, y(0) + 0.35, 0]} castShadow />
      {STACK.map((label, i) => (
        <group key={label} position={[0, y(i), 0]}>
          <mesh geometry={box(2.9, STACK_H, 1.2, 0.04)} material={M.rubberMatte} castShadow receiveShadow />
          <group position={[-1.26, -0.08, 0.595]}>
            <Text3D text={label} size={0.22} depth={0.022} bevel={0.005} align="left" {...whiteText} />
          </group>
          <group position={[1.26, -0.07, 0.595]}>
            <Text3D text={String(i + 1)} size={0.19} depth={0.02} bevel={0.004} align="right" face={M.steel} side={M.gunmetal} />
          </group>
        </group>
      ))}
      <group position={[0.5, y(6), 0.6]}>
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
          <Rod length={0.42} r={0.05} />
        </group>
        <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={M.blue} castShadow>
          <cylinderGeometry args={[0.13, 0.1, 0.24, 32]} />
        </mesh>
      </group>
      {[-1.02, 1.02].map((x) => (
        <group key={x} position={[x, -2.6, 0]}>
          <Rod length={2} r={0.05} />
        </group>
      ))}
      <group position={[0, -2.42, 0.4]}>
        <Text3D text="НЭГ ДОР" size={0.46} depth={0.14} bevel={0.016} {...blueText} />
      </group>
    </>
  );
};

// ---------- S05–S06: the bar takes on more plates ----------

export const S05 = () => (
  <>
    <Cam pos={[0, 0, 16]} />
    <Studio {...RED_ROOM} sun={[-4, 7, 9]} lamp={[-1.5, 0.1, 3.5]} lampPower={7} />
    <BarLow plates={[P2011, P16]} />
    <ShadowWall z={0.2} />
  </>
);

export const S06 = () => (
  <>
    <Cam pos={[0, 0, 16]} />
    <Studio {...RED_ROOM} sun={[-4, 7, 9]} lamp={[-1.5, 0.1, 3.5]} lampPower={7} />
    <BarLow plates={[P140, P2011, P16]} />
    <ShadowWall z={0.2} />
  </>
);

// ---------- S07–S09: giant plates dropped into the aerial shots ----------

// Drone framing read off the footage: horizon at 790 px, about 50° of vertical view.
export const S07 = () => (
  <>
    <Cam pos={[0, 0.9, 4.8]} target={[0, 0.506, 0]} fov={50} roll={-0.012} />
    <Studio {...DAYLIGHT} sun={[-7, 6, 1.5]} sunPower={2.6} shadowSize={5} lamp={[-1.2, 1.8, 2.6]} lampPower={3} />
    <group position={[0.12, 1, 0]} rotation={[0, 0.34, 0]}>
      <Plate top="2500" topSize={0.38} bottom="АГУУЛАХ" bottomSize={0.2} width={0.32} />
    </group>
    <ShadowFloor y={0} opacity={0.55} />
    <ContactShadow position={[0.2, 0.004, 0.02]} size={[3, 0.9]} opacity={0.75} />
  </>
);

export const S08 = () => (
  <>
    <Cam pos={[0, 3.9, 5.1]} target={[-0.1, 0.1, 0]} fov={50} roll={0.03} />
    <Studio {...DAYLIGHT} sun={[-7, 7, -1]} sunPower={2.6} shadowSize={5} lamp={[-1, 2.4, 2.6]} lampPower={4} />
    <group position={[0, 1, 0]} rotation={[0, 0.5, 0]}>
      <Plate top="600" topSize={0.46} bottom="ШОУРУМ" bottomSize={0.2} width={0.32} />
    </group>
    <ShadowFloor y={0} opacity={0.5} />
    <ContactShadow position={[0.12, 0.004, 0]} size={[2.6, 1.1]} opacity={0.72} />
  </>
);

export const S09 = () => (
  <>
    <Cam pos={[0.8, -0.3, 16]} target={[0, 0, 0]} />
    <Studio {...DAYLIGHT} sun={[-5, 8, 9]} />
    <group position={[0, 1.86, 0]} rotation={[0, -0.1, 0]}>
      <Text3D text="ОЛОН ТӨРЛИЙН" size={0.2} depth={0.08} bevel={0.008} weight={800} {...whiteText} />
      <group position={[0, -0.3, 0]}>
        <Text3D text="ТОНОГ ТӨХӨӨРӨМЖ" size={0.2} depth={0.08} bevel={0.008} weight={800} {...whiteText} />
      </group>
      <group position={[0, -0.76, 0]}>
        <Text3D text="УРЬДЧИЛАН" size={0.38} depth={0.16} bevel={0.016} {...skyText} />
      </group>
      <group position={[0, -1.24, 0]}>
        <Text3D text="НӨӨЦӨЛДӨГ" size={0.38} depth={0.16} bevel={0.016} {...skyText} />
      </group>
    </group>
  </>
);

// ---------- S10: four plyo boxes, climbed from the bottom ----------

const BOXES = [
  {text: 'ҮЗЭХ', y: -2.1, x: -0.18, turn: 0.14, h: 1.06},
  {text: 'ТУРШИХ', y: -1.02, x: 0.14, turn: -0.1, h: 1.06},
  {text: 'ХАРЬЦУУЛАХ', y: 0.06, x: -0.1, turn: 0.08, h: 1.06},
  {text: 'СОНГОХ', y: 1.14, x: 0.08, turn: -0.16, h: 1.06},
];

export const S10 = () => (
  <>
    <Cam pos={[1, 2.4, 18]} target={[0, -0.3, 0]} fov={20} />
    <Studio {...DAYLIGHT} sun={[-6, 10, 8]} sunPower={1} shadowSize={5} lamp={[-2, 3, 4]} lampPower={3} />
    <group scale={0.84}>
      {BOXES.map((b, i) => {
        const top = i === BOXES.length - 1;
        return (
          <group key={b.text} position={[b.x, b.y, 0]} rotation={[0, b.turn, 0]}>
            <mesh geometry={box(3.3, b.h, 1.9, 0.05)} material={top ? M.blueDeep : M.rubberMatte} castShadow receiveShadow />
            <group position={[0, -0.2, 0.948]}>
              <Text3D text={b.text} size={b.text.length > 7 ? 0.36 : 0.5} depth={0.03} bevel={0.006} {...whiteText} />
            </group>
          </group>
        );
      })}
    </group>
  </>
);

// ---------- S11: a plate lands on «2–3 сар» ----------

// One row per letter: x shift, y squash, z tilt. The rim presses hardest on the middle.
const CRUSH: [number, number, number][] = [
  [-0.08, 1, 0.2],
  [-0.03, 0.9, 0.34],
  [-0.01, 0.66, 0.1],
  [0.01, 0.46, -0.05],
  [0.02, 0.64, -0.1],
  [0.09, 1, -0.22],
];

export const S11 = () => (
  <>
    <Cam pos={[0, 1.6, 17]} target={[0, 0.1, 0]} fov={20} />
    <Studio {...DAYLIGHT} sun={[-5, 11, 7]} sunPower={2} shadowSize={5} lamp={[-1.6, 1.6, 3]} lampPower={8} />
    <group position={[0, 0.24, 0.06]} rotation={[0, 0.1, -0.05]} scale={1.28}>
      <Plate top="ХҮЛЭЭХ" topSize={0.215} bottom="ШААРДЛАГАГҮЙ" bottomSize={0.128} width={0.32} />
    </group>
    <group position={[0, -1.24, 0.28]}>
      <Text3D
        text="2–3 САР"
        size={0.62}
        depth={0.3}
        bevel={0.018}
        tracking={0.02}
        {...redText}
        letter={(i) => {
          const [x, sy, tilt] = CRUSH[i];
          return {position: [x, 0, 0], rotation: [0, 0, tilt], scale: [1, sy, 1]};
        }}
      />
    </group>
    <ShadowFloor y={-1.26} opacity={0.6} />
    <ContactShadow position={[0, -1.25, 0.2]} size={[4.6, 1.3]} opacity={0.8} />
  </>
);

// ---------- S12: time and money, one dumbbell ----------

export const S12 = () => (
  <>
    <Cam pos={[0, 1.7, 16]} target={[0, -0.2, 0]} fov={20} />
    <Studio {...DAYLIGHT} sun={[-5, 8, 9]} lamp={[-1.8, 1.6, 3]} lampPower={6} />
    <group position={[0, 0.56, 0]} rotation={[0.02, 0, 0.035]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={knurledRod(1.3, 0.12)} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.4, 32]} />
      </mesh>
      {[
        {x: -0.98, label: 'ЦАГ'},
        {x: 0.98, label: 'САНХҮҮ'},
      ].map((head) => (
        <group key={head.label} position={[head.x, 0, 0]}>
          <HexHead r={0.56} length={0.82} />
          <group position={[0, -0.08, 0.53]}>
            <Text3D text={head.label} size={head.label.length > 3 ? 0.16 : 0.25} depth={0.02} bevel={0.005} {...whiteText} />
          </group>
        </group>
      ))}
    </group>
    <group position={[0, -0.86, 0]}>
      <Text3D text="ХЭМНЭНЭ" size={0.5} depth={0.18} bevel={0.018} {...blueText} />
    </group>
  </>
);

// ---------- S13: the four brands on a dumbbell rack ----------

const BRANDS = ['NordicTrack', 'ProForm', 'DHZ', 'RealLeader'];
const RISE = 0.37;
const RUN = 0.34;

export const S13 = () => (
  <>
    <Cam pos={[-1.9, 2.6, 14]} target={[0, -0.35, 0]} fov={20} />
    <Studio {...DAYLIGHT} power={1.1} sun={[-6, 12, 8]} sunPower={2} shadowSize={5} lamp={[-1.6, -1, 3]} lampPower={5} />
    <group position={[0, -2.2, 0]}>
      {BRANDS.map((brand, i) => (
        <group key={brand} position={[0, (3 - i) * RISE, -(3 - i) * RUN]}>
          <mesh geometry={box(2.56, 0.05, 0.3, 0.02)} material={M.steel} position={[0, -0.18, 0]} castShadow receiveShadow />
          <mesh geometry={box(1.5, 0.28, 0.3, 0.09)} material={M.rubberMatte} castShadow receiveShadow />
          <group position={[0, -0.052, 0.152]}>
            <Text3D text={brand} size={0.155} depth={0.016} bevel={0.004} tracking={0.002} {...whiteText} />
          </group>
          {[-1, 1].map((side) => (
            <group key={side} position={[side, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]} material={M.chrome} position={[side * -0.17, 0, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.2, 32]} />
              </mesh>
              <HexHead r={0.145} length={0.32} />
            </group>
          ))}
        </group>
      ))}
      {[-1.34, 1.34].map((x) => (
        <mesh key={x} geometry={box(0.07, 1.92, 0.1, 0.03)} material={M.gunmetal} position={[x, 1.5 * RISE - 0.22, -1.5 * RUN - 0.04]} rotation={[Math.atan2(-RUN, RISE), 0, 0]} castShadow />
      ))}
    </group>
    <ContactShadow position={[0, -2.48, -0.5]} size={[3.8, 1.5]} opacity={0.32} />
    <group position={[0, -2.46, 0.42]}>
      <Text3D text="АЛБАН ЁСНЫ ОНЦГОЙ ЭРХТЭЙ" size={0.135} depth={0.05} bevel={0.006} weight={800} {...deepText} />
    </group>
  </>
);

// ---------- S14: all the weight, stacked into one tower ----------

const TOWER = ['16 ЖИЛ', '2011 ОНООС', '140+ БАЙГУУЛЛАГА', '2500 м² АГУУЛАХ', '600 м² ШОУРУМ'];
const LAYER = 0.26;
const onRim = (v: THREE.Vector3) => {
  const a = v.x;
  const r = 1 + v.z - 0.002;
  v.x = r * Math.sin(a);
  v.z = r * Math.cos(a);
};

export const S14 = () => (
  <>
    <Cam pos={[0, 4.6, 16.4]} target={[0, -0.2, 0]} fov={20} />
    <Studio {...DAYLIGHT} power={1.1} sun={[-5, 12, 7]} sunPower={2} shadowSize={6} />
    <group position={[0, 1.66, 0]}>
      <Text3D text="ТАНЫ ФИТНЕСИЙН" size={0.2} depth={0.08} bevel={0.008} weight={800} {...inkText} />
      <group position={[0, -0.38, 0]}>
        <Text3D text="НАЙДВАРТАЙ ТҮНШ" size={0.25} depth={0.1} bevel={0.01} {...deepText} />
      </group>
    </group>
    <group position={[0, -1.3, 0]} scale={1.12}>
      {TOWER.map((label, i) => (
        <group key={label} position={[0, -i * (LAYER + 0.006), 0]}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <Plate width={LAYER} />
          </group>
          <WrapText text={label} y={-0.048} map={onRim} size={0.118} depth={0.012} bevel={0.003} weight={800} tracking={0.006} {...whiteText} />
        </group>
      ))}
      <group position={[0, 0.3, 0]}>
        <Rod length={0.46} r={0.11} />
      </group>
      <mesh position={[0, 0.2, 0]} material={M.blue} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.13, 48]} />
      </mesh>
    </group>
    <ContactShadow position={[0.1, -2.86, 0]} size={[3.9, 3.3]} opacity={0.42} />
  </>
);

export const SCENES = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14};
