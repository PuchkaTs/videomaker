// Review frames of one agent video reel version to outputs/agent-video-reel-stills/
// (npm run stills:agent-video-reel [-- V04] [-- V04 3.2 9.8]).
// No times: stills across the hook and every body beat plus a contact sheet. With times (seconds from the
// start of the reel; prefix b for seconds from the start of the body, e.g. b10.4): those frames tiled into
// strip.png in order, for checking motion across a transition. Deletes its bundle afterwards.
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/agent-video-reel/cues.json'), 'utf8'));
const FPS = 60;
const args = process.argv.slice(2);
const v = args[0] && /^V\d\d$/.test(args[0]) ? args.shift() : 'V04';
const H = Math.round(cues.versions[v].hookEnd * FPS) / FPS;
const out = join(ROOT, 'outputs/agent-video-reel-stills');
mkdirSync(out, {recursive: true});

const times = args.map((a) => (a.startsWith('b') ? H + Number(a.slice(1)) : Number(a)));
const shots = times.length
  ? times.map((t, i) => ({name: `t${String(i).padStart(2, '0')}`, t}))
  : [
      ...[0.5, 2.5, H - 0.4].map((t, i) => ({name: `b-0hook-${i}`, t})),
      ...cues.body.scenes.flatMap((b) => [0.3, 0.6, 0.92].map((f) => ({name: `b-${b.id === 'P' ? '1P' : b.id === 'R' ? '2R' : b.id === 'W' ? '3W' : b.id === 'T' ? '4T' : '5E'}-${f}`, t: H + b.from + (b.to - b.from) * f}))),
    ];

// A slim public folder (hard links): every bundle copies its public folder into $TMPDIR.
const slim = mkdtempSync(join(tmpdir(), 'agent-public-'));
execFileSync('cp', ['-al', join(ROOT, 'public/fonts'), join(slim, 'fonts')]);
mkdirSync(join(slim, 'agent-video-reel'));
for (const dir of ['hook', 'stems', 'img', 'faces']) execFileSync('cp', ['-al', join(ROOT, 'public/agent-video-reel', dir), join(slim, 'agent-video-reel', dir)]);
rmSync(join(slim, 'agent-video-reel/img/raw'), {recursive: true, force: true});
const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), publicDir: slim});
rmSync(slim, {recursive: true, force: true});
try {
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
  const composition = await selectComposition({serveUrl, id: `AgentVideoReel${v}`, puppeteerInstance: browser});
  for (const shot of shots) {
    await renderStill({composition, serveUrl, output: join(out, `${shot.name}.png`), frame: Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(shot.t * FPS))), puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
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
  tile('b-*.png', `${Math.ceil(shots.length / 2)}x2`, 216, `contact-sheet-${v}.png`);
  for (const shot of shots) rmSync(join(out, `${shot.name}.png`));
}
console.log(`Stills in ${out} (${v})`);
