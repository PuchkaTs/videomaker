import json, pathlib, subprocess, concurrent.futures
from PIL import Image, ImageOps, ImageDraw
ids=[1,33,32,34,70,10,57,56,4,67,8,49,42,44,45,48,43,46,5,60,59,62,64,71]
inv={x['n']:x for x in json.load(open('work/figma-refresh/inventory.json'))}
out=pathlib.Path('work/production/source-review');out.mkdir(parents=True,exist_ok=True)
def extract(n):
 s=inv[n];imgs=[]
 for j,f in enumerate([.12,.5,.86]):
  p=out/f'{n}-{j}.jpg';subprocess.run(['ffmpeg','-v','error','-ss',str(s['seconds']*f),'-i',s['path'],'-frames:v','1','-vf','scale=320:-1','-y',str(p)],check=True);imgs.append(p)
 return n,imgs
rows=sorted(concurrent.futures.ThreadPoolExecutor(4).map(extract,ids))
for page in range(3):
 canvas=Image.new('RGB',(1020,8*215),'#f3efe3');draw=ImageDraw.Draw(canvas)
 for ri,(n,ps) in enumerate(rows[page*8:page*8+8]):
  for j,p in enumerate(ps):canvas.paste(Image.open(p),(j*340,ri*215+24))
  draw.text((5,ri*215+3),f"Clip {n:02} / {inv[n]['seconds']:.2f} s / early - midpoint - late",fill='#0a3028')
 canvas.save(out/f'page-{page+1}.jpg')
print('Source motion samples ready')
