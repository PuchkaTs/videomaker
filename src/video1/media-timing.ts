export type Clip = {src: string; seconds: number; kind: string; fallback?: string};
export type FootageEdit = {src: string; startFrame: number; sourceFps: number; sourceDuration: number; kind: string};
export const MASTER_FPS = 30;
export const INTRO_FRAMES = 90;
export const TRANSITION_FRAMES = 18;
export const MIN_PLAYBACK_RATE = .1;
export const MEDIA_END_MARGIN = .08;

export const getTrackTiming = (hasIntro: boolean, sceneDuration: number) => ({
  introDuration: hasIntro ? INTRO_FRAMES : 0,
  mainStart: hasIntro ? INTRO_FRAMES - TRANSITION_FRAMES : 0,
  mainDuration: sceneDuration - (hasIntro ? INTRO_FRAMES - TRANSITION_FRAMES : 0),
});

// Allocate from the original edit, so swapping a source never moves a neighbouring cut.
export const getClipWindows = (clips: Clip[], duration: number) => {
  const total = clips.reduce((sum, clip) => sum + clip.seconds, 0);
  let cursor = 0;
  return clips.map((clip, index) => {
    const length = index === clips.length - 1 ? duration - cursor : Math.max(1, Math.round(duration * clip.seconds / total));
    const from = cursor;
    cursor += length;
    return {clip, index, from, length};
  });
};

export const getClipPlayback = (clip: Clip, length: number, edit?: FootageEdit) => {
  const startSeconds = edit ? edit.startFrame / edit.sourceFps : 0;
  const sourceDuration = edit?.sourceDuration ?? clip.seconds;
  const available = sourceDuration - startSeconds - MEDIA_END_MARGIN;
  const rate = Math.min(1, available * MASTER_FPS / length);
  if (!Number.isFinite(rate) || rate < MIN_PLAYBACK_RATE - 1e-8) throw new Error('Choose an earlier start frame: too little footage remains for this scene.');
  return {src: edit?.src ?? clip.src, startSeconds, rate: Math.max(MIN_PLAYBACK_RATE, rate), trimBefore: startSeconds * MASTER_FPS, endSeconds: startSeconds + length / MASTER_FPS * rate};
};
