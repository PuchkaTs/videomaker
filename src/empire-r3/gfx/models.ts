import * as THREE from 'three';
import {capsule, carve, cone, ellipsoid, meshSDF, roundBox, smin, sphere, union, type SDF, type V3} from './sdf';

// All sculpted forms of the reel. Coordinates: y up; a molar is about 1.6 wide; the dental arch fits
// inside a 6 × 7 footprint centred on the origin with its base at y = 0.

// ---------- teeth ----------
const molarField = () =>
  carve(
    0.2,
    union(
      0.3,
      roundBox([0, 0.32, 0], [0.8, 0.58, 0.72], 0.44),
      sphere([0.41, 0.74, 0.36], 0.37),
      sphere([-0.41, 0.74, 0.36], 0.37),
      sphere([0.41, 0.74, -0.36], 0.37),
      sphere([-0.41, 0.74, -0.36], 0.37),
      cone([0.4, -0.05, 0.02], [0.52, -1.5, 0.08], 0.44, 0.13),
      cone([-0.4, -0.05, -0.02], [-0.5, -1.42, -0.06], 0.44, 0.13),
    ),
    sphere([0, 1.3, 0], 0.46),
    capsule([-0.62, 1.2, 0], [0.62, 1.2, 0], 0.13),
    capsule([0, 1.2, -0.62], [0, 1.2, 0.62], 0.13),
  );

const premolarField = () =>
  carve(
    0.16,
    union(0.26, roundBox([0, 0.3, 0], [0.6, 0.55, 0.62], 0.4), sphere([0, 0.74, 0.3], 0.34), sphere([0, 0.74, -0.3], 0.34), cone([0, -0.05, 0], [0, -1.4, 0], 0.44, 0.12)),
    capsule([-0.7, 1.08, 0], [0.7, 1.08, 0], 0.16),
  );

const canineField = () => union(0.3, roundBox([0, 0.24, 0], [0.52, 0.55, 0.5], 0.38), sphere([0, 0.82, 0], 0.26), cone([0, -0.05, 0], [0, -1.5, 0], 0.4, 0.1));

const incisorField = () => union(0.24, roundBox([0, 0.3, 0], [0.5, 0.68, 0.26], 0.2), cone([0, -0.05, 0], [0, -1.3, 0], 0.34, 0.09));

export const toothFields = {molar: molarField, premolar: premolarField, canine: canineField, incisor: incisorField};

// Walks a point along the field's gradient onto its surface.
export const projectOnto = (f: SDF, p: THREE.Vector3) => {
  const e = 0.01;
  for (let i = 0; i < 6; i++) {
    const d = f(p.x, p.y, p.z);
    const g = new THREE.Vector3(f(p.x + e, p.y, p.z) - f(p.x - e, p.y, p.z), f(p.x, p.y + e, p.z) - f(p.x, p.y - e, p.z), f(p.x, p.y, p.z + e) - f(p.x, p.y, p.z - e)).normalize();
    p.addScaledVector(g, -d);
  }
  return p;
};

export const toothGeometries = () => ({
  molar: meshSDF(molarField(), [-1.15, -1.75, -1.1], [1.15, 1.4, 1.1], 110),
  premolar: meshSDF(premolarField(), [-0.9, -1.65, -0.95], [0.9, 1.35, 0.95], 90),
  canine: meshSDF(canineField(), [-0.8, -1.7, -0.8], [0.8, 1.35, 0.8], 80),
  incisor: meshSDF(incisorField(), [-0.8, -1.5, -0.55], [0.8, 1.2, 0.55], 80),
});

// ---------- dental arch ----------
export const ARCH_A = 2.75;
export const ARCH_B = 3.3;
export const ARCH_MAX = 1.98;

export const archPoint = (u: number): [number, number] => [ARCH_A * Math.sin(u), ARCH_B * Math.cos(u)];

export type ToothSlot = {kind: 'molar' | 'premolar' | 'canine' | 'incisor'; x: number; z: number; yaw: number; scale: number};

const KINDS: ToothSlot['kind'][] = ['incisor', 'incisor', 'canine', 'premolar', 'premolar', 'molar', 'molar'];
const WIDTHS = [0.36, 0.33, 0.4, 0.43, 0.45, 0.56, 0.54];

// Tooth positions by arc length along the arch: centre line outwards, mirrored.
export const toothSlots = () => {
  const table: {u: number; s: number}[] = [];
  let s = 0;
  let prev = archPoint(0);
  for (let i = 1; i <= 400; i++) {
    const u = (i / 400) * ARCH_MAX;
    const p = archPoint(u);
    s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
    table.push({u, s});
  }
  const uAt = (len: number) => (table.find((e) => e.s >= len) ?? table[table.length - 1]).u;
  const slots: ToothSlot[] = [];
  let run = 0;
  KINDS.forEach((kind, i) => {
    const half = WIDTHS[i];
    const u = uAt(run + half);
    run += half * 2.02;
    for (const side of [1, -1]) {
      const [x, z] = archPoint(u * side);
      // Tangent yaw: the tooth's x axis follows the arch.
      const dx = ARCH_A * Math.cos(u * side);
      const dz = -ARCH_B * Math.sin(u * side);
      slots.push({kind, x, z, yaw: Math.atan2(-dz, dx), scale: 1});
    }
  });
  return slots.map((slot) => ({...slot, scale: {molar: 0.67, premolar: 0.74, canine: 0.76, incisor: 0.68}[slot.kind]}));
};

const polylineDistance2D = (pts: [number, number][]) => (x: number, z: number) => {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const ex = bx - ax, ez = bz - az;
    const px = x - ax, pz = z - az;
    const h = Math.min(1, Math.max(0, (px * ex + pz * ez) / (ex * ex + ez * ez)));
    const dx = px - ex * h, dz = pz - ez * h;
    const d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
};

export const gumGeometry = () => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) pts.push(archPoint(-ARCH_MAX + (2 * ARCH_MAX * i) / 40));
  const dist = polylineDistance2D(pts);
  // Scalloped gum line: a papilla between each pair of teeth.
  const slots = toothSlots();
  const papillae: V3[] = [];
  for (let side = 0; side < 2; side++) {
    const row = slots.filter((_, i) => i % 2 === side);
    for (let i = 0; i < row.length - 1; i++) papillae.push([(row[i].x + row[i + 1].x) / 2, 0.42, (row[i].z + row[i + 1].z) / 2]);
  }
  papillae.push([0, 0.42, ARCH_B]);
  const bumps = papillae.map((p) => ellipsoid(p, [0.27, 0.34, 0.62]));
  const ridge: SDF = (x, y, z) => {
    const d = dist(x, z);
    const dy = (y - 0.05) * 1.25;
    return Math.sqrt(d * d + dy * dy) - 0.74;
  };
  const pad = ellipsoid([0, -0.05, -0.15], [2.35, 0.34, 3.2]);
  const field: SDF = (x, y, z) => {
    let d = smin(ridge(x, y, z), pad(x, y, z), 0.5);
    if (y > 0 && y < 1.1 && d < 0.8) for (const bump of bumps) d = smin(d, bump(x, y, z), 0.22);
    return d;
  };
  return meshSDF(field, [-4.1, -0.95, -3.9], [4.1, 1.05, 4.6], 150);
};

export const tongueGeometry = () => {
  const field = carve(
    0.7,
    union(0.8, ellipsoid([0, 0.34, -0.55], [1.5, 0.5, 1.75]), ellipsoid([0, 0.34, 0.9], [1.12, 0.42, 1.2])),
    capsule([0, 1.0, -2.2], [0, 0.98, 1.7], 0.26),
  );
  return meshSDF(field, [-1.8, -0.4, -2.6], [1.8, 1.0, 2.4], 110);
};

// ---------- helpers ----------
export const sphereGeo = new THREE.SphereGeometry(1, 64, 44);

// ---------- field access for placing plaque on surfaces ----------
export const tongueField = () =>
  carve(
    0.7,
    union(0.8, ellipsoid([0, 0.34, -0.55], [1.5, 0.5, 1.75]), ellipsoid([0, 0.34, 0.9], [1.12, 0.42, 1.2])),
    capsule([0, 1.0, -2.2], [0, 0.98, 1.7], 0.26),
  );

// Lowers a point straight down onto a field's surface.
export const dropOnto = (f: SDF, x: number, z: number, from = 2) => {
  let y = from;
  for (let i = 0; i < 48; i++) {
    const d = f(x, y, z);
    if (d < 0.002) break;
    y -= d;
  }
  return y;
};

// ---------- the tract: nose, gullet, stomach ----------
export const noseGeometry = () => {
  const field = carve(
    0.1,
    union(
      0.34,
      ellipsoid([0, 0.2, -0.55], [1.25, 1.65, 0.55]),
      cone([0, 1.15, -0.12], [0, -0.05, 0.42], 0.24, 0.42),
      sphere([0.46, -0.16, 0.16], 0.32),
      sphere([-0.46, -0.16, 0.16], 0.32),
    ),
    sphere([0.24, -0.5, 0.3], 0.15),
    sphere([-0.24, -0.5, 0.3], 0.15),
  );
  return meshSDF(field, [-1.5, -1.6, -1.2], [1.5, 2, 1], 100);
};

export const stomachGeometry = () => {
  const field = union(0.55, sphere([-0.62, 0.62, 0], 0.72), sphere([0.1, -0.05, 0.02], 1.02), sphere([0.82, -0.82, 0], 0.62), cone([-0.7, 1.1, 0], [-0.76, 1.75, 0], 0.32, 0.26), cone([0.95, -1.1, 0], [1.75, -1.0, 0], 0.26, 0.2));
  return meshSDF(field, [-1.7, -1.8, -1.3], [2.1, 2.1, 1.3], 100);
};

// ---------- tools ----------
// Toothbrush: head at the origin with bristles pointing to -y, handle along +x.
export const brushBodyGeometry = () => {
  const field = union(0.22, roundBox([0, 0, 0], [1.3, 0.15, 0.5], 0.14), cone([1.15, 0.05, 0], [3.1, 0.34, 0], 0.15, 0.2), cone([3.1, 0.34, 0], [8.2, 0.7, 0], 0.26, 0.36));
  return meshSDF(field, [-1.6, -0.5, -0.8], [8.8, 1.4, 0.8], 210);
};

// Tongue scraper: a U whose front bar lies along z = 0, grips running to +x.
export const scraperGeometry = () => {
  const r = 0.16;
  const bar = (a: V3, b: V3) => capsule(a, b, r);
  const field = union(0.34, bar([0, 0, -0.95], [0, 0, 0.95]), bar([0, 0, -0.95], [3.6, 0.5, -0.5]), bar([0, 0, 0.95], [3.6, 0.5, 0.5]), cone([3.5, 0.5, -0.5], [6.6, 0.8, -0.34], 0.2, 0.26), cone([3.5, 0.5, 0.5], [6.6, 0.8, 0.34], 0.2, 0.26));
  return meshSDF(field, [-0.5, -0.5, -1.4], [7.2, 1.4, 1.4], 180);
};

export const pinGeometry = () => meshSDF(union(0.1, sphere([0, 0.95, 0], 0.4), cone([0, 0.75, 0], [0, 0.02, 0], 0.26, 0.05)), [-0.55, -0.15, -0.55], [0.55, 1.45, 0.55], 44);

// A tube bent into a circle, built so that a draw range reveals it as an arc from angle 0.
export const arcTube = (R: number, r: number, tubular = 300, radial = 28) => {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= tubular; i++) {
    const a = (i / tubular) * Math.PI * 2;
    for (let j = 0; j <= radial; j++) {
      const b = (j / radial) * Math.PI * 2;
      const cx = Math.cos(a), sx = Math.sin(a);
      const nr = Math.cos(b), ny = Math.sin(b);
      pos.push((R + r * nr) * cx, r * ny, (R + r * nr) * sx);
      nor.push(nr * cx, ny, nr * sx);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j, b = a + row, c = b + 1, d = a + 1;
      idx.push(a, d, b, d, c, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return {geo, indicesPerSegment: radial * 6, tubular};
};

// Glass dome: open at the bottom, knob on top.
export const clocheGeometry = () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 0.5;
    pts.push(new THREE.Vector2(Math.cos(a) * 2.1 + 0.001, Math.sin(a) * 2.5));
  }
  return new THREE.LatheGeometry(pts, 96);
};

export const cloudGeometry = (puffs: readonly (readonly [number, number, number, number])[]) => meshSDF(union(0.075, ...puffs.map(([x, y, z, r]) => sphere([x, y, z], r))), [-2.1, -1.4, -1.5], [2.1, 1.5, 1.2], 100);

export const normalAt = (f: SDF, p: THREE.Vector3) => {
  const e = 0.01;
  return new THREE.Vector3(f(p.x + e, p.y, p.z) - f(p.x - e, p.y, p.z), f(p.x, p.y + e, p.z) - f(p.x, p.y - e, p.z), f(p.x, p.y, p.z + e) - f(p.x, p.y, p.z - e)).normalize();
};
