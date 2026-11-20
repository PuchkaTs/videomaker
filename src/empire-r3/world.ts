import * as THREE from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import {clamp01, easeIn, easeInOut, easeOut, hit, mix, ramp, rand, spring, track} from '../kublai-agents-v2/time';
import {LOGO_W, MARK, TAGLINE, WORDMARK} from '../empire-r1/logo-paths';
import cues from './cues.json';
import {COL, MAT, glass, gloss, matte, type Mats} from './gfx/materials';
import {archPoint, arcTube, brushBodyGeometry, clocheGeometry, cloudGeometry, dropOnto, gumGeometry, noseGeometry, normalAt, pinGeometry, projectOnto, scraperGeometry, sphereGeo, stomachGeometry, tongueField, tongueGeometry, toothFields, toothGeometries, toothSlots} from './gfx/models';
import {capsule, meshSDF, union} from './gfx/sdf';
import type {Lens, Rig, Studio} from './gfx/studio';
import {softboxEnvironment} from './gfx/studio';
import {Label, type Motion, type View} from './gfx/text3d';

// One continuous 3D world for the whole reel. Sets stand on a shared floor; a single camera travels
// between them. update(t) is a pure function of time, so it can run many times per frame for the
// sub-frame samples, and a cold seek lands on exactly the same state as playback.

const C = cues.t;
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const col = (hex: string) => new THREE.Color(hex);

export const DOC = v3(0, 0, 0);
export const ARCH = v3(16, 0, -4);
export const PIPE = v3(32, 0, 8);
export const HERO = v3(-9, 0, 3);

// ---------- camera ----------
// Subject point, orbit around it, distance, aperture radius and focus offset, keyed together.
const CAM: number[][] = [
  //  t       sx     sy    sz     az     el     dist    ap   foc
  [0.0,      0.0,  3.15,  0.0,  0.00,  0.00, 12.995, 0.0,  0],
  [1.6,      0.0,  3.15,  0.0,  0.006, 0.002, 12.85, 0.0,  0],
  [3.0,      0.0,  3.12,  0.0,  0.03,  0.006, 12.7,  0.01, 0],
  [3.9,      0.1,  2.85,  0.8,  0.30,  0.10,  19.5,  0.10, 0],
  [5.3,      0.5,  3.0,   0.9,  0.50,  0.13,  21.5,  0.14, 0],
  [6.35,    16.0,  3.2,  -4.0,  0.10,  0.04,  16.5,  0.12, 0],
  [8.0,     16.0,  3.2,  -4.0, -0.06,  0.07,  15.5,  0.12, 0],
  [9.7,     16.0,  3.1,  -4.0, -0.12,  0.05,  14.6,  0.10, 0],
  [11.1,    16.0,  3.0,  -4.0, -0.16,  0.10,  15.0,  0.10, 0],
  [12.9,    16.0,  3.0,  -4.0, -0.30,  0.26,  16.5,  0.12, 0],
  [14.05,   32.0,  8.7,   8.0,  0.22,  0.04,  12.0,  0.14, 0],
  [15.4,    32.0,  6.6,   8.0,  0.42,  0.02,  12.0,  0.14, 0],
  [16.4,    32.0,  3.6,   8.0,  0.18,  0.06,  14.0,  0.14, 0],
  [17.7,    32.0,  3.9,   8.0,  0.02,  0.06,  16.0,  0.14, 0],
  [19.9,    32.0,  5.0,   8.0, -0.22,  0.10,  27.0,  0.16, 0],
  [20.95,   18.7,  2.1,  -3.6,  1.10,  0.18,   9.6,  0.10, 0],
  [22.4,    18.7,  2.05, -3.5,  0.95,  0.16,   7.4,  0.07, 0],
  [23.35,   16.9,  1.9,  -4.4,  0.72,  0.66,   9.4,  0.07, 0],
  [24.45,   18.75, 1.75, -3.4,  1.02,  0.10,   6.4,  0.05, 0],
  [26.1,    18.7,  1.95, -3.5,  1.16,  0.12,   6.6,  0.05, 0],
  [27.0,    18.7,  2.75, -3.6,  1.20,  0.13,   7.2,  0.05, 0],
  [27.9,    18.6,  3.0,  -3.7,  1.26,  0.16,   8.0,  0.06, 0],
  [29.6,    18.0,  3.7,  -4.0,  1.36,  0.18,  13.5,  0.10, 0],
  [31.3,    17.2,  3.6,  -4.1,  1.50,  0.24,  18.0,  0.12, 0],
  [33.2,    18.6,  2.4,  -4.1,  1.30,  0.28,   9.2,  0.07, 0],
  [34.7,    16.2,  2.2,  -1.2,  0.30,  0.30,   9.2,  0.07, 0],
  [36.1,    13.5,  2.3,  -4.2, -0.95,  0.32,   9.6,  0.07, 0],
  [37.0,    16.0,  2.0,  -4.2, -0.50,  0.62,   9.0,  0.06, 0],
  [38.6,    16.0,  2.0,  -3.4, -0.16,  0.50,   8.6,  0.06, 0],
  [39.9,    16.0,  3.6,  -4.1,  0.10,  0.36,  24.0,  0.12, 0],
  [41.5,    16.0,  3.7,  -4.1,  0.20,  0.34,  25.0,  0.12, 0],
  [43.6,    16.0,  3.8,  -4.1,  0.40,  0.30,  26.0,  0.12, 0],
  [44.45,    0.0,  3.15,  0.0, -0.16,  0.02,  15.0,  0.02, 0],
  [45.7,     0.0,  3.15,  0.0, -0.08,  0.01,  14.6,  0.02, 0],
  [46.75,   -9.0,  2.0,   3.0, -0.08,  0.10,  18.5,  0.12, 0],
  [48.0,    -9.0,  2.0,   3.0,  0.06,  0.10,  18.0,  0.10, 0],
  [49.2,    -9.0,  2.2,   3.4,  0.16,  0.08,  11.5,  0.07, 0],
  [50.2,    -9.0,  3.0,   3.0,  0.22,  0.08,  16.0,  0.10, 0],
  [51.2,    -9.0,  3.75,  3.0,  0.12,  0.05,  15.6,  0.06, 0],
  [52.9,    -9.0,  3.75,  3.0,  0.06,  0.04,  15.2,  0.05, 0],
];
const camChannel = (c: number) => CAM.map((row) => [row[0], row[c]] as const);
const CH = Array.from({length: 9}, (_, c) => camChannel(c));
const cam = (t: number, c: number) => track(CH[c], t);

export const FOV = 26;

// ---------- backdrop ----------
const BG: [number, string][] = [
  [0, '#EAE2F7'], [5.6, '#EAE2F7'], [6.4, '#DCEBFB'], [13.2, '#DCEBFB'], [14, '#FDE9DE'], [20, '#FDE9DE'], [20.8, '#F7E3EC'], [31.4, '#F7E3EC'],
  [33.3, '#DFF5EE'], [39.8, '#DFF5EE'], [42.9, '#FBF1D9'], [43.8, '#FBF1D9'], [44.4, '#EAE2F7'], [46, '#EAE2F7'], [46.8, '#DCEBFB'], [49.4, '#DCEBFB'], [50.4, '#F3F1FA'], [60, '#F3F1FA'],
];
const BG_COL = BG.map(([, hex]) => col(hex));
const bgAt = (t: number, out: THREE.Color) => {
  let i = 0;
  while (i < BG.length - 2 && t > BG[i + 1][0]) i++;
  const k = easeInOut(clamp01((t - BG[i][0]) / (BG[i + 1][0] - BG[i][0])));
  return out.copy(BG_COL[i]).lerp(BG_COL[i + 1], k);
};

// ---------- instanced props ----------
class Swarm {
  mesh: THREE.InstancedMesh;
  private a: Float32Array;
  constructor(public count: number, geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true) {
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = shadow;
    this.mesh.receiveShadow = shadow;
    this.mesh.setColorAt(0, new THREE.Color(0xffffff));
    for (let i = 1; i < count; i++) this.mesh.setColorAt(i, new THREE.Color(0xffffff));
    this.a = this.mesh.instanceMatrix.array as Float32Array;
  }
  set(i: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
    const o = i * 16;
    const a = this.a;
    a[o] = sx; a[o + 1] = 0; a[o + 2] = 0; a[o + 3] = 0;
    a[o + 4] = 0; a[o + 5] = sy; a[o + 6] = 0; a[o + 7] = 0;
    a[o + 8] = 0; a[o + 9] = 0; a[o + 10] = sz; a[o + 11] = 0;
    a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
  }
  tint(i: number, c: THREE.Color) {
    this.mesh.setColorAt(i, c);
  }
  commit() {
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

const shadowed = <T extends THREE.Object3D>(o: T) => {
  o.traverse((c) => {
    c.castShadow = true;
    c.receiveShadow = true;
  });
  return o;
};

// A round plinth with soft edges, so sets stand on something instead of floating on the floor.
const plinth = (r: number, h: number, mat: THREE.Material) => {
  const e = Math.min(h * 0.5, 0.12);
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.001, 0)];
  pts.push(new THREE.Vector2(r, 0));
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 0.5;
    pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, h - e + Math.sin(a) * e));
  }
  pts.push(new THREE.Vector2(0.001, h));
  return shadowed(new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat));
};

// ---------- the cloud ----------
const PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 1], [0.86, 0.08, 0.12, 0.74], [-0.92, -0.06, 0.16, 0.72], [0.36, 0.58, 0.2, 0.68], [-0.42, 0.52, -0.1, 0.64], [0.1, -0.46, 0.36, 0.62], [1.42, -0.2, 0, 0.44], [-1.46, -0.26, 0.1, 0.4], [0, 0.1, -0.72, 0.72],
];

const CLOUD_KEYS: number[][] = [
  //  t       x      y      z      s    clean
  [0.0,     1.25,  0.72,  1.4,  0.42, 0],
  [2.32,    1.2,   1.05,  1.3,  0.5,  0],
  [3.0,     2.0,   1.7,   1.0,  0.62, 0],
  [3.9,     2.95,  3.2,   0.1,  0.8,  0],
  [5.3,     3.4,   4.7,  -0.6,  0.92, 0],
  [6.3,    14.6,   5.4,  -3.4,  0.72, 0],
  [8.1,    18.0,   4.8,  -3.0,  0.62, 0],
  [9.7,    16.3,   5.7,  -5.4,  0.46, 0],
  [11.2,   16.0,   3.2,  -4.0,  0.3,  0],
  [11.75,  16.0,   1.4,  -4.0,  0.0,  0],
  [27.8,   18.5,   3.8,  -4.3,  0.0,  0],
  [29.6,   18.3,   4.9,  -4.2,  0.74, 0],
  [31.2,   17.7,   6.0,  -4.2,  1.22, 0],
  [33.2,   17.0,   6.3,  -4.4,  1.14, 0],
  [38.6,   16.0,   6.6,  -4.4,  0.86, 0],
  [39.4,   16.0,   6.9,  -4.4,  0.62, 1],
  [41.4,   16.0,   6.8,  -4.4,  0.58, 1],
  [42.9,   16.0,   6.2,  -4.4,  0.9,  0],
  [43.8,   15.0,   6.0,  -4.0,  1.0,  0],
  [44.45,   3.1,   5.3,  -2.4,  0.95, 0],
  [45.9,   -9.0,   5.4,   3.0,  0.9,  0],
  [47.24,  -9.0,   4.75,  3.0,  0.9,  0],
  [47.33,  -9.0,   3.74,  3.0,  0.6,  0],
  [47.7,   -9.0,   3.8,   3.0,  0.62, 0],
  [48.0,   -9.0,   5.85,  3.0,  1.0,  0],
  [49.26,  -9.0,   6.1,   3.0,  0.95, 0],
  [49.9,   -9.0,   6.6,   3.0,  0.0,  1],
];
const CLOUD_CH = Array.from({length: 6}, (_, c) => CLOUD_KEYS.map((row) => [row[0], row[c]] as const));

const wispGeometry = () => {
  const parts = [];
  for (let i = 0; i < 36; i++) {
    const a = i / 36, b = (i + 1) / 36;
    const wave = (k: number) => [Math.sin(k * Math.PI * 2.6) * 0.17, k * 1.5, 0] as const;
    parts.push(capsule(wave(a), wave(b), 0.085));
  }
  return meshSDF(union(0.04, ...parts), [-0.4, -0.2, -0.2], [0.4, 1.7, 0.2], 110);
};

class Cloud {
  group = new THREE.Group();
  private body: THREE.Mesh;
  private moons: THREE.Mesh[] = [];
  private wisps: THREE.Mesh[] = [];
  private mat = matte(COL.sage, {roughness: 0.66}, '#5E6A48');
  private wispMat = gloss(COL.sage);
  private sage = col(COL.sage);
  private mint = col(COL.mint);
  constructor() {
    this.body = new THREE.Mesh(cloudGeometry(PUFFS), this.mat);
    this.body.castShadow = true;
    this.group.add(this.body);
    for (let i = 0; i < 2; i++) {
      const moon = new THREE.Mesh(sphereGeo, this.mat);
      moon.castShadow = true;
      this.group.add(moon);
      this.moons.push(moon);
    }
    const geo = wispGeometry();
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(geo, this.wispMat);
      w.castShadow = true;
      this.group.add(w);
      this.wisps.push(w);
    }
  }
  update(t: number) {
    const s = track(CLOUD_CH[4], t);
    this.group.visible = s > 0.003;
    if (!this.group.visible) return;
    const clean = track(CLOUD_CH[5], t);
    this.group.position.set(track(CLOUD_CH[1], t), track(CLOUD_CH[2], t) + Math.sin(t * 1.3) * 0.06, track(CLOUD_CH[3], t));
    this.group.scale.setScalar(s);
    this.mat.color.copy(this.sage).lerp(this.mint, clean);
    this.wispMat.color.copy(this.mat.color);
    const breathe = Math.sin(t * 2.3);
    this.body.scale.set(1 + breathe * 0.025, 1 - breathe * 0.03, 1 + breathe * 0.025);
    this.body.rotation.set(Math.sin(t * 0.7) * 0.07, Math.sin(t * 0.5) * 0.16, Math.sin(t * 0.9) * 0.05);
    this.moons.forEach((moon, i) => {
      const a = t * (0.8 + i * 0.3) + i * 2.6;
      moon.position.set(Math.cos(a) * 1.95, 0.25 + Math.sin(a * 1.4) * 0.3, Math.sin(a) * 0.9);
      moon.scale.setScalar(0.17 - i * 0.04);
    });
    this.wisps.forEach((w, i) => {
      const phase = (t * 0.42 + i / 3) % 1;
      const k = Math.sin(phase * Math.PI) * (1 - clean) * ramp(s, 0.5, 0.72, easeInOut);
      w.visible = k > 0.02;
      w.position.set(-0.68 + i * 0.68, 1.06 + phase * 0.62 + (i === 1 ? 0.2 : 0), 0.1);
      w.scale.setScalar(0.92 * k);
    });
  }
}

// ---------- doctor panel ----------
const SCREEN_W = 3.375;
const SCREEN_H = 6;

class DoctorSet {
  group = new THREE.Group();
  tex = new THREE.Texture();
  private copy: HTMLCanvasElement | undefined;
  private screen: THREE.ShaderMaterial;
  constructor(m: Mats) {
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
    this.tex.magFilter = THREE.LinearFilter;
    const shape = new THREE.Shape();
    const rw = SCREEN_W / 2 + 0.11, rh = SCREEN_H / 2 + 0.11, r = 0.3;
    shape.moveTo(-rw + r, -rh);
    shape.lineTo(rw - r, -rh);
    shape.quadraticCurveTo(rw, -rh, rw, -rh + r);
    shape.lineTo(rw, rh - r);
    shape.quadraticCurveTo(rw, rh, rw - r, rh);
    shape.lineTo(-rw + r, rh);
    shape.quadraticCurveTo(-rw, rh, -rw, rh - r);
    shape.lineTo(-rw, -rh + r);
    shape.quadraticCurveTo(-rw, -rh, -rw + r, -rh);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth: 0.16, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 6, curveSegments: 16}), m.pearl);
    body.position.set(0, 3.15, -0.22);
    shadowed(body);
    this.screen = new THREE.ShaderMaterial({
      uniforms: {map: {value: this.tex}, radius: {value: 0}, size: {value: new THREE.Vector2(SCREEN_W, SCREEN_H)}},
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D map; uniform float radius; uniform vec2 size; varying vec2 vUv;
        void main() {
          vec2 q = abs((vUv - 0.5) * size) - size * 0.5 + radius;
          if (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius > 0.0) discard;
          gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0);
        }
      `,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), this.screen);
    screen.position.set(0, 3.15, 0.002);
    const base = plinth(2.7, 0.16, m.matteLilac);
    this.group.add(base, body, screen);
    this.group.position.copy(DOC);
  }
  update(t: number) {
    this.group.visible = t < 6.9 || (t > 43.3 && t < 47.3);
    this.screen.uniforms.radius.value = 0.2 * ramp(t, C.pull - 0.05, C.pull + 0.5, easeInOut);
  }
  frame(image: HTMLVideoElement | HTMLImageElement) {
    if (image instanceof HTMLVideoElement) {
      // Studio hands over the <video> element, whose width attribute is 0 for three's upload, so its
      // pixels go through a canvas of the footage's size.
      if (image.videoWidth === 0 || image.readyState < 2) return;
      this.copy ??= Object.assign(document.createElement('canvas'), {width: 1080, height: 1920});
      this.copy.getContext('2d')?.drawImage(image, 0, 0, 1080, 1920);
      this.tex.image = this.copy as never;
    } else {
      if (image.naturalWidth === 0) return;
      this.tex.image = image as never;
    }
    this.tex.needsUpdate = true;
  }
}

// ---------- globe and ring ----------
class GlobeSet {
  group = new THREE.Group();
  private globe = new THREE.Group();
  private ring = new THREE.Group();
  private fill: THREE.BufferGeometry;
  private capA: THREE.Mesh;
  private capB: THREE.Mesh;
  private segs: number;
  private idx: number;
  private pins: Swarm;
  private dirs: THREE.Vector3[] = [];
  private gem: THREE.Mesh;
  static R = 2.32;
  constructor(m: Mats) {
    const R = GlobeSet.R;
    const ball = new THREE.Mesh(sphereGeo, m.sky);
    ball.scale.setScalar(1.3);
    this.globe.add(shadowed(ball));
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.022, 12, 120), m.white);
      band.rotation.set(i === 0 ? Math.PI / 2 : 0, i === 2 ? Math.PI / 2 : 0, 0);
      this.globe.add(band);
    }
    const lat = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.02, 12, 120), m.white);
    lat.rotation.x = Math.PI / 2;
    lat.position.y = 0.65;
    const lat2 = lat.clone();
    lat2.position.y = -0.65;
    this.globe.add(lat, lat2);
    this.pins = new Swarm(7, pinGeometry(), m.berry);
    const pinGroup = new THREE.Group();
    this.globe.add(pinGroup);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      const y = 0.75 - i * 0.2;
      const r = Math.sqrt(1 - y * y);
      this.dirs.push(v3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    this.pinMeshes = this.dirs.map((d) => {
      const pin = new THREE.Mesh(this.pins.mesh.geometry, m.berry);
      pin.position.copy(d).multiplyScalar(1.28);
      pin.quaternion.setFromUnitVectors(v3(0, 1, 0), d);
      pin.castShadow = true;
      pinGroup.add(pin);
      return pin;
    });
    this.globe.position.set(0, 3.2, 0);

    const base = arcTube(R, 0.2);
    const fill = arcTube(R, 0.25);
    this.fill = fill.geo;
    this.segs = fill.tubular;
    this.idx = fill.indicesPerSegment;
    const baseMesh = new THREE.Mesh(base.geo, m.matteLilac);
    const fillMesh = new THREE.Mesh(fill.geo, gloss(COL.berry, {roughness: 0.28}, '#7A1E44'));
    this.capA = new THREE.Mesh(sphereGeo, fillMesh.material);
    this.capB = new THREE.Mesh(sphereGeo, fillMesh.material);
    this.capA.scale.setScalar(0.25);
    this.capB.scale.setScalar(0.25);
    this.capA.position.set(R, 0, 0);
    const spin = new THREE.Group();
    spin.rotation.y = Math.PI / 2;
    spin.add(baseMesh, fillMesh, this.capA, this.capB);
    this.ring.add(spin);
    shadowed(this.ring);
    this.ring.position.set(0, 3.2, 0);
    this.gem = new THREE.Mesh(sphereGeo, m.butter);
    this.gem.castShadow = true;
    this.group.add(this.globe, this.ring, this.gem);
    this.group.position.copy(ARCH);
    this.group.visible = false;
  }
  private pinMeshes: THREE.Mesh[];
  update(t: number) {
    this.group.visible = t > C.world - 0.4 && t < 21;
    if (!this.group.visible) return;
    const inK = spring(t, C.world - 0.08, 1.9, 0.52);
    // Gone by the time «80» lands: the number sits where the globe was.
    const outK = ramp(t, C.n80 - 0.5, C.n80 - 0.06, easeIn);
    const gs = inK * (1 - outK);
    this.globe.visible = gs > 0.002;
    this.globe.scale.setScalar(Math.max(0.001, gs));
    this.globe.rotation.set(0.32, t * 0.75, 0.16);
    this.pinMeshes.forEach((pin, i) => {
      const k = spring(t, C.research + i * 0.09, 3, 0.45);
      pin.scale.setScalar(Math.max(0.001, 0.34 * k));
    });

    const rk = spring(t, C.ring - 0.18, 1.8, 0.6);
    this.ring.visible = rk > 0.002 && t < C.spin + 0.9;
    // Saturn tilt → stands facing the camera for the number → lies down around the teeth.
    const up = ramp(t, C.n80 - 0.75, C.n80 - 0.05, easeInOut);
    const down = ramp(t, C.mouth - 0.3, C.mouth + 0.5, easeInOut);
    const out = ramp(t, C.spin, C.spin + 0.5, easeIn);
    this.ring.rotation.set(mix(mix(0.28, Math.PI / 2, up), 0.06, down), 0, mix(-0.3 * (1 - up), 0, down));
    this.ring.position.y = mix(3.2, 1.05, down);
    this.ring.scale.setScalar(Math.max(0.001, rk * (1 - out)) * mix(1, 1.08, down));
    const fillK = 0.8 * ramp(t, C.n80 - 0.32, C.n80 + 0.1, easeInOut) + 0.15 * ramp(t, C.n95 - 0.12, C.n95 + 0.2, easeInOut);
    const seg = Math.round(fillK * this.segs);
    this.fill.setDrawRange(0, seg * this.idx);
    const a = (seg / this.segs) * Math.PI * 2;
    this.capA.visible = seg > 0;
    this.capB.visible = seg > 0;
    this.capB.position.set(GlobeSet.R * Math.cos(a), 0, GlobeSet.R * Math.sin(a));

    // What the ring leaves open flies on to the other causes; the camera follows it.
    const born = spring(t, C.spin - 0.1, 2.8, 0.55);
    const land = ramp(t, C.nose - 0.05, C.nose + 0.12, easeIn);
    this.gem.visible = born > 0.002 && land < 1;
    if (this.gem.visible) {
      const start = v3(-0.72, 1.05, -2.35);
      const leave = ramp(t, C.spin + 0.02, C.spin + 0.5, easeInOut);
      const end = PIPE.clone().add(v3(0, 8.9, 1.0)).sub(ARCH);
      const follow = v3(cam(t, 1), cam(t, 2) + 0.2, cam(t, 3)).sub(ARCH);
      this.gem.position.copy(start).lerp(follow, leave).lerp(end, ramp(t, 13.65, C.nose, easeInOut));
      this.gem.scale.setScalar(0.3 * born * (1 - land));
    }
  }
}

// ---------- the tract ----------
const TRACT = new THREE.CatmullRomCurve3([v3(0, 8.0, -0.42), v3(0.3, 7.2, -0.32), v3(-0.18, 5.9, -0.1), v3(0.2, 4.9, 0), v3(-0.5, 4.2, 0), v3(-0.76, 3.7, 0)]);

class PipeSet {
  group = new THREE.Group();
  private puffs: Swarm;
  private nose: THREE.Mesh;
  private stomach: THREE.Mesh;
  private tube: THREE.Mesh;
  private tubeCap: THREE.Mesh;
  constructor(m: Mats) {
    this.nose = new THREE.Mesh(noseGeometry(), m.peach);
    this.nose.position.set(0, 9.2, 0);
    this.tubeCap = new THREE.Mesh(sphereGeo, m.rose);
    this.tubeCap.scale.setScalar(0.3);
    this.tube = new THREE.Mesh(new THREE.TubeGeometry(TRACT, 180, 0.3, 28), m.rose);
    this.stomach = new THREE.Mesh(stomachGeometry(), gloss(COL.rose, {}, '#C03A70'));
    this.stomach.position.set(0, 2.0, 0);
    this.puffs = new Swarm(18, sphereGeo, matte(COL.sage, {}, '#FFFFFF'));
    this.group.add(shadowed(this.nose), shadowed(this.tube), shadowed(this.tubeCap), shadowed(this.stomach), this.puffs.mesh, plinth(2.6, 0.16, m.mattePeach));
    this.group.position.copy(PIPE);
    this.group.visible = false;
  }
  update(t: number) {
    this.group.visible = t > C.some - 0.8 && t < 20.9;
    if (!this.group.visible) return;
    const pop = (at: number, o: THREE.Object3D, s = 1) => {
      const k = spring(t, at, 2.2, 0.5);
      const sq = 0.08 * hit(t, at + 0.16, 0.03, 0.2);
      o.scale.set(Math.max(0.001, s * k * (1 + sq)), Math.max(0.001, s * k * (1 - sq)), Math.max(0.001, s * k * (1 + sq)));
    };
    pop(C.nose - 0.5, this.nose, 0.78);
    pop(C.stomach - 0.45, this.stomach);
    const tubeK = ramp(t, C.nose + 0.2, C.gullet + 0.1, easeInOut);
    const idx = this.tube.geometry.index!.count;
    this.tube.geometry.setDrawRange(0, Math.round(tubeK * 180) * 6 * 28);
    this.tube.visible = tubeK > 0;
    this.tubeCap.visible = tubeK > 0 && t < C.stomach;
    if (idx === 0) return;
    const p = new THREE.Vector3();
    TRACT.getPointAt(tubeK, this.tubeCap.position);
    for (let i = 0; i < 18; i++) {
      const u = (t - C.stomach - 0.3 - i * 0.2) / 2.1;
      if (u < 0 || u > 1) {
        this.puffs.set(i, 0, -5, 0, 0.0001);
        continue;
      }
      TRACT.getPoint(1 - u, p);
      const s = (0.12 + 0.13 * rand(i, 2)) * Math.sin(Math.PI * clamp01(u)) ** 0.5;
      const a = i * 2.4 + t;
      this.puffs.set(i, p.x + Math.cos(a) * 0.45, p.y, p.z + Math.sin(a) * 0.45 + 0.1, s);
    }
    this.puffs.commit();
  }
}

// ---------- the mouth ----------
type Blob = {p: THREE.Vector3; q: THREE.Quaternion; size: number; long: number; flat: number; born: number; gone: number};

// Brush path along the arch, in arch angle: right rear → front → left rear.
const brushU = (t: number) => {
  const k = ramp(t, C.brushOn, C.brushOff, (x) => x);
  const scrub = 0.07 * Math.sin((t - C.brushOn) * 2 * Math.PI * 4.5);
  return mix(1.72, -1.72, k) + scrub;
};

class MouthSet {
  group = new THREE.Group();
  private blobs: Blob[] = [];
  private plaque: Swarm;
  private beads: Swarm;
  private links: Swarm;
  private bubbles: Swarm;
  private foam: Swarm;
  private tufts: Swarm;
  private brush = new THREE.Group();
  private scraper = new THREE.Group();
  private mound: THREE.Mesh;
  private chain: THREE.Vector3[] = [];
  private beadColors: THREE.Color[];
  private sage = col(COL.sage);
  private tmp = new THREE.Color();
  private sparks: Swarm;
  private sparkAt: THREE.Vector3[] = [];
  private m4 = new THREE.Matrix4();
  private scale = new THREE.Vector3();

  constructor(m: Mats) {
    const gum = new THREE.Mesh(gumGeometry(), m.gum);
    const tongue = new THREE.Mesh(tongueGeometry(), m.tongue);
    tongue.position.y = 0.2;
    const geos = toothGeometries();
    const fields = {molar: toothFields.molar(), premolar: toothFields.premolar(), canine: toothFields.canine(), incisor: toothFields.incisor()};
    const teeth = new THREE.Group();
    const slots = toothSlots();
    const m4 = new THREE.Matrix4();
    const add = (b: Blob) => this.blobs.push(b);
    slots.forEach((slot, si) => {
      const tooth = new THREE.Mesh(geos[slot.kind], m.pearl);
      tooth.position.set(slot.x, 0.72, slot.z);
      tooth.rotation.y = slot.yaw;
      tooth.scale.setScalar(slot.scale);
      tooth.updateMatrix();
      teeth.add(tooth);
      m4.copy(tooth.matrix);
      const field = fields[slot.kind];
      const toothQ = tooth.quaternion;
      const u = Math.atan2(slot.x / 2.75, slot.z / 3.3);
      // Blobs vanish as the brush passes this tooth.
      const gone = mix(C.brushOn, C.brushOff, clamp01((1.72 - u) / 3.44)) + 0.05;
      const spots: [number, number, number][] = [];
      // A soft band along the gum line (elongated along it), a little on the inner side, and two small
      // spots on the crown.
      for (let i = 0; i < 12; i++) {
        const a = mix(-0.34, Math.PI + 0.34, i / 11);
        spots.push([Math.cos(a) * 0.95, 0.0 + rand(si, i) * 0.07, Math.sin(a) * 0.95]);
      }
      spots.push([0.8, 0.05, -0.8], [-0.8, 0.05, -0.8], [si % 2 ? 0.34 : -0.3, 0.6, 0.95], [si % 2 ? -0.3 : 0.26, 0.38, 0.95]);
      spots.forEach(([x, y, z], i) => {
        const margin = i < 14;
        const p = projectOnto(field, v3(x, y, z));
        const n = normalAt(field, p);
        const nw = n.clone().applyQuaternion(toothQ);
        const tan = v3(0, 1, 0).cross(nw).normalize();
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tan, nw, tan.clone().cross(nw).normalize()));
        const size = (margin ? 0.062 : 0.075) + rand(si + i * 9, 6) * 0.04;
        p.addScaledVector(n, (size * 0.16) / slot.scale).applyMatrix4(m4);
        const born = margin ? C.margin + rand(si * 7 + i, 4) * 0.8 : C.tooth - 0.02 + rand(si * 3 + i, 5) * 0.55;
        add({p, q, size, long: margin ? 1.75 : 1.2, flat: 0.55, born, gone: gone + rand(i, si) * 0.12});
      });
    });
    const tf = tongueField();
    for (let i = 0; i < 40; i++) {
      const x = (rand(i, 11) - 0.5) * 2.1;
      const z = -2.0 + rand(i, 12) * 2.9;
      const y = dropOnto(tf, x, z, 1.6);
      if (y < 0.1) continue;
      add({p: v3(x, y + 0.2, z), q: new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), rand(i, 15) * 6.28), size: 0.1 + rand(i, 13) * 0.1, long: 1.4, flat: 0.45, born: C.tongue + rand(i, 14) * 0.42, gone: 0});
    }
    this.plaque = new Swarm(this.blobs.length, sphereGeo, m.plaque);

    // Protein chain hanging over the hero molar.
    for (let i = 0; i < 9; i++) {
      const k = i / 8 - 0.5;
      this.chain.push(v3(2.72 + k * 1.7 * 0.36, 1.9 + Math.sin(k * 8) * 0.16, 0.38 - k * 1.7 * 0.93 + Math.cos(k * 8) * 0.12));
    }
    this.beads = new Swarm(9, sphereGeo, gloss('#FFFFFF', {roughness: 0.25}));
    this.beadColors = Array.from({length: 9}, (_, i) => col([COL.peach, COL.lilac, COL.rose][i % 3]));
    this.beadColors.forEach((c, i) => this.beads.tint(i, c));
    this.links = new Swarm(8, new THREE.CapsuleGeometry(0.04, 1, 8, 16), gloss(COL.ink, {roughness: 0.3}));
    this.bubbles = new Swarm(46, sphereGeo, matte(COL.sage, {}, '#FFFFFF'));

    // Toothbrush: head + tufts; the tufts lean against the direction of travel.
    const body = new THREE.Mesh(brushBodyGeometry(), m.lilac);
    this.tufts = new Swarm(27, new THREE.CapsuleGeometry(0.1, 0.46, 8, 18), gloss('#FFFFFF', {roughness: 0.42}));
    const white = col('#FFFFFF');
    const mint = col(COL.mint);
    for (let i = 0; i < 27; i++) this.tufts.tint(i, i % 3 === 1 ? mint : white);
    this.brush.add(shadowed(body), this.tufts.mesh);
    this.foam = new Swarm(54, sphereGeo, gloss('#FFFFFF', {roughness: 0.14}, '#7FD8C6'));

    const scrape = new THREE.Mesh(scraperGeometry(), m.mint);
    this.mound = new THREE.Mesh(sphereGeo, m.plaque);
    this.mound.castShadow = true;
    this.scraper.add(shadowed(scrape), this.mound);
    this.mound.position.set(-0.26, 0.16, 0);

    const stage = plinth(5.6, 0.26, m.matteLilac);
    const mouth = new THREE.Group();
    mouth.add(shadowed(gum), shadowed(tongue), shadowed(teeth), this.plaque.mesh, this.beads.mesh, this.links.mesh, this.bubbles.mesh, this.brush, this.scraper, this.foam.mesh);
    mouth.position.y = 1.0;
    this.mouth = mouth;
    const star = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 ? 0.17 : 1;
      if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    this.sparks = new Swarm(16, new THREE.ExtrudeGeometry(star, {depth: 0.06, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4}), gloss('#FFFFFF', {roughness: 0.12, emissive: '#FFFFFF', emissiveIntensity: 0.3}), false);
    slots.forEach((s, i) => this.sparkAt.push(v3(s.x, 2.65 + rand(i, 7) * 0.5, s.z)));
    this.group.add(mouth, stage, this.sparks.mesh);
    this.group.position.copy(ARCH);
    this.group.visible = false;
  }
  private mouth: THREE.Group;

  update(t: number) {
    this.group.visible = t > C.mouth - 0.4 && t < 44.6;
    if (!this.group.visible) return;

    // Small inside the ring for the number, full size when the camera comes back.
    const grow = spring(t, C.mouth - 0.28, 1.9, 0.62);
    const big = t > C.back;
    const s = big ? 1 : 0.42 * grow;
    this.group.scale.setScalar(Math.max(0.001, s));

    const scrape = ramp(t, C.scraperOn + 0.45, C.habit - 0.14, easeInOut);
    const edgeZ = mix(-2.3, 1.75, scrape);
    let mounded = 0;
    this.blobs.forEach((b, i) => {
      let k = spring(t, b.born, 2.8, 0.46) * (1 + 0.28 * ramp(t, C.build, C.build + 1.3, easeInOut));
      if (b.gone > 0) k *= 1 - ramp(t, b.gone, b.gone + 0.13, easeIn);
      else if (b.p.z < edgeZ) {
        k = 0;
        mounded++;
      }
      const puls = 1 + 0.04 * Math.sin(t * 3 + i);
      const r = Math.max(0.0001, b.size * k * puls);
      this.plaque.mesh.setMatrixAt(i, this.m4.compose(b.p, b.q, this.scale.set(r * b.long, r * b.flat, r)));
    });
    this.plaque.commit();
    this.updateProtein(t);
    this.updateBrush(t);

    // Scraper: drops in behind the tongue, pulls forward, lifts away with what it collected.
    const sIn = spring(t, C.scraperOn, 1.9, 0.72);
    const sOut = ramp(t, C.habit - 0.1, C.habit + 0.5, easeIn);
    this.scraper.visible = sIn > 0.002 && sOut < 1;
    this.scraper.position.set(0, mix(5.5, 1.17, sIn) + sOut * 4.5, edgeZ + sOut * 2.5);
    this.scraper.rotation.set(0.06 - sOut * 0.4, -Math.PI / 2, 0.16);
    const heap = mix(0.04, 0.4, mounded / 34);
    this.mound.scale.set(heap * 0.62, heap * 0.5, heap * 1.5);

    // Gleam along the clean teeth.
    for (let i = 0; i < 16; i++) {
      const at = i < 14 ? C.habit + 0.05 + i * 0.045 : -1;
      const k = at < 0 ? 0 : hit(t, at, 0.09, 0.2);
      const p = this.sparkAt[i % this.sparkAt.length];
      this.sparks.set(i, p.x, p.y, p.z, Math.max(0.0001, 0.3 * k), Math.max(0.0001, 0.3 * k), 0.3);
    }
    this.sparks.commit();
  }

  private updateProtein(t: number) {
    const inK = spring(t, C.protein - 0.1, 2.0, 0.6);
    const live = t > C.protein - 0.2 && t < C.smell + 1;
    this.beads.mesh.visible = live;
    this.links.mesh.visible = live;
    this.bubbles.mesh.visible = t > C.split && t < 33;
    if (!live) return;
    const a = v3(0, 0, 0), b = v3(0, 0, 0), up = v3(0, 1, 0), q = new THREE.Quaternion();
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 9; i++) {
      const p = this.chain[i];
      const free = ramp(t, C.split + i * 0.075, C.split + i * 0.075 + 0.8, easeOut);
      const dir = i - 4;
      const lift = ramp(t, C.gas + i * 0.09, C.gas + i * 0.09 + 1.4, easeIn);
      const wob = Math.sin(t * 2 + i) * 0.03;
      const x = p.x + dir * 0.05 * free;
      const y = p.y + Math.sin(i * 2.1) * 0.24 * free + lift * 2.1 + wob;
      const z = p.z - dir * 0.12 * free + Math.cos(i * 1.7) * 0.1 * free;
      const size = (i % 3 === 1 ? 0.125 : 0.1) * inK * (1 - ramp(t, C.smell - 0.2, C.smell + 0.3, easeIn));
      this.beads.set(i, x, y, z, Math.max(0.0001, size));
      this.tmp.copy(this.beadColors[i]).lerp(this.sage, lift);
      this.beads.tint(i, this.tmp);
      if (i < 8) {
        const n = this.chain[i + 1];
        const gone = ramp(t, C.split + i * 0.075, C.split + i * 0.075 + 0.1, easeIn);
        a.copy(p);
        b.copy(n);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const d = b.clone().sub(a);
        const len = d.length();
        q.setFromUnitVectors(up, d.normalize());
        m4.compose(mid, q, v3(Math.max(0.0001, inK * (1 - gone)), Math.max(0.0001, len * (1 - gone) * inK), Math.max(0.0001, inK * (1 - gone))));
        this.links.mesh.setMatrixAt(i, m4);
      }
    }
    this.beads.commit();
    this.links.commit();
    // Gas bubbles off the plaque, rising into the cloud.
    for (let i = 0; i < 46; i++) {
      const at = C.gas + rand(i, 21) * 1.9;
      const u = clamp01((t - at) / 1.5);
      const s = u <= 0 || u >= 1 ? 0.0001 : (0.06 + rand(i, 22) * 0.1) * Math.sin(Math.PI * u) ** 0.6;
      const ang = mix(0.9, 2.1, rand(i, 23));
      const [ax, az] = archPoint(ang);
      const x = mix(ax, 1.9, u * u) + Math.sin(u * 6 + i) * 0.1;
      const y = mix(1.0, 4.1, u);
      const z = mix(az, -0.2, u * u) + Math.cos(u * 5 + i) * 0.1;
      this.bubbles.set(i, x, y, z, s);
    }
    this.bubbles.commit();
  }

  private updateBrush(t: number) {
    const inK = spring(t, C.brushIn, 1.3, 0.8);
    const out = ramp(t, C.brushOff, C.brushOff + 0.5, easeIn);
    this.brush.visible = inK > 0.002 && out < 1;
    this.foam.mesh.visible = t > C.brushOn && t < C.brushOff + 2.4;
    if (!this.brush.visible && !this.foam.mesh.visible) return;
    const u = brushU(t);
    const [x, z] = archPoint(u);
    const dx = 2.75 * Math.cos(u), dz = -3.3 * Math.sin(u);
    const yaw = Math.atan2(-dz, dx);
    const contact = 2.15;
    this.brush.position.set(x + (1 - inK) * 3, contact + (1 - inK) * 5.5 + out * 4, z + (1 - inK) * 3 + out * 3);
    this.brush.rotation.set(0, yaw + Math.PI, 0.05 + (1 - inK) * 0.4 + out * 0.5, 'YXZ');
    // Tuft lean follows the scrub velocity.
    const lean = Math.cos((t - C.brushOn) * 2 * Math.PI * 4.5) * 0.14 * clamp01((t - C.brushOn) * 6) * (1 - out);
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 3; j++) {
        const px = (i - 4) * 0.27;
        const pz = (j - 1) * 0.28;
        m4.makeShear(0, 0, lean, 0, 0, 0);
        m4.setPosition(px + lean * -0.36, -0.42, pz);
        this.tufts.mesh.setMatrixAt(n++, m4);
      }
    }
    this.tufts.mesh.instanceMatrix.needsUpdate = true;
    // Foam stays behind where the brush has been, then fizzes out.
    for (let i = 0; i < 54; i++) {
      const at = mix(C.brushOn + 0.1, C.brushOff - 0.1, i / 54);
      const age = t - at;
      const ku = mix(1.72, -1.72, (at - C.brushOn) / (C.brushOff - C.brushOn));
      const [fx, fz] = archPoint(ku);
      const life = 1.5 + rand(i, 31) * 0.8;
      const k = age <= 0 || age > life ? 0 : spring(t, at, 3, 0.5) * (1 - ramp(age, life - 0.4, life, easeIn));
      const r = (0.08 + rand(i, 32) * 0.15) * k;
      const a = rand(i, 33) * 6.28;
      this.foam.set(i, fx + Math.cos(a) * 0.55, 1.75 + rand(i, 34) * 0.42 + age * 0.08, fz + Math.sin(a) * 0.55, Math.max(0.0001, r));
    }
    this.foam.commit();
  }
}

// ---------- final tooth ----------
class HeroSet {
  group = new THREE.Group();
  private tooth: THREE.Mesh;
  private pad: THREE.Mesh;
  private blob: THREE.Mesh;
  private cloche = new THREE.Group();
  private lens = new THREE.Group();
  private sparks: Swarm;
  constructor(m: Mats) {
    const {molar} = toothGeometries();
    this.tooth = new THREE.Mesh(molar, m.pearl);
    this.tooth.position.set(0, 1.42, 0);
    this.tooth.scale.setScalar(1);
    this.pad = new THREE.Mesh(sphereGeo, m.gum);
    this.pad.scale.set(1.75, 0.92, 1.6);
    this.pad.position.y = 0.34;
    this.blob = new THREE.Mesh(sphereGeo, m.plaque);
    this.blob.position.set(0.1, 1.2, 1.02);
    this.blob.castShadow = true;
    const dome = new THREE.Mesh(clocheGeometry(), glass());
    dome.renderOrder = 3;
    const knob = new THREE.Mesh(sphereGeo, m.chrome);
    knob.scale.setScalar(0.17);
    knob.position.y = 2.6;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 16, 120), m.chrome);
    rim.rotation.x = Math.PI / 2;
    this.cloche.add(dome, knob, rim);
    this.cloche.scale.set(1, 1.75, 1);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.1, 24, 140), gloss(COL.berry, {roughness: 0.28}, '#7A1E44'));
    const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.86, 64), glass());
    lensGlass.renderOrder = 3;
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 1.6, 12, 24), m.ink);
    handle.position.set(0.98, -1.5, 0);
    handle.rotation.z = 0.56;
    this.lens.add(shadowed(ring), lensGlass, shadowed(handle));
    const star = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 ? 0.17 : 1;
      if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    this.sparks = new Swarm(18, new THREE.ExtrudeGeometry(star, {depth: 0.06, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4}), gloss('#FFFFFF', {roughness: 0.12, emissive: '#FFFFFF', emissiveIntensity: 0.3}), false);
    this.group.add(shadowed(this.tooth), shadowed(this.pad), this.blob, this.cloche, this.lens, this.sparks.mesh, plinth(2.6, 0.2, m.matteSky));
    this.group.position.copy(HERO);
    this.group.visible = false;
  }
  update(t: number) {
    this.group.visible = t > 44;
    if (!this.group.visible) return;

    // Cloche slams down on «дарах», the cloud throws it off on «биш».
    const drop = ramp(t, C.press - 0.26, C.press, easeIn);
    const bounce = 0.14 * hit(t, C.press, 0.03, 0.08);
    const off = ramp(t, C.not + 0.02, C.not + 0.42, easeOut);
    this.cloche.visible = t > C.press - 0.3 && t < C.not + 0.5;
    this.cloche.position.set(off * 2.2, mix(9, 0.2, drop) + bounce + off * 8, off * 0.4);
    this.cloche.rotation.z = -off * 0.8;

    // Lens swings in over the real cause and locks onto it.
    const lensIn = spring(t, C.root - 0.1, 1.5, 0.74);
    const lock = hit(t, C.find, 0.03, 0.16);
    const lensOut = ramp(t, C.treat + 0.2, C.treat + 0.6, easeIn);
    this.lens.visible = lensIn > 0.002 && lensOut < 1;
    this.lens.position.set(0.12 + (1 - lensIn) * 3.4 + lensOut * 3.4, 1.22 + (1 - lensIn) * -1.4, 2.0);
    this.lens.rotation.set(0, 0, (1 - lensIn) * -0.7);
    this.lens.scale.setScalar(1 + lock * 0.07);

    const blobPop = ramp(t, C.treat, C.treat + 0.16, easeIn);
    const seen = 1 + 0.36 * spring(t, C.find - 0.25, 2.6, 0.55);
    const pulse = 1 + 0.06 * Math.sin(t * 7) * clamp01(t - C.find);
    this.blob.visible = t > C.mask - 0.2 && blobPop < 1;
    this.blob.scale.set(0.3 * seen * pulse, 0.25 * seen * pulse, 0.26 * seen * pulse);
    this.blob.scale.multiplyScalar(1 - blobPop);

    const sink = ramp(t, C.logo - 0.05, C.logo + 0.5, easeIn);
    this.tooth.visible = sink < 1;
    this.tooth.scale.setScalar(Math.max(0.001, 1 - sink));
    this.tooth.rotation.y = 0.4 + t * 0.16 + sink * 3.2 + ramp(t, C.treat, C.logo, easeInOut) * Math.PI * 2;
    this.pad.visible = sink < 1;
    this.pad.scale.set(1.75 * (1 - sink) + 0.001, 0.92 * (1 - sink) + 0.001, 1.6 * (1 - sink) + 0.001);

    for (let i = 0; i < 18; i++) {
      const at = C.treat + 0.02 + i * 0.022;
      const k = hit(t, at, 0.08, 0.26);
      const a = i * 2.4;
      const r = 0.9 + rand(i, 41) * 1.1;
      this.sparks.set(i, Math.cos(a) * r, 1.3 + rand(i, 42) * 3.8 + (t - at) * 0.3, Math.sin(a) * r * 0.5 + 0.9, Math.max(0.0001, 0.22 * k), Math.max(0.0001, 0.22 * k), 0.22);
    }
    this.sparks.commit();
  }
}

// ---------- Empire logo ----------
class LogoSet {
  group = new THREE.Group();
  private bars: THREE.Mesh[] = [];
  private letters: THREE.Mesh[] = [];
  private tag: THREE.Group;
  constructor(m: Mats) {
    const loader = new SVGLoader();
    const shapes = (d: string) => loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths.flatMap((p) => p.toShapes());
    const inkMat = gloss(COL.navy, {roughness: 0.26}, '#2A3370');
    const extrude = (d: string, depth: number, bevel: number) => new THREE.ExtrudeGeometry(shapes(d), {depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelOffset: -bevel * 0.4, bevelSegments: 6, curveSegments: 14});
    const center = LOGO_W / 2;
    for (const d of MARK) {
      const mesh = new THREE.Mesh(extrude(d, 70, 16), inkMat);
      mesh.geometry.translate(-center, 0, 0);
      this.bars.push(shadowed(mesh));
    }
    for (const d of WORDMARK) {
      const geo = extrude(d, 44, 9);
      geo.computeBoundingBox();
      const cx = (geo.boundingBox!.min.x + geo.boundingBox!.max.x) / 2;
      geo.translate(-cx, -1234, 0);
      const mesh = new THREE.Mesh(geo, inkMat);
      mesh.userData.x = cx - center;
      this.letters.push(shadowed(mesh));
    }
    this.tag = new THREE.Group();
    for (const d of TAGLINE) {
      const mesh = new THREE.Mesh(extrude(d, 14, 2.4), inkMat);
      mesh.geometry.translate(-center, 0, 0);
      this.tag.add(mesh);
    }
    const inner = new THREE.Group();
    inner.add(...this.bars, ...this.letters, this.tag);
    const S = 0.0023;
    inner.scale.set(S, -S, S);
    inner.position.y = 5.5;
    this.group.add(inner);
    this.group.position.copy(HERO);
    this.group.visible = false;
  }
  update(t: number) {
    this.group.visible = t > C.logo - 0.1;
    if (!this.group.visible) return;
    this.group.rotation.y = 0.05 * Math.sin((t - C.logo) * 0.7) * (1 - ramp(t, C.logo, C.end, easeOut) * 0.5);
    this.bars.forEach((bar, i) => {
      const k = spring(t, C.logo + i * 0.07, 1.7, 0.72);
      const dir = i === 0 ? -1 : 1;
      bar.position.set(dir * (1 - k) * 2400, 0, (1 - k) * 600);
      bar.rotation.y = (1 - k) * dir * 1.1;
      bar.visible = k > 0.005;
    });
    this.letters.forEach((l, i) => {
      const start = C.word + i * 0.05;
      const u = t - start;
      const m = {y: 0, sy: 1, sx: 1};
      if (u < 0) l.visible = false;
      else {
        l.visible = true;
        const fall = 0.3;
        if (u < fall) m.y = 1100 * (1 - (u / fall) ** 2);
        else {
          const b = u - fall;
          m.y = b < 0.26 ? 4 * (b / 0.26) * (1 - b / 0.26) * 130 : 0;
          const sq = 0.26 * hit(t, start + fall, 0.015, 0.075);
          m.sy = 1 - sq;
          m.sx = 1 + sq * 0.5;
        }
      }
      // They come down behind the mark, not through it.
      l.position.set(l.userData.x as number, 1234 - m.y, -260 * clamp01(m.y / 500));
      l.scale.set(m.sx, m.sy, m.sx);
    });
    const k = spring(t, C.word + 0.5, 1.8, 0.8);
    this.tag.visible = k > 0.005;
    this.tag.scale.setScalar(Math.max(0.001, 0.94 + 0.06 * k));
    this.tag.position.y = (1 - k) * 50;
  }
}

// ---------- scenery ----------
// Soft forms far behind the sets, tinted towards the backdrop so they stay quiet. They fall out of
// focus and give every orbit its parallax.
class Scenery {
  group = new THREE.Group();
  private items: {mesh: THREE.Mesh; y: number; p: number}[] = [];
  private mats: {mat: THREE.MeshPhysicalMaterial; base: THREE.Color}[];
  constructor() {
    this.mats = [COL.lilac, COL.sky, COL.peach, COL.mint, COL.rose, COL.butter].map((hex) => ({mat: matte(hex), base: col(hex)}));
    const pill = new THREE.CapsuleGeometry(1, 2.2, 24, 48);
    const place: [number, number][] = [
      [-46, -30], [-30, -52], [-12, -58], [6, -60], [24, -62], [40, -56], [58, -44], [72, -20], [76, 6], [70, 30], [-58, -6], [-60, 16], [-52, 34], [52, 44],
    ];
    place.forEach(([x, z], i) => {
      const mesh = new THREE.Mesh(i % 3 === 1 ? pill : sphereGeo, this.mats[i % this.mats.length].mat);
      const y = 3 + rand(i, 53) * 15;
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(2.2 + rand(i, 54) * 2.8);
      mesh.rotation.set(rand(i, 56) * 3, rand(i, 57) * 3, rand(i, 58) * 3);
      this.group.add(mesh);
      this.items.push({mesh, y, p: rand(i, 59) * 6.28});
    });
  }
  update(t: number, bg: THREE.Color) {
    for (const {mat, base} of this.mats) mat.color.copy(bg).lerp(base, 0.55);
    for (const it of this.items) it.mesh.position.y = it.y + Math.sin(t * 0.32 + it.p) * 0.7;
  }
}

// ---------- world ----------
export class World {
  private m = MAT();
  private floorMat = new THREE.MeshStandardMaterial({color: '#EAE2F7', roughness: 0.82, envMapIntensity: 0.2});
  private bg = new THREE.Color();
  private fog = new THREE.Fog(0xffffff, 34, 96);
  private cloud = new Cloud();
  private doctor: DoctorSet;
  private globe: GlobeSet;
  private pipe: PipeSet;
  private mouth: MouthSet;
  private hero: HeroSet;
  private logo: LogoSet;
  private scenery: Scenery;
  private labels: Label[] = [];
  private eye = new THREE.Vector3();

  constructor(private studio: Studio) {
    const {scene} = studio;
    scene.environment = softboxEnvironment(studio.renderer);
    scene.environmentIntensity = 0.62;
    scene.background = this.bg;
    scene.fog = this.fog;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(130, 96), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(10, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    const m = this.m;
    this.doctor = new DoctorSet(m);
    this.globe = new GlobeSet(m);
    this.pipe = new PipeSet(m);
    this.mouth = new MouthSet(m);
    this.hero = new HeroSet(m);
    this.logo = new LogoSet(m);
    this.scenery = new Scenery();
    scene.add(this.doctor.group, this.globe.group, this.pipe.group, this.mouth.group, this.hero.group, this.logo.group, this.scenery.group, this.cloud.group);
    this.buildLabels();
    for (const l of this.labels) scene.add(l.group);
  }

  private buildLabels() {
    const m = this.m;
    const add = (o: ConstructorParameters<typeof Label>[0]) => {
      const l = new Label(o);
      this.labels.push(l);
      return l;
    };
    const P = (base: THREE.Vector3, x: number, y: number, z: number) => base.clone().add(v3(x, y, z));
    const white = gloss('#FFFFFF', {roughness: 0.26}, '#8A8FC0');

    // Hook: in place on frame 0, then the letters fall when the camera pulls back.
    add({text: 'АМНЫ ЭВГҮЙ', size: 0.4, anchor: P(DOC, 0, 0.16, 1.1), mat: white, at: C.pull + 0.02, style: 'drop', hold: true, height: 2.32, stagger: 0.016, out: C.halitosis - 0.26, face: 0});
    add({text: 'ҮНЭР', size: 0.8, anchor: P(DOC, 0, 0.16, 1.1), mat: white, at: C.pull + 0.14, style: 'drop', hold: true, height: 1.52, stagger: 0.02, out: C.halitosis - 0.26, face: 0});
    add({text: 'ХАЛИТОЗ', size: 0.76, anchor: P(DOC, 0.72, 0.16, 2.8), mat: m.ink, at: C.halitosis - 0.08, style: 'drop', height: 5.2, stagger: 0.03, out: C.leave + 0.1, face: 0.7});

    // Number: «80» lands alone, the rest pushes it left on «95».
    add({
      text: '80–95%',
      size: 0.76,
      anchor: P(ARCH, 0, 2.92, 0.3),
      mat: m.ink,
      at: C.n80 - 0.05,
      out: C.spin + 0.2,
      style: 'pop',
      stagger: 0,
      fx: (t, i, mo) => {
        const rest = spring(t, C.n95 - 0.04 + (i - 2) * 0.03, 3, 0.55);
        if (i >= 2) {
          mo.sx *= rest;
          mo.sy *= rest;
          mo.sz *= rest;
          mo.hidden = rest <= 0;
        } else {
          mo.x += (1 - rest) * 1.02;
        }
        const up = ramp(t, C.mouth - 0.3, C.mouth + 0.45, easeInOut);
        mo.y += up * 2.3;
      },
    });
    add({text: 'амны хөндийгөөс', size: 0.4, anchor: P(ARCH, 0, 4.22, 0.3), mat: m.berry, at: C.mouth, out: C.spin + 0.2, style: 'rise', stagger: 0.016, height: 1.2});

    // The tract.
    add({text: 'Зарим тохиолдолд', size: 100, anchor: PIPE, mat: m.ink, at: C.some, out: C.gullet - 0.5, style: 'rise', stagger: 0.012, height: 260, hud: {y: 0.74}});
    add({text: 'Хамар', size: 0.56, anchor: P(PIPE, 0.3, 7.25, 1.0), mat: m.ink, at: C.nose, out: C.back - 0.45, style: 'pop'});
    add({text: 'Улаан\nхоолой', size: 0.5, anchor: P(PIPE, 0.42, 5.55, 1.0), mat: m.ink, at: C.gullet, out: C.back - 0.45, style: 'pop'});
    add({text: 'Ходоод', size: 0.56, anchor: P(PIPE, 0.1, 1.7, 2.0), mat: m.ink, at: C.stomach, out: C.back - 0.45, style: 'pop'});

    // The mouth.
    add({text: 'Өнгөр', size: 180, anchor: ARCH, mat: m.ink, at: C.plaque, out: C.protein - 0.1, style: 'pop', hud: {y: 0.56}});
    add({text: 'Буйлны эрмэг', size: 112, anchor: ARCH, mat: m.ink, at: C.margin + 0.1, out: C.protein - 0.1, style: 'rise', stagger: 0.012, height: 240, hud: {y: -0.42}});
    add({text: 'Уураг задарна', size: 112, anchor: ARCH, mat: m.ink, at: C.protein, out: C.gas + 0.5, style: 'pop', stagger: 0.012, hud: {y: 0.62}});
    add({text: 'Эвгүй үнэр', size: 150, anchor: ARCH, mat: m.ink, at: C.smell, out: C.prevent + 1.1, style: 'drop', height: 600, stagger: 0.024, hud: {y: -0.36}});

    // Cleaning.
    add({text: 'Сойзоор', size: 150, anchor: ARCH, mat: m.ink, at: C.brushWord, out: C.brushOff + 0.2, style: 'pop', hud: {y: 0.6}});
    add({text: 'Хэл\nцэвэрлэгчээр', size: 116, anchor: ARCH, mat: m.ink, at: C.scraperWord - 0.06, out: C.habit - 0.14, style: 'pop', stagger: 0.012, hud: {y: 0.58}});
    add({text: 'Хэвшээрэй', size: 170, anchor: ARCH, mat: m.ink, at: C.habit, out: C.even + 1.0, style: 'drop', height: 700, stagger: 0.022, hud: {y: 0.02}});

    // Doctor.
    add({text: 'Арилахгүй\nбайвал', size: 136, anchor: ARCH, mat: m.ink, at: C.still, out: C.doctor - 0.02, style: 'pop', stagger: 0.02, hud: {y: 0.0}});
    add({text: 'Эмчид хандаарай', size: 88, anchor: DOC, mat: white, at: C.doctor + 0.55, out: C.key - 0.5, style: 'rise', stagger: 0.016, height: 220, hud: {y: -0.36}});

    // Main idea: the cloche's landing crushes «дарах»; «биш» springs back.
    const pressK = (t: number) => hit(t, C.press, 0.03, 0.26);
    add({
      text: 'Түр дарах биш',
      size: 0.46,
      anchor: P(HERO, 0, 0.26, 3.0),
      mat: m.ink,
      at: C.mask,
      out: C.root - 0.04,
      style: 'drop',
      stagger: 0.03,
      height: 2.6,
      face: 0.75,
      fx: (t, i, mo: Motion) => {
        const crushed = i >= 3 && i <= 7;
        if (crushed) {
          const q = pressK(t);
          mo.sy *= 1 - 0.62 * q;
          mo.sx *= 1 + 0.2 * q;
        }
        if (i >= 8) {
          const k = spring(t, C.not - 0.04 + (i - 8) * 0.04, 3, 0.45);
          mo.hidden = k <= 0;
          mo.sx *= k;
          mo.sy *= k;
          mo.sz *= k;
          mo.y = k * 0;
        }
      },
    });
    add({text: 'Үндсэн\nшалтгааныг ол', size: 112, anchor: HERO, mat: m.ink, at: C.root, out: C.logo - 0.34, style: 'pop', stagger: 0.012, hud: {y: 0.46}});
  }

  frame(image: HTMLVideoElement | HTMLImageElement) {
    this.doctor.frame(image);
  }

  private view(t: number, jitter: {x: number; y: number}, aperture: number): View {
    const l = this.lens(t);
    const forward = l.target.clone().sub(l.position).normalize();
    const right = forward.clone().cross(v3(0, 1, 0)).normalize();
    const up = right.clone().cross(forward);
    return {position: l.position, right, up, forward, halfH: l.focus * Math.tan((FOV * Math.PI) / 360), focus: l.focus, jitter: {x: jitter.x * aperture, y: jitter.y * aperture}};
  }

  update(t: number, jitter = {x: 0, y: 0}) {
    const l = this.lens(t);
    this.eye.copy(l.position);
    bgAt(t, this.bg);
    this.fog.color.copy(this.bg);
    this.floorMat.color.copy(this.bg);
    this.doctor.update(t);
    this.globe.update(t);
    this.pipe.update(t);
    this.mouth.update(t);
    this.hero.update(t);
    this.logo.update(t);
    this.scenery.update(t, this.bg);
    this.cloud.update(t);
    const view = (lag: number) => this.view(t - lag, jitter, l.aperture);
    for (const label of this.labels) label.update(t, this.eye, view);
    return l;
  }

  lens(t: number): Lens {
    const az = cam(t, 4) + 0.012 * Math.sin(t * 0.61) * ramp(t, 3, 4, easeInOut);
    const el = cam(t, 5) + 0.006 * Math.sin(t * 0.83 + 1) * ramp(t, 3, 4, easeInOut);
    const d = cam(t, 6);
    const target = v3(cam(t, 1), cam(t, 2), cam(t, 3));
    const position = target.clone().add(v3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d));
    return {position, target, roll: 0, fov: FOV, focus: d + cam(t, 8), aperture: cam(t, 7)};
  }

  rig(t: number): Rig {
    return {
      keyDir: v3(-0.5, 1, 0.55),
      keySize: 0.3,
      keyLevel: 1.45,
      domeLevel: 2.2,
      exposure: 1,
      focusPoint: v3(cam(t, 1), 1.5, cam(t, 3)),
      shadowRadius: 13,
    };
  }
}
