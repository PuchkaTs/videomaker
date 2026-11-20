# Static vector artwork — September 22

18 editable SVG illustrations correspond to the 18 storyboard ideas. The collection is static; no animation has been added to Figma or Remotion in this pass.

September 23 revision: Scene 5's local SVG and Remotion geometry now use `yak-anatomy.svg` for a recognisable long-haired yak. The original Figma imports and overview image are historical; the live SVG gallery reads the updated file. The source generator imports the revised anatomy rather than recreating the rejected smooth silhouette.

- Figma: https://www.figma.com/design/4kVh528JCdBhKHkKmsRCXx/VideoMaker?node-id=44-3
- Page: `Vector artwork / Motion assets` (`44:2`). Artboard IDs are in `figma-audit.json`.
- Assets: `public/video1/vectors/01-*.svg` through `18-*.svg`.
- Gallery: `public/video1/vectors/index.html`; visual overview: `public/video1/vectors/overview.jpg`.
- Source generator: `docs/video1/vector-artwork/generate.py`; run from repository root.
- Asset manifest: `public/video1/vectors/manifest.json` records each scene idea, named layers, palette and future motion notes.

## Composition and animation handoff

SVGs use a transparent 960 × 540 canvas. Figma artboards use an ivory preview background. All illustration shapes remain native editable geometry in Figma; there are no embedded raster images or outlined text. Keep SVG group IDs when bringing the artwork into the motion composition. To animate individual parts in Remotion, inline the SVG or convert its groups to JSX; loading an SVG through an image element exposes only the whole image to animation.

These are supplemental scene illustrations, not replacements for the footage or the product. Scenes 13 and 18 intentionally provide empty framing/staging around the approved cutout. Preserve the approved jar and commercial photo from the product-only art direction. Scientific networks are conceptual; six petals represent product variety without inventing SKUs. The art does not add clinical results, certification seals or institutional logos.

Visual inspection covered all 18 imported Figma artboards. The final structural audit found 18 artboards, each 960 × 540, no image fills and no out-of-bounds artwork. XML checks verified unique SVG IDs and absence of raster embeds, scripts and animation elements. `npm run check` passed; `npm run verify:assets` verified all 92 original source assets.
