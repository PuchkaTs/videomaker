import {AbsoluteFill, Audio, Img, Sequence, staticFile} from 'remotion';

// Full source voiceover: 158.832 seconds, rounded up to the next 30 fps frame.
export const VIDEO1_DURATION = Math.ceil(158.832 * 30);

// Temporary image holds. Replace these with narration-matched scenes in the next edit.
const scenes = [
  {from: 0, to: 1590, image: 'productImage1.jpg', name: 'Product image 1'},
  {from: 1590, to: 3180, image: 'productImage2.jpg', name: 'Product image 2'},
  {from: 3180, to: VIDEO1_DURATION, image: 'productImage3.jpg', name: 'Product image 3'},
];

export const Video1Draft = () => (
  <AbsoluteFill style={{backgroundColor: '#103e32'}}>
    <Audio src={staticFile('video1/voiceover.mp3')} />
    {scenes.map((scene) => (
      <Sequence key={scene.image} from={scene.from} durationInFrames={scene.to - scene.from} name={scene.name}>
        <AbsoluteFill style={{background: 'linear-gradient(90deg, #0b3027, #1d5947 50%, #0b3027)', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile(`video1/productImages/${scene.image}`)} style={{height: '100%', width: '100%', objectFit: 'contain'}} />
        </AbsoluteFill>
      </Sequence>
    ))}
  </AbsoluteFill>
);
