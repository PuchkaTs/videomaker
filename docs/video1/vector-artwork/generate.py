"""Static, editable scene illustrations. Run from the repository root."""
from pathlib import Path
import json, math, html

OUT = Path('public/video1/vectors')
E, F, G, M = '#0A3028', '#124B3A', '#D6BA75', '#F3EFE3'
def path(d, fill='none', stroke=E, w=6):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def circle(x,y,r,fill=G,stroke='none',w=6):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'
def ellipse(x,y,rx,ry,fill='none',stroke=E,w=6):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'
def rect(x,y,w,h,r=0,fill=M,stroke='none',sw=6):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def group(name,body,transform=''):
    return f'<g id="{name}"'+(f' transform="{transform}"' if transform else '')+f'>{body}</g>'
def drop(x,y,s=1,fill=M,stroke=E):
    return f'<g transform="translate({x} {y}) scale({s})">'+path('M0 -90 C-18 -58 -65 -14 -65 27 A65 65 0 0 0 65 27 C65 -14 18 -58 0 -90 Z',fill,stroke)+ '</g>'
def leaf(x,y,s=1,rotate=0):
    return f'<g transform="translate({x} {y}) rotate({rotate}) scale({s})">'+path('M0 70 C-100 15 -68 -70 32 -90 C72 -20 65 37 0 70 Z',F,'none')+path('M0 69 L24 -54',stroke=G,w=4)+'</g>'
def mountain(x=0,y=0,s=1):
    return f'<g transform="translate({x} {y}) scale({s})">'+path('M140 355 L318 144 L430 278 L553 112 L800 355 Z',E,'none')+path('M268 204 L318 144 L369 205 L337 197 L316 214 L297 197 Z',M,'none')+path('M502 169 L553 112 L613 171 L583 164 L553 182 L529 160 Z',M,'none')+'</g>'
def points(coords, color=G, r=12, prefix='particle'):
    return ''.join(group(f'{prefix}-{i+1:02}',circle(x,y,r,color)) for i,(x,y) in enumerate(coords))

scenes=[]
def add(n,slug,idea,layers,motion):
    title=f'{n:02} / {idea}'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-labelledby="title"><title id="title">{html.escape(title)}</title><desc>Conceptual illustration. Separate named groups for future motion. No animation or raster images.</desc>'+''.join(group(k,v) for k,v in layers)+'</svg>'
    filename=f'{n:02}-{slug}.svg'
    (OUT/filename).write_text(svg)
    scenes.append(dict(scene=n,title=idea,file=filename,layers=[k for k,v in layers],futureMotion=motion))

add(1,'mongolian-origins','A promise born in Mongolia',[
 ('rising-sun',circle(593,167,72,G)),('mountain-ranges',mountain()),
 ('pasture-contours',path('M136 383 Q325 335 475 388 T824 387',stroke=F,w=5)+path('M235 421 Q400 383 586 421 T759 427',stroke=G,w=4)),
 ('research-seed',circle(319,331,14,G)+path('M319 317 V279 M305 289 L319 302 L338 281',stroke=G,w=4))],
 'Sun rises behind the ridge; pasture lines draw on; the research seed becomes the next scene particle.')

add(2,'research-curiosity','The curiosity behind the product',[
 ('orbit',ellipse(480,266,245,144,stroke=G,w=3)),
 ('flask',path('M405 122 H505 M427 122 V221 L345 360 Q335 391 373 391 H538 Q578 391 560 355 L484 220 V122',M,E,7)),
 ('milk-sample',path('M382 307 Q417 286 455 309 T529 310 L554 359 Q564 379 538 379 H373 Q349 379 362 358 Z',F,'none')),
 ('sample-bubbles',points([(413,342),(465,353),(494,322)],G,8,'sample-bubble')),
 ('conceptual-chain',path('M611 179 L674 237 L632 303',stroke=E,w=5)+points([(611,179),(674,237),(632,303)],G,19,'chain-node')),
 ('curiosity-point',circle(249,263,12,F))],
 'Liquid rises gently; abstract peptide nodes connect. The chain is symbolic, not a chemical structure.')

add(3,'first-milestone','The first milestone',[
 ('timeline',path('M145 374 H814',stroke=E,w=5)),
 ('past-points',points([(184,374),(255,374),(326,374)],F,7,'past-point')),
 ('milestone-stem',path('M472 374 V136',stroke=E,w=7)),
 ('milestone-banner',path('M472 139 H662 L625 196 L662 252 H472 Z',F,'none')+path('M504 174 H583 M504 197 H560',stroke=G,w=5)),
 ('milestone-anchor',circle(472,374,27,M,E,5)+circle(472,374,10,G)),
 ('future-points',points([(604,374),(676,374),(748,374)],G,7,'future-point'))],
 'Draw the timeline, lift the flag, and reveal the existing 2016 headline independently.')

add(4,'production','Research becomes production',[
 ('flow-inlet',path('M130 213 H296 V265 H343',stroke=G,w=7)),
 ('sample-drop',drop(188,169,.45,F,'none')),
 ('processing-vessel',rect(346,147,145,239,57,M,E,7)+ellipse(418,166,55,17,stroke=E,w=5)+path('M366 289 Q418 310 471 289',stroke=G,w=5)),
 ('production-vessel',rect(571,147,145,239,57,F,E,7)+ellipse(643,166,55,17,stroke=G,w=5)+path('M594 292 H692',stroke=G,w=5)),
 ('transfer-path',path('M492 252 H570',stroke=E,w=7)),
 ('outlet',path('M717 270 H794 V363',stroke=G,w=7)),
 ('platform',path('M292 410 H771',stroke=E,w=5))],
 'Trace the processing route and reveal vessels in sequence. Generic process metaphor, not a facility drawing.')

yak = (Path(__file__).parent / 'yak-anatomy.svg').read_text().split('>', 1)[1].rsplit('</svg>', 1)[0]
add(5,'yak-milk','The value of yak milk',[
 ('distant-ridge',path('M161 215 L278 134 L382 192 L476 122 L642 209',stroke=G,w=4)),
 ('yak-silhouette',yak),('milk-drop',drop(669,306,.85,M,E)),
 ('pasture',path('M188 395 Q393 369 544 401 M568 404 H762',stroke=E,w=5)),
 ('grass',path('M212 391 L203 366 M212 391 L226 364 M751 404 L744 382 M751 404 L764 381',stroke=G,w=4))],
 'Ridge draws first; yak and milk drop enter separately; a slight grass sway can follow later.')

add(6,'protein-process','Making the invisible understandable',[
 ('source-protein',drop(251,260,1.1,M,E)),
 ('source-nodes',points([(228,257),(268,278),(243,312)],F,11,'source-node')),
 ('processing-gate',path('M423 152 V394 M448 152 V394',stroke=G,w=5)),
 ('flow-lines',path('M346 265 H398 M476 265 H535',stroke=E,w=5)),
 ('separated-links',path('M581 226 L644 188 L707 226 M581 313 L644 351 L707 313',stroke=E,w=5)),
 ('released-nodes',points([(581,226),(644,188),(707,226),(581,313),(644,351),(707,313)],F,19,'released-node')),
 ('gold-particles',points([(758,266),(773,195),(783,338)],G,8,'gold-particle'))],
 'A milk sample passes through the gate and resolves into smaller conceptual building blocks; do not present as a measured molecular model.')

ticks=''.join(path(f'M{480+math.sin(a)*142:.2f} {267-math.cos(a)*142:.2f} L{480+math.sin(a)*155:.2f} {267-math.cos(a)*155:.2f}',stroke=G,w=4) for a in [i*math.pi/6 for i in range(12)])
add(7,'time-message','A clear time-based message',[
 ('clock-outline',circle(480,267,180,M,E,7)),('minute-marks',ticks),
 ('clock-hand-long',path('M480 267 V161',stroke=E,w=7)),
 ('clock-hand-short',path('M480 267 L552 310',stroke=E,w=7)),
 ('clock-pivot',circle(480,267,12,G)),
 ('time-arc',path('M660 267 A180 180 0 0 1 570 423',stroke=G,w=12)),
 ('milk-cue',drop(232,280,.48,F,'none'))],
 'Hands rotate from named pivot; gold arc draws on. Keep the storyboard 15–20 minute copy separate.')

coords=[(330+75*c,150+75*r) for r in range(4) for c in range(5)]
add(8,'twenty-building-blocks','Twenty building blocks',[
 ('open-brackets',path('M272 137 H246 V389 H272 M690 137 H716 V389 H690',stroke=G,w=5)),
 ('twenty-individual-blocks',points(coords,F,23,'amino-block')),
 ('highlight-links',path('M330 150 H405 M480 225 H555 M555 300 H630 M330 375 H405',stroke=G,w=7))],
 'Reveal exactly twenty independently named blocks in a 5 by 4 rhythm. Abstract count, not a peptide sequence.')

petals=''.join(group(f'family-petal-{i+1:02}',path('M480 246 C437 216 435 150 480 124 C525 150 523 216 480 246 Z',F if i%2==0 else G,'none'),f'rotate({i*60} 480 270)') for i in range(6))
add(9,'growing-family','A growing family of products',[
 ('six-branches',petals),('family-center',circle(480,270,29,M,E,5)),
 ('family-orbit',circle(480,270,186,'none',E,3)),
 ('open-ended-growth',path('M692 345 Q734 319 767 338 M713 346 Q722 380 742 380',stroke=G,w=5))],
 'Six petals open around one origin; place the approved jar alongside when composing. Petals symbolize variety without inventing six packages.')

add(10,'local-value','Value stays in Mongolia',[
 ('circulation-top',path('M249 236 C292 96 584 79 712 219 M712 219 L702 183 M712 219 L675 212',stroke=G,w=6)),
 ('circulation-bottom',path('M712 323 C650 461 377 459 250 326 M250 326 L257 365 M250 326 L291 334',stroke=E,w=6)),
 ('ger-body',path('M343 249 L480 171 L617 249 V359 H343 Z',M,E,6)),
 ('ger-roof',path('M343 249 H617 M457 184 H503',stroke=E,w=6)),
 ('ger-door',rect(457,287,46,72,0,F)+path('M480 289 V358',stroke=G,w=3)),
 ('pasture-lines',path('M362 325 H424 M536 325 H598',stroke=G,w=4))],
 'Two circular paths draw around a Mongolian ger to express the local value cycle.')

add(11,'quality-steps','Quality made visible',[
 ('continuous-route',path('M179 342 H331 V269 H489 V195 H750',stroke=G,w=6)),
 ('step-01',rect(167,265,111,79,14,M,E,5)+path('M193 304 L211 319 L249 287',stroke=E,w=6)),
 ('step-02',rect(407,192,111,79,14,M,E,5)+path('M433 231 L451 246 L489 214',stroke=E,w=6)),
 ('inspection-lens',circle(686,191,71,M,E,7)+path('M736 242 L790 296',stroke=E,w=11)),
 ('inspection-focus',path('M655 189 L680 211 L720 167',stroke=F,w=7))],
 'Trace three inspection stages and reveal checks; these are process illustrations, not certification badges.')

add(12,'natural-continuation','A natural continuation',[
 ('soil-rings',ellipse(480,402,189,35,stroke=E,w=5)+ellipse(480,402,131,20,stroke=G,w=3)),
 ('growing-stem',path('M480 397 C480 307 473 223 501 142',stroke=E,w=7)),
 ('left-leaf',leaf(426,272,.7,-58)),('right-leaf',leaf(528,203,.83,42)),
 ('root-lines',path('M480 403 L458 426 M480 403 L497 433',stroke=G,w=4)),
 ('natural-light',circle(641,151,20,G))],
 'Grow the stem, rotate leaves from their base, and expand soil rings; avoid any invented organic certification seal.')

add(13,'hero-reveal','A product in the spotlight',[
 ('spotlight-left',path('M328 127 L191 350',stroke=G,w=4)),
 ('spotlight-right',path('M632 127 L769 350',stroke=G,w=4)),
 ('hero-halo',path('M307 282 A173 173 0 0 1 653 282',stroke=E,w=5)),
 ('podium-base',rect(275,369,410,66,0,F)+ellipse(480,435,205,35,F,'none')),
 ('podium-top',ellipse(480,369,205,42,M,E,6)),
 ('hero-spark',path('M480 109 V143 M463 126 H497',stroke=G,w=5))],
 'Open the halo and bring in the approved product cutout on the empty podium. No redrawn packaging or event endorsement.')

add(14,'daily-nourishment','Nutrition for everyday life',[
 ('morning-sun',circle(295,174,44,G)),
 ('table-line',path('M189 385 H775',stroke=E,w=5)),
 ('cup-body',path('M345 219 H580 V305 Q580 375 511 375 H414 Q345 375 345 305 Z',M,E,7)),
 ('cup-handle',path('M581 237 H605 Q665 239 648 290 Q637 323 584 315',stroke=E,w=7)),
 ('milk-surface',ellipse(462,220,116,25,M,E,5)),
 ('nourishment-drop',drop(461,152,.40,F,'none')),
 ('daily-rhythm',path('M695 154 V194 M676 174 H714',stroke=G,w=4))],
 'Sun appears, a milk drop descends toward the cup, and the surface ripple expands. Everyday nutrition without health-result promises.')

add(15,'collaborative-research','Collaboration and observation',[
 ('shared-network',path('M333 189 L629 189 L480 378 Z',stroke=G,w=5)),
 ('researcher-left',circle(333,171,32,F)+path('M285 247 V238 Q333 188 381 238 V247 Z',F,'none')),
 ('researcher-right',circle(629,171,32,F)+path('M581 247 V238 Q629 188 677 238 V247 Z',F,'none')),
 ('shared-notebook',rect(416,307,128,112,10,M,E,6)+path('M438 341 H523 M438 366 H501 M438 389 H512',stroke=G,w=4)),
 ('observation-point',circle(480,219,27,M,E,5)+circle(480,219,7,G))],
 'Connect two abstract researchers to a shared notebook; no institution logos, patient data or invented results.')

add(16,'nature-and-science','Nature, science and modern craft',[
 ('nature-leaf',leaf(303,270,1.15,-25)),
 ('craft-connector',path('M387 275 H569',stroke=G,w=5)),
 ('science-links',path('M588 270 L658 169 L737 270 L658 372 Z M588 270 H737',stroke=E,w=5)),
 ('science-nodes',points([(588,270),(658,169),(737,270),(658,372)],F,24)),
 ('shared-origin',circle(479,275,23,M,E,5)),
 ('unity-arc',path('M216 384 Q480 510 780 388',stroke=G,w=3))],
 'Leaf and conceptual science network enter from opposite sides and meet at one shared origin.')

add(17,'drop-by-drop','Little by little',[
 ('outer-ripple',ellipse(480,373,259,60,stroke=E,w=4)),
 ('middle-ripple',ellipse(480,373,178,40,stroke=G,w=5)),
 ('inner-ripple',ellipse(480,373,85,20,stroke=E,w=4)),
 ('falling-drop',drop(480,228,1.10,M,E)),
 ('drop-highlight',path('M440 241 Q421 271 445 293',stroke=G,w=5))],
 'Drop descends; three separate elliptical ripples expand with staggered timing under the slogan.')

add(18,'brand-resolution','The final brand reveal',[
 ('horizon-left',path('M151 373 H339',stroke=G,w=4)),
 ('horizon-right',path('M621 373 H809',stroke=G,w=4)),
 ('open-brand-arch',path('M345 371 V258 A135 135 0 0 1 615 258 V371',stroke=E,w=6)),
 ('base-ring',ellipse(480,374,142,27,stroke=G,w=4)),
 ('origin-sun',circle(480,127,16,G))],
 'Arch reveals around the approved jar, then holds with the existing brand typography; this is a framing device, not a replacement logo.')

manifest={'version':1,'format':'SVG','viewBox':[0,0,960,540],'background':'transparent','palette':{'emerald':E,'forest':F,'gold':G,'milk':M},'status':'Static artwork only; motion directions are notes for a later pass.','productRule':'Retain approved product cutout and photography. No packaging redrawn.','scenes':scenes}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
cards=''.join(f'<article><header><span>{s["scene"]:02}</span><h2>{html.escape(s["title"])}</h2></header><a href="{s["file"]}"><img src="{s["file"]}" alt="{html.escape(s["title"])}"></a><p>{html.escape(s["futureMotion"])}</p><footer>{len(s["layers"])} named layer groups · <a href="{s["file"]}" download>Download SVG ↗</a></footer></article>' for s in scenes)
(OUT/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Amin Chanar · Vector collection</title><style>*{box-sizing:border-box}body{margin:0;background:#eae7de;color:#0a3028;font:16px/1.5 system-ui,sans-serif}main{max-width:1480px;margin:auto;padding:56px 40px}h1{font-size:clamp(32px,4vw,58px);line-height:1.1;letter-spacing:-2px;max-width:900px;margin:20px 0}aside{max-width:760px;color:#355548;margin-bottom:36px}.eyebrow{letter-spacing:3px;font-size:12px;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}article{background:#fbf8f0;border:1px solid #d9d8cc;overflow:hidden}header{padding:20px 22px 0;display:flex;align-items:baseline;gap:12px}header span{font-size:13px;color:#64756c}h2{font-size:17px;line-height:1.4;margin:0}img{display:block;width:100%;height:auto}p{padding:0 22px;margin:0 0 20px;font-size:14px;color:#355548;min-height:88px}footer{padding:15px 22px;border-top:1px solid #e8e4d7;font-size:12px}a{color:inherit}a:focus-visible{outline:3px solid #d6ba75}@media(max-width:1050px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){main{padding:28px 16px}.grid{grid-template-columns:1fr}p{min-height:0}}@media print{.grid{grid-template-columns:repeat(2,1fr)}article{break-inside:avoid}main{padding:0}}</style><main><div class="eyebrow">Amin Chanar / Motion artwork / 01</div><h1>Small gestures.<br>Ideas made visible.</h1><aside>18 minimalist vector illustrations matched to the storyboard. Each SVG has a transparent 960 × 540 canvas and separate named parts. These are static artwork; the notes describe a later motion pass.</aside><div class="grid">'''+cards+'</div></main></html>')
# Transparent overview assembled from the actual SVG artwork for visual inspection.
overview=[]
for i,s in enumerate(scenes):
    body=(OUT/s['file']).read_text().split('</desc>',1)[1].rsplit('</svg>',1)[0]
    x,y=(i%3)*500,(i//3)*340
    overview.append(f'<g transform="translate({x} {y})"><rect width="484" height="324" fill="#FBF8F0"/><text x="20" y="32" font-family="Arial" font-size="16" fill="{E}">{s["scene"]:02} / {html.escape(s["title"])}</text><g transform="translate(2 42) scale(.5)">{body}</g></g>')
Path('work/vector-artwork/overview.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="2040" viewBox="0 0 1500 2040">'+''.join(overview)+'</svg>')
print(f'Created {len(scenes)} SVGs, manifest, and gallery.')
