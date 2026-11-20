# KublAi launch: agents segment

The first piece of the launch video to be built. It shows only what the agent **does**, never how to set it up.

**Composition:** `KublaiAgents` (scenes in the `KublaiAgents-Scenes` folder in Remotion Studio)
**Length:** 73 s · 2,190 frames · 1920×1080 · 30 fps
**Design source:** Figma file `Kublai` (`tMvsoe9dDwFiFJV0MT896I`):
- *Agents 04 · Test agent* frames (Playground section `629:1305`)
- *Inbox v2 / 01* (`879:735`)
- *Meta message atlas 04 · Entry points* (`357:6`) and *05 · Commerce & booking* (`357:7`)

**Look:** the app's light UI. Background `#f5f7fb`, white cards with `#e6e9ef` borders, brand blue `#006afc`, Noto Sans for Cyrillic. Each scene has a caption column on the left (number, Mongolian title, one supporting line) and the product on the right.

| # | Frames | Time | Scene | What the viewer sees |
|---|---|---|---|---|
| 0 | 0–90 | 0:00–0:03 | Intro | «AI агент», «Тохиргоо биш — үр дүн.» (Results, not setup) |
| 1 | 90–330 | 0:03–0:11 | AI reply | Messenger: a customer asks about delivery and the AI answers in seconds |
| 2 | 330–600 | 0:11–0:20 | Product carousel | Customer asks for a black bag; a product carousel slides in from the catalog |
| 3 | 600–870 | 0:20–0:29 | Appointment | Customer asks for Saturday; time chips appear, 11:30 is tapped, and a "visit confirmed" card follows |
| 4 | 870–1140 | 0:29–0:38 | Comment → DM | A Facebook post comment gets a public reply plus a private DM with the details |
| 5 | 1140–1440 | 0:38–0:48 | Lead capture | The AI asks for a phone number and address; the customer panel fills in, lifecycle goes New lead → Hot lead, "Saved to CRM" |
| 6 | 1440–1710 | 0:48–0:57 | Test agent | Test agent in TEST MODE; "What happened" explains which tool ran |
| 7 | 1710–2040 | 0:57–1:08 | Fix with the editor agent | The test reply is wrong; the owner tells the editor agent the right fact; an instruction diff is applied and the re-test is correct |
| 8 | 2040–2190 | 1:08–1:13 | Ending | Tagline, KublAi wordmark, `brand-voice-ending.mp3` |

**Captions (left column)**

1. **AI шууд хариулна** (the AI replies instantly) — Өдөр шөнөгүй, хэдхэн секундэд. (Day and night, within seconds.)
2. **Бүтээгдэхүүний карусель** (product carousel) — Каталогоос зураг, үнэтэй нь харуулна. (Shows products from the catalog with photos and prices.)
3. **Цаг захиалга** (appointments) — Сул цагийг санал болгож, баталгаажуулна. (Offers open times and confirms the booking.)
4. **Коммент → мессеж** (comment → message) — Коммент бүрд хариулж, дэлгэрэнгүйг мессежээр илгээнэ. (Replies to every comment and sends the details by message.)
5. **Лид цуглуулна** (collects leads) — Утас, хаягийг асууж CRM-д автоматаар хадгална. (Asks for phone and address and saves them to the CRM automatically.)
6. **Туршиж үзнэ** (test it) — Хэрэглэгчид хүрэхээс өмнө тест горимд шалгана. (Checks it in test mode before customers see it.)
7. **AI-аар засна** (fix it with AI) — Юу буруу байгааг хэлэхэд л зааврыг шинэчилнэ. (Say what's wrong and it updates the instructions.)

**Open points**
- **Scene 7 is a concept.** There's no editor-agent design in Figma or the app code yet, so I built it from the Test agent layout plus a side assistant panel. Confirm how the real feature looks, or design it in Figma first.
- **Demo data is made up:** the products, prices, names and the "KublAi Store" page. Swap in a real demo store before release.
- **No voiceover yet.** The captions carry the message. Music and VO come later.
