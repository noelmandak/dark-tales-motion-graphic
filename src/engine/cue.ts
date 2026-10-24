import type {Cue, Word} from "./types";

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9-]/g, "");

/** Turn a cue into seconds within a scene. Throws with a helpful message if a word cue can't be found. */
export const resolveCue = (cue: Cue, words: Word[]): number => {
  if (typeof cue === "number") return cue;
  const [head, off] = cue.trim().split(/\s+/);
  const m = /^@([^#]+)(?:#(\d+))?$/.exec(head);
  if (!m) throw new Error(`Bad cue "${cue}" (use seconds, "@word", "@word#2", or "@word +0.3")`);
  const target = norm(m[1]);
  const nth = Number(m[2] ?? 1);
  let seen = 0;
  for (const w of words) {
    if (norm(w.text) === target && ++seen === nth) return w.from + (off ? Number(off) : 0);
  }
  throw new Error(`Cue "${cue}": word "${m[1]}"${nth > 1 ? ` #${nth}` : ""} not found in this scene's voice-over`);
};
