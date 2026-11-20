# Gates AI reel: storyboard v1 (script approved 2026-11-08; final render `outputs/gates-ai-reel.mp4` approved the same day)

## How it is built

Composition `GatesAiReel` (`src/gates-ai-reel/`), 1080×1920, 60 fps, about 1:39.
- `plan.json` is the single source of truth: voice lines, clip ranges with their camera shots, and the beats (cuts, headlines, graphics).
- `npm run voice:gates-ai-reel` generates missing voice lines (eleven_v4, with timestamps) into `public/gates-ai-reel/vo/`. It never overwrites; `-- G4 --take 2` writes an alternate `G4_take2.*`, chosen with `"take": "take2"` on the line.
- `npm run build:gates-ai-reel` lays the beats out from the real voice lengths into `cues.json` and writes the stems `voice.wav`, `gates.wav` (interview audio, ducked 16 dB under the Mongolian voice), `music.wav`, `sfx.wav` to `public/gates-ai-reel/stems/`. Re-run after any change to `plan.json` or a take.
- `npm run stills:gates-ai-reel [-- 12.5 30]` renders review frames; `npm run render:gates-ai-reel` renders `outputs/gates-ai-reel.mp4`.
- Clips were downloaded as sections only (`public/gates-ai-reel/src/c01–c08.mp4`, 1080p, original English audio).

Changes from the approved v1 while building:
- S2: the 1996 Letterman footage turned out to be in the source as a boxed inset; S2 now cuts 1996 inset → Gates today listening → 1996 wide, with the 1996 audio low under N1.
- S5 got three short headlines taken from its approved lines: «ХҮНИЙ ТАРХИ ХЯЗГААРТАЙ», «ХИЙМЭЛ ОЮУНД ХЯЗГААР БАЙХГҮЙ», «ХОВОР ӨВЧНИЙГ ЭМЧЭЭС Ч САЙН»; S8 shows «ХАМГИЙН АЮУЛТАЙ ЗҮЙЛ» while Gates speaks English.
- S4's code graphic tags the bug «АЛДАА»; S7 shows three icons (hazard, bank, lightning) on the words that name them.
- The dogs-and-cats line exists only in a wide shot, so S5d opens on the close-up just before it.

Source: *The Ezra Klein Show* (The New York Times), "Bill Gates: A.I. 'Makes Nuclear Weapons Look Like Nothing'",
https://www.youtube.com/watch?v=A_156w0aYtU (1:13:50, 1920×1080, 24 fps).
Timings come from YouTube's word-level auto-captions (about ±0.2 s); cut points get fine-tuned on the waveform after download.

Output: 1080×1920 reel, about 1:40. Mongolian kinetic headlines, word-by-word Mongolian captions, synth score.
Voices: **N** = narrator (Uyanga `2cecqSnkajrth9sJSoEH`), **G** = Gates's Mongolian interpreter (Ganbold `RbMF2tQ1nCK38TfvNGLk`).
Under each G line, Gates's own voice plays at full level for the first ~0.4 s and is then ducked about 16 dB under the Mongolian voice.

## Candidate parts found in the interview

| ID | Source | What Gates says (paraphrase) | Theme | Used |
|---|---|---|---|---|
| P1 | 22:32.1–22:34.0 | AI "makes nuclear weapons look like nothing" (the episode title) | danger | S1 hook |
| P2 | 02:37.4–02:50.3 | 1996, Letterman: making computers think is very hard, almost no progress, maybe never | then vs now | S2 |
| P3 | 04:39–05:22 | OpenAI's model got a perfect AP Biology score at his house: "shock number one" | smarter | not used (time) |
| P4 | 05:23.3–06:02.6 | Late last year coding models became as good as him; coding was his strongest talent, obsessed from 13 to 24 with being better than anyone; now superhuman at writing code and finding flaws | code | S3 |
| P5 | 13:00–13:43 | AI finds bugs humans overlooked for 20 years, in a few minutes; the hacking ability was "stunning" | code / danger | S4 (narrated) |
| P6 | 08:37.4–09:05 | Silicon intelligence has none of the brain's limits; reads every medical journal; superhuman at diagnosing rare diseases | smarter | S5 |
| P7 | 09:12.8–09:28.6 | If we lose control, we've evolved a species that will be to us as we are to dogs or cats | smarter / danger | S5 |
| P8 | 09:30.2–10:17.3 | Every AI lab says it won't be driven only by profit maximization; that only works if there's one company, and there are many | race | S6 |
| P9 | 11:32.1–11:49.8 | AI can already help a bioterrorist kill hundreds of millions, or run a cyberattack that scrambles bank accounts and shuts the power grid | danger | S7 |
| P10 | 15:35.2–15:38.6 | "the most dangerous thing that humans have ever gone near" | danger | S8 close |
| P11 | 17:15.9–17:21.4 | You can't rely on the industry to regulate itself | race | spare |
| P12 | 45:18.1–45:28.5 | It's like aliens really are here, except they were made in laboratories | smarter | spare (alt for P7) |

## The cut

| Shot | Time | Picture | Audio | On-screen headline |
|---|---|---|---|---|
| S1 | 0:00–0:04 | P1, punch-in on Gates | Gates (English, full), then G1 | ЦӨМИЙН ЗЭВСЭГ Ч ҮҮНИЙ ДЭРГЭД ЮУ Ч БИШ / — Билл Гейтс |
| S2 | 0:04–0:11 | P2 archival 1996 clip, "1996" stamp | N1 | 1996: «БАРАГ АХИЦ АЛГА» |
| S3 | 0:11–0:30 | P4 in three cuts: 05:29.6–05:32.8, 05:37.6–05:45.2, 05:55.3–06:02.6 | G2 | НАД ШИГ САЙН КОД БИЧДЭГ БОЛСОН → 13–24 НАС → ОДОО: ХҮНЭЭС ДАВСАН |
| S4 | 0:30–0:36 | Graphic: scrolling code, one line turns red, counter "20 жил → хэдхэн минут" | N2 | 20 ЖИЛ → ХЭДХЭН МИНУТ |
| S5 | 0:36–0:58 | N3a over Gates listening; P6 08:37.4–08:41.3; N3b; P7 09:12.8–09:26.0 | N3a, G3, N3b, G4 | БИД ТҮҮНИЙ ДЭРГЭД НОХОЙ, МУУР ШИГ |
| S6 | 0:58–1:14 | P8 in three cuts: 09:30.2–09:40.7, 09:51.7–09:56.0, 10:08.0–10:10.5 | G5 | АШГИЙН УРАЛДААН → ГАНЦ КОМПАНИ БАЙВАЛ Л → ГЭТЭЛ ТЭД ОЛОН |
| S7 | 1:14–1:31 | P9 in two cuts: 11:32.1–11:41.3, 11:42.2–11:49.8; icons (virus, bank, power line) | G6 | ӨНӨӨДӨР БОЛОМЖТОЙ |
| S8 | 1:31–1:40 | P10, then end card | Gates (English, full), then G7 | Та юу гэж бодож байна? / Эх сурвалж: The Ezra Klein Show, The New York Times |

## Voiceover script (Mongolian)

**G1** «Үүний дэргэд цөмийн зэвсэг юу ч биш.»

**N1** «1996 онд Билл Гейтс компьютерийг бодож сэтгэдэг болгох нь маш хэцүү, бараг ахиц алга гэж байлаа. Гучин жилийн дараа...»

**G2** «Өнгөрсөн оны сүүлээр хиймэл оюун над шиг сайн код бичдэг болсныг харлаа. Энэ бол миний хамгийн сайн чадвар. Арван гурваас хорин дөрвөн нас хүртлээ хэнээс ч илүү код бичихийг л зорьсон. Одоо тэд код бичих, алдаа олохдоо хүнээс давжээ.»

**N2** «Хүмүүсийн хорин жил анзаараагүй алдааг хиймэл оюун хэдхэн минутад олж байна.»

**N3a** «Хүний тархи, санах ой хязгаартай.»

**G3** «Харин цахиурт суурилсан оюун ухаанд ийм хязгаар байхгүй.»

**N3b** «Хиймэл оюун анагаахын бүх сэтгүүлийг уншиж, ховор өвчнийг эмчээс ч сайн оношилж байна.»

**G4** «Хэрэв хяналтаа алдвал бид шинэ төрөл зүйлийг бий болгоно. Бидний дэргэд нохой, муур ямар байдаг, түүний дэргэд бид тийм л байх болно.»

**G5** «Хиймэл оюуны компани бүр “бид зөвхөн ашгийн төлөө ажиллахгүй, аюултай шатанд хүрвэл ашгаасаа татгалзана” гэдэг. Харамсалтай нь энэ нь ганцхан компани байвал л ажиллана. Гэтэл олон компани уралдаж байна.»

**G6** «Хиймэл оюун нэгэнт заагийг давсан. Алан хядагчдад биологийн зэвсгээр хэдэн зуун сая хүнийг хөнөөхөд туслах чадвар өнөөдөр бий. Бүх банкны дансыг үймүүлж, цахилгааны сүлжээг зогсоох цахим халдлага ч өнөөдөр боломжтой.»

**G7** «Энэ бол хүн төрөлхтний урьд өмнө ойртож байсан хамгийн аюултай зүйл.»

**End card (text only)** «Та юу гэж бодож байна? Сэтгэгдлээ үлдээгээрэй.»

TTS-only spelling: N1 «Мянга есөн зуун ерэн зургаан онд». Everything else is read as written.

## Words to check by ear

- Loanwords kept because there is no common native word: «код», «компьютер», «компани». Alternatives if you prefer: «программ» (also borrowed), «пүүс».
- «алан хядагч» is used instead of «террорист»; «цахим халдлага» instead of «кибер халдлага».
- G4 is the hardest sentence to get natural. The meaning to keep: next to it, we will be what dogs and cats are next to us.

## Faithfulness notes

- Gates says the models became "as good as I am" and are now "superhuman" at code. The reel says exactly that; it does not claim he said "better than Bill Gates".
- He does not say AI is smarter than humans across the board. In the interview, AI is superhuman at code and at diagnosis, and could become far beyond us if we lose control. Ezra notes it is not yet superhuman at deciding what to do.
- P9 is about people misusing AI ("somebody with ill intent"), not AI acting on its own. G6 keeps that.
