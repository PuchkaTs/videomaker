// Renders one customer listing reel (node scripts/render-listing-reel.mjs <jobId> [--still <seconds>]).
// → outputs/reel-jobs/<jobId>.mp4: 1080×1920, 60 fps, H.264 12 Mbit/s yuv420p BT.709, AAC 320k.
// Needs public/reel-jobs/<jobId>/cues.json (scripts/listing-reel-build.mjs). Renders muted, then mixes the three
// stems with ffmpeg (limiter at -1.4 dBFS, near -14 LUFS) and muxes. --still writes a PNG review frame instead.
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const jobId = process.argv[2];
if (!jobId || !/^[\w-]+$/.test(jobId)) throw new Error('Usage: render-listing-reel.mjs <jobId> [--still <seconds>]');
const stillAt = process.argv[3] === '--still' ? Number(process.argv[4] ?? 1) : null;
const DIR = join(ROOT, 'public/reel-jobs', jobId);
const cues = JSON.parse(readFileSync(join(DIR, 'cues.json'), 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'listing-reel-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit']});
mkdirSync(join(ROOT, 'outputs/reel-jobs'), {recursive: true});

try {
  // Slim public folder (hard links): fonts and this job only.
  const slim = join(work, 'public');
  mkdirSync(join(slim, 'reel-jobs'), {recursive: true});
  run('cp', ['-al', join(ROOT, 'public/fonts'), join(slim, 'fonts')]);
  run('cp', ['-al', DIR, join(slim, 'reel-jobs', jobId)]);
  rmSync(join(slim, 'reel-jobs', jobId, 'src'), {recursive: true, force: true});
  const props = join(work, 'props.json');
  writeFileSync(props, JSON.stringify({cues}));
  const common = [`--public-dir=${slim}`, `--props=${props}`, '--gl=angle', '--log=error'];
  if (stillAt !== null) {
    const out = join(ROOT, `outputs/reel-jobs/${jobId}-still.png`);
    run('npx', ['remotion', 'still', 'src/index.ts', 'ListingReel', out, `--frame=${Math.round(stillAt * 60)}`, ...common]);
    console.log(out);
  } else {
    const out = join(ROOT, `outputs/reel-jobs/${jobId}.mp4`);
    const video = join(work, 'video.mp4');
    run('npx', ['remotion', 'render', 'src/index.ts', 'ListingReel', video, ...common, '--muted', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=12M', '--x264-preset=medium']);
    const seconds = Math.round(cues.duration * 60) / 60;
    const mix = join(work, 'mix.wav');
    const stems = ['voice', 'music', 'sfx'];
    run('ffmpeg', ['-v', 'error', '-y', ...stems.flatMap((s) => ['-i', join(DIR, 'stems', `${s}.wav`)]), '-filter_complex', `[0:a][1:a][2:a]amix=inputs=3:normalize=0:duration=longest,volume=3.3dB,alimiter=limit=0.85:attack=2:release=60:level=disabled,atrim=end=${seconds.toFixed(4)}[m]`, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);
    run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
    console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
  }
} finally {
  rmSync(work, {recursive: true, force: true});
}
