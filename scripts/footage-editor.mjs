import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {FootageStore,buildCatalog,readScenes,EditorError} from './footage-editor-core.mjs';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const port=Number(process.env.FOOTAGE_EDITOR_PORT||3011), token=randomBytes(24).toString('hex');
const catalog=await buildCatalog(root), scenes=await readScenes(root), store=new FootageStore({root,scenes,catalog});
const thumbnailDir=path.join(root,'work/footage-editor/thumbnails');await fsp.mkdir(thumbnailDir,{recursive:true});
const run=promisify(execFile),pending=new Map();let thumbQueue=Promise.resolve();
const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const sendFile=async(req,res,file,type)=>{
  const {size}=await fsp.stat(file),range=req.headers.range;
  let start=0,end=size-1,status=200;
  if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match || (!match[1]&&!match[2]))throw new EditorError('Invalid range',416);
    if(!match[1])start=Math.max(0,size-Number(match[2]));else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
    if(start>end||start>=size)throw new EditorError('Invalid range',416);status=206;
  }
  res.writeHead(status,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes',...(status===206?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
};
const thumbnail=async(asset,frame)=>{
  const name=createHash('sha256').update(`${asset.src}:${asset.mtime}:${frame}`).digest('hex')+'.jpg',file=path.join(thumbnailDir,name);
  if(fs.existsSync(file))return file;
  if(!pending.has(name)) {
    const task=thumbQueue.then(()=>run('ffmpeg',['-v','error','-ss',String(frame/asset.fps),'-i',path.join(root,'public',asset.src),'-frames:v','1','-vf','scale=320:-2','-y',file],{timeout:15000})).then(()=>file);
    thumbQueue=task.catch(()=>{});pending.set(name,task);task.finally(()=>pending.delete(name)).catch(()=>{});
  }
  return pending.get(name);
};
const server=http.createServer(async(req,res)=>{
  try {
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))throw new EditorError('Local access only',403);
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; connect-src 'self'; frame-ancestors 'none'");
    const url=new URL(req.url,`http://localhost:${port}`);
    if(req.method==='GET'&&url.pathname==='/api/project')return json(res,{...await store.snapshot(),token});
    if(req.method==='POST'&&url.pathname.startsWith('/api/')){
      if(req.headers['x-editor-token']!==token || !['http://localhost:'+port,'http://127.0.0.1:'+port,undefined].includes(req.headers.origin))throw new EditorError('Reload the editor to reconnect.',403);
      let body='';for await(const chunk of req){body+=chunk;if(body.length>16000)throw new EditorError('Request too large',413);}
      const input=JSON.parse(body);
      if(url.pathname==='/api/preview')return json(res,await store.preview(input));
      if(['/api/apply','/api/reset','/api/undo'].includes(url.pathname))return json(res,await store.mutate(url.pathname.slice(5),input));
    }
    if(['GET','HEAD'].includes(req.method)&&/^\/(media|thumbnail)\//.test(url.pathname)){
      const [,,id]=url.pathname.split('/'),asset=catalog.find(a=>a.id===id);if(!asset)throw new EditorError('Video not found',404);
      if(url.pathname.startsWith('/media/'))return await sendFile(req,res,path.join(root,'public',asset.src),'video/mp4');
      const frame=Number(url.searchParams.get('frame')||0);if(!Number.isInteger(frame)||frame<0||frame>=asset.frames)throw new EditorError('Invalid thumbnail frame');
      return await sendFile(req,res,await thumbnail(asset,frame),'image/jpeg');
    }
    const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
    if(req.method==='GET'&&files[url.pathname]){res.setHeader('Cache-Control','no-store');return await sendFile(req,res,path.join(root,'editor',files[url.pathname]),url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');}
    throw new EditorError('Not found',404);
  }catch(error){if(!res.headersSent)json(res,{error:error instanceof SyntaxError?'Invalid request':error.message},error.status||500);else res.destroy();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Footage review: http://127.0.0.1:${port} (${catalog.length} project sources)`));
