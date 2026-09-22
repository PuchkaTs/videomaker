# VideoMaker

Read docs/HANDOFF.md before continuing production. The project is a Remotion commercial for the Mongolian brand Амин чанар, with a detailed storyboard in Figma.

- Keep the full supplied voiceover intact: 158.832 seconds. Master is 1920x1080, 30 fps, 4,765 frames.
- The 18-scene Figma storyboard is a proposed treatment. The current Remotion Video1Draft still has three product-image holds; the storyboard is not yet implemented in code.
- Use project-relative media paths with Remotion staticFile(). Do not rely on Windows drive letters.
- Keep video source files in Git LFS. Do not commit node_modules, work, outputs, credentials, or local runtime installations.
- Concept images depict illustrative scenes, not actual company facilities or research participants. Preserve supplied product packaging; do not invent additional SKUs, certification marks, institutional endorsements, or clinical results.
- Run npm run check for code changes and npm run verify:assets after copying media.
