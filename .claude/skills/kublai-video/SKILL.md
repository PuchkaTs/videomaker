---
name: kublai-video
description: Make or revise a KublAi product video in the VideoMaker repo in the established motion style (continuous 3D camera, kinetic type, synthesised score, Mongolian ElevenLabs voiceover, verified MP4 under 300 MB). Use when the user asks for a new KublAi video, a new version or voiceover of an existing one, or changes to sound, voice or timing of KublaiAgentsV2.
---

# KublAi video

This repo's pipeline for KublAi videos. The reference implementation is `src/kublai-agents-v2/` (composition `KublaiAgentsV2` and `KublaiAgentsV2Dialogue`); read `CLAUDE.md` first for the architecture, voices, commands and pitfalls. For creative direction (storyboard with 3–5 options per scene, motion quality, review after the first build) also load the `vizavi-motion` skill if it is installed.

## Ground rules

- Never start a full render unless the user asks. Edit, type-check, and name the render command.
- Get approval before spending credits: show the script or copy first, in Mongolian with an English gloss.
- Mongolian: no loanwords where a native word exists; spell brand names and acronyms for TTS only («Кублай», «Эй Ай», «Си Ар Эм»). The user checks pronunciation by ear; Claude can't hear, so report audio as measured, not listened to.
- New versions get their own composition, voice folder and output file; don't overwrite an approved one.
- Offer choices as numbered options or named IDs; for voice takes, make a comparison file.

## Making a new video

1. **Brief and storyboard.** Write `docs/kublai-launch/<name>-storyboard.md`: the thread, scenes with 3–5 options each and the chosen one, look, sound plan. Keep product claims to what KublAi really does; mark demo data as demo.
2. **Cue sheet.** Create `src/<name>/cues.json` with `duration`, `bpm` (scene bounds on bar lines), `scenes`, and every event time in `t`. Everything else reads these times.
3. **Engine.** Copy the engine from `src/kublai-agents-v2/` (`time.ts`, `world.tsx`, `camera.ts`, `backdrop.tsx`, `sprites.ts`, `type.tsx`, `ui.tsx`, `fonts.tsx`) or, if it has been moved to `src/engine/`, import it. Reuse the v1 UI kit (`src/kublai-agents/ui.tsx`, `theme.ts`) for app-accurate cards and colours.
4. **Scenes.** One set per scene at a world anchor in `layout.ts`; a single continuous camera in `camera.ts` (monotone keys, holds by repeating values, drift for life). Carry objects between scenes (bubble flies into phone, chip into calendar) rather than cross-fading. Register the composition in `src/Root.tsx` at 60 fps.
5. **Probe the risk early.** Render a few stills with `npx remotion still … --gl=angle` before building everything; check text sharpness, framing, layering.
6. **Score.** Adapt `scripts/kublai-agents-v2-audio.mjs`: music arrangement per section, SFX per cue, named whooshes and risers in `cues.json` (`whooshes`, IDs W../R..), ducking under the voice lists, three stems at -18 LUFS.
7. **Voiceover.** Draft the script per scene with times; get approval. Generate with ElevenLabs `creative_generate_speech` (`eleven_v4`, one flow per version, 4 takes per line). Download the takes before their signed URLs expire (2 h), measure duration and loudness, place each line at a cue so lines never overlap, and set `volume` so each is about -17.5 LUFS. Check the speech-band (300–3,500 Hz) margin over the score: aim for at least 8 dB.
8. **Audio preview.** Mix the stems and voices with the same ffmpeg graph as the render script into `outputs/<name>-audio-preview.mp3` and open it for the user.
9. **Render (only when asked).** Use or adapt `scripts/render-kublai-agents-v2.mjs`: muted GPU render at 20 Mbit/s, ffmpeg mix with limiter, mux with AAC 320k. Add `npm run render:<name>` scripts.
10. **Verify the delivered file.** Specs and frame count, full decode, contact sheets and dense strips across fast transitions, audio sync against the mix, stereo peaks, loudness. Fix what you find; re-check the changed parts.

## Common revision requests

- "Whoosh W06 quieter" / "remove R01" → change that entry's `level` (0 removes it) in `cues.json`, run `npm run audio:agents-v2` and `:dialogue`, rebuild the previews.
- "This line sounds unnatural" → regenerate that line only (4 takes), keep the old file as `*_old.mp3`, build a comparison file, swap in the take the user picks, re-gain, rebuild that version's stems.
- "Change a word on screen" → edit the scene text; check the layout in a still.
- "Upload to Drive" → the connector can't upload large videos; open the Drive folder and reveal the file in Finder.
