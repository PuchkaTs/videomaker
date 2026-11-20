# Abundance reel: storyboard v1 (script approved 2026-11-11)

«Ирээдүйд бүх зүйл үнэгүй болно»: Elon Musk at Tesla's TERAFAB event on a future without money.

## How it is built

Composition `AbundanceReel` (`src/abundance-reel/`), 1080×1920, 60 fps, 104 s (long cut). Built like `SpacexReel` (approved, left as it is), from copies of its scripts.
- `plan.json` is the single source of truth: voice lines, clip ranges with their camera shots, beats (cuts, headlines, graphics, subtitle).
- `npm run voice:abundance-reel` generates missing lines into `public/abundance-reel/vo/` (never overwrites; `-- G4 --take 2` for an alternate).
- `npm run build:abundance-reel` writes `cues.json` and the stems `voice.wav`, `elon.wav` (stage audio, ducked 16 dB under the Mongolian voice), `music.wav`, `sfx.wav`.
- `npm run stills:abundance-reel [-- 1.6 8.5]` renders review frames; `npm run render:abundance-reel` renders `outputs/abundance-reel.mp4`.
- New in this copy: a cut with `"mute": true` plays no source sound (the intro film has its own music), and a headline with `"big": true` is the three-line opening title.
- Clips: `public/abundance-reel/src/c01.mp4` (source 23:45–26:26, Elon on stage and the slides) and `c02.mp4` (0:00–1:30, the opening film used as b-roll). Fetched with `SSL_CERT_FILE=/etc/ssl/cert.pem uvx yt-dlp --js-runtimes node --download-sections …`.

Source: Tesla, "TERAFAB | The Largest Chip Manufacturing Facility Ever" (2026-04-06), https://www.youtube.com/watch?v=Txt3Wodav1o. Transcript: `outputs/transcripts/elon-musk-terafab-tesla-Txt3Wodav1o.txt`.

## Versions

- **Long cut (current `plan.json`), 104 s** → `outputs/abundance-reel-long.mp4`. Asked for on 2026-11-11 ("add more interesting info, 1:40–1:50"); five more lines approved the same day.
- **First cut, 66 s** → `outputs/abundance-reel.mp4`, plan kept as `src/abundance-reel/plan-v1-66s.json` (it had the three-item list N2, which the long cut drops).

Extra clips for the long cut: `c03` (8:00–9:16), `c04` (12:05–13:36), `c05` (15:50–16:51), `c06` (18:15–20:01).

## The cut (long)

The reel opens on Elon with the big title (the user's direction: b-roll does not work as a hook; the opening film is good b-roll for later beats).

| Beat | Picture (source) | Audio |
|---|---|---|
| S1 hook | Elon close-up 25:22 (about 1 s of his voice, then ducked), Elon standing 25:56, Saturn slide 25:35; big title «ИРЭЭДҮЙД / БҮХ ЗҮЙЛ / ҮНЭГҮЙ БОЛНО» | G1 |
| S2 | Saturn slide 25:38, his "It sounds nuts, but" at full level, subtitled «Галзуу юм шиг сонсогдож магадгүй» | source |
| S2b doubters | Elon on stage 8:03, close-up 8:34, on stage 9:11 | G6 |
| S3 | opening film 0:50 and 0:44, then Elon close-up 24:09 | G2 |
| S3b robots | Elon close-up 16:46, opening film 0:36 (Optimus, chips) | G7 |
| S3c 2% | Tesla's chip-supply bar chart 12:07 | N3 |
| S3d Terafab | Elon close-up 13:19, on stage 13:28 | G8 |
| S3e space | Elon close-up 18:54, "always sunny in space" picture 18:17, close-up 19:40 | G9 |
| S4 | opening film 0:15 (Mars ship, engines) | N1 |
| S5 | Elon close-up 23:53, abundance slide 24:36 | G3 |
| S7 | stage 24:58, Elon side close-up 25:06 | G4 |
| S8 | Elon standing 26:08 | G5 |
| S9 | end card «ТА САНЧИР ГАРАГ РУУ ЯВАХ УУ?» over the Saturn slide | score |

Voice lines are in `plan.json` (approved text). Uyanga narrates (N), Ganbold interprets Elon (G).

## Words to check by ear

«Санчир», «Иэн Бэнкс», «элбэг дэлбэг», «саяны нэг», «Терафаб», «хүн дүрст робот», «тэрбум», «чип».

## Faithfulness notes

- "Things will just be free", "there isn't money in the future" and "it'll probably go right" are Elon's opinions; the lines keep his "I think".
- G4 keeps his own caveat ("which is not to say it can't go wrong").
- N1 is his arithmetic (a millionth of the sun's energy is a million times Earth's economy), said about the moon mass driver; the line stays conditional.
- His joke about the film Idiocracy is left out.
- G7 (1–10 billion robots a year) and G9 (AI cheaper in space in two or three years) are his forecasts; the lines keep "I expect" and "I think".
- N3: the 2% is all of Earth's chip fabs measured against his own terawatt plan, so the line says «Маскийн төлөвлөгөөнд».
- G6: "over 500 landings" and the doubts about electric cars and reusable rockets are his words.
- The headlines are short on-screen summaries of the approved lines, added while building.
- Tesla's footage: the user decides on posting.
