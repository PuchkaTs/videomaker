import {vectorData} from './vector-data';
import {ease, linear} from './motion';
import {ClockArtwork} from './ClockArtwork';
/** Original SVG groups, animated by frame rather than browser-time CSS. */
export const AnimatedArtwork = ({scene, frame, dark}: {scene: number; frame: number; dark: boolean}) => {
  if (scene === 7) return <div data-artwork={scene} style={{width: '100%', height: '100%'}}><ClockArtwork frame={frame} dark={dark}/></div>;
  let svg = vectorData[scene];
  if (dark) svg = svg.replace(/#0A3028/g, '#F3EFE3').replace(/#124B3A/g, '#F3EFE3');
  let order = 0;
  svg = svg.replace(/<g id="([^"]+)"/g, (tag, id: string) => {
    const idx = order++;
    const block = id.match(/^amino-block-(\d+)/);
    const child = /(?:node|point|bubble|mark|grass|particle)-?\d/.test(id);
    const delay = block ? 12 + (Number(block[1]) - 1) * 3 : child ? idx * 1.5 : idx * 3;
    const p = ease(frame, delay, block ? 18 : 26);
    let transform = `translate(0px, ${(1 - p) * 12}px)`;
    if (block || /(?:nodes|seed|point|focus)/.test(id)) transform = `scale(${0.65 + p * 0.35})`;
    if (/sun|banner|stem|leaf|vessel/.test(id)) transform = `translate(0px, ${(1 - p) * 22}px) scale(1,${0.82 + p * 0.18})`;
    if (/falling-drop|nourishment-drop|sample-drop/.test(id)) transform = `translate(0px, ${-32 * (1 - ease(frame, 16, 48))}px)`;
    if (/ripple/.test(id)) transform = `scale(${0.7 + 0.3 * ease(frame, idx * 8, 60)})`;
    if (/released-nodes|separated-links/.test(id)) transform = `translate(${18 * ease(frame, 35, 70)}px,0px)`;
    if (/sample-bubble/.test(id)) transform = `translate(0px, ${Math.sin((frame + idx * 9) / 25) * 2 * p}px)`;
    return `${tag} style="opacity:${p};transform:${transform};transform-box:fill-box;transform-origin:center"`;
  });
  const draw = linear(frame, 5, 65);
  svg = svg.replace(/<path\b([^>]*?)\/>/g, (tag, attrs: string) => attrs.includes('fill="none"') ? `<path${attrs} pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - draw}"/>` : tag);
  svg = svg.replace('width="960" height="540"', 'width="100%" height="100%"');
  return <div data-artwork={scene} style={{width: '100%', height: '100%'}} dangerouslySetInnerHTML={{__html: svg}} />;
};
