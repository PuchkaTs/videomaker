import pathlib,subprocess,json
from PIL import Image,ImageDraw
ps=sorted(pathlib.Path('public/video1/generated').glob('*.mp4'));out=pathlib.Path('work/production/generated-review');out.mkdir(exist_ok=True)
canvas=Image.new('RGB',(1200,len(ps)*248),'#f3efe3');draw=ImageDraw.Draw(canvas);probes=[]
for i,p in enumerate(ps):
 meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(p)]));dur=float(meta['format']['duration']);v=next(s for s in meta['streams'] if s['codec_type']=='video');probes.append({'file':str(p),'seconds':dur,'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'audio':any(s['codec_type']=='audio' for s in meta['streams'])})
 draw.text((4,i*248+4),f'{p.name} / {dur}s / {v["width"]}x{v["height"]}',fill='#0a3028')
 for j,f in enumerate([.06,.50,.90]):
  op=out/f'{i}-{j}.jpg';subprocess.run(['ffmpeg','-v','error','-ss',str(dur*f),'-i',str(p),'-frames:v','1','-vf','scale=400:225','-y',str(op)],check=True);canvas.paste(Image.open(op),(j*400,i*248+23))
canvas.save(out/'overview.jpg');json.dump(probes,open('docs/video1/generated-media-probe.json','w'),indent=2);print(probes)
