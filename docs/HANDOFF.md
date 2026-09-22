# Video 1 production handoff

## Status

- Video1Draft is a working Remotion composition with the full voiceover and three product-image holds.
- Figma contains an 18-scene treatment, 36 first/last keyframes, Mongolian copy, narration excerpts, camera/light/sound directions, transitions, asset notes, and three native typography studies.
- The Figma treatment is not yet implemented in Remotion. Scene timings are estimates needing alignment to actual narration cues.
- All 75 supplied footage clips are in public/video1/footages. They have not yet been visually reviewed, selected, or mapped to scenes.
- The original Windows D: drive files remain intact. All source assets needed for continuation are now inside this project.
- One private repository is intended, with source video in Git LFS. Repository publication is still pending.

## Creative direction

Brand: Амин чанар. Company: Бага Рашаант.
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
- Inspiration: https://vimeo.com/53671575
- Additional typography reference considered: https://www.behance.net/gallery/170218885/Neutrogena

## Production constraints

AI concept stills illustrate landscapes, labs, factories and family scenes; they do not document company facilities or real research participants. Preserve the supplied product packaging. Only one SKU is visually documented, although the narration mentions six product types.

Confirm narration claims before final publication: 75–98%, 15–20 minutes, 80%, organic status, and standards/certifications. The 3-ton factory statement has no daily or yearly unit. The horse-blood passage is research history; do not imply it is an ingredient of this milk product. Do not invent certification marks, institutional endorsements, clinical charts, or results.

## Next steps

1. Verify assets, install dependencies and start the dev server.
2. Review the 75 clips; create a visual inventory with durations and possible scene matches.
3. Align the 18 scene boundaries to the actual voiceover.
4. Select usable real footage before generating missing inserts with Higgsfield.
5. Implement precise Mongolian typography, statistics, transitions and approved product layers in Remotion. Generate footage without embedded text.
6. Review and render a full draft with the intact narration.

## Continuation prompt

Read AGENTS.md and docs/HANDOFF.md. Run npm run verify:assets and npm run check, then start the Remotion dev server. Continue the Амин чанар commercial using the existing Figma storyboard. First review and map the 75 supplied footage clips to the 18 scenes. Preserve the full narration, align scene timing to actual speech, and distinguish concepts from real company footage.
