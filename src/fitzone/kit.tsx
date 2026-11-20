import {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {ArcText, WrapText} from './text';

// Gym hardware for the Fitzone reel: plates, bar, kettlebells, weight stack, plyo boxes, dumbbell.
// One unit is the radius of a plate. Blue is sampled from the logo on the end card.

export const BLUE = '#2696F7';

const std = (color: string, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});

export const M = {
  rubber: new THREE.MeshPhysicalMaterial({color: '#121317', roughness: 0.4, anisotropy: 0.8}),
  rubberMatte: std('#141519', 0.64),
  hub: std('#8d939d', 0.3, 1),
  steel: std('#c6ccd6', 0.28, 1),
  chrome: std('#f4f6f9', 0.08, 1),
  gunmetal: std('#3b4048', 0.36, 1),
  white: std('#f5f7fb', 0.4),
  whiteSide: std('#9aa3b2', 0.34, 0.5),
  blue: std(BLUE, 0.32, 0.1),
  blueDeep: std('#1672d6', 0.34, 0.1),
  blueSide: std('#1460b0', 0.3, 0.2),
  red: std('#e8413c', 0.36),
  redSide: std('#8d1c1b', 0.34),
  ink: std('#10141b', 0.42),
  inkSide: std('#2b3240', 0.34, 0.6),
};

export const whiteText = {face: M.white, side: M.whiteSide};
export const blueText = {face: M.blue, side: M.blueSide};
export const deepText = {face: M.blueDeep, side: M.blueSide};
export const skyText = {face: M.white, side: M.blueSide};
export const redText = {face: M.red, side: M.redSide};
export const inkText = {face: M.ink, side: M.inkSide};

// ---------- camera and light ----------

type CamProps = {pos: [number, number, number]; target?: [number, number, number]; fov?: number; roll?: number};

export const Cam = ({pos, target = [0, 0, 0], fov = 20, roll = 0}: CamProps) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 200;
    camera.lookAt(...target);
    camera.rotateZ(roll);
    camera.updateProjectionMatrix();
    // The values below are literals at each scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);
  return null;
};

type Panel = {color: string; power: number; pos: [number, number, number]; size: [number, number]};

// Bright centre, dark edge: a graded box gives metal a gradient where a flat one gives a hard stripe.
const softBox = (p: Panel) => {
  const geo = new THREE.PlaneGeometry(p.size[0], p.size[1], 16, 16);
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(p.color).multiplyScalar(p.power);
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) / p.size[0]) * 2;
    const v = (pos.getY(i) / p.size[1]) * 2;
    const k = Math.max(0, 1 - (u * u + v * v) * 0.72) ** 1.4;
    colors[i * 3] = base.r * k;
    colors[i * 3 + 1] = base.g * k;
    colors[i * 3 + 2] = base.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.DoubleSide}));
  mesh.position.set(...p.pos);
  mesh.lookAt(0, 0, 0);
  return mesh;
};

// The room baked into the environment map: this is what chrome and rubber edges reflect.
const bakeRoom = (gl: THREE.WebGLRenderer, panels: Panel[]) => {
  const room = new THREE.Scene();
  room.background = new THREE.Color('#0a0c10');
  for (const p of panels) room.add(softBox(p));
  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(room, 0.01);
  pmrem.dispose();
  return target;
};

type StudioProps = {
  warm?: string;
  cool?: string;
  rim?: string;
  power?: number;
  exposure?: number;
  sun?: [number, number, number];
  sunPower?: number;
  shadowSize?: number;
  // A lamp close to the object: its fall-off draws a highlight across faces that are otherwise flat.
  lamp?: [number, number, number];
  lampPower?: number;
};

export const Studio = ({warm = '#fff4e6', cool = '#bcd4f5', rim = '#ffffff', power = 1, exposure = 1, sun = [-4, 8, 8], sunPower = 1.5, shadowSize = 8, lamp, lampPower = 10}: StudioProps) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const target = bakeRoom(gl, [
      {color: rim, power: 26 * power, pos: [0, 11, 2], size: [18, 9]},
      {color: warm, power: 16 * power, pos: [-12, 3, 2], size: [7, 16]},
      {color: cool, power: 12 * power, pos: [12, 1, 3], size: [6, 16]},
      {color: rim, power: 14 * power, pos: [-3, 4, -12], size: [16, 4]},
      {color: cool, power: 5 * power, pos: [0, -11, 4], size: [16, 8]},
      {color: warm, power: 3 * power, pos: [2, 2, 15], size: [16, 12]},
    ]);
    scene.environment = target.texture;
    gl.toneMappingExposure = exposure;
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene, warm, cool, rim, power, exposure]);
  return (
    <>
      <directionalLight
        position={sun}
        intensity={sunPower}
        color={warm}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={9}
        shadow-blurSamples={20}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
      />
      {lamp ? <pointLight position={lamp} intensity={lampPower} color={warm} decay={2} /> : null}
    </>
  );
};

// Takes only the shadow, so the object sits on whatever the footage shows there.
export const ShadowFloor = ({y = 0, size = 60, opacity = 0.5}: {y?: number; size?: number; opacity?: number}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <shadowMaterial opacity={opacity} transparent />
  </mesh>
);

let blob: THREE.CanvasTexture | null = null;
const blobTexture = () => {
  if (blob) return blob;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.62)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  blob = new THREE.CanvasTexture(canvas);
  return blob;
};

// The dark pool right under an object: it is what makes the object touch the ground.
export const ContactShadow = ({position, size, opacity = 0.6}: {position: [number, number, number]; size: [number, number]; opacity?: number}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={blobTexture()} transparent opacity={opacity} depthWrite={false} />
  </mesh>
);

// Same trick upright: the shadow lands on the presenter's plane.
export const ShadowWall = ({z = 0, opacity = 0.42}: {z?: number; opacity?: number}) => (
  <mesh position={[0, 0, z]} receiveShadow>
    <planeGeometry args={[30, 30]} />
    <shadowMaterial opacity={opacity} transparent />
  </mesh>
);

// ---------- lathe helpers ----------

// Rounds the corners of a closed-ish polyline so that lathed edges catch a highlight.
const fillet = (pts: [number, number][], r: number) => {
  const out: THREE.Vector2[] = [];
  pts.forEach((p, i) => {
    const a = pts[i - 1];
    const b = pts[i + 1];
    const v = new THREE.Vector2(...p);
    if (!a || !b) {
      out.push(v);
      return;
    }
    const toA = new THREE.Vector2(...a).sub(v);
    const toB = new THREE.Vector2(...b).sub(v);
    const d = Math.min(r, toA.length() / 2, toB.length() / 2);
    const from = v.clone().add(toA.setLength(d));
    const to = v.clone().add(toB.setLength(d));
    const curve = new THREE.QuadraticBezierCurve(from, v, to);
    out.push(...curve.getPoints(5));
  });
  return out;
};

const lathe = (pts: [number, number][], r: number, segments = 256) => new THREE.LatheGeometry(fillet(pts, r), segments);

// Plate faces lie along +Z after this turn.
const AXIS_Z: [number, number, number] = [Math.PI / 2, 0, 0];

// ---------- plate ----------

export type PlateProps = {
  top?: string;
  topSize?: number;
  bottom?: string;
  bottomSize?: number;
  width?: number;
  band?: THREE.Material;
};

const plateBody = (w: number) => {
  const h = w / 2;
  const rec = h * 0.56;
  return lathe(
    [
      [0.27, -rec - 0.012],
      [0.33, -rec],
      [0.74, -rec + 0.014],
      [0.77, -rec],
      [0.83, -h],
      [0.95, -h],
      [1, -h + 0.05],
      [1, h - 0.05],
      [0.95, h],
      [0.83, h],
      [0.77, rec],
      [0.74, rec - 0.014],
      [0.33, rec],
      [0.27, rec + 0.012],
    ],
    0.03,
  );
};

const plateHub = (w: number) =>
  lathe(
    [
      [0.126, -w * 0.53],
      [0.27, -w * 0.53],
      [0.27, w * 0.53],
      [0.126, w * 0.53],
    ],
    0.012,
    64,
  );

export const Plate = ({top, topSize = 0.44, bottom, bottomSize = 0.17, width = 0.24, band = M.blue}: PlateProps) => {
  const body = useMemo(() => plateBody(width), [width]);
  const hub = useMemo(() => plateHub(width), [width]);
  const face = (width / 2) * 0.56;
  return (
    <group>
      <mesh geometry={body} material={M.rubber} rotation={AXIS_Z} castShadow receiveShadow />
      <mesh geometry={hub} material={M.hub} rotation={AXIS_Z} castShadow />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} material={M.steel} rotation={AXIS_Z} position={[0.2 * Math.cos((i * Math.PI) / 3), 0.2 * Math.sin((i * Math.PI) / 3), width * 0.54]}>
          <cylinderGeometry args={[0.02, 0.02, 0.016, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0, face + 0.002]} material={band}>
        <ringGeometry args={[0.71, 0.734, 128]} />
      </mesh>
      <group position={[0, 0, face]}>
        {top ? <ArcText text={top} placement="top" radius={0.33} size={topSize} depth={0.03} bevel={0.006} {...whiteText} /> : null}
        {bottom ? <ArcText text={bottom} placement="bottom" radius={0.66} size={bottomSize} depth={0.02} bevel={0.004} weight={800} tracking={0.012} {...whiteText} /> : null}
      </group>
    </group>
  );
};

// ---------- bar ----------

const knurlTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  for (let i = -size; i < size * 2; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.moveTo(i + size, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

let knurl: THREE.CanvasTexture | null = null;
const knurled = (length: number, radius: number) => {
  knurl ??= knurlTexture();
  const map = knurl.clone();
  map.repeat.set(Math.round(radius * 60), Math.round(length * 12));
  map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({color: '#c6ccd6', metalness: 1, roughness: 0.34, bumpMap: map, bumpScale: 1.4});
};

// A bar whose +Z end carries `plates`, the front plate first. It runs off along -Z.
type BarRigProps = {
  plates: PlateProps[];
  far?: number;
  width?: number;
};

export const BarRig = ({plates, far = 16, width = 0.24}: BarRigProps) => {
  const shaft = useMemo(() => knurled(far, 0.062), [far]);
  const load = plates.length * width;
  const sleeveEnd = -load - 0.5;
  return (
    <group>
      {plates.map((p, i) => (
        <group key={i} position={[0, 0, -i * width]}>
          <Plate width={width} {...p} />
        </group>
      ))}
      <mesh rotation={AXIS_Z} position={[0, 0, (0.52 + sleeveEnd) / 2]} material={M.chrome} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.52 - sleeveEnd, 48]} />
      </mesh>
      <mesh rotation={AXIS_Z} position={[0, 0, 0.526]} material={M.steel}>
        <cylinderGeometry args={[0.104, 0.104, 0.002, 48]} />
      </mesh>
      <mesh rotation={AXIS_Z} position={[0, 0, width * 0.5 + 0.08]} material={M.blue} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.13, 48]} />
      </mesh>
      <mesh rotation={AXIS_Z} position={[0, 0, sleeveEnd - far / 2]} material={shaft} castShadow>
        <cylinderGeometry args={[0.062, 0.062, far, 32]} />
      </mesh>
    </group>
  );
};

// ---------- kettlebell ----------

const bodyGeometry = () => {
  const pts = [new THREE.Vector2(0, -0.86), new THREE.Vector2(0.5, -0.86)];
  for (let a = -58; a <= 90; a += 3) pts.push(new THREE.Vector2(Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)));
  pts[pts.length - 1].x = 0;
  return new THREE.LatheGeometry(pts, 96);
};

const handleGeometry = () => {
  const curve = new THREE.CatmullRomCurve3(
    [[-0.58, 0.62], [-0.74, 1.14], [-0.62, 1.58], [0, 1.72], [0.62, 1.58], [0.74, 1.14], [0.58, 0.62]].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  );
  return new THREE.TubeGeometry(curve, 96, 0.15, 24);
};

let kbBody: THREE.BufferGeometry | null = null;
let kbHandle: THREE.BufferGeometry | null = null;

const onSphere = (v: THREE.Vector3) => {
  v.z += Math.sqrt(Math.max(1 - v.x * v.x - v.y * v.y, 0.0001)) - 0.004;
};

export const Kettlebell = ({lines, size = 0.27, accent = false}: {lines: string[]; size?: number; accent?: boolean}) => {
  kbBody ??= bodyGeometry();
  kbHandle ??= handleGeometry();
  const gap = size * 1.18;
  const y0 = ((lines.length - 1) * gap) / 2 - size * 0.34;
  return (
    <group>
      <mesh geometry={kbBody} material={accent ? M.blue : M.rubberMatte} castShadow receiveShadow />
      <mesh geometry={kbHandle} material={M.gunmetal} castShadow />
      {lines.map((line, i) => (
        <WrapText key={line} text={line} y={y0 - i * gap} map={onSphere} size={size} depth={0.024} bevel={0.004} tracking={0.002} {...whiteText} />
      ))}
    </group>
  );
};

// ---------- weight stack ----------

const boxCache = new Map<string, THREE.BufferGeometry>();
export const box = (w: number, h: number, d: number, r: number) => {
  const key = [w, h, d, r].join('|');
  let geo = boxCache.get(key);
  if (!geo) {
    geo = new RoundedBoxGeometry(w, h, d, 6, r);
    boxCache.set(key, geo);
  }
  return geo;
};

// ---------- hex dumbbell ----------

const hexShape = (r: number) => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    const [x, y] = [r * Math.cos(a), r * Math.sin(a)];
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
};

// A hex head with its axis on X and one flat facing the camera.
export const HexHead = ({r, length}: {r: number; length: number}) => {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hexShape(r), {depth: length, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 4});
    g.translate(0, 0, -length / 2);
    return g;
  }, [r, length]);
  return <mesh geometry={geo} material={M.rubberMatte} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow />;
};

export const Rod = ({length, r, material = M.chrome}: {length: number; r: number; material?: THREE.Material}) => (
  <mesh material={material} castShadow>
    <cylinderGeometry args={[r, r, length, 32]} />
  </mesh>
);

export const knurledRod = knurled;
