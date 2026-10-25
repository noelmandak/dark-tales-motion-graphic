/**
 * Dark Tales episode format. An episode is plain JSON (public/episodes/<id>/episode.json);
 * the renderer turns it into a video using the shot library in library.tsx.
 *
 * Timing: every `at` / cue is either seconds (number, relative to the scene start)
 * or a word cue string: "@word", "@word#2" (2nd occurrence), "@word +0.3" (offset seconds).
 */
export type Cue = number | string;
export type ColorName = "gold" | "red" | "cream" | "rim" | string;
export type Hat = "shako" | "tricorn" | "cap" | "mitre" | "none";

export type ChipSpec = {at: Cue; text: string; x?: number; y?: number; dot?: ColorName | true; color?: ColorName; size?: number};
export type StampSpec = {at: Cue; text: string; x?: number; y?: number; rot?: number; size?: number; color?: ColorName};

export type MarkSpec =
  | {kind: "q" | "!"; at: Cue; x: number; y: number; color?: ColorName}
  | {kind: "bulb"; at: Cue; x: number; y: number}
  | {kind: "pin"; at: Cue; x: number; y: number; label?: string; pulse?: boolean}
  | {kind: "gauge"; at: Cue; label: string; to?: Cue}
  | {kind: "cat"; y: number; dur?: number};

export type PersonSpec = {
  x: number;
  y?: number;
  s?: number;
  hat?: Hat;
  accent?: ColorName;
  arm?: "down" | "up" | "out";
  belly?: number;
  bellyRamp?: [Cue, Cue];
  flip?: boolean;
  /** Rotate around the feet, in degrees (e.g. a slumped figure on a throne). */
  tilt?: number;
  /** Slide in from `x - dx` over `dur` frames (optionally walking legs). */
  enter?: {dx: number; delay?: number; dur?: number; walk?: boolean};
};

export type Backdrop = "none" | "ground" | "barracks" | "hospital" | "basilica" | "field" | "room" | "tiers" | "table" | "court" | "river";

export type SceneShot = {
  type: "scene";
  backdrop?: Backdrop;
  tint?: "blue" | "red" | "warm";
  push?: [number, number];
  origin?: [number, number];
  moon?: boolean;
  groundTint?: string;
  people?: PersonSpec[];
  chips?: ChipSpec[];
  stamps?: StampSpec[];
  marks?: MarkSpec[];
  // tiers
  rows?: number;
  hat?: Hat;
  accent?: ColorName;
  dim?: number;
  baseY?: number;
  // table
  platesIn?: [Cue, Cue];
  platesOut?: [Cue, Cue];
};
export type GlobeShot = {type: "globe"; label: string};
export type IdCardShot = {type: "idcard"; name: string; sub: string; hat?: Hat; wide?: boolean; zoom?: boolean; label?: string};
export type MapShot = {
  type: "map";
  /** Localised place names drawn on the map (defaults: FRANCE, PRUSSIA, Paris). */
  labels?: {france?: string; prussia?: string; paris?: string};
  draw?: [Cue, Cue];
  stopAt?: number;
  x?: Cue;
  pin?: {at: Cue; label?: string};
  location?: {at: Cue; text: string};
  chips?: ChipSpec[];
};
export type PaperShot = {type: "paper"; lines?: number; stamp?: StampSpec; chips?: ChipSpec[]};
export type SketchShot = {
  type: "sketch";
  title: string;
  strokes: {d: string; from: Cue; to: Cue}[];
  ghosts?: {d: string; at: Cue}[];
  labels?: {at: Cue; x: number; y: number; text: string; underline?: [number, number]}[];
  chips?: ChipSpec[];
};
export type ObjectShot = {type: "object"; kind: "box" | "fork"; cues?: Record<string, Cue>; chips?: ChipSpec[]};
export type CtaShot = {type: "cta"};

/** Items you can place on a manuscript folio. See references/shot-vocabulary.md for each kind's options. */
export type ArtItem = {
  kind: string;
  at?: Cue;
  x?: number;
  y?: number;
  s?: number;
  flip?: boolean;
  robe?: string;
  mitre?: boolean;
  halo?: boolean;
  arm?: "rest" | "point" | "raise" | "hold";
  hold?: "scroll" | "quill" | "shovel" | "torch";
  dead?: boolean;
  seated?: boolean;
  tilt?: number;
  name?: string;
  text?: string;
  size?: number;
  color?: string;
  letter?: string;
  w?: number;
  h?: number;
  rot?: number;
  lines?: number;
  title?: string;
  redLines?: number[];
  from?: Cue;
  to?: Cue;
  cut?: Cue;
};
export type FolioShot = {
  type: "folio";
  chapter?: string;
  bg?: "plain" | "arcade" | "sky" | "cell";
  tone?: "parchment" | "blood";
  /** Closing card: draws the brand name, Follow button and question from brand.json. */
  cta?: boolean;
  art: ArtItem[];
  stamps?: StampSpec[];
  banners?: {at: Cue; text: string; x?: number; y?: number; size?: number; color?: "gold" | "red" | "cream"}[];
};

/** Casefile look: things pinned to an investigator's cork board. */
export type BoardItem = {
  kind: string; // photo | card | clipping | scrap
  id?: string;
  at?: Cue;
  x?: number;
  y?: number;
  rot?: number;
  s?: number;
  subject?: string; // photo: beach | clothes | unknown | pocket | book | code | dna | mask
  caption?: string;
  title?: string; // card
  lines?: string[]; // card (typed one by one)
  redact?: number[]; // card: line indexes that get blacked out after typing
  headline?: string; // clipping
  text?: string; // scrap
};
export type BoardShot = {
  type: "board";
  tab?: string;
  items: BoardItem[];
  strings?: {from: string; to: string; at: Cue}[];
  stamps?: StampSpec[];
  focus?: [number, number];
  cta?: boolean;
};

/** Poster look: constructivist-style printed posters with kinetic type. */
export type PosterWord = {text: string; at?: Cue; x?: number; y?: number; size?: number; color?: string; bar?: string; rot?: number};
export type PosterArt = {
  kind: string; // skyline | beams | wheat | crate | figure | clock | bust | bars | sprout | star
  at?: Cue;
  x?: number;
  y?: number;
  s?: number;
  rot?: number;
  color?: string;
  text?: string;
  pose?: "stand" | "slump";
};
export type PosterShot = {
  type: "poster";
  bg?: "cream" | "red" | "navy";
  layout?: "diag" | "burst" | "split" | "frame" | "plain";
  tab?: string;
  snow?: boolean;
  art?: PosterArt[];
  words?: PosterWord[];
  cta?: boolean;
};

/** Collage look: archival images cut out and pasted like stop-motion paper collage. */
export type CollageItem = {
  kind: string; // image | ransom | marker | label
  at?: Cue;
  x?: number;
  y?: number;
  rot?: number;
  s?: number;
  // image
  src?: string; // id in public/collage/manifest.json (add images with `npm run assets`)
  w?: number; // display width (px); height follows the image unless `h` crops it
  h?: number;
  focus?: [number, number]; // crop focus point, 0..1
  zoom?: number; // crop zoom, 1 = fit
  tint?: "duotone" | "sepia" | "none";
  tape?: boolean;
  caption?: string;
  drift?: [number, number]; // px per second
  // ransom / label / marker
  text?: string;
  size?: number;
  color?: string;
  shape?: "circle" | "arrow" | "underline" | "cross";
};
export type CollageShot = {
  type: "collage";
  bg?: "kraft" | "newsprint" | "navy";
  tab?: string;
  items: CollageItem[];
  stamps?: StampSpec[];
  cta?: boolean;
};

export type Shot = {at: Cue} & (SceneShot | GlobeShot | IdCardShot | MapShot | PaperShot | SketchShot | ObjectShot | CtaShot | FolioShot | BoardShot | PosterShot | CollageShot);
export type SfxCue = {at: Cue; file: string; vol?: number};
export type SceneDef = {id: string; vo: string; shots: Shot[]; sfx?: SfxCue[]};

export type Episode = {
  id: string;
  title: string;
  /** Narration language code, e.g. "en" (default) or "id". Informational; the voice-over text decides the language. */
  lang?: string;
  /** Per-episode voice-over voice (ElevenLabs voice id). The ELEVENLABS_VOICE_ID environment variable overrides it. */
  voice?: {voiceId?: string};
  /** Localise the brand strings (closing card, watermark). Missing fields fall back to brand.json. */
  brandText?: {name?: string; watermark?: string; tagline?: string; ctaButton?: string; ctaQuestion?: string};
  /** "night" (default): silhouettes on a night stage, crossfades. "manuscript": illuminated folios that slide like a scroll. "casefile": a cork evidence board with camera-flash cuts. "poster": constructivist printed posters with kinetic type and diagonal wipes. Alternate looks between episodes. */
  look?: "night" | "manuscript" | "casefile" | "poster" | "collage";
  keywords?: string[];
  displayReplace?: Record<string, string>;
  scenes: SceneDef[];
  meta: {
    title: string;
    description: string;
    hashtags: string[];
    sources: {claim: string; source: string; verified: boolean; note?: string}[];
  };
};

export type Word = {text: string; from: number; end: number};
export type Timings = {estimated?: boolean; scenes: Record<string, {voSeconds: number; words: Word[]}>};
