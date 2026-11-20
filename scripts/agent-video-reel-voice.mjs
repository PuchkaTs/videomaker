// Mandukai lines for the agent video reel: whispered offers (V01–V12) and the plain body (B1–B5) (npm run voice:agent-video-reel [-- V01 V02] [-- --take 2]).
// Reads src/agent-video-reel/offers.json and calls ElevenLabs (eleven_v4) with timestamps, writing
// public/agent-video-reel/vo/<id>.mp3 plus <id>.json. The style tag (e.g. "[whispers]") is put in front of
// every sentence of the TTS text only. Existing files are never overwritten; --take N writes <id>_takeN.*.
// Costs about one credit per character of the TTS text.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(readFileSync(join(ROOT, 'src/agent-video-reel/offers.json'), 'utf8'));
const OUT = join(ROOT, 'public/agent-video-reel/vo');
const MODEL = 'eleven_v4';

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const KEY = process.env.ELEVENLABS_API_KEY ?? env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error('ELEVENLABS_API_KEY missing from .env.local');

const args = process.argv.slice(2);
const takeAt = args.indexOf('--take');
const take = takeAt >= 0 ? Number(args[takeAt + 1]) : null;
const ids = args.filter((a, i) => !a.startsWith('--') && (takeAt < 0 || i !== takeAt + 1));
const all = [...plan.offers.map((l) => ({...l, whisper: true})), ...(plan.body ?? [])];
const lines = all.filter((l) => (ids.length ? ids.includes(l.id) : true));
if (ids.length && lines.length !== ids.length) throw new Error(`Unknown id in: ${ids.join(', ')}`);

const styled = (text) =>
  plan.style ? text.split(/(?<=[.!?])\s+/).map((s) => `${plan.style} ${s}`).join(' ') : text;

const tts = async (voiceId, text, withLanguage) => {
  const body = {text, model_id: MODEL, ...(withLanguage ? {language_code: 'mn'} : {})};
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_192`, {
    method: 'POST',
    headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    if (withLanguage && res.status === 400 && /language/i.test(msg)) return tts(voiceId, text, false);
    throw new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 400)}`);
  }
  return res.json();
};

mkdirSync(OUT, {recursive: true});
let chars = 0;
for (const line of lines) {
  const base = join(OUT, take ? `${line.id}_take${take}` : line.id);
  if (existsSync(`${base}.mp3`)) {
    if (ids.length) throw new Error(`${base}.mp3 exists; use --take N for an alternate`);
    continue;
  }
  const text = line.tts ?? (line.whisper ? styled(line.text) : line.text);
  const data = await tts(plan.voice.id, text, true);
  writeFileSync(`${base}.mp3`, Buffer.from(data.audio_base64, 'base64'));
  writeFileSync(`${base}.json`, JSON.stringify({id: line.id, voice: plan.voice.name, model: MODEL, text: line.text, tts: text, alignment: data.alignment}, null, 1));
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${base}.mp3`], {encoding: 'utf8'}));
  chars += text.length;
  console.log(`${line.id}: ${dur.toFixed(2)} s, ${text.length} chars`);
}
console.log(chars ? `Done: ${chars} characters sent.` : 'Nothing to generate (all lines exist).');
