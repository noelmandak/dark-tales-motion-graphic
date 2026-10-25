/**
 * "Collage" look: archival images (public domain, with recorded provenance) cut out with torn edges and
 * pasted onto kraft paper or newsprint, animated like stop-motion: pieces snap in at 10 fps, jitter slightly,
 * ransom-note headlines assemble letter by letter, and a red marker circles what matters.
 * Images come from public/collage/manifest.json (see scripts/collage-assets.mjs and docs/collage-look.md).
 */
import React, {useContext, useId} from "react";
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from "remotion";
import MANIFEST from "../../public/collage/manifest.json";
import {clamp, prog} from "./kit";
import {ShotEnv, useBrandText, useCue} from "./env";
import type {CollageItem, CollageShot, StampSpec} from "./types";

const IMAGES = (MANIFEST as unknown as {images: Record<string, {file: string; width: number; height: number}>}).images;

const K = {
  kraft: "#b8935f",
  news: "#e9e1cb",
  navy: "#0a1530",
  paper: "#f4edd9",
  ink: "#1a1612",
  red: "#c8202f",
  gold: "#e8b04b",
  tape: "#e8d9a8",
};
const DISPLAY = "Impact, 'Arial Black', sans-serif";
const TYPE = "'Courier New', Courier, monospace";

/* ------------------------------ deterministic randomness ------------------------------ */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** A rectangle with rough, torn edges, centred on 0,0. */
const tornPoints = (w: number, h: number, seed: number, amp = 7) => {
  const r = rng(seed);
  const pts: [number, number][] = [];
  const nx = Math.max(3, Math.round(w / 38));
  const ny = Math.max(3, Math.round(h / 38));
  const j = () => (r() - 0.5) * 2 * amp;
  for (let i = 0; i < nx; i++) pts.push([-w / 2 + (w * i) / nx, -h / 2 + j()]);
  for (let i = 0; i < ny; i++) pts.push([w / 2 + j(), -h / 2 + (h * i) / ny]);
  for (let i = 0; i < nx; i++) pts.push([w / 2 - (w * i) / nx, h / 2 + j()]);
  for (let i = 0; i < ny; i++) pts.push([-w / 2 + j(), h / 2 - (h * i) / ny]);
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
};

/** Stop-motion: movement happens on every third frame. */
const useStep = () => {
  const f = useCurrentFrame();
  return Math.floor(f / 3) * 3;
};

/* ------------------------------ items ------------------------------ */
const useEntrance = (it: CollageItem, index: number, seed: number) => {
  const cf = useCue();
  const sf = useStep();
  const f = useCurrentFrame();
  const start = it.at !== undefined ? cf(it.at) : 6 + index * 5;
  const t = prog(sf, start, start + 12);
  const r = rng(seed);
  const ang = r() * Math.PI * 2;
  const jr = rng(seed + Math.floor(f / 4));
  return {
    visible: sf >= start,
    t,
    offX: Math.cos(ang) * 520 * (1 - t),
    offY: Math.sin(ang) * 520 * (1 - t),
    offRot: (r() - 0.5) * 30 * (1 - t),
    jx: (jr() - 0.5) * 3,
    jy: (jr() - 0.5) * 3,
    jr: (jr() - 0.5) * 0.9,
    start,
  };
};

const ImageItem: React.FC<{it: CollageItem; index: number; ids: {duo: string; sepia: string; shadow: string}}> = ({it, index, ids}) => {
  const f = useCurrentFrame();
  const uid = useId().replace(/:/g, "");
  const seed = hash(`${it.src}-${index}`);
  const e = useEntrance(it, index, seed);
  const meta = IMAGES[it.src ?? ""];
  if (!meta || !e.visible) return null;

  const aspect = meta.width / meta.height;
  const w = it.w ?? 700;
  const h = it.h ?? w / aspect;
  const zoom = it.zoom ?? 1;
  const [fx, fy] = it.focus ?? [0.5, 0.5];
  const iw = Math.max(w, h * aspect) * zoom;
  const ih = iw / aspect;
  const x0 = Math.min(0, Math.max(w - iw, -fx * iw + w / 2));
  const y0 = Math.min(0, Math.max(h - ih, -fy * ih + h / 2));
  const pts = tornPoints(w, h, seed, 7);
  const tint = it.tint ?? "duotone";
  const filter = tint === "duotone" ? `url(#${ids.duo})` : tint === "sepia" ? `url(#${ids.sepia})` : undefined;
  const drift = it.drift ?? [0, 0];
  const sec = f / 30;

  return (
    <g
      transform={`translate(${(it.x ?? 540) + e.offX + e.jx + drift[0] * sec} ${(it.y ?? 800) + e.offY + e.jy + drift[1] * sec}) rotate(${(it.rot ?? 0) + e.offRot + e.jr}) scale(${(it.s ?? 1) * (1 + 0.12 * (1 - e.t))})`}
      filter={`url(#${ids.shadow})`}
    >
      <polygon points={pts} fill={K.paper} stroke={K.paper} strokeWidth={20} strokeLinejoin="round" />
      <clipPath id={uid}>
        <polygon points={pts} />
      </clipPath>
      <g clipPath={`url(#${uid})`}>
        <image href={staticFile(`collage/${meta.file}`)} x={x0 - w / 2} y={y0 - h / 2} width={iw} height={ih} preserveAspectRatio="none" filter={filter} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={K.paper} opacity={0.08} />
      </g>
      {it.tape && (
        <>
          <rect x={-w / 2 + 30} y={-h / 2 - 22} width={150} height={42} fill={K.tape} opacity={0.8} transform={`rotate(-14 ${-w / 2 + 100} ${-h / 2})`} />
          <rect x={w / 2 - 170} y={h / 2 - 20} width={150} height={42} fill={K.tape} opacity={0.8} transform={`rotate(-12 ${w / 2 - 100} ${h / 2})`} />
        </>
      )}
      {it.caption && (
        <g transform={`translate(0 ${h / 2 + 46})`}>
          <rect x={-(it.caption.length * 11 + 40)} y={-26} width={it.caption.length * 22 + 80} height={52} fill={K.paper} />
          <text x={0} y={9} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={30} fill={K.ink}>
            {it.caption}
          </text>
        </g>
      )}
    </g>
  );
};

const CHIP_FONTS = [DISPLAY, "Georgia, serif", TYPE, "'Arial Black', sans-serif", "Georgia, serif"];
const CHIP_STYLES = [
  {bg: K.paper, fg: K.ink},
  {bg: K.ink, fg: K.paper},
  {bg: K.red, fg: "#fbf3df"},
  {bg: K.gold, fg: K.ink},
  {bg: "#ece4cf", fg: K.navy},
  {bg: K.navy, fg: K.gold},
];

/** Ransom-note headline: every letter is a scrap of a different paper and typeface. */
const Ransom: React.FC<{it: CollageItem; index: number; ids: {shadow: string}}> = ({it, index, ids}) => {
  const cf = useCue();
  const sf = useStep();
  const text = (it.text ?? "").toUpperCase();
  const maxW = 940;
  const widest = Math.max(1, ...text.split(/\s+/).map((w) => w.length));
  const size = Math.min(it.size ?? 110, maxW / (widest * 0.66));
  const seed = hash(`${text}-${index}`);
  const start = it.at !== undefined ? cf(it.at) : 6 + index * 5;
  const r = rng(seed);

  // greedy word wrap with randomised chip widths
  type Chip = {ch: string; w: number; fontIdx: number; style: number; rot: number; dy: number; sz: number};
  const lines: Chip[][] = [[]];
  let lineW = 0;
  for (const word of text.split(/\s+/)) {
    const chips: Chip[] = [...word].map((ch) => ({
      ch,
      w: size * ("MW".includes(ch) ? 0.86 : "IJ1".includes(ch) ? 0.4 : 0.54 + r() * 0.12),
      fontIdx: Math.floor(r() * CHIP_FONTS.length),
      style: Math.floor(r() * CHIP_STYLES.length),
      rot: (r() - 0.5) * 9,
      dy: (r() - 0.5) * size * 0.12,
      sz: size * (0.82 + r() * 0.3),
    }));
    const ww = chips.reduce((s, c) => s + c.w + 4, 0);
    if (lineW + ww > maxW && lines[lines.length - 1].length) {
      lines.push([]);
      lineW = 0;
    }
    lines[lines.length - 1].push(...chips, {ch: " ", w: size * 0.3, fontIdx: 0, style: 0, rot: 0, dy: 0, sz: size});
    lineW += ww + size * 0.3;
  }
  let n = 0;
  return (
    <g transform={`translate(${it.x ?? 540} ${it.y ?? 400}) rotate(${it.rot ?? 0})`} filter={`url(#${ids.shadow})`}>
      {lines.map((line, li) => {
        const total = line.reduce((s, c) => s + c.w + 4, 0);
        let x = -total / 2;
        return (
          <g key={li} transform={`translate(0 ${(li - (lines.length - 1) / 2) * size * 1.25})`}>
            {line.map((c, ci) => {
              const cx = x + c.w / 2;
              x += c.w + 4;
              if (c.ch === " ") return null;
              const idx = n++;
              if (sf < start + idx * 2) return null;
              const st = CHIP_STYLES[c.style];
              return (
                <g key={ci} transform={`translate(${cx} ${c.dy}) rotate(${c.rot})`}>
                  <rect x={-c.w / 2} y={-size * 0.62} width={c.w} height={size * 1.18} fill={st.bg} />
                  <text x={0} y={size * 0.28} textAnchor="middle" fontFamily={CHIP_FONTS[c.fontIdx]} fontWeight={900} fontSize={Math.min(c.sz, size * 1.05)} fill={st.fg} textLength={c.w * 0.84} lengthAdjust="spacingAndGlyphs">
                    {c.ch}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

/** Hand-drawn marker: circle / arrow / underline / cross, drawn on over ~14 frames. */
const Marker: React.FC<{it: CollageItem; index: number}> = ({it, index}) => {
  const cf = useCue();
  const sf = useStep();
  const start = it.at !== undefined ? cf(it.at) : 10 + index * 5;
  const p = prog(sf, start, start + 14, (t) => t);
  if (p <= 0) return null;
  const w = it.w ?? 300;
  const h = it.h ?? 220;
  const col = it.color === "gold" ? K.gold : it.color === "ink" ? K.ink : K.red;
  const r = rng(hash(`${it.shape}-${index}`));
  const common = {fill: "none", stroke: col, strokeWidth: 13, strokeLinecap: "round", strokeLinejoin: "round", pathLength: 1, strokeDasharray: 1} as const;
  let d = "";
  let extra: React.ReactNode = null;
  if (it.shape === "arrow") {
    d = `M${-w / 2} ${h / 3} Q ${-w / 6} ${-h / 2} ${w / 2} ${-h / 6}`;
    extra = (
      <path
        d={`M${w / 2 - 50} ${-h / 6 - 38} L${w / 2} ${-h / 6} L${w / 2 - 46} ${-h / 6 + 30}`}
        {...common}
        strokeDashoffset={1 - Math.max(0, (p - 0.8) / 0.2)}
      />
    );
  } else if (it.shape === "underline") {
    const pts = Array.from({length: 24}).map((_, i) => `${-w / 2 + (w * i) / 23},${Math.sin(i * 1.3) * 6 + (r() - 0.5) * 5}`);
    d = `M${pts.join(" L")}`;
  } else if (it.shape === "cross") {
    d = `M${-w / 2} ${-h / 2} L${w / 2} ${h / 2} M${w / 2} ${-h / 2} L${-w / 2} ${h / 2}`;
  } else {
    // circle: a bit more than one turn, with a wobbly radius
    const n = 40;
    const pts = Array.from({length: n + 1}).map((_, i) => {
      const a = (i / n) * Math.PI * 2.15 - 0.4;
      const k = 1 + (r() - 0.5) * 0.08 + (i / n) * 0.07;
      return `${(Math.cos(a) * w * k) / 2},${(Math.sin(a) * h * k) / 2}`;
    });
    d = `M${pts.join(" L")}`;
  }
  return (
    <g transform={`translate(${it.x ?? 540} ${it.y ?? 700}) rotate(${it.rot ?? 0})`} opacity={0.92}>
      <path d={d} {...common} strokeDashoffset={1 - p} />
      {extra}
    </g>
  );
};

/** Typed label on a strip of torn paper. */
const Label: React.FC<{it: CollageItem; index: number; ids: {shadow: string}}> = ({it, index, ids}) => {
  const cf = useCue();
  const f = useCurrentFrame();
  const text = it.text ?? "";
  const size = it.size ?? 40;
  const start = it.at !== undefined ? cf(it.at) : 8 + index * 5;
  if (f < start) return null;
  const shown = text.slice(0, Math.max(0, Math.floor((f - start) / 1.5)));
  const w = text.length * size * 0.62 + 70;
  const h = size * 1.7;
  const pts = tornPoints(w, h, hash(text), 4);
  return (
    <g transform={`translate(${it.x ?? 540} ${it.y ?? 1200}) rotate(${it.rot ?? 0})`} filter={`url(#${ids.shadow})`}>
      <polygon points={pts} fill={it.color === "red" ? K.red : it.color === "gold" ? K.gold : K.paper} />
      <rect x={-w / 2 - 14} y={-h / 2 - 8} width={70} height={30} fill={K.tape} opacity={0.8} transform="rotate(-18)" />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={size} fill={it.color === "red" ? "#fbf3df" : K.ink} xmlSpace="preserve">
        {shown}
      </text>
    </g>
  );
};

const InkStamp: React.FC<{spec: StampSpec; delay: number}> = ({spec, delay}) => {
  const sf = useStep();
  if (sf < delay) return null;
  const size = spec.size ?? 80;
  const w = spec.text.length * size * 0.62 + 70;
  const col = spec.color === "gold" ? K.gold : spec.color === "navy" ? K.navy : K.red;
  const t = prog(sf, delay, delay + 6);
  return (
    <g transform={`translate(${spec.x ?? 540} ${spec.y ?? 800}) rotate(${spec.rot ?? -8}) scale(${1 + 1.2 * (1 - t)})`} opacity={0.5 + 0.45 * t}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.6} fill="none" stroke={col} strokeWidth={10} />
      <text x={0} y={size * 0.3} textAnchor="middle" fontFamily={DISPLAY} fontSize={size} fill={col} letterSpacing={4}>
        {spec.text}
      </text>
    </g>
  );
};

const renderItem = (it: CollageItem, i: number, ids: {duo: string; sepia: string; shadow: string}) => {
  switch (it.kind) {
    case "image": return <ImageItem key={i} it={it} index={i} ids={ids} />;
    case "ransom": return <Ransom key={i} it={it} index={i} ids={ids} />;
    case "marker": return <Marker key={i} it={it} index={i} />;
    case "label": return <Label key={i} it={it} index={i} ids={ids} />;
    default: return null;
  }
};

/* ------------------------------ background ------------------------------ */
const Paper: React.FC<{bg: string; noiseId: string}> = ({bg, noiseId}) => (
  <g>
    <rect width={1080} height={1920} fill={bg === "newsprint" ? K.news : bg === "navy" ? K.navy : K.kraft} />
    {bg === "newsprint" &&
      Array.from({length: 3}).map((_, c) =>
        Array.from({length: 46}).map((__, i) => (
          <rect key={`${c}-${i}`} x={60 + c * 340} y={110 + i * 38} width={(i % 7 === 0 ? 120 : 300) - (i % 5) * 18} height={7} fill="#1a1612" opacity={0.12} />
        ))
      )}
    <rect width={1080} height={1920} fill="#000" filter={`url(#${noiseId})`} />
  </g>
);

/* ------------------------------ the shot ------------------------------ */
export const CollageView: React.FC<{s: CollageShot}> = ({s}) => {
  const cf = useCue();
  const bt = useBrandText();
  const sf = useStep();
  const env = useContext(ShotEnv);
  const uid = useId().replace(/:/g, "");
  const ids = {duo: `${uid}d`, sepia: `${uid}s`, shadow: `${uid}h`};
  const push = interpolate(sf, [0, 180], [1, 1.045], clamp);
  const bg = s.bg ?? "kraft";

  return (
    <AbsoluteFill style={{background: bg === "navy" ? K.navy : K.kraft}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <filter id={`${uid}n`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="4" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 0.45 0" />
          </filter>
          <filter id={ids.shadow} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx={5} dy={12} stdDeviation={8} floodColor="#000" floodOpacity={0.45} />
          </filter>
          <filter id={ids.duo} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.04 0.42 0.97" />
              <feFuncG type="table" tableValues="0.07 0.36 0.92" />
              <feFuncB type="table" tableValues="0.17 0.33 0.82" />
            </feComponentTransfer>
          </filter>
          <filter id={ids.sepia} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0" />
          </filter>
          <radialGradient id={`${uid}v`} cx="50%" cy="45%" r="75%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#2a1808" stopOpacity={0.5} />
          </radialGradient>
          <linearGradient id={`${uid}sc`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={K.navy} stopOpacity={0} />
            <stop offset="0.45" stopColor={K.navy} stopOpacity={0.6} />
            <stop offset="1" stopColor={K.navy} stopOpacity={0.92} />
          </linearGradient>
        </defs>

        <Paper bg={bg} noiseId={`${uid}n`} />

        <g transform={`translate(540 800) scale(${push}) translate(-540 -800)`}>
          {s.items.map((it, i) => renderItem(it, i, ids))}
          {s.stamps?.map((st, i) => (
            <InkStamp key={i} spec={st} delay={cf(st.at)} />
          ))}
        </g>

        <rect width={1080} height={1920} fill={`url(#${uid}v)`} />
        {/* footer scrim keeps the brand subtitles readable on light paper */}
        <rect x={0} y={1330} width={1080} height={590} fill={`url(#${uid}sc)`} />

        {s.tab && sf >= 3 && (
          <g transform={`translate(${70 + (s.tab.length * 26 + 70) / 2} 128) rotate(-2)`} filter={`url(#${ids.shadow})`}>
            <polygon points={tornPoints(s.tab.length * 26 + 70, 64, hash(s.tab), 3)} fill={K.paper} />
            <text x={0} y={12} textAnchor="middle" fontFamily={TYPE} fontWeight={800} fontSize={34} letterSpacing={3} fill={K.ink}>
              {s.tab}
            </text>
          </g>
        )}

        {s.cta && (
          <g>
            <Ransom it={{kind: "ransom", text: bt.name, x: 540, y: 560, size: 130, at: env.start + 0.2}} index={0} ids={ids} />
            <Ransom it={{kind: "ransom", text: bt.ctaButton, x: 540, y: 880, size: 110, at: env.start + 0.9, rot: -3}} index={1} ids={ids} />
            <Label it={{kind: "label", text: bt.ctaQuestion, x: 540, y: 1090, size: 34, at: env.start + 1.7, rot: 1.5}} index={2} ids={ids} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
