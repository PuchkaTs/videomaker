import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
let loading: Promise<unknown> | undefined;
export const Fonts = () => {
  const [handle] = useState(() => delayRender('Loading bundled Cyrillic fonts'));
  useEffect(() => {
    loading ??= Promise.all([400,700].map(async weight => {
      const face = new FontFace('Noto Sans', `url(${staticFile(`fonts/NotoSans-${weight===700?'Bold':'Regular'}.ttf`)})`, {weight:String(weight)});
      await face.load(); document.fonts.add(face);
    }));
    loading.then(()=>continueRender(handle)).catch(cancelRender);
  }, [handle]);
  return null;
};
