/**
 * "Comic" look: a 1940s pulp-comic page. Inked panels slam onto a dark page, each with a flat-colour backdrop,
 * halftone dots, faceless figures, a yellow caption box and sound-effect lettering. Shots change with a zig-zag page wipe.
 * Everything is drawn in code (no third-party images), so there is nothing to license.
 */
import React, {useContext, useId} from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp, prog} from "./kit";
import {ShotEnv, useBrandText, useCue} from "./env";
import type {ComicArt, ComicPanel, ComicShot} from "./types";

const K = {
  ink: "#14110f",
  page: "#161226",
  paper: "#f3e9cf",
  yellow: "#f5d547",
  red: "#d1342b",
  blue: "#2a4d94",
  teal: "#2f8f86",
  plum: "#5b3a7a",
  orange: "#e8862c",
  green: "#7bd88f",
  skin: "#d9a77a",
};
const DISPLAY = "Impact, 'Arial Black', sans-serif";
const TYPE = "'Courier New', Courier, monospace";
const HAND = "'Comic Sans MS', 'Segoe Print', 'Trebuchet MS', cursive";
const pop = Easing.out(Easing.back(1.8));

const LAYOUTS: Record<NonNullable<ComicShot["layout"]>, {x: number; y: number; w: number; h: number}[]> = {
  one: [{x: 40, y: 180, w: 1000, h: 1180}],
  two: [
    {x: 40, y: 180, w: 1000, h: 570},
    {x: 40, y: 790, w: 1000, h: 570},
  ],
  three: [
    {x: 40, y: 180, w: 1000, h: 620},
    {x: 40, y: 840, w: 488, h: 520},
    {x: 552, y: 840, w: 488, h: 520},
  ],
};

const wrap = (text: string, maxChars: number) => {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    if (cur && (cur + " " + word).length > maxChars) {
      lines.push(cur);
      cur = word;
    } else cur = cur ? cur + " " + word : word;
  }
  if (cur) lines.push(cur);
  return lines;
};

/* ------------------------------ art ------------------------------ */
type ArtProps = {a: ComicArt; start: number; pw: number; ph: number};

/** Wraps an art element: pops in at its cue, then renders `children` at x,y with scale/rotation. */
const Pop: React.FC<{a: ComicArt; start: number; children: React.ReactNode}> = ({a, start, children}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const at = a.at !== undefined ? cf(a.at) : start + 3;
  if (f < at) return null;
  const t = prog(f, at, at + 8, pop);
  return (
    <g transform={`translate(${a.x ?? 0} ${a.y ?? 0}) rotate(${a.rot ?? 0}) scale(${(a.s ?? 1) * (a.flip ? -1 : 1) * (0.5 + 0.5 * t)} ${(a.s ?? 1) * (0.5 + 0.5 * t)})`} opacity={Math.min(1, t * 2)}>
      {children}
    </g>
  );
};

const Figure: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  const a = p.a;
  const col = a.color ?? K.blue;
  const pose = a.pose ?? "stand";
  const bob = Math.sin(f / 9) * 2;
  const lean = pose === "slump" ? -12 : pose === "run" ? 9 : 0;
  const stroke = {stroke: K.ink, strokeWidth: 6, strokeLinejoin: "round" as const};
  const arm = (x1: number, y1: number, x2: number, y2: number) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={K.ink} strokeWidth={30} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={20} strokeLinecap="round" />
    </>
  );
  const sw = pose === "run" ? Math.sin(f / 3) * 22 : 0;
  return (
    <Pop a={a} start={p.start}>
      <g transform={`rotate(${lean})`}>
        <rect x={-30 + sw} y={-110} width={24} height={110} fill="#2b2a33" {...stroke} />
        <rect x={6 - sw} y={-110} width={24} height={110} fill="#2b2a33" {...stroke} />
        {pose === "point" ? arm(40, -225, 130, -270) : pose === "hold" ? arm(40, -225, 80, -330) : arm(46, -225, 62, -130)}
        <rect x={-46} y={-250} width={92} height={150} rx={24} fill={col} {...stroke} />
        {arm(-46, -225, -62, -130 + (pose === "run" ? -30 : 0))}
        <circle cx={0} cy={-290 + bob} r={36} fill={K.skin} {...stroke} />
        {a.hat && (
          <g transform={`translate(0 ${-312 + bob})`}>
            <ellipse cx={0} cy={0} rx={56} ry={13} fill={K.ink} />
            <rect x={-30} y={-34} width={60} height={36} rx={12} fill="#2b2a33" {...stroke} />
          </g>
        )}
        {pose === "hold" && (
          <g transform="translate(80 -345)">
            <circle r={70} fill={K.yellow} opacity={0.35} />
            <rect x={-14} y={-18} width={28} height={36} rx={6} fill={K.yellow} {...stroke} />
          </g>
        )}
      </g>
    </Pop>
  );
};

const Crowd: React.FC<ArtProps> = (p) => {
  const n = p.a.n ?? 5;
  return (
    <Pop a={p.a} start={p.start}>
      {Array.from({length: n}).map((_, i) => (
        <g key={i} transform={`translate(${(i - (n - 1) / 2) * 118} ${(i % 2) * 26}) scale(0.58)`}>
          <Figure a={{kind: "figure", color: ["#2a4d94", "#8a3a3a", "#3a6b4f", "#6b4a8a", "#a8742a"][i % 5], pose: i % 2 ? "hold" : "stand", hat: i % 3 === 0}} start={p.start - 3} pw={p.pw} ph={p.ph} />
        </g>
      ))}
    </Pop>
  );
};

const House: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  const col = p.a.color ?? "#b9503c";
  const lit = (i: number) => (Math.sin(f / 11 + i * 2.1) > -0.6 ? K.yellow : "#a98f3a");
  return (
    <Pop a={p.a} start={p.start}>
      <rect x={-130} y={-190} width={260} height={190} fill={col} stroke={K.ink} strokeWidth={7} />
      <polygon points="-155,-190 0,-300 155,-190" fill="#3a2a2a" stroke={K.ink} strokeWidth={7} strokeLinejoin="round" />
      <rect x={70} y={-310} width={34} height={70} fill="#6b3b30" stroke={K.ink} strokeWidth={6} />
      <rect x={-34} y={-110} width={68} height={110} fill="#3a2418" stroke={K.ink} strokeWidth={6} />
      <rect x={-105} y={-160} width={56} height={56} fill={lit(0)} stroke={K.ink} strokeWidth={6} />
      <rect x={50} y={-160} width={56} height={56} fill={lit(1)} stroke={K.ink} strokeWidth={6} />
      <line x1={-77} y1={-160} x2={-77} y2={-104} stroke={K.ink} strokeWidth={4} />
      <line x1={78} y1={-160} x2={78} y2={-104} stroke={K.ink} strokeWidth={4} />
    </Pop>
  );
};

const Town: React.FC<ArtProps> = (p) => (
  <Pop a={p.a} start={p.start}>
    {[-330, -110, 110, 330].map((x, i) => (
      <g key={i} transform={`translate(${x} ${(i % 2) * -14}) scale(${0.55 + (i % 3) * 0.06})`}>
        <House a={{kind: "house", color: ["#b9503c", "#a8742a", "#5a6f8f", "#8a5a7a"][i]}} start={p.start - 3} pw={p.pw} ph={p.ph} />
      </g>
    ))}
  </Pop>
);

const Gas: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  return (
    <Pop a={p.a} start={p.start}>
      {Array.from({length: 8}).map((_, i) => {
        const life = ((f / 70 + i / 8) % 1 + 1) % 1;
        const r = 38 + (i % 4) * 16 + life * 30;
        return (
          <circle
            key={i}
            cx={Math.sin(f / 17 + i * 1.7) * 36 + (i - 4) * 18}
            cy={-life * 330}
            r={r}
            fill={K.green}
            stroke={K.ink}
            strokeWidth={5}
            opacity={0.78 * Math.sin(Math.PI * life)}
          />
        );
      })}
    </Pop>
  );
};

const Beam: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  const sweep = Math.sin(f / 22) * 7;
  return (
    <Pop a={p.a} start={p.start}>
      <g transform={`rotate(${sweep})`}>
        <polygon points="0,0 760,-170 760,170" fill="#fff6b0" opacity={0.42} />
        <polygon points="0,0 760,-70 760,70" fill="#fff6b0" opacity={0.3} />
        <circle r={20} fill={K.yellow} stroke={K.ink} strokeWidth={6} />
      </g>
    </Pop>
  );
};

const Cloth: React.FC<ArtProps> = (p) => (
  <Pop a={p.a} start={p.start}>
    <polygon points="-120,-20 -60,-52 0,-30 70,-58 130,-24 112,30 40,50 -30,34 -100,52" fill="#efe4c6" stroke={K.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-80 -4 Q-30 -22 20 -2 T104 -2 M-70 24 Q-20 6 36 26 T96 22" fill="none" stroke="#b9a77e" strokeWidth={5} />
  </Pop>
);

const Paper: React.FC<ArtProps> = (p) => (
  <Pop a={p.a} start={p.start}>
    <rect x={-170} y={-230} width={340} height={440} fill={K.paper} stroke={K.ink} strokeWidth={7} />
    <text x={0} y={-170} textAnchor="middle" fontFamily={DISPLAY} fontSize={64} fill={K.ink} letterSpacing={4}>{p.a.head ?? "EXTRA"}</text>
    <line x1={-140} y1={-148} x2={140} y2={-148} stroke={K.ink} strokeWidth={5} />
    <text x={0} y={-96} textAnchor="middle" fontFamily={DISPLAY} fontSize={Math.min(48, 300 / Math.max(6, (p.a.text ?? "").length) * 1.7)} fill={K.red}>{p.a.text ?? ""}</text>
    {Array.from({length: 8}).map((_, i) => (
      <rect key={i} x={-140} y={-58 + i * 30} width={i % 3 === 2 ? 180 : 280} height={10} fill={K.ink} opacity={0.55} />
    ))}
  </Pop>
);

const Flask: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  return (
    <Pop a={p.a} start={p.start}>
      <polygon points="-34,-230 34,-230 34,-150 130,0 -130,0 -34,-150" fill="#d6f0ee" opacity={0.85} stroke={K.ink} strokeWidth={7} strokeLinejoin="round" />
      <polygon points="-98,-50 98,-50 130,0 -130,0" fill={K.green} stroke={K.ink} strokeWidth={5} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => {
        const life = ((f / 50 + i / 3) % 1 + 1) % 1;
        return <circle key={i} cx={-40 + i * 40} cy={-20 - life * 150} r={10 + i * 3} fill="#d6f0ee" stroke={K.ink} strokeWidth={3} opacity={1 - life} />;
      })}
    </Pop>
  );
};

const Clock: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  return (
    <Pop a={p.a} start={p.start}>
      <circle r={150} fill={K.paper} stroke={K.ink} strokeWidth={10} />
      {Array.from({length: 12}).map((_, i) => (
        <line key={i} x1={0} y1={-132} x2={0} y2={-112} stroke={K.ink} strokeWidth={7} transform={`rotate(${i * 30})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-100} stroke={K.ink} strokeWidth={10} strokeLinecap="round" transform={`rotate(${f * 6})`} />
      <line x1={0} y1={0} x2={0} y2={-66} stroke={K.red} strokeWidth={12} strokeLinecap="round" transform={`rotate(${f * 0.5 + 300})`} />
      <circle r={12} fill={K.ink} />
    </Pop>
  );
};

const Question: React.FC<ArtProps> = (p) => {
  const f = useCurrentFrame();
  return (
    <Pop a={p.a} start={p.start}>
      <text y={Math.sin(f / 8) * 8} textAnchor="middle" fontFamily="'Arial Black', Impact, sans-serif" fontSize={300} fill={p.a.color ?? K.yellow} stroke={K.ink} strokeWidth={14} paintOrder="stroke">?</text>
    </Pop>
  );
};

const Moon: React.FC<ArtProps> = (p) => (
  <Pop a={p.a} start={p.start}>
    <circle r={70} fill="#fbeaa0" stroke={K.ink} strokeWidth={6} />
    <circle cx={-20} cy={-15} r={14} fill="#e5cf7a" />
    <circle cx={26} cy={22} r={10} fill="#e5cf7a" />
  </Pop>
);

const renderArt = (a: ComicArt, i: number, start: number, pw: number, ph: number) => {
  const p = {a, start, pw, ph};
  switch (a.kind) {
    case "figure": return <Figure key={i} {...p} />;
    case "crowd": return <Crowd key={i} {...p} />;
    case "house": return <House key={i} {...p} />;
    case "town": return <Town key={i} {...p} />;
    case "gas": return <Gas key={i} {...p} />;
    case "beam": return <Beam key={i} {...p} />;
    case "cloth": return <Cloth key={i} {...p} />;
    case "paper": return <Paper key={i} {...p} />;
    case "flask": return <Flask key={i} {...p} />;
    case "clock": return <Clock key={i} {...p} />;
    case "question": return <Question key={i} {...p} />;
    case "moon": return <Moon key={i} {...p} />;
    default: return null;
  }
};

/* ------------------------------ panel furniture ------------------------------ */
const Backdrop: React.FC<{bg: NonNullable<ComicPanel["bg"]>; w: number; h: number; uid: string}> = ({bg, w, h, uid}) => {
  const f = useCurrentFrame();
  if (bg === "burst" || bg === "gas" || bg === "red") {
    const [c1, c2] = bg === "gas" ? ["#b5e08a", "#6fb872"] : bg === "red" ? ["#d1342b", "#8f1f1f"] : [K.yellow, K.orange];
    const rays = 24;
    const spin = f * 0.08;
    return (
      <g>
        <rect width={w} height={h} fill={c1} />
        {Array.from({length: rays / 2}).map((_, i) => {
          const a0 = ((i * 2) / rays) * Math.PI * 2 + (spin * Math.PI) / 180;
          const a1 = ((i * 2 + 1) / rays) * Math.PI * 2 + (spin * Math.PI) / 180;
          const R = Math.max(w, h) * 1.2;
          return <polygon key={i} points={`${w / 2},${h / 2} ${w / 2 + Math.cos(a0) * R},${h / 2 + Math.sin(a0) * R} ${w / 2 + Math.cos(a1) * R},${h / 2 + Math.sin(a1) * R}`} fill={c2} />;
        })}
      </g>
    );
  }
  if (bg === "paper") return <rect width={w} height={h} fill={K.paper} />;
  if (bg === "interior") {
    return (
      <g>
        <rect width={w} height={h} fill="#e9c27a" />
        <rect y={h * 0.7} width={w} height={h * 0.3} fill="#a8672f" />
        <rect y={h * 0.68} width={w} height={14} fill={K.ink} opacity={0.5} />
        {Array.from({length: Math.ceil(w / 90)}).map((_, i) => (
          <rect key={i} x={i * 90 + 40} y={0} width={6} height={h * 0.68} fill="#c98a4b" opacity={0.6} />
        ))}
      </g>
    );
  }
  const dusk = bg === "dusk";
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? K.plum : "#0b1230"} />
          <stop offset="1" stopColor={dusk ? K.orange : "#2a3a6e"} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}sky)`} />
      {!dusk && Array.from({length: 26}).map((_, i) => <circle key={i} cx={(i * 197) % w} cy={((i * 83) % (h * 0.6)) + 10} r={i % 4 === 0 ? 3.5 : 2} fill="#fff6d6" opacity={0.5 + 0.4 * Math.sin(f / 9 + i)} />)}
      <rect y={h * 0.82} width={w} height={h * 0.18} fill={dusk ? "#2a1a2a" : "#0a0d1c"} />
      <rect y={h * 0.82} width={w} height={8} fill={K.ink} />
    </g>
  );
};

const Caption: React.FC<{c: NonNullable<ComicPanel["caption"]>; pw: number; ph: number; start: number}> = ({c, pw, ph, start}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const at = c.at !== undefined ? cf(c.at) : start + 2;
  if (f < at) return null;
  const size = 34;
  const lines = wrap(c.text.toUpperCase(), Math.max(10, Math.floor((pw - 90) / (size * 0.62))));
  const w = Math.min(pw - 36, Math.max(...lines.map((l) => l.length)) * size * 0.62 + 36);
  const h = lines.length * size * 1.25 + 24;
  const t = prog(f, at, at + 6, pop);
  const y = c.pos === "bottom" ? ph - h - 18 : 18;
  return (
    <g transform={`translate(${c.pos === "bottom" ? pw - w - 18 : 18} ${y}) scale(${0.7 + 0.3 * t})`} opacity={Math.min(1, t * 2)}>
      <rect x={5} y={6} width={w} height={h} fill={K.ink} />
      <rect width={w} height={h} fill={K.yellow} stroke={K.ink} strokeWidth={5} />
      {lines.map((l, i) => (
        <text key={i} x={18} y={30 + i * size * 1.25} fontFamily={TYPE} fontWeight={800} fontSize={size} fill={K.ink}>
          {l}
        </text>
      ))}
    </g>
  );
};

const Sfx: React.FC<{c: NonNullable<ComicPanel["sfx"]>; pw: number; ph: number; start: number}> = ({c, pw, ph, start}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const at = c.at !== undefined ? cf(c.at) : start + 6;
  if (f < at) return null;
  const size = c.size ?? 150;
  const t = prog(f, at, at + 7, pop);
  const shake = f - at < 10 ? Math.sin((f - at) * 5) * 5 : 0;
  const fill = c.color === "red" ? K.red : c.color === "white" ? "#fff" : K.yellow;
  const fit = Math.min(size, ((pw - 60) / Math.max(3, c.text.length)) * 1.55);
  return (
    <g transform={`translate(${c.x ?? pw / 2} ${c.y ?? ph / 2}) rotate(${(c.rot ?? -6) + shake}) scale(${0.4 + 0.6 * t})`} opacity={Math.min(1, t * 2)}>
      <text x={7} y={9} textAnchor="middle" fontFamily={DISPLAY} fontSize={fit} fill={K.ink} stroke={K.ink} strokeWidth={fit * 0.2} paintOrder="stroke" letterSpacing={3}>{c.text}</text>
      <text textAnchor="middle" fontFamily={DISPLAY} fontSize={fit} fill={fill} stroke={K.ink} strokeWidth={fit * 0.12} paintOrder="stroke" letterSpacing={3}>{c.text}</text>
    </g>
  );
};

const Bubble: React.FC<{c: NonNullable<ComicPanel["bubble"]>; pw: number; ph: number; start: number}> = ({c, pw, ph, start}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const at = c.at !== undefined ? cf(c.at) : start + 6;
  if (f < at) return null;
  const size = 40;
  const lines = wrap(c.text, 14);
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.58 + 70;
  const h = lines.length * size * 1.2 + 50;
  const t = prog(f, at, at + 6, pop);
  const [tx, ty] = c.tail ?? [30, 90];
  const kind = c.kind ?? "speech";
  const burst = Array.from({length: 18}).map((_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = i % 2 ? 1 : 1.22;
    return `${Math.cos(a) * (w / 2) * r},${Math.sin(a) * (h / 2) * r}`;
  }).join(" ");
  return (
    <g transform={`translate(${c.x ?? pw / 2} ${c.y ?? ph / 3}) scale(${0.6 + 0.4 * t})`} opacity={Math.min(1, t * 2)}>
      {kind === "shout" ? (
        <polygon points={burst} fill="#fff" stroke={K.ink} strokeWidth={6} strokeLinejoin="round" />
      ) : (
        <>
          <ellipse rx={w / 2} ry={h / 2} fill="#fff" stroke={K.ink} strokeWidth={6} />
          {kind === "thought" ? (
            <>
              <circle cx={tx * 0.5} cy={h / 2 + 18} r={16} fill="#fff" stroke={K.ink} strokeWidth={5} />
              <circle cx={tx} cy={h / 2 + 52} r={10} fill="#fff" stroke={K.ink} strokeWidth={5} />
            </>
          ) : (
            <polygon points={`${-18},${h / 2 - 8} ${18},${h / 2 - 8} ${tx},${ty + h / 2}`} fill="#fff" stroke={K.ink} strokeWidth={6} strokeLinejoin="round" />
          )}
          <ellipse rx={w / 2 - 4} ry={h / 2 - 4} fill="#fff" />
        </>
      )}
      {lines.map((l, i) => (
        <text key={i} y={(i - (lines.length - 1) / 2) * size * 1.2 + size * 0.34} textAnchor="middle" fontFamily={HAND} fontWeight={800} fontSize={size} fill={K.ink}>
          {l}
        </text>
      ))}
    </g>
  );
};

/* ------------------------------ one panel ------------------------------ */
const Panel: React.FC<{p: ComicPanel; geo: {x: number; y: number; w: number; h: number}; index: number; uid: string}> = ({p, geo, index, uid}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const start = p.at !== undefined ? cf(p.at) : 4 + index * 8;
  if (f < start) return null;
  const t = prog(f, start, start + 8, pop);
  const clipId = `${uid}c${index}`;
  const push = interpolate(f - start, [0, 200], [1, 1.06], clamp);
  const cx = geo.x + geo.w / 2;
  const cy = geo.y + geo.h / 2;
  const dotId = `${uid}dots`;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${(1 - t) * (index % 2 ? 3 : -3)}) scale(${1 + (1 - t) * 0.22}) translate(${-cx} ${-cy})`} opacity={Math.min(1, t * 2)}>
      <rect x={geo.x + 8} y={geo.y + 10} width={geo.w} height={geo.h} fill="#000" opacity={0.5} />
      <clipPath id={clipId}>
        <rect x={geo.x} y={geo.y} width={geo.w} height={geo.h} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${geo.x} ${geo.y})`}>
          <g transform={`translate(${geo.w / 2} ${geo.h / 2}) scale(${push}) translate(${-geo.w / 2} ${-geo.h / 2})`}>
            <Backdrop bg={p.bg ?? "night"} w={geo.w} h={geo.h} uid={`${uid}${index}`} />
            {p.art?.map((a, i) => renderArt(a, i, start, geo.w, geo.h))}
          </g>
          <rect width={geo.w} height={geo.h} fill={`url(#${dotId})`} />
          {p.bubble && <Bubble c={p.bubble} pw={geo.w} ph={geo.h} start={start} />}
          {p.sfx && <Sfx c={p.sfx} pw={geo.w} ph={geo.h} start={start} />}
          {p.caption && <Caption c={p.caption} pw={geo.w} ph={geo.h} start={start} />}
        </g>
      </g>
      <rect x={geo.x} y={geo.y} width={geo.w} height={geo.h} fill="none" stroke={K.ink} strokeWidth={12} />
      <rect x={geo.x - 8} y={geo.y - 8} width={geo.w + 16} height={geo.h + 16} fill="none" stroke={K.paper} strokeWidth={4} />
    </g>
  );
};

/* ------------------------------ the shot ------------------------------ */
export const ComicView: React.FC<{s: ComicShot}> = ({s}) => {
  const f = useCurrentFrame();
  const bt = useBrandText();
  const env = useContext(ShotEnv);
  const uid = useId().replace(/:/g, "");
  const layout = LAYOUTS[s.layout ?? (s.panels.length >= 3 ? "three" : s.panels.length === 2 ? "two" : "one")];
  const ctaT = (sec: number) => prog(f, Math.round(sec * 30) + env.pad, Math.round(sec * 30) + env.pad + 8, pop);

  return (
    <AbsoluteFill style={{background: K.page}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <pattern id={`${uid}dots`} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
            <circle cx={8} cy={8} r={3.2} fill={K.ink} opacity={0.16} />
          </pattern>
          <pattern id={`${uid}pg`} width={26} height={26} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx={13} cy={13} r={2.6} fill="#2a2147" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${uid}pg)`} />

        {!s.cta &&
          s.panels.map((p, i) => {
            const geo = {...layout[Math.min(i, layout.length - 1)], ...(p.x !== undefined ? {x: p.x} : {}), ...(p.y !== undefined ? {y: p.y} : {}), ...(p.w !== undefined ? {w: p.w} : {}), ...(p.h !== undefined ? {h: p.h} : {})};
            return <Panel key={i} p={p} geo={geo} index={i} uid={uid} />;
          })}

        {s.cta && (
          <g>
            <g transform="translate(40 230)">
              <clipPath id={`${uid}ctac`}>
                <rect width={1000} height={1080} />
              </clipPath>
              <g clipPath={`url(#${uid}ctac)`}>
                <Backdrop bg="burst" w={1000} h={1080} uid={`${uid}cta`} />
                <rect width={1000} height={1080} fill={`url(#${uid}dots)`} />
              </g>
              <rect width={1000} height={1080} fill="none" stroke={K.ink} strokeWidth={12} />
            </g>
            <g transform={`translate(540 640) scale(${0.5 + 0.5 * ctaT(0.2)})`} opacity={Math.min(1, ctaT(0.2) * 2)}>
              <text x={7} y={9} textAnchor="middle" fontFamily={DISPLAY} fontSize={Math.min(190, 960 / Math.max(5, bt.name.length) * 1.55)} fill={K.ink} stroke={K.ink} strokeWidth={30} paintOrder="stroke" letterSpacing={4}>{bt.name.toUpperCase()}</text>
              <text textAnchor="middle" fontFamily={DISPLAY} fontSize={Math.min(190, 960 / Math.max(5, bt.name.length) * 1.55)} fill={K.red} stroke={K.paper} strokeWidth={16} paintOrder="stroke" letterSpacing={4}>{bt.name.toUpperCase()}</text>
            </g>
            <g transform={`translate(540 940) rotate(-3) scale(${0.5 + 0.5 * ctaT(0.9)})`} opacity={Math.min(1, ctaT(0.9) * 2)}>
              <rect x={-300} y={-70} width={600} height={140} fill={K.ink} transform="translate(8 10)" />
              <rect x={-300} y={-70} width={600} height={140} fill={K.yellow} stroke={K.ink} strokeWidth={8} />
              <text y={26} textAnchor="middle" fontFamily={DISPLAY} fontSize={92} fill={K.ink} letterSpacing={4}>{bt.ctaButton.toUpperCase()}</text>
            </g>
            <g transform={`translate(540 1130) scale(${0.6 + 0.4 * ctaT(1.7)})`} opacity={Math.min(1, ctaT(1.7) * 2)}>
              <text textAnchor="middle" fontFamily={HAND} fontWeight={800} fontSize={42} fill={K.ink} stroke={K.paper} strokeWidth={9} paintOrder="stroke">{bt.ctaQuestion}</text>
            </g>
          </g>
        )}

        {s.tab && (
          <g transform="translate(40 66) skewX(-8)">
            <rect x={5} y={6} width={s.tab.length * 25 + 50} height={70} fill={K.ink} />
            <rect width={s.tab.length * 25 + 50} height={70} fill={K.red} stroke={K.paper} strokeWidth={4} />
            <text x={26} y={48} fontFamily={DISPLAY} fontSize={40} fill={K.paper} letterSpacing={3}>{s.tab}</text>
          </g>
        )}

        <rect x={0} y={1380} width={1080} height={540} fill="#000" opacity={0.0} />
      </svg>
    </AbsoluteFill>
  );
};
