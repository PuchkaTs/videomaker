import * as THREE from 'three';

// Signed-distance modelling: every organic form in the reel (teeth, gums, tongue, nose, stomach) is a
// smooth union of a few primitives, meshed with surface nets. Normals come from the field's gradient,
// so surfaces stay perfectly smooth at any crop, which is what gives the soft "premium 3D" read.

export type SDF = (x: number, y: number, z: number) => number;
export type V3 = readonly [number, number, number];

export const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

export const sphere = (c: V3, r: number): SDF => (x, y, z) => {
  const dx = x - c[0], dy = y - c[1], dz = z - c[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
};

export const ellipsoid = (c: V3, r: V3): SDF => (x, y, z) => {
  const px = x - c[0], py = y - c[1], pz = z - c[2];
  const ax = px / r[0], ay = py / r[1], az = pz / r[2];
  const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
  const bx = ax / r[0], by = ay / r[1], bz = az / r[2];
  const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
  return k1 < 1e-9 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1;
};

export const roundBox = (c: V3, half: V3, r: number): SDF => (x, y, z) => {
  const qx = Math.abs(x - c[0]) - half[0] + r;
  const qy = Math.abs(y - c[1]) - half[1] + r;
  const qz = Math.abs(z - c[2]) - half[2] + r;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
};

// A capsule whose radius tapers from r1 at a to r2 at b.
export const cone = (a: V3, b: V3, r1: number, r2: number): SDF => {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const l2 = bx * bx + by * by + bz * bz;
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const h = Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / l2));
    const dx = px - bx * h, dy = py - by * h, dz = pz - bz * h;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - (r1 + (r2 - r1) * h);
  };
};

export const capsule = (a: V3, b: V3, r: number) => cone(a, b, r, r);

export const union = (k: number, ...parts: SDF[]): SDF => (x, y, z) => {
  let d = parts[0](x, y, z);
  for (let i = 1; i < parts.length; i++) d = smin(d, parts[i](x, y, z), k);
  return d;
};

export const carve = (k: number, body: SDF, ...cuts: SDF[]): SDF => (x, y, z) => {
  let d = body(x, y, z);
  for (const cut of cuts) d = smax(d, -cut(x, y, z), k);
  return d;
};

const CORNERS = Array.from({length: 8}, (_, i) => [i & 1, (i >> 1) & 1, (i >> 2) & 1] as const);
const EDGES: [number, number][] = [];
for (let a = 0; a < 8; a++) for (const bit of [1, 2, 4]) if (!(a & bit)) EDGES.push([a, a | bit]);

// Naive surface nets over a regular grid. `res` is the cell count along the longest side.
export const meshSDF = (f: SDF, min: V3, max: V3, res: number) => {
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const cell = Math.max(...size) / res;
  const nx = Math.ceil(size[0] / cell) + 1;
  const ny = Math.ceil(size[1] / cell) + 1;
  const nz = Math.ceil(size[2] / cell) + 1;
  const grid = new Float32Array(nx * ny * nz);
  let g = 0;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) grid[g++] = f(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);

  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const ids = new Int32Array(nx * ny * nz).fill(-1);
  const pos: number[] = [];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const [a, b, d] = CORNERS[c];
          v[c] = grid[at(i + a, j + b, k + d)];
          if (v[c] < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let px = 0, py = 0, pz = 0, count = 0;
        for (const [a, b] of EDGES) {
          if (((mask >> a) & 1) === ((mask >> b) & 1)) continue;
          const s = v[a] / (v[a] - v[b]);
          const ca = CORNERS[a], cb = CORNERS[b];
          px += ca[0] + (cb[0] - ca[0]) * s;
          py += ca[1] + (cb[1] - ca[1]) * s;
          pz += ca[2] + (cb[2] - ca[2]) * s;
          count++;
        }
        ids[at(i, j, k)] = pos.length / 3;
        pos.push(min[0] + (i + px / count) * cell, min[1] + (j + py / count) * cell, min[2] + (k + pz / count) * cell);
      }
    }
  }

  const index: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) index.push(a, b, c, a, c, d);
    else index.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const s0 = grid[at(i, j, k)] < 0;
        if (s0 !== grid[at(i + 1, j, k)] < 0) quad(ids[at(i, j - 1, k - 1)], ids[at(i, j, k - 1)], ids[at(i, j, k)], ids[at(i, j - 1, k)], s0);
        if (s0 !== grid[at(i, j + 1, k)] < 0) quad(ids[at(i - 1, j, k - 1)], ids[at(i - 1, j, k)], ids[at(i, j, k)], ids[at(i, j, k - 1)], s0);
        if (s0 !== grid[at(i, j, k + 1)] < 0) quad(ids[at(i - 1, j - 1, k)], ids[at(i, j - 1, k)], ids[at(i, j, k)], ids[at(i - 1, j, k)], s0);
      }
    }
  }

  // Newton step onto the true surface, then normals from the gradient.
  const e = cell * 0.35;
  const position = new Float32Array(pos);
  const normal = new Float32Array(pos.length);
  for (let i = 0; i < position.length; i += 3) {
    let x = position[i], y = position[i + 1], z = position[i + 2];
    for (let step = 0; step < 2; step++) {
      const gx = f(x + e, y, z) - f(x - e, y, z);
      const gy = f(x, y + e, z) - f(x, y - e, z);
      const gz = f(x, y, z + e) - f(x, y, z - e);
      const l = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
      const nx2 = gx / l, ny2 = gy / l, nz2 = gz / l;
      normal[i] = nx2;
      normal[i + 1] = ny2;
      normal[i + 2] = nz2;
      if (step === 0) {
        const d = f(x, y, z);
        x -= nx2 * d;
        y -= ny2 * d;
        z -= nz2 * d;
      }
    }
    position[i] = x;
    position[i + 1] = y;
    position[i + 2] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  return geo;
};
