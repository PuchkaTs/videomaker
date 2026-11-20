// Renders outputs/python-variables.mp4 (npm run render:python-variables): 1920×1080, 60 fps,
// H.264 yuv420p BT.709, AAC 320k. No voiceover; the author adds it in their editor.
// Video comes from Remotion (muted); music and sfx stems are mixed and muxed with ffmpeg, which
// writes the AAC priming metadata correctly (Remotion's mux leaves audio ~43 ms late).
// The film is flat CSS 3D with no motion-blur passes, so it renders quickly.
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(readFileSync(join(ROOT, 'src/python-variables/cues.json'), 'utf8'));
const out = join(ROOT, 'outputs/python-variables.mp4');
const work = mkdtempSync(join(tmpdir(), 'python-variables-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});

try {
  run('node', ['scripts/python-variables-audio.mjs']);

  const video = join(work, 'video.mp4');
  run('npx', ['remotion', 'render', 'src/index.ts', 'PythonVariables', video, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=12M', '--x264-preset=fast', '--log=error', ...process.argv.slice(2)]);

  const mix = join(work, 'mix.wav');
  const graph = `[0:a][1:a]amix=inputs=2:normalize=0:duration=longest,atrim=end=${cues.duration}[m]`;
  run('ffmpeg', ['-v', 'error', '-y', '-i', 'public/python-variables/stems/music.wav', '-i', 'public/python-variables/stems/sfx.wav', '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);

  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
} finally {
  rmSync(work, {recursive: true, force: true});
}
