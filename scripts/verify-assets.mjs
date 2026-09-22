import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'docs/video1/asset-manifest.json'), 'utf8'));
let failures = 0;
for (const asset of manifest.files) {
  try {
    const target = path.join(root, asset.path);
    const info = await stat(target);
    if (info.size !== asset.bytes) throw new Error('size mismatch; run git lfs pull if this is a video');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(target)) hash.update(chunk);
    if (hash.digest('hex') !== asset.sha256) throw new Error('SHA-256 mismatch');
  } catch (error) {
    failures++;
    console.error(`${asset.path}: ${error.message}`);
  }
}
console.log(`${manifest.files.length - failures}/${manifest.files.length} source assets verified.`);
process.exitCode = failures ? 1 : 0;
