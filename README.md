# VideoMaker — Remotion + Higgsfield

One private repository for the Амин чанар commercial: source code, voiceover, product images, footage, and production notes. Source video uses Git LFS via .gitattributes.

Read [the production handoff](docs/HANDOFF.md). Video1Draft is 1920×1080, 30 fps, with the full 158.832-second voiceover and three product-image holds. The 18-scene Figma storyboard has not yet been implemented in Remotion.

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

The prepared folder and ZIP do not themselves create a remote repository. No GitHub repository has been published by this preparation step.

## Switching computers

Pull before starting work. Commit and push when finishing, including new LFS media. On the other computer, pull and run git lfs pull. Run npm ci when the lockfile changes. Keep final renders outside version control. Connect Figma and Higgsfield in Codex on the new machine as needed.

Official LFS setup: https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage
