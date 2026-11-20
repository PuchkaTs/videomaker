# Video 1 — animated production

The 18-scene Figma treatment is implemented in `Video1Draft`. The original narration plays once, without cuts, speed changes or added generated audio, across the complete 4,765-frame, 1920×1080, 30 fps master.

The approved pacing revision holds opening footage for 2.4 seconds and transitions over 0.6 seconds in scenes 1, 2, 4, 5, 6, 7, 10, 11, 12, 14, 15 and 16. Scenes 5, 7 and 12 accelerate their graphic entrances to fit the unchanged narration window. All other scene treatments and boundaries remain unchanged. Scene 17 is only 2.23 seconds long and retains its existing continuous milk-ripple video and title-band treatment.

## Edit and preview

- `npm run dev` opens Remotion Studio; select Video1Draft.
- `npm run render:video1` writes `outputs/video1-draft.mp4`.
- `src/video1/scene-data.ts` contains editable scene boundaries, supplied/generated video assignments, copy, typography and layout coordinates.
- `Scene.tsx` animates masked phrases, timed numeric callouts, panel transitions, product entrances and badge reveals.
- `AnimatedArtwork.tsx` animates the approved named SVG groups with staggered entrances, line drawing, leaf growth, milk drops, amino-acid blocks, clock hands and ripples. Motion is frame-based and reproducible.
- `ClockArtwork.tsx` handles scene 7 as a fixed clock rig: both hands rotate about (480, 267), with a 12:1 minute/hour angular ratio. The minute hand moves from 90 to 120 degrees, and the gold 15–20 minute arc draws using the same progress. The face, marks and center pin remain stationary.
- Photographs occupy dedicated windows or precede a full graphic card. Vector artwork stays on the separate solid field. Scenes 13 and 18 deliberately omit decorative vectors.

## Media

Eight Higgsfield Seedance 2.5 clips animate the approved researcher, sampling, protein, powder, product-family, breakfast, milk-ripple and hero references. `higgsfield-generation.json` and `higgsfield-results.json` record the initial requests/results. `higgsfield-family-revision.json` records the selected fixed-camera product-family revision; the earlier version is unused because it crowded and cropped the jars. The revision is 2206×946, 24 fps; the other clips are 1920×1080, 24 fps. Remotion fits them to the 30 fps master.

23 distinct supplied footage clips are used directly. They are cut once within their scene windows, muted, with a modest speed adjustment where necessary to fit narration. There are no repeated footage loops. Source clip metadata is in the asset inventory; active assignments are in scene-data.ts. Early/middle/late samples were inspected for selected source clips and generated clips. These checks do not independently authenticate source footage.

The approved transparent jar remains a separate, unmodified raster layer in scene 13. Five products are pictured in scene 9 while the original narration's six-product count stays intact. Generated product video labels are not pixel-exact. Generated lab/family imagery is illustrative. Horse-blood research history is not depicted as a milk ingredient. Standards badges reproduce the approved artwork, not independently verified certifications.

Noto Sans regular and bold are bundled locally with their OFL license. No machine-specific media paths are used.

## Timing and verification

`narration-timing.json` records narration-aligned scene boundaries. Local multilingual ASR, a targeted second transcription around 39–56 seconds, and comparison with the supplied transcript informed these cues. ASR was not used to rewrite approved Mongolian copy. A final listening review may refine editorial cuts; scene 17 is intentionally short to preserve the closing brand phrase.

- TypeScript: `npm run check`.
- Original source sizes and SHA-256: `npm run verify:assets` (92/92).
- Timeline continuity and media duration: `npm run verify:video1` (18 scenes, 4,765 frames, 31 playable video sources).
- All 18 scenes were rendered as review stills. Remotion Studio DOM checks found no horizontally clipped text at the review frames and no current preview error.
- Full rendered output evidence is saved in `render-verification.json` after export.

`work/production/` holds ignored review stills, source contact sheets, ASR data and render logs. `outputs/` holds ignored exports. Video assets are covered by the existing Git LFS patterns; no commit or push was performed.
