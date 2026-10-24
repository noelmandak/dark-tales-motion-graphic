import React from "react";
import {CalculateMetadataFunction, Composition} from "remotion";
import {EpisodeVideo, episodeFrames, loadEpisode} from "./engine/Episode";
import type {Episode, Timings} from "./engine/types";
import {EPISODE_IDS} from "./episodes";

const common = {fps: 30, width: 1080, height: 1920} as const;

type EpisodeProps = {episodeId: string; episode: Episode | null; timings: Timings | null};

/** Loads public/episodes/<id>/{episode,timings}.json and sizes the video to the voice-over. */
const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const {episode, timings} = await loadEpisode(props.episodeId);
  return {durationInFrames: episodeFrames(episode, timings), props: {...props, episode, timings}};
};

const EpisodeComp: React.FC<EpisodeProps> = ({episode, timings}) =>
  episode && timings ? <EpisodeVideo episode={episode} timings={timings} /> : null;

/** One composition per episode id listed in src/episodes.ts (`npm run ep -- new <id>` adds it for you). */
export const RemotionRoot: React.FC = () => (
  <>
    {EPISODE_IDS.map((id) => (
      <Composition
        key={id}
        id={`DarkTales-${id}`}
        component={EpisodeComp}
        durationInFrames={300}
        {...common}
        defaultProps={{episodeId: id, episode: null, timings: null} as EpisodeProps}
        calculateMetadata={calculateMetadata}
      />
    ))}
  </>
);
