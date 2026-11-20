import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

// Noto Sans for the app UI (matches the product), Inter variable for kinetic display type.
const FACES: [string, string, string][] = [
  ['Noto Sans', 'fonts/NotoSans-Regular.ttf', '400'],
  ['Noto Sans', 'fonts/NotoSans-Bold.ttf', '700'],
  ['Inter', 'fonts/Inter-Variable.ttf', '100 900'],
];

let loading: Promise<unknown> | undefined;

export const FontsV2 = () => {
  const [handle] = useState(() => delayRender('Loading Noto Sans and Inter'));
  useEffect(() => {
    loading ??= Promise.all(
      FACES.map(async ([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, {weight});
        await face.load();
        document.fonts.add(face);
      }),
    );
    loading.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return null;
};

export const DISPLAY = "'Inter', 'Noto Sans', Arial, sans-serif";
