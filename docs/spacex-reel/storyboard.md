# SpaceX reel: storyboard v1 (script approved 2026-11-09; opening cut the same day)

## How it is built

Composition `SpacexReel` (`src/spacex-reel/`), 1080×1920, 60 fps, about 1:41. Built like `GatesAiReel` (frozen), from copies of its scripts.
- `plan.json` is the single source of truth: voice lines, clip ranges with their camera shots, beats (cuts, headlines, graphics, subtitle).
- `npm run voice:spacex-reel` generates missing lines into `public/spacex-reel/vo/` (never overwrites; `-- G4 --take 2` for an alternate).
- `npm run build:spacex-reel` writes `cues.json` and the stems `voice.wav`, `elon.wav` (interview audio, ducked 16 dB under the Mongolian voice), `music.wav` (D major score), `sfx.wav`.
- `npm run stills:spacex-reel [-- 12.5 30]` renders review frames; `npm run render:spacex-reel` renders `outputs/spacex-reel.mp4`.
- Clips: `public/spacex-reel/src/c01–c14.mp4`, 1080p sections of the source (4K needs a JS runtime for yt-dlp).

Source: *Brighter with Herbert*, "JUST RECORDED: Elon Musk Announces SPACEX Plans" (2026-06-08), https://www.youtube.com/watch?v=D_1j5dVWNYI. Transcript: `outputs/transcripts/elon-musk-spacex-herbert-D_1j5dVWNYI.txt`.

## The cut

| Beat | Picture (source) | Audio |
|---|---|---|
| ~~S1, S2~~ | cut at the user's request after the first render: the reel now opens on Elon (N1 and G1 stay generated but unused) | |
| S3 open | Elon 4:58 (about 1 s of his voice, then ducked), 5:22 | G2 |
| S4 + S4b | Elon 7:30; then Elon laughing 7:45 with Herbert's "Which is the current situation" at full level, subtitled «Одоо яг тийм байгаа» | G3, then source |
| S5 three needs | Elon 8:31 + on-screen list landing on «ачаа / нарны / чип» | N2 |
| S6 | Elon 9:48 | G4 |
| S6b Starship | Starship launch, orbit, ocean landing b-roll (9:03–9:28) | G5 |
| S7 | SpaceX "Mass to orbit" chart (13:09) | N3 |
| S8 | AI satellite render (15:04), Elon 15:14, 19:05 | G6 |
| S9 | Elon 26:23–26:46; label «Амлалт биш, хамгийн сайн таамаг» | G7 |
| S10 | Elon 27:22, 27:41, then the moon animation | G8 |
| S10b | mass driver launch, music only | score swell |
| S11 | Elon 30:39, 30:48 | G9 |
| S12 | end card «ТА САР ЛУУ ЯВАХ УУ?» over the moon | score |

Voice lines are in `plan.json` (approved text). TTS-only spellings: «Сатурн таваас», «Старлинкаас», «хоёр мянга таван зуун»; captions show "Сатурн V-гээс", "Starlink-ээс", "2500".

## Words to check by ear

«их наяд» (trillion), «гигаватт», «тераватт», «чип», «Старлинк», «Сатурн тав».

## Faithfulness notes

- Elon calls the gigawatt-to-terawatt timeline "not a promise… our best guess"; the S9 label keeps that.
- "Pathetic" is Elon's word; "which is the current situation" is Herbert's, played in his own voice.
- The headlines are short on-screen summaries of the approved lines, added while building.
