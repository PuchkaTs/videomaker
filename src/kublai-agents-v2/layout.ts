import cues from './cues.json';

export type CueName = keyof typeof cues.t;
export const c = (name: CueName) => cues.t[name];
export const SCENES = cues.scenes;
export const DURATION_S = cues.duration;

// Voice versions: narration, or a customer/agent dialogue. Each lists its clips (files under
// public/) with a start cue and gain, plus the score stems ducked for it. The final mix
// (scripts/render-kublai-agents-v2.mjs) and the music ducking read the same lists.
export type VoiceVersion = 'narration' | 'dialogue';
const clips = (list: typeof cues.voice) => list.map((v) => ({...v, at: c(v.cue as CueName)}));
export const VOICES: Record<VoiceVersion, ReturnType<typeof clips>> = {narration: clips(cues.voice), dialogue: clips(cues.voiceDialogue)};
// Named whooshes (W01–W22) from cues.json, shown as markers on the Studio timeline.
export const WHOOSHES = cues.whooshes.map((w) => ({...w, at: c(w.cue as CueName) + w.offset}));

// Score stems per version (music and SFX duck under that version's voices), each its own Studio track.
const stems = (v: VoiceVersion) => [
  {name: 'Music', file: `kublai-v2/stems/${v}/music.wav`},
  {name: 'Sound effects', file: `kublai-v2/stems/${v}/sfx.wav`},
  {name: 'Whooshes (sound)', file: `kublai-v2/stems/${v}/whooshes.wav`},
];
export const STEMS: Record<VoiceVersion, {name: string; file: string}[]> = {narration: stems('narration'), dialogue: stems('dialogue')};

// World anchors (px) for each set; the camera's focal point visits them in turn.
export const SET = {
  intro: {x: 0, y: 0, z: 0},
  reply: {x: 0, y: 0, z: -2400},
  booking: {x: 3000, y: 0, z: -2400},
  comment: {x: 3000, y: 2400, z: -2400},
  lead: {x: 5800, y: 2400, z: -2400},
  app: {x: 5800, y: 2400, z: -5400},
  outro: {x: 5800, y: 2400, z: -3900},
} as const;

// Screen-space columns used by every scene: caption on the left, product on the right.
export const CAPTION_X = -540;

// Is global time t inside [a - pre, b + post]? Used to skip rendering idle sets.
export const active = (t: number, [a, b]: readonly number[], pre = 1.2, post = 1.2) => t >= a - pre && t <= b + post;
