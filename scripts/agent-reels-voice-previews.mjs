// Short samples of the twelve voices on kublai.online/agent-reels, one mp3 per voice:
//   node scripts/agent-reels-voice-previews.mjs [F02 M04 …] [--force]
// Reads src/listing-reel/voices.json and writes ../kublai_web/public/agent-reels/voices/<id>.mp3.
// Existing files are kept unless --force. About one ElevenLabs credit per character (about 100 a voice).
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '../kublai_web/public/agent-reels/voices');
const {voices, sample} = JSON.parse(readFileSync(join(ROOT, 'src/listing-reel/voices.json'), 'utf8'));
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
for (const id of only) if (!Object.hasOwn(voices, id)) throw new Error(`Unknown voice ${id}`);
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const KEY = process.env.ELEVENLABS_API_KEY ?? env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error('ELEVENLABS_API_KEY missing from .env.local');

const styled = (text, style) => (style ? text.split(/(?<=[.!?])\s+/).map((s) => `${style} ${s}`).join(' ') : text);
const tts = async (voiceId, style, withLanguage) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify({text: styled(sample, style), model_id: 'eleven_v4', ...(withLanguage ? {language_code: 'mn'} : {})}),
  });
  if (!res.ok) {
    const msg = await res.text();
    if (withLanguage && res.status === 400 && /language/i.test(msg)) return tts(voiceId, style, false);
    throw new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
};

mkdirSync(OUT, {recursive: true});
for (const [id, voice] of Object.entries(voices)) {
  if (only.length && !only.includes(id)) continue;
  const file = join(OUT, `${id}.mp3`);
  if (existsSync(file) && !force) continue;
  writeFileSync(file, await tts(voice.voiceId, voice.style, true));
  console.log(`${id} ${voice.name} (${voice.source}) → ${file}`);
}
