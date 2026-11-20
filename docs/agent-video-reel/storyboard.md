# Agent video reel: 12 test versions

Promotion reels for the new KublAi product: AI-made reels for real-estate (RE/MAX) agents.
1080×1920, 60 fps, Mongolian, about 28 s each.

**Offer: Black Friday хямдрал, 5 бичлэг = 500,000₮ (compare price 1,000,000₮, struck through), хязгаарлагдмал хугацаанд.**
On screen (hook and price card): a «BLACK FRIDAY ХЯМДРАЛ» badge and the struck 1,000,000₮, added 2026-11-19. The spoken lines do not mention Black Friday or the old price.

Each version = one of the 12 women saying only the offer (Wan 3 talking clip, 6–8 s),
then the same body in the KublAi motion style (`/kublai-motion`), with generated
real-estate images where needed. The 12 versions differ in the woman and in her offer line,
so the test shows which face and which hook works.

Status: offer lines voiced (Mandukai, whispered: `[whispers]` tag in the TTS text only) and
talking clips made with Wan 3.0 Prime on Higgsfield (woman's portrait as image reference, voice as
audio reference, 1080×1920, 30 fps). The clip carries the voice unchanged, starting 0.7–2.4 s in
(it is aligned to the end of the clip), so trim the silent lead in the edit. Lines: `src/agent-video-reel/offers.json`; voices:
`npm run voice:agent-video-reel` → `public/agent-video-reel/vo/`; clips: `public/agent-video-reel/talk/`.
Body approved 2026-11-19 and built: compositions `AgentVideoReelV01`–`V12` (`src/agent-video-reel/AgentVideoReel.tsx`),
`npm run build:agent-video-reel` (timeline, trimmed hook clips, sound), `stills:agent-video-reel -- V04`,
`render:agent-video-reel -- V04` → `outputs/agent-video-reel-V04.mp4`. Checked on stills only; not rendered yet.
The earlier A/B drafts («Би жинхэнэ хүн биш», «Зураг уу, бичлэг үү?») are dropped.

Portraits: `public/agent-video-reel/candidates/`, sheet `public/agent-video-reel/candidates-sheet.jpg`.

## Part 1: the offer, said by the woman (0–8 s)

Shot: her portrait as the first frame, waist-up, she looks into the camera and speaks;
slight natural head and hand movement, slow push-in. On screen from the first second,
big: **«5 бичлэг · 500,000₮»**, and a small tag «Хугацаатай урамшуулал».

Numbers are spelled out for speech; on screen they are digits.

| V | Woman | Hook type | She says |
|---|---|---|---|
| 01 | 01 Soul 2 | Direct call | «Агентууд аа, сайн мэдээ байна. Таван бичлэгийг ердөө таван зуун мянгаар хийж өгнө. Гэхдээ удаан биш шүү.» |
| 02 | 02 Soul Cinema | Price per piece | «Нэг бичлэг нь зуун мянга л гэсэн үг. Тавыг авбал таван зуун мянга. Удахгүй дуусна шүү.» |
| 03 | 03 Cinematic Studio 2.5 | Names the audience | «Ремаксын агентууд аа, энэ бол танд. Таван бичлэг таван зуун мянган төгрөг. Хямдрал удахгүй дуусна.» |
| 04 | 04 GPT Image 2.6 | Urgency first | «Хямдрал дуусах гэж байна. Агентын таван бичлэг таван зуун мянгахан төгрөг. Амжаад аваарай.» |
| 05 | 05 Nano Banana Pro | Number first | «Таван зуун мянга. Таван бичлэг. Зөвхөн агентуудад. Зөвхөн одоохондоо.» |
| 06 | 06 Nano Banana 2.1 | Benefit question | «Байраа хурдан зармаар байна уу? Тэгвэл таван бичлэг хийлгээрэй. Одоо таван зуун мянгахан.» |
| 07 | 07 Seedream 5.5 | No shooting needed | «Зураг авалт ч хэрэггүй, зураглаач ч хэрэггүй. Таван бэлэн бичлэг таван зуун мянга. Одоохондоо л ийм үнэтэй.» |
| 08 | 08 FLUX 3 | Personal, soft | «Танд нэг юм хэлэх үү? Агентын таван бичлэг одоо таван зуун мянга болчихсон байгаа. Удахгүй дуусна шүү.» |
| 09 | 09 Kling Image 4 | Shortest | «Агентууд аа! Таван бичлэг, таван зуун мянга. Одоо л амжина.» |
| 10 | 10 Grok Image 2 | A month of posts | «Бүтэн сар тавих таван бичлэг. Таван зуун мянгахан төгрөг. Хямдрал дуусахаас өмнө аваарай.» |
| 11 | 11 Ideogram 4.5 | Others already do it | «Бусад агент аль хэдийн бичлэгээр байраа зараад байна. Та ч эхлээрэй. Таван бичлэг таван зуун мянга, одоохондоо л.» |
| 12 | 12 Z-Image | Announcement | «Хямдрал эхэллээ! Агентуудад таван бичлэгийг таван зуун мянгаар хийж өгч байна. Удахгүй дуусна шүү.» |

## Part 2: the shared body, KublAi motion style (same in all 12, about 25 s)

Starts when her offer line ends (5–7.6 s, so each reel is 30–33 s). Voice over in Mandukai's
normal voice (not whispered), kinetic type and 2.5D cards, generated property images.
The AI model names (Soul, FLUX, …) never appear: on screen the women have Mongolian names only.

| # | Length | Picture | Voice | On screen |
|---|---|---|---|---|
| B1 | 5 s | Four property cards fly in one after another on a continuous camera move, each a generated photo that comes alive (slow parallax) with its label | «Орон сууц, хувийн сууц, оффис, үйлчилгээний талбай. Ямар ч үл хөдлөхөд тохирно.» | «Орон сууц» · «Хувийн сууц» · «Оффис» · «Үйлчилгээний талбай» |
| B2 | 3 s | The same cards; a tag on each flips between two states | «Зарах ч бай, түрээслүүлэх ч бай.» | Tag flips «Зарна» ↔ «Түрээслүүлнэ» |
| B3 | 6 s | Camera pulls back to a wall of 12 portrait tiles (3×4), each with a name plate; a cursor ring moves over them and one tile lifts forward: in each version it is that version's own woman | «Бичлэгээ хөтлөх хүнээ бэлэн арван хоёр хөтлөгчөөс сонгоно. Таалагдсанаа л заа.» | «12 хөтлөгч» · names under the tiles · «Сонгох» on the lifted tile |
| B4 | 5 s | Three step cards pass the camera; the last one is a finished reel with her in the corner and the agent's name and phone on it | «Та зураг, мэдээллээ илгээхэд л болно. Үлдсэнийг нь КублАй хийнэ.» | «1 Зураг, мэдээлэл илгээнэ» · «2 Хөтлөгчөө сонгоно» · «3 Бэлэн бичлэг» |
| B5 | 6 s | Price card slams in, then the KublAi logo | «Таван бичлэг, таван зуун мянган төгрөг. Сэтгэгдэлд "тав" гэж бичээрэй.» | **«5 бичлэг · 500,000₮»** · «Хугацаатай» · «Сэтгэгдэлд "5" гэж бичээрэй» |

TTS spelling: «КублАй» is written «Кублай» in the TTS text only.

### The 12 presenters (names shown on screen)

| V | Name | Portrait file |
|---|---|---|
| 01 | Анужин | 01-soul-2 |
| 02 | Номин | 02-soul-cinema |
| 03 | Мишээл | 03-cinematic-studio-2-5 |
| 04 | Хулан | 04-gpt-image-2-6 |
| 05 | Марал | 05-nano-banana-pro |
| 06 | Солонго | 06-nano-banana-2-1 |
| 07 | Энхжин | 07-seedream-5-5 |
| 08 | Сувд | 08-flux-3 |
| 09 | Оюу | 09-kling-image-4 |
| 10 | Намуун | 10-grok-image-2 |
| 11 | Дөлгөөн | 11-ideogram-4-5 |
| 12 | Янжин | 12-z-image |

The names are in `src/agent-video-reel/offers.json` (`name`). File names keep the model for our
own bookkeeping; nothing on screen or in the posts shows it.

### Images to generate for the body (after approval)

Four vertical photos, Ulaanbaatar look, no people, no text: a bright modern apartment living
room; a private house with a yard; an office floor with glass meeting rooms; a street-level
shop / service space. Optional fifth: a summer house plot, if «газар» is added to B1.

## To decide before building

1. **Body copy:** native check of B1–B5. «хөтлөгч» is used for the AI women, «хувийн сууц» for a house.
2. **Use cases in B1:** these four, or add «газар», «зуслан», «агуулах»?
3. **Deadline:** an end date on the price card, or just «Хугацаатай»?
4. **How to order:** comment «5», or phone / page message?
5. **Names:** the 12 names above, or your own list?
6. **RE/MAX:** named in words only (V03's line), no logo.
