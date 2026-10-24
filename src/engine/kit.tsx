import React, {createContext, useContext, useId} from "react";
import BRAND from "../brand/brand.json";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

/* ---------- Theme: night-navy, gold accents, brick red, rim-lit silhouettes ---------- */
export const C = BRAND.colors;
export const SERIF = BRAND.fonts.serif;
export const SANS = BRAND.fonts.sans;

export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
/** 0→1 between frames a and b. */
export const prog = (f: number, a: number, b: number, e: (t: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], {...clamp, easing: e});

/** Spring starting at `delay` (frames). */
export const useSpring = (delay: number, damping = 13, stiffness = 160) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping, stiffness}});
};

/* ---------- Shot plumbing ---------- */
export const ShotCtx = createContext({duration: 60});

/** Background sky + slow camera push on the svg content. */
export const Stage: React.FC<{
  tint?: "blue" | "red" | "warm";
  push?: [number, number];
  origin?: [number, number];
  stars?: boolean;
  children: React.ReactNode;
}> = ({tint = "blue", push = [1, 1.07], origin = [540, 960], stars = true, children}) => {
  const f = useCurrentFrame();
  const {duration} = useContext(ShotCtx);
  const k = interpolate(f, [0, duration], push, clamp);
  const bg =
    tint === "red"
      ? "linear-gradient(180deg,#14060c 0%,#2b0d18 55%,#14060c 100%)"
      : tint === "warm"
      ? "linear-gradient(180deg,#0a1226 0%,#1b1a33 55%,#2a1620 100%)"
      : "linear-gradient(180deg,#040816 0%,#0a1530 55%,#10224a 100%)";
  return (
    <AbsoluteFill style={{background: bg}}>
      {stars && <Stars />}
      <div style={{position: "absolute", inset: 0, transform: `scale(${k})`, transformOrigin: `${origin[0]}px ${origin[1]}px`}}>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%">
          {children}
        </svg>
      </div>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

const STARS = (() => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({length: 70}, () => ({x: r() * 1080, y: r() * 1500, r: 1 + r() * 2.2, p: r() * 6}));
})();

const Stars: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: "absolute", inset: 0}}>
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y + f * 0.05} r={s.r} fill={C.moon} opacity={0.25 + 0.25 * Math.sin(f * 0.08 + s.p)} />
      ))}
    </svg>
  );
};

/* ---------- Text ---------- */
export const LocationTag: React.FC<{text: string; delay?: number; y?: number}> = ({text, delay = 4, y = 150}) => {
  const f = useCurrentFrame();
  const o = prog(f, delay, delay + 12);
  const w = 120 * o;
  return (
    <g opacity={o}>
      <line x1={540 - 250 - w} x2={540 - 250} y1={y} y2={y} stroke={C.cream} strokeOpacity={0.5} strokeWidth={2} />
      <line x1={540 + 250} x2={540 + 250 + w} y1={y} y2={y} stroke={C.cream} strokeOpacity={0.5} strokeWidth={2} />
      <text x={540} y={y + 9} textAnchor="middle" fill={C.cream} fontFamily={SANS} fontSize={24} fontWeight={700} letterSpacing={7}>
        {text}
      </text>
    </g>
  );
};

/** Pill label that pops in (like the "waktu" / "bensin" chips). */
export const Chip: React.FC<{x: number; y: number; text: string; delay?: number; color?: string; dot?: string; size?: number}> = ({
  x, y, text, delay = 0, color = C.cream, dot, size = 30,
}) => {
  const s = useSpring(delay, 11, 200);
  const w = text.length * size * 0.62 + (dot ? 70 : 44);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={interpolate(s, [0, 0.4], [0, 1], clamp)}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={size * 0.95} fill="#0b1636" stroke={color} strokeOpacity={0.55} strokeWidth={2.5} />
      {dot && <circle cx={-w / 2 + 34} cy={0} r={size * 0.38} fill={dot} />}
      <text x={dot ? 18 : 0} y={size * 0.34} textAnchor="middle" fill={color} fontFamily={SANS} fontWeight={700} fontSize={size}>
        {text}
      </text>
    </g>
  );
};

/** Slammed rubber stamp. */
export const Stamp: React.FC<{x: number; y: number; text: string; delay?: number; rot?: number; color?: string; size?: number}> = ({
  x, y, text, delay = 0, rot = -8, color = C.red, size = 64,
}) => {
  const s = useSpring(delay, 9, 230);
  const w = text.length * size * 0.66 + 60;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${interpolate(s, [0, 1], [2.4, 1])})`} opacity={interpolate(s, [0, 0.3], [0, 0.95], clamp)}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.6} rx={8} fill="none" stroke={color} strokeWidth={7} />
      <rect x={-w / 2 + 9} y={-size * 0.8 + 9} width={w - 18} height={size * 1.6 - 18} rx={4} fill="none" stroke={color} strokeWidth={2} />
      <text x={0} y={size * 0.3} textAnchor="middle" fill={color} fontFamily={SANS} fontWeight={900} fontSize={size} letterSpacing={4}>
        {text}
      </text>
    </g>
  );
};

/* ---------- Icons / markers ---------- */
export const QMark: React.FC<{x: number; y: number; delay?: number; text?: string; color?: string}> = ({x, y, delay = 0, text = "?", color = C.cream}) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 9, 220);
  const bob = Math.sin(f * 0.12) * 5;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`} opacity={interpolate(s, [0, 0.3], [0, 1], clamp)}>
      <circle r={30} fill="#0b1636" stroke={color} strokeWidth={3} />
      <polygon points="-8,28 8,28 0,44" fill="#0b1636" stroke={color} strokeWidth={3} />
      <rect x={-12} y={20} width={24} height={10} fill="#0b1636" />
      <text y={12} textAnchor="middle" fill={color} fontFamily={SANS} fontWeight={800} fontSize={38}>{text}</text>
    </g>
  );
};

export const Pin: React.FC<{x: number; y: number; delay?: number; label?: string; pulse?: boolean}> = ({x, y, delay = 0, label, pulse}) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 10, 200);
  const ring = pulse ? (f % 40) / 40 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      {pulse && <circle r={20 + ring * 70} fill="none" stroke={C.gold} strokeWidth={4} opacity={1 - ring} />}
      <g transform={`scale(${s})`} opacity={interpolate(s, [0, 0.3], [0, 1], clamp)}>
        <path d="M0 0 C-34 -40 -34 -90 0 -90 C34 -90 34 -40 0 0 Z" fill={C.gold} stroke="#3a2a10" strokeWidth={3} />
        <circle cy={-60} r={19} fill="#0b1636" />
        <text y={-50} textAnchor="middle" fill={C.cream} fontFamily={SANS} fontWeight={800} fontSize={28}>?</text>
      </g>
      {label && (
        <text y={-112} textAnchor="middle" fill={C.cream} fontFamily={SANS} fontWeight={700} fontSize={26} opacity={prog(f, delay + 8, delay + 20)}>
          {label}
        </text>
      )}
    </g>
  );
};

/** Gold dotted route that is revealed progressively (mask + dash-offset). */
export const DottedRoute: React.FC<{d: string; progress: number; color?: string; width?: number}> = ({d, progress, color = C.gold, width = 9}) => {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <mask id={id}>
        <path d={d} fill="none" stroke="#fff" strokeWidth={width * 3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} strokeLinecap="round" />
      </mask>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`1 ${width * 1.9}`} mask={`url(#${id})`} style={{filter: `drop-shadow(0 0 6px ${color})`}} />
    </>
  );
};

/* ---------- People ---------- */
type Hat = "shako" | "tricorn" | "cap" | "mitre" | "none";
export const Person: React.FC<{
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  hat?: Hat;
  accent?: string;
  arm?: "down" | "up" | "out";
  belly?: number; // 0..1 glowing red stomach
  walk?: number; // frames-driven leg swing amount
  fill?: string;
  opacity?: number;
}> = ({x, y, s = 1, flip, hat = "none", accent, arm = "down", belly = 0, walk = 0, fill = C.ink, opacity = 1}) => {
  const f = useCurrentFrame();
  const swing = Math.sin(f * 0.4) * 14 * walk;
  const pulse = 1 + Math.sin(f * 0.3) * 0.08;
  const armR = arm === "up" ? "M38 -352 Q74 -400 84 -452" : arm === "out" ? "M38 -352 Q80 -330 118 -312" : "M38 -352 Q56 -280 44 -210";
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={opacity}>
      <ellipse cx={0} cy={4} rx={70} ry={10} fill="#000" opacity={0.35} />
      <rect x={-22 + swing} y={-152} width={19} height={152} rx={7} fill={fill} />
      <rect x={4 - swing} y={-152} width={19} height={152} rx={7} fill={fill} />
      <path d="M-38 -352 Q-56 -280 -44 -210" fill="none" stroke={fill} strokeWidth={19} strokeLinecap="round" />
      <path d={armR} fill="none" stroke={fill} strokeWidth={19} strokeLinecap="round" />
      <path d="M-40 -362 Q0 -380 40 -362 L38 -200 Q38 -148 30 -148 L-30 -148 Q-38 -148 -38 -200 Z" fill={fill} stroke={C.rim} strokeOpacity={0.35} strokeWidth={2.5} />
      {accent && <path d="M-22 -366 L0 -330 L22 -366 Q0 -376 -22 -366 Z" fill={accent} />}
      <circle cx={0} cy={-396} r={27} fill={fill} stroke={C.rim} strokeOpacity={0.4} strokeWidth={2.5} />
      {hat === "shako" && (
        <>
          <rect x={-27} y={-462} width={54} height={46} rx={4} fill={fill} stroke={C.rim} strokeOpacity={0.3} strokeWidth={2} />
          <rect x={-31} y={-420} width={62} height={7} fill={fill} />
          <line x1={0} y1={-462} x2={4} y2={-494} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
        </>
      )}
      {hat === "tricorn" && <path d="M-44 -414 Q0 -454 44 -414 Q0 -428 -44 -414 Z" fill={fill} stroke={C.rim} strokeOpacity={0.3} strokeWidth={2} />}
      {hat === "cap" && <path d="M-27 -402 Q0 -440 27 -402 Z" fill={fill} />}
      {hat === "mitre" && (
        <>
          <path d="M-32 -414 L0 -506 L32 -414 Z" fill={fill} stroke={C.rim} strokeOpacity={0.35} strokeWidth={2} />
          <line x1={0} y1={-500} x2={0} y2={-420} stroke={C.gold} strokeOpacity={0.7} strokeWidth={4} />
        </>
      )}
      {belly > 0 && (
        <g transform={`translate(0 -250) scale(${1 + (pulse - 1) * belly})`} opacity={belly}>
          <ellipse rx={74} ry={86} fill={C.red} opacity={0.28} />
          <ellipse rx={50} ry={60} fill="#1a0408" stroke={C.red} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/* ---------- Scenery ---------- */
export const Ground: React.FC<{y: number; tint?: string}> = ({y, tint = "#3a1620"}) => (
  <>
    <defs>
      <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={tint} />
        <stop offset="1" stopColor="#0b0710" />
      </linearGradient>
    </defs>
    <rect x={0} y={y} width={1080} height={1920 - y} fill="url(#gnd)" />
    <line x1={0} x2={1080} y1={y} y2={y} stroke={C.rim} strokeOpacity={0.12} strokeWidth={2} />
  </>
);

export const Moon: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <circle cx={x} cy={y} r={70} fill={C.moon} opacity={0.08} />
    <circle cx={x} cy={y} r={30} fill={C.moon} opacity={0.9} />
  </g>
);

/** Columned building (barracks / hospital). Origin = bottom centre. */
export const Facade: React.FC<{cx: number; base: number; w?: number; emblem?: "cross" | "shield" | "none"}> = ({cx, base, w = 760, emblem = "shield"}) => {
  const f = useCurrentFrame();
  const h = 430;
  const left = cx - w / 2;
  const cols = 7;
  return (
    <g>
      {/* tower */}
      <rect x={cx - 50} y={base - h - 170} width={100} height={170} fill="#c9c6d6" />
      <polygon points={`${cx - 62},${base - h - 170} ${cx},${base - h - 230} ${cx + 62},${base - h - 170}`} fill="#8a87a0" />
      {/* wall */}
      <rect x={left} y={base - h} width={w} height={h} fill={C.brick} />
      <polygon points={`${left - 20},${base - h} ${cx},${base - h - 90} ${left + w + 20},${base - h}`} fill="#d8d5e6" />
      {/* windows */}
      {Array.from({length: cols}).map((_, i) => {
        const x = left + 40 + i * ((w - 80) / (cols - 1));
        const lit = 0.55 + 0.35 * Math.sin(f * 0.05 + i * 1.7);
        return <rect key={i} x={x - 24} y={base - h + 70} width={48} height={190} fill={C.gold} opacity={lit * 0.55} />;
      })}
      {/* columns */}
      {Array.from({length: cols}).map((_, i) => {
        const x = left + 40 + i * ((w - 80) / (cols - 1));
        return <rect key={i} x={x - 16} y={base - h + 30} width={32} height={h - 30} fill="#d8d5e6" opacity={0.88} />;
      })}
      <rect x={left - 10} y={base - h + 12} width={w + 20} height={22} fill="#e6e3f2" />
      {/* door */}
      <path d={`M${cx - 38} ${base} L${cx - 38} ${base - 120} Q${cx} ${base - 170} ${cx + 38} ${base - 120} L${cx + 38} ${base} Z`} fill="#140a10" />
      <path d={`M${cx - 30} ${base} L${cx - 30} ${base - 116} Q${cx} ${base - 156} ${cx + 30} ${base - 116} L${cx + 30} ${base} Z`} fill={C.gold} opacity={0.35} />
      {/* emblem */}
      {emblem !== "none" && (
        <g transform={`translate(${cx} ${base - h - 18})`}>
          <path d="M-48 -52 L48 -52 L48 12 Q48 56 0 76 Q-48 56 -48 12 Z" fill={C.brick2} stroke={C.cream} strokeWidth={5} />
          {emblem === "cross" ? (
            <>
              <rect x={-9} y={-30} width={18} height={62} fill={C.cream} />
              <rect x={-30} y={-9} width={60} height={18} fill={C.cream} />
            </>
          ) : (
            <>
              <rect x={-30} y={-26} width={26} height={22} fill={C.cream} />
              <rect x={4} y={-26} width={26} height={22} fill={C.cream} />
              <rect x={-30} y={4} width={60} height={22} fill={C.cream} />
            </>
          )}
        </g>
      )}
    </g>
  );
};

/** Silhouetted tree for framing. */
export const Tree: React.FC<{x: number; base: number; s?: number}> = ({x, base, s = 1}) => (
  <g transform={`translate(${x} ${base}) scale(${s})`}>
    <rect x={-10} y={-190} width={20} height={190} fill="#050812" />
    <circle cx={-50} cy={-250} r={80} fill="#050812" />
    <circle cx={30} cy={-290} r={90} fill="#050812" />
    <circle cx={70} cy={-220} r={64} fill="#050812" />
  </g>
);

/* ---------- Cards ---------- */
/** Duotone ID card hanging on a strap (portrait: simple bust). */
export const IdCard: React.FC<{x: number; y: number; name: string; sub: string; delay?: number; hat?: Hat; wide?: boolean}> = ({
  x, y, name, sub, delay = 0, hat = "none", wide,
}) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 14, 110);
  const sway = Math.sin(f * 0.07) * 1.2;
  return (
    <g transform={`translate(${x} ${y - interpolate(s, [0, 1], [700, 0])}) rotate(${sway})`}>
      <line x1={0} y1={-1400} x2={0} y2={0} stroke="#cdb67a" strokeWidth={5} opacity={0.6} />
      <rect x={-210} y={0} width={420} height={560} rx={22} fill="#0f2250" stroke={C.rim} strokeOpacity={0.5} strokeWidth={4} />
      <rect x={-180} y={34} width={360} height={380} rx={12} fill="#1b3e86" />
      {/* halftone portrait */}
      <defs>
        <pattern id={`ht${name.length}`} width={10} height={10} patternUnits="userSpaceOnUse">
          <circle cx={5} cy={5} r={2.2} fill="#0a1a3d" />
        </pattern>
      </defs>
      <ellipse cx={0} cy={190} rx={96} ry={118} fill="#4f7fd0" />
      <path d="M-170 414 Q-160 320 -70 300 L70 300 Q160 320 170 414 Z" fill="#3a64b0" />
      <ellipse cx={0} cy={190} rx={96} ry={118} fill={`url(#ht${name.length})`} opacity={0.7} />
      <ellipse cx={-34} cy={170} rx={11} ry={7} fill="#0a1a3d" />
      <ellipse cx={34} cy={170} rx={11} ry={7} fill="#0a1a3d" />
      {wide ? (
        <path d="M-72 250 Q0 316 72 250 Q0 270 -72 250 Z" fill="#05091a" stroke={C.red} strokeWidth={4} />
      ) : (
        <path d="M-30 252 Q0 266 30 252" fill="none" stroke="#0a1a3d" strokeWidth={6} strokeLinecap="round" />
      )}
      {hat === "tricorn" && <path d="M-120 110 Q0 20 120 110 Q0 80 -120 110 Z" fill="#0a1a3d" />}
      {hat === "shako" && <rect x={-70} y={34} width={140} height={74} rx={6} fill="#0a1a3d" />}
      {hat === "mitre" && <path d="M-72 112 L0 14 L72 112 Z" fill="#0a1a3d" />}
      <text x={0} y={472} textAnchor="middle" fill={C.cream} fontFamily={SANS} fontWeight={800} fontSize={44}>{name}</text>
      <text x={0} y={518} textAnchor="middle" fill={C.rim} fontFamily={SANS} fontWeight={600} fontSize={26} letterSpacing={3}>{sub}</text>
    </g>
  );
};

/** Parchment document (letter / autopsy page). */
export const Paper: React.FC<{x: number; y: number; w: number; h: number; rot?: number; children?: React.ReactNode}> = ({x, y, w, h, rot = 0, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={8} fill="#000" opacity={0.35} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={C.cream} />
    {children}
  </g>
);

/* ---------- Globe ---------- */
export const Globe: React.FC<{cx: number; cy: number; r: number; rot: number}> = ({cx, cy, r, rot}) => {
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#2b5bb0" />
          <stop offset="0.6" stopColor="#173577" />
          <stop offset="1" stopColor="#0a1a45" />
        </radialGradient>
        <clipPath id={id + "c"}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r + 26} fill="#3b6fd0" opacity={0.12} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      <g clipPath={`url(#${id}c)`} stroke={C.rim} strokeOpacity={0.22} strokeWidth={2} fill="none">
        {Array.from({length: 9}).map((_, i) => {
          const a = ((i * 20 + rot) * Math.PI) / 180;
          return <ellipse key={i} cx={cx} cy={cy} rx={Math.abs(Math.cos(a)) * r} ry={r} />;
        })}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const yy = cy + Math.sin((lat * Math.PI) / 180) * r;
          const hw = Math.cos((lat * Math.PI) / 180) * r;
          return <ellipse key={lat} cx={cx} cy={yy} rx={hw} ry={hw * 0.12} />;
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.rim} strokeOpacity={0.4} strokeWidth={3} />
    </g>
  );
};

/* ---------- Stylised map (France / Prussia): abstract on purpose, not geographically accurate ---------- */
const FRANCE = "150,1050 230,920 330,880 420,800 540,760 600,860 580,980 610,1100 520,1250 380,1290 260,1220 180,1150";
const PRUSSIA = "540,760 600,640 760,540 920,560 970,700 900,860 760,920 640,900 600,860";
export const P = {p0: [330, 1020], p1: [450, 820], p2: [560, 980], p3: [800, 700]};
export const ROUTE = `M${P.p0} C${P.p1} ${P.p2} ${P.p3}`;
export const routeAt = (t: number): [number, number] => {
  const m = 1 - t;
  const g = (i: number) => m * m * m * P.p0[i] + 3 * m * m * t * P.p1[i] + 3 * m * t * t * P.p2[i] + t * t * t * P.p3[i];
  return [g(0), g(1)];
};

export const MapArt: React.FC<{progress: number; stop?: boolean; labels?: {france?: string; prussia?: string; paris?: string}}> = ({progress, stop, labels}) => {
  const [dx, dy] = routeAt(progress);
  return (
    <g>
      <polygon points={FRANCE} fill="#1d3c7a" stroke={C.gold} strokeOpacity={0.7} strokeWidth={3} strokeLinejoin="round" />
      <polygon points={PRUSSIA} fill="#3a2350" stroke="#c98aa0" strokeOpacity={0.7} strokeWidth={3} strokeLinejoin="round" />
      <line x1={540} y1={760} x2={600} y2={860} stroke={C.red} strokeWidth={5} strokeDasharray="12 9" />
      <text x={290} y={1190} fill={C.cream} opacity={0.55} fontFamily={SANS} fontWeight={800} fontSize={44} letterSpacing={8}>{labels?.france ?? "FRANCE"}</text>
      <text x={700} y={885} fill={C.cream} opacity={0.55} fontFamily={SANS} fontWeight={800} fontSize={44} letterSpacing={8}>{labels?.prussia ?? "PRUSSIA"}</text>
      <DottedRoute d={ROUTE} progress={progress} />
      <circle cx={P.p0[0]} cy={P.p0[1]} r={13} fill={C.cream} />
      <text x={P.p0[0] - 18} y={P.p0[1] + 54} fill={C.cream} fontFamily={SANS} fontWeight={700} fontSize={32}>{labels?.paris ?? "Paris"}</text>
      {!stop && progress < 1 && <circle cx={dx} cy={dy} r={12} fill="#fff" style={{filter: "drop-shadow(0 0 12px #fff)"}} />}
    </g>
  );
};
