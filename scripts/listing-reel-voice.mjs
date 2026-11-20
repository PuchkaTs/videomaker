// Voice lines for one customer listing reel, in the voice the customer chose (node scripts/listing-reel-voice.mjs <jobId>).
// Reads public/reel-jobs/<jobId>/plan.json and writes vo/b<i>.mp3 + .json (alignment) for every beat.
// Existing files are kept. About one ElevenLabs credit per character.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const jobId = process.argv[2];
if (!jobId || !/^[\w-]+$/.test(jobId)) throw new Error('Usage: listing-reel-voice.mjs <jobId>');
const DIR = join(ROOT, 'public/reel-jobs', jobId);
const plan = JSON.parse(readFileSync(join(DIR, 'plan.json'), 'utf8'));
// The customer's chosen voice (brief.json `voice`, e.g. "M02"); Mandukai when it is missing or unknown.
const VOICES = JSON.parse(readFileSync(join(ROOT, 'src/listing-reel/voices.json'), 'utf8'));
const brief = existsSync(join(DIR, 'brief.json')) ? JSON.parse(readFileSync(join(DIR, 'brief.json'), 'utf8')) : {};
const chosen = Object.hasOwn(VOICES.voices, brief.voice) ? brief.voice : VOICES.default;
const VOICE = VOICES.voices[chosen].voiceId;
// A speaking style (e.g. "[whispers]") goes in front of every sentence, in the text sent to the model only.
const STYLE = VOICES.voices[chosen].style;
const styled = (text, style) => (style ? text.split(/(?<=[.!?])\s+/).map((s) => `${style} ${s}`).join(' ') : text);
console.log(`voice: ${chosen} ${VOICES.voices[chosen].name}`);
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

const tts = async (text, withLanguage) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_192`, {
    method: 'POST',
    headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify({text, model_id: MODEL, ...(withLanguage ? {language_code: 'mn'} : {})}),
  });
  if (!res.ok) {
    const msg = await res.text();
    if (withLanguage && res.status === 400 && /language/i.test(msg)) return tts(text, false);
    throw new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 300)}`);
  }
  return res.json();
};

mkdirSync(join(DIR, 'vo'), {recursive: true});
let chars = 0;
for (const [i, beat] of plan.beats.entries()) {
  const base = join(DIR, 'vo', `b${i}`);
  if (existsSync(`${base}.mp3`)) continue;
  const data = await tts(styled(beat.say, STYLE), true);
  writeFileSync(`${base}.mp3`, Buffer.from(data.audio_base64, 'base64'));
  writeFileSync(`${base}.json`, JSON.stringify({say: beat.say, alignment: data.alignment}));
  chars += beat.say.length;
}
console.log(`voice: ${chars} characters sent`);
