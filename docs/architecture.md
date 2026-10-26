# Architecture

## The idea

A video is described by **data** (`episode.json`), not by animation code. A small engine turns that data into
frames. Everything that must stay consistent across a channel (colours, fonts, subtitle style, audio levels, limits,
default voice) lives in one file, [`src/brand/brand.json`](../src/brand/brand.json).

```
episode.json ──┐                                   ┌─> shots (one Sequence per shot, per look)
brand.json ────┼─> Remotion composition ───────────┼─> subtitles (from word timings)
timings.json ──┘   (calculateMetadata sizes it)    └─> audio (voice, music bed, sound effects)
      ▲
      │ made by the CLI: `draft` (estimated) or `voice` (ElevenLabs, exact)
```

## Files

| Path | Role |
|---|---|
| `src/Root.tsx` | Registers one composition `DarkTales-<id>` per id in `src/episodes.ts`. `calculateMetadata` fetches `episode.json` + `timings.json` and sets the duration. |
| `src/engine/types.ts` | The episode schema as TypeScript types: scenes, shots of every look, cues, brand text overrides. The best "spec" there is. |
| `src/engine/cue.ts` | Resolves a cue (`2.5`, `"@word"`, `"@word#2"`, `"@word -0.3"`) to seconds using a scene's word timings. |
| `src/engine/env.ts` | React contexts shared by shots: the per-shot timing environment (`ShotEnv`, `useCue`) and localised brand text (`useBrandText`). |
| `src/engine/Episode.tsx` | The renderer: scene lengths, shot sequencing and transitions, subtitles, audio mix. |
| `src/engine/kit.tsx` | Drawing parts shared by the looks (people, chips, stamps, id cards, map, globe, stage). |
| `src/engine/library.tsx` | The `night` look and the dispatcher `ShotView` that maps a shot's `type` to a component. |
| `src/engine/manuscript.tsx`, `casefile.tsx`, `poster.tsx`, `collage.tsx`, `comic.tsx` | The other looks. `collage.tsx` also reads `public/collage/manifest.json` for image sizes. |
| `scripts/episode.mjs` | The CLI. Reimplements the cue grammar in plain JS so it can lint without bundling React. |

## Timing model

1. **Scene length** = voice-over length + `audio.voTail` (default 0.4 s), in frames at 30 fps. The voice decides the length; nothing is stretched.
2. **Cues are words.** `timings.json` stores each spoken word with `from`/`end` seconds (from ElevenLabs' character alignment). `"@secret"` resolves to the start of the first "secret" in that scene's narration.
3. **Shots** start at their `at` cue and last until the next shot's `at` (the last one runs to the scene end). Each shot's Sequence begins `pad` frames early and ends `pad` frames late, which gives the look's transition room (crossfade, slide, flash, wipe). `useCue()` converts a cue to a frame **inside** the current shot, accounting for that pad.
4. **Subtitles** group words into chunks of up to `subtitles.maxWords`, breaking at punctuation and pauses. Spoken words are bright, upcoming words dim, and `keywords` are highlighted.

## Audio model

- **Voice** per scene: `public/episodes/<id>/vo-<scene>.mp3`.
- **Music bed**: `audio.bgmFile`, at `audio.bgmVolume` with a fade in and out.
- **Sound effects** (`public/audio/sfx-<name>.mp3`): any cue closer than `audio.sfxMinGap` seconds to the previous kept one is dropped, and volumes are capped at `audio.sfxMaxVolume`. That is how "never stack" is enforced rather than merely recommended.

## Looks and transitions

A **look** is a set of shot components plus a transition wrapper and a `pad`. Looks are independent of each other; an
episode uses exactly one (`"look"` in its JSON), and the linter rejects shots from another look.

| Look | Shot types | Transition | pad |
|---|---|---|---|
| `night` | `scene`, `globe`, `idcard`, `map`, `paper`, `sketch`, `object`, `cta` | crossfade | 4 |
| `manuscript` | `folio` | slide like a scroll | 7 |
| `casefile` | `board` | hard cut with a camera flash | 3 |
| `poster` | `poster` | diagonal wipe | 5 |
| `collage` | `collage` | torn-paper wipe (stop-motion steps) | 5 |
| `comic` | `comic` | zig-zag page wipe | 5 |

## CLI vs. browser code

`scripts/episode.mjs` runs in Node (no React): `lint`, `draft`, `voice`, `timings`, `check`, `render`. The render step
shells out to `npx remotion render`. The same cue grammar exists twice (`src/engine/cue.ts` and `scripts/episode.mjs`); keep them in sync.

## Design constraints worth knowing

- **Canvas** is 1080x1920. The bottom band (y >= 1440) belongs to subtitles; keep art out of it.
- **Faceless figures** keep the style consistent and avoid depicting real people.
- **`brand.json` is the only place** for colours, fonts and audio levels. Looks read from it (directly or via `kit.tsx`).
- **No assets in the repo:** all art is vector code; audio is generated locally.
