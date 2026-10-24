// Generates the shared sound library with the ElevenLabs API: sound effects and (optionally) a music bed.
//
//   npm run audio:sfx                          the 12 sound effects used by the episodes
//   node scripts/generate-audio.mjs bgm        an instrumental music bed (ElevenLabs Music)
//   node scripts/generate-audio.mjs all        both
//   add --force to regenerate files that already exist (they are skipped otherwise, so re-runs cost nothing)
//
// Needs ELEVENLABS_API_KEY (in .env or the environment). It spends your ElevenLabs credits.
// Voice-overs are NOT made here: use `npm run ep -- voice <id>`.
// For a free, key-less music bed use `npm run audio:bgm` (scripts/make-bgm.mjs).
//
// Output goes to public/audio/ and is git-ignored on purpose; see docs/audio-and-assets.md.

import {mkdir, writeFile, access, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(ROOT, "public", "audio");

// minimal .env loader (no dependency)
try {
  for (const line of (await readFile(path.join(ROOT, ".env"), "utf8")).split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // no .env: rely on the real environment
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Set ELEVENLABS_API_KEY (in .env or the environment) first.");
  process.exit(1);
}

const mode = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "sfx";
const force = process.argv.includes("--force");

// name -> [prompt, seconds]. Episodes refer to these by name, e.g. {"at": "@secret", "file": "stamp"}.
const SFX = {
  "bass-hit": ["single deep cinematic bass impact, short, dark", 1.5],
  "stomach-growl": ["deep human stomach growling rumble, close up", 2.5],
  "plate-clink": ["single ceramic plate clink on a wooden table", 1],
  "ticking": ["slow ominous clock ticking, tense, dry", 4],
  "swallow": ["a loud exaggerated gulp swallow, cartoonish but dark", 1.2],
  "whoosh": ["short dark cinematic whoosh transition", 1],
  "stamp": ["heavy rubber stamp slammed on paper with thud", 1],
  "fail-thud": ["low ominous failure sting, descending tone, dark", 2],
  "quill-scratch": ["quill pen scratching on parchment paper", 3],
  "gold-ting": ["bright metallic ting of a golden fork, then faint magical shimmer", 2.5],
  "drone": ["dark ambient drone pad, low, eerie, sustained, loopable", 22],
  "footsteps": ["slow footsteps walking away down an empty stone hospital corridor with echo", 6],
};

// Described by mood only. Never name an artist or a song here.
const BGM_PROMPT =
  "Instrumental dark documentary underscore. Slow and minimal: a soft felt piano motif over a warm low synth pad, very subtle pulse, quiet tension that builds slowly. Steady dynamics so a voice-over sits on top. No vocals, no drums, no sudden loud hits. Loopable.";

const exists = (p) => access(p).then(() => true, () => false);

async function api(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {"xi-api-key": API_KEY, "Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res;
}

async function genSFX() {
  for (const [name, [prompt, seconds]] of Object.entries(SFX)) {
    const file = path.join(outDir, `sfx-${name}.mp3`);
    if (!force && (await exists(file))) {
      console.log(`skip sfx-${name}`);
      continue;
    }
    console.log(`sfx-${name} ...`);
    const res = await api("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
      text: prompt,
      duration_seconds: seconds,
      prompt_influence: 0.5,
    });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
}

async function genBGM() {
  const file = path.join(outDir, "bgm.mp3");
  if (!force && (await exists(file))) return console.log("skip bgm");
  console.log("bgm ...");
  const res = await api("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    prompt: BGM_PROMPT,
    music_length_ms: 80000,
    force_instrumental: true,
  });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log('Set "audio.bgmFile" to "audio/bgm.mp3" in src/brand/brand.json to use it.');
}

await mkdir(outDir, {recursive: true});
if (mode === "sfx" || mode === "all") await genSFX();
if (mode === "bgm" || mode === "all") await genBGM();
console.log("done ->", outDir);
