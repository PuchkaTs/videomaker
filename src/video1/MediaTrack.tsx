import {Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import savedEdits from './footage-edits.json';
import {Clip, FootageEdit, getClipPlayback, getClipWindows} from './media-timing';
export type {Clip} from './media-timing';
/** Cut through supplied clips once; fit the available motion to its narration window. */
export const MediaTrack = ({clips, duration, sceneNumber, track, pending = false, position='center'}: {clips: Clip[]; duration: number; sceneNumber: number; track: 'intro' | 'main'; pending?: boolean; position?:string}) => {
  return <>{getClipWindows(clips, duration).map(({clip, index: i, from, length}) => {
    const edit = (savedEdits as Record<string, FootageEdit>)[`${sceneNumber}:${track}:${i}`];
    const {src, trimBefore, rate} = getClipPlayback(clip, length, edit);
    const style = {width: '100%', height: '100%', objectFit: 'cover' as const, objectPosition:position};
    return <Sequence key={`${src}-${i}`} from={from} durationInFrames={length} name={src.split('/').pop()}>
      {pending && clip.fallback && !edit ? <Img src={staticFile(clip.fallback)} style={style} /> : <OffthreadVideo src={staticFile(src)} trimBefore={trimBefore} muted playbackRate={rate} style={style} />}
    </Sequence>;
  })}</>;
};
