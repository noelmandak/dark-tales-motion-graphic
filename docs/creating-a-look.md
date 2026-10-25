# Creating a shot type or a new look

Two levels of extension:

- **A new shot type inside an existing look** (for example a new `art` kind for `manuscript`, a new photo subject
  for `casefile`, a new backdrop for `night`). Small, local change.
- **A whole new look** (a new visual language with its own shots and transition). A few files.

Read [architecture.md](architecture.md) first.

## A. Add to an existing look

Each look has its vocabulary in one file:

| Look | File | Where to add |
|---|---|---|
| `night` | `src/engine/library.tsx` | a `backdrop` in `SceneView`, a mark kind in `Marks`, or a new shot component + `ShotView` case |
| `manuscript` | `src/engine/manuscript.tsx` | a component and a `case` in `renderArt` |
| `casefile` | `src/engine/casefile.tsx` | a photo subject in `Picto`, or an item kind in `renderItem` |
| `poster` | `src/engine/poster.tsx` | a component and a `case` in `renderArt` |
| `collage` | `src/engine/collage.tsx` | a component and a `case` in `renderItem` (images must go through `npm run assets`) |

Then:

1. If you added a new option the JSON can use, add it to the matching type in `src/engine/types.ts`.
2. Document it in [episode-format.md](episode-format.md).
3. Use it in an episode, run `npm run ep -- lint <id>`, `npm run ep -- draft <id>`, and look at it in `npm run dev`.

Never change how an existing episode renders unless you mean to.

## B. Add a new look

Say you want a look called `blueprint` with a shot type `plan`.

1. **Types** (`src/engine/types.ts`): add the shot type and put it in the `Shot` union, and add `"blueprint"` to the `look` union in `Episode`.

   ```ts
   export type PlanShot = {type: "plan"; title: string /* ...your options... */};
   export type Shot = {at: Cue} & (SceneShot | /* ... */ | PlanShot);
   // look?: "night" | "manuscript" | "casefile" | "poster" | "blueprint";
   ```

2. **The view** (`src/engine/blueprint.tsx`): a React component that draws one shot.

   ```tsx
   import React from "react";
   import {AbsoluteFill, useCurrentFrame} from "remotion";
   import {prog} from "./kit";
   import {useBrandText, useCue} from "./env";
   import type {PlanShot} from "./types";

   export const PlanView: React.FC<{s: PlanShot}> = ({s}) => {
     const f = useCurrentFrame();   // frame inside this shot
     const cf = useCue();           // cue -> frame inside this shot (e.g. cf("@word"))
     const bt = useBrandText();     // localised closing-card text, if you draw one
     return <AbsoluteFill>{/* 1080x1920 svg or html */}</AbsoluteFill>;
   };
   ```

   Conventions: draw on a 1080x1920 canvas; keep y >= 1440 free for subtitles; animate with `prog`, `useSpring` and
   Remotion's `interpolate`; read colours from `brand.json` via `kit.tsx`; support a `cta: true` closing card that uses `useBrandText()`.

3. **Dispatch** (`src/engine/library.tsx`): add `case "plan": return <PlanView s={shot} />;` to `ShotView`.

4. **Transition and pad** (`src/engine/Episode.tsx`): add a `PAD_BLUEPRINT` constant and extend the two lines that
   pick `PAD` and `Wrap` from `look`. Reuse an existing wrapper (`ShotFade`, `ShotSlide`, `ShotCut`, `ShotWipe`) or write a new one;
   a wrapper receives `{duration, pad, first, last, children}`.

5. **Linter** (`scripts/episode.mjs`): add `"plan"` to `SHOT_TYPES` and the `shotTypes` set in `check`, add `"blueprint"` to `LOOKS`, and `blueprint: ["plan"]` to `LOOK_SHOT`.

6. **Docs:** add a section to [episode-format.md](episode-format.md) and a row to the tables in `architecture.md` and the README.

7. **Try it:**

   ```bash
   npm run ep -- new blueprint-test "Blueprint Test"   # then set "look": "blueprint" and add plan shots
   npm run ep -- lint blueprint-test
   npm run ep -- draft blueprint-test && npm run dev
   npm run typecheck
   ```

## Tips

- **Preview many frames at once.** A temporary composition that renders your episode inside scaled divs (each wrapped in
  a `<Sequence from={-frame}>`) gives a contact sheet in one `remotion still`. It is a quick way to review a whole episode.
- **Keep text short** and size it for a phone. Estimate text width as roughly 0.5 x font-size per character for condensed
  display fonts and 0.6 for normal ones.
- **Stay deterministic.** Everything must be a pure function of the frame number; no `Math.random()` at render time
  (seed a small generator instead, as the starfield in `kit.tsx` does).
