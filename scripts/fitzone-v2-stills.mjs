// Renders review frames of FitzoneV2 to outputs/fitzone-v2-stills/ (npm run stills:fitzone-v2).
// No arguments: one still per scene plus a contact sheet. With arguments: those times in seconds,
// tiled into strip.png in order, for checking motion across a transition.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/fitzone-v2/cues.json'), 'utf8'));
const FPS = 60;
const out = join(ROOT, 'outputs/fitzone-v2-stills');
mkdirSync(out, {recursive: true});

const times = process.argv.slice(2).map(Number);
const shots = times.length ? times.map((t, i) => ({name: `t${String(i).padStart(2, '0')}`, t})) : cues.scenes.map((s) => ({name: s.id, t: s.still}));

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'FitzoneV2', puppeteerInstance: browser});

for (const shot of shots) {
  await renderStill({composition, serveUrl, output: join(out, `${shot.name}.png`), frame: Math.round(shot.t * FPS), puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
}
await browser.close({silent: true});

const tile = (pattern, columns, width, file) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, pattern), '-vf', `scale=${width}:-1,tile=${columns}:padding=6:color=0x202020`, '-frames:v', '1', join(out, file)]);

if (times.length) {
  tile('t*.png', `${times.length}x1`, Math.min(300, Math.floor(1950 / times.length)), 'strip.png');
  for (const shot of shots) rmSync(join(out, `${shot.name}.png`));
} else {
  tile('A*.png', '7x2', 360, 'contact-sheet.png');
}
