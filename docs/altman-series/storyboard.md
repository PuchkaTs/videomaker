# Sam Altman series: «Never a Better Time to Do a Startup» in episodes

A series of vertical reels in the interview reel style (`docs/interview-reel-style.md`), one episode per reel, about 2 minutes each. Each episode shows its number on screen and ends by announcing the next one, so viewers wait for it.

Source: Y Combinator, "Sam Altman: Never a Better Time to Do a Startup" (Startup School 2026, 2026-07-28, 39:00), https://www.youtube.com/watch?v=ZIaOBAjvc38. Sam Altman with Garry Tan on stage. Transcript (YouTube automatic captions): `outputs/transcripts/sam-altman-yc-ZIaOBAjvc38.txt`; word times: `ZIaOBAjvc38.en-orig.json3`.

## Episodes (proposed 2026-11-15)

| # | Title | Hook | Source | Status |
|---|---|---|---|---|
| 1 | ГАРААНЫ БИЗНЕС ЭХЛҮҮЛЭХ ХАМГИЙН САЙН ҮЕ | 3 months of work in minutes; future trillionaires in the room | 0:29–2:00, 7:00–9:30, 31:07 | built, first render 2026-11-15 |
| 2 | ТУРШЛАГА БИШ, ХЭРЭГСЭЛ ЯЛНА | experience loses to fluency with the tools; four people plus agents | 9:25–11:43 | rendered 2026-11-17 (second render after the user's changes), awaiting review |
| 3 | БҮГД БИДНИЙГ СОЛИОТОЙ ГЭЖ БОДДОГ БАЙСАН | "the biggest secret in the world"; 50 believers, 45 at OpenAI | 12:03–15:30 | rendered 2026-11-18, awaiting review |
| 4 | ХҮНД ӨЧҮҮХЭН Ч ГЭСЭН ТУС БОЛ | a dinner favour at 22 led to his co-founder | 15:45–19:40, 23:10–23:55 | |
| 5 | ШООЛОХ АМАРХАН, БҮТЭЭХ ХЭЦҮҮ | the rant on online mockers | 20:45–22:46 | |
| 6 | ХИЙМЭЛ ОЮУН ХАШААНААСАА ГАРСАН ӨДӨР | the sandbox incident: "this is the real deal" | 24:00–26:56 | |
| 7 | ТАВ ТУХ БИЙ, ЭРХ ЧӨЛӨӨ ҮГҮЙ | the future he fears: comfort without freedom | 27:10–29:00, 36:05–37:45 | |
| 8 | ДАРААГИЙН 6 САР = ӨНГӨРСӨН 2 ЖИЛ | model progress compresses; token use | 30:47–31:10, 33:47–36:05 | |

Left out: the Paul Graham dinners and the message to his younger self; a possible ninth, closing episode.

The titles are Claude's Mongolian drafts; the user approved the list by asking for episode 1 and has not corrected the wording yet. Episode 2's title is already on episode 1's end card, so changing it means re-rendering episode 1.

## What makes it a series

- An amber badge «1-р анги» in the top-right corner of the footage panel for the whole reel (`part` in `plan.json`).
- The end card asks the question, then a card «2-р анги удахгүй · ТУРШЛАГА БИШ, ХЭРЭГСЭЛ ЯЛНА · Дагаад хүлээж байгаарай →» comes in while the narrator says it (`next` in `plan.json`, line N8).
- For the next episode: copy `src/altman-ep1/` and the four scripts to `altman-ep2`, change `part`, `next`, the end-card question in the composition, and download that episode's sections.

## Episode 1 (`AltmanEp1`, `src/altman-ep1/`, `outputs/altman-ep1.mp4`)

Script approved by the user on 2026-11-15 ("everything is okay", with the request to mark it as part 1). Real length 2:15.

- **Voices:** `N` Mandukai `UpomOl2r1953iSzRTZp3`, `G` Kublai `LICDjZcDcyJwTAyvJ7mk` (Altman in first person), `V` Altman's own voice with Mongolian subtitles.
- **Look:** amber accent, red for the "permanent underclass" turn (N6), score in D major, riser and hit into N6.

| ID | Line | Picture (source seconds) |
|---|---|---|
| N1 | OpenAI-г удирддаг Сэм Алтман залуу үүсгэн байгуулагчдад хэлэв: гарааны бизнес эхлүүлэх хамгийн сайн үе яг одоо. | Altman 31.45 (1 s of his voice), hall 9.0, Altman 444 |
| V1 | "Never a better time to do a startup than right now." → «Гарааны бизнес эхлүүлэхэд одоогийнх шиг сайн үе байгаагүй.» | 1867.15 |
| N2 | Тэр танхимд ирээдүйн триллионер сууж байна гэж мөрийцсөн. Яагаад гэдгийг нь сонсоорой. | hall 11.5, Altman 526.6 |
| N3 | 2005 онд Алтман Y Combinator-ын анхны элсэлтэд байв. Тэр үед гарааны бизнес огт нэр хүндтэй зүйл биш байлаа. | Garry Tan 45.6, Altman 52.4 |
| G1 | Бид Кембрижийн нэг жижигхэн байшинд нуугдаж суудаг байлаа. Пол Грэм бидэнд өөрөө оройн хоол хийж өгдөг байсан. | 60.2, 64.3 |
| G2 | Тэр үед компани бүрийн гурван сар зүтгэж бүтээснийг өнөөдөр код бичдэг хиймэл оюун хэдхэн минутад хийчихнэ. Ердөө хорин жилийн өмнө шүү дээ. | 72.0, 80.3 |
| N4 | Үүнийг сонсоод хоёр янзаар бодож болно гэж тэр хэлсэн. | 89.2 |
| G3 | Нэг бол «ганцхан даалгавар бүхэл бүтэн компани болчихлоо» гээд гунигла. Эсвэл «би дэлхийн хамгийн зоримог, галзуу компанийг эхлүүлж чадна» гэж бод. | 96.9, 101.5 |
| G4 | Салбар бүрийн мэргэжилтэн надтай хамт ажиллана. Өмнө нь боломжгүй байсан хэцүү технологийг ч бүтээж болно. | 115.0, 450.0 |
| N5 | Y Combinator-ын тэргүүн Гарри Таны хэлснээр хүнд технологийн компаниудын эзлэх хувь олон жил 5–10 хувь байсан бол одоо 25-д хүрч байна. | Garry Tan 422.3, 427.6 |
| G5 | Гурван сарын ажил дээр олон агент нэмбэл гайхалтай зүйл бүтнэ. Гарааны бизнесийн алтан үе ирнэ гэж би бодож байна. | 456.0, 465.3 |
| N6 | Гэвч залуусын дунд өөр яриа тарсан. Хиймэл оюуны том компанид орохгүй бол үүрд доод давхаргад үлдэнэ гэх. | stage 499.85, Altman 504.95 |
| V2 | "It's so dumb." / "That's not true." → «Ямар тэнэг яриа вэ.» / «Энэ бол худлаа.» | 508.2, 516.9 |
| G6 | Хэрэв тэр үнэн байсан бол дэлхий маш муу газар болох байсан. | 517.9 |
| V3 | "I bet there's some future trillionaires sitting in this room." → «Энэ танхимд ирээдүйн триллионерууд сууж байгаа гэж мөрийцье.» | 530.15 |
| G7 | Өнөөдөр байгуулагдсан компаниуд өмнөх үеийнхээс хавьгүй үнэ цэнтэй, хавьгүй нөлөөтэй болно гэж би мөрийцнө. | 533.0, stage 535.85, 541.1 |
| N7 | Хиймэл оюун бүхнийг залгина гэсэн айдас нэг хэсэг ноёлж байсан. Одоо байдал эргэсэн гэж тэр ажиглажээ. | 544.0, 556.0 |
| G8 | Өмнө нь «бүх зүйл дууслаа» гэдэг байсан. Одоо «за, хийцгээе» гэдэг болсон. | 562.9 |
| G9 | Үүнийг жил бүр дахин хэлж чадна гэж найдаж байна. Гэхдээ түүхийн яг энэ агшны хувьд бол эргэлзээгүй үнэн. | 1869.75, 1861.0 |
| N8 | Хоёрдугаар ангид: туршлага биш, хэрэгсэл ялна. Дагаад хүлээж байгаарай. | end card |

### Changed after approval (the user was away; tell them)

- **V1** is "Never a better time to do a startup than right now" (31:07) instead of "the best time in the world to do a startup" (0:28): the camera is on Garry Tan during the first one.
- **G9** became the sentences that follow V1 in the talk, so the reel does not say the same thing twice.
- **V2** gained "it's so dumb" before "That's not true".
- **N8** is new: the announcement of episode 2.

### Camera shots in the source (seconds in the original video)

`c01` (5–122): hall wide 7.1–20.4 · Altman 20.4–23.7 · Garry Tan with name strap 23.7–30.3 · Altman with name strap 30.3–35.9 (framed at zoom 1.38 to crop the strap) · Garry Tan 35.9–45.5 · stage wide 45.5–49.4 · Garry Tan 49.4–52.3 · Altman 52.3–108.6 · stage wide 108.6–114.9 · Altman 114.9–122.
`c02` (414–574), cameras from the other side: Altman 414–419.1 · stage wide 419.1–422.1 · Garry Tan 422.1–438.9 · Altman 438.9–474.2 · wide 474.2–482.6 · Garry Tan 482.6–499.7 · wide 499.7–504.9 · Altman 504.9–535.7 · wide 535.7–541.0 · Altman 541.0–572.8.
`c03` (1856–1884): Altman 1856–1875.5 · stage wide 1875.5–1882.2 · Altman 1882.2–.

Altman is at about x 1100–1220 in `c01` and `c03` and about x 700 in `c02`; in the wide shots the two chairs are too far apart for the 4:5 panel, so a wide cut is framed on one person (x 520–560).

### Faithfulness notes

- G2 says «хэдхэн минутад»: he says 7 minutes here and other figures later.
- The trillionaires line stays a bet in N2 and V3.
- N5's figures are Garry Tan's and are attributed to him ("5 or 10% for many years… now 15, 20, 25%"; the line uses the top figure).
- G6 keeps only "if that were true, the world would be a very bad place"; the captions are garbled there.
- G3's "a Codex prompt is a whole startup" is rendered as «ганцхан даалгавар».

### Words to check by ear

«Оупэн Эй Айг» (N1), «Уай Комбинаторын» (N3, N5), «Пол Грэм», «Кембрижийн» (G1), «Гарри Таны» (N5), «триллионер» (N2), «агент» (G5), «мөрийцнө» (G7). Retake: `npm run voice:altman-ep1 -- <ID> --take 2`, set `"take": "take2"` on the line, then `npm run build:altman-ep1`.

### Rights

Y Combinator's footage; the credit stays on screen and the user decides on posting.

## Episode 2 (`AltmanEp2`, `src/altman-ep2/`, `outputs/altman-ep2.mp4`)

Copied from episode 1 (which stays as it is). **Script approved by the user on 2026-11-17 ("Approved, generate"); voices generated the same day; real length 1:50 (109.7 s). Rendered at the user's request on 2026-11-17: `outputs/altman-ep2.mp4`, 214 MB, awaiting review.** New in code: the end card's question comes from `question` in `plan.json` instead of being fixed in the composition, and the render script lowers the video bitrate for a cut longer than about 2:11 to stay under 300 MB.

- **Source:** one section, `c01` = 565–706 s of the talk (`public/altman-ep2/src/c01.mp4`).
- **Voices, look, score:** as episode 1 (Mandukai `N`, Kublai `G`, amber, D major). The turn is N4 (riser and hit), a positive turn this time, so it stays amber.
- **End card:** «ТУРШЛАГА УУ, ХЭРЭГСЭЛ ҮҮ?», then «3-р анги удахгүй · БҮГД БИДНИЙГ СОЛИОТОЙ ГЭЖ БОДДОГ БАЙСАН». The user chose this wording on 2026-11-17 over the first draft «БИДНИЙГ БҮГД ТЭНЭГ ГЭЖ ДУУДСАН» («…гэж дуудсан» copied the English "calling us"); it is now episode 3's title.
- **Lower third** (added at the user's request, 2026-11-17, in place of episode 1's top-left name tag): over the hook, 0.45–8.15 s, just above the captions: «Сэм Алтман» and a role line that changes every 2.6 s: «ChatGPT-г бүтээсэн OpenAI-ийн үүсгэн байгуулагч» → «OpenAI-ийн гүйцэтгэх захирал» → «Y Combinator-ын ерөнхийлөгч асан» (he led YC 2014–2019). Set by `lowerThird` on the N1 beat in `plan.json`; Garry Tan keeps the small top-left name tag in N2.

| ID | Line | Picture (source seconds) |
|---|---|---|
| N1 | Олон жилийн туршлагатай хүмүүсийг хиймэл оюуныг чөлөөтэй эзэмшсэн хүмүүс давж гарна гэж Сэм Алтман мөрийцөж байна. | Altman 609.8 (1 s of his voice), wide 681.6, Altman 653.8 |
| V1 | "This moment feels very big (for those things)." → «Энэ мөч маш том санагдаж байна.» | 641.05 |
| N2 | Y Combinator-ын тэргүүн Гарри Тан завсарлагаанаар сонссон нэг асуултыг дамжуулав: докторын зэрэг хамгаалах хэрэгтэй юу? Цол зэрэг хэр чухал вэ? | Garry Tan 573.0, 578.2 |
| G1 | Ерөнхийд нь хэлэхэд, гарааны компаниуд технологи маш хурдан өөрчлөгдөж байх үед ялдаг. Зардал буурч, бүтээж турших хугацаа богино байх үед. Яг одоо энэ бүгд болж байна. | 590.4, 598.4, 604.9 |
| N3 | Алтман түүхээс жишээ татав: 1990-ээд оны сүүлчийн интернэтийн өсөлт, Фэйсбүүк дээрх програмууд, iPhone-ы програмын дэлгүүр нээгдсэн үе. | 613.2, 621.0, 624.9 |
| G2 | Агуу гарааны компаниуд тогтолцоо өөрчлөгдөх үед бөөнөөрөө гарч ирдэг. Тэр үед зах зээлд ноёлж байсан том компаниуд давуу талаа ихээхэн алддаг. | 629.4, 634.9 |
| G3 | Бас нэг зүйл бий. Өмнө нь мэргэшил олж авах, тодорхой ажлыг хийж чадах шилдэг хүмүүсийг ажилд авах нь хэцүү байсан. Одоо энэ эрс өөрчлөгдсөн. | 644.4, 650.0, 657.9 |
| N4 | Сүүлийн хэдэн сард Алтман шинэ төрлийн үүсгэн байгуулагчдыг олноор харжээ. Хиймэл оюуныг ашиглаж өссөн хүмүүс. | 660.4, 664.8 (turn) |
| G4 | Тэд «бүхэл бүтэн компанийн ажлыг агентуудаар хийлгэнэ» гэж ярьдаг. | 668.84, running straight into V3 |
| V3 | "four of us, four people" → «Бид дөрөв. Дөрөвхөн хүн.» | 673.35 |
| G5 | Дээр нь асар их тооцоолох хүчин чадал. Цаашид ийм компани улам олон гарна гэж би бодож байна. | 674.95, 616.7 |
| G6 | Мэдээж мэдрэмж, санаачлага, бизнес хэрхэн ажилладгийг ойлгох нь чухал хэвээр. Жинхэнэ давуу тал хуурамчаас юугаараа ялгаатайг мэдэх хэрэгтэй. | 679.6, wide 684.6, wide 688.7 (zoomed) |
| G7 | Гэхдээ би мөрийцье: энэ өөрчлөлт олон жилийн туршлагатай хүмүүст биш… | 694.71, running straight into V2 |
| V2 | "…in favor of people who have a lot of fluency with the tools." → «…хэрэгслээ чөлөөтэй эзэмшсэн хүмүүст ашигтай.» | 699.95 |
| N8 | Гуравдугаар ангид: бүгд биднийг солиотой гэж боддог байсан. Дагаад хүлээж байгаарай. (take 2) | end card, still at 601.1 |

### Camera shots in `c01` (seconds in the original video)

Altman 565–572.81 · Garry Tan 572.81–586.75 · Altman 586.75–681.48 · stage wide 681.48–694.6 · Altman 694.6–706. Altman's centre is about x 680 in the close shots and about x 330 in the wide one (framed at x 400, zoom 1.15, or x 330, zoom 1.4); Garry Tan about x 1100. 565–568 overlaps the end of episode 1's footage, so it is not used.

### Timing that depends on the voice lengths

G4 starts at 673.35 minus its beat length (4.51 s) so its footage runs straight into V3; G7 starts at 699.95 minus its beat length (5.24 s, with `pre` 0.15 and `post` 0.05 so it stays inside the close shot that begins at 694.6) and runs straight into V2. After a retake of G4 or G7, recompute that `from`. The END still at 601.1 repeats G1's footage under the dark card, as episode 1's END did (no free close shot is 8.6 s long); it must end before 609.8, where the opening shot starts.

### Takes (2026-11-17)

N1 7.20 s · N2 9.60 · G1 11.20 · N3 9.84 · G2 8.96 · G3 9.76 · N4 7.36 · G4 4.16 · G5 6.16 · G6 9.52 · G7 5.04 · N8 take 2 5.60 (the new title; take 1, 5.12 s, says the old one). Retake: `npm run voice:altman-ep2 -- <ID> --take 2`, set `"take": "take2"` on the line, then `npm run build:altman-ep2`.

### Changes after the first render (2026-11-17, at the user's request)

- The opening shot was 586.85 s, where Altman holds his mouth open on a long "I…" for about 2 s; it is now 609.8 s, facing the camera, talking and gesturing. N3's first two cuts and G5's second cut moved to make room.
- The episode 3 title and N8 changed (see the end card above). Duration 1:50 (110.15 s). Re-rendered at the user's request the same evening; `outputs/altman-ep2.mp4` is this version.

### Render check (2026-11-17)

Second render (the current file): 1080×1920, 60 fps, H.264 High `yuv420p` BT.709, 15.2 Mbit/s; AAC 48 kHz stereo 300 kbit/s; 110.15 s; 214 MB. Full decode clean. Mix -17.6 LUFS integrated, sample peaks -1.35 / -1.40 dBFS (L/R). Altman's voice lines up with the source clip within 2 ms at the opening and in V2 (cross-correlation). Frames from the MP4 show the talking opening shot, the lower third and the new episode 3 card. Measured, not listened to. (First render: 109.67 s, -17.7 LUFS, same specs.)

### Faithfulness notes

- N1 keeps the bet («мөрийцөж байна»); "the tools" is said as «хиймэл оюуныг» because the talk is about AI tools. G7 and V2 keep his own wording.
- N2: the question came from an attendee at a break and Garry Tan relayed it ("should I go get my PhD? How important are credentials?").
- V1's subtitle drops "for those things".
- N3: he said "99, 98, 99" for the internet boom; no years are added for Facebook apps or the App Store.
- G2: "incumbents" → «зах зээлд ноёлж байсан том компаниуд».
- G4, V3, G5: he is speaking as those founders ("I can kind of automate an entire startup of agents and four of us, four people, and all this compute"). The words come from YouTube's automatic captions; confirm "four of us, four people" by ear.
- G6: "taste" → «мэдрэмж» (judgement), "the physics of business" → «бизнес хэрхэн ажилладгийг», "a good moat versus a fake one" → «жинхэнэ давуу тал хуурамчаас юугаараа ялгаатай»; "network effect" is left out.
- G7 and V2 are one sentence of his split in two: the first half in Mongolian, the second half in his own voice with a subtitle.

### Words to check by ear

«Уай Комбинаторын», «Гарри Тан» (N2), «Фэйсбүүк», «Ай Фоуны» (N3), «агентуудаар» (G4), «мөрийцье» and the unfinished «биш…» at the end of G7, «Дөрөвхөн» (V3 subtitle only).

## Episode 3 (`AltmanEp3`, `src/altman-ep3/`, `outputs/altman-ep3.mp4`)

Copied from episode 2 (which stays as it is), same look, lower third, badge and end card. **Script drafted 2026-11-18, rewritten the same day in more natural Mongolian at the user's request, approved ("Approved, generate") and voiced: 1,675 characters, real length 2:06 (125.9 s). Rendered at the user's request on 2026-11-18: `outputs/altman-ep3.mp4`, 250 MB, awaiting review.**

Render check: 1080×1920, 60 fps, H.264 High `yuv420p` BT.709, 15.6 Mbit/s; AAC 48 kHz stereo; 125.92 s. Full decode clean. Mix -17.5 LUFS integrated, sample peaks -1.37 / -1.36 dBFS (L/R). Altman's voice in V3 lines up with the source within 2 ms (cross-correlation). Frames from the MP4 match the stills. Measured, not listened to.

Takes: N1 8.32 s · N2 10.56 · G1 12.40 · G2 11.76 · N3 7.12 · G3 7.92 · G4 7.92 · N4 7.12 · G5 12.56 · G6 8.96 · N8 5.04 · G7 10.48. G6 is timed to end exactly at V3 (Garry 899.5 for 4.81 s, then Altman 904.4 for 4.45 s); after a G6 retake, re-split those two lengths so the Altman cut still ends at 908.85.

- **Source:** `c01` = 700–935 s of the talk (`public/altman-ep3/src/c01.mp4`).
- **End card:** «ТАНД ХҮН ИТГЭДЭГГҮЙ САНАА БИЙ ЮУ?», then «4-р анги удахгүй · ХҮНД ӨЧҮҮХЭН Ч ГЭСЭН ТУС БОЛ».
- **Turn:** N3 (riser and hit). G1 is the critics' words, over the red quote graphic.

| ID | Line | Picture (source seconds) |
|---|---|---|
| N1 | OpenAI-г байгуулахад хүн бүхэн тэднийг солиотой гэж боддог байлаа. Харин Сэм Алтман тэр үеэ хамгийн том бэлэг байсан гэж ярьдаг. | Altman 835.0 (1 s of his voice), wide 736.4, Altman 756.8 |
| V1 | "we knew the biggest secret in the world. Everybody was calling us an idiot." → «Бид дэлхийн хамгийн том нууцыг мэдэж байгаа юм шиг санагддаг байсан. Гэтэл бүгд биднийг тэнэг гэдэг байлаа.» | 791.9 |
| N2 | Гарри Тан сануулахад, OpenAI анх Y Combinator-ын дэргэдэх судалгааны төсөл байжээ. Хүн шиг сэтгэдэг хиймэл оюун бүтээнэ гэдэг тэр үед галзуу санаа байлаа. | Garry Tan 708.0, 713.0 |
| G1 | Арван жилийн өмнө бүгд биднийг шүүмжилдэг байсан: «Хүн шиг сэтгэдэг хиймэл оюун бүтээнэ гэдэг нь худлаа. Тэр битгий хэл, тэд хиймэл оюуны салбарыг дахиад унагана. Буруу, хариуцлагагүй хүмүүс.» (quote graphic, red) | 739.4, 745.3, 751.0 |
| G2 | Та бүхэнд өгөх хамгийн чухал зөвлөгөө минь: олон нийт буруу байна гэдэгт үндэслэлтэй итгэж чадах зүйлээ ол. Тэгээд удаан хүлээх, хүмүүс тоохгүй байхад тэсвэртэй байхад бэлэн бай. | 767.9, 776.5 |
| N3 | Тэр үе их бухимдалтай байсан. Гэхдээ эргээд харахад энэ нь жинхэнэ бэлэг байсан гэж Алтман хэлж байна. (turn) | 803.5, 808.0 |
| G3 | Яагаад гэвэл бидэнтэй өрсөлдөх том компани байгаагүй. Судалгаагаа хийж, юмаа бүтээж, компаниа босгох цаг бидэнд байсан. | 811.2, 815.2 |
| G4 | Хэрэв би та нарын оронд байсан бол хэдэн жилийн өмнө боломжгүй байсан, харин одоо боломжтой болсон шинэ том зүйлийг хайх байсан. | 846.6, 851.0 |
| N4 | OpenAI-н хувьд тэр нь гүн сургалт гэнэт ажиллаж эхэлсэн мөч байв. Гэвч дэлхий үүнийг төдийлөн анзаарсангүй. | 855.4, 859.0 |
| G5 | Пол Грэмийн хэлдгээр, хүмүүс маш хурдан өсөж буй зүйлийг мэдэрч чаддаггүй. Яг одоо ийм зүйлс шинээр гарч ирж байна. Тэдгээрийг олоод итгэлээ алдахгүй бол бусад нь ойлгохгүй байгаад баярла. | 863.0, 870.5, 876.0 |
| V2 | "This is like a huge superpower." → «Энэ бол асар том давуу тал шүү.» | 881.8 |
| G6 | Бид хошигнодог байсан: хүн шиг сэтгэдэг хиймэл оюун бүтнэ гэж дэлхий дээр ердөө тавин хүн л итгэдэг. Гэхдээ санаа зовох хэрэггүй, | Garry Tan 900.6, Altman 904.4, running into V3 |
| V3 | "…45 of them worked at OpenAI." → «…тэдний 45 нь OpenAI-д ажилладаг байсан.» | 908.85 |
| G7 | Танд олон хүн хэрэггүй. Юунд итгэдгээ ол, удаан хугацаанд хүмүүс ойлгохгүй байхаас бүү ай. Тэгээд тэр санаанд итгэдэг, жаахан өөр хүмүүсээ эргэн тойрондоо цуглуул. | 914.2, 924.8 |
| N8 | Дөрөвдүгээр ангид: хүнд өчүүхэн ч гэсэн тус бол. Дагаад хүлээж байгаарай. | end card, still at 782.4 |

### Camera shots in `c01`

Altman, left camera 700–707.74 and 739.27–761.89 (x 680–700) · Garry Tan 707.74–734.2 (x 1100) · stage wide 734.2–739.27 (Altman at x 400, zoom 1.15) · reverse wide 761.89–767.77 (unused) · Altman, right camera 767.77–885.82 and 904.37–935 (x 1200–1230) · Garry Tan, other camera 885.82–904.37 (x 700). 700–702.4 is the end of episode 2's V2, so it is not used.

### Faithfulness notes

- AGI is «хүн шиг сэтгэдэг хиймэл оюун» (a plain description) rather than the term «хиймэл ерөнхий оюун».
- N1 uses «солиотой» to match the episode title the user chose; his own word, "idiot", is in V1's subtitle («тэнэг»).
- N2: Garry Tan said OpenAI "started as YC Research" and called it "kind of a crazy idea".
- G1: "cause another AI winter" → «хиймэл оюуны салбарыг дахиад унагана», since «өвөл» would not read as a term; "not only… but" → «Тэр битгий хэл».
- G2: "conventional wisdom is just wrong" → «олон нийт андуурч байна»; "frustratingly wrong and dismissive" → «үл тоомсорлол».
- N3 and G3 merge "it was very frustrating… but looking back it was an incredible gift because we didn't have massive competitors and had time to do our research".
- Left out: other companies doing what experts call a bad idea; starting the same startup as everyone (hype, money, rarely big outcomes); Garry Tan's question about finding believers.
- G5: "intuit exponentials" → «огцом хурдсах өсөлтийг мэдэрч», attributed to Paul Graham as he does ("another great PG-ism").
- G6 and V3 split his joke: the set-up in Mongolian, the punchline ("45 of them worked at OpenAI") in his own voice.
- G7: "crew of misfits" → «бусдаас өөр хүмүүс».

### Words to check by ear

«Оупэн Эй Ай» (N1, N2, N4), «Уай Комбинаторын» (N2), «хүн шиг сэтгэдэг хиймэл оюун» (N2, G1, G6), «унагана» (G1), «Пол Грэмийн» (G5), «тавин» and the unfinished «Гэхдээ санаа зовох хэрэггүй,» at the end of G6.
