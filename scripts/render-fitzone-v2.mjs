// Renders outputs/fitzone-v2.mp4 (npm run render:fitzone-v2): 1080×1920 vertical, 60 fps,
// H.264 20 Mbit/s yuv420p BT.709, AAC 320k.
// Video comes from Remotion (muted). The audio is the clip's own voice plus the music and sfx stems,
// mixed and muxed with ffmpeg, which writes the AAC priming metadata correctly (Remotion's mux leaves
// audio ~43 ms late).
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/fitzone-v2/cues.json'), 'utf8'));
const out = join(ROOT, 'outputs/fitzone-v2.mp4');
const work = mkdtempSync(join(tmpdir(), 'fitzone-v2-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});

try {
  run('node', ['scripts/fitzone-v2-audio.mjs']);

  const video = join(work, 'video.mp4');
  run('npx', ['remotion', 'render', 'src/index.ts', 'FitzoneV2', video, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=20M', '--x264-preset=slow', '--log=error']);

  // The composition is floor(duration × 60) frames (see FitzoneV2.tsx); the mix is cut to match.
  const videoSeconds = Math.floor(cues.duration * 60) / 60;
  const mix = join(work, 'mix.wav');
  const graph = `[0:a]aresample=48000,aformat=channel_layouts=stereo[voice];[1:a]aresample=48000[music];[2:a]aresample=48000[fx];[voice][music][fx]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.85:attack=2:release=60:level=disabled,atrim=end=${videoSeconds}[m]`;
  run('ffmpeg', ['-v', 'error', '-y', '-i', join('public', cues.source), '-i', 'public/fitzone-v2/stems/music.wav', '-i', 'public/fitzone-v2/stems/sfx.wav', '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);

  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
  console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
} finally {
  rmSync(work, {recursive: true, force: true});
}
