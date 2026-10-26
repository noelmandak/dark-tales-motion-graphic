import {createContext, useContext} from "react";
import BRAND from "../brand/brand.json";
import type {Cue, EpisodeTheme} from "./types";

/** Per-shot timing environment: resolves cues to scene-seconds, knows where the shot starts and how early it begins (`pad` frames). */
export const ShotEnv = createContext<{resolve: (c: Cue) => number; start: number; pad: number}>({resolve: (c) => Number(c), start: 0, pad: 4});

/** Cue -> frame inside the current shot. */
export const useCue = () => {
  const {resolve, start, pad} = useContext(ShotEnv);
  return (c: Cue) => Math.round((resolve(c) - start) * 30) + pad;
};

/** Brand strings that can be localised per episode (episode.brandText overrides these). */
export type BrandText = {name: string; watermark: string; tagline: string; ctaButton: string; ctaQuestion: string};
export const DEFAULT_BRAND_TEXT: BrandText = {
  name: BRAND.name,
  watermark: BRAND.watermark,
  tagline: BRAND.tagline,
  ctaButton: BRAND.cta.button,
  ctaQuestion: BRAND.cta.question,
};
export const BrandTextCtx = createContext<BrandText>(DEFAULT_BRAND_TEXT);
export const useBrandText = () => useContext(BrandTextCtx);

/** Per-episode theme (client brand). Empty means the Dark Tales brand. */
export const ThemeCtx = createContext<EpisodeTheme>({});
export const useTheme = () => useContext(ThemeCtx);
