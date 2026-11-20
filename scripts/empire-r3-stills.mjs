// Renders review frames of EmpireR3 into outputs/empire-r3-stills/ (npm run stills:empire-r3 -- 3.2 9.8 …):
// one PNG per time in seconds, tiled in order into strip.jpg for checking composition and transitions.
// Pass --keep to leave the single PNGs, --scale=<width> for the strip's tile width.
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 60;
const out = join(ROOT, 'outputs/empire-r3-stills');
mkdirSync(out, {recursive: true});
for (const f of readdirSync(out)) if (f.startsWith('t') && f.endsWith('.png')) rmSync(join(out, f));

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const scaleArg = args.find((a) => a.startsWith('--scale='));
const times = args.filter((a) => !a.startsWith('--')).map(Number);

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts')});
const chromiumOptions = {gl: 'angle'};
const browser = await openBrowser('chrome', {chromiumOptions});
const composition = await selectComposition({serveUrl, id: 'EmpireR3', puppeteerInstance: browser, chromiumOptions});

const started = Date.now();
for (const [i, t] of times.entries()) {
  await renderStill({
    composition,
    serveUrl,
    output: join(out, `t${String(i).padStart(3, '0')}.png`),
    frame: Math.round(t * FPS),
    puppeteerInstance: browser,
    chromiumOptions,
    onBrowserLog: ({text}) => {
      if (text.startsWith('empire-r3') || /error/i.test(text)) console.log(text);
    },
  });
}
console.log(`${times.length} stills in ${((Date.now() - started) / 1000).toFixed(1)} s`);
await browser.close({silent: true});
// Each bundle holds a full copy of public/, about 1 GB, so it must not outlive the run.
rmSync(serveUrl, {recursive: true, force: true});

const columns = Math.min(times.length, 8);
const width = scaleArg ? Number(scaleArg.split('=')[1]) : Math.min(420, Math.floor(1960 / columns));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(out, 't*.png'), '-vf', `scale=${width}:-1,tile=${columns}x${Math.ceil(times.length / columns)}:padding=6:color=0x202020`, '-frames:v', '1', '-q:v', '2', join(out, 'strip.jpg')]);
if (!keep) for (const f of readdirSync(out)) if (f.startsWith('t') && f.endsWith('.png')) rmSync(join(out, f));
console.log(join(out, 'strip.jpg'));
