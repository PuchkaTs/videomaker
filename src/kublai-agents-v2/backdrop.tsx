import {AbsoluteFill} from 'remotion';
import {c} from './layout';
import {easeInOut, lin, mix, ramp, rand, useT} from './time';
import {CHIP_H, CHIP_W, blurLevel, chipPad, chipSprite} from './sprites';
import {Obj, dof, useCam} from './world';

// 0 = night, 1 = day. Sunrise happens while the phone flips (scene 1 → 2).
export const dayness = (t: number) => ramp(t, c('reply.sunrise'), c('reply.sunrise') + 1.2, easeInOut);

const lerpColor = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mix(v, pb[i], k))).join(',')})`;
};

// Screen-space sky: deep navy at night, the app's light studio by day, with a
// warm-to-blue horizon glow sweeping up through the frame at sunrise.
export const Sky = () => {
  const t = useT();
  const k = dayness(t);
  const glow = lin(t, c('reply.sunrise') - 0.1, c('reply.sunrise') + 1.3);
  const glowY = mix(130, -40, glow);
  return (
    <AbsoluteFill style={{background: lerpColor('#070b16', '#f5f7fb', k)}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 72% 28%, ${lerpColor('#18294f', '#e0edff', k)} 0%, transparent 55%), radial-gradient(circle at 8% 92%, ${lerpColor('#0e1730', '#eef2ff', k)} 0%, transparent 45%)`}} />
      {glow > 0 && glow < 1 ? (
        <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 50% ${glowY + 60}%, rgba(255,190,120,${0.55 * Math.sin(glow * Math.PI)}) 0%, rgba(120,170,255,${0.4 * Math.sin(glow * Math.PI)}) 35%, transparent 70%)`}} />
      ) : null}
    </AbsoluteFill>
  );
};

// Soft vignette on top of everything; stronger at night.
export const Vignette = () => {
  const k = dayness(useT());
  return <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(${k > 0.5 ? '17,24,39' : '0,0,0'},${mix(0.55, 0.07, k)}) 100%)`}} />;
};

const CHIPS = Array.from({length: 150}, (_, i) => ({
  x: -2200 + rand(i, 1) * 10600,
  y: -1500 + rand(i, 2) * 5600,
  z: -7200 + rand(i, 3) * 8400,
  w: 70 + rand(i, 4) * 200,
  h: 34 + rand(i, 6) * 24,
  rise: 10 + rand(i, 5) * 30,
  brand: rand(i, 7) > 0.62,
}));

// Floating message chips at many depths: they give every camera move parallax
// and are softened with depth of field so they never compete with the UI.
export const Particles = () => {
  const t = useT();
  const cam = useCam();
  const k = dayness(t);
  return (
    <>
      {CHIPS.map((p, i) => {
        const y = p.y - t * p.rise;
        if (Math.abs(p.x - cam.x) > 3600 || Math.abs(y - cam.y) > 2600 || p.z > cam.z + 1350 || p.z < cam.z - 5200) return null;
        // In front of the UI plane only near the frame edges, so chips never cover text.
        if (p.z > cam.z - 250 && Math.abs(p.x - cam.x) < 1150) return null;
        const level = blurLevel(dof(p.z, cam, 1.3) + 0.6);
        const color = k < 0.5 ? (p.brand ? 'rgba(80,140,255,0.38)' : 'rgba(140,170,230,0.20)') : p.brand ? 'rgba(0,106,252,0.16)' : 'rgba(255,255,255,0.95)';
        const pad = chipPad(level);
        return (
          <Obj key={i} x={p.x} y={y} z={p.z} o={k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2}>
            <img src={chipSprite(color, level)} style={{display: 'block', width: p.w * (1 + (2 * pad) / CHIP_W), height: p.h * (1 + (2 * pad) / CHIP_H)}} />
          </Obj>
        );
      })}
    </>
  );
};

// Far dot wall that trails the camera with strong parallax (it sits very deep).
export const DotWall = () => {
  const t = useT();
  const cam = useCam();
  const k = dayness(t);
  const z = cam.z - 4200;
  return (
    <Obj x={cam.x * 0.55} y={cam.y * 0.55} z={z} o={0.9}>
      <div
        style={{
          width: 9000,
          height: 6000,
          backgroundImage: `radial-gradient(circle, ${k < 0.5 ? 'rgba(120,160,255,0.22)' : 'rgba(0,106,252,0.13)'} 3px, transparent 3.5px)`,
          backgroundSize: '90px 90px',
        }}
      />
    </Obj>
  );
};
