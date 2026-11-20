// Review frames of FitzoneH01 to outputs/fitzone-h01-stills/ (npm run stills:fitzone-h01).
// No arguments: one still per beat (two thirds of the way in) plus a contact sheet. With arguments:
// those times in seconds, tiled into strip.png in order, for checking motion across a transition.
// Deletes its bundle afterwards (each bundle copies public/, about 1 GB, into $TMPDIR).
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/fitzone-h01/cues.json'), 'utf8'));
const FPS = 60;
const out = join(ROOT, 'outputs/fitzone-h01-stills');
mkdirSync(out, {recursive: true});

const times = process.argv.slice(2).map(Number);
const shots = times.length
  ? times.map((t, i) => ({name: `t${String(i).padStart(2, '0')}`, t}))
  : cues.beats.map((b) => ({name: `b-${b.id}`, t: b.from + (b.to - b.from) * 0.66}));

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
try {
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
  const composition = await selectComposition({serveUrl, id: 'FitzoneH01', puppeteerInstance: browser});
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
  tile('b-*.png', `${Math.ceil(shots.length / 2)}x2`, 300, 'contact-sheet.png');
}
console.log(`Stills in ${out}`);
