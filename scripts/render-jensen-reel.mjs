// Renders the Jensen reel (npm run render:jensen-reel [-- --short]): 1080×1920 vertical, 60 fps,
// H.264 yuv420p BT.709, AAC 320k. The long cut (about 3 min) goes to outputs/jensen-reel.mp4 at
// 12 Mbit/s (about 275 MB, under the 300 MB limit); --short renders the 90-second cut to
// outputs/jensen-reel-90s.mp4 at 16 Mbit/s.
// Rebuilds the cues and the stems first, renders the video muted, then mixes the four stems with
// ffmpeg (limiter at -1.4 dBFS) and muxes; ffmpeg writes the AAC priming metadata correctly
// (Remotion's own mux leaves audio ~43 ms late).
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHORT = process.argv.includes('--short');
const out = join(ROOT, SHORT ? 'outputs/jensen-reel-90s.mp4' : 'outputs/jensen-reel.mp4');
const work = mkdtempSync(join(tmpdir(), 'jensen-reel-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});

try {
  run('node', ['scripts/jensen-reel-build.mjs', ...(SHORT ? ['--short'] : [])]);
  const cues = JSON.parse(readFileSync(join(ROOT, 'src/jensen-reel', SHORT ? 'cues-short.json' : 'cues.json'), 'utf8'));

  const video = join(work, 'video.mp4');
  run('npx', ['remotion', 'render', 'src/index.ts', SHORT ? 'JensenReelShort' : 'JensenReel', video, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', `--video-bitrate=${SHORT ? '16M' : '12M'}`, '--x264-preset=slow', '--log=error']);

  // The composition is round(duration × 60) frames (see JensenReel.tsx); the mix is cut to match.
  const videoSeconds = Math.round(cues.duration * 60) / 60;
  const mix = join(work, 'mix.wav');
  const stems = ['voice', 'source', 'music', 'sfx'];
  const inputs = stems.flatMap((s) => ['-i', `public/${cues.stems}/${s}.wav`]);
  const graph = `${stems.map((_, i) => `[${i}:a]`).join('')}amix=inputs=${stems.length}:normalize=0:duration=longest,alimiter=limit=0.85:attack=2:release=60:level=disabled,atrim=end=${videoSeconds}[m]`;
  run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);

  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
  console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
} finally {
  rmSync(work, {recursive: true, force: true});
}
