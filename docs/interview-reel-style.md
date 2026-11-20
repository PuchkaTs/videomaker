# Interview reel style (the Elon Musk reels)

The vertical reel format used for `GatesAiReel`, `SpacexReel` and `AbundanceReel`: a well-known speaker's own footage, a Mongolian voiceover over their ducked voice, a kinetic headline above the picture and word-by-word captions inside it.

- **Reference reel:** `AbundanceReel`, long cut, `outputs/abundance-reel-long.mp4` (104 s, 2026-11-11). Source in `src/abundance-reel/`, plan in `docs/abundance-reel/storyboard.md`.
- **Why keep it:** the SpaceX reel in this format got about 100k views in its first 24 hours.
- The numbers below are read from the reference reel's code, `plan.json`, `cues.json` and render log. Sound levels are measured values, not a listening judgement.

## The frame

```
1080 × 1920, 60 fps
┌────────────────────────────┐ 0
│   HEADLINE, 2–3 lines,     │
│   capitals, last line amber│
├────────────────────────────┤ 370
│ ▌Илон Маск  (name tag)     │
│                            │
│   footage panel            │
│   1080 × 1350 (4:5)        │
│                            │
│  [ word-by-word caption ]  │ about 1470
├────────────────────────────┤ 1720
│  Эх сурвалж: …  (credit)   │
└────────────────────────────┘ 1920
```

| Element | Spec |
|---|---|
| Background | radial gradient `#0E1520` → `#06080C` |
| Colours | text `#F5F7FA`, accent amber `#FFB23F`, credit at 58% white |
| Font | Inter (`FontsV2`), headline weight 850, captions 800 |
| Headline | capitals, lines split with `\|` in the plan, each line kept on one line; size is `min(92, 990 / (longest line × 0.74))` px, so a line of up to about 14 characters is full size and 22 characters is about 60 px. With `tone: "accent"` the last line is amber with a soft glow |
| Opening title | `big: true`: three short lines, up to 96 px, fills the space above the footage |
| Headline motion | words rise from behind a mask, 55 ms apart, 0.5 s ease-out; exit is a 0.18 s fade and 30 px lift |
| Captions | 56 px on a dark rounded plate (50% black), the word being spoken is amber; chunks of about 22 characters and at most four words, breaking after punctuation; the particles «л» and «ч» stay with the word before them |
| Name tag | top left of the panel, amber bar on the left, 34 px, shown from 0.35 s to 3.6 s of the first beat |
| Credit | 26 px, centred under the panel, fades out when the end card comes in |
| End card | a darkened still, a question in capitals (last line amber), «Сэтгэгдлээ үлдээгээрэй», the credit; 3.6 s |

**Footage:** 16:9 source cropped to the 4:5 panel. Every camera shot in a clip has a framing kind (`elon` close-up, `med` standing, `wide` stage, `slide`, `chart`, `anim` b-roll, and so on), chosen so the speaker is centred and English slide text is zoomed past. Each cut and each camera change gets a 7% punch-in over 0.45 s, then a slow 3% push. Grade is light: `contrast(1.05) saturate(1.02)`, with a dark gradient at the top and bottom of the panel so type stays readable.

## Story rules

1. **Open on the speaker's face with the biggest title of the reel.** About 1 s of their real voice at full level, then it ducks and the Mongolian voice starts with the boldest claim. Never open on b-roll, however good it is.
2. **Second beat: let the speaker say one short line in their own voice** (about 2 s), subtitled in Mongolian. It shows the footage is real.
3. **Middle beats: one voice line each, 6–12 s.** Each beat has two or three cuts, and each cut has its own two-line headline. Alternate speaker shots with b-roll, slides and charts from the same source.
4. **The narrator takes the beats over charts and b-roll** (context and numbers); the interpreter takes the beats on the speaker.
5. **One turn:** a riser and a hit into the main idea, about two thirds of the way in.
6. **Keep the speaker's own doubt** as a beat near the end ("it could go wrong, but…").
7. **End on a question to the viewer** and ask for comments.

Reference pacing (104 s): 13 beats, 11 voice lines of 5–11 s, 25 cuts averaging 4.2 s (2.1–9.1 s), 21 headlines. A 66 s version of the same story also exists (`plan-v1-66s.json`); the user asked for the longer one with more facts.

## Script and voice rules

- **Two voices, ElevenLabs `eleven_v4`, Mongolian:** `N` narrator Uyanga (third person: «Маскийн тооцоогоор…»), `G` Ganbold interpreting the speaker in first person. No voice clones of the speaker.
- **Lines are two or three short sentences.** Headlines are short on-screen summaries of the approved lines.
- **Stay faithful.** Keep the speaker's "I think" and "I expect"; forecasts stay forecasts; a number is attributed to whoever said it; leave out jokes that do not carry over. Write the choices down under "Faithfulness notes" in the reel's storyboard.
- **Mongolian copy:** no loanwords where a Mongolian word exists. Spell for pronunciation only in the TTS text (`tts` on the line) and map it back for captions with `captionMap`. List the words to check by ear in the storyboard.
- **The script is approved before any voice is generated,** and a chosen take is never overwritten (`--take N` writes an alternate next to it).

## Sound

| Stem | What it is | Level |
|---|---|---|
| `voice.wav` | Mongolian voiceover | each clip gained to -17.5 LUFS |
| `elon.wav` | the source's own sound | full for the first second, 16 dB down under the voiceover, back to 10 dB down after a line ends until the cut; archive bed at -24 dB |
| `music.wav` | synthesised score, 100 BPM | -30 LUFS; drops 6 dB under any speech (80 ms down, 400 ms up) |
| `sfx.wav` | whoosh on every cut, a tick on every headline, a hit at the start and at the turn, 1.2 s risers before the turn and the end card | peak -8 dB |

- The score is pads, a low drone, a bass pulse, an arpeggio, hats and bells, with an intensity preset per beat. The Elon reels are in D major ("wide and bright"); the Gates reel is in D minor with a red `danger` tone and a glitch sound for its warnings. Choose the key and the accent colour for the subject.
- A cut from a film that has its own music is set to `"mute": true`.
- Final mix: the four stems summed, limiter at -1.4 dBFS, AAC 320k.

## How it is built

`plan.json` is the single source of truth. A beat lasts `lead + pre + voice + post` (or `hold`), so the timeline follows the real voice lengths, and a beat's cuts share its time in proportion to `len`.

| Part of `plan.json` | Fields |
|---|---|
| `lines` | `id`, `voice` (`N` or `G`), `text`, optional `tts`, `take`, `captionMap` |
| `clips` | `file`, `start` and `end` (seconds in the original video), `shots`: `[seconds into the clip, framing kind, centre x]` for every camera cut |
| `beats` | `id`, `name`, `voice`, `lead`, `pre`, `post` or `hold`, `source` (`under`, `full`, `mute`, `bed`), optional `label`, `headline`, `subtitle`, `graphic`, and `cuts`: `clip`, `from`, `len`, optional `mute`, `headline` |

| Step | Command | Result |
|---|---|---|
| Voices | `npm run voice:<reel>` | `public/<reel>/vo/<id>.mp3` and `.json` (character timing for captions); fills in missing lines only |
| Timeline and stems | `npm run build:<reel>` | `src/<reel>/cues.json` and the four stems |
| Review frames | `npm run stills:<reel> [-- t1 t2 …]` | one still per beat and a contact sheet, or a strip across the given times |
| Final | `npm run render:<reel>` | `outputs/<reel>.mp4`: H.264 16 Mbit/s `yuv420p` BT.709, about 2 MB per second, so under 300 MB up to about 2:20 |

## Making a new reel in this style

1. Pick the source video and save its transcript to `outputs/transcripts/`.
2. Write the script (line ids, `N` or `G`) and the beat table, and show both for approval. Nothing is generated before that.
3. Download only the sections needed into `public/<reel>/src/` (`SSL_CERT_FILE=/etc/ssl/cert.pem uvx yt-dlp --js-runtimes node --download-sections …`).
4. Copy `src/abundance-reel/` and the four scripts (`abundance-reel-voice`, `-build`, `-stills`, `render-abundance-reel`) under the new name, add the four npm scripts, and register the composition in `src/Root.tsx`. Copy, do not share: the approved reels stay frozen.
5. Find the camera cuts inside each clip and list them in `shots`.
6. Change what is fixed in code for each reel:
   - `framing()` shot kinds in the composition, for this source's cameras and slides
   - the end card question and any list graphic (`NEEDS`)
   - `PRESET` (score intensity per beat id) and the beat ids for the turn and the end riser (`beatAt('S5')`, `beatAt('S9')`) in the build script
   - `credit` in `plan.json`, the `elon.wav` stem name and its Studio label if the speaker is someone else, the output path in the render script
7. Voices → build → stills, and review the contact sheet. Render the final only when asked.
8. Write `docs/<reel>/storyboard.md` (the cut, words to check by ear, faithfulness notes) and add the composition to the table in `CLAUDE.md`.

## Checks before delivery

- Stills: one per beat, plus strips across fast cuts (headline never clipped, captions never over a face, no English slide text left in frame).
- `ffprobe` specs, a full decode, stereo peaks and loudness of the mix.
- The user checks pronunciation and the mix by ear; the measurements do not replace that.

## Rights and posting

The footage belongs to third parties (Tesla, NYT, Brighter with Herbert). The credit line stays on screen, the user decides on posting and posts on their personal profile themselves, and these reels are never boosted as ads.
