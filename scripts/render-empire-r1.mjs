// Renders outputs/empire-r1.mp4 (npm run render:empire-r1): 1080×1920 vertical, 60 fps,
// H.264 20 Mbit/s yuv420p BT.709, AAC 320k.
// Video comes from Remotion (muted). The audio is the source clip's own track (voice + music) plus
// the sound-design stem, mixed and muxed with ffmpeg, which writes the AAC priming metadata
// correctly (Remotion's mux leaves audio ~43 ms late).
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/empire-r1/cues.json'), 'utf8'));
const out = join(ROOT, 'outputs/empire-r1.mp4');
const work = mkdtempSync(join(tmpdir(), 'empire-r1-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});

try {
  run('node', ['scripts/empire-r1-sfx.mjs']);

  const video = join(work, 'video.mp4');
  // GPU (ANGLE) for the motion-blur passes; concurrency 4 fits 16 GB RAM.
  run('npx', ['remotion', 'render', 'src/index.ts', 'EmpireR1', video, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=20M', '--x264-preset=slow', '--log=error']);

  // The composition is floor(duration × 60) frames (see EmpireR1.tsx); the mix is cut to match.
  const videoSeconds = Math.floor(cues.duration * 60) / 60;
  const mix = join(work, 'mix.wav');
  const graph = `[0:a]aresample=48000,aformat=channel_layouts=stereo[src];[1:a]aresample=48000[fx];[src][fx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.85:attack=2:release=60:level=disabled,atrim=end=${videoSeconds}[m]`;
  run('ffmpeg', ['-v', 'error', '-y', '-i', join('public', cues.source), '-i', join('public', cues.sfx), '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);

  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
  console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
} finally {
  rmSync(work, {recursive: true, force: true});
}
