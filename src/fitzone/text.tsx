import {useMemo} from 'react';
import {staticFile} from 'remotion';
import opentype from 'opentype.js';
import * as THREE from 'three';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Extruded Montserrat for the Fitzone reel. Each glyph is its own mesh so that the animation pass can
// move letters one by one. Fontsource splits the face by subset: Ө and Ү live in cyrillic-ext.

export type Weight = 800 | 900;
const fonts = new Map<Weight, opentype.Font[]>();

const loadWeight = async (weight: Weight) => {
  const parts = await Promise.all(
    ['latin', 'cyrillic', 'cyrillic-ext'].map(async (subset) => {
      const res = await fetch(staticFile(`fitzone/fonts/montserrat-${subset}-${weight}-normal.woff`));
      return opentype.parse(await res.arrayBuffer());
    }),
  );
  fonts.set(weight, parts);
};

let loading: Promise<unknown> | null = null;
export const loadFonts = () => (loading ??= Promise.all([loadWeight(800), loadWeight(900)]));

const findGlyph = (ch: string, weight: Weight) => {
  for (const font of fonts.get(weight)!) {
    const glyph = font.charToGlyph(ch);
    if (glyph.index !== 0) return {font, glyph};
  }
  throw new Error(`Montserrat ${weight} has no glyph for "${ch}"`);
};

export const advance = (ch: string, size: number, weight: Weight) => {
  const {font, glyph} = findGlyph(ch, weight);
  return ((glyph.advanceWidth ?? 0) * size) / font.unitsPerEm;
};

const glyphShapes = (ch: string, size: number, weight: Weight) => {
  const {glyph} = findGlyph(ch, weight);
  const path = new THREE.ShapePath();
  for (const c of glyph.getPath(0, 0, size).commands) {
    if (c.type === 'M') path.moveTo(c.x, -c.y);
    else if (c.type === 'L') path.lineTo(c.x, -c.y);
    else if (c.type === 'Q') path.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') path.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  return path.toShapes();
};

export type TextStyle = {size: number; depth?: number; bevel?: number; weight?: Weight; tracking?: number};
export type Glyph = {ch: string; x: number; w: number};

// Glyph origins from the left edge of the line, plus the line's width.
export const layoutLine = (text: string, {size, weight = 900, tracking = 0}: TextStyle) => {
  let x = 0;
  const glyphs: Glyph[] = [];
  for (const ch of text) {
    const w = advance(ch, size, weight);
    if (ch !== ' ') glyphs.push({ch, x, w});
    x += w + tracking;
  }
  return {glyphs, width: x - tracking};
};

const cache = new Map<string, THREE.BufferGeometry>();

export const glyphGeometry = (ch: string, {size, depth = 0.08, bevel = 0.01, weight = 900}: TextStyle) => {
  const key = [ch, size, depth, bevel, weight].join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  const raw = new THREE.ExtrudeGeometry(glyphShapes(ch, size, weight), {
    depth,
    curveSegments: 10,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.7,
    bevelOffset: -bevel * 0.35,
    bevelSegments: 3,
  });
  const geo = toCreasedNormals(raw, 0.5);
  cache.set(key, geo);
  return geo;
};

type Materials = {face: THREE.Material; side: THREE.Material};

export type LetterTransform = (index: number, ch: string) => {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

type Text3DProps = TextStyle &
  Materials & {
    text: string;
    align?: 'left' | 'center' | 'right';
    letter?: LetterTransform;
  };

export const Text3D = ({text, align = 'center', face, side, letter, ...style}: Text3DProps) => {
  const {glyphs, width} = layoutLine(text, style);
  const x0 = align === 'center' ? -width / 2 : align === 'right' ? -width : 0;
  return (
    <group>
      {glyphs.map((g, i) => {
        const t = letter?.(i, g.ch) ?? {};
        return (
          <group
            key={`${g.ch}${g.x}`}
            position={[x0 + g.x + g.w / 2 + (t.position?.[0] ?? 0), t.position?.[1] ?? 0, t.position?.[2] ?? 0]}
            rotation={t.rotation ?? [0, 0, 0]}
            scale={t.scale ?? [1, 1, 1]}
          >
            <mesh geometry={glyphGeometry(g.ch, style)} material={[face, side]} position={[-g.w / 2, 0, 0]} castShadow />
          </group>
        );
      })}
    </group>
  );
};

type ArcTextProps = TextStyle &
  Materials & {
    text: string;
    // Baseline radius of a top arc, or the radius of the letters' feet on a bottom arc.
    radius: number;
    placement: 'top' | 'bottom';
  };

// Letters cast around a plate. They stay rigid, like raised lettering on a mould.
export const ArcText = ({text, radius, placement, face, side, ...style}: ArcTextProps) => {
  const {glyphs, width} = layoutLine(text, style);
  const mid = radius + (placement === 'top' ? 0.35 : -0.35) * style.size;
  return (
    <group>
      {glyphs.map((g) => {
        const a = (g.x + g.w / 2 - width / 2) / mid;
        const flip = placement === 'top' ? 1 : -1;
        return (
          <group
            key={`${g.ch}${g.x}`}
            position={[radius * Math.sin(a), flip * radius * Math.cos(a), 0]}
            rotation={[0, 0, -flip * a]}
          >
            <mesh geometry={glyphGeometry(g.ch, style)} material={[face, side]} position={[-g.w / 2, 0, 0]} castShadow />
          </group>
        );
      })}
    </group>
  );
};

type WrapTextProps = TextStyle &
  Materials & {
    text: string;
    map: (v: THREE.Vector3) => void;
    y?: number;
  };

// Text pressed onto a curved surface: `map` moves each vertex from the flat line onto that surface.
export const WrapText = ({text, map, y = 0, face, side, ...style}: WrapTextProps) => {
  const geos = useMemo(() => {
    const {glyphs, width} = layoutLine(text, style);
    return glyphs.map((g) => {
      const geo = glyphGeometry(g.ch, style).clone();
      geo.translate(g.x - width / 2, y, 0);
      const pos = geo.getAttribute('position');
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        map(v);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return toCreasedNormals(geo, 0.5);
    });
    // `map` is a stable closure over constants at each call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, y, style.size, style.depth, style.bevel, style.weight, style.tracking]);
  return (
    <group>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo} material={[face, side]} castShadow />
      ))}
    </group>
  );
};
