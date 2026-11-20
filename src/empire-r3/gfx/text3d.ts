import opentype from 'opentype.js';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {clamp01, easeIn, hit, ramp, rand, spring} from '../../kublai-agents-v2/time';

// Rounded 3D type. Nunito Black keeps its soft terminals under a generous bevel, so letters read as
// moulded objects. Every glyph is its own mesh with its pivot at the middle of the baseline, because
// letters here fall, land and squash like the rest of the props. Fontsource splits the face by
// subset: Ө and Ү live in cyrillic-ext.

let fonts: opentype.Font[] = [];
export const loadFonts = async () => {
  if (fonts.length) return;
  fonts = await Promise.all(
    ['latin', 'cyrillic', 'cyrillic-ext'].map(async (subset) => {
      const res = await fetch(staticFile(`empire-r3/fonts/nunito-${subset}-900-normal.woff`));
      return opentype.parse(await res.arrayBuffer());
    }),
  );
};

const find = (ch: string) => {
  for (const font of fonts) {
    const glyph = font.charToGlyph(ch);
    if (glyph.index !== 0) return {font, glyph};
  }
  throw new Error(`Nunito has no glyph for "${ch}"`);
};

const cache = new Map<string, THREE.BufferGeometry>();

// Size 1 geometry, scaled per label so all labels share one mesh per letter.
const glyphGeo = (ch: string) => {
  const hitCache = cache.get(ch);
  if (hitCache) return hitCache;
  const {font, glyph} = find(ch);
  const path = new THREE.ShapePath();
  const unit = 1 / font.unitsPerEm;
  for (const c of glyph.getPath(0, 0, font.unitsPerEm).commands) {
    if (c.type === 'M') path.moveTo(c.x * unit, -c.y * unit);
    else if (c.type === 'L') path.lineTo(c.x * unit, -c.y * unit);
    else if (c.type === 'Q') path.quadraticCurveTo(c.x1 * unit, -c.y1 * unit, c.x * unit, -c.y * unit);
    else if (c.type === 'C') path.bezierCurveTo(c.x1 * unit, -c.y1 * unit, c.x2 * unit, -c.y2 * unit, c.x * unit, -c.y * unit);
    else if (c.type === 'Z') path.currentPath?.closePath();
  }
  const bevel = 0.042;
  let geo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(path.toShapes(), {depth: 0.2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel * 0.55, bevelSegments: 7, curveSegments: 10});
  const adv = (glyph.advanceWidth ?? 0) * unit;
  geo.translate(-adv / 2, 0, -0.1);
  geo = toCreasedNormals(geo, 1.05);
  cache.set(ch, geo);
  return geo;
};

const advance = (ch: string) => {
  if (ch === ' ') return 0.3;
  const {font, glyph} = find(ch);
  return (glyph.advanceWidth ?? 0) / font.unitsPerEm;
};

// A label can ride the camera instead of standing in the world: `hud` places it at a fixed spot in the
// frame (x, y in -1..1 of the half frame), a little behind the real camera in time so it drifts like a
// floating object. Its size and height are then in output pixels (frame height 1920).
export type Hud = {x?: number; y: number; depth?: number; lag?: number};

export type View = {position: THREE.Vector3; right: THREE.Vector3; up: THREE.Vector3; forward: THREE.Vector3; halfH: number; focus: number; jitter: {x: number; y: number}};

export type Motion = {x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number; hidden?: boolean};

type LabelOpts = {
  text: string;
  size: number;
  anchor: THREE.Vector3;
  mat: THREE.Material;
  at: number;
  out?: number;
  style?: 'drop' | 'pop' | 'rise';
  // 1 faces the camera fully; lower values let the camera orbit reveal the letter depth.
  face?: number;
  stagger?: number;
  height?: number;
  // Keep the letters waiting in the air at `height` until they fall.
  hold?: boolean;
  hud?: Hud;
  // Extra per-letter behaviour, added on top of the entrance.
  fx?: (t: number, i: number, m: Motion) => void;
};

export class Label {
  group = new THREE.Group();
  private letters: {mesh: THREE.Mesh; x: number; i: number}[] = [];
  private o: LabelOpts;
  width = 0;

  constructor(o: LabelOpts) {
    this.o = o;
    const lines = o.text.split('\n');
    lines.forEach((line, ln) => {
      const chars = [...line];
      const w = chars.reduce((s, c) => s + advance(c), 0);
      this.width = Math.max(this.width, w * o.size);
      let x = -w / 2;
      for (const ch of chars) {
        const a = advance(ch);
        if (ch !== ' ') {
          const mesh = new THREE.Mesh(glyphGeo(ch), o.mat);
          mesh.castShadow = !o.hud;
          mesh.receiveShadow = true;
          mesh.userData.line = (lines.length - 1 - ln) * 1.08 * o.size;
          this.letters.push({mesh, x: (x + a / 2) * o.size, i: this.letters.length});
          this.group.add(mesh);
        }
        x += a;
      }
    });
    this.group.position.copy(o.anchor);
    this.group.visible = false;
  }

  private basis = new THREE.Matrix4();

  private ride(view: View, hud: Hud) {
    const {x = 0, y, depth = 0.74} = hud;
    const D = view.focus * depth;
    const halfH = (view.halfH / view.focus) * D;
    const carry = 1 - D / view.focus;
    const g = this.group;
    g.position
      .copy(view.position)
      .addScaledVector(view.forward, D)
      .addScaledVector(view.right, x * halfH * (9 / 16) + view.jitter.x * carry)
      .addScaledVector(view.up, y * halfH + view.jitter.y * carry);
    this.basis.makeBasis(view.right, view.up, view.forward.clone().negate());
    g.quaternion.setFromRotationMatrix(this.basis);
    // A slight turn so the letters show their thickness.
    g.rotateY(-0.1 + x * -0.2);
    g.rotateX(0.1);
    g.scale.setScalar((2 * halfH) / 1920);
  }

  update(t: number, cam: THREE.Vector3, view: (lag: number) => View) {
    const {at, out, size, style = 'pop', face = 0.85, stagger = 0.028, height = 2.4, hold = false, fx} = this.o;
    const n = this.letters.length;
    const live = (hold || t >= at - 0.1) && (out === undefined || t <= out + 0.6);
    this.group.visible = live;
    if (!live) return;

    if (this.o.hud) {
      this.ride(view(this.o.hud.lag ?? 0.09), this.o.hud);
    } else {
      const dx = cam.x - this.group.position.x;
      const dz = cam.z - this.group.position.z;
      this.group.rotation.y = Math.atan2(dx, dz) * face;
    }

    for (const {mesh, x, i} of this.letters) {
      const start = at + i * stagger;
      const m: Motion = {x, y: mesh.userData.line as number, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1};
      const wob = rand(i, 3) - 0.5;
      if (style === 'drop') {
        // Falls under gravity, lands, bounces twice, squashes on contact.
        const fall = 0.3;
        const u = t - start;
        if (u < 0) {
          if (hold) m.y += height;
          else m.hidden = true;
        } else if (u < fall) {
          const k = u / fall;
          m.y += height * (1 - k * k);
          m.rz += wob * 0.5 * (1 - k);
          m.sy *= 1 + 0.16 * k;
          m.sx *= 1 - 0.07 * k;
        } else {
          const land = u - fall;
          const b1 = 0.26, b2 = 0.13;
          const bounce = land < b1 ? 4 * (land / b1) * (1 - land / b1) * 0.34 : land < b1 + b2 ? 4 * ((land - b1) / b2) * (1 - (land - b1) / b2) * 0.09 : 0;
          m.y += bounce * height * 0.5;
          const sq = 0.3 * hit(t, start + fall, 0.015, 0.075) + 0.12 * hit(t, start + fall + b1, 0.015, 0.06);
          m.sy *= 1 - sq;
          m.sx *= 1 + sq * 0.55;
          m.sz *= 1 + sq * 0.55;
          m.rz += wob * 0.14 * Math.exp(-land * 6) * Math.cos(land * 20);
        }
      } else if (style === 'pop') {
        const k = spring(t, start, 2.6, 0.5);
        if (k <= 0) m.hidden = true;
        m.sx *= k;
        m.sy *= k;
        m.sz *= k;
        m.rx += (1 - k) * -0.9;
        m.y += (1 - k) * -size * 0.5;
      } else {
        const k = spring(t, start, 2.2, 0.72);
        if (k <= 0) m.hidden = true;
        m.y += (1 - k) * -height * 0.5;
        m.rx += (1 - k) * 1.3;
        m.sx *= clamp01(k * 2.5);
        m.sy *= clamp01(k * 2.5);
        m.sz *= clamp01(k * 2.5);
      }
      if (out !== undefined) {
        const e = ramp(t, out + (i / n) * 0.16, out + (i / n) * 0.16 + 0.34, easeIn);
        const s = 1 - e;
        m.sx *= s;
        m.sy *= s;
        m.sz *= s;
        m.y += e * size * 0.5;
        m.rz += e * wob * 1.2;
      }
      fx?.(t, i, m);
      mesh.visible = !m.hidden && m.sx > 0.001;
      mesh.position.set(m.x, m.y, m.z);
      mesh.rotation.set(m.rx, m.ry, m.rz);
      mesh.scale.set(size * m.sx, size * m.sy, size * m.sz);
    }
  }
}
