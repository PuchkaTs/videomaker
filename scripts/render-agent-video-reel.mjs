// Renders the agent video reels (npm run render:agent-video-reel [-- V04 V10]); no ids = all 12.
// Each → outputs/agent-video-reel-Vxx.mp4: 1080×1920, 60 fps, H.264 12 Mbit/s yuv420p BT.709, AAC 320k,
// about 37 s and 55 MB, about 4 min per version. Rebuilds cues.json and the stems first, renders the video
// muted, then mixes her whisper, the hook bed and the three body stems with ffmpeg (lifted 3.3 dB into a
// limiter at -1.4 dBFS, near -14 LUFS) and muxes; Remotion's own AAC mux leaves audio about 43 ms late.
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const work = mkdtempSync(join(tmpdir(), 'agent-video-reel-'));
const run = (cmd, args) => execFileSync(cmd, args, {cwd: ROOT, stdio: 'inherit'});
const FPS = 60;

try {
  run('node', ['scripts/agent-video-reel-build.mjs']);
  const cues = JSON.parse(readFileSync(join(ROOT, 'src/agent-video-reel/cues.json'), 'utf8'));
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(cues.versions);
  for (const id of ids) if (!cues.versions[id]) throw new Error(`Unknown version ${id}`);

  // Slim public folder (hard links): the CLI copies the public folder into $TMPDIR and the full one is over 3 GB.
  const slim = join(work, 'public');
  mkdirSync(join(slim, 'agent-video-reel'), {recursive: true});
  run('cp', ['-al', join(ROOT, 'public/fonts'), join(slim, 'fonts')]);
  for (const dir of ['hook', 'stems', 'img', 'faces']) run('cp', ['-al', join(ROOT, 'public/agent-video-reel', dir), join(slim, 'agent-video-reel', dir)]);

  const P = 'public/agent-video-reel';
  for (const id of ids) {
    const out = join(ROOT, `outputs/agent-video-reel-${id}.mp4`);
    const video = join(work, `${id}.mp4`);
    run('npx', ['remotion', 'render', 'src/index.ts', `AgentVideoReel${id}`, video, `--public-dir=${slim}`, '--muted', '--gl=angle', '--concurrency=4', '--codec=h264', '--pixel-format=yuv420p', '--color-space=bt709', '--video-bitrate=12M', '--x264-preset=slow', '--log=error']);

    // Same frame arithmetic as AgentVideoReel.tsx: the body starts on frame round(hookEnd × 60).
    const H = Math.round(cues.versions[id].hookEnd * FPS) / FPS;
    const total = H + Math.round(cues.body.duration * FPS) / FPS;
    const ms = Math.round(H * 1000);
    const bed = H >= cues.bed ? `adelay=${Math.round((H - cues.bed) * 1000)}:all=1` : `atrim=start=${(cues.bed - H).toFixed(4)},asetpts=PTS-STARTPTS`;
    const graph = [
      `[1:a]${bed}[bed]`,
      ...[2, 3, 4].map((i) => `[${i}:a]adelay=${ms}:all=1[b${i}]`),
      `[0:a][bed][b2][b3][b4]amix=inputs=5:normalize=0:duration=longest,volume=3.3dB,alimiter=limit=0.85:attack=2:release=60:level=disabled,atrim=end=${total.toFixed(4)}[m]`,
    ].join(';');
    const mix = join(work, `${id}.wav`);
    run('ffmpeg', ['-v', 'error', '-y', '-i', `${P}/hook/${id}.wav`, '-i', `${P}/stems/hook-bed.wav`, '-i', `${P}/stems/body-voice.wav`, '-i', `${P}/stems/body-music.wav`, '-i', `${P}/stems/body-sfx.wav`, '-filter_complex', graph, '-map', '[m]', '-c:a', 'pcm_f32le', mix]);
    run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out]);
    rmSync(video);
    rmSync(mix);
    console.log(`${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
  }
} finally {
  rmSync(work, {recursive: true, force: true});
}
