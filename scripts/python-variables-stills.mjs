// Renders review frames of PythonVariables to outputs/python-variables-stills/
// (npm run stills:python-variables). No arguments: one still per scene plus a contact sheet. With
// arguments: those times in seconds, tiled into strip.png in order, for checking motion across a seam.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, readdirSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/python-variables/cues.json'), 'utf8'));
const FPS = 60;
const out = join(ROOT, 'outputs/python-variables-stills');
mkdirSync(out, {recursive: true});
for (const f of readdirSync(out)) if (f.endsWith('.png')) rmSync(join(out, f));

const times = process.argv.slice(2).map(Number);
const shots = times.length ? times.map((t, i) => ({name: `t${String(i).padStart(2, '0')}`, t})) : cues.scenes.map((s) => ({name: s.id, t: s.start + s.still}));

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'PythonVariables', puppeteerInstance: browser});

for (const shot of shots) {
  await renderStill({composition, serveUrl, output: join(out, `${shot.name}.png`), frame: Math.round(shot.t * FPS), puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
}
await browser.close({silent: true});
// Each bundle holds a full copy of public/, about 1 GB, so it must not outlive the run.
rmSync(serveUrl, {recursive: true, force: true});

const tile = (pattern, columns, width, file) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, pattern), '-vf', `scale=${width}:-1,tile=${columns}:padding=6:color=0x202020`, '-frames:v', '1', join(out, file)]);

if (times.length) {
  const cols = Math.min(times.length, 4);
  tile('t*.png', `${cols}x${Math.ceil(times.length / cols)}`, 640, 'strip.png');
} else {
  tile('S*.png', '4x3', 640, 'contact-sheet.png');
}
