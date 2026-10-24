# Audio and assets

## What is in the repo, and what is not

| In the repo | Not in the repo (git-ignored) |
|---|---|
| Episode scripts (`public/episodes/*/episode.json`) | Voice-overs: `public/episodes/<id>/vo-<scene>.mp3` and `.json` |
| All visuals (vector code) | `public/episodes/<id>/timings.json` (derived from the voice-over) |
| Generators for audio (`scripts/`) | Sound effects and music: `public/audio/*` |
| | Rendered videos: `out/` |

The audio is generated rather than committed because AI-generated audio comes with terms that depend on **your
provider plan** (for example attribution or commercial-use rules) and on **the voice you choose** (voices from a
library have their own licences). Each person should generate their own under their own plan. If your plan allows
redistribution and you want to publish yours, you can remove the relevant lines from `.gitignore`.

## Generating audio

All of this needs Node and (for ElevenLabs) an API key in `.env` (see [`.env.example`](../.env.example)).

| Need | Command | Cost |
|---|---|---|
| Voice-over for an episode | `npm run ep -- voice <id>` | ElevenLabs credits |
| 12 shared sound effects | `npm run audio:sfx` | ElevenLabs credits |
| Music bed, richer | `node scripts/generate-audio.mjs bgm` (then set `audio.bgmFile` to `audio/bgm.mp3` in `brand.json`) | ElevenLabs credits |
| Music bed, free and original | `npm run audio:bgm` (writes `public/audio/bgm-local.wav`, the default `audio.bgmFile`) | free, no key |

Existing files are skipped; add `--force` to regenerate (and pay again).

The sound-effect names are used by episodes (`{"at": "@word", "file": "stamp"}`):
`bass-hit`, `stomach-growl`, `plate-clink`, `ticking`, `swallow`, `whoosh`, `stamp`, `fail-thud`, `quill-scratch`,
`gold-ting`, `drone`, `footsteps`. Prompts live in [`scripts/generate-audio.mjs`](../scripts/generate-audio.mjs).
You can add your own: drop `public/audio/sfx-<name>.mp3` in place and use `<name>` in an episode.

## Choosing a voice

Priority: the episode's `voice.voiceId`, then `ELEVENLABS_VOICE_ID_<LANG>` (for an episode with `"lang": "id"`, that is `ELEVENLABS_VOICE_ID_ID`), then `ELEVENLABS_VOICE_ID`, then `voice.voiceId` in `brand.json`.
Voice settings (model, stability, similarity, style) are in `brand.json`. The CLI prints which source supplied the
voice but never the id or the key.

## Using your own narration or another provider

The engine only needs, per scene, an audio file `vo-<scene>.mp3` and an alignment file `vo-<scene>.json` in
ElevenLabs' character format:

```json
{"characters": ["H", "i", " ", "..."],
 "character_start_times_seconds": [0.0, 0.1, 0.2, "..."],
 "character_end_times_seconds":   [0.1, 0.2, 0.3, "..."]}
```

Put those two files in `public/episodes/<id>/` and run `npm run ep -- timings <id>` to build `timings.json`. Any
tool that can produce word or character timings (a forced aligner, another TTS API) can feed it. To switch
provider for generation, change the `voice()` function in `scripts/episode.mjs`.

## The sound-design rules

These are enforced by `npm run ep -- check` and the renderer, with the values in `brand.json` (`audio`):

- The voice leads; the music bed sits well under it (`bgmVolume`, default 0.2).
- Sound effects are rare and soft: capped at `sfxMaxVolume`; any cue within `sfxMinGap` seconds of the previous one is dropped (so effects cannot pile up).
- Use effects only for beats that earn them (a hit on the opening, a stamp, a reveal).

## Music: staying clean

Describe music **by mood only** in prompts; never name an artist or a song. The local generator
(`scripts/make-bgm.mjs`) composes a short ambient piece from scratch with simple synthesis: no samples, nothing copied.
If you use someone else's music, make sure you hold the licence for it.
