// Renders one PNG per scene to outputs/fitzone-stills/ plus a contact sheet (npm run stills:fitzone).
// Pass scene ids to render only those: node scripts/fitzone-stills.mjs S03 S07
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/fitzone/cues.json'), 'utf8'));
const FPS = 60;
const out = join(ROOT, 'outputs/fitzone-stills');
mkdirSync(out, {recursive: true});

const only = process.argv.slice(2);
const scenes = only.length ? cues.scenes.filter((s) => only.includes(s.id)) : cues.scenes;

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'Fitzone', puppeteerInstance: browser});

for (const scene of scenes) {
  const output = join(out, `${scene.id}.png`);
  await renderStill({composition, serveUrl, output, frame: Math.round(scene.still * FPS), puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
  console.log(`${scene.id} ${scene.name}`);
}
await browser.close({silent: true});

if (!only.length) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, 'S*.png'), '-vf', 'scale=360:-1,tile=7x2:padding=6:color=0x202020', '-frames:v', '1', join(out, 'contact-sheet.png')]);
}
