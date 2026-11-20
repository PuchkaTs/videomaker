import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const raw=fs.readFileSync('src/video1/scene-data.ts','utf8');
const scenes=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const serveUrl=await bundle({entryPoint:'src/index.ts',outDir:path.resolve('work/production/bundle')});
const browser=await openBrowser('chrome');
try {
 const composition=await selectComposition({serveUrl,id:'Video1Draft',puppeteerInstance:browser});
 for(const s of scenes){
  const frame=s.fromFrame+Math.min(s.duration-2,Math.max(100,Math.round(s.duration*.72)));
  await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,output:`work/production/scene-${String(s.n).padStart(2,'0')}.jpg`,imageFormat:'jpeg',scale:.5});
  console.log(`Reviewed scene ${s.n} at frame ${frame}`);
 }
} finally {await browser.close({silent:true});}
