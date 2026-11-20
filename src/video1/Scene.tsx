import {CSSProperties} from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {sceneData} from './scene-data';
import {AnimatedArtwork} from './AnimatedArtwork';
import {MediaTrack} from './MediaTrack';
import {ease} from './motion';
import {getTrackTiming, TRANSITION_FRAMES} from './media-timing';
export type SceneData = (typeof sceneData)[number];
const milk = '#F3EFE3';
const TextReveal = ({text, frame, delay}: {text: SceneData['texts'][number]; frame: number; delay: number}) => {
  const lineHeight = text.lineHeight.unit === 'PIXELS' ? text.lineHeight.value : text.size * ((text.lineHeight.value ?? 120) / 100);
  return <div data-copy={text.id} style={{position: 'absolute', left: text.x, top: text.y, width: text.condensed ? text.w / .8 : text.w, transform: text.condensed ? 'scaleX(.8)' : undefined, transformOrigin: 'left top', color: text.color, fontSize: text.size, fontWeight: text.weight, lineHeight: `${lineHeight}px`, letterSpacing: text.letterSpacing.unit === 'PERCENT' ? `${text.letterSpacing.value / 100}em` : text.letterSpacing.value, textAlign: text.align as CSSProperties['textAlign'], fontStretch: text.condensed ? 'condensed' : undefined}}>
    {text.text.split('\n').map((line, i) => {const p = ease(frame, delay + i * 5, 24); return <div key={i} style={{whiteSpace:'nowrap',overflow: 'hidden', paddingBottom: 4, marginBottom: -4}}><div style={{transform: `translateY(${(1-p)*105}%)`, opacity: p}}>{line || '\u00a0'}</div></div>;})}
  </div>;
};
const BadgeStrip = ({frame}: {frame: number}) => <div style={{position: 'absolute', top: 440, height: 100, left: 0, right: 0, background: milk}}>
  {[38,460,882,1304,1726].map((x, i) => {const p=ease(frame, 20+i*7, 25);const scale=88/404;return <div key={x} data-badge={i} style={{position:'absolute',left:220+i*112,top:7,width:88,height:88,overflow:'hidden',opacity:p,transform:`translateY(${(1-p)*24}px)`}}><Img src={staticFile('video1/productFamily/standards-badges-generated-v1.png')} style={{position:'absolute',width:2172*scale,height:724*scale,left:-x*scale,top:-149*scale,maxWidth:'none'}} /></div>;})}
</div>;
export const Scene = ({scene:s, pending=false}: {scene:SceneData; pending?:boolean}) => {
  const f = useCurrentFrame();
  const intro = s.intro.length > 0;
  // Approved opening pace: 2.4 seconds fully visible, then a 0.6-second transition.
  const {introDuration: introLength, mainStart, mainDuration} = getTrackTiming(intro, s.duration);
  const transition=TRANSITION_FRAMES;
  const reveal = intro ? introLength - transition : (s.n===14 ? 72 : s.n===17 ? 12 : 0);
  const panel=ease(f,reveal,transition);
  const dark=s.bg.toLowerCase()==='#0a3028';
  const splitX=s.n===4?540:s.n===5?530:s.n===16?584:548;
  const endRect=s.layout==='split'?{left:splitX,top:0,width:960-splitX,height:270}:s.layout==='strip'?{left:0,top:0,width:960,height:s.n===14?300:s.n===17?270:285}:s.layout==='family'?{left:0,top:0,width:960,height:440}:{left:0,top:0,width:960,height:540};
  const rect=s.layout==='strip'&&!intro?{...endRect,height:540+(endRect.height-540)*panel}:endRect;
  const textStart=reveal+(intro?10:6);
  // Finish entrances promptly when the fixed narration leaves a short graphic hold.
  const entranceSpeed = intro && s.duration < 180 ? 2.5 : 1;
  const graphicFrame = textStart + (f - textStart) * entranceSpeed;
  return <AbsoluteFill data-scene={s.n} style={{backgroundColor:s.bg,overflow:'hidden',fontFamily:'Noto Sans, sans-serif'}}>
    <div style={{position:'absolute',width:960,height:540,transform:'scale(2)',transformOrigin:'0 0'}}>
      {intro&&<Sequence durationInFrames={introLength} name="Opening footage"><div style={{position:'absolute',inset:0,opacity:1-panel}}><MediaTrack clips={s.intro} duration={introLength} sceneNumber={s.n} track="intro" pending={pending}/></div></Sequence>}
      {s.main.length>0&&<Sequence from={mainStart} durationInFrames={mainDuration} name="Editorial footage"><div data-media-window style={{position:'absolute',...rect,overflow:'hidden',opacity:intro?panel:1}}><MediaTrack clips={s.main} duration={mainDuration} sceneNumber={s.n} track="main" pending={pending} position={s.n===14?'center 20%':'center'}/></div></Sequence>}
      {s.layout==='cutout'&&<div style={{position:'absolute',left:480,top:30,width:480,height:480,transform:`translateY(${(1-ease(f,0,38))*28}px) scale(${.96+.04*ease(f,0,45)})`,opacity:ease(f,0,20)}}><Img src={staticFile('video1/productCutouts/amin-chanar-jar.png')} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div>}
      <div style={{position:'absolute',inset:0,opacity:panel}}>
        {s.layout==='family'&&<BadgeStrip frame={f-textStart}/>}
        {s.art&&<div style={{position:'absolute',left:s.art.x,top:s.art.y,width:s.art.w,height:s.art.h}}><AnimatedArtwork scene={s.n} frame={(graphicFrame-textStart-14)*(s.n===17?2:1)} dark={dark}/></div>}
        {s.texts.map((t,i)=><TextReveal key={t.id} text={t} frame={t.cueFrame === null ? graphicFrame : f} delay={t.cueFrame ?? textStart+(t.text==='АМИН ЧАНАР'?0:i*8)}/>)}
        {s.n!==18&&<div style={{position:'absolute',left:48,top:s.n===9?438:504,width:864*ease(graphicFrame,textStart+15,35),height:s.n===9?2:3,background:'#AD955B'}}/>}
      </div>
    </div>
  </AbsoluteFill>;
};
