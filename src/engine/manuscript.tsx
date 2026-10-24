/**
 * "Manuscript" look: flat illuminated-manuscript illustrations on parchment folios (gold leaf frames,
 * lapis / vermilion / green pigments, faceless robed figures with halos). Used by `folio` shots.
 * Same brand family as the night look (navy table, gold), different visual language.
 */
import React, {useId} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import BRAND from "../brand/brand.json";
import {clamp, prog, useSpring} from "./kit";
import {useBrandText, useCue} from "./env";
import type {ArtItem, FolioShot, StampSpec} from "./types";

const SERIF = BRAND.fonts.serif;
export const M = {
  parch: "#eadfc4",
  parch2: "#d3c096",
  ink: "#2b1d12",
  gold: "#d9a441",
  goldHi: "#f6df94",
  red: "#b3342f",
  lapis: "#24468c",
  lapisDk: "#17305f",
  green: "#3f6b4c",
  brown: "#6b4a2f",
  skin: "#e2c39a",
  pallor: "#c3cdb9",
  plum: "#5a2a4a",
  stone: "#9a9486",
};
const ROBES: Record<string, string> = {
  red: M.red, blue: M.lapis, green: M.green, white: "#efe9da", black: "#2a2230", brown: M.brown, plum: M.plum, gold: M.gold, grey: "#8d8a82",
};

/* panel geometry (canvas 1080x1920) */
const PX = 60;
const PY = 170;
const PW = 960;
const PH = 1200;

/* ------------------------------ helpers ------------------------------ */
const Appear: React.FC<{delay: number; dy?: number; children: React.ReactNode}> = ({delay, dy = 28, children}) => {
  const s = useSpring(delay, 15, 130);
  return (
    <g opacity={interpolate(s, [0, 0.3], [0, 1], clamp)} transform={`translate(0 ${(1 - s) * dy})`}>
      {children}
    </g>
  );
};

const Limb: React.FC<{d: string; color: string; w?: number}> = ({d, color, w = 30}) => (
  <>
    <path d={d} fill="none" stroke={M.ink} strokeWidth={w + 8} strokeLinecap="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
  </>
);

/* ------------------------------ figures ------------------------------ */
const Cleric: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const {x = 540, y = 1230, s = 1, flip, robe = "red", mitre, halo, arm = "rest", hold, dead, seated, tilt = 0} = item;
  const rc = ROBES[robe] ?? robe;
  const skin = dead ? M.pallor : M.skin;
  const hemY = seated ? -40 : 0;
  const rightArm = arm === "point" ? "M58 -318 Q112 -300 172 -292" : arm === "raise" ? "M58 -318 Q112 -400 122 -474" : arm === "hold" ? "M58 -318 Q92 -250 112 -214" : "M58 -318 Q84 -220 66 -150";
  const hand = arm === "point" ? [180, -292] : arm === "raise" ? [122, -486] : arm === "hold" ? [114, -206] : [66, -138];
  const sway = dead ? 0 : Math.sin(f * 0.08 + x) * 1.2;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${tilt + sway})`}>
      {!seated && <ellipse cy={6} rx={98} ry={12} fill="#000" opacity={0.18} />}
      {halo && (
        <>
          <circle cx={0} cy={-384} r={60} fill={M.gold} stroke={M.ink} strokeWidth={4} />
          <circle cx={0} cy={-384} r={50} fill="none" stroke={M.goldHi} strokeWidth={4} />
        </>
      )}
      <Limb d="M-58 -318 Q-84 -220 -66 -150" color={rc} />
      <circle cx={-66} cy={-138} r={14} fill={skin} stroke={M.ink} strokeWidth={4} />
      <path d={`M-60 -330 Q-70 -200 -94 ${hemY} L94 ${hemY} Q70 -200 60 -330 Q0 -352 -60 -330 Z`} fill={rc} stroke={M.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M-30 -300 Q-36 -150 -50 ${hemY - 6} M30 -300 Q36 -150 50 ${hemY - 6}`} stroke={M.ink} strokeOpacity={0.3} strokeWidth={3} fill="none" />
      <path d={`M-92 ${hemY - 26} L92 ${hemY - 26} L94 ${hemY} L-94 ${hemY} Z`} fill={M.gold} stroke={M.ink} strokeWidth={3} />
      {mitre && <rect x={-11} y={-338} width={22} height={310 + hemY} fill={M.gold} stroke={M.ink} strokeWidth={3} />}
      <Limb d={rightArm} color={rc} />
      <circle cx={hand[0]} cy={hand[1]} r={14} fill={skin} stroke={M.ink} strokeWidth={4} />
      {hold === "scroll" && (
        <g transform={`translate(${hand[0]} ${hand[1]}) rotate(-20)`}>
          <rect x={-8} y={-62} width={44} height={96} rx={8} fill={M.parch} stroke={M.ink} strokeWidth={4} />
          <rect x={-12} y={-66} width={52} height={14} rx={7} fill={M.red} stroke={M.ink} strokeWidth={3} />
          <rect x={-12} y={20} width={52} height={14} rx={7} fill={M.red} stroke={M.ink} strokeWidth={3} />
        </g>
      )}
      {hold === "quill" && (
        <g transform={`translate(${hand[0]} ${hand[1]}) rotate(25)`}>
          <path d="M0 0 Q20 -90 60 -140 Q40 -60 6 4 Z" fill="#f4efe2" stroke={M.ink} strokeWidth={3} />
        </g>
      )}
      {hold === "shovel" && (
        <g transform={`translate(${hand[0]} ${hand[1]}) rotate(8)`}>
          <line x1={0} y1={-90} x2={0} y2={150} stroke={M.brown} strokeWidth={10} strokeLinecap="round" />
          <path d="M-22 150 L22 150 L16 210 L-16 210 Z" fill={M.stone} stroke={M.ink} strokeWidth={4} />
        </g>
      )}
      {hold === "torch" && (
        <g transform={`translate(${hand[0]} ${hand[1]})`}>
          <line x1={0} y1={0} x2={0} y2={-120} stroke={M.brown} strokeWidth={10} strokeLinecap="round" />
          <path d={`M-18 -118 Q0 ${-190 + Math.sin(f * 0.5) * 8} 18 -118 Q0 -100 -18 -118 Z`} fill={M.gold} stroke={M.red} strokeWidth={4} />
        </g>
      )}
      <circle cx={0} cy={-384} r={35} fill={skin} stroke={M.ink} strokeWidth={5} />
      {dead && <path d="M-17 -388 q6 6 12 0 M5 -388 q6 6 12 0" stroke={M.ink} strokeWidth={3} fill="none" strokeLinecap="round" />}
      {mitre && (
        <g transform={dead ? "rotate(10 0 -400)" : undefined}>
          <path d="M-38 -408 L-24 -516 Q0 -492 24 -516 L38 -408 Z" fill={M.goldHi} stroke={M.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-38 -408 L38 -408 L36 -428 L-36 -428 Z" fill={M.red} stroke={M.ink} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

const Throne: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1230, s = 1} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-190} y={-36} width={380} height={36} fill={M.brown} stroke={M.ink} strokeWidth={4} />
      <rect x={-160} y={-72} width={320} height={36} fill={M.gold} stroke={M.ink} strokeWidth={4} />
      <path d="M-120 -72 L-120 -470 Q0 -580 120 -470 L120 -72 Z" fill={M.lapisDk} stroke={M.ink} strokeWidth={5} />
      <path d="M-96 -90 L-96 -450 Q0 -540 96 -450 L96 -90 Z" fill="none" stroke={M.gold} strokeWidth={5} />
      {[-120, 120].map((fx) => (
        <circle key={fx} cx={fx} cy={-486} r={20} fill={M.gold} stroke={M.ink} strokeWidth={4} />
      ))}
      <rect x={-148} y={-170} width={44} height={110} rx={10} fill={M.brown} stroke={M.ink} strokeWidth={4} />
      <rect x={104} y={-170} width={44} height={110} rx={10} fill={M.brown} stroke={M.ink} strokeWidth={4} />
    </g>
  );
};

const Tomb: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const {x = 540, y = 1230, s = 1} = item;
  const slide = prog(f, 4, 40);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-300 0 L-260 -170 L260 -170 L300 0 Z" fill={M.stone} stroke={M.ink} strokeWidth={5} />
      <path d="M-250 -170 L250 -170 L270 -210 L-230 -210 Z" fill="#171210" stroke={M.ink} strokeWidth={4} />
      <g transform={`translate(${slide * 190} ${-slide * 16})`}>
        <path d="M-300 -170 L300 -170 L330 -230 L-270 -230 Z" fill="#b5ae9d" stroke={M.ink} strokeWidth={5} />
        <rect x={-14} y={-222} width={28} height={46} fill={M.gold} stroke={M.ink} strokeWidth={3} />
        <rect x={-34} y={-206} width={68} height={14} fill={M.gold} stroke={M.ink} strokeWidth={3} />
      </g>
      <path d="M-380 0 Q-320 -60 -250 -20 L-250 0 Z M380 0 Q320 -70 250 -24 L250 0 Z" fill="#5a4630" stroke={M.ink} strokeWidth={4} />
    </g>
  );
};

const Medallion: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const id = useId().replace(/:/g, "");
  const {x = 540, y = 700, s = 1, robe = "red", mitre = true, name} = item;
  const rc = ROBES[robe] ?? robe;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={id}><circle r={268} /></clipPath>
      </defs>
      <circle r={300} fill={M.gold} stroke={M.ink} strokeWidth={6} />
      <circle r={268} fill={M.lapis} stroke={M.ink} strokeWidth={5} />
      <g clipPath={`url(#${id})`}>
        {Array.from({length: 14}).map((_, i) => (
          <path key={i} d="M0 -14 L5 -4 L16 0 L5 4 L0 14 L-5 4 L-16 0 L-5 -4 Z" fill={M.goldHi} opacity={0.55 + 0.3 * Math.sin(f * 0.1 + i)} transform={`translate(${Math.cos(i * 1.7) * 210} ${Math.sin(i * 2.3) * 210})`} />
        ))}
        <circle cy={-70} r={96} fill={M.gold} stroke={M.ink} strokeWidth={5} />
        <path d="M-210 280 Q-190 70 -80 36 L80 36 Q190 70 210 280 Z" fill={rc} stroke={M.ink} strokeWidth={6} />
        <rect x={-14} y={36} width={28} height={250} fill={M.gold} stroke={M.ink} strokeWidth={3} />
        <circle cy={-70} r={62} fill={M.skin} stroke={M.ink} strokeWidth={6} />
        {mitre && (
          <>
            <path d="M-66 -112 L-44 -250 Q0 -222 44 -250 L66 -112 Z" fill={M.goldHi} stroke={M.ink} strokeWidth={5} strokeLinejoin="round" />
            <path d="M-66 -112 L66 -112 L62 -144 L-62 -144 Z" fill={M.red} stroke={M.ink} strokeWidth={4} />
          </>
        )}
      </g>
      <circle r={268} fill="none" stroke={M.goldHi} strokeWidth={4} strokeDasharray="3 14" />
      {name && <Banner item={{kind: "banner", x: 0, y: 360, text: name, size: 54}} />}
    </g>
  );
};

/* ------------------------------ props & decor ------------------------------ */
const Banner: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1300, text = "", size = 46, color = "gold"} = item;
  const w = text.length * size * 0.7 + 120;
  const fill = color === "red" ? M.red : color === "cream" ? M.parch : M.gold;
  const txt = color === "red" ? "#fff4dd" : M.ink;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-w / 2 - 38} 8 L${-w / 2 + 10} 8 L${-w / 2 + 10} ${size * 1.5} L${-w / 2 - 38} ${size * 1.5} L${-w / 2 - 12} ${size * 0.75 + 8} Z`} fill={fill} opacity={0.75} stroke={M.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${w / 2 + 38} 8 L${w / 2 - 10} 8 L${w / 2 - 10} ${size * 1.5} L${w / 2 + 38} ${size * 1.5} L${w / 2 + 12} ${size * 0.75 + 8} Z`} fill={fill} opacity={0.75} stroke={M.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-w / 2} y={-size * 0.55} width={w} height={size * 1.55 + 8} rx={6} fill={fill} stroke={M.ink} strokeWidth={5} />
      <rect x={-w / 2 + 8} y={-size * 0.55 + 8} width={w - 16} height={size * 1.55 - 8} rx={3} fill="none" stroke={txt} strokeOpacity={0.45} strokeWidth={2} />
      <text x={0} y={size * 0.52} textAnchor="middle" fill={txt} fontFamily={SERIF} fontWeight={800} fontSize={size} letterSpacing={2}>
        {text}
      </text>
    </g>
  );
};

const InkStamp: React.FC<{spec: StampSpec; delay: number}> = ({spec, delay}) => {
  const s = useSpring(delay, 9, 230);
  const size = spec.size ?? 64;
  const w = spec.text.length * size * 0.76 + 80;
  const col = spec.color === "gold" ? "#a9741c" : spec.color === "cream" ? M.goldHi : M.red;
  return (
    <g transform={`translate(${spec.x ?? 540} ${spec.y ?? 760}) rotate(${spec.rot ?? -8}) scale(${interpolate(s, [0, 1], [2.3, 1])})`} opacity={interpolate(s, [0, 0.3], [0, 0.92], clamp)}>
      <rect x={-w / 2} y={-size * 0.82} width={w} height={size * 1.64} fill="none" stroke={col} strokeWidth={8} />
      <rect x={-w / 2 + 11} y={-size * 0.82 + 11} width={w - 22} height={size * 1.64 - 22} fill="none" stroke={col} strokeWidth={2.5} />
      <text x={0} y={size * 0.3} textAnchor="middle" fill={col} fontFamily={SERIF} fontWeight={900} fontSize={size} letterSpacing={5}>
        {spec.text}
      </text>
    </g>
  );
};

const Seal: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1000, s = 1} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-26 20 L-44 110 L-14 90 L0 120 L10 30 Z M26 20 L44 110 L14 90 L0 120 L-10 30 Z" fill={M.red} stroke={M.ink} strokeWidth={4} />
      <circle r={60} fill={M.red} stroke={M.ink} strokeWidth={5} />
      <circle r={44} fill="none" stroke="#7d1f1b" strokeWidth={4} />
      <rect x={-6} y={-26} width={12} height={52} fill="#7d1f1b" />
      <rect x={-22} y={-10} width={44} height={12} fill="#7d1f1b" />
    </g>
  );
};

const Doc: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 760, w = 600, h = 760, rot = -2, lines = 8, title, redLines = []} = item;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} rx={10} fill="#000" opacity={0.2} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="#f1e7cb" stroke={M.ink} strokeWidth={5} />
      {[-h / 2, h / 2].map((yy, i) => (
        <g key={i}>
          <rect x={-w / 2 - 22} y={yy - 22} width={w + 44} height={44} rx={22} fill={M.parch2} stroke={M.ink} strokeWidth={5} />
          <circle cx={-w / 2 - 22} cy={yy} r={20} fill={M.gold} stroke={M.ink} strokeWidth={4} />
          <circle cx={w / 2 + 22} cy={yy} r={20} fill={M.gold} stroke={M.ink} strokeWidth={4} />
        </g>
      ))}
      {title && (
        <text x={0} y={-h / 2 + 110} textAnchor="middle" fill={M.ink} fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={56}>
          {title}
        </text>
      )}
      {Array.from({length: lines}).map((_, i) => (
        <line key={i} x1={-w / 2 + 60} x2={i === lines - 1 ? 0 : w / 2 - 60} y1={-h / 2 + (title ? 190 : 120) + i * 62} y2={-h / 2 + (title ? 190 : 120) + i * 62} stroke={redLines.includes(i) ? M.red : M.ink} strokeOpacity={redLines.includes(i) ? 0.85 : 0.6} strokeWidth={redLines.includes(i) ? 9 : 6} strokeLinecap="round" />
      ))}
    </g>
  );
};

const Hand: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const {x = 540, y = 800, s = 1, from, to, cut} = item;
  const a = from !== undefined ? cf(from) : 6;
  const b = to !== undefined ? cf(to) : a + 50;
  const p = prog(f, a, b);
  const c = cut !== undefined ? prog(f, cf(cut), cf(cut) + 10) : 0;
  const palm = "M-110 260 C-125 160 -125 80 -110 40 L110 40 C125 80 125 160 110 260 C60 300 -60 300 -110 260 Z";
  const fingers = ["M-112 175 C-195 155 -215 75 -178 32", "M-80 40 L-90 -170", "M-25 40 L-25 -210", "M30 40 L40 -180", "M85 40 L105 -120"];
  const style = {fill: "none", stroke: M.ink, strokeWidth: 8, strokeLinecap: "round", pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p} as const;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={palm} fill={M.skin} opacity={p} stroke="none" />
      {fingers.slice(0, 3).map((d, i) => (
        <path key={i} d={d} fill="none" stroke={M.gold} strokeWidth={26} strokeLinecap="round" opacity={p * (1 - 0.55 * c)} />
      ))}
      <path d={palm} {...style} />
      {fingers.map((d, i) => (
        <path key={i} d={d} {...style} />
      ))}
      <g opacity={c} stroke={M.red} strokeWidth={9} strokeLinecap="round">
        <line x1={-215} y1={96} x2={-150} y2={20} />
        <line x1={-120} y1={-120} x2={-50} y2={-140} />
        <line x1={-55} y1={-160} x2={10} y2={-175} />
      </g>
    </g>
  );
};

const Waves: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const {y = 900} = item;
  const rows = 8;
  return (
    <g>
      <rect x={PX} y={y} width={PW} height={PY + PH - y} fill={M.lapisDk} />
      {Array.from({length: rows}).map((_, r) => {
        const yy = y + 20 + r * 62;
        const off = ((f * (0.8 + r * 0.12) * (r % 2 ? -1 : 1)) % 96) - 96;
        return (
          <g key={r} transform={`translate(${off} 0)`}>
            {Array.from({length: 14}).map((__, i) => (
              <path key={i} d={`M${PX + i * 96 - 48} ${yy} q48 -52 96 0`} fill={r % 2 ? M.lapis : "#2f5aa8"} stroke={M.goldHi} strokeOpacity={0.55} strokeWidth={4} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

const Bundle: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const {x = 540, y = 820} = item;
  const a = item.at !== undefined ? cf(item.at) : 10;
  const t = prog(f, a, a + 70);
  return (
    <g transform={`translate(${x + t * 40} ${y + t * 150}) rotate(${-8 + t * 20})`} opacity={1 - 0.6 * t}>
      <rect x={-130} y={-34} width={260} height={68} rx={34} fill="#d8d2c0" stroke={M.ink} strokeWidth={5} />
      {[-70, 0, 70].map((bx) => (
        <line key={bx} x1={bx} y1={-34} x2={bx} y2={34} stroke={M.brown} strokeWidth={6} />
      ))}
    </g>
  );
};

const Bridge: React.FC<{item: ArtItem}> = ({item}) => {
  const {y = 760} = item;
  return (
    <g>
      <rect x={PX} y={y} width={PW} height={40} fill={M.stone} stroke={M.ink} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${PX + 30 + i * 230} ${y + 40} L${PX + 30 + i * 230} ${y + 170} Q${PX + 145 + i * 230} ${y + 40} ${PX + 260 + i * 230} ${y + 170} L${PX + 260 + i * 230} ${y + 40} Z`} fill="#b5ae9d" stroke={M.ink} strokeWidth={5} />
      ))}
    </g>
  );
};

const Crowd: React.FC<{item: ArtItem}> = ({item}) => {
  const f = useCurrentFrame();
  const cols = ["red", "blue", "brown", "green", "plum", "grey"];
  return (
    <g>
      {[0, 1, 2].map((r) =>
        Array.from({length: 5 + r}).map((_, i, arr) => {
          const t = (i + 0.5) / arr.length;
          const bob = Math.sin(f * 0.25 + i * 1.3 + r) * 6;
          return (
            <Cleric
              key={`${r}-${i}`}
              item={{kind: "cleric", x: PX + 70 + t * (PW - 140), y: 1010 + r * 130 + bob, s: 0.3 + r * 0.06, robe: cols[(i + r * 2) % cols.length], arm: "raise", hold: i % 2 ? "torch" : undefined}}
            />
          );
        })
      )}
      {item.text && null}
    </g>
  );
};

const Bars: React.FC<{item: ArtItem}> = ({item}) => (
  <g>
    <path d={`M${PX + 60} 1300 L${PX + 60} 520 Q540 330 ${PX + PW - 60} 520 L${PX + PW - 60} 1300 Z`} fill="none" stroke={M.stone} strokeWidth={46} strokeLinejoin="round" />
    {Array.from({length: 9}).map((_, i) => (
      <line key={i} x1={PX + 130 + i * 90} y1={400} x2={PX + 130 + i * 90} y2={1290} stroke="#3a3430" strokeWidth={16} />
    ))}
    {item.text && null}
  </g>
);

const Church: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1230, s = 1} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-330} y={-420} width={660} height={420} fill="#efe6cf" stroke={M.ink} strokeWidth={6} />
      <path d="M-370 -420 L0 -620 L370 -420 Z" fill={M.lapis} stroke={M.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-12} y={-720} width={24} height={110} fill={M.gold} stroke={M.ink} strokeWidth={4} />
      <rect x={-44} y={-690} width={88} height={22} fill={M.gold} stroke={M.ink} strokeWidth={4} />
      {[-270, -180, 180, 270].map((cx) => (
        <rect key={cx} x={cx - 22} y={-400} width={44} height={400} fill="#fff8e6" stroke={M.ink} strokeWidth={4} />
      ))}
      <path d="M-90 0 L-90 -230 Q0 -330 90 -230 L90 0 Z" fill="#1c1410" stroke={M.ink} strokeWidth={5} />
      <path d="M-70 0 L-70 -220 Q0 -300 70 -220 L70 0 Z" fill={M.gold} opacity={0.4} />
      <rect x={-380} y={-24} width={760} height={24} fill={M.stone} stroke={M.ink} strokeWidth={4} />
    </g>
  );
};

const Bier: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1230, s = 1} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Cleric item={{kind: "cleric", x: -190, y: 0, s: 0.55, robe: "white"}} />
      <Cleric item={{kind: "cleric", x: 190, y: 0, s: 0.55, robe: "black"}} />
      <path d="M-250 -150 L250 -150 L290 -110 L-290 -110 Z" fill={M.brown} stroke={M.ink} strokeWidth={5} />
      <path d="M-230 -150 L-190 -250 L190 -250 L230 -150 Z" fill={M.parch2} stroke={M.ink} strokeWidth={5} />
      <rect x={-8} y={-236} width={16} height={74} fill={M.gold} stroke={M.ink} strokeWidth={3} />
      <rect x={-30} y={-216} width={60} height={14} fill={M.gold} stroke={M.ink} strokeWidth={3} />
      <Cleric item={{kind: "cleric", x: -90, y: 0, s: 0.55, robe: "plum"}} />
      <Cleric item={{kind: "cleric", x: 90, y: 0, s: 0.55, robe: "green"}} />
    </g>
  );
};

const CoffinBan: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 800, s = 1} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-70 -200 L70 -200 L110 -70 L70 200 L-70 200 L-110 -70 Z" fill={M.brown} stroke={M.ink} strokeWidth={8} strokeLinejoin="round" />
      <rect x={-9} y={-140} width={18} height={150} fill={M.gold} />
      <rect x={-42} y={-100} width={84} height={18} fill={M.gold} />
      <circle r={250} fill="none" stroke={M.red} strokeWidth={26} />
      <line x1={-176} y1={-176} x2={176} y2={176} stroke={M.red} strokeWidth={26} strokeLinecap="round" />
    </g>
  );
};

const Books: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1180, s = 1} = item;
  const cols = [M.red, M.lapis, M.green, M.plum];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {cols.map((c, i) => (
        <g key={i} transform={`translate(${(i % 2 ? 20 : -16)} ${-i * 96}) rotate(${i % 2 ? 2 : -2})`}>
          <rect x={-250} y={-96} width={500} height={90} rx={8} fill={c} stroke={M.ink} strokeWidth={6} />
          <rect x={-250} y={-66} width={500} height={14} fill={M.gold} />
          <rect x={-250} y={-38} width={500} height={8} fill={M.gold} />
        </g>
      ))}
    </g>
  );
};

const Book: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 1000, s = 1, lines = 7} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-330 0 L-330 -360 Q-160 -400 0 -340 Q160 -400 330 -360 L330 0 Q160 -40 0 20 Q-160 -40 -330 0 Z" fill="#f1e7cb" stroke={M.ink} strokeWidth={6} strokeLinejoin="round" />
      <line x1={0} y1={-340} x2={0} y2={20} stroke={M.ink} strokeWidth={5} />
      <rect x={-290} y={-318} width={70} height={70} fill={M.lapis} stroke={M.ink} strokeWidth={4} />
      {Array.from({length: lines}).map((_, i) => (
        <g key={i}>
          <line x1={-290 + (i < 2 ? 90 : 0)} x2={-30} y1={-290 + i * 38} y2={-290 + i * 38} stroke={M.ink} strokeOpacity={0.6} strokeWidth={5} strokeLinecap="round" />
          <line x1={30} x2={290} y1={-290 + i * 38} y2={-290 + i * 38} stroke={i === 3 || i === 4 ? M.red : M.ink} strokeOpacity={i === 3 || i === 4 ? 0.85 : 0.6} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

const Initial: React.FC<{item: ArtItem}> = ({item}) => {
  const {x = 540, y = 700, s = 1, letter = "I"} = item;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-260} y={-260} width={520} height={520} fill={M.lapis} stroke={M.ink} strokeWidth={8} />
      <rect x={-236} y={-236} width={472} height={472} fill="none" stroke={M.gold} strokeWidth={8} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <g key={i} transform={`translate(${sx * 236} ${sy * 236})`}>
          <circle r={32} fill={M.gold} stroke={M.ink} strokeWidth={4} />
          <circle r={14} fill={M.red} />
        </g>
      ))}
      {[[-1, -1], [1, 1]].map(([sx, sy], i) => (
        <path key={i} d={`M${sx * 200} ${sy * 120} Q${sx * 120} ${sy * 200} ${sx * 40} ${sy * 130} Q${sx * 110} ${sy * 90} ${sx * 120} ${sy * 150}`} fill="none" stroke={M.green} strokeWidth={9} strokeLinecap="round" />
      ))}
      <text x={0} y={140} textAnchor="middle" fill={M.goldHi} stroke={M.ink} strokeWidth={5} paintOrder="stroke" fontFamily={SERIF} fontWeight={900} fontSize={400}>
        {letter}
      </text>
    </g>
  );
};

/* ------------------------------ backgrounds ------------------------------ */
const Background: React.FC<{bg?: string; tone?: string}> = ({bg = "plain", tone}) => {
  const f = useCurrentFrame();
  if (bg === "arcade") {
    return (
      <g>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M${PX + 20 + i * 235} 1200 L${PX + 20 + i * 235} 560 Q${PX + 137 + i * 235} 400 ${PX + 255 + i * 235} 560 L${PX + 255 + i * 235} 1200 Z`} fill={i % 2 ? "#cdb98a" : "#d8c698"} stroke={M.ink} strokeWidth={5} />
            <path d={`M${PX + 50 + i * 235} 1200 L${PX + 50 + i * 235} 580 Q${PX + 137 + i * 235} 470 ${PX + 225 + i * 235} 580 L${PX + 225 + i * 235} 1200 Z`} fill={M.lapisDk} opacity={0.85} />
            <rect x={PX + 4 + i * 235} y={560} width={30} height={650} fill="#efe6cf" stroke={M.ink} strokeWidth={4} />
          </g>
        ))}
      </g>
    );
  }
  if (bg === "sky") {
    const blood = tone === "blood";
    return (
      <g>
        <rect x={PX} y={PY} width={PW} height={PH} fill={blood ? "#7d2a25" : M.lapis} />
        {Array.from({length: 9}).map((_, i) => (
          <path key={i} d={`M${PX + 540} 1300 L${PX + i * 120} ${PY} L${PX + i * 120 + 60} ${PY} Z`} fill={blood ? "#d9633f" : M.goldHi} opacity={0.12 + 0.05 * Math.sin(f * 0.06 + i)} />
        ))}
        <circle cx={PX + 760} cy={360} r={64} fill={M.goldHi} stroke={M.ink} strokeWidth={5} />
        <path d={`M${PX} 1180 Q${PX + 240} 1020 ${PX + 480} 1150 T${PX + PW} 1130 L${PX + PW} ${PY + PH} L${PX} ${PY + PH} Z`} fill={blood ? "#3a1512" : M.green} stroke={M.ink} strokeWidth={5} />
      </g>
    );
  }
  if (bg === "cell") {
    return (
      <g>
        <rect x={PX} y={PY} width={PW} height={PH} fill="#4a443c" />
        {Array.from({length: 9}).map((_, r) =>
          Array.from({length: 5}).map((__, c) => (
            <rect key={`${r}-${c}`} x={PX + c * 200 + (r % 2 ? -100 : 0)} y={PY + r * 135} width={196} height={130} fill={(r + c) % 2 ? "#5a5348" : "#524c42"} stroke={M.ink} strokeOpacity={0.5} strokeWidth={4} />
          ))
        )}
        <rect x={PX} y={PY} width={PW} height={PH} fill="#000" opacity={0.35} />
      </g>
    );
  }
  // plain: faint gold rays
  return (
    <g opacity={0.5}>
      {Array.from({length: 12}).map((_, i) => (
        <path key={i} d={`M${PX + 480} ${PY + 560} L${PX + i * 90 - 60} ${PY} L${PX + i * 90 + 10} ${PY} Z`} fill={M.goldHi} opacity={0.22} />
      ))}
    </g>
  );
};

/* ------------------------------ the folio ------------------------------ */
const renderArt = (item: ArtItem, key: number) => {
  const el = (() => {
    switch (item.kind) {
      case "cleric": return <Cleric item={item} />;
      case "throne": return <Throne item={item} />;
      case "tomb": return <Tomb item={item} />;
      case "medallion": return <Medallion item={item} />;
      case "banner": return <Banner item={item} />;
      case "seal": return <Seal item={item} />;
      case "doc": return <Doc item={item} />;
      case "hand": return <Hand item={item} />;
      case "waves": return <Waves item={item} />;
      case "bundle": return <Bundle item={item} />;
      case "bridge": return <Bridge item={item} />;
      case "crowd": return <Crowd item={item} />;
      case "bars": return <Bars item={item} />;
      case "church": return <Church item={item} />;
      case "bier": return <Bier item={item} />;
      case "coffinban": return <CoffinBan item={item} />;
      case "books": return <Books item={item} />;
      case "book": return <Book item={item} />;
      case "initial": return <Initial item={item} />;
      default: return null;
    }
  })();
  return el ? <ArtSlot key={key} item={item} index={key}>{el}</ArtSlot> : null;
};

const ArtSlot: React.FC<{item: ArtItem; index: number; children: React.ReactNode}> = ({item, index, children}) => {
  const cf = useCue();
  const delay = item.at !== undefined ? cf(item.at) : 6 + index * 5;
  // scenery that should not "pop" (waves, bridge, bars, crowd) fades in quickly instead
  return <Appear delay={delay} dy={item.kind === "waves" || item.kind === "bridge" ? 0 : 28}>{children}</Appear>;
};

export const FolioView: React.FC<{s: FolioShot}> = ({s}) => {
  const f = useCurrentFrame();
  const bt = useBrandText();
  const cf = useCue();
  const id = useId().replace(/:/g, "");
  // slow drift across the page (parallax: page moves less than the art)
  const drift = interpolate(f, [0, 150], [-10, 10], clamp);
  const zoom = interpolate(f, [0, 150], [1.01, 1.05], clamp);
  const shimmer = ((f * 5) % 1600) - 300;
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#05091a 0%,#0a1530 60%,#10224a 100%)"}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <radialGradient id={id + "v"} cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#3a2410" stopOpacity={0.55} />
          </radialGradient>
          <filter id={id + "n"} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0.16 0" />
          </filter>
          <linearGradient id={id + "g"} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.55} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <clipPath id={id + "c"}>
            <rect x={PX} y={PY} width={PW} height={PH} rx={14} />
          </clipPath>
        </defs>

        {s.chapter && (
          <g opacity={prog(f, 4, 18)}>
            <line x1={120} x2={330} y1={112} y2={112} stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} />
            <line x1={750} x2={960} y1={112} y2={112} stroke={M.gold} strokeOpacity={0.6} strokeWidth={2} />
            <text x={540} y={122} textAnchor="middle" fill={M.goldHi} fontFamily={SERIF} fontWeight={700} fontSize={30} letterSpacing={7}>
              {s.chapter}
            </text>
          </g>
        )}

        <g transform={`translate(${540 - drift * 0.4} 760) scale(${zoom}) translate(-540 -760)`}>
          <rect x={PX - 16} y={PY - 16} width={PW + 32} height={PH + 32} rx={26} fill="#000" opacity={0.4} />
          <rect x={PX} y={PY} width={PW} height={PH} rx={14} fill={M.parch} />
          <g clipPath={`url(#${id}c)`}>
            <rect x={PX} y={PY} width={PW} height={PH} fill={M.parch2} filter={`url(#${id}n)`} />
            <g transform={`translate(${drift} 0)`}>
              <Background bg={s.bg} tone={s.tone} />
              {s.art.map((item, i) => renderArt(item, i))}
            </g>
            <rect x={PX} y={PY} width={PW} height={PH} fill={`url(#${id}v)`} />
          </g>
          {/* gold leaf frame */}
          <rect x={PX} y={PY} width={PW} height={PH} rx={14} fill="none" stroke={M.gold} strokeWidth={12} />
          <rect x={PX + 18} y={PY + 18} width={PW - 36} height={PH - 36} rx={6} fill="none" stroke={M.ink} strokeWidth={3} />
          <rect x={PX + 24} y={PY + 24} width={PW - 48} height={PH - 48} rx={4} fill="none" stroke={M.gold} strokeWidth={3} />
          {[[PX, PY], [PX + PW, PY], [PX, PY + PH], [PX + PW, PY + PH]].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <circle r={26} fill={M.gold} stroke={M.ink} strokeWidth={4} />
              <circle r={11} fill={M.red} stroke={M.ink} strokeWidth={3} />
            </g>
          ))}
          <g clipPath={`url(#${id}c)`} style={{mixBlendMode: "screen"}}>
            <rect x={PX + shimmer} y={PY} width={180} height={PH} fill={`url(#${id}g)`} opacity={0.18} transform={`skewX(-18)`} />
          </g>
        </g>

        {s.stamps?.map((st, i) => (
          <InkStamp key={i} spec={st} delay={cf(st.at)} />
        ))}
        {s.cta && (
          <>
            <Appear delay={cf(0) + 14}>
              <Banner item={{kind: "banner", x: 540, y: 1040, text: bt.name.toUpperCase(), size: 66}} />
            </Appear>
            <Appear delay={cf(0) + 28}>
              <g transform={`translate(0 ${Math.sin(f * 0.25) * 4})`}>
                <Banner item={{kind: "banner", x: 540, y: 1170, text: bt.ctaButton.toUpperCase(), size: 54, color: "red"}} />
              </g>
            </Appear>
            <Appear delay={cf(0) + 46}>
              <Banner item={{kind: "banner", x: 540, y: 1290, text: bt.ctaQuestion, size: 34, color: "cream"}} />
            </Appear>
          </>
        )}
        {s.banners?.map((b, i) => (
          <Appear key={i} delay={cf(b.at)}>
            <Banner item={{kind: "banner", x: b.x ?? 540, y: b.y ?? 1290, text: b.text, size: b.size ?? 46, color: b.color}} />
          </Appear>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
