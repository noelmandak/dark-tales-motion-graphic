// Image assets for the `collage` look, with provenance.
//
//   npm run assets -- search "<query>"                  find candidates on Wikimedia Commons (shows each licence)
//   npm run assets -- add "File:Name.jpg" <id>          download a resized copy and record its provenance
//   npm run assets -- list                              show the manifest
//   npm run assets -- credits <episode-id>              the credit lines for the images an episode uses
//
// Why this exists: a collage is only as safe as its pictures. This tool
//   * only fetches from Wikimedia Commons, whose API states each file's licence and author;
//   * refuses anything that is not public domain / CC0 (add --allow-attribution to also accept CC BY / CC BY-SA,
//     which are then flagged "attribution required" and credited in publish.txt);
//   * writes everything to public/collage/manifest.json, which `npm run ep -- lint` checks.
// It trusts Commons' own licence determination. Public-domain status can differ between countries: for anything
// high-stakes, open the source page it records and judge for yourself. This is not legal advice.

import {readFile, writeFile, mkdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "collage");
const MANIFEST = path.join(DIR, "manifest.json");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "DarkTalesEngine/0.1 (open-source motion-graphics project; image provenance tool)";

const strip = (html) =>
  String(html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/(date|title)?\s*QS:.*$/i, "") // Wikidata artefacts that Commons leaves in some fields
    .replace(/^(Danish|English|French|German|Dutch|Italian|Spanish|Swedish): /, "")
    .replace(/\s+/g, " ")
    .trim();

async function readManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    return {images: {}};
  }
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({format: "json", formatversion: "2", ...params})}`;
  const res = await fetch(url, {headers: {"User-Agent": UA}});
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

/** public domain / CC0 => free to use without credit; CC BY(-SA) => needs credit. */
function classify(meta) {
  const short = strip(meta.LicenseShortName?.value ?? "");
  const copyrighted = String(meta.Copyrighted?.value ?? "").toLowerCase();
  const isPD = copyrighted === "false" || /^(public domain|pd\b|cc0|cc-zero)/i.test(short);
  const isBy = /^cc[- ]by(-sa)?\b/i.test(short);
  return {short, isPD, isBy};
}

async function search(query) {
  const data = await api({
    action: "query", generator: "search", gsrnamespace: "6", gsrsearch: query, gsrlimit: "10",
    prop: "imageinfo", iiprop: "extmetadata|size|url", iiextmetadatafilter: "LicenseShortName|Artist|Copyrighted|ObjectName|DateTimeOriginal",
  });
  const pages = (data.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  if (!pages.length) return console.log("No results.");
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const meta = ii?.extmetadata ?? {};
    const c = classify(meta);
    const tag = c.isPD ? "PD " : c.isBy ? "BY " : "?? ";
    console.log(`${tag} ${p.title}  [${ii?.width}x${ii?.height}]  ${c.short || "(no licence info)"}  — ${strip(meta.Artist?.value).slice(0, 50)}`);
  }
  console.log('\nPD = usable without credit, BY = needs credit (use --allow-attribution), ?? = rejected. Add one with:\n  npm run assets -- add "File:Name.jpg" <id>');
}

async function add(title, id, flags) {
  if (!title || !id) throw new Error('usage: add "File:Name.jpg" <id> [--width=1400] [--allow-attribution]');
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("id must be lowercase letters, numbers and dashes");
  const width = Number((flags.find((f) => f.startsWith("--width=")) ?? "--width=1400").split("=")[1]);
  const allowBy = flags.includes("--allow-attribution");
  const fileTitle = title.startsWith("File:") ? title : `File:${title}`;

  const data = await api({
    action: "query", titles: fileTitle, prop: "imageinfo", iiprop: "extmetadata|size|url|mime", iiurlwidth: String(width),
  });
  const page = data.query?.pages?.[0];
  const ii = page?.imageinfo?.[0];
  if (!page || page.missing || !ii) throw new Error(`not found on Commons: ${fileTitle}`);
  const meta = ii.extmetadata ?? {};
  const c = classify(meta);
  if (!c.isPD && !(c.isBy && allowBy)) {
    throw new Error(`refused: licence is "${c.short || "unknown"}". Only public domain / CC0 images are accepted${c.isBy ? " (this is CC BY: re-run with --allow-attribution to accept it with credit)" : ""}.`);
  }
  if (!/^image\/(jpeg|png)/.test(ii.mime)) throw new Error(`unsupported file type ${ii.mime} (need jpeg or png)`);

  const manifest = await readManifest();
  if (manifest.images[id]) throw new Error(`id "${id}" already exists in the manifest`);

  const ext = ii.mime === "image/png" ? "png" : "jpg";
  const file = `${id}.${ext}`;
  const res = await fetch(ii.thumburl ?? ii.url, {headers: {"User-Agent": UA}});
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  await mkdir(DIR, {recursive: true});
  await writeFile(path.join(DIR, file), Buffer.from(await res.arrayBuffer()));

  const creator = strip(meta.Artist?.value) || "Unknown";
  manifest.images[id] = {
    file,
    title: strip(meta.ObjectName?.value) || fileTitle.replace(/^File:/, ""),
    creator,
    date: strip(meta.DateTimeOriginal?.value),
    license: c.short,
    licenseUrl: strip(meta.LicenseUrl?.value) || undefined,
    attributionRequired: !c.isPD,
    sourceUrl: ii.descriptionurl,
    credit: `${strip(meta.ObjectName?.value) || fileTitle.replace(/^File:/, "")}, ${creator} (${c.short}), via Wikimedia Commons`,
    width: ii.thumbwidth ?? ii.width,
    height: ii.thumbheight ?? ii.height,
    retrieved: new Date().toISOString().slice(0, 10),
  };
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`added "${id}" -> public/collage/${file}  (${manifest.images[id].width}x${manifest.images[id].height}, ${c.short})\n  ${ii.descriptionurl}`);
}

async function list() {
  const m = await readManifest();
  for (const [id, v] of Object.entries(m.images)) console.log(`${id.padEnd(28)} ${v.license.padEnd(18)} ${v.width}x${v.height}  ${v.title.slice(0, 50)}`);
  if (!Object.keys(m.images).length) console.log("(manifest is empty)");
}

/** image ids used by an episode (every "src" in any shot item). */
export function imageIds(ep) {
  const ids = new Set();
  (function walk(v, key) {
    if (typeof v === "string" && key === "src") ids.add(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  })(ep.scenes ?? [], "");
  return [...ids];
}

async function credits(epId) {
  const ep = JSON.parse(await readFile(path.join(ROOT, "public", "episodes", epId, "episode.json"), "utf8"));
  const m = await readManifest();
  const ids = imageIds(ep);
  if (!ids.length) return console.log("This episode uses no collage images.");
  for (const id of ids) console.log(`- ${m.images[id]?.credit ?? `(MISSING from manifest: ${id})`}`);
}

const [cmd, a, b, ...rest] = process.argv.slice(2);
if (process.argv[1] && process.argv[1].endsWith("collage-assets.mjs")) {
  try {
    if (cmd === "search") await search([a, b, ...rest].filter(Boolean).join(" "));
    else if (cmd === "add") await add(a, b, rest);
    else if (cmd === "list") await list();
    else if (cmd === "credits") await credits(a);
    else console.log('usage: npm run assets -- <search "query" | add "File:Name.jpg" <id> | list | credits <episode-id>>');
  } catch (e) {
    console.error("\nError: " + e.message);
    process.exitCode = 1;
  }
}
