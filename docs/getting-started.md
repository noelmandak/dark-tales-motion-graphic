# Getting started: your first episode

This walks you from a fresh clone to a rendered video. You can do everything up to step 5 without an API key.

## 0. Install

```bash
npm install
npm run ep -- lint all      # every bundled example should print "ok"
npm run typecheck
```

Requirements: Node.js 20.19+, 22.13+ or 24+. On Windows PowerShell, if `npm`/`npx` are blocked by the execution
policy, use `npm.cmd` / `npx.cmd` (or run the commands in Command Prompt).

## 1. Scaffold

```bash
npm run ep -- new demo "A Lighthouse Goes Silent"
```

This creates `public/episodes/demo/episode.json` from [`templates/episode.template.json`](../templates/episode.template.json)
and adds `"demo"` to [`src/episodes.ts`](../src/episodes.ts), which makes Remotion show a composition named `DarkTales-demo`.

## 2. Write the script and the shots

Open the new `episode.json`. An episode is a list of **scenes**; each scene has its narration (`vo`), its **shots**
(what is on screen) and a few **sfx** cues. Here is a minimal scene (fictional placeholder text):

```json
{
  "id": "demo",
  "title": "A Lighthouse Goes Silent",
  "look": "night",
  "keywords": ["silent", "lamp"],
  "scenes": [
    {
      "id": "s1",
      "vo": "In 1900, a lighthouse went silent. Nobody knew why. The lamp was still burning.",
      "shots": [
        {"at": 0, "type": "globe", "label": "SCOTLAND · 1900"},
        {"at": "@lamp -0.2", "type": "scene", "backdrop": "ground", "tint": "warm",
         "people": [{"x": 540, "s": 1.0}],
         "chips": [{"at": "@burning", "text": "STILL BURNING", "color": "gold"}]}
      ],
      "sfx": [{"at": 0, "file": "bass-hit", "vol": 0.4}]
    }
  ],
  "meta": {
    "title": "A Lighthouse Goes Silent (Fiction Example)",
    "description": "A placeholder episode used in the docs.",
    "hashtags": ["#example"],
    "sources": [{"claim": "Fictional example, no factual claims", "source": "n/a", "verified": true}]
  }
}
```

Things to notice:

- `"@lamp -0.2"` means "0.2 s before the narrator says *lamp*". Cues use the **words of your `vo`**, so they survive re-recording.
- The first shot of every scene must start at `0`. Shots run until the next shot starts.
- `look` picks the visual language: `night`, `manuscript`, `casefile` or `poster`. Each look has its own shot types (see [episode-format.md](episode-format.md)).
- Write numbers as words in `vo` ("nineteen hundred") if you need them pronounced a particular way; show digits on screen via shot text.

Full reference: [episode-format.md](episode-format.md). Craft advice (hooks, the five beats, fact-checking): [writing-guide.md](writing-guide.md).

## 3. Lint (instant, free)

```bash
npm run ep -- lint demo
```

Catches unknown shot types, shots that belong to a different look, cue words that are not in the script, missing
metadata, and an unfinished `TODO`.

## 4. Preview with estimated timings (free)

```bash
npm run ep -- draft demo     # estimated word timings, no API call
npm run dev                  # Remotion Studio -> composition "DarkTales-demo"
```

The preview is silent and the timing is approximate, but you can judge layout, text fit and pacing. Estimated
timings usually over-estimate the real duration by about 20%. `render` refuses to run on estimated timings.

## 5. Record the narration (costs credits)

Put `ELEVENLABS_API_KEY` in `.env` (copy [`.env.example`](../.env.example)), pick a voice, then:

```bash
npm run audio:sfx            # once: the 12 shared sound effects (or use your own files named sfx-<name>.mp3)
npm run audio:bgm            # once: a free local music bed
npm run ep -- voice demo     # narration per scene + exact word timings
```

`voice` skips scenes whose audio already exists (add `--force` to redo) and never prints your key.
Background: [audio-and-assets.md](audio-and-assets.md).

## 6. Check and render

```bash
npm run ep -- check demo     # real timings and assets: pacing, stacking, length, sources
npm run ep -- render demo    # out/demo/demo.mp4 and out/demo/publish.txt
```

`check` must have no errors to render. Read its warnings: short shots, sound effects that would stack, an episode
over the length target, unverified sources.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cue "@word": word ... not found` | The cue word must be spoken in that scene's `vo`. Match spelling without punctuation; hyphens are kept, apostrophes dropped (`couldn't` becomes `couldnt`). Use `@word#2` for the second occurrence. |
| `sfx file "sfx-x.mp3" not found` | Run `npm run audio:sfx`, or add your own `public/audio/sfx-x.mp3`. |
| Render fails when moving the file on Windows | The previous video is open in a player. Close it or use `--name=other`. |
| Subtitles hard to read | Keep art out of the subtitle zone (y >= 1440 of 1920). |
| Studio shows a blank frame | You are on a composition without timings: run `ep draft <id>` or `ep voice <id>`. |
