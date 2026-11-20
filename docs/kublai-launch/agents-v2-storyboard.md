# KublAi agents segment v2: motion storyboard

v2 of `KublaiAgents`. It keeps the story, the Mongolian copy and the demo data from [agents-segment.md](agents-segment.md); only the staging and motion change.

**Composition:** `KublaiAgentsV2` · 70 s · 4,200 frames · 1920×1080 · **60 fps**
**Music grid:** 120 BPM, so 1 beat = 0.5 s = 30 frames and 1 bar = 2 s. Every scene boundary sits on a bar line.

## The thread

**One customer, one day, one agent.** Нараа's question arrives at 23:48, and the agent answers while the owner sleeps. Morning comes and she browses bags on Instagram, books a Saturday visit, and becomes a hot lead in the CRM. In parallel, Солонго's comment turns into a DM. Then the camera pulls back to show where it all runs: the KublAi app, where the owner tests the agent and fixes a wrong answer by just saying what's wrong.

Each scene's result physically carries into the next. A message flies into the phone, the phone flips from night to day, a chip flies into the calendar, a reply flies into a DM, data flies into the CRM, and the camera dives from the CRM into the app.

**One continuous camera.** Every scene is a set placed in one 3D world, and the camera travels between them. Transitions are real camera moves with parallax and motion blur, not cross-fades.

## Look

- **App UI stays 1:1** with the KublAi theme (Noto Sans, `#006afc`, white cards), so the product stays recognisable.
- **World:** night (deep navy, phone glow, a big dim clock) gives way at sunrise (12 s) to the light studio (`#f5f7fb`) with a perspective dot floor, soft blue orbs and drifting message chips at three depths. Near and far layers get depth-of-field blur.
- **Kinetic type:** Inter variable (OFL, full Mongolian Cyrillic, weight 100–900). Titles assemble letter by letter with weight and depth, sublines reveal word by word, and the giant scene numerals sit on a far plane for parallax. Titles leave by scattering, not fading.
- **Optics:** real motion blur (sub-frame samples) on fast camera moves and flying objects; DOF on near and far decor only, never on text being read.

## Scenes: options considered, then the chosen one

### 0 · Intro (0–4 s)
Options: (a) logo pop + title fade, as in v1; (b) **fly-through a tunnel of late-night customer messages, then "AI агент" assembles from scattered letters in depth**; (c) a typing caret writes the title; (d) a phone screen lights up in the dark.
**Chosen: b.** It sets up the night and the flood of questions. Under it, «таны борлуулалтыг хариуцана.» sets first with an empty slot, then a heavy blue "24/7" slams into the slot on the 2.0 s music hit (the line reads "24/7 таны борлуулалтыг хариуцана": handles your sales 24/7). Exit: the letters part and the camera flies through; one message rides along and becomes the first bubble in the phone.

### 1 · AI replies instantly (4–12 s)
Options: (a) phone + static stat card, as in v1; (b) **night set: phone glow, a far clock showing 23:48, a "2 сек" stat that stamps in on the beat**; (c) split screen of a sleeping owner and the chat; (d) a stopwatch race.
**Chosen: b.** Slow orbit around the phone while reading. Exit (match cut): the clock time-lapses from 23:48 to 09:00, sunrise sweeps the world, and the **phone flips 180°**. Its back face is the Instagram chat.

### 2 · Product carousel (12–20 s)
Options: (a) carousel slides in the phone, as in v1; (b) **three product cards burst out of the phone into a 3D fan, the camera orbits them, then they dock back as the carousel**; (c) a catalog shelf zooms in; (d) cards deal like playing cards.
**Chosen: b.** It shows that the catalog feeds the chat. Then a finger swipes and taps «Захиалах» on Мини цүнх. Exit: whip-pan right with motion blur.

### 3 · Appointment (20–28 s)
Options: (a) chips + side card, as in v1; (b) **a calendar wall builds in a tile wave behind the phone; the tapped 11:30 chip lifts out of the phone and flies into the 24th, unfolding into the event**; (c) a clock dial; (d) a drag-and-drop booking.
**Chosen: b.** Cause and effect in one gesture. Exit: tiles flip away in a wave as the camera tilts down.

### 4 · Comment → DM (28–36 s)
Options: (a) post + phone side by side, as in v1; (b) **top-down feed that scrolls fast with blur, eases on the KublAi Store post as the camera rises to eye level; the AI's public reply launches a message that flies on an arc into the DM**; (c) a notification storm; (d) split public/private halves.
**Chosen: b.** The arrow in the title draws itself. Exit: the post tips away and the camera trucks with the phone.

### 5 · Lead capture (36–46 s)
Options: (a) fields fill in place, as in v1; (b) **the CRM card assembles from pieces; the phone number and address lift out of the chat bubbles and fly into their fields; NEW LEAD stamps to HOT LEAD**; (c) a form builds like a receipt print; (d) a funnel diagram.
**Chosen: b.** The data visibly travels from the chat to the CRM. Exit: phone and CRM part, and the camera dives forward between them into the app.

### 6 · Test agent (46–54 s)
Options: (a) static app window, as in v1; (b) **the app window lands in 3D; the cursor types and sends; "What happened" slides in and a connector draws from the tool to the reply; toggles flip ON in sequence**; (c) a phone/app split view; (d) an X-ray of the agent's brain.
**Chosen: b.** It explains which tool ran, with a cursor that has a cause for every move. Continuous into scene 7 (same window).

### 7 · Fix with AI (54–64 s)
Options: (a) side panel, as in v1; (b) **the wrong answer glitches and the camera crash-zooms on it while the music drops out; the window splits into 2.5D layers; the fix types, the diff strike draws, «Хэрэглэх» hits on the music's re-entry and a pulse carries the update into the chat; the re-test stamps ✓**; (c) a rewind tape effect; (d) a code-diff screen.
**Chosen: b.** The emotional low and high of the piece. Exit: the camera pulls far back.

### 8 · Ending (64–70 s)
Options: (a) tagline + wordmark fade, as in v1; (b) **pull back as six capability tokens (bubble, product card, 11:30 chip, comment, HOT LEAD, ✓) orbit in and converge into the K mark; the tagline sets word by word; "Ai" drops into the wordmark**; (c) a montage replay; (d) all sets visible as a city.
**Chosen: b.** It recaps the whole day in one gesture. The final frame holds still and readable. `brand-voice-ending.mp3` plays over it.

## Sound

Original music and SFX, synthesised offline by `scripts/kublai-agents-v2-audio.mjs` from the same cue list the scenes use (`src/kublai-agents-v2/cues.json`), so audio and picture share one timeline.

- 0–4 night pad + riser · 4–12 sparse night pulse · **12 s sunrise drop** into the main groove (F–C–Dm–B♭) · 36 s arp variation · 46 s filtered "test mode" · 55.5 s dropout + error stab · build · **60 s re-entry when «Хэрэглэх» is pressed** · 64 s resolve, ducked under the brand voice.
- SFX tied to actions only: message pops, typing ticks, whooshes on camera moves, taps, chip/data flights, stamps, success chimes.

## Voiceover

Mongolian narration by ElevenLabs voice **"Uyanga - Kind Khalkha Friend"** (`2cecqSnkajrth9sJSoEH`, model `eleven_v4`). All four takes of each line are in the ElevenLabs flow "KublAi Agents v2 — Mongolian voiceover"; the chosen take per line is in `public/kublai-v2/vo/`. Clips, start cues and gains are listed under `voice` in `cues.json`. The visuals stay on the store example; the voice widens the message to hospitals and hotels.

| Line | Cue | Narration |
|---|---|---|
| 0 | 0:00.3 | Дэлгүүр, эмнэлэг, зочид буудал… Үйлчлүүлэгчид өдөр шөнөгүй бичсээр л байна. |
| 1 | 0:06.2 | Шөнийн арван нэгэн цаг. Таныг унтаж байхад Эй Ай агент хоёрхон секундэд хариулав. |
| 2 | 0:12.4 | Өглөө нь Нараа Инстаграмаар цүнх хайв. Агент каталогоос зураг, үнээр нь санал болголоо. |
| 3 | 0:20.5 | Дэлгүүрт ирэх цаг ч бай, эмнэлгийн үзлэг, буудлын өрөө ч бай — агент сул цагийг олж, хуанлид тань нэмнэ. |
| 4 | 0:28.7 | Олон нийтийн сүлжээнд коммент бичвэл агент хариулж, дэлгэрэнгүйг мессежээр илгээнэ. |
| 5 | 0:36.6 | Нараа захиалахад агент утас, хаягийг нь асууж, Си Ар Эм-д халуун лид болгон хадгаллаа. |
| 6 | 0:46.7 | Агентаа өөрийн бизнест тааруулаад, үйлчлүүлэгчид хүрэхээс өмнө тест горимд туршаад үзээрэй. |
| 7a | 0:55.8 | Хариулт буруу байна уу? Юу буруу байгааг л хэлэхэд агент зааврыг өөрөө засна. |
| 7b | 1:02.0 | Одоо зөв. |
| end | 1:05.0 | existing brand voice (`public/kublai/brand-voice-ending.mp3`) |

**Mix:** each line is gained to about -17.5 LUFS. The music ducks about 9 dB and the SFX about 4.4 dB under any voice clip, and the score is mastered to -18 LUFS. The narration leads the bed by 9–17 dB in the speech band (300–3,500 Hz). To swap a take, replace its file in `public/kublai-v2/vo/` (and adjust its `volume` if the loudness differs), then run `npm run audio:agents-v2`.

## Dialogue version (customer + agent)

Composition **`KublaiAgentsV2Dialogue`**: same visuals, two voices. A customer (a business owner) asks, and the agent answers in the first person. Customer: **Temuulen - Upbeat Ulaanbaatar Creator** (`ztVKSTjXnQBPBYroYARn`). Agent: **Uyanga** (`2cecqSnkajrth9sJSoEH`). All four takes of each line are in the ElevenLabs flow "KublAi Agents v2 — Dialogue voiceover (customer + agent)"; the chosen takes are in `public/kublai-v2/vo-dialogue/`, and the list (cues `dlg.*`, gains) is under `voiceDialogue` in `cues.json`.

| Cue | Who | Line |
|---|---|---|
| 0:00.4 | Customer | Сайн байна уу! Кублай гэж юу вэ, юу хийж чаддаг вэ? |
| 0:04.4 | Agent | Сайн байна уу! Би таны бизнесийн Эй Ай агент. Үйлчлүүлэгчдэд тань өдөр шөнөгүй, хэдхэн секундэд хариулна. |
| 0:12.25 | Customer | Бараагаа зураг, видеотой нь харуулж чадах уу? |
| 0:15.0 | Agent | Тийм ээ! Таны барааны жагсаалтаас зураг, видео, үнийг нь шууд илгээнэ. |
| 0:20.3 | Customer | Цаг захиалж чадах уу? |
| 0:22.1 | Agent | Мэдээж. Дэлгүүр, эмнэлэг, зочид буудал — сул цагийг санал болгоод, хуанлид тань шууд нэмнэ. |
| 0:29.8 | Customer | Фэйсбүүк дээрх комментод хариулах уу? |
| 0:32.35 | Agent | Коммент бүрд хариулаад, дэлгэрэнгүйг мессежээр илгээнэ. |
| 0:36.6 | Customer | Захиалагчдын мэдээллийг яах вэ? |
| 0:39.0 | Agent | Утас, хаягийг нь асууж, Си Ар Эм-д автоматаар хадгална. |
| 0:46.7 | Customer | Хэрэглэгчдэд хүрэхээс өмнө туршиж болох уу? |
| 0:49.35 | Agent | Болно. Тест горимд туршаад, ямар хэрэгсэл ажилласныг нь харна. |
| 0:55.6 | Customer | Буруу хариулбал яах вэ? |
| 0:58.15 | Agent | Юу буруу байгааг л хэлээрэй — би зааврыг өөрөө засна. |
| 1:02.05 | Customer | Гайхалтай! |
| 1:05.0 | — | existing brand voice ending |

The dialogue version has its own score stems (`public/kublai-v2/stems/dialogue/`, from `npm run audio:agents-v2:dialogue`), ducked under these clips. Render it with `npm run render:agents-v2:dialogue`, which writes `outputs/kublai-agents-v2-dialogue.mp4`. The visuals only show product photos, although the agent's line 2 mentions «видео».

## Build and render

- **Code:** `src/kublai-agents-v2/` (scenes in `scenes/`, camera path in `camera.ts`, cue sheet in `cues.json`). Preview it in Remotion Studio as `KublaiAgentsV2`.
- **Audio:** `npm run audio:agents-v2` (and `:dialogue`) rebuilds the score as three stems in `public/kublai-v2/stems/<version>/`: `music.wav`, `sfx.wav` and `whooshes.wav` (32-bit float, together -18 LUFS). In Studio they are separate tracks named Music, Sound effects and Whooshes (sound), so each can be muted on its own; voices are separate tracks too. Run it after changing any cue time, voice clip or whoosh.
- **Whooshes:** W01–W22 are listed under `whooshes` in `cues.json` with a name, cue and per-whoosh `level`; Studio shows them as named markers on the "Whooshes (markers)" track.
- **Final file:** `npm run render:agents-v2` writes `outputs/kublai-agents-v2.mp4` (about 4.5 min on a 16 GB Mac).
  - It produces 1920×1080, 60 fps, H.264 at 20 Mbit/s in `yuv420p` (BT.709), with AAC 320k audio. The file is about 170 MB, under the 300 MB limit.
  - The video renders muted and the audio is muxed with ffmpeg. Remotion's own AAC mux leaves the audio about 43 ms late, so don't use the Studio's Render button for the final file.
  - Rendering uses the GPU (`--gl=angle`) with concurrency 4; concurrency 8 runs out of memory with the motion-blur passes.

## Main risk, tested first

CSS 3D camera + sub-frame motion blur at 60 fps: text sharpness after 3D transforms, blur quality and render cost. Tested with a short probe before the full build.
