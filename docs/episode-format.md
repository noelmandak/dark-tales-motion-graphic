# Episode format reference

An episode is one JSON file, `public/episodes/<id>/episode.json`. The authoritative schema is the TypeScript types in
[`src/engine/types.ts`](../src/engine/types.ts); `npm run ep -- lint <id>` checks a file against the rules below.

## Episode fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Must equal the folder name. Lowercase letters, numbers and dashes. |
| `title` | yes | Working title. |
| `look` | no | `night` (default), `manuscript`, `casefile` or `poster`. Decides which shot types are allowed. |
| `lang` | no | Narration language code (`"en"`, `"id"`, ...). Selects `ELEVENLABS_VOICE_ID_<LANG>`. See [localization.md](localization.md). |
| `brandText` | no | Overrides `name`, `watermark`, `tagline`, `ctaButton`, `ctaQuestion` from `brand.json`. |
| `voice` | no | `{"voiceId": "..."}` pins the narrator for this episode. |
| `keywords` | no | Words highlighted in the subtitles (compared lowercase, punctuation stripped). Use a handful per episode. |
| `displayReplace` | no | Map spoken word to displayed text in the subtitles, e.g. `{"seventeen-nineties": "1790s"}`. |
| `scenes` | yes | Usually five (hook, problem, escalation, twist, outro): `{id, vo, shots[], sfx[]}`. |
| `meta` | yes | `title`, `description`, `hashtags[]`, `sources[]` (`{claim, source, verified, note?}`). Feeds `publish.txt`. |

Scene fields: `id` (e.g. `s1`), `vo` (the narration text), `shots` (the first must start at `0`, in time order), `sfx`
(`[{"at": cue, "file": "stamp", "vol": 0.4}]`).

A scene looks like:

```json
{"id": "s2", "vo": "His name was Tarrare. ...",
 "shots": [ {"at": 0, "type": "idcard", ...}, {"at": "@doctors -0.1", "type": "scene", ...} ],
 "sfx":   [ {"at": "@reportedly", "file": "plate-clink", "vol": 0.35} ]}
```

A shot lasts from its `at` until the next shot's `at` (the last one runs to the end of the scene). Shots crossfade automatically.

## Cues (timing)

Anywhere a time is needed (`at`, `from`, `to`, chip `at`, ...) use:

| Cue | Meaning |
|---|---|
| `2.5` | 2.5 seconds after the scene starts |
| `"@word"` | when the first "word" is spoken (lowercase; punctuation stripped; hyphens kept; apostrophes dropped: `@couldnt`) |
| `"@word#2"` | the second time it is spoken |
| `"@word -0.3"` | 0.3 s before the word (use `+` for after) |

Prefer word cues: they survive re-recording. A cue that can't be found fails `npm run ep -- check`.

## Canvas

1080 x 1920, vertical. Reserved zones: **y 0-120** nothing important; **y ≥ 1440** subtitles (keep art clear of it; ground bands may extend under it); watermark bottom-right. `x` runs 0-1080, centre 540.

Colour names for `color`/`dot`/`accent`: `gold`, `red`, `cream`, `rim` (or any CSS colour).

## Shot types

### `globe` — place/time opener
`{"at": 0, "type": "globe", "label": "FRANCE · 1790s"}`. A globe locks onto a marker with the location tag on top. Best for the first shot.

### `idcard` — introduce a person
`{"type": "idcard", "name": "Pierre Percy", "sub": "MILITARY SURGEON", "hat": "tricorn", "label": "FRANCE · 1790s"}`. A hanging ID card with a duotone portrait. `hat`: `shako|tricorn|cap|mitre|none` (`mitre` = pope/bishop). `"zoom": true` pushes in tight on the face; `"wide": true` gives a wide mouth (a Tarrare-specific trait; avoid unless the story calls for it).

### `scene` — the workhorse
```json
{"type": "scene", "backdrop": "barracks", "tint": "warm", "push": [1, 1.08], "origin": [540, 1000],
 "people": [{"x": 560, "s": 0.95, "hat": "shako", "accent": "red", "belly": 0.7, "arm": "up", "flip": true,
             "enter": {"dx": 220, "delay": 4, "dur": 36, "walk": true}}],
 "chips":  [{"at": "@fifteen", "text": "A FEAST FOR 15 MEN", "y": 520, "color": "gold", "dot": true, "size": 40}],
 "stamps": [{"at": "@secret", "text": "SECRET WEAPON", "size": 60, "rot": -8}],
 "marks":  [{"kind": "q", "at": "@idea", "x": 700, "y": 720}]}
```
- `backdrop`: `none`, `ground` (flat ground, default), `barracks` (moonlit columned building + tree), `hospital` / `basilica` (columned building with a cross: a hospital or a church), `court` (two tiers of clerics + an empty throne; put a `tilt`ed person on it for a seated corpse), `river` (night water with moving waves), `field` (tents at night, red tint), `room` (window + bed), `tiers` (rows of figures; `rows`, `hat`, `accent`, `dim`, `baseY`), `table` (table with 15 plates; `platesIn`/`platesOut` cue pairs make plates appear/vanish).
- `tint`: `blue` (default) / `warm` / `red` (tension). `moon: true` adds a moon. `groundTint` recolours the ground.
- `people`: silhouettes. `x` required; `y` defaults to the backdrop's ground line; `s` scale (~1.0 is 770 px tall); `belly` 0-1 glowing stomach (or `bellyRamp: [cue, cue]`); `arm`: `down|up|out`; `flip` mirrors; `tilt` rotates around the feet (degrees); `enter` slides in from `x - dx`.
- `chips` (pill labels), `stamps` (slammed stamps), `marks` (see below). Chip `y` defaults to 520 + 100 per chip.
- `marks`: `q` / `!` (floating bubble, `x`,`y`), `bulb` (idea), `pin` (map pin with `label`, `pulse`), `gauge` (`label`, optional `to` cue: a bar filling to 100%), `cat` (a cat walks across, `y`, `dur` frames).

### `map` — route on a stylised map
`{"type": "map", "draw": ["@deliver +0.4", "@lines +0.3"], "pin": {"at": "@colonel +0.5", "label": "COLONEL"}, "location": {"at": "@behind", "text": "BEHIND PRUSSIAN LINES"}}` draws a gold dotted route from Paris to a pin. `labels` (`{"france","prussia","paris"}`) localises the place names. `{"type": "map", "stopAt": 0.66}` freezes the route at the border and draws a red X (a mission failing). The geometry (France/Prussia) is fixed and abstract; a new geography needs a new map in `src/engine/kit.tsx`.

### `paper` — a document with a stamp
`{"type": "paper", "lines": 7, "stamp": {"at": "@total", "text": "MISSION FAILED", "size": 70, "rot": -10}}`.

### `sketch` — a parchment drawing that draws itself
`"strokes": [{"d": "<SVG path in paper coordinates, centre 0,0, ±380 x ±530>", "from": cue, "to": cue}]`, optional `ghosts` (dashed reference outlines), `labels` (handwritten captions, optional `underline`), `chips`. Used for the autopsy; reusable for diagrams.

### `object` — a single hero object
`{"type": "object", "kind": "box", "cues": {"letterIn": cue, "lid": cue, "seal": cue}, "chips": [...]}` (a letter slides into a sealed box) or `{"kind": "fork", "cues": {"in": cue}}` (a glowing golden fork). Add kinds in `library.tsx`.

### `cta` — closing card
`{"at": "@follow", "type": "cta"}`; text comes from `brand.json`. Always the last shot of s5.

### `folio`: manuscript look (use only when `"look": "manuscript"`)
```json
{"at": "@then", "type": "folio", "chapter": "I · THE EXHUMATION", "bg": "arcade",
 "art": [{"kind": "throne", "x": 540, "y": 1240, "s": 1.05},
         {"kind": "cleric", "x": 540, "y": 1204, "robe": "white", "mitre": true, "dead": true, "seated": true, "tilt": -4},
         {"kind": "cleric", "x": 190, "y": 1240, "s": 0.9, "robe": "blue", "arm": "point"}],
 "stamps":  [{"at": "@trial", "text": "ON TRIAL", "y": 380, "size": 66}],
 "banners": [{"at": "@stephen", "text": "POPE STEPHEN VI", "y": 300, "size": 50, "color": "gold"}]}
```
The page is a parchment folio at x 60-1020, y 170-1370 (leave y ≥ 1440 for subtitles; the chapter heading sits above it). Ground line for figures is about y 1230-1250. Put the same `chapter` on every folio of a scene (one per beat, Roman numeral + title).
- `bg`: `plain` (parchment + faint rays), `arcade` (Romanesque arches), `sky` (lapis sky, moon, hills; `"tone": "blood"` for a red sky), `cell` (stone wall).
- `stamps`: ink stamps (`color`: red default, `gold`, `cream` for dark backgrounds). `banners`: ribbons for names and facts (`color`: gold/red/cream). Both are cued by words.
- `"cta": true` draws the closing card from brand.json; always the last folio, cued on "Follow".
- `art` kinds (drawn in order, each pops in at its `at` cue or in sequence): `cleric` (`robe` red/blue/green/white/black/brown/plum/gold/grey, `mitre`, `halo`, `arm` rest/point/raise/hold, `hold` scroll/quill/shovel/torch, `dead`, `seated`, `tilt`, `flip`, `s`), `throne`, `tomb`, `medallion` (bust in a roundel; `name`, `robe`), `doc` (scroll; `title`, `lines`, `redLines`, `w`, `h`), `seal`, `hand` (ink-drawn, `from`/`to`/`cut` cues), `waves` + `bridge` + `bundle` (river), `crowd`, `bars`, `church`, `bier`, `coffinban` (a coffin with a prohibition sign), `book`, `books`, `initial` (illuminated letter).
- Add a new art kind in `src/engine/manuscript.tsx` (component + `renderArt` case) when a story needs one.

### `board`: casefile look (use only when `"look": "casefile"`)
```json
{"at": "@every -0.1", "type": "board", "tab": "I · FOUND",
 "items": [
   {"kind": "photo", "id": "c", "subject": "clothes", "x": 340, "y": 780, "rot": -4, "s": 1.05, "caption": "suit and tie"},
   {"kind": "card", "id": "t", "x": 780, "y": 1085, "rot": 3, "at": "@label", "title": "EVIDENCE", "lines": ["LABEL REMOVED", "NO ID"]}],
 "strings": [{"from": "c", "to": "t", "at": "@removed"}],
 "stamps":  [{"at": "@who", "text": "UNIDENTIFIED", "y": 1240, "size": 66}]}
```
A cork board seen straight on; items are pinned in at their `at` cue (or in sequence), centred at `x`,`y` (keep y between about 260 and 1350; subtitles own y ≥ 1440). The `tab` is the chapter label on a manila folder tab. Every cut fires a camera flash. Use the same `tab` on every shot of a scene.
- `photo`: polaroid; `subject` is one of `beach`, `clothes`, `unknown` (silhouette with ?), `pocket`, `book`, `code` (scribbled lines, deliberately not real letters), `dna`, `mask`; optional `caption`.
- `card`: index card; optional `title` (red), `lines` (typed one after another), `redact`: indexes of lines to black out after typing.
- `clipping`: newspaper clipping with a short `headline` (about 20 characters at most). `scrap`: torn paper with typed `text`.
- `strings`: red string between two items by `id`, drawn at the cue. `stamps`: stencil stamps (`color`: red default, `green`, `navy`). `focus` sets the zoom origin. `"cta": true` draws the brand closing folder.
- Cards and polaroids are about 560 and 400 px wide at s = 1: keep neighbours from overlapping captions and titles.
- New photo subjects go in `Picto` in `src/engine/casefile.tsx`.

### `poster`: poster look (use only when `"look": "poster"`)
```json
{"at": "@refused -0.1", "type": "poster", "bg": "cream", "layout": "diag", "tab": "I · THE CITY",
 "art":   [{"kind": "crate", "x": 540, "y": 1010, "s": 1.25, "text": "GRAIN"}, {"kind": "wheat", "x": 380, "y": 700, "s": 0.8, "rot": -8}],
 "words": [{"text": "A vault of grain", "at": "@vault", "x": 540, "y": 330, "size": 120, "color": "navy"},
           {"text": "REFUSED", "at": "@refused", "x": 540, "y": 1240, "size": 140, "bar": "red"}]}
```
- `bg`: `cream`, `red`, `navy`. `layout` (decor blocks in the opposite colour): `diag`, `burst`, `split`, `frame`, `plain`. `tab`: black chapter bar top-left. `snow: true` adds falling snow.
- `words`: kinetic type that slams in at its cue, uppercase Impact; `size` ~100-340, `color` navy/cream/red/gold, `bar` (a coloured block behind the text). Keep headlines to 1-3 short words per line and space lines by about 1.3 x the larger size so bars do not overlap. A text width is about 0.5 x size per character: keep it under 960 px.
- `art` kinds: `skyline`, `beams` (searchlights), `wheat`, `crate` (`text`), `figure` (`pose` stand/slump), `clock`, `bust` (`text` label), `bars` (prison), `sprout`, `star`. All take `x`, `y`, `s`, `color`.
- `"cta": true` draws the closing poster from brand.json, cued on "Follow".
- Colour contrast: on a `split` layout the left side is the decor colour, so choose text colours that read on both halves (navy works on cream and cream on red/navy).

## Recipes by beat

| Beat | Typical shots |
|---|---|
| Hook | `globe` → `scene` (the impossible thing) → `scene`/`stamp` (the stakes) |
| Problem | `idcard` → close-up `scene` → what's wrong, with a `gauge` or `chip` |
| Escalation | `scene` with two people + chips → `object` / `map` for the plan |
| Twist | `map stopAt` or `paper` + stamp → `scene` (aftermath) → `sketch` / `object` reveal |
| Outro | `scene` with question chips → `tiers` (people arguing) → `scene` (the loss) → `cta` |

Aim for 4-6 shots per scene; keep shots ≥ 1.0 s (the checker warns below that).
