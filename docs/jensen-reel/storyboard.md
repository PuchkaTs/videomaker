# Jensen Huang reel: storyboard v2 (script approved 2026-11-12; first render 2026-11-13)

A vertical reel in the interview reel style (`docs/interview-reel-style.md`), from Bloomberg's film about Nvidia's CEO. Status on 2026-11-13: script v2 and title 3 are approved. Voices are generated on the user's new ElevenLabs account with the two cloned voices the user gave: narrator **Mandukai** `UpomOl2r1953iSzRTZp3` (female), interpreter **Kublai** `LICDjZcDcyJwTAyvJ7mk` (male). Uyanga and Ganbold live in the old account and are not reachable from the new one. Real lengths: long cut 3:14, short cut 1:39. First renders: `outputs/jensen-reel.mp4` and `outputs/jensen-reel-90s.mp4`, awaiting the user's review.

Source: Bloomberg Originals, "The Rise and Reckoning of Jensen Huang | The Circuit with Emily Chang" (2026-11-12, 45:07), https://www.youtube.com/watch?v=JW5s9Md4U2U. Transcript: `outputs/transcripts/jensen-huang-circuit-bloomberg-JW5s9Md4U2U.txt` (and `.srt`).

## What changed from v1

- The hook names the spy scandal in the first sentence.
- More of Huang himself: five moments in his own voice (V1–V5) instead of three; the narrator's opening is one line shorter.
- No line over about 10 seconds; long lines are split so picture and headline change every 3–4 seconds.
- An open loop: N3 promises the letter, N13 and G5 pay it off.
- Jobs are in (N10, G3, G4), and the reel ends on his optimism (N15, G6), at the user's request.
- Out: the China line, the succession lines, "still don't know how to write a business plan".
- Two timeline tags on screen throughout: amber «10-р сар: оргил», red «11-р сар: хямрал».
- A 90-second cut from the same voice clips.

## The story

Bloomberg filmed Huang across Europe in October at the height of his power. Weeks later he admitted an affair with a woman US officials suspect of spying for China, and he is under investigation. The reel opens on the crisis, goes back to the man at his peak and what he believes, returns to the fall, and ends on his own optimism, said before any of it came out.

- **Length:** about 3:00 by estimate (about 2,210 characters of voice at 15 characters per second, plus 17 s of his own voice); the real length follows the voice clips.
- **Voices:** `N` narrator Mandukai (15 short lines), `G` Kublai interpreting Huang (6 lines), `V` Huang's own voice with Mongolian subtitles (5 moments).
- **Look:** amber accent for October; the red `danger` tone from the Gates reel for November. Score in D minor. Riser and hit into N11.
- **Composition:** `JensenReel`, `src/jensen-reel/`, `public/jensen-reel/`, output `outputs/jensen-reel.mp4`; the short cut is `JensenReelShort`, `outputs/jensen-reel-90s.mp4`.

## Title (3 chosen)

1. «ЖЕНСЕН ХУАН / ОРГИЛООС / ХЯМРАЛ РУУ» (recommended)
2. «NVIDIA-Г БАЙГУУЛСАН ХҮН / ШАЛГАЛТАД / ОРЛОО»
3. «ХИЙМЭЛ ОЮУН / ГАНЦ ХҮНЭЭС / ХАМААРЧ БОЛОХ УУ?»

## Script and cut (for approval)

Times are estimates. Source times are minutes:seconds in the Bloomberg film. "90" marks the lines in the 90-second cut.

| ID | Starts | 90 | Line | Picture (source) | Headline |
|---|---|---|---|---|---|
| N1 | 0:00 | ✓ | Хиймэл оюуны бараг бүх том компани энэ хүний чип дээр тогтдог. Одоо тэр тагнуулын дуулианы төвд байна. | Huang close-up (30:50), 1 s of his voice, then ducked; name tag | the big title |
| V1 | 0:07 | ✓ | "They don't depend on us, they choose us." → «Тэд биднээс хамаардаггүй. Тэд биднийг сонгодог.» | close-up 30:57 | none |
| N2 | 0:10 | ✓ | Bloomberg-ийн мэдээлснээр Хуан гэр бүлээс гадуурх харилцаатай байснаа хүлээн зөвшөөрсөн. Америкийн албаныхан тэр эмэгтэйг Хятадын тагнуул гэж сэжиглэж байна. | headline cards (0:00–0:20, 18:00), press crowd (1:00) | «АНУ-ЫН СЭЖИГ: / ХЯТАДЫН ТАГНУУЛ» (red) |
| N3 | 0:21 |  | Одоо түүнийг компани нь ч, Америкийн засгийн газар ч шалгаж байна. Тэр ажилтнууддаа захидал бичсэн. Юу гэж бичсэнийг төгсгөлд нь үзнэ. | board statement (1:30), Huang among cameras (16:15) | «ХОЁР ШАЛГАЛТ / ЭХЭЛСЭН» (red) |
| N4 | 0:30 | ✓ | Гэтэл хэдхэн долоо хоногийн өмнө бүх зүйл огт өөр байв. Дөрвөн өдөр, дөрвөн улс. Очсон газар бүрд нь хүмүүс түүнийг бүчиж авч байлаа. | Paris walk (0:45), the crowd with phones (3:11–3:37, 13:30) | «4 ӨДӨР, / 4 УЛС» |
| N5 | 0:39 |  | Тайваньд төрсөн. Америкт зоогийн газарт аяга угааж байсан. 1993 онд NVIDIA-г байгуулсан. | the illustrated life story and newspaper archive (6:45, 7:30–8:00) | «АЯГА УГААГЧААС / ҮҮСГЭН БАЙГУУЛАГЧ» |
| V2 | 0:45 |  | "For $200, I bought 15%. I think it was 20% of NVIDIA." → «200 доллараар NVIDIA-гийн 15... үгүй, 20 хувийг авсан.» | 8:00 | «$200-ААР / ЭХЭЛСЭН» |
| N6 | 0:49 |  | Тэр үед NVIDIA тоглоомын график чип хийдэг байв. Харин судлаачид тэр чипээр хиймэл оюун сургаж болохыг олж мэдэв. | archive, chip close-ups (8:06–8:26) | «ТОГЛООМЫН ЧИПЭЭС / ХИЙМЭЛ ОЮУН РУУ» |
| N7 | 0:57 | ✓ | Хуан бүхнээ үүнд дэнчин тавьсан. Өнөөдөр OpenAI, Google, Meta, Microsoft бүгдийн цөмд NVIDIA бий. | Huang on stage with other founders (8:45, 9:00) | «БҮГДИЙН ЦӨМД / NVIDIA» |
| V3 | 1:04 |  | "Mr. President." → «Ноён Ерөнхийлөгч өө.» | Huang taking a call (9:06) | none |
| N8 | 1:06 |  | Тэр төрийн тэргүүнүүдтэй шууд утсаар ярьдаг хүн болсон. | the White House table and Huang beside the president (9:45–10:15) | «ТӨРИЙН ТЭРГҮҮНҮҮД / ШУУД ЗАЛГАДАГ» |
| G1 | 1:10 | ✓ | Хиймэл оюун хүн төрөлхтнийг мөхөөнө гэж үү? Миний хариулт: бүх зүйл бидний хяналтад байгаа. Чадавхыг ахиулах, аюулгүй болгох хоёр бол нэг ажил. | Huang in the Paris press crowd (5:00–5:20) | «ХИЙМЭЛ ОЮУН / БИДНИЙ ХЯНАЛТАД» |
| N9 | 1:19 |  | OpenAI, Anthropic хоёр хиймэл оюун нь санаанд оромгүй үйлдэл хийснийг зарласан. Тэд үүнийг хашиж чадахгүй гэж байна гэж сэтгүүлч хэлэхэд: | the film's OpenAI and Anthropic graphics (20:00–20:25), Emily Chang (22:46) | «ХАШИЖ ЧАДАХГҮЙ / ГЭЖ ҮҮ?» |
| V4 | 1:29 |  | "No, that's just made up. Nonsense." → «Үгүй, энэ бол зохиомол яриа. Утгагүй.» | close-up 22:48 | none |
| G2 | 1:32 |  | Агентыг хашиж, хянаж болно. Чадахгүй бол турших ёсгүй, ашиглалтад оруулах ёсгүй. Хашихгүй, хянахгүй хөгжүүлэх нь маш өндөр эрсдэлтэй. | close-up 22:54, two-shot 23:15, close-up 23:30 | «ХЯНАЖ ЧАДАХГҮЙ БОЛ / ТУРШИЖ БОЛОХГҮЙ» |
| V5 | 1:41 |  | "It just sounds like that's already happening." / "Then you got to stop. It's really simple." → «Энэ аль хэдийн болж байгаа бололтой.» / «Тэгвэл зогсох хэрэгтэй. Маш энгийн.» | 23:45 | none |
| N10 | 1:46 | ✓ | Хиймэл оюун хүмүүсийг ажилгүй болгоно гэсэн айдас ч бий. Хуан үүнтэй санал нийлдэггүй. | the queue in Berlin (35:26), Emily Chang (36:30) | «АЖИЛГҮЙ / БОЛОХ УУ?» |
| G3 | 1:52 |  | Хиймэл оюун ажлын байр бий болгодог. Үүнийг барьж байгуулах хэрэгтэй учраас барилга, цахилгаан, шугам хоолойн ажил нэмэгдэж байна. | close-up 36:36–37:05 | «БАРИЛГА, ЦАХИЛГААН / АЖИЛ НЭМЭГДЭНЭ» |
| G4 | 2:01 | ✓ | Хүн бүрийн ажил өөрчлөгдөнө. Өөрчлөлтийг эсэргүүцээд тэр алга болохгүй. | close-up 37:25–37:35 | «ХҮН БҮРИЙН АЖИЛ / ӨӨРЧЛӨГДӨНӨ» |
| N11 | 2:06 | ✓ | Гэвч хүн бүртэй ярьдаг хүнд эрсдэл дагалддаг. | Huang walking through the crowd (17:55); riser and hit | «ХҮН БҮРТЭЙ ЯРЬДАГ ХҮНД / ЭРСДЭЛ ДАГАЛДДАГ» (red) |
| N12 | 2:10 |  | Тэр эмэгтэй NVIDIA-гийн чипийг Зүүн өмнөд Азид хамгийн их авдаг компаниудын нэгд ажилладаг. Америкийн албаныхан уг компанийг Хятад руу чип нууцаар гаргасан гэж сэжиглэдэг. | headline cards (18:00, 18:45) | «ЧИП НУУЦААР ГАРГАСАН / ГЭЖ СЭЖИГЛЭВ» (red) |
| N13 | 2:21 | ✓ | NVIDIA түүнийг огцруулах эсэхээ хэлэлцэж байгаа гэсэн мэдээлэл ч гарсан. Тэгээд тэр захидлаа бичсэн. | Nvidia's newsroom page "A Message to Our Company" (18:30) | «ОГЦРУУЛЖ МАГАДГҮЙ / ГЭСЭН МЭДЭЭЛЭЛ» (red) |
| G5 | 2:28 | ✓ | Би гэр бүлээсээ, та бүхнээс уучлал гуйх ёстой. Би эхнэртээ үнэнч байгаагүй. Миний хийсэн зүйлд ямар ч шалтаг байхгүй. | the page darkened, the quote as a card; tag «Ажилтнууддаа бичсэн захидлаас» | «"МИНИЙ ХИЙСЭНД / ШАЛТАГ БАЙХГҮЙ"» (red) |
| N14 | 2:36 |  | NVIDIA-гийн удирдах зөвлөл компанийн нууц алдагдсан гэх үндэслэл байхгүй гэж мэдэгдсэн. Хятад үүнийг гүтгэлэг гэж нэрлэсэн. | board statement (1:30), wide of the interview room | «ХЯТАД: / ЭНЭ БОЛ ГҮТГЭЛЭГ» |
| N15 | 2:45 | ✓ | Дуулиан гарахаас өмнө тэрээр ирээдүйн тухай ингэж хэлж байв. | two-shot of the interview (41:00) | none |
| G6 | 2:49 | ✓ | Эрсдэлийг би сайн мэднэ. Гэхдээ бидний бүтээх гайхалтай сайхан ирээдүйг харахгүй юм бол үүнийг юуны төлөө хийж байгаа юм бэ? | close-up 37:48–38:08; tag «Дуулианаас өмнө хэлсэн үг» | «САЙХАН ИРЭЭДҮЙГ / ХАРАХГҮЙ БОЛ ЯАХ ВЭ?» |
| END | 2:58 | ✓ | «ТА ТҮҮНТЭЙ / САНАЛ НИЙЛЖ БАЙНА УУ?» · «Сэтгэгдлээ үлдээгээрэй» · «Эх сурвалж: Bloomberg Originals · The Circuit» | end card over a darkened close-up | |

Every cut inside a beat gets its own two-line headline while building; they are summaries of the approved lines and are shown in the stills for review.

**90-second cut:** N1, V1, N2, N4, N7, G1, N10, G4, N11, N13, G5, N15, G6, END. About 1,190 characters of voice, about 1:32. It needs no extra voice lines.

TTS-only spellings (captions keep the Latin names): «Энвидиа», «Блүмбэрг», «Оупэн Эй Ай», «Антропик», «Гүүгл», «Мета», «Майкрософт», «мянга есөн зуун ерэн гурван онд».

## Words to check by ear

«Женсен Хуан», «Энвидиа», «Блүмбэрг», «Антропик», «гүтгэлэг», «дэнчин тавьсан», «хашиж», «удирдах зөвлөл», «огцруулах», «шугам хоолойн».

## Faithfulness and care notes

- **The interview was filmed in October, before the revelations.** Nothing he says is an answer to the scandal. The timeline tags and N15 say so.
- **Every scandal claim keeps its source:** "Bloomberg reports", "US officials suspect", "reports say". "Admitted" is the film's word for the affair; the spying and the chip smuggling are suspicions, and the lines and headlines say so.
- **The other side is in (N14):** the board's statement and China's denial. The board's statement also covers US national security; the line keeps "company secrets" for length.
- **The woman is not named and her face is not shown,** although the film does both. She is accused, not charged.
- **The claims are taken from the Bloomberg film only.** They were not checked against other reporting.
- N1: "тогтдог" stands for the film's "at the core of most major tech companies"; "тагнуулын дуулиан" for "targeted by a suspected Chinese spy".
- N13: a news voice in the film's opening says Nvidia is "preparing to oust" him; Bloomberg's own description says "contemplating his ouster". The line uses the weaker one.
- V2 and V3 are to be confirmed on the picture when cutting: that it is Huang speaking at 8:00, and what the 9:06 call shows. N8 says "heads of state" as the film does; the film does not say which president is on the phone.
- G1: at 5:00 a reporter raises "AI ends humanity"; "it is in our control" and "not in conflict, they are in fact one" are his. The line is framed as his answer.
- N9 and V4: the film's Emily Chang says "But they say they can't contain them", and he answers "No, that's just made up. Nonsense. … You can absolutely contain, you can absolutely monitor." Later he adds "I don't know all that they're saying"; G2 keeps to what he says should be done.
- G3 and G4: his answer on jobs is not a direct denial. Asked about a person who learned AI and still loses the job, he calls it a theoretical question and talks about the jobs being created. The lines carry what he said; N10 says only that he disagrees with the fear.
- G5 is his written memo as quoted in the film, voiced by the interpreter and tagged as a letter. «My actions hurt her and our children» is left out for length.
- Left out: China ("they're not our enemies"), succession, the money story ("circular financing"), sovereign AI, the White House summit.

## Build notes

- Clips to fetch at 1080p (about 10 minutes in all): 0:00–2:10, 3:05–3:40, 4:40–5:25, 6:40–10:20, 13:25–13:40, 16:10–16:25, 17:50–19:05, 20:00–20:30, 22:40–23:55, 30:45–31:05, 35:20–35:35, 36:25–38:10, 40:55–41:10.
- New in this copy: a `danger` tone next to `accent`, a quote card for the memo, two-line subtitles for an exchange, timeline tags that stay on screen, a second composition for the 90-second cut built from the same plan with a list of beat ids.
- 3 minutes at 16 Mbit/s would be about 365 MB, over the 300 MB limit. Render the long cut at 12 Mbit/s (about 275 MB); the 90-second cut at 16 Mbit/s.
- Voice cost: about 2,200 ElevenLabs credits for the first takes.
- Bloomberg's footage: the user decides on posting; never boosted.
