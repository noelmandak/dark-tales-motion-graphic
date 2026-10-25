---
name: dark-tales-episode
description: Create a new Dark Tales video episode end to end — the animated history / dark true stories channel (English narration, vertical 1080x1920 for YouTube Shorts, Instagram Reels and TikTok, 60-70 seconds). Covers choosing and fact-checking a story, writing the 5-beat script, designing shots in the episode JSON, ElevenLabs voice-over, SFX/BGM rules, checking, rendering, and publish text. Use this whenever the user wants to make, plan, script, storyboard, animate, fix or render a Dark Tales video or "next episode", pitches a story idea for the channel, asks for a hook, shot list, voice-over, subtitles or SFX for a dark-history short, or mentions "Dark Tales", "dark history video" or "animated history short" — even if they never name this skill.
---

# Dark Tales episode workflow

Dark Tales is a faceless, animated "dark true stories" channel. Every episode shares one look, one sound and one structure, so the channel feels like a series and each new video is cheap to produce. Consistency is the whole point: change the *brand* in one place, never per episode.

Project root: `my-video/`. On Windows PowerShell, if `npm`/`npx` are blocked by the execution policy, use `npm.cmd` / `npx.cmd`.

| Thing | Where |
|---|---|
| Brand (palette, fonts, subtitles, watermark, CTA, audio levels, voice, limits) | `src/brand/brand.json` |
| An episode (script + shots + sfx + sources) | `public/episodes/<id>/episode.json` |
| Shot library and renderer | `src/engine/` (`library.tsx`, `Episode.tsx`, `types.ts`, `kit.tsx`) |
| Episode CLI | `npm run ep -- <new\|voice\|timings\|check\|render\|list> <id>` |
| Registered episode ids | `src/episodes.ts` (the CLI edits it) |
| SFX files / BGM | `public/audio/sfx-*.mp3`, `public/audio/bgm-local.wav` |

## The loop

1. **Pick the story.** Brainstorm with the user. Good Dark Tales stories are real, little known to a general English-speaking audience, and have a turn near the end that reframes everything. Reject stories that need graphic detail to work, that depend on one unreliable source, or that mock victims. Offer 3-5 candidates with the twist stated in one line each; let the user choose. (Superpowers `brainstorming` fits here if the idea is still vague.)
2. **Research and verify.** Read `docs/writing-guide.md` (Part 2) before writing a single line of narration. Facts come first because the channel's credibility is its main asset; one debunked claim costs more than any visual can earn back.
3. **Write the script** in the 5 beats from `docs/writing-guide.md` (Part 1) (hook, problem, escalation, twist, outro). Target 130-170 spoken words. Write for the ear, with numbers spelled out as words, and hedge uncertain claims in the narration itself ("reportedly", "some say").
4. **Scaffold and fill in the episode.** `npm run ep -- new <id> "<Title>"`, then edit `public/episodes/<id>/episode.json`: one scene per beat, each with its `vo` text, `shots`, and a few `sfx`. Design shots with `docs/episode-format.md` — shots are timed to *spoken words* (`"@word"`), not seconds, so they survive re-recording.
5. **Preview before spending credits.** `npm run ep -- draft <id>` writes *estimated* word timings (free, no API) so you can run `npm run dev` or render stills and judge the shots and pacing first. Show the user the script and a shot summary and get their approval; estimated timings are only for previewing (`render` refuses them).
6. **Voice-over.** `npm run ep -- voice <id>` generates per-scene audio and word timings through ElevenLabs. It spends the user's credits and needs `ELEVENLABS_API_KEY` (in `my-video/.env`, which git ignores, or in the environment) — confirm with the user before running it, and never print or store the key. Existing audio is skipped; `--force` regenerates (and spends again). Change the wording only when needed.
7. **Check.** Run `npm run ep -- lint <id>` as you write (instant, no audio needed), and `npm run ep -- check <id>` after recording: validates every cue, shot order, pacing, sfx files and stacking, duration and sources. Fix all errors. Read every warning; an `UNVERIFIED source` warning means the fact-check isn't finished.
8. **Look at it.** Run `npm run dev` and open composition `DarkTales-<id>`, or render still frames: `npx remotion still src/index.ts DarkTales-<id> out/frame.png --frame=300`. Look for text overlapping text, chips covering faces/objects, empty screens, and anything under the subtitle zone (y ≥ 1440). Fix, re-check.
9. **Render.** `npm run ep -- render <id>` runs the checks again, renders to `out/<id>/<id>.mp4` and writes `out/<id>/publish.txt` (title, description, hashtags, sources). Tell the user plainly what was verified and what wasn't.

If a step fails, fix the cause rather than working around the checker: its rules exist because each one prevented a real problem in earlier episodes.

## Looks: vary the presentation, keep the brand

The brand (navy and gold, faceless figures, serif + sans type, subtitle style, audio rules) stays fixed, but each episode picks a **look** so the feed doesn't feel repetitive. Set `"look"` at the top of `episode.json`:

- `"night"` (default): silhouettes on a night stage, slow camera pushes, crossfades. Fits modern or military stories, mysteries, anything "documentary".
- `"manuscript"`: illuminated-manuscript folios (parchment, gold-leaf frame, robed faceless figures with halos), chapter headings ("I · THE EXHUMATION"), and folios that slide like a scroll. Fits medieval/ancient/religious stories, trials, decrees, chronicles. Uses the `folio` shot type only.
- `"casefile"`: an investigator cork evidence board: polaroids and index cards pinned up, typewriter text, red string between clues, ink stamps, and a camera-flash cut between shots. Fits mysteries, crimes, investigations, anything "unsolved". Uses the `board` shot type only.
- `"poster"`: 1930s constructivist-style printed posters: diagonal colour blocks, giant block headlines that slam in word by word, angular icons, halftone and grain, diagonal print wipes. Fits wars, regimes, propaganda-era, industrial or ideological stories, anything with a strong slogan. Uses the `poster` shot type only.
- `"collage"`: archival images (public domain, with provenance) cut out with torn edges and pasted on kraft paper or newsprint, ransom-note headlines, a red marker, stop-motion movement, torn-paper wipes. Fits stories that have genuine period art or prints to show: medieval, early modern, 19th century. Uses the `collage` shot type only. **Images must come through `npm run assets` (see below).**

Pick the look that suits the era and theme, and **don't use the same look two episodes in a row** unless the story demands it. If a new story needs a look neither covers, propose a third one to the user and build it as a new look in `src/engine/` rather than bending an existing one. Looks cannot be mixed within one episode.

## Images for the collage look

Real pictures need real permission, so the tool does the checking and you do the judging:

1. Find candidates with `npm run assets -- search "<query>"` (Wikimedia Commons only). The output shows each file's licence: PD (public domain / CC0), BY (needs credit) or ?? (rejected).
2. Add with `npm run assets -- add "File:..." <id>`. It refuses anything that is not public domain or CC0 unless you pass `--allow-attribution`, and it records provenance in `public/collage/manifest.json`.
3. **Look at the picture** before using it: is it what you think it is, is it a *depiction* (painting, print) rather than a photograph of the event, and does it avoid recognisable living or recently deceased people? Caption honestly (artist, year, "painting" / "woodcut").
4. Reference images by id in `items`; `npm run ep -- lint` fails on unknown ids, and `render` puts the credits in `publish.txt`. Tell the user which images were used and that they should keep the credits in the video description.
5. Never use images from search engines, social media or stock sites, and never pass a non-Commons URL to the tool. If no suitable public-domain image exists, use a different look for that episode.

Details: `docs/collage-look.md`.

## Brand rules

These are in `brand.json` and the library already; follow them when making choices the tools don't enforce.

- **Look:** night-navy sky, gold accents, brick red for danger/stamps, rim-lit silhouettes with *no faces* (faces need licensing and invite uncanny results; silhouettes keep every episode consistent). Serif type for names and period documents, sans for UI and subtitles.
- **Pace:** a new image roughly every 2-4 seconds, one image per sentence, a slow camera push on every shot. The first shot appears at 0 s and must already say *where and when*. Use a `globe` + location label or an `idcard` for the hook.
- **Text on screen:** short chips for facts that matter ("A FEAST FOR 15 MEN"), stamps for verdicts ("MISSION FAILED"), location tags for place/time. Never put paragraphs on screen; the narration carries the story and the screen carries the proof.
- **Subtitles** are automatic: 3-4 words at a time, spoken words bright, upcoming dim, keywords gold. Choose keywords sparingly (6-12 per episode) in `keywords`.
- **Audio:** the voice leads. BGM sits about 14 dB under it. SFX are rare and soft: roughly one per 4 seconds, volume ≤ 0.5, never stacked (the renderer drops any cue within `sfxMinGap` of the previous one, and `check` warns). Use SFX only for beats that earn it: the opening hit, a stamp, a reveal, a transition. If a cue doesn't make the moment clearer, delete it. Overlapping effects were the main complaint about the first Tarrare version.
- **Ending:** the last shot is always `{"type": "cta"}`, cued on the word "Follow". The closing narration line is "Follow for the next dark true story." unless the user changes the brand.
- **Length:** 60-70 s is the target; over 75 s triggers a warning.

## Content guardrails

- True stories only. Never invent quotes, dates or numbers. If sources disagree, say so in the narration ("accounts differ") or choose another claim.
- Handle death and violence by implication (silhouettes, stamps, documents), not depiction. This is also what keeps videos monetisable on the platforms.
- Real people: historical figures long dead are fine; do not name private individuals. Avoid topics that dwell on suicide methods, abuse, or recent mass-casualty events.
- Copyright: no real photographs, clips or music unless licensed and credited. Take *inspiration* from reference videos (structure, pacing), never copy their scripts, art, or audio.

## When the library can't express a shot

Prefer composing existing shot types. If a recurring need appears, extend the system instead of hacking one episode: add the type to `src/engine/types.ts`, implement it in `src/engine/library.tsx`, add its name to `shotTypes` in `scripts/episode.mjs`, and document it in `docs/episode-format.md`. Reuse pieces from `src/engine/kit.tsx` (Person, Chip, Stamp, Paper, Facade, Globe, MapArt, ...). Keep the code frozen for old episodes: new features must not change how `tarrare` renders.

## Gotchas

- Word cues match the voice-over *as spoken*: lowercase, punctuation stripped, hyphens kept (`@twenty-six`), apostrophes dropped (`@couldnt`). `@he` is the first "he"; `@he#2` the second; `"@he -0.1"` shifts by seconds. A cue that can't be found is a `check` error.
- Write numbers as words in `vo` ("seventeen-nineties"); show digits with `displayReplace`.
- Every scene's first shot must start at `0`, and shots must be in time order.
- Don't edit `timings.json` or the `vo-*.json` files by hand; re-run `voice`.
- `public/episodes/tarrare` is the reference episode: open it when unsure how to write a shot.
