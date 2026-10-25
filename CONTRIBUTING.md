# Contributing

Thanks for wanting to improve this project. It is a small, opinionated engine, so a quick note on what fits and how to propose it.

## Good contributions

- **New looks or shot types** (see [docs/creating-a-look.md](docs/creating-a-look.md)).
- **Localizations** of the bundled episodes, or new example episodes (see the content rules below).
- **Tooling:** a key-less sound-effect synthesizer, other TTS providers, better previews, tests.
- **Docs**, bug fixes, accessibility of the generated videos (contrast, legibility).

For anything large, open an issue first so we can agree on the approach.

## Setup

```bash
npm install
npm run ep -- lint all     # structural check of every episode
npm run typecheck          # TypeScript
npm run lint               # ESLint + TypeScript
npm run dev                # Remotion Studio
```

Node.js 20.19+, 22.13+ or 24+. You do not need an API key to work on visuals: use `npm run ep -- draft <id>` for a silent preview.

## Pull request checklist

- [ ] `npm run typecheck` and `npm run ep -- lint all` pass.
- [ ] Existing episodes still render the same, unless the change is meant to alter them.
- [ ] New options are typed in `src/engine/types.ts` and documented in `docs/episode-format.md`.
- [ ] New shot types are added to the linter lists in `scripts/episode.mjs`.
- [ ] You looked at the result (a `remotion still` or Studio screenshot in the PR helps reviewers).
- [ ] No secrets, no generated audio or video, no third-party media were added.

## Code style

TypeScript with `strict` on. Formatting follows `.prettierrc`. Keep rendering deterministic (a pure function of the frame number),
read colours and fonts from `brand.json`, and keep the 1080x1920 canvas's bottom band (y >= 1440) free for subtitles.

## Content rules for episodes

- **True stories only**, with a source per claim (`meta.sources`). Mark `verified: true` only if you actually read the source. Hedge contested details in the narration.
- **Handle violence by implication**, not depiction. Avoid dwelling on suicide methods, abuse, or recent mass-casualty events, and do not name private individuals.
- **Images only through the tool:** use `npm run assets -- add` (public domain / CC0 from Wikimedia Commons, with provenance). Do not commit images from anywhere else.
- **No third-party media:** no real photographs, clips, music or recorded voices unless you hold the licence and credit it. Take inspiration from other work, never copy it.
- **Original text:** write narration in your own words; do not copy it from articles or videos.

## Licensing of contributions

By contributing you agree that your contribution is released under the project's [MIT License](LICENSE).
Do not contribute code copied from Remotion's source or from projects with incompatible licenses.
