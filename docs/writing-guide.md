# Writing guide: script structure and fact-checking

How to write an episode that works as a short-form video and stays honest. The CLI enforces some of this (`npm run ep -- check`); the rest is craft.

---

## Part 1: The five beats

One episode = five scenes (`s1`..`s5`), one per beat. About 130-170 spoken words in total, which lands at 60-70 seconds with ElevenLabs at its default pace. Tarrare (`public/episodes/tarrare/episode.json`) is the worked example.

| Beat | Scene | Words | Job |
|---|---|---|---|
| Hook | s1 | 20-30 | Stop the scroll: where, when, and one impossible-sounding fact. Must end with a question the viewer needs answered. |
| Problem | s2 | 35-45 | Introduce the person and what is wrong. One concrete, visual detail. |
| Escalation | s3 | 35-45 | The stakes rise. A plan, an experiment, a decision that makes things worse. |
| Twist | s4 | 45-65 | The turn nobody expects, with the key facts. This is the longest beat. |
| Outro | s5 | 25-35 | What it means / what historians still argue about, then the CTA line. |

## Writing for the ear

- Short sentences. One idea each. Read it aloud; if you run out of breath, split it.
- Numbers as words ("seventeen-nineties", "twenty-six"); the screen can show digits.
- Concrete before abstract: "he swallowed a wooden box" beats "he performed unusual feats".
- Hedge honestly in the narration: "reportedly", "some say", "accounts differ". This makes the story more credible, not less.
- The twist should *reframe*, not just shock. Ask: what does the viewer now understand differently?
- No gore. Imply, don't depict ("the autopsy found a throat unnaturally wide", not a description of the body).
- Avoid "Little did he know", "You won't believe", and other clichés; they read as clickbait and the audience can smell it.

## Hook formulas that work for this format

- **Impossible fact:** "In 1790s France, one soldier could eat a live cat." (place + year + a fact that sounds wrong)
- **Reversal:** "The man who saved thousands of lives was hanged for it."
- **Quiet dread:** "Nobody in the village left. That was the plan."
Pair the first line with a visual that names the place and year (`globe` or `idcard`).

## Outro

Two parts: a closing thought (the lingering question, or what the story says about us), then exactly "Follow for the next dark true story." The `cta` shot is cued on the word "Follow".

## Metadata (episode.json `meta`)

- **Title:** the strangest fact, plain words, "(True Story)" suffix is fine. Under ~60 characters.
- **Description:** 1-2 sentences, no spoilers of the twist.
- **Hashtags:** 5-6; always `#darkhistory #truestory #history`, then 2-3 topical.
- **Sources:** one entry per factual claim: see `fact-check.md`.

---

## Part 2: Fact-check protocol

Dark-history videos get shared and then fact-checked in the comments. Every claim in the narration needs a source you actually read, or it must be hedged.

## Steps

1. **List every factual claim** in the draft narration: names, dates, places, numbers, causes, quotes, "first/only/never".
2. **Find sources.** Use WebSearch/WebFetch. Prefer, in order: primary accounts or contemporary records; academic papers and university presses; major reference works (Britannica, national archives, museum sites); reputable journalism. Treat Wikipedia as a map to sources, not a source. Avoid listicle and "creepy facts" sites; they copy each other's errors.
3. **Cross-check.** A claim is *verified* only when two independent sources agree, or one primary source plus a reliable modern secondary source. Retellings that cite each other are one source, not two.
4. **Resolve conflicts.** If sources disagree on a number or detail, either (a) use the value both support, (b) hedge in the narration ("reportedly", "accounts differ"), or (c) drop the claim. Never pick the more dramatic version because it's more dramatic.
5. **Check the famous version.** Many viral history stories are myths or exaggerations. Search "<story> myth" / "<story> debunked" before committing.
6. **Record it** in `meta.sources` of the episode JSON, one object per claim:
   ```json
   {"claim": "...", "source": "Author, Title, Year / URL", "verified": true, "note": "optional caveat"}
   ```
   Set `verified: true` only if *you* read the source in this session. If you couldn't, leave it `false` and say so; `npm run ep -- check` will keep warning until it's resolved.
7. **Tell the user** which claims are verified, which are hedged, and which remain unverified, before rendering. Don't bury this.

## Language that is honest about uncertainty

- Contested detail → "reportedly", "according to one account", "some say".
- Round numbers in old records → "about", "roughly".
- Unknown → say "no one knows" (a good outro line when true).

## Don'ts

- Don't invent sources, page numbers or quotes. If you can't find one, say so.
- Don't mark `verified: true` from memory.
- Don't rely on a single viral article.
