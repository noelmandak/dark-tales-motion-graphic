// Generates an ORIGINAL bright, modern "corporate" sound kit (no samples, nothing copied):
//   node scripts/make-brand-audio.mjs [seconds]
//   -> public/audio/bgm-fataorgana.wav      light major-key bed: soft pad, plucked arpeggio, gentle beat
//   -> public/audio/sfx-fo-*.mp3            whoosh, pop, ding, thud, tick, sparkle (short, soft, clean)
// The opposite of make-bgm.mjs (dark A-minor drone): D major, ~104 BPM, airy and forward-moving.
// SFX are encoded with the ffmpeg bundled with Remotion (npx remotion ffmpeg).
import {mkdir, rm, writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "audio");
const SR = 44100;
const SECONDS = Number(process.argv[2] ?? 90);
const TAU = Math.PI * 2;

let seed = 4242;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

const wav = (L, R) => {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-1, Math.min(1, L[i])) * 32767, 44 + i * 4);
    buf.writeInt16LE(Math.max(-1, Math.min(1, R[i])) * 32767, 46 + i * 4);
  }
  return buf;
};
const normalize = (L, R, peak) => {
  let m = 0;
  for (let i = 0; i < L.length; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  const g = m ? peak / m : 1;
  for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
};
/** one-pole low-pass, in place */
const lowpass = (x, fc) => {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; }
};

/* =============================== BGM =============================== */
const BPM = 104;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const N = Math.floor(SR * SECONDS);
const L = new Float32Array(N);
const R = new Float32Array(N);
const pad = new Float32Array(N); // mono pad bus, ducked by the kick
const duck = new Float32Array(N).fill(1);
const add = (b, i, v) => { if (i >= 0 && i < N) b[i] += v; };

// D major, I - V - vi - IV, two bars each
const PROG = [
  {root: 50, tones: [62, 66, 69, 73]}, // Dmaj7-ish (D F# A C#)
  {root: 45, tones: [61, 64, 69, 71]}, // A add9
  {root: 47, tones: [62, 66, 69, 74]}, // Bm
  {root: 43, tones: [62, 67, 71, 74]}, // G
];
const CH_LEN = BAR * 2;

// soft pad
for (let c = 0; c * CH_LEN < SECONDS + 4; c++) {
  const ch = PROG[c % PROG.length];
  const start = Math.floor(c * CH_LEN * SR);
  const len = Math.floor((CH_LEN + 1.5) * SR);
  ch.tones.forEach((m, vi) => {
    const f = hz(m);
    for (let k = 0; k < len; k++) {
      const t = k / SR;
      const env = Math.min(1, t / 0.6) * Math.min(1, (len / SR - t) / 1.2);
      const ph = TAU * f * t;
      const saw = 2 * ((f * t) % 1) - 1;
      add(pad, start + k, (Math.sin(ph) * 0.6 + saw * 0.18 + Math.sin(ph * 2.003) * 0.12) * 0.06 * env * (vi === 0 ? 1.1 : 1));
    }
  });
}
lowpass(pad, 2400);

// kick pattern (from bar 4): beats 1 and 3, soft; builds the duck envelope
const kicks = [];
for (let bar = 4; bar * BAR < SECONDS - 3; bar++) kicks.push(bar * BAR, bar * BAR + BEAT * 2);
const kickBus = new Float32Array(N);
for (const t0 of kicks) {
  const s0 = Math.floor(t0 * SR);
  for (let k = 0; k < SR * 0.28; k++) {
    const t = k / SR;
    const f = 48 + 90 * Math.exp(-t * 28);
    add(kickBus, s0 + k, Math.sin(TAU * f * t) * Math.exp(-t * 11) * 0.5);
    if (s0 + k < N) duck[s0 + k] = Math.min(duck[s0 + k], 0.45 + 0.55 * Math.min(1, t / 0.22));
  }
}

// shaker (8ths, from bar 6) and soft rim on 2 & 4 (from bar 8)
const shaker = new Float32Array(N);
for (let bar = 6; bar * BAR < SECONDS - 3; bar++) {
  for (let e = 0; e < 8; e++) {
    const t0 = bar * BAR + e * (BEAT / 2);
    const s0 = Math.floor(t0 * SR);
    const amp = e % 2 ? 0.07 : 0.045;
    for (let k = 0; k < SR * 0.05; k++) add(shaker, s0 + k, (rnd() * 2 - 1) * amp * Math.exp((-k / SR) * 70));
  }
}
const rim = new Float32Array(N);
for (let bar = 8; bar * BAR < SECONDS - 3; bar++) {
  for (const b of [1, 3]) {
    const s0 = Math.floor((bar * BAR + b * BEAT) * SR);
    for (let k = 0; k < SR * 0.09; k++) {
      const t = k / SR;
      add(rim, s0 + k, (Math.sin(TAU * 1700 * t) * 0.5 + (rnd() * 2 - 1) * 0.35) * 0.11 * Math.exp(-t * 55));
    }
  }
}

// plucked arpeggio (8ths, from bar 2) through a ping-pong delay; bass on beat 1 and the "and" of 2
const pluckL = new Float32Array(N);
const pluckR = new Float32Array(N);
const bass = new Float32Array(N);
const pluck = (buf, t0, midi, amp) => {
  const f = hz(midi);
  const s0 = Math.floor(t0 * SR);
  for (let k = 0; k < SR * 0.9; k++) {
    const t = k / SR;
    const env = Math.exp(-t * 6.5) * Math.min(1, t / 0.003);
    add(buf, s0 + k, (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 9) + 0.15 * Math.sin(TAU * f * 3 * t)) * amp * env);
  }
};
for (let bar = 2; bar * BAR < SECONDS - 2; bar++) {
  const ch = PROG[Math.floor(bar / 2) % PROG.length];
  const arp = [ch.tones[0], ch.tones[2], ch.tones[3], ch.tones[2] + 12, ch.tones[3], ch.tones[2], ch.tones[1] + 12, ch.tones[2]];
  const lift = bar >= 8 ? 1 : 0.8;
  for (let e = 0; e < 8; e++) {
    const t0 = bar * BAR + e * (BEAT / 2);
    pluck(e % 2 ? pluckR : pluckL, t0, arp[e], (e % 4 === 0 ? 0.075 : 0.05) * lift);
  }
  if (bar >= 4) {
    for (const [b, len] of [[0, 1.4], [2.5, 0.9]]) {
      const s0 = Math.floor((bar * BAR + b * BEAT) * SR);
      const f = hz(ch.root - 12);
      for (let k = 0; k < SR * len * BEAT; k++) {
        const t = k / SR;
        add(bass, s0 + k, Math.sin(TAU * f * t) * 0.2 * Math.min(1, t / 0.01) * Math.exp(-t * 2.2));
      }
    }
  }
}
// ping-pong delay (dotted-8th feel) on the plucks
const dly = Math.floor(BEAT * 0.75 * SR);
for (let i = 0; i < N; i++) {
  const iL = i - dly;
  const iR = i - dly;
  if (iL >= 0) { pluckR[i] += pluckL[iL] * 0.32; pluckL[i] += pluckR[iR] * 0.26; }
}
lowpass(pluckL, 6500);
lowpass(pluckR, 6500);

// mix
const g = (i) => {
  const t = i / SR;
  return Math.min(1, t / 2) * Math.min(1, (SECONDS - t) / 3);
};
for (let i = 0; i < N; i++) {
  const p = pad[i] * duck[i];
  const mono = bass[i] + kickBus[i] * 1.0 + shaker[i] * 0.8 + rim[i];
  L[i] = (p * 0.9 + pluckL[i] + mono) * g(i);
  R[i] = (p * 0.9 + pluckR[i] + mono) * g(i);
}
normalize(L, R, 0.85);

/* =============================== SFX =============================== */
const mkMono = (sec) => new Float32Array(Math.floor(SR * sec));
const bell = (buf, t0, f, amp, decay) => {
  const s0 = Math.floor(t0 * SR);
  for (let k = 0; k < buf.length - s0; k++) {
    const t = k / SR;
    buf[s0 + k] += (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * decay * 1.8) + 0.2 * Math.sin(TAU * f * 4.1 * t) * Math.exp(-t * decay * 2.5)) * amp * Math.exp(-t * decay) * Math.min(1, t / 0.004);
  }
};
const SFX = {
  whoosh: () => {
    // airy band sweep (2-9 kHz, above the speech band) plus a low rising body so it still reads under a voice
    const b = mkMono(0.6);
    let lo = 0;
    let lo2 = 0;
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const u = Math.min(1, t / 0.55);
      const fc = 1800 + 7200 * u ** 1.8;
      const a1 = 1 - Math.exp((-TAU * fc) / SR);
      const a2 = 1 - Math.exp((-TAU * fc * 0.4) / SR);
      const n = rnd() * 2 - 1;
      lo += a1 * (n - lo);
      lo2 += a2 * (n - lo2);
      const env = Math.sin(Math.PI * u) ** 1.4;
      ph += (TAU * (70 + 190 * u)) / SR;
      b[i] = ((lo - lo2) * 4.5 + Math.sin(ph) * 0.55) * env;
    }
    return b;
  },
  pop: () => {
    const b = mkMono(0.2);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const f = 1200 + 900 * Math.min(1, t / 0.04);
      b[i] = Math.sin(TAU * f * t) * Math.exp(-t * 24) * 0.7 + Math.sin(TAU * f * 2 * t) * Math.exp(-t * 38) * 0.22 + Math.sin(TAU * 140 * t) * Math.exp(-t * 30) * 0.5;
    }
    return b;
  },
  ding: () => {
    const b = mkMono(1.2);
    bell(b, 0, hz(88), 0.4, 4.2); // E6
    bell(b, 0.09, hz(95), 0.3, 4.6); // B6
    return b;
  },
  thud: () => {
    const b = mkMono(0.5);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const f = 90 + 130 * Math.exp(-t * 18);
      b[i] = Math.sin(TAU * f * t) * Math.exp(-t * 9) * 0.85 + (rnd() * 2 - 1) * Math.exp(-t * 60) * 0.12;
    }
    lowpass(b, 900);
    return b;
  },
  tick: () => {
    const b = mkMono(0.09);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] = (Math.sin(TAU * 3300 * t) * 0.6 + Math.sin(TAU * 220 * t) * 0.45 + (rnd() * 2 - 1) * 0.3) * Math.exp(-t * 70);
    }
    return b;
  },
  sparkle: () => {
    const b = mkMono(1.1);
    [86, 90, 93, 98, 102].forEach((m, i) => bell(b, i * 0.07, hz(m), 0.2, 5.5));
    return b;
  },
};

/** Active-part RMS (loudest half of the 10 ms blocks), so short and noisy sounds are matched by how loud they feel. */
const activeRms = (m) => {
  const blk = [];
  for (let i = 0; i + 441 <= m.length; i += 441) {
    let e = 0;
    for (let k = 0; k < 441; k++) e += m[i + k] ** 2;
    blk.push(e / 441);
  }
  const act = blk.filter((x) => x > 1e-8).sort((a, b) => b - a);
  const top = act.slice(0, Math.max(1, Math.floor(act.length / 2)));
  return Math.sqrt(top.reduce((a, b) => a + b, 0) / top.length);
};
const TARGET_DB = {whoosh: -10, pop: -10, ding: -14, thud: -10, tick: -9, sparkle: -14};
const matchLoudness = (m, db) => {
  const g = 10 ** (db / 20) / Math.max(activeRms(m), 1e-6);
  for (let i = 0; i < m.length; i++) m[i] = 0.84 * Math.tanh((m[i] * g) / 0.84);
};

/* =============================== write =============================== */
await mkdir(OUT, {recursive: true});
await writeFile(path.join(OUT, "bgm-fataorgana.wav"), wav(L, R));
console.log(`wrote public/audio/bgm-fataorgana.wav (${SECONDS}s, ${BPM} BPM, D major)`);

const tmp = path.join(ROOT, "out", "sfx-tmp");
await mkdir(tmp, {recursive: true});
for (const [name, make] of Object.entries(SFX)) {
  const m = make();
  const fadeN = Math.floor(SR * 0.01);
  for (let i = 0; i < fadeN; i++) m[m.length - 1 - i] *= i / fadeN;
  matchLoudness(m, TARGET_DB[name] ?? -12);
  const src = path.join(tmp, `${name}.wav`);
  await writeFile(src, wav(m, m));
  const dst = path.join(OUT, `sfx-fo-${name}.mp3`);
  const r = spawnSync("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "2", "-b:a", "192k", dst], {cwd: ROOT, shell: true, stdio: "inherit"});
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${name}`);
  console.log(`wrote public/audio/sfx-fo-${name}.mp3`);
}
await rm(tmp, {recursive: true, force: true});
