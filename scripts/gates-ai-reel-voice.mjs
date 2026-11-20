// Mongolian voiceover for the Gates AI reel (npm run voice:gates-ai-reel [-- G4 N1] [-- --take 2]).
// Reads the lines from src/gates-ai-reel/plan.json and calls ElevenLabs (eleven_v4) with timestamps,
// writing public/gates-ai-reel/vo/<id>.mp3 plus <id>.json (character alignment, used for captions).
// Existing files are never overwritten: with no ids it only fills in missing lines, and --take N
// writes <id>_takeN.* next to the chosen take (pick it with "take": "take2" on the line in plan.json).
// Costs about one credit per character of the TTS text.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(readFileSync(join(ROOT, 'src/gates-ai-reel/plan.json'), 'utf8'));
const OUT = join(ROOT, 'public/gates-ai-reel/vo');
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
const lines = plan.lines.filter((l) => (ids.length ? ids.includes(l.id) : true));
if (ids.length && lines.length !== ids.length) throw new Error(`Unknown line id in: ${ids.join(', ')}`);

const tts = async (voiceId, text, withLanguage) => {
  const body = {text, model_id: MODEL, ...(withLanguage ? {language_code: 'mn'} : {})};
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_192`, {
    method: 'POST',
    headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    // Some models reject an explicit language; retry once letting the model detect it.
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
  const voice = plan.voices[line.voice];
  const text = line.tts ?? line.text;
  const data = await tts(voice.id, text, true);
  writeFileSync(`${base}.mp3`, Buffer.from(data.audio_base64, 'base64'));
  writeFileSync(`${base}.json`, JSON.stringify({id: line.id, voice: voice.name, model: MODEL, text: line.text, tts: text, alignment: data.alignment}, null, 1));
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${base}.mp3`], {encoding: 'utf8'}));
  chars += text.length;
  console.log(`${line.id} (${voice.name}): ${dur.toFixed(2)} s, ${text.length} chars, ${(text.length / dur).toFixed(1)} chars/s`);
}
console.log(chars ? `Done: ${chars} characters sent.` : 'Nothing to generate (all lines exist).');
