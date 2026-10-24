// Generates an ORIGINAL ambient underscore (no samples, nothing copied) as a placeholder BGM.
//   node scripts/make-bgm.mjs [seconds]      -> public/audio/bgm-local.wav
// Dark A-minor pad + soft bass + sparse pentatonic plucks through a feedback delay.
// For a richer track, use `node scripts/generate-audio.mjs bgm` (ElevenLabs Music) instead.
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SR = 44100;
const SECONDS = Number(process.argv[2] ?? 80);
const N = SR * SECONDS;
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 12345;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

const CHORD_LEN = 8; // seconds
const CHORDS = [
  {root: 45, notes: [57, 60, 64]}, // Am
  {root: 41, notes: [57, 60, 65]}, // F
  {root: 38, notes: [53, 57, 62]}, // Dm
  {root: 40, notes: [56, 59, 64]}, // E
];

const add = (buf, i, v) => {
  if (i >= 0 && i < N) buf[i] += v;
};

// pad + bass
for (let c = 0; c * CHORD_LEN < SECONDS; c++) {
  const ch = CHORDS[c % CHORDS.length];
  const start = c * CHORD_LEN * SR;
  const len = (CHORD_LEN + 3) * SR; // overlap the next chord
  const voices = [...ch.notes.map((m) => ({f: hz(m), a: 0.07})), {f: hz(ch.root), a: 0.16}, {f: hz(ch.root + 12), a: 0.05}];
  voices.forEach((v, vi) => {
    const pan = vi % 2 ? 0.35 : 0.65;
    const detune = [1, 1.004, 0.996][vi % 3];
    for (let k = 0; k < len; k++) {
      const t = k / SR;
      const env = Math.min(1, t / 2.5) * Math.min(1, (len / SR - t) / 3);
      const vib = 1 + 0.0015 * Math.sin(2 * Math.PI * 0.25 * t + vi);
      const ph = 2 * Math.PI * v.f * detune * vib * t;
      const s = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * v.a * env;
      add(L, start + k, s * (1 - pan));
      add(R, start + k, s * pan);
    }
  });
}

// sparse plucks (A minor pentatonic) with a delay tail
const PENT = [69, 72, 74, 76, 79, 81];
const dl = Math.floor(SR * 0.46);
const dry = new Float32Array(N);
for (let t = 6; t < SECONDS - 4; t += 2 + Math.floor(rnd() * 3)) {
  const note = PENT[Math.floor(rnd() * PENT.length)];
  const f = hz(note);
  const s0 = Math.floor(t * SR);
  for (let k = 0; k < SR * 2.2; k++) {
    const tt = k / SR;
    const env = Math.exp(-tt * 2.6) * Math.min(1, tt / 0.01);
    add(dry, s0 + k, (Math.sin(2 * Math.PI * f * tt) + 0.25 * Math.sin(4 * Math.PI * f * tt)) * 0.09 * env);
  }
}
const wet = new Float32Array(N);
for (let i = 0; i < N; i++) {
  wet[i] = dry[i] + (i >= dl ? wet[i - dl] * 0.42 : 0);
  add(L, i, wet[i] * 0.8);
  add(R, i, (i >= 2 * dl ? wet[i - dl] : wet[i]) * 0.8);
}

// master: fade in/out, normalise
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const f = Math.min(1, t / 2.5) * Math.min(1, (SECONDS - t) / 3);
  L[i] *= f;
  R[i] *= f;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.6 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write("RIFF", 0);
pcm.writeUInt32LE(36 + N * 4, 4);
pcm.write("WAVEfmt ", 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write("data", 36);
pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * g * 32767))), 44 + i * 4);
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * g * 32767))), 46 + i * 4);
}
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");
await mkdir(out, {recursive: true});
await writeFile(path.join(out, "bgm-local.wav"), pcm);
console.log("wrote bgm-local.wav", SECONDS + "s");
