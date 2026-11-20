// Pre-blurred chip sprites. CSS blur filters on dozens of particles, re-rendered
// for every motion-blur sample, dominated render time; images composite cheaply.
export const CHIP_W = 240;
export const CHIP_H = 56;
const LEVELS = [0, 1.5, 3, 5, 8, 12, 17];
const cache = new Map<string, string>();

export const blurLevel = (blur: number) => LEVELS.reduce((best, l) => (Math.abs(l - blur) < Math.abs(best - blur) ? l : best), 0);

export const chipPad = (level: number) => Math.ceil(level * 2.5) + 2;

export const chipSprite = (color: string, level: number) => {
  const key = `${color}|${level}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pad = chipPad(level);
  const canvas = document.createElement('canvas');
  canvas.width = CHIP_W + pad * 2;
  canvas.height = CHIP_H + pad * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.filter = level > 0 ? `blur(${level}px)` : 'none';
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(pad, pad, CHIP_W, CHIP_H, CHIP_H / 2);
  ctx.fill();
  const url = canvas.toDataURL('image/png');
  cache.set(key, url);
  return url;
};
