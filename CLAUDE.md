# Dark Tales: project notes for Claude

This repo makes **Dark Tales** videos: animated, faceless "dark true story" shorts in English (1080x1920, 60-70 s) for YouTube Shorts / Reels / TikTok, built with Remotion + ElevenLabs.

**For any new episode, use the `dark-tales-episode` skill** (`.claude/skills/dark-tales-episode/`). It holds the workflow, brand rules, fact-check protocol and the shot vocabulary.

## Quick map
- Brand (single source of truth): `src/brand/brand.json`. Change look/audio/CTA there, not in episodes.
- Episodes are data: `public/episodes/<id>/episode.json` (+ generated `vo-*.mp3`, `vo-*.json`, `timings.json`). Reference episode: `tarrare`.
- Renderer and shot library: `src/engine/` (shot library, renderer, looks); visual building blocks: `src/engine/kit.tsx`.
- CLI: `npm run ep -- lint|new|draft|voice|timings|check|render|publish|list <id>` (`lint all` needs no audio or key) (on PowerShell use `npm.cmd` if scripts are blocked).
- Output: `out/<id>/<id>.mp4` and `out/<id>/publish.txt` (git-ignored).
- Secrets: `.env` (see `.env.example`). Never print, log or commit API keys. `voice` spends ElevenLabs credits, so ask first.

## Looks
Each episode sets `"look"` in its JSON: `night` (default), `manuscript` (folio shots), `casefile` (board shots) or `poster` (poster shots). Alternate them between episodes; see the skill.

## Rules that matter
- Facts first: every claim needs a source you actually read; keep `meta.sources[].verified` honest.
- SFX stay sparse and soft (see `brand.json` audio limits); BGM is a quiet bed under the voice.
- No real photos/music/clips unless licensed; take inspiration from references, never copy them.
- Keep `tarrare` rendering the same when extending the library.

