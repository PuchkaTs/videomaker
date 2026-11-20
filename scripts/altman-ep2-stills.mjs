// Review frames of AltmanEp2 to outputs/altman-ep2-stills/ (npm run stills:altman-ep2).
// No arguments: one still per cut (a little past its middle) plus a contact sheet. With arguments:
// those times in seconds, tiled into strip.png in order, for checking motion across a transition.
// Deletes its bundle afterwards (each bundle copies public/, about 1 GB, into $TMPDIR).
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHORT = process.argv.includes('--short');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/altman-ep2', SHORT ? 'cues-short.json' : 'cues.json'), 'utf8'));
const FPS = 60;
const out = join(ROOT, SHORT ? 'outputs/altman-ep2-stills-short' : 'outputs/altman-ep2-stills');
mkdirSync(out, {recursive: true});

const times = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
if (!times.length) for (const f of readdirSync(out)) if (f.startsWith('b-')) rmSync(join(out, f));
const shots = times.length
  ? times.map((t, i) => ({name: `t${String(i).padStart(2, '0')}`, t}))
  : cues.cuts.map((c, i) => ({name: `b-${String(i).padStart(2, '0')}-${c.beat}`, t: (c.from + (c.to - c.from) * 0.6) / FPS}));

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
try {
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
  const composition = await selectComposition({serveUrl, id: SHORT ? 'AltmanEp2Short' : 'AltmanEp2', puppeteerInstance: browser});
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
  for (const shot of shots) rmSync(join(out, `${shot.name}.png`));
} else {
  tile('b-*.png', `10x${Math.ceil(shots.length / 10)}`, 190, 'contact-sheet.png');
}
console.log(`Stills in ${out}`);
