# The collage look and image licensing

The `collage` look cuts archival images out with torn edges and pastes them onto kraft paper or newsprint, then
animates them like stop-motion: pieces snap in at 10 fps and jitter slightly, ransom-note headlines assemble letter by
letter, and a red marker circles what matters. Shots change with a torn-paper wipe.

It is the only look that uses **third-party images**, so it comes with a small toolchain that keeps the
licensing of those images honest.

## How it works

1. You find images on **Wikimedia Commons** with `npm run assets -- search "..."`. The tool shows each file's licence.
2. `npm run assets -- add "File:Name.jpg" my-id` downloads a resized copy to `public/collage/my-id.jpg` and writes
   its **provenance** to `public/collage/manifest.json` (title, creator, licence, source URL, credit line, date retrieved).
3. An episode references the image by id: `{"kind": "image", "src": "my-id", ...}`.
4. `npm run ep -- lint` fails if an episode uses an id that is not in the manifest, has no licence/source, or whose file is missing.
5. `render` writes an **IMAGE CREDITS** section into `publish.txt` with the credit line of every image used.

```bash
npm run assets -- search "Piranesi Castel Sant'Angelo"
npm run assets -- add "File:Jean Paul Laurens Le Pape Formose et Etienne VI 1870.jpg" laurens-formosus-stephen
npm run assets -- list
npm run assets -- credits cadaver-synod-collage
```

## The licensing rules the tool enforces

- **Source:** Wikimedia Commons only. Its API states each file's licence and author, which is what the tool records.
- **Accepted by default:** public domain and CC0. These need no credit (the credit line is still recorded and listed).
- **Refused by default:** everything else, including all-rights-reserved and "unknown".
- **`--allow-attribution`:** also accepts CC BY and CC BY-SA. The entry is marked `attributionRequired`, `lint` warns, and the credit
  goes into `publish.txt`: you must keep it in your video description. CC BY-SA may carry share-alike obligations for the derived work; read the licence.
- **Never:** images from search engines, social media, stock sites you have not licensed, or screenshots of other people's videos.

### Things the tool cannot decide for you

- It trusts **Commons' own determination**. Public-domain status can differ between countries (for example, a work can be public domain in the US but not elsewhere). For anything high-stakes, open the recorded `sourceUrl` and judge for yourself. This is not legal advice.
- **People in pictures.** Even when the *image* is free, think about the *person*. Historical figures who died long ago are fine; do not use recognisable images of living people or recent victims, and avoid anything that would identify a private individual.
- **Context.** A free image can still be misleading. Do not present a painting or an allegorical print as a photograph of the event. Captions such as "Danse macabre, Holbein, 1538" keep it honest.
- **Museum scans of public-domain works** are normally also free (CC0 or "Public domain mark"), but check the file page.

### The manifest

```json
{
  "images": {
    "laurens-formosus-stephen": {
      "file": "laurens-formosus-stephen.jpg",
      "title": "Pope Formosus and Stephen VI (The Cadaver Synod)",
      "creator": "Jean-Paul Laurens",
      "date": "1870",
      "license": "Public domain",
      "attributionRequired": false,
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:...",
      "credit": "... (Public domain), via Wikimedia Commons",
      "width": 1400, "height": 930, "retrieved": "2026-10-25"
    }
  }
}
```

Images are stored at up to 1400 px wide (`--width=` changes that). Commit the manifest and the images with the episode that uses them.

## Shot reference: `collage`

```json
{"at": "@then", "type": "collage", "bg": "kraft", "tab": "I · THE EXHUMATION",
 "items": [
   {"kind": "image", "src": "laurens-formosus-stephen", "x": 540, "y": 820, "w": 1000, "rot": -1.5, "tint": "none", "tape": true, "at": 0},
   {"kind": "marker", "shape": "circle", "x": 710, "y": 665, "w": 170, "h": 200, "at": "@him"},
   {"kind": "ransom", "text": "ON TRIAL", "x": 540, "y": 1230, "size": 170, "at": "@trial"}],
 "stamps": [{"at": "@trial", "text": "GUILTY", "y": 700}]}
```

- `bg`: `kraft` (brown paper), `newsprint` (cream with faint text columns), `navy`. `tab`: a torn paper strip top-left (chapter label). `"cta": true`: the closing card from `brand.json`.
- Items are placed on the 1080x1920 canvas at `x`,`y` (the item's centre); keep y between about 260 and 1330 (the bottom is a scrim under the subtitles). `rot` rotates, `s` scales, `at` is a cue (a bare number is seconds; default is a short stagger).
- **`image`**: `src` (a manifest id), `w` (display width, default 700), `h` (crops the height), `focus` `[0..1, 0..1]` and `zoom` to crop to a detail (for example `"focus": [0.68, 0.45], "zoom": 2` on a figure), `tint` (`duotone` default, `sepia`, `none` for full colour), `tape`, `caption`, `drift` (`[dx, dy]` px per second).
- **`ransom`**: a headline assembled from scraps in different papers and typefaces. `text`, `size` (long words shrink automatically to fit), `rot`.
- **`marker`**: a hand-drawn mark: `shape` `circle` (default), `arrow`, `underline`, `cross`; `w`, `h`, `rot`, `color` (`red` default, `gold`, `ink`). Draws on at its cue.
- **`label`**: typed text on a torn strip of paper. `text`, `size`, `color` (`red`, `gold`, paper by default).
- Stop-motion feel: movement happens every third frame. Everything is deterministic (seeded by the item), so renders are repeatable.
- Locating a detail: open the image in `public/collage/`, estimate the point as a fraction of its width/height for `focus`, and the on-canvas position for markers as `x = left + fx * w`, `y = top + fy * h` where `left = x - w/2` and `top = y - h/2` of the image item.

## Design tips

- One hero image per shot, plus one headline and at most one marker. Collage works because there is room.
- Alternate colour (`tint: none`) for the single most important image and duotone for supporting ones.
- Use tape on images and keep rotations between -6 and 6 degrees so it feels cut by hand, not scattered.
- Pair a headline with the cue word it is about, as in every other look.

## Example

`cadaver-synod-collage` retells the Cadaver Synod with public-domain art: Laurens' 1870 painting, Holbein's *Dance of Death*, Piranesi's views of Rome, and Morin's memento mori. It reuses the narration of `cadaver-synod`, so you can compare the `manuscript` and `collage` treatments of the same audio. `npm run assets -- credits cadaver-synod-collage` lists every credit.
