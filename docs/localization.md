# Localization: an episode in another language

The engine is language-agnostic: the narration text decides the language, and cues are the words of that text.
The repo includes Indonesian versions of the four bundled stories (`*-id`) as working examples.

## What to set in `episode.json`

```json
{
  "id": "tarrare-id",
  "lang": "id",
  "brandText": {
    "tagline": "Kisah nyata sejarah, satu bab demi satu bab.",
    "ctaButton": "Ikuti",
    "ctaQuestion": "Cerita gelap apa selanjutnya?"
  },
  "voice": {"voiceId": "<an ElevenLabs voice that speaks the language>"}
}
```

- **`lang`** is informational, but it also selects the per-language voice variable (`ELEVENLABS_VOICE_ID_ID`, `_ES`, ...).
- **`brandText`** overrides the brand strings drawn by the closing card and the watermark (`name`, `watermark`, `tagline`, `ctaButton`, `ctaQuestion`). Missing fields fall back to `brand.json`.
- **`voice.voiceId`** (optional) pins the narrator for this episode. Use a voice that actually speaks the language; a multilingual model will read other languages with an accent.

## Rules of thumb

1. **Write the narration natively, not word for word.** Keep the facts, hedges ("reportedly", "konon") and the structure; let the sentences breathe in the new language.
2. **Re-do the cues.** Cues are words in the narration, so a translated episode needs its own cue words. `npm run ep -- lint <id>` tells you instantly if a cue word is not in the text.
3. **Translate everything on screen:** chips, stamps, banners, tab and chapter labels, captions, name cards, map labels (`labels` on a `map` shot: `{"france": "...", "prussia": "...", "paris": "..."}`).
4. **Spell out numbers you need pronounced a specific way**, for example years, and check the first recording by ear.
5. **Expect longer audio.** Some languages run 20-25% longer than English at the same content (Indonesian did). Trim the script if the episode goes over `limits.maxSeconds`.
6. **Keep keywords lowercase** and matching the displayed words; they are compared after stripping punctuation.
7. **Text width:** longer words in some languages need smaller `size` values on chips and poster words. Preview with `ep draft` before recording.
8. **Facts do not translate themselves:** keep `meta.sources` (claims can be written in your language) and keep the verification discipline.

## Per-language voices in `.env`

```
ELEVENLABS_VOICE_ID=<default voice>
ELEVENLABS_VOICE_ID_ID=<Indonesian voice>
ELEVENLABS_VOICE_ID_ES=<Spanish voice>
```

An episode with `"lang": "id"` uses `ELEVENLABS_VOICE_ID_ID` if set. The full priority list is in [audio-and-assets.md](audio-and-assets.md).
