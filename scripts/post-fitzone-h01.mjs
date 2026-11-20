// Posts outputs/fitzone-h01.mp4 as a Reel to Fitzone's Facebook page and its Instagram account
// (npm run post:fitzone-h01 [-- --check] [-- --fb-only | --ig-only]).
// Reads META_PAGE_ID and META_PAGE_ACCESS_TOKEN from ~/dev2/fitzone.mn/.env and never prints them.
// --check only confirms which page the token belongs to and which Instagram account is linked.
// Captions are in docs/fitzone-h01/captions.json. Meta's API cannot set the "AI info" label: add it
// in Business Suite after posting.
// Instagram: the single-request upload below failed for files above about 7 MB from the studio's
// connection ("ProcessingFailedError", 2026-11-10), so post Instagram from Business Suite instead.
import {readFileSync, statSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = 'v21.0';
const FILE = join(ROOT, 'outputs/fitzone-h01.mp4');
const captions = JSON.parse(readFileSync(join(ROOT, 'docs/fitzone-h01/captions.json'), 'utf8'));

const env = Object.fromEntries(
  readFileSync(join(homedir(), 'dev2/fitzone.mn/.env'), 'utf8')
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
);
const PAGE = env.META_PAGE_ID;
const TOKEN = env.META_PAGE_ACCESS_TOKEN;
if (!PAGE || !TOKEN) throw new Error('META_PAGE_ID or META_PAGE_ACCESS_TOKEN missing from ~/dev2/fitzone.mn/.env');

const args = process.argv.slice(2);
const graph = async (path, {method = 'GET', body} = {}) => {
  const url = new URL(`https://graph.facebook.com/${V}/${path}`);
  const init = {method, headers: {Authorization: `Bearer ${TOKEN}`}};
  if (body) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const json = await res.json();
  if (json.error) throw new Error(`${method} ${path}: ${json.error.message}`);
  return json;
};
const upload = async (url, bytes) => {
  const res = await fetch(url, {method: 'POST', headers: {Authorization: `OAuth ${TOKEN}`, offset: '0', file_size: String(bytes.length)}, body: bytes});
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`upload: ${JSON.stringify(json.error ?? json)}`);
  return json;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await graph(`${PAGE}?fields=name,link,instagram_business_account{id,username}`);
const ig = page.instagram_business_account;
console.log(`Page: ${page.name} (${page.link})`);
console.log(`Instagram: ${ig ? '@' + ig.username : 'none linked'}`);
if (args.includes('--check')) process.exit(0);
if (!/fitzone/i.test(page.name)) throw new Error(`Token is for "${page.name}", not Fitzone; stopping.`);

const bytes = readFileSync(FILE);
console.log(`File: ${FILE} (${(statSync(FILE).size / 1e6).toFixed(1)} MB)`);

if (!args.includes('--ig-only')) {
  const start = await graph(`${PAGE}/video_reels`, {method: 'POST', body: {upload_phase: 'start'}});
  await upload(start.upload_url, bytes);
  await graph(`${PAGE}/video_reels`, {method: 'POST', body: {upload_phase: 'finish', video_id: start.video_id, video_state: 'PUBLISHED', description: captions.facebook}});
  let status;
  for (let i = 0; i < 60; i++) {
    status = (await graph(`${start.video_id}?fields=status,permalink_url`)).status;
    if (status?.video_status === 'ready' || status?.publishing_phase?.status === 'complete') break;
    if (status?.video_status === 'error') throw new Error(`Facebook processing failed: ${JSON.stringify(status)}`);
    await sleep(5000);
  }
  const v = await graph(`${start.video_id}?fields=permalink_url`);
  console.log(`Facebook Reel: https://www.facebook.com${v.permalink_url ?? `/reel/${start.video_id}`}`);
}

if (!args.includes('--fb-only')) {
  if (!ig) throw new Error('No Instagram account linked to the page');
  const container = await graph(`${ig.id}/media`, {method: 'POST', body: {media_type: 'REELS', upload_type: 'resumable', caption: captions.instagram, share_to_feed: true}});
  await upload(container.uri ?? `https://rupload.facebook.com/ig-api-upload/${V}/${container.id}`, bytes);
  for (let i = 0; i < 90; i++) {
    const s = await graph(`${container.id}?fields=status_code,status`);
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Instagram processing failed: ${s.status}`);
    await sleep(5000);
  }
  const post = await graph(`${ig.id}/media_publish`, {method: 'POST', body: {creation_id: container.id}});
  const m = await graph(`${post.id}?fields=permalink`);
  console.log(`Instagram Reel: ${m.permalink}`);
}
