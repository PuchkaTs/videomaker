"""Source-pixel SVG masks. Packaging and badge artwork are never redrawn."""
from pathlib import Path
import base64,json

out=Path('public/video1/productFamily')
source=out/'source-family-and-standards.jpg'
uri='data:image/jpeg;base64,'+base64.b64encode(source.read_bytes()).decode()
assets=[
 {'key':'product-red','label':'Red-label Amin Chanar jar','box':[337,168,89,120],'path':'M10 7 C18 0 63 0 75 4 L76 18 L73 23 C78 27 85 32 86 43 L86 101 C86 110 79 115 67 116 L18 118 C5 118 1 113 1 104 L1 44 C1 35 5 29 11 27 L9 23 Z'},
 {'key':'product-yellow','label':'Yellow-label Milk Protein jar','box':[439,182,66,101],'path':'M3 9 C8 1 53 0 62 5 L64 20 L61 26 L65 32 L66 85 C66 94 61 98 51 99 L13 101 C4 101 0 96 0 89 L0 35 L4 27 L1 23 Z'},
 {'key':'product-blue','label':'Blue-label Amin Chanar jar','box':[523,176,68,104],'path':'M3 9 C9 1 54 0 63 5 L65 22 L61 28 L67 35 L68 89 C68 97 62 101 52 102 L13 104 C4 104 0 99 0 92 L0 38 L4 30 L1 25 Z'},
 {'key':'product-white','label':'White-label Gelatin Peptide jar','box':[608,169,70,105],'path':'M4 10 C10 2 57 0 65 5 L66 23 L63 28 L68 36 L70 87 C70 98 63 101 54 102 L14 105 C5 105 1 100 1 92 L0 40 L4 31 L1 25 Z'},
 {'key':'product-green','label':'Green-label Amin Chanar jar','box':[697,139,93,131],'path':'M8 9 C18 1 65 0 76 5 L78 21 L75 27 C82 30 88 37 89 46 L90 109 C89 119 81 121 72 123 L18 128 C6 128 0 123 0 115 L0 49 C0 41 4 34 10 31 L7 25 Z'},
]
for key,label,box in [
 ('badge-iso-9001','ISO 9001:2015 — supplied badge',[322,50,76,80]),
 ('badge-iso-22000','ISO 22000:2018 — supplied badge',[411,42,81,81]),
 ('badge-haccp','HACCP — supplied badge',[507,32,81,81]),
 ('badge-gmp','GMP — supplied badge',[603,23,84,83]),
 ('badge-ghp','GHP — supplied badge',[703,14,84,85]),
]:
 w,h=box[2:]; path=f'M{w*.61} {h*.015} C{w*.84} {-h*.01} {w*.985} {h*.16} {w*.985} {h*.41} C{w*.985} {h*.69} {w*.79} {h*.91} {w*.52} {h*.975} C{w*.27} {h*1.025} {w*.04} {h*.88} {w*.015} {h*.64} C{-w*.025} {h*.38} {w*.235} {h*.07} {w*.61} {h*.015} Z'
 assets.append({'key':key,'label':label,'box':box,'path':path})
for a in assets:
 x,y,w,h=a['box']
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{a["label"]}</title><defs><clipPath id="silhouette"><path d="{a["path"]}"/></clipPath></defs><image x="{-x}" y="{-y}" width="1024" height="500" href="{uri}" clip-path="url(#silhouette)"/></svg>'
 (out/(a['key']+'.svg')).write_text(svg)
 a['svgForFigma']=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><path d="{a["path"]}" fill="#000"/></svg>'
(out/'assets.json').write_text(json.dumps({'source':str(source),'sourceDimensions':[1024,500],'method':'Original image pixels clipped by SVG silhouettes; no generative edits','productsPictured':5,'badgesPictured':5,'assets':assets},indent=2)+'\n')
print('Created ten source-pixel SVG assets.')
