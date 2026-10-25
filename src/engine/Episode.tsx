import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import BRAND from "../brand/brand.json";
import {C, SANS, SERIF, ShotCtx, clamp} from "./kit";
import {resolveCue} from "./cue";
import {BrandTextCtx, DEFAULT_BRAND_TEXT, ShotEnv} from "./env";
import {ShotView} from "./library";
import type {Episode, Timings, Word} from "./types";

const FPS = 30;
const PAD_NIGHT = 4; // crossfade overlap frames on each side of a shot
const PAD_MANUSCRIPT = 7; // folios slide over a longer overlap
const PAD_CASEFILE = 3; // hard cuts (with a camera flash inside the shot)
const PAD_POSTER = 5; // diagonal print wipe
const PAD_COLLAGE = 5; // torn-paper reveal

type WrapProps = {duration: number; pad: number; first: boolean; last: boolean; children: React.ReactNode};

export const sceneFrames = (timings: Timings, sceneId: string) =>
  Math.ceil((timings.scenes[sceneId].voSeconds + BRAND.audio.voTail) * FPS);

export const episodeFrames = (episode: Episode, timings: Timings) =>
  episode.scenes.reduce((sum, s) => sum + sceneFrames(timings, s.id), 0);

/** Used by calculateMetadata: fetch the episode definition + its voice timings from public/episodes/<id>/. */
export const loadEpisode = async (id: string): Promise<{episode: Episode; timings: Timings}> => {
  const get = async (name: string) => {
    const res = await fetch(staticFile(`episodes/${id}/${name}`));
    if (!res.ok) throw new Error(`Missing episodes/${id}/${name} (run: npm run ep -- voice ${id})`);
    return res.json();
  };
  const [episode, timings] = await Promise.all([get("episode.json"), get("timings.json")]);
  return {episode, timings};
};

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9-]/g, "");

/** Manuscript look: each folio slides in from the right while the previous slides out to the left, like a scroll. */
const ShotSlide: React.FC<WrapProps> = ({duration, pad, first, last, children}) => {
  const f = useCurrentFrame();
  const ease = (t: number) => t * t * (3 - 2 * t);
  const tin = first ? 1 : ease(interpolate(f, [0, pad * 2], [0, 1], clamp));
  const tout = last ? 0 : ease(interpolate(f, [duration - pad * 2, duration], [0, 1], clamp));
  const fade = first ? interpolate(f, [0, 10], [0, 1], clamp) : 1;
  return (
    <ShotCtx.Provider value={{duration}}>
      <AbsoluteFill style={{transform: `translateX(${(1 - tin) * 1100 - tout * 1100}px)`, opacity: fade}}>{children}</AbsoluteFill>
    </ShotCtx.Provider>
  );
};

/** Poster look: the next poster is revealed by a diagonal wipe. */
const ShotWipe: React.FC<WrapProps> = ({duration, pad, first, children}) => {
  const f = useCurrentFrame();
  const t = first ? 1 : interpolate(f, [0, pad * 2], [0, 1], clamp);
  const x = t * 145;
  const clip = first || t >= 1 ? undefined : `polygon(0 0, ${x}% 0, ${x - 40}% 100%, 0 100%)`;
  const fade = first ? interpolate(f, [0, 6], [0, 1], clamp) : 1;
  return (
    <ShotCtx.Provider value={{duration}}>
      <AbsoluteFill style={{clipPath: clip, opacity: fade}}>{children}</AbsoluteFill>
    </ShotCtx.Provider>
  );
};

/** Collage look: the next shot is revealed by a torn-paper edge sweeping across, in stop-motion steps. */
const TEAR = Array.from({length: 17}).map((_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);
const ShotTear: React.FC<WrapProps> = ({duration, pad, first, children}) => {
  const f = useCurrentFrame();
  const stepped = Math.floor(f / 2) * 2;
  const t = first ? 1 : interpolate(stepped, [0, pad * 2], [0, 1], clamp);
  const x = -12 + t * 135;
  const pts = TEAR.map((j, i) => `${x + (j - 0.5) * 12}% ${(i / (TEAR.length - 1)) * 100}%`).join(", ");
  const clip = first || t >= 1 ? undefined : `polygon(-5% 0, ${pts}, -5% 100%)`;
  const fade = first ? interpolate(f, [0, 6], [0, 1], clamp) : 1;
  return (
    <ShotCtx.Provider value={{duration}}>
      <AbsoluteFill style={{clipPath: clip, opacity: fade}}>{children}</AbsoluteFill>
    </ShotCtx.Provider>
  );
};

/** Casefile look: hard cut; the board itself fires the camera flash. */
const ShotCut: React.FC<WrapProps> = ({duration, first, children}) => {
  const f = useCurrentFrame();
  const o = first ? interpolate(f, [0, 6], [0, 1], clamp) : 1;
  return (
    <ShotCtx.Provider value={{duration}}>
      <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>
    </ShotCtx.Provider>
  );
};

const ShotFade: React.FC<WrapProps> = ({duration, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, PAD_NIGHT + 2, duration - PAD_NIGHT - 2, duration], [0, 1, 1, 0], clamp);
  return (
    <ShotCtx.Provider value={{duration}}>
      <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>
    </ShotCtx.Provider>
  );
};

/* ---------- subtitles: short chunks, spoken words bright, upcoming dim, keywords gold ---------- */
const buildChunks = (words: Word[]) => {
  const chunks: {from: number; to: number; words: Word[]}[] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const end = cur.length >= BRAND.subtitles.maxWords || /[.,?!:]$|\.\.\.$/.test(w.text) || (next && next.from - w.end > 0.45) || !next;
    if (end) {
      chunks.push({from: cur[0].from, to: next ? next.from : w.end + 0.35, words: cur});
      cur = [];
    }
  });
  return chunks;
};

const Subs: React.FC<{words: Word[]; keywords: Set<string>; replace: Record<string, string>}> = ({words, keywords, replace}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const chunks = React.useMemo(() => buildChunks(words), [words]);
  const chunk = chunks.find((c) => t >= c.from - 0.04 && t < c.to);
  if (!chunk) return null;
  const fin = interpolate(t, [chunk.from - 0.04, chunk.from + 0.1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{justifyContent: "flex-start", alignItems: "center", paddingTop: BRAND.subtitles.top, paddingLeft: 90, paddingRight: 90}}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px", textAlign: "center",
          fontFamily: SANS, fontWeight: 700, fontSize: BRAND.subtitles.fontSize, lineHeight: 1.2, opacity: fin,
          transform: `translateY(${(1 - fin) * 14}px)`, textShadow: "0 3px 14px rgba(0,0,0,.85)",
        }}
      >
        {chunk.words.map((w, i) => {
          const key = norm(w.text);
          const shown = replace[key] ? w.text.replace(new RegExp(key, "i"), replace[key]) : w.text;
          return (
            <span key={i} style={{color: keywords.has(norm(shown)) ? C.gold : C.cream, opacity: t >= w.from ? 1 : BRAND.subtitles.dimOpacity}}>
              {shown}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- the episode ---------- */
export const EpisodeVideo: React.FC<{episode: Episode; timings: Timings}> = ({episode, timings}) => {
  const f = useCurrentFrame();
  const total = episodeFrames(episode, timings);
  const end = interpolate(f, [total - 14, total], [1, 0], clamp);
  const brandText = {...DEFAULT_BRAND_TEXT, ...(episode.brandText ?? {})};
  const look = episode.look ?? "night";
  const PAD = look === "manuscript" ? PAD_MANUSCRIPT : look === "casefile" ? PAD_CASEFILE : look === "poster" ? PAD_POSTER : look === "collage" ? PAD_COLLAGE : PAD_NIGHT;
  const Wrap = look === "manuscript" ? ShotSlide : look === "casefile" ? ShotCut : look === "poster" ? ShotWipe : look === "collage" ? ShotTear : ShotFade;
  const keywords = new Set((episode.keywords ?? []).map(norm));
  const replace = Object.fromEntries(Object.entries(episode.displayReplace ?? {}).map(([k, v]) => [norm(k), v]));

  let cursor = 0;
  const scenes = episode.scenes.map((sc) => {
    const frames = sceneFrames(timings, sc.id);
    const words = timings.scenes[sc.id].words;
    const base = cursor;
    cursor += frames;
    const shots = sc.shots
      .map((shot) => ({shot, at: resolveCue(shot.at, words)}))
      .sort((a, b) => a.at - b.at);
    return {sc, frames, words, base, shots};
  });

  // SFX: never stack — drop cues that land within sfxMinGap of the previous kept cue.
  const cues = scenes
    .flatMap(({sc, words, base}) => (sc.sfx ?? []).map((c) => ({t: base / FPS + resolveCue(c.at, words), file: c.file, vol: c.vol})))
    .sort((x, y) => x.t - y.t);
  const sfx: typeof cues = [];
  for (const c of cues) {
    const prev = sfx[sfx.length - 1];
    if (!prev || c.t - prev.t >= BRAND.audio.sfxMinGap) sfx.push(c);
  }

  return (
    <BrandTextCtx.Provider value={brandText}>
    <AbsoluteFill style={{backgroundColor: C.navy0}}>
      <AbsoluteFill style={{opacity: end}}>
        {scenes.map(({sc, frames, base, shots}) =>
          shots.map((s, i) => {
            const startF = base + Math.round(s.at * FPS);
            const endF = i + 1 < shots.length ? base + Math.round(shots[i + 1].at * FPS) : base + frames;
            const from = Math.max(0, startF - PAD);
            const duration = endF + PAD - from;
            return (
              <Sequence key={`${sc.id}-${i}`} from={from} durationInFrames={duration} layout="none">
                <Wrap duration={duration} pad={PAD} first={sc.id === episode.scenes[0].id && i === 0} last={sc.id === episode.scenes[episode.scenes.length - 1].id && i === shots.length - 1}>
                  <ShotEnv.Provider value={{resolve: (c) => resolveCue(c, timings.scenes[sc.id].words), start: s.at, pad: PAD}}>
                    <ShotView shot={s.shot} />
                  </ShotEnv.Provider>
                </Wrap>
              </Sequence>
            );
          })
        )}
        {scenes.map(({sc, frames, base, words}) => (
          <Sequence key={sc.id} from={base} durationInFrames={frames} layout="none">
            <Subs words={words} keywords={keywords} replace={replace} />
          </Sequence>
        ))}
        <div style={{position: "absolute", right: 56, bottom: 54, fontFamily: SERIF, fontStyle: "italic", fontSize: 28, color: C.cream, opacity: 0.55}}>
          {brandText.watermark}
        </div>
      </AbsoluteFill>

      <Audio
        src={staticFile(BRAND.audio.bgmFile)}
        volume={(fr) => BRAND.audio.bgmVolume * interpolate(fr, [0, 45, total - 60, total], [0, 1, 1, 0], clamp)}
      />
      {scenes.map(({sc, frames, base}) => (
        <Sequence key={sc.id} from={base} durationInFrames={frames} layout="none">
          <Audio src={staticFile(`episodes/${episode.id}/vo-${sc.id}.mp3`)} />
        </Sequence>
      ))}
      {sfx.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * FPS)} layout="none">
          <Audio src={staticFile(`audio/sfx-${c.file}.mp3`)} volume={Math.min(c.vol ?? BRAND.audio.sfxDefaultVolume, BRAND.audio.sfxMaxVolume)} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </BrandTextCtx.Provider>
  );
};
