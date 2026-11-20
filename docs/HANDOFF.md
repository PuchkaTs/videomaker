# Video 1 production handoff

## Status — September 23 production build

- Footage review app: run `npm run review:footage`, then open http://127.0.0.1:3011. It lists the 36 used placements (31 distinct clips), supports source playback, frame stepping, in-point selection, source swaps, per-placement save/reset and session undo. Changes are stored in `src/video1/footage-edits.json`; Remotion imports them live. Original assets and all scene durations are preserved. Run a new render after choosing edits. See README.md for the workflow.

- Approved opening pace: scenes 1, 2, 4, 5, 6, 7, 10, 11, 12, 14, 15 and 16 now show full-screen footage for 3 seconds including the transition (2.4-second hold + 0.6-second transition). Scene durations and narration timing are unchanged. Scenes 5, 7 and 12 use quicker graphic entrances to retain a reading hold. The full `outputs/video1-draft.mp4` has been re-rendered and verified with this timing.

- Scene 7 clock correction: `ClockArtwork.tsx` uses a stationary face and a shared SVG pivot at (480, 267), with the minute hand moving from 15 to 20 minutes and the hour hand advancing at 1/12 of that angle. The gold arc follows the same progress. This replaces the incorrect per-hand bounding-box rotation. Review clip: `outputs/scene07-clock-fixed-preview.mp4`.

- Scene 5 yak correction: the Remotion illustration and local SVG now use a shaggy, long-coated yak with a shoulder hump, bushy tail, beard, curved horns and short visible hooves. The source is `docs/video1/vector-artwork/yak-anatomy.svg`; `generate.py` reuses it. This replaces the former smooth, generic bovine silhouette. The surrounding mountain, pasture and milk drop are unchanged. Review clip: `outputs/scene05-yak-revised-preview.mp4`. The older Figma vector copies have not been synced in this pass.

- Video1Draft now implements all 18 scenes in Remotion, with supplied footage, eight selected Higgsfield motion clips, animated approved vectors, masked typography, timed statistics and editorial transitions.
- The original 158.832-second voiceover is unchanged and unbroken. Master: 1920×1080, 30 fps, 4,765 frames.
- Scene boundaries now follow narration cues using local Mongolian ASR checked against the supplied transcript. These replace estimated storyboard timing; a final native-speaker editorial listening pass can refine the cuts.
- Scene 2 uses the approved male researcher and milk/whey sampling videos. Scene 9 uses the second, fixed-camera product-family generation with all five jars visible.
- Remotion Studio: http://localhost:3000/Video1Draft. Render: `npm run render:video1` → `outputs/video1-draft.mp4`.
- See `docs/video1/remotion-production.md` for implementation, source selection and validation. Historical sections below describe earlier design stages; their statements that Remotion was unchanged are superseded by this status.
- All 75 supplied clips remain in `public/video1/footages`; 23 distinct supplied clips are used alongside eight generated clips. Supplied footage provenance remains unverified; generated imagery depicts concepts, not actual company facilities or research participants.
- The existing private repository is https://github.com/PuchkaTs/videomaker. Source and generated video paths are covered by Git LFS rules. No commit or push was made in this production pass.

## Product-only revision (September 22)

The user rejected displaying complete supplied advertisements and explicitly approved the generated transparent jar cutout. Use `public/video1/productCutouts/amin-chanar-jar.png` for isolated product layers. The user then requested a commercial photo from this cutout; `public/video1/commercial/amin-chanar-hero-emerald.png` is the resulting emerald studio packshot with an ivory limestone pedestal and left copy space. Figma scenes 9 and 13 use the approved cutout; scene 18 uses the new commercial photo. The cover product panel also uses the cutout. Original posters remain source references only. The interim source-photo vector masks are hidden and are not the selected deliverable. Remotion is still unchanged.

## Creative direction

### Scene 2 contextual research imagery (September 22)

The user rejected the stock-like colorful laboratory and molecular imagery. Both Scene 2 Figma keyframes now use generated concepts: `public/video1/scene2/yak-milk-research-male-v2.png` shows a Mongolian researcher examining a milk sample with yak/dairy context, and `public/video1/scene2/milk-whey-sampling-v1.png` shows milk-and-whey sample preparation in the upper-right window. The opening dark gradient is hidden to preserve natural daylight. The existing copy and separate ivory vector field remain intact. These concepts do not depict actual company staff, facilities, peptide extraction, or research results. The historical horse-blood narration remains intact and is not presented as a milk-product ingredient. Prompts and node mappings are in `docs/video1/scene2/generation.json`. This supersedes the Scene 2 supplied-footage assignments in the V2 design refresh. Remotion is unchanged.

### Static vector collection (September 22)

The user requested minimalist vectors for every scene idea before a later animation pass. All 18 static SVG illustrations are in `public/video1/vectors/`, with a gallery (`index.html`), overview (`overview.jpg`) and layer/motion-note manifest. The same editable native vectors are on the Figma page `Vector artwork / Motion assets` (`44:2`). See `docs/video1/vector-artwork/README.md` and its audit for the scene mapping and implementation notes. This pass adds static artwork only; storyboard keyframes and Remotion are unchanged. Scenes 13 and 18 are empty vector stages for the approved product, not new packaging.

### V3: clean graphic fields — current direction (September 22)

The user rejected illustrations over images and approved the treatment in scenes 3, 8 and 14. Vectors must animate only on solid editorial cards or solid panels separate from footage. Do not place graphic overlays on photographs or generated videos. This supersedes the earlier overlay-placement pass and its production-stack instructions.

Scenes 1, 3, 6, 7, 8 and 15 resolve to full graphic cards. Scenes 2, 4, 5, 11 and 16 separate the upper-right footage window from a solid graphic field below it. Scenes 10, 12, 14 and 17 use an upper image strip and an ivory title/illustration band. Scene 9 now uses the generated product-family photograph and a separate original-badge strip, as documented below. Scenes 13 and 18 are clean product compositions without vector decoration; their unused illustrations remain in the asset library. The opening scene 7 ripple overlay is also hidden.

`docs/video1/vector-clean-fields/design.json` records the current scene directions and audit. All 36 keyframes were checked: no visible illustration geometry intersects an image, no illustration geometry extends beyond its keyframe, and no visible board text exceeds its board bounds. Composition, art-direction, camera and motion notes in all 18 Figma boards were updated. The revised visual overview is `work/vector-clean-fields/overview.jpg`; the gallery is `work/vector-clean-fields/index.html`. Earlier placement previews are historical.

For Remotion, animate vector groups, line reveals, text and transitions on the solid fields, synced to the intact voiceover. Footage plays in a separate window or precedes the graphic card. Generate videos without baked-in typography or vector artwork. Remotion still has the original three temporary image holds; the full scene design has not been coded or animated yet.

Brand: Амин чанар. Company: Бага Рашаант.

### Scene 9 product-family photograph — latest revision

The user supplied new artwork showing five product jars and five standards badges, then rejected the detached cutout arrangement and explicitly requested image generation. Both scene 9 keyframes now use `public/video1/productFamily/family-commercial-v1.png`: a generated commercial composition of the five product identities together on ivory stone plinths. The photograph was generated with the built-in image tool from matching source artwork at `Downloads/LOGO/aminchanar cover.jpg`; the initially attached numeric Downloads filename was unavailable. The blue poster layout is not used in the scene.

The user then requested generation of the standards logos too. `public/video1/productFamily/standards-badges-generated-v1.png` is the selected transparent atlas: five front-facing ivory, emerald and gold badges labeled ISO 9001:2015, ISO 22000:2018, HACCP, GMP and GHP. Both scene 9 keyframes use five independently placeable image layers in the lower ivory strip. Original tilted blue badges are hidden. These are stylized generated graphics based on the supplied references, not independent certification verification. Atlas regions, prompt and placement audit are in `docs/video1/product-family/badges-generation.json`.

Five products are pictured; the narration's six-product count is preserved and no sixth SKU is invented. Generated packaging is not pixel-exact; original source artwork remains available for label checks. The unused detached product cutouts and growth petals are hidden. The product-photo prompt and dimensions are in `docs/video1/product-family/generation.json`; its original-badge audit is historical and superseded by the badge-generation record. Scene 9's first/last composition, motion, art direction and source notes are updated in Figma. Remotion is unchanged.
Working concept: “Байгалиас шим тэжээлд.”

Mongolian landscapes and herders lead into milk, research, production, everyday nourishment, and the final hero product. The user likes The Story of Milk and expressive text animation.

Palette: emerald #0A3028, forest #124B3A, milk #F3EFE3, ivory #FBF8F0, warm gold #D6BA75. Typography: Noto Sans / Noto Sans Display, with editable Mongolian Cyrillic. Use masked phrases, deliberate statistic entrances, restrained camera movement, and generous reading holds.

Master: 1920×1080, 30 fps, 4,765 frames. Original voiceover: 158.832 seconds; preserve it in full.

## Figma and references

- Cover: https://www.figma.com/design/4kVh528JCdBhKHkKmsRCXx/VideoMaker?node-id=7-2
- First scene: https://www.figma.com/design/4kVh528JCdBhKHkKmsRCXx/VideoMaker?node-id=10-2
- Motion study A: https://www.figma.com/design/4kVh528JCdBhKHkKmsRCXx/VideoMaker?node-id=15-2
- File key: 4kVh528JCdBhKHkKmsRCXx. Page: 0:1.
- docs/video1/storyboard.json stores the scene plans and Figma IDs. It is not a full visual Figma export; Figma is authoritative for visual refinements.
- docs/video1/design-refresh-2026-09-22.json records the V2 layouts, typography, source filenames/timestamps, and revised directions. These visual directions supersede the original shot-index assignments and visual notes in storyboard.json; the original narration and timing constraints remain unchanged. docs/video1/design-refresh-audit-2026-09-22.json records 18 boards, 36 keyframes, and no detected keyframe or board text overflow.
- Inspiration: https://vimeo.com/53671575
- Additional typography reference considered: https://www.behance.net/gallery/170218885/Neutrogena

## Production constraints

AI concept stills illustrate landscapes, labs, factories and family scenes; they do not document company facilities or real research participants. Preserve the supplied product identities. The latest family reference depicts five products, although the narration mentions six product types. Standards badges are user-supplied graphics, not independent verification of certification status.

Confirm narration claims before final publication: 75–98%, 15–20 minutes, 80%, organic status, and standards/certifications. The 3-ton factory statement has no daily or yearly unit. The horse-blood passage is research history; do not imply it is an ingredient of this milk product. Do not invent certification marks, institutional endorsements, clinical charts, or results.

## Next steps

1. Open the completed Video1Draft in Remotion Studio and review the full draft.
2. Refine editorial timing if needed against the original Mongolian narration, particularly the short closing sentiment scene.
3. For future edits, run `npm run check`, `npm run verify:assets` and `npm run verify:video1`, then render again.

## Continuation prompt

Read AGENTS.md, docs/HANDOFF.md and docs/video1/remotion-production.md. The 18-scene production is implemented. Preserve the complete original voiceover, approved packaging and separate solid vector fields. Use src/video1/scene-data.ts for scene timing, copy and footage assignments; src/video1/Scene.tsx and AnimatedArtwork.tsx control motion. Do not revert to the old three-hold placeholder or estimated storyboard timing.
