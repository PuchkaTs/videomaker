// Review frames of GanaaHouse to outputs/ganaa-house-stills/ (npm run stills:ganaa-house).
// No arguments: one still per beat (two thirds of the way in) plus a contact sheet. With arguments:
// those times in seconds, tiled into strip.png in order, for checking motion across a transition.
// Deletes its bundle afterwards (each bundle copies public/, about 1 GB, into $TMPDIR).
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/ganaa-house/cues.json'), 'utf8'));
const FPS = 60;
const out = join(ROOT, 'outputs/ganaa-house-stills');
mkdirSync(out, {recursive: true});

const times = process.argv.slice(2).map(Number);
const shots = times.length
  ? times.map((t, i) => ({name: `t${String(i).padStart(2, '0')}`, t}))
  : cues.scenes.flatMap((b) => [0.35, 0.8].map((f) => ({name: `b-${b.id}-${f}`, t: b.from + (b.to - b.from) * f})));

// A slim public folder (hard links to the fonts and this reel's files only): every bundle copies its public
// folder into $TMPDIR, and the full public/ is over 3 GB.
const slim = mkdtempSync(join(tmpdir(), 'ganaa-public-'));
for (const dir of ['fonts', 'ganaa-house']) execFileSync('cp', ['-al', join(ROOT, 'public', dir), join(slim, dir)]);
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), publicDir: slim});
rmSync(slim, {recursive: true, force: true});
try {
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
  const composition = await selectComposition({serveUrl, id: 'GanaaHouse', puppeteerInstance: browser});
  for (const shot of shots) {
    await renderStill({composition, serveUrl, output: join(out, `${shot.name}.png`), frame: Math.min(composition.durationInFrames - 1, Math.round(shot.t * FPS)), puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
  }
  await browser.close({silent: true});
} finally {
  rmSync(serveUrl, {recursive: true, force: true});
}

const tile = (pattern, columns, width, file) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, pattern), '-vf', `scale=${width}:-1,tile=${columns}:padding=6:color=0x202020`, '-frames:v', '1', join(out, file)]);

if (times.length) {
  tile('t*.png', `${times.length}x1`, Math.min(300, Math.floor(1950 / times.length)), 'strip.png');
  if (!process.env.KEEP) for (const shot of shots) rmSync(join(out, `${shot.name}.png`));
} else {
  tile('b-*.png', `${Math.ceil(shots.length / 2)}x2`, 300, 'contact-sheet.png');
}
console.log(`Stills in ${out}`);
