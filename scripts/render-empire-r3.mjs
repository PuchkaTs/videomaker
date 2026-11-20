// Renders outputs/empire-r3.mp4 (npm run render:empire-r3): 1080×1920 vertical, 60 fps,
// H.264 20 Mbit/s yuv420p BT.709, AAC 320k. Video comes from Remotion (muted); the voice, music and
// sound-effect stems are mixed and muxed with ffmpeg, which writes the AAC priming metadata correctly
// (Remotion's mux leaves audio ~43 ms late). Add `--frames=a-b` to render only a range for checking.
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/empire-r3/cues.json'), 'utf8'));
const framesArg = process.argv.find((a) => a.startsWith('--frames='));
const range = framesArg ? framesArg.split('=')[1].split('-').map(Number) : null;
const out = join(ROOT, range ? `outputs/empire-r3-sample-${range[0]}-${range[1]}.mp4` : 'outputs/empire-r3.mp4');
const work = mkdtempSync(join(tmpdir(), 'empire-r3-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});

try {
  const video = join(work, 'video.mp4');
  // GPU (ANGLE) for the accumulation passes; concurrency 4 fits 16 GB RAM.
  run('npx', ['remotion', 'render', 'src/index.ts', 'EmpireR3', video, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=20M', '--x264-preset=slow', '--log=error', ...(framesArg ? [framesArg] : [])]);

  const start = range ? range[0] / 60 : 0;
  const end = range ? (range[1] + 1) / 60 : cues.duration;
  const mix = join(work, 'mix.wav');
  // alimiter delays its output by its attack time, so the trim starts that much later.
  const limiterDelay = 0.002;
  const graph = `[0:a][1:a][2:a]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.85:attack=2:release=60:level=disabled,apad,atrim=start=${start + limiterDelay}:end=${end + limiterDelay},asetpts=PTS-STARTPTS[m]`;
  run('ffmpeg', ['-v', 'error', '-y', '-i', join('public', cues.voice), '-i', join('public', cues.music), '-i', join('public', cues.sfx), '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);

  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
  console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
} finally {
  rmSync(work, {recursive: true, force: true});
}
