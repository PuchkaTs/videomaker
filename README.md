# VideoMaker — Remotion + Higgsfield

One private repository for the Амин чанар commercial: source code, voiceover, product images, footage, and production notes. Source video uses Git LFS via .gitattributes.

Repository: https://github.com/PuchkaTs/videomaker (private). Clone it through GitHub Desktop while signed into the owning account, or use `git clone https://github.com/PuchkaTs/videomaker.git` with authenticated Git.

Read [the production handoff](docs/HANDOFF.md). Video1Draft implements all 18 scenes at 1920×1080, 30 fps, with the complete 158.832-second voiceover.

## Review used footage

Run `npm run review:footage`, then open http://127.0.0.1:3011. Node.js 24 and FFmpeg/ffprobe must be installed. Keep `npm run dev` running separately for Remotion Studio.

1. Select a used footage placement in the left sidebar.
2. Watch or scrub the source. Use ← / → to step one source frame, or Shift for ten.
3. Click **Mark this frame** (or press **I**) to choose the first frame. The UI numbers source frames from 1.
4. Use **Swap clip** to choose a different source. The picker starts with used clips; **All project footage** includes unused alternatives.
5. **Preview selected portion**, then **Apply to this placement**. Remotion refreshes automatically. Undo or restore the original selection if needed.

Edits are saved to `src/video1/footage-edits.json` and apply to one placement at a time. Repeated uses of a source remain independent. Scene durations, neighbouring cuts, narration and animations stay fixed. If the remaining footage is short, the editor shows the slower playback rate; unusably late frames are rejected. The original media files are never modified. Existing MP4 exports need a fresh render after changes.

The server listens only on the local computer. Source metadata, thumbnails and recovery snapshots are cached under ignored `work/footage-editor/`. **Undo last save** covers the current server session; recovery snapshots remain on disk after restart.

## Mac setup

Install Node.js 24, Git, and Git LFS. GitHub Desktop can clone and sync the repository. With Homebrew, Git LFS can be installed using `brew install git-lfs`.

In a Git clone, run:

```sh
git lfs install --local
git lfs pull
npm ci
npm run verify:assets
npm run check
npm run dev
```

Open http://localhost:3000/Video1Draft, or the address Remotion prints if that port is occupied.

For the transfer ZIP, skip the two git lfs commands: it includes real media files. Initialize and publish that extracted folder later.

## Commands

- `npm run dev`: Remotion Studio.
- `npm run review:footage`: Watch used sources, mark starting frames and swap clips.
- `npm run test:footage`: Footage selection, timing, persistence and undo tests.
- `npm run check`: TypeScript validation.
- `npm run verify:assets`: Verify original source assets by SHA-256.
- `npm run render:video1`: Export outputs/video1-draft.mp4.
- `npm run render`: Export the separate starter composition.

On this Windows installation, .\npm.cmd uses the ignored portable runtime under work/runtime. On a fresh Windows checkout, install Node.js 24 and use system npm; on macOS use standard npm, never npm.cmd. Local Windows runtimes and node_modules are excluded from transfers.

## Contents

- src/: Remotion compositions.
- public/video1/: voiceover.mp3, productImages/, and footages/ (75 supplied clips).
- docs/video1/voiceover-text.docx: original narration script.
- docs/video1/storyboard.json: scene plans and Figma node references.
- docs/video1/concepts/ and concept-sheet.png: AI concept imagery.
- docs/video1/asset-manifest.json: source file sizes and SHA-256 hashes.
- docs/HANDOFF.md: creative decisions, status, and next steps.
- outputs/: ignored renders and transfer packages.

Use project-relative Remotion staticFile() paths. The Windows D: drive is no longer required.

## Publish one private repository

Git and Git LFS must be installed before the first commit. From the extracted project folder:

```sh
git init -b main
git lfs install --local
git add .
git lfs status
git lfs ls-files
```

Confirm that all 75 MP4 files appear under LFS, then create the initial commit:

```sh
git commit -m "Prepare VideoMaker commercial project and media"
```

If Git requests your author name/email, configure your own identity before committing. Add this existing repository in GitHub Desktop, choose Publish repository, use the name videomaker, and leave Keep this code private enabled.

The private repository has been created at https://github.com/PuchkaTs/videomaker. The initialization instructions above are retained for reference; do not create a second repository when continuing on another computer. Clone the existing repository instead. The older transfer ZIP contains a pre-publication snapshot; prefer the latest Git clone.

## Switching computers

Pull before starting work. Commit and push when finishing, including new LFS media. On the other computer, pull and run git lfs pull. Run npm ci when the lockfile changes. Keep final renders outside version control. Connect Figma and Higgsfield in Codex on the new machine as needed.

Official LFS setup: https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage
