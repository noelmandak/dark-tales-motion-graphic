/**
 * "Poster" look: 1930s constructivist-style printed posters. Bold diagonal colour blocks, giant block
 * headlines that slam in word by word, angular icons, halftone and paper grain, and a print that snaps
 * into register on every cut (diagonal wipe). Original geometry, no borrowed artwork.
 * Same brand family (navy / red / gold / cream, faceless, brand subtitles and CTA).
 */
import React, {useId} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {clamp, prog, useSpring} from "./kit";
import {useBrandText, useCue} from "./env";
import type {PosterArt, PosterShot, PosterWord} from "./types";

const FONT = "Impact, 'Arial Black', 'Haettenschweiler', sans-serif";
const P = {cream: "#efe6cf", cream2: "#fbf6e6", red: "#c4232f", red2: "#9c1a25", navy: "#0a1530", navy2: "#16305f", gold: "#e8b04b", ink: "#101828"};
const BG: Record<string, string> = {cream: P.cream, red: P.red, navy: P.navy};
const COL: Record<string, string> = {cream: P.cream2, red: P.red, navy: P.navy, gold: P.gold, ink: P.ink};
const col = (n?: string, d: string = P.cream2) => (n ? COL[n] ?? n : d);

/* ------------------------------ kinetic type ------------------------------ */
const Word: React.FC<{w: PosterWord; index: number}> = ({w, index}) => {
  const cf = useCue();
  const delay = w.at !== undefined ? cf(w.at) : 8 + index * 6;
  const s = useSpring(delay, 10, 230);
  const f = useCurrentFrame();
  const size = w.size ?? 120;
  const text = w.text.toUpperCase();
  const width = text.length * size * 0.5 + 56;
  const since = f - delay;
  const shake = since > 0 && since < 8 ? Math.sin(since * 2.6) * (8 - since) * 0.9 : 0;
  const bar = w.bar && w.bar !== "none" ? col(w.bar) : undefined;
  const txt = col(w.color, bar ? P.cream2 : P.navy);
  return (
    <g
      transform={`translate(${(w.x ?? 540) + shake} ${w.y ?? 700}) rotate(${(w.rot ?? 0) + (1 - s) * -6}) scale(${interpolate(s, [0, 1], [1.9, 1])})`}
      opacity={interpolate(s, [0, 0.25], [0, 1], clamp)}
    >
      {bar && <rect x={-width / 2} y={-size * 0.86} width={width} height={size * 1.08} fill={bar} />}
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontSize={size} fill={txt} letterSpacing={size * 0.02}>
        {text}
      </text>
    </g>
  );
};

/* ------------------------------ art ------------------------------ */
const Pop: React.FC<{delay: number; children: React.ReactNode}> = ({delay, children}) => {
  const s = useSpring(delay, 13, 150);
  return (
    <g opacity={interpolate(s, [0, 0.3], [0, 1], clamp)} transform={`translate(0 ${(1 - s) * 50})`}>
      {children}
    </g>
  );
};

const Star: React.FC<{x: number; y: number; r: number; fill: string; spin?: number}> = ({x, y, r, fill, spin = 0}) => {
  const pts = Array.from({length: 10}).map((_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.42 : r;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  });
  return <polygon points={pts.join(" ")} fill={fill} transform={`rotate(${spin} ${x} ${y})`} />;
};

const Skyline: React.FC<{a: PosterArt}> = ({a}) => {
  const {x = 0, y = 1300, s = 1, color = "navy"} = a;
  const c = col(color);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={c}>
      <path d="M0 0 L0 -120 L70 -120 L70 -190 L140 -190 L140 -130 L210 -130 L210 -260 L240 -260 L240 -330 L246 -330 L246 -520 L254 -330 L260 -330 L260 -260 L290 -260 L290 -140 L380 -140 L380 -210 L450 -210 L450 -170 L520 -170 L520 -250 Q560 -330 600 -250 L600 -170 L680 -170 L680 -230 L760 -230 L760 -150 L840 -150 L840 -200 L920 -200 L920 -120 L1000 -120 L1080 -140 L1080 0 Z" />
      {[[160, -190], [405, -210], [560, -330]].map(([cx, cy], i) => (
        <rect key={i} x={cx - 4} y={cy - 40} width={8} height={40} />
      ))}
    </g>
  );
};

const Beams: React.FC<{a: PosterArt}> = ({a}) => {
  const f = useCurrentFrame();
  const {y = 1380, color = "gold"} = a;
  const c = col(color);
  return (
    <g opacity={0.5}>
      <polygon points={`120,${y} 40,0 330,0`} fill={c} transform={`rotate(${Math.sin(f * 0.03) * 8} 120 ${y})`} />
      <polygon points={`960,${y} 760,0 1050,0`} fill={c} transform={`rotate(${Math.sin(f * 0.03 + 2) * 8} 960 ${y})`} />
    </g>
  );
};

const Wheat: React.FC<{a: PosterArt}> = ({a}) => {
  const f = useCurrentFrame();
  const {x = 540, y = 1000, s = 1, color = "gold", rot = 0} = a;
  const c = col(color);
  const sway = Math.sin(f * 0.06 + x) * 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + sway}) scale(${s})`}>
      <path d="M0 0 L0 -420" stroke={c} strokeWidth={14} strokeLinecap="round" />
      {Array.from({length: 7}).map((_, i) => (
        <g key={i} transform={`translate(0 ${-150 - i * 44})`}>
          <path d="M0 0 Q-44 -22 -50 -66 Q-8 -50 0 0 Z" fill={c} />
          <path d="M0 0 Q44 -22 50 -66 Q8 -50 0 0 Z" fill={c} />
        </g>
      ))}
      <path d="M0 -440 Q-18 -480 0 -520 Q18 -480 0 -440 Z" fill={c} />
    </g>
  );
};

const Crate: React.FC<{a: PosterArt}> = ({a}) => {
  const {x = 540, y = 1000, s = 1, text = "SEEDS", color = "navy"} = a;
  const c = col(color);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-230} y={-300} width={460} height={300} fill={P.cream2} stroke={c} strokeWidth={14} />
      {[-150, -50, 50, 150].map((px) => (
        <line key={px} x1={px} y1={-300} x2={px} y2={0} stroke={c} strokeWidth={6} />
      ))}
      <line x1={-230} y1={-300} x2={230} y2={0} stroke={c} strokeWidth={12} />
      <line x1={-230} y1={0} x2={230} y2={-300} stroke={c} strokeWidth={12} />
      <rect x={-120} y={-190} width={240} height={80} fill={P.cream2} />
      <text x={0} y={-124} textAnchor="middle" fontFamily={FONT} fontSize={70} fill={c} letterSpacing={6}>
        {text}
      </text>
    </g>
  );
};

const Figure: React.FC<{a: PosterArt}> = ({a}) => {
  const f = useCurrentFrame();
  const {x = 540, y = 1300, s = 1, color = "navy", pose = "stand"} = a;
  const c = col(color);
  const slump = pose === "slump";
  const breathe = Math.sin(f * 0.08) * (slump ? 1 : 3);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform={`rotate(${slump ? 14 : 0} 0 0) translate(0 ${breathe})`}>
        <polygon points="-70,0 -90,-300 -50,-380 50,-380 90,-300 70,0" fill={c} />
        <rect x={-80} y={-210} width={160} height={22} fill={P.red} />
        <circle cx={0} cy={-440} r={52} fill={c} />
        <path d="M-58 -470 L0 -520 L58 -470 L50 -450 L-50 -450 Z" fill={c} />
        <Star x={0} y={-480} r={16} fill={P.red} />
        <polygon points="-90,-300 -150,-210 -120,-190 -70,-260" fill={c} />
        <polygon points="90,-300 150,-210 120,-190 70,-260" fill={c} />
      </g>
    </g>
  );
};

const Clock: React.FC<{a: PosterArt}> = ({a}) => {
  const f = useCurrentFrame();
  const {x = 540, y = 700, s = 1, color = "navy"} = a;
  const c = col(color);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={180} fill={P.cream2} stroke={c} strokeWidth={18} />
      {Array.from({length: 12}).map((_, i) => (
        <line key={i} x1={0} y1={-160} x2={0} y2={i % 3 === 0 ? -122 : -140} stroke={c} strokeWidth={i % 3 === 0 ? 12 : 6} transform={`rotate(${i * 30})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-100} stroke={c} strokeWidth={14} strokeLinecap="round" transform={`rotate(${f * 1.5})`} />
      <line x1={0} y1={0} x2={0} y2={-140} stroke={P.red} strokeWidth={8} strokeLinecap="round" transform={`rotate(${f * 12})`} />
      <circle r={14} fill={c} />
    </g>
  );
};

const Bust: React.FC<{a: PosterArt}> = ({a}) => {
  const {x = 540, y = 1100, s = 1, color = "navy", text} = a;
  const c = col(color);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <polygon points="-230,0 -200,-190 -90,-260 90,-260 200,-190 230,0" fill={c} />
      <polygon points="-50,-260 0,-200 50,-260" fill={P.cream2} />
      <rect x={-34} y={-330} width={68} height={80} fill={c} />
      <polygon points="-96,-330 -76,-470 0,-520 76,-470 96,-330 34,-300 -34,-300" fill={c} />
      {text && (
        <g>
          <rect x={-250} y={20} width={500} height={90} fill={P.red} />
          <text x={0} y={90} textAnchor="middle" fontFamily={FONT} fontSize={64} fill={P.cream2} letterSpacing={4}>
            {text.toUpperCase()}
          </text>
        </g>
      )}
    </g>
  );
};

const Bars: React.FC<{a: PosterArt}> = ({a}) => {
  const {color = "navy"} = a;
  const c = col(color);
  return (
    <g>
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={110 + i * 140} y={0} width={44} height={1500} fill={c} />
      ))}
      <rect x={0} y={420} width={1080} height={44} fill={c} />
      <rect x={0} y={1180} width={1080} height={44} fill={c} />
    </g>
  );
};

const Sprout: React.FC<{a: PosterArt}> = ({a}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const {x = 540, y = 1250, s = 1, color = "gold"} = a;
  const c = col(color);
  const start = a.at !== undefined ? cf(a.at) : 6;
  const g = prog(f, start, start + 60);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-80 0 Q-40 -30 0 0 Q40 -30 80 0 Z" fill={P.navy2} />
      <path d={`M0 0 Q ${-10 * g} ${-200 * g} 0 ${-420 * g}`} stroke={c} strokeWidth={18} fill="none" strokeLinecap="round" />
      <g transform={`translate(0 ${-250 * g}) scale(${g})`}>
        <path d="M0 0 Q-130 -30 -190 -140 Q-60 -150 0 0 Z" fill={c} />
      </g>
      <g transform={`translate(0 ${-400 * g}) scale(${g})`}>
        <path d="M0 0 Q130 -30 190 -140 Q60 -150 0 0 Z" fill={c} />
      </g>
    </g>
  );
};

const Snow: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g fill={P.cream2} opacity={0.75}>
      {Array.from({length: 46}).map((_, i) => {
        const x = (i * 197 + Math.sin(f * 0.02 + i) * 24) % 1080;
        const y = (i * 311 + f * (2 + (i % 4))) % 1500;
        return <circle key={i} cx={x} cy={y} r={3 + (i % 3)} />;
      })}
    </g>
  );
};

const renderArt = (a: PosterArt, i: number) => {
  const el = (() => {
    switch (a.kind) {
      case "skyline": return <Skyline a={a} />;
      case "beams": return <Beams a={a} />;
      case "wheat": return <Wheat a={a} />;
      case "crate": return <Crate a={a} />;
      case "figure": return <Figure a={a} />;
      case "clock": return <Clock a={a} />;
      case "bust": return <Bust a={a} />;
      case "bars": return <Bars a={a} />;
      case "sprout": return <Sprout a={a} />;
      case "star": return <Star x={a.x ?? 540} y={a.y ?? 700} r={(a.s ?? 1) * 200} fill={col(a.color, P.red)} />;
      default: return null;
    }
  })();
  return el ? <ArtSlot key={i} a={a} index={i}>{el}</ArtSlot> : null;
};

const ArtSlot: React.FC<{a: PosterArt; index: number; children: React.ReactNode}> = ({a, index, children}) => {
  const cf = useCue();
  const delay = a.at !== undefined ? cf(a.at) : 4 + index * 4;
  if (a.kind === "beams" || a.kind === "bars" || a.kind === "skyline") return <>{children}</>;
  return <Pop delay={delay}>{children}</Pop>;
};

/* ------------------------------ the poster ------------------------------ */
export const PosterView: React.FC<{s: PosterShot}> = ({s}) => {
  const f = useCurrentFrame();
  const bt = useBrandText();
  const id = useId().replace(/:/g, "");
  const bg = s.bg ?? "cream";
  const alt = bg === "cream" ? P.red : bg === "red" ? P.cream : P.red2;
  const decorCol = alt;
  const mis = (1 - prog(f, 0, 14)) * 22;
  const push = interpolate(f, [0, 160], [1, 1.04], clamp);

  return (
    <AbsoluteFill style={{background: BG[bg]}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <pattern id={id + "h"} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx={11} cy={11} r={5} fill="#000" />
          </pattern>
          <linearGradient id={id + "g"} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={id + "sc"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.navy} stopOpacity={0} />
            <stop offset="0.45" stopColor={P.navy} stopOpacity={0.55} />
            <stop offset="1" stopColor={P.navy} stopOpacity={0.9} />
          </linearGradient>
          <mask id={id + "m"}>
            <rect width={1080} height={1920} fill={`url(#${id}g)`} />
          </mask>
          <filter id={id + "n"} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0.22 0" />
          </filter>
        </defs>

        <g transform={`translate(540 760) scale(${push}) translate(-540 -760)`}>
          {/* colour blocks print slightly off-register, then snap into place */}
          <g transform={`translate(${-mis} ${mis * 0.6})`}>
            {s.layout === "diag" && <polygon points="-40,1180 1120,520 1120,860 -40,1520" fill={decorCol} />}
            {s.layout === "split" && <polygon points="-40,-40 640,-40 440,1960 -40,1960" fill={decorCol} />}
            {s.layout === "burst" &&
              Array.from({length: 14}).map((_, i) => {
                const a1 = (i / 14) * Math.PI * 2;
                const a2 = ((i + 0.5) / 14) * Math.PI * 2;
                return <polygon key={i} points={`540,760 ${540 + Math.cos(a1) * 1500},${760 + Math.sin(a1) * 1500} ${540 + Math.cos(a2) * 1500},${760 + Math.sin(a2) * 1500}`} fill={decorCol} opacity={0.22} />;
              })}
            {s.layout === "frame" && <rect x={50} y={190} width={980} height={1150} fill="none" stroke={decorCol} strokeWidth={22} />}
          </g>

          <rect width={1080} height={1920} fill="#000" opacity={0.28} mask={`url(#${id}m)`} style={{mixBlendMode: "multiply"}} />
          <rect width={1080} height={1920} fill={`url(#${id}h)`} mask={`url(#${id}m)`} opacity={0.18} />

          {s.art?.map((a, i) => renderArt(a, i))}
          {s.snow && <Snow />}
          {s.words?.map((w, i) => (
            <Word key={i} w={w} index={i} />
          ))}
        </g>

        <rect width={1080} height={1920} fill="#fff" filter={`url(#${id}n)`} opacity={0.5} style={{mixBlendMode: "multiply"}} />
        {/* footer scrim: keeps the brand subtitles readable on light posters */}
        <rect x={0} y={1330} width={1080} height={590} fill={`url(#${id}sc)`} />

        {s.tab && (
          <g transform={`translate(0 ${(1 - prog(f, 2, 12)) * -90})`}>
            <rect x={0} y={60} width={620} height={74} fill={P.ink} />
            <text x={40} y={112} fontFamily={FONT} fontSize={46} fill={P.cream2} letterSpacing={5}>
              {s.tab.toUpperCase()}
            </text>
            <Star x={560} y={97} r={20} fill={P.red} />
          </g>
        )}

        {s.cta && (
          <g>
            <g opacity={prog(f, 8, 20)}>
              <Star x={540} y={620} r={190} fill={P.red} spin={f * 0.4} />
            </g>
            <g opacity={prog(f, 16, 28)} transform={`translate(0 ${(1 - prog(f, 16, 28)) * 60})`}>
              <rect x={90} y={880} width={900} height={170} fill={P.cream2} />
              <text x={540} y={1010} textAnchor="middle" fontFamily={FONT} fontSize={140} fill={P.navy} letterSpacing={8}>{bt.name.toUpperCase()}</text>
            </g>
            <g opacity={prog(f, 30, 42)} transform={`translate(540 1140) scale(${1 + Math.sin(f * 0.25) * 0.03})`}>
              <rect x={-190} y={-62} width={380} height={110} fill={P.red} />
              <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontSize={86} fill={P.cream2} letterSpacing={8}>{bt.ctaButton.toUpperCase()}</text>
            </g>
            <g opacity={prog(f, 46, 58)}>
              <text x={540} y={1260} textAnchor="middle" fontFamily={FONT} fontSize={40} fill={P.cream2} letterSpacing={3}>{bt.ctaQuestion.toUpperCase()}</text>
            </g>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
