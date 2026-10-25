// Dark Tales episode tool. Run `npm run ep` with no arguments to see the commands.
//   npm run ep -- lint <id|all>          structural check, no audio or API key needed (this is what CI runs)
//   npm run ep -- new <id> "<Title>"     scaffold public/episodes/<id>/episode.json and register it
//   npm run ep -- voice <id> [--force]   ElevenLabs voice-over per scene (+ word timings)  [needs ELEVENLABS_API_KEY]
//   npm run ep -- draft <id>             ESTIMATED timings (no API, no cost) so you can preview shots before recording
//   npm run ep -- timings <id>           rebuild timings.json from existing vo-*.json
//   npm run ep -- check <id>             validate the episode (cues, pacing, sfx, sources). Exit code 1 on errors.
//   npm run ep -- render <id>            check + render to out/<id>/<id>.mp4 and write publish.txt
//   npm run ep -- list                   list registered episodes
import {readFile, writeFile, mkdir, access} from "node:fs/promises";
import {spawn} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {imageIds} from "./collage-assets.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = JSON.parse(await readFile(path.join(ROOT, "src/brand/brand.json"), "utf8"));
const epDir = (id) => path.join(ROOT, "public", "episodes", id);
const exists = (p) => access(p).then(() => true, () => false);
const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9-]/g, "");

// same grammar as src/engine/cue.ts
function resolveCue(cue, words) {
  if (typeof cue === "number") return cue;
  const [head, off] = String(cue).trim().split(/\s+/);
  const m = /^@([^#]+)(?:#(\d+))?$/.exec(head);
  if (!m) throw new Error(`bad cue "${cue}"`);
  const target = norm(m[1]);
  const nth = Number(m[2] ?? 1);
  let seen = 0;
  for (const w of words) if (norm(w.text) === target && ++seen === nth) return w.from + (off ? Number(off) : 0);
  throw new Error(`cue "${cue}": word "${m[1]}"${nth > 1 ? " #" + nth : ""} not found in the voice-over`);
}

async function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!(await exists(p))) return;
  for (const line of (await readFile(p, "utf8")).split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/* ---------- timings ---------- */
async function buildTimings(id) {
  const ep = await readJson(path.join(epDir(id), "episode.json"));
  const out = {scenes: {}};
  for (const sc of ep.scenes) {
    const file = path.join(epDir(id), `vo-${sc.id}.json`);
    if (!(await exists(file))) throw new Error(`missing vo-${sc.id}.json (run: voice ${id})`);
    const {characters: ch, character_start_times_seconds: st, character_end_times_seconds: en} = await readJson(file);
    const words = [];
    let cur = null;
    for (let i = 0; i < ch.length; i++) {
      if (/\s/.test(ch[i])) { cur = null; continue; }
      if (!cur) { cur = {text: "", from: st[i], end: en[i]}; words.push(cur); }
      cur.text += ch[i];
      cur.end = en[i];
    }
    out.scenes[sc.id] = {
      voSeconds: +words[words.length - 1].end.toFixed(2),
      words: words.map((w) => ({text: w.text, from: +w.from.toFixed(2), end: +w.end.toFixed(2)})),
    };
  }
  await writeFile(path.join(epDir(id), "timings.json"), JSON.stringify(out, null, 1));
  const total = Object.values(out.scenes).reduce((s, v) => s + Math.ceil((v.voSeconds + BRAND.audio.voTail) * 30), 0) / 30;
  console.log(`timings.json written (${total.toFixed(1)}s total)`);
}

/* ---------- draft (estimated timings, free) ---------- */
async function draft(id) {
  const ep = await readJson(path.join(epDir(id), "episode.json"));
  const out = {estimated: true, scenes: {}};
  for (const sc of ep.scenes) {
    let t = 0;
    const words = [];
    for (const w of sc.vo.split(/\s+/).filter(Boolean)) {
      const dur = 0.2 + Math.min(w.replace(/[^a-z0-9]/gi, "").length, 12) * 0.035;
      words.push({text: w, from: +t.toFixed(2), end: +(t + dur).toFixed(2)});
      t += dur + 0.04 + (/[.?!]$/.test(w) ? 0.45 : /[,:;]$|\.\.\.$/.test(w) ? 0.18 : 0);
    }
    out.scenes[sc.id] = {voSeconds: +words[words.length - 1].end.toFixed(2), words};
  }
  await writeFile(path.join(epDir(id), "timings.json"), JSON.stringify(out, null, 1));
  console.log("ESTIMATED timings.json written. Good for previewing shots (npm run dev / remotion still); run 'voice' for real timings before rendering.");
}

/* ---------- voice ---------- */
async function voice(id, force) {
  await loadEnv();
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Set ELEVENLABS_API_KEY (in my-video/.env, which git ignores, or as an environment variable).");
  const ep = await readJson(path.join(epDir(id), "episode.json"));
  // Voice priority: the episode's own voice.voiceId, then ELEVENLABS_VOICE_ID_<LANG> (e.g. _ID for Indonesian),
  // then the generic ELEVENLABS_VOICE_ID, then brand.json. (The id is never printed, only where it came from.)
  const langVar = ep.lang ? process.env[`ELEVENLABS_VOICE_ID_${ep.lang.toUpperCase()}`] : undefined;
  const voiceId = ep.voice?.voiceId ?? langVar ?? process.env.ELEVENLABS_VOICE_ID ?? BRAND.voice.voiceId;
  const voiceFrom = ep.voice?.voiceId ? "episode.json" : langVar ? `ELEVENLABS_VOICE_ID_${ep.lang.toUpperCase()}` : process.env.ELEVENLABS_VOICE_ID ? "ELEVENLABS_VOICE_ID" : "brand.json default";
  const langNote = ep.lang && ep.lang !== "en" && voiceFrom === "ELEVENLABS_VOICE_ID" ? ` (make sure this is a "${ep.lang}" voice)` : "";
  console.log(`voice: ${voiceFrom}${langNote}`);
  for (const sc of ep.scenes) {
    const mp3 = path.join(epDir(id), `vo-${sc.id}.mp3`);
    if (!force && (await exists(mp3))) { console.log(`skip vo-${sc.id} (exists; --force to regenerate)`); continue; }
    if (/TODO/i.test(sc.vo)) throw new Error(`scene ${sc.id} still has TODO in its voice-over text`);
    console.log(`vo-${sc.id} ...`);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {"xi-api-key": key, "Content-Type": "application/json"},
      body: JSON.stringify({
        text: sc.vo,
        model_id: BRAND.voice.modelId,
        voice_settings: {stability: BRAND.voice.stability, similarity_boost: BRAND.voice.similarity, style: BRAND.voice.style, use_speaker_boost: true},
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    const data = await res.json();
    await writeFile(mp3, Buffer.from(data.audio_base64, "base64"));
    await writeFile(path.join(epDir(id), `vo-${sc.id}.json`), JSON.stringify(data.alignment));
  }
  await buildTimings(id);
}

/* ---------- check ---------- */
async function check(id, quiet = false) {
  const errors = [];
  const warns = [];
  const dir = epDir(id);
  if (!(await exists(path.join(dir, "episode.json")))) throw new Error(`public/episodes/${id}/episode.json not found`);
  const ep = await readJson(path.join(dir, "episode.json"));
  const tpath = path.join(dir, "timings.json");
  const timings = (await exists(tpath)) ? await readJson(tpath) : null;
  if (!timings) errors.push(`no timings.json — run: npm run ep -- voice ${id} (or draft for a free preview)`);
  if (timings?.estimated) warns.push("timings are ESTIMATED (draft). Cues are approximate and audio is missing; run voice before rendering.");

  const shotTypes = new Set(["scene", "globe", "idcard", "map", "paper", "sketch", "object", "cta", "folio", "board", "poster", "collage"]);
  let totalFrames = 0;
  const sfxAll = [];

  for (const sc of ep.scenes) {
    const tag = `[${sc.id}]`;
    if (!sc.vo || /TODO/i.test(sc.vo)) errors.push(`${tag} voice-over text missing or contains TODO`);
    if (!sc.shots?.length) { errors.push(`${tag} no shots`); continue; }
    const t = timings?.scenes?.[sc.id];
    if (timings && !t) { errors.push(`${tag} not in timings.json — re-run voice`); continue; }
    if (!t) continue;
    totalFrames += Math.ceil((t.voSeconds + BRAND.audio.voTail) * 30);

    const resolveSafe = (c, where) => {
      try { return resolveCue(c, t.words); } catch (e) { errors.push(`${tag} ${where}: ${e.message}`); return null; }
    };
    const starts = [];
    sc.shots.forEach((shot, i) => {
      if (!shotTypes.has(shot.type)) errors.push(`${tag} shot ${i}: unknown type "${shot.type}"`);
      const at = resolveSafe(shot.at, `shot ${i} at`);
      if (at !== null) starts.push(at);
      // every string starting with "@" anywhere in the shot is a cue: make sure it resolves
      (function walk(v, k) {
        if (typeof v === "string" && v.startsWith("@")) resolveSafe(v, `shot ${i} ${k}`);
        else if (Array.isArray(v)) v.forEach((x, j) => walk(x, `${k}[${j}]`));
        else if (v && typeof v === "object") for (const [kk, vv] of Object.entries(v)) walk(vv, `${k}.${kk}`);
      })({...shot, at: undefined}, "");
    });
    if (starts.length && starts[0] > 0.05) errors.push(`${tag} first shot must start at 0 (starts at ${starts[0].toFixed(2)}s) — otherwise the screen is empty`);
    for (let i = 1; i < starts.length; i++) {
      if (starts[i] <= starts[i - 1]) errors.push(`${tag} shots are out of order at index ${i}`);
      else if (starts[i] - starts[i - 1] < BRAND.limits.minShotSeconds) warns.push(`${tag} shot ${i - 1} lasts only ${(starts[i] - starts[i - 1]).toFixed(1)}s (< ${BRAND.limits.minShotSeconds}s) — too fast to read`);
    }
    for (const c of sc.sfx ?? []) {
      const at = resolveSafe(c.at, `sfx ${c.file}`);
      if (at !== null) sfxAll.push({scene: sc.id, t: at, file: c.file, vol: c.vol ?? BRAND.audio.sfxDefaultVolume, base: totalFrames - Math.ceil((t.voSeconds + BRAND.audio.voTail) * 30)});
      if (!(await exists(path.join(ROOT, "public", "audio", `sfx-${c.file}.mp3`)))) errors.push(`${tag} sfx file "sfx-${c.file}.mp3" not found in public/audio`);
      if ((c.vol ?? 0) > BRAND.audio.sfxMaxVolume) warns.push(`${tag} sfx ${c.file} volume ${c.vol} will be capped to ${BRAND.audio.sfxMaxVolume}`);
    }
    if (!timings?.estimated && !(await exists(path.join(dir, `vo-${sc.id}.mp3`)))) errors.push(`${tag} vo-${sc.id}.mp3 missing`);
  }

  // sfx stacking
  const flat = sfxAll.map((c) => ({...c, g: c.base / 30 + c.t})).sort((a, b) => a.g - b.g);
  for (let i = 1; i < flat.length; i++) {
    if (flat[i].g - flat[i - 1].g < BRAND.audio.sfxMinGap) warns.push(`sfx "${flat[i].file}" is within ${BRAND.audio.sfxMinGap}s of "${flat[i - 1].file}" — it will be dropped (no stacking)`);
  }
  if (totalFrames / 30 > BRAND.limits.maxSeconds) warns.push(`episode is ${(totalFrames / 30).toFixed(1)}s, over the ${BRAND.limits.maxSeconds}s target — consider trimming the script`);

  // image provenance (collage look)
  const imgs = await imageProblems(ep);
  errors.push(...imgs.errors);
  warns.push(...imgs.warns);

  // publishing hygiene
  const m = ep.meta ?? {};
  if (!m.title || !m.description || !m.hashtags?.length) errors.push("meta.title, meta.description and meta.hashtags are required");
  if (!m.sources?.length) errors.push("meta.sources is empty — every factual claim needs a source");
  for (const s of m.sources ?? []) if (!s.verified) warns.push(`UNVERIFIED source for: ${s.claim}${s.note ? " (" + s.note + ")" : ""}`);

  if (!quiet) {
    console.log(`\nEpisode "${ep.title}" — ${(totalFrames / 30).toFixed(1)}s, ${ep.scenes.length} scenes, ${ep.scenes.reduce((n, s) => n + s.shots.length, 0)} shots, ${sfxAll.length} sfx cues`);
    warns.forEach((w) => console.log("  warn  " + w));
    errors.forEach((e) => console.log("  ERROR " + e));
    console.log(errors.length ? `\n${errors.length} error(s)` : "\nOK — no blocking errors" + (warns.length ? ` (${warns.length} warning(s) to review before publishing)` : ""));
  }
  return {errors, warns, ep};
}

/* ---------- lint (structure only: no audio, timings or API key required) ---------- */
const SHOT_TYPES = ["scene", "globe", "idcard", "map", "paper", "sketch", "object", "cta", "folio", "board", "poster", "collage"];
const LOOKS = ["night", "manuscript", "casefile", "poster", "collage"];
const LOOK_SHOT = {night: ["scene", "globe", "idcard", "map", "paper", "sketch", "object", "cta"], manuscript: ["folio"], casefile: ["board"], poster: ["poster"], collage: ["collage"]};

/** Every collage image an episode uses must be in the manifest, on disk, and public domain/CC0 (or flagged for credit). */
async function imageProblems(ep) {
  const errors = [];
  const warns = [];
  let manifest = {images: {}};
  try {
    manifest = await readJson(path.join(ROOT, "public", "collage", "manifest.json"));
  } catch {
    // no manifest yet
  }
  for (const id of imageIds(ep)) {
    const img = manifest.images[id];
    if (!img) {
      errors.push(`image "${id}" is not in public/collage/manifest.json (add it with: npm run assets -- add "File:..." ${id})`);
      continue;
    }
    if (!(await exists(path.join(ROOT, "public", "collage", img.file)))) errors.push(`image "${id}": file public/collage/${img.file} is missing`);
    if (!img.license || !img.sourceUrl) errors.push(`image "${id}": manifest entry has no licence or source URL`);
    if (img.attributionRequired) warns.push(`image "${id}" requires attribution (${img.license}); the credit goes into publish.txt: keep it in your video description`);
  }
  return {errors, warns, manifest};
}

/** publish.txt body, including image credits when the episode uses collage images. */
async function publishBody(ep, withNotes) {
  const m = ep.meta;
  const {manifest} = await imageProblems(ep);
  const ids = imageIds(ep);
  const lines = [m.title, "", m.description, "", m.hashtags.join(" "), "", "SOURCES", ...m.sources.map((s) => `- ${s.claim} — ${s.source}${s.verified ? "" : "  [UNVERIFIED]"}${withNotes && s.note ? "  (note: " + s.note + ")" : ""}`)];
  if (ids.length) lines.push("", "IMAGE CREDITS", ...ids.map((id) => `- ${manifest.images[id]?.credit ?? "(missing from manifest: " + id + ")"}`));
  return lines.join("\n");
}

async function lintOne(id) {
  const errors = [];
  const warns = [];
  const file = path.join(epDir(id), "episode.json");
  if (!(await exists(file))) return {errors: [`public/episodes/${id}/episode.json not found`], warns};
  let ep;
  try {
    ep = await readJson(file);
  } catch (e) {
    return {errors: [`episode.json is not valid JSON: ${e.message}`], warns};
  }
  if (ep.id !== id) errors.push(`"id" is "${ep.id}" but the folder is "${id}"`);
  const look = ep.look ?? "night";
  if (!LOOKS.includes(look)) errors.push(`unknown look "${look}" (use ${LOOKS.join(", ")})`);
  if (!Array.isArray(ep.scenes) || !ep.scenes.length) return {errors: [...errors, "no scenes"], warns};

  for (const sc of ep.scenes) {
    const tag = `[${sc.id ?? "?"}]`;
    if (!sc.id) errors.push("a scene has no id");
    if (!sc.vo || /TODO/i.test(sc.vo)) errors.push(`${tag} voice-over text missing or contains TODO`);
    const counts = new Map();
    for (const w of String(sc.vo ?? "").split(/\s+/).map(norm).filter(Boolean)) counts.set(w, (counts.get(w) ?? 0) + 1);
    const cueOk = (c, where) => {
      if (typeof c === "number") return;
      const [head] = String(c).trim().split(/\s+/);
      const m = /^@([^#]+)(?:#(\d+))?$/.exec(head);
      if (!m) return void errors.push(`${tag} ${where}: bad cue "${c}"`);
      const have = counts.get(norm(m[1])) ?? 0;
      if (have < Number(m[2] ?? 1)) errors.push(`${tag} ${where}: cue "${c}" — word "${m[1]}" ${m[2] ? "#" + m[2] + " " : ""}is not in this scene's voice-over text`);
    };
    if (!sc.shots?.length) {
      errors.push(`${tag} no shots`);
      continue;
    }
    if (sc.shots[0].at !== 0) errors.push(`${tag} the first shot must start at 0`);
    sc.shots.forEach((shot, i) => {
      if (!SHOT_TYPES.includes(shot.type)) errors.push(`${tag} shot ${i}: unknown type "${shot.type}"`);
      else if (LOOKS.includes(look) && !LOOK_SHOT[look].includes(shot.type)) errors.push(`${tag} shot ${i}: type "${shot.type}" does not belong to look "${look}" (allowed: ${LOOK_SHOT[look].join(", ")})`);
      cueOk(shot.at, `shot ${i} at`);
      (function walk(v, k) {
        if (typeof v === "string" && v.startsWith("@")) cueOk(v, `shot ${i} ${k}`);
        else if (Array.isArray(v)) v.forEach((x, j) => walk(x, `${k}[${j}]`));
        else if (v && typeof v === "object") for (const [kk, vv] of Object.entries(v)) walk(vv, `${k}.${kk}`);
      })({...shot, at: undefined}, "");
    });
    const last = sc.shots[sc.shots.length - 1];
    if (sc === ep.scenes[ep.scenes.length - 1] && !last.cta && last.type !== "cta") warns.push(`${tag} the last shot of the episode is usually a closing card (cta)`);
    for (const c of sc.sfx ?? []) cueOk(c.at, `sfx ${c.file}`);
  }
  const img = await imageProblems(ep);
  errors.push(...img.errors);
  warns.push(...img.warns);
  const m = ep.meta ?? {};
  if (!m.title || !m.description || !m.hashtags?.length) errors.push("meta.title, meta.description and meta.hashtags are required");
  if (!m.sources?.length) errors.push("meta.sources is empty: every factual claim needs a source");
  for (const s of m.sources ?? []) if (!s.verified) warns.push(`unverified source: ${s.claim}`);
  return {errors, warns};
}

async function lint(target) {
  const ids = target === "all" || !target ? ((await readFile(path.join(ROOT, "src/episodes.ts"), "utf8")).match(/"([a-z0-9-]+)"/g) ?? []).map((s) => s.replace(/"/g, "")) : [target];
  let bad = 0;
  for (const id of ids) {
    const {errors, warns} = await lintOne(id);
    console.log(`${errors.length ? "FAIL" : "ok  "} ${id}${warns.length ? `  (${warns.length} warning(s))` : ""}`);
    errors.forEach((e) => console.log("   ERROR " + e));
    if (target && target !== "all") warns.forEach((w) => console.log("   warn  " + w));
    bad += errors.length;
  }
  console.log(bad ? `\n${bad} error(s)` : `\nAll ${ids.length} episode(s) pass the structural lint.`);
  return bad;
}

/* ---------- render ---------- */
async function render(id, extraArgs) {
  // --name=foo writes out/<id>/foo.mp4 (handy when the previous file is open in a player and locked on Windows)
  const nameArg = extraArgs.find((a) => a.startsWith("--name="));
  const extra = extraArgs.filter((a) => !a.startsWith("--name="));
  const outName = nameArg ? nameArg.slice(7) : id;
  const {errors, ep} = await check(id);
  if (errors.length) throw new Error("fix the errors above before rendering");
  if ((await readJson(path.join(epDir(id), "timings.json"))).estimated) throw new Error("timings are only estimated: run voice first");
  const out = path.join(ROOT, "out", id);
  await mkdir(out, {recursive: true});
  const file = path.join(out, `${outName}.mp4`);
  await new Promise((resolve, reject) => {
    const p = spawn("npx", ["remotion", "render", "src/index.ts", `DarkTales-${id}`, file, "--crf=18", ...extra], {cwd: ROOT, stdio: "inherit", shell: true});
    p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`render exited with ${c}`))));
  });
  await writeFile(path.join(out, "publish.txt"), await publishBody(ep, false));
  console.log(`\nVideo:   ${file}\nPublish: ${path.join(out, "publish.txt")}`);
}

/* ---------- publish text only ---------- */
async function publishText(id) {
  const {ep} = await check(id, true);
  const out = path.join(ROOT, "out", id);
  await mkdir(out, {recursive: true});
  await writeFile(path.join(out, "publish.txt"), await publishBody(ep, true));
  console.log("rewrote " + path.join(out, "publish.txt"));
}

/* ---------- new ---------- */
async function scaffold(id, title) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("id must be lowercase letters, numbers and dashes");
  const dir = epDir(id);
  if (await exists(dir)) throw new Error(`episode "${id}" already exists`);
  await mkdir(dir, {recursive: true});
  const tpl = (await readFile(path.join(ROOT, "templates", "episode.template.json"), "utf8")).replaceAll("__ID__", id).replaceAll("__TITLE__", title ?? id);
  await writeFile(path.join(dir, "episode.json"), tpl);
  const reg = path.join(ROOT, "src", "episodes.ts");
  const src = await readFile(reg, "utf8");
  await writeFile(reg, src.replace(/\];\s*$/, `  "${id}",\n];\n`));
  console.log(`Created public/episodes/${id}/episode.json and registered "${id}" in src/episodes.ts.\nNext: write the voice-over text and shots (see docs/episode-format.md), run \`npm run ep -- lint ${id}\`, preview with \`npm run ep -- draft ${id}\` + \`npm run dev\`, then \`npm run ep -- voice ${id}\`.`);
}

const [cmd, id, ...rest] = process.argv.slice(2);
try {
  if (cmd === "new") await scaffold(id, rest[0]);
  else if (cmd === "lint") process.exitCode = (await lint(id)) ? 1 : 0;
  else if (cmd === "voice") await voice(id, rest.includes("--force"));
  else if (cmd === "draft") await draft(id);
  else if (cmd === "timings") await buildTimings(id);
  else if (cmd === "check") process.exitCode = (await check(id)).errors.length ? 1 : 0;
  else if (cmd === "render") await render(id, rest);
  else if (cmd === "publish") await publishText(id);
  else if (cmd === "list") console.log((await readFile(path.join(ROOT, "src/episodes.ts"), "utf8")).match(/"[a-z0-9-]+"/g)?.join("\n") ?? "(none)");
  else console.log("usage: npm run ep -- <lint|new|draft|voice|timings|check|render|publish|list> <id> [...]\n  lint <id|all>      structural check (no audio or API key needed)\n  new <id> \"Title\"   scaffold an episode\n  draft <id>         estimated timings, free preview\n  voice <id>         record the voice-over with ElevenLabs (needs ELEVENLABS_API_KEY)\n  check <id>         full check against real timings and assets\n  render <id>        check, then render to out/<id>/<id>.mp4\n  publish <id>       rewrite out/<id>/publish.txt\n  list               list registered episodes");
} catch (e) {
  console.error("\nError: " + e.message);
  process.exitCode = 1;
}
