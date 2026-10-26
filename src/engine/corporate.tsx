/**
 * "Corporate" look: a modern business-briefing style for client and company videos.
 * Full-bleed brand-blue (or white) scenes with an animated procedural b-roll layer (data network, conveyor, server
 * racks, skyline, brand rings) or a real stock clip, kinetic headlines that slam in word by word, cards that fly in
 * and bob, step diagrams with a travelling pulse, data links that visibly break, and a dark scrim at the bottom that
 * carries the subtitles and the logo. None of the Dark Tales storytelling props.
 * Blocks are stacked and centred automatically, so a shot is just a list of blocks.
 */
import React, {useId, useMemo} from "react";
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from "remotion";
import {SANS, clamp, prog, useSpring} from "./kit";
import {useBrandText, useCue, useTheme} from "./env";
import type {BriefBlock, BriefBroll, BriefShot, Tone} from "./types";

const TEXT = "#0f2a43";
const MUTED = "#5b7089";
const LINE = "#dfe8f2";
const TONES_L: Record<string, string> = {ok: "#1f9d6b", bad: "#d64545", warn: "#e39a00", neutral: "#7a8ca1"};
const TONES_D: Record<string, string> = {ok: "#34d399", bad: "#ff6b6b", warn: "#ffb938", neutral: "#9db4cc"};

const rng = (seed: number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

const Scene = React.createContext({dark: true});
const useDark = () => React.useContext(Scene).dark;

const usePalette = () => {
  const t = useTheme();
  const dark = useDark();
  const primary = t.primary ?? "#155485";
  const accent = t.accent ?? "#7cc4ff";
  return {
    primary,
    deep: t.primaryDark ?? "#0b2b4a",
    accent,
    dark,
    ink: dark ? "#ffffff" : TEXT,
    sub: dark ? "#b9d4ee" : MUTED,
    /** tone colour for things sitting on a white card */
    card: (k?: Tone) => (k && TONES_L[k]) || primary,
    /** tone colour for things sitting directly on the scene */
    free: (k?: Tone) => (k && (dark ? TONES_D : TONES_L)[k]) || (dark ? accent : primary),
  };
};

/* ------------------------------ icons (48 box, centre 0,0) ------------------------------ */
const Icon: React.FC<{name?: string; size?: number; color?: string; sw?: number; draw?: number}> = ({name, size = 48, color = "#155485", sw = 3.2, draw}) => {
  const p = {
    fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
    ...(draw !== undefined && draw < 1 ? {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw} : {}),
  } as const;
  let g: React.ReactNode = null;
  switch (name) {
    case "chip":
      g = (
        <>
          <rect x={-12} y={-12} width={24} height={24} rx={4} {...p} />
          <rect x={-5} y={-5} width={10} height={10} rx={1} {...p} />
          {[-6, 6].map((v) => (
            <React.Fragment key={v}>
              <line x1={v} y1={-12} x2={v} y2={-19} {...p} />
              <line x1={v} y1={12} x2={v} y2={19} {...p} />
              <line x1={-12} y1={v} x2={-19} y2={v} {...p} />
              <line x1={12} y1={v} x2={19} y2={v} {...p} />
            </React.Fragment>
          ))}
        </>
      );
      break;
    case "db":
      g = (
        <>
          <ellipse cx={0} cy={-13} rx={14} ry={6} {...p} />
          <path d="M-14 -13 V13 A14 6 0 0 0 14 13 V-13" {...p} />
          <path d="M-14 0 A14 6 0 0 0 14 0" {...p} />
        </>
      );
      break;
    case "sheet":
      g = (
        <>
          <rect x={-15} y={-15} width={30} height={30} rx={4} {...p} />
          <line x1={-15} y1={-5} x2={15} y2={-5} {...p} />
          <line x1={-15} y1={5} x2={15} y2={5} {...p} />
          <line x1={-3} y1={-15} x2={-3} y2={15} {...p} />
        </>
      );
      break;
    case "warehouse":
      g = (
        <>
          <path d="M-17 -5 L0 -16 L17 -5 V15 H-17 Z" {...p} />
          <path d="M-6 15 V3 H6 V15" {...p} />
        </>
      );
      break;
    case "user":
    case "userq":
      g = (
        <>
          <circle cx={0} cy={-8} r={7} {...p} />
          <path d="M-14 15 C-14 3 14 3 14 15" {...p} />
          {name === "userq" && (
            <>
              <circle cx={15} cy={-14} r={8} fill={color} />
              <text x={15} y={-9.5} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={13} fill="#fff">?</text>
            </>
          )}
        </>
      );
      break;
    case "shield":
      g = <path d="M0 -17 L15 -11 V2 C15 11 8 16 0 19 C-8 16 -15 11 -15 2 V-11 Z" {...p} />;
      break;
    case "coins":
      g = (
        <>
          <ellipse cx={0} cy={-10} rx={13} ry={5} {...p} />
          <path d="M-13 -10 V0 A13 5 0 0 0 13 0 V-10" {...p} />
          <path d="M-13 0 V10 A13 5 0 0 0 13 10 V0" {...p} />
        </>
      );
      break;
    case "flag":
      g = (
        <>
          <line x1={-12} y1={-17} x2={-12} y2={17} {...p} />
          <path d="M-12 -15 H12 L6 -7 L12 1 H-12" {...p} />
        </>
      );
      break;
    case "check":
      g = <path d="M-14 1 L-5 10 L14 -10" {...p} />;
      break;
    case "cross":
      g = (
        <>
          <line x1={-11} y1={-11} x2={11} y2={11} {...p} />
          <line x1={11} y1={-11} x2={-11} y2={11} {...p} />
        </>
      );
      break;
    case "pause":
      g = (
        <>
          <line x1={-7} y1={-12} x2={-7} y2={12} {...p} />
          <line x1={7} y1={-12} x2={7} y2={12} {...p} />
        </>
      );
      break;
    case "alert":
      g = (
        <>
          <path d="M0 -16 L17 13 H-17 Z" {...p} />
          <line x1={0} y1={-5} x2={0} y2={3} {...p} />
          <circle cx={0} cy={8.5} r={1.4} fill={color} />
        </>
      );
      break;
    case "chart":
      g = (
        <>
          <line x1={-15} y1={15} x2={15} y2={15} {...p} />
          <rect x={-12} y={3} width={6} height={12} {...p} />
          <rect x={-3} y={-5} width={6} height={20} {...p} />
          <rect x={6} y={-14} width={6} height={29} {...p} />
        </>
      );
      break;
    case "present":
      g = (
        <>
          <rect x={-17} y={-15} width={34} height={21} rx={3} {...p} />
          <line x1={0} y1={6} x2={0} y2={16} {...p} />
          <line x1={-8} y1={16} x2={8} y2={16} {...p} />
          <path d="M-9 -3 L-3 -9 L2 -4 L9 -10" {...p} />
        </>
      );
      break;
    case "gear":
      g = (
        <>
          <circle cx={0} cy={0} r={7} {...p} />
          {Array.from({length: 8}).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={Math.cos(a) * 11} y1={Math.sin(a) * 11} x2={Math.cos(a) * 16} y2={Math.sin(a) * 16} {...p} />;
          })}
        </>
      );
      break;
    case "play":
      g = <path d="M-8 -13 L13 0 L-8 13 Z" {...p} />;
      break;
    case "doc":
      g = (
        <>
          <path d="M-11 -17 H5 L13 -9 V17 H-11 Z" {...p} />
          <line x1={-5} y1={0} x2={7} y2={0} {...p} />
          <line x1={-5} y1={8} x2={7} y2={8} {...p} />
        </>
      );
      break;
    default:
      g = <circle r={12} {...p} />;
  }
  return <g transform={`scale(${size / 48})`}>{g}</g>;
};

/* ------------------------------ b-roll (procedural, drifts with the frame) ------------------------------ */
type BrollProps = {color: string; hi: string; dark: boolean};

const Network: React.FC<BrollProps> = ({color, hi}) => {
  const f = useCurrentFrame();
  const pts = useMemo(() => {
    const r = rng(7);
    return Array.from({length: 26}, () => ({x: r() * 1080, y: 110 + r() * 1250, px: r() * 6.28, py: r() * 6.28, s: 0.3 + r() * 0.7, big: r() > 0.78}));
  }, []);
  const pos = pts.map((p) => ({x: p.x + Math.sin(f * 0.012 * p.s + p.px) * 44, y: p.y + Math.cos(f * 0.01 * p.s + p.py) * 44, big: p.big}));
  const edges: {a: number; b: number; d: number}[] = [];
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y);
      if (d < 330) edges.push({a: i, b: j, d});
    }
  }
  return (
    <g>
      {edges.map((e, i) => (
        <line key={i} x1={pos[e.a].x} y1={pos[e.a].y} x2={pos[e.b].x} y2={pos[e.b].y} stroke={color} strokeWidth={2} opacity={(1 - e.d / 330) * 0.7} />
      ))}
      {edges.filter((_, i) => i % 3 === 0).map((e, i) => {
        const t = (f * 0.014 + i * 0.37) % 1;
        return <circle key={i} cx={pos[e.a].x + (pos[e.b].x - pos[e.a].x) * t} cy={pos[e.a].y + (pos[e.b].y - pos[e.a].y) * t} r={5} fill={hi} opacity={Math.sin(Math.PI * t)} />;
      })}
      {pos.map((p, i) => (
        <g key={i}>
          {p.big && <circle cx={p.x} cy={p.y} r={26} fill={hi} opacity={0.12} />}
          <circle cx={p.x} cy={p.y} r={p.big ? 9 : 5} fill={p.big ? hi : color} />
        </g>
      ))}
    </g>
  );
};

/** Conveyor: boxes queue up at a red gate and never get through (a pilot that stalls before production). */
const Belt: React.FC<BrollProps> = ({color, hi, dark}) => {
  const f = useCurrentFrame();
  const y = 1215;
  const gateX = 750;
  const w = 124;
  return (
    <g>
      <rect x={-10} y={y} width={1100} height={16} rx={8} fill={color} opacity={0.55} />
      {Array.from({length: 20}).map((_, i) => (
        <circle key={i} cx={((i * 60 + f * 3) % 1200) - 60} cy={y + 8} r={6} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
      ))}
      {Array.from({length: 7}).map((_, i) => {
        const s = i * 34;
        if (f < s) return null;
        const x = Math.min(-150 + 4.2 * (f - s), gateX - i * (w + 14) - w);
        return (
          <g key={i} transform={`translate(${x} ${y - 94})`}>
            <rect width={w} height={94} rx={10} fill={dark ? "rgba(255,255,255,0.12)" : color} fillOpacity={dark ? 1 : 0.14} stroke={hi} strokeWidth={2.5} opacity={0.85} />
            <rect x={w / 2 - 9} width={18} height={94} fill={hi} opacity={0.28} />
          </g>
        );
      })}
      <g opacity={0.65 + 0.35 * Math.sin(f * 0.25)}>
        <line x1={gateX + 22} y1={y - 170} x2={gateX + 22} y2={y + 10} stroke="#ff6b6b" strokeWidth={8} strokeLinecap="round" strokeDasharray="2 18" />
        <circle cx={gateX + 22} cy={y - 190} r={22} fill="#ff6b6b" />
        <g transform={`translate(${gateX + 22} ${y - 190})`}><Icon name="cross" size={26} color="#fff" sw={5} /></g>
      </g>
    </g>
  );
};

const Servers: React.FC<BrollProps> = ({color, hi, dark}) => {
  const f = useCurrentFrame();
  const leds = [hi, "#34d399", "#ffb938"];
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const x = 70 + i * 250;
        const top = 800 + (i % 2) * 60 + Math.sin(f * 0.02 + i) * 6;
        return (
          <g key={i}>
            <rect x={x} y={top} width={200} height={1340 - top} rx={14} fill={dark ? "rgba(255,255,255,0.06)" : color} fillOpacity={dark ? 1 : 0.07} stroke={color} strokeWidth={2.5} opacity={0.9} />
            {Array.from({length: 9}).map((_, r) => {
              const y = top + 26 + r * 52;
              if (y > 1300) return null;
              return (
                <g key={r}>
                  <rect x={x + 16} y={y} width={168} height={36} rx={8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
                  {leds.map((c, k) => (
                    <circle key={k} cx={x + 34 + k * 20} cy={y + 18} r={5} fill={c} opacity={Math.sin(f * 0.11 * (1 + k * 0.35) + i * 3 + r * 1.7) > 0.15 ? 1 : 0.18} />
                  ))}
                  <rect x={x + 108} y={y + 14} width={60} height={8} rx={4} fill={color} opacity={0.5} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

const Skyline: React.FC<BrollProps> = ({color, hi}) => {
  const f = useCurrentFrame();
  const layers = useMemo(() => {
    return [0, 1, 2].map((li) => {
      const r = rng(31 + li * 17);
      const bs: {x: number; w: number; h: number; win: number}[] = [];
      let x = 0;
      while (x < 1080) {
        const w = 90 + r() * 110;
        bs.push({x, w, h: 240 + li * 90 + r() * 320, win: r()});
        x += w + 8 + r() * 20;
      }
      return bs;
    });
  }, []);
  const base = 1330;
  return (
    <g>
      {layers.map((bs, li) => {
        const sp = 0.25 + li * 0.35;
        const off = -((f * sp) % 1100);
        return [0, 1].map((rep) => (
          <g key={`${li}-${rep}`} transform={`translate(${off + rep * 1100} 0)`} opacity={0.35 + li * 0.25}>
            {bs.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={base - b.h} width={b.w} height={b.h + 40} fill={color} fillOpacity={0.1 + li * 0.07} />
                {li > 0 &&
                  Array.from({length: Math.floor(b.h / 46)}).map((_, wi) =>
                    [0, 1, 2].map((wj) => {
                      if (wj * 30 + 20 > b.w - 16) return null;
                      const on = Math.sin(f * 0.02 + b.win * 40 + wi * 3.1 + wj * 1.7 + li * 5) > 0.55;
                      return <rect key={`${wi}-${wj}`} x={b.x + 14 + wj * 30} y={base - b.h + 20 + wi * 46} width={14} height={20} fill={hi} opacity={on ? 0.85 : 0.1} />;
                    })
                  )}
              </g>
            ))}
          </g>
        ));
      })}
    </g>
  );
};

const Rings: React.FC<BrollProps> = ({color, hi}) => {
  const f = useCurrentFrame();
  return (
    <g transform="translate(540 760)">
      {[0, 1, 2, 3].map((i) => {
        const t = ((f * 1.4 + i * 90) % 360) / 360;
        return <circle key={i} r={90 + t * 560} fill="none" stroke={hi} strokeWidth={3} opacity={(1 - t) * 0.5} />;
      })}
      <g transform={`rotate(${f * 0.2})`}>
        {Array.from({length: 30}).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 400} cy={Math.sin(a) * 400} r={6 + ((i * 7) % 5) * 5} fill={color} opacity={0.5} />;
        })}
      </g>
    </g>
  );
};

const Broll: React.FC<{kind: Exclude<BriefBroll, {video: string}>; dark: boolean; accent: string; primary: string}> = ({kind, dark, accent, primary}) => {
  const color = dark ? "#8fc4f0" : primary;
  const hi = dark ? accent : primary;
  const p = {color, hi, dark};
  return (
    <g opacity={(kind === "servers" ? 0.38 : kind === "network" ? 0.5 : 0.58) * (dark ? 1 : 0.75)}>
      {kind === "network" && <Network {...p} />}
      {kind === "belt" && <Belt {...p} />}
      {kind === "servers" && <Servers {...p} />}
      {kind === "skyline" && <Skyline {...p} />}
      {kind === "rings" && <Rings {...p} />}
    </g>
  );
};

/* ------------------------------ layout ------------------------------ */
const GAP = 48;
const REGION: [number, number] = [250, 1330]; // content lives between the tab and the subtitle scrim

const textLines = (b: {text: string; size?: number}) => {
  const size = b.size ?? 64;
  return b.text.split("\n").reduce((n, ln) => n + Math.max(1, Math.ceil((ln.length * size * 0.56) / 920)), 0);
};
const rowsOf = (b: Extract<BriefBlock, {kind: "cards"}>) => Math.ceil(b.items.length / (b.cols ?? Math.min(b.items.length, 3)));
const heightOf = (b: BriefBlock): number => {
  switch (b.kind) {
    case "text": return textLines(b) * (b.size ?? 64) * 1.22 + (b.sub ? 66 : 0);
    case "counter": return 410;
    case "cards": {
      const cols = b.cols ?? Math.min(b.items.length, 3);
      const h = cols === 1 ? 230 : 300;
      return rowsOf(b) * h + (rowsOf(b) - 1) * 24;
    }
    case "steps": return 230;
    case "list": return b.items.length * 104 + (b.items.length - 1) * 18;
    case "badge": return 92;
    case "link": return 240;
  }
};

const Card: React.FC<{x: number; y: number; w: number; h: number; shadow: string}> = ({x, y, w, h, shadow}) => (
  <rect x={x} y={y} width={w} height={h} rx={30} fill="#fff" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} filter={`url(#${shadow})`} />
);

/** Slides in from the side with overshoot, then bobs a little. */
const Fly: React.FC<{delay: number; side?: 1 | -1; bob?: number; children: React.ReactNode}> = ({delay, side = 1, bob = 0, children}) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 12, 150);
  const rest = Math.max(0, f - delay - 20);
  return (
    <g
      opacity={interpolate(s, [0, 0.3], [0, 1], clamp)}
      transform={`translate(${(1 - s) * 260 * side} ${(1 - s) * 40 + Math.sin(rest * 0.06 + bob) * 3}) rotate(${(1 - s) * 5 * side} 540 700)`}
    >
      {children}
    </g>
  );
};

/* ------------------------------ blocks ------------------------------ */
const TextBlock: React.FC<{b: Extract<BriefBlock, {kind: "text"}>; delay: number}> = ({b, delay}) => {
  const f = useCurrentFrame();
  const P = usePalette();
  const size = b.size ?? 64;
  const lines = b.text.split("\n").map((l) => l.split(" "));
  const hl = new Set((b.hl ?? []).map((w) => w.toLowerCase()));
  const base = b.tone ? P.free(b.tone) : b.color ?? P.ink;
  const hlColor = P.dark ? P.accent : P.primary;
  let wi = 0;
  return (
    <foreignObject x={60} y={0} width={960} height={heightOf(b) + 60} style={{overflow: "visible"}}>
      <div style={{width: 960, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.22, color: base}}>
        {lines.map((ln, li) => (
          <div key={li}>
            {ln.map((w, i) => {
              const d = delay + wi++ * 4;
              const a = prog(f, d, d + 12);
              const bar = prog(f, d + 6, d + 22);
              const hit = hl.has(w.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block", margin: "0 0.13em", opacity: a,
                    transform: `translateY(${(1 - a) * 44}px) scale(${0.82 + 0.18 * a})`,
                    color: hit ? hlColor : undefined,
                    backgroundImage: hit ? `linear-gradient(${hlColor}, ${hlColor})` : undefined,
                    backgroundRepeat: "no-repeat", backgroundPosition: "left 96%",
                    backgroundSize: hit ? `${bar * 100}% 7px` : undefined,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        ))}
        {b.sub && (
          <div style={{fontWeight: 500, fontSize: 32, color: P.sub, marginTop: 14, opacity: prog(f, delay + 12, delay + 26)}}>{b.sub}</div>
        )}
      </div>
    </foreignObject>
  );
};

const CounterBlock: React.FC<{b: Extract<BriefBlock, {kind: "counter"}>; delay: number}> = ({b, delay}) => {
  const f = useCurrentFrame();
  const P = usePalette();
  const from = b.from ?? 0;
  const p = prog(f, delay, delay + 46, (t) => t);
  const val = Math.round(interpolate(p, [0, 1], [from, b.to]));
  const pop = useSpring(delay, 12, 170);
  const r = 150;
  const cx = 540;
  const cy = 170;
  return (
    <g opacity={interpolate(pop, [0, 0.3], [0, 1], clamp)} transform={`translate(0 ${(1 - pop) * 30})`}>
      <circle cx={cx} cy={cy} r={r + 36} fill={P.accent} opacity={0.08} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeOpacity={P.dark ? 0.16 : 0} strokeWidth={18} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.dark ? P.accent : P.primary} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-90 ${cx} ${cy})`} />
      {Array.from({length: b.to}).map((_, i) => {
        const a = (i / b.to) * Math.PI * 2 - Math.PI / 2;
        const on = p >= (i + 1) / b.to - 0.001;
        return <circle key={i} cx={cx + Math.cos(a) * (r + 34)} cy={cy + Math.sin(a) * (r + 34)} r={on ? 7 : 4} fill={on ? P.accent : "#ffffff"} opacity={on ? 1 : 0.35} />;
      })}
      <text x={cx} y={cy + 30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={150} fill={P.ink}>{val}</text>
      {b.unit && <text x={cx} y={cy + 92} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={38} letterSpacing={4} fill={P.sub}>{b.unit.toUpperCase()}</text>}
      {b.label && <text x={cx} y={400} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill={P.ink} opacity={prog(f, delay + 40, delay + 54)}>{b.label}</text>}
    </g>
  );
};

const CardsBlock: React.FC<{b: Extract<BriefBlock, {kind: "cards"}>; delay: number; shadow: string}> = ({b, delay, shadow}) => {
  const f = useCurrentFrame();
  const P = usePalette();
  const cf = useCue();
  const cols = b.cols ?? Math.min(b.items.length, 3);
  const gap = 24;
  const w = cols === 1 ? 760 : (980 - gap * (cols - 1)) / cols;
  const h = cols === 1 ? 230 : 300;
  return (
    <>
      {b.items.map((it, i) => {
        const row = Math.floor(i / cols);
        const inRow = Math.min(cols, b.items.length - row * cols);
        const x = 540 - (inRow * w + (inRow - 1) * gap) / 2 + (i % cols) * (w + gap);
        const y = row * (h + gap);
        const c = P.card(it.tone);
        const d = it.at !== undefined ? cf(it.at) : delay + i * 9;
        const dr = prog(f, d + 8, d + 26);
        return (
          <Fly key={i} delay={d} side={i % 2 ? 1 : -1} bob={i * 1.7}>
            <Card x={x} y={y} w={w} h={h} shadow={shadow} />
            {cols === 1 ? (
              <>
                <circle cx={x + 120} cy={y + h / 2} r={58} fill={`${c}1f`} />
                <g transform={`translate(${x + 120} ${y + h / 2})`}><Icon name={it.icon} size={64} color={c} draw={dr} /></g>
                <text x={x + 210} y={y + h / 2 + (it.sub ? -2 : 14)} fontFamily={SANS} fontWeight={800} fontSize={44} fill={TEXT}>{it.title}</text>
                {it.sub && <text x={x + 210} y={y + h / 2 + 44} fontFamily={SANS} fontWeight={500} fontSize={30} fill={MUTED}>{it.sub}</text>}
                <rect x={x} y={y + 40} width={9} height={h - 80} rx={4.5} fill={c} />
              </>
            ) : (
              <>
                <circle cx={x + w / 2} cy={y + 98} r={46} fill={`${c}1f`} />
                <g transform={`translate(${x + w / 2} ${y + 98})`}><Icon name={it.icon} size={52} color={c} draw={dr} /></g>
                <text x={x + w / 2} y={y + (it.sub ? 200 : 226)} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={TEXT}>{it.title}</text>
                {it.sub && <text x={x + w / 2} y={y + 240} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={23} fill={MUTED}>{it.sub}</text>}
                <rect x={x + 28} y={y + h - 22} width={w - 56} height={6} rx={3} fill={c} />
              </>
            )}
          </Fly>
        );
      })}
    </>
  );
};

const StepNode: React.FC<{x: number; cy: number; delay: number; item: {label: string; sub?: string; state?: string; icon?: string}; color: string}> = ({x, cy, delay, item, color}) => {
  const f = useCurrentFrame();
  const P = usePalette();
  const s = useSpring(delay, 11, 190);
  const stalled = item.state === "stalled";
  const todo = item.state === "todo";
  const since = f - delay;
  const shake = stalled && since > 16 && since < 40 ? Math.sin(since * 1.6) * 5 * (1 - (since - 16) / 24) : 0;
  const pulse = stalled ? (((since - 14) % 50) + 50) % 50 / 50 : 0;
  const dr = prog(f, delay + 6, delay + 20);
  return (
    <g opacity={interpolate(s, [0, 0.3], [0, 1], clamp)}>
      {stalled && since > 14 && [0, 0.5].map((o) => {
        const q = (pulse + o) % 1;
        return <circle key={o} cx={x} cy={cy} r={46 + q * 34} fill="none" stroke={color} strokeWidth={4} opacity={0.6 * (1 - q)} />;
      })}
      {!todo && !stalled && <circle cx={x} cy={cy} r={64} fill={color} opacity={0.18} />}
      <g transform={`translate(${x + shake} ${cy}) scale(${interpolate(s, [0, 1], [0.5, 1])})`}>
        <circle r={46} fill={todo || stalled ? (P.dark ? "#0e3355" : "#fff") : color} stroke={color} strokeWidth={stalled || todo ? 6 : 0} />
        <Icon name={item.icon ?? (stalled ? "pause" : todo ? undefined : "check")} size={52} color={stalled || todo ? color : "#fff"} sw={4} draw={dr} />
      </g>
      <text x={x} y={cy + 106} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={todo ? P.sub : P.ink}>{item.label}</text>
      {item.sub && <text x={x} y={cy + 142} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill={stalled ? P.free("bad") : P.sub}>{item.sub}</text>}
    </g>
  );
};

const StepsBlock: React.FC<{b: Extract<BriefBlock, {kind: "steps"}>; delay: number}> = ({b, delay}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const P = usePalette();
  const n = b.items.length;
  const x0 = n > 3 ? 140 : 170;
  const x1 = 1080 - x0;
  const xs = b.items.map((_, i) => (n > 1 ? x0 + ((x1 - x0) * i) / (n - 1) : 540));
  const d = b.items.map((it, i) => (it.at !== undefined ? cf(it.at) : delay + i * 16));
  const cy = 70;
  const good = P.dark ? P.accent : P.primary;
  const bad = P.free("bad");
  const colorOf = (s?: string) => (s === "stalled" ? bad : s === "todo" ? (P.dark ? "#6f93b5" : "#b6c4d4") : good);
  const lastDone = b.items.reduce((m, it, i) => (it.state === "stalled" || it.state === "todo" ? m : i), 0);
  const travel = (f * 5) % (Math.max(1, xs[lastDone] - xs[0]) + 60);
  return (
    <g opacity={prog(f, delay, delay + 10)}>
      <line x1={xs[0]} y1={cy} x2={xs[n - 1]} y2={cy} stroke={P.dark ? "#ffffff" : LINE} strokeOpacity={P.dark ? 0.2 : 1} strokeWidth={8} strokeLinecap="round" />
      {b.items.slice(0, -1).map((_, i) => {
        const nxt = b.items[i + 1];
        const p = prog(f, d[i] + 10, d[i + 1] + 4);
        const x2 = xs[i] + (xs[i + 1] - xs[i]) * p;
        return <line key={i} x1={xs[i]} y1={cy} x2={x2} y2={cy} stroke={colorOf(nxt.state)} strokeWidth={8} strokeLinecap="round" strokeDasharray={nxt.state === "stalled" ? "4 16" : undefined} />;
      })}
      {f > d[lastDone] && xs[0] + travel < xs[lastDone] && <circle cx={xs[0] + travel} cy={cy} r={9} fill="#fff" opacity={0.9} />}
      {b.items.map((it, i) => (
        <StepNode key={i} x={xs[i]} cy={cy} delay={d[i]} item={it} color={colorOf(it.state)} />
      ))}
    </g>
  );
};

const ListBlock: React.FC<{b: Extract<BriefBlock, {kind: "list"}>; delay: number; shadow: string}> = ({b, delay, shadow}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  return (
    <>
      {b.items.map((it, i) => {
        const st = it.state ?? "ok";
        const c = TONES_L[st];
        const icon = st === "ok" ? "check" : st === "bad" ? "cross" : "alert";
        const d = it.at !== undefined ? cf(it.at) : delay + i * 14;
        const y = i * 122;
        return (
          <Fly key={i} delay={d} side={-1} bob={i}>
            <Card x={100} y={y} w={880} h={104} shadow={shadow} />
            <circle cx={166} cy={y + 52} r={32} fill={`${c}1f`} />
            <g transform={`translate(166 ${y + 52})`}><Icon name={icon} size={38} color={c} sw={4.4} draw={prog(f, d + 6, d + 20)} /></g>
            <text x={228} y={y + 65} fontFamily={SANS} fontWeight={800} fontSize={34} fill={TEXT}>{it.text}</text>
            {it.value && <text x={944} y={y + 63} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={28} fill={c}>{it.value}</text>}
          </Fly>
        );
      })}
    </>
  );
};

const BadgeBlock: React.FC<{b: Extract<BriefBlock, {kind: "badge"}>; delay: number; shadow: string}> = ({b, delay, shadow}) => {
  const f = useCurrentFrame();
  const P = usePalette();
  const s = useSpring(delay, 9, 240);
  const size = 36;
  const w = b.text.length * (size * 0.64 + 3) + (b.icon ? 150 : 90);
  const c = b.tone === "bad" ? TONES_L.bad : b.tone === "ok" ? TONES_L.ok : b.tone === "warn" ? TONES_L.warn : P.primary;
  const since = f - delay;
  const shake = b.tone === "bad" && since > 0 && since < 14 ? Math.sin(since * 2.4) * 7 * (1 - since / 14) : 0;
  const ring = prog(f, delay, delay + 16);
  return (
    <g>
      {since > 0 && <rect x={540 - w / 2 - ring * 60} y={46 - 46 - ring * 40} width={w + ring * 120} height={92 + ring * 80} rx={46 + ring * 40} fill="none" stroke={c} strokeWidth={5} opacity={(1 - ring) * 0.7} />}
      <g opacity={interpolate(s, [0, 0.2], [0, 1], clamp)} transform={`translate(${540 + shake} 46) scale(${interpolate(s, [0, 1], [1.7, 1])})`}>
        <rect x={-w / 2} y={-46} width={w} height={92} rx={46} fill={c} filter={`url(#${shadow})`} />
        {b.icon && <g transform={`translate(${-w / 2 + 62} 0)`}><Icon name={b.icon} size={44} color="#fff" sw={4} draw={prog(f, delay + 4, delay + 18)} /></g>}
        <text x={b.icon ? 34 : 0} y={size * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} letterSpacing={3} fill="#fff">{b.text.toUpperCase()}</text>
      </g>
    </g>
  );
};

const LinkBlock: React.FC<{b: Extract<BriefBlock, {kind: "link"}>; delay: number; shadow: string}> = ({b, delay, shadow}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const P = usePalette();
  const lx = 130;
  const rx = 650;
  const w = 300;
  const h = 240;
  const y = 120;
  const a = lx + w;
  const z = rx;
  const reach = b.broken ? 0.42 : 1;
  const bx = a + (z - a) * reach;
  const p = prog(f, delay + 10, delay + 40);
  const brokenAt = b.brokenAt !== undefined ? cf(b.brokenAt) : delay + 46;
  const bs = useSpring(brokenAt, 9, 230);
  const lineCol = b.broken ? TONES_D.bad : P.dark ? P.accent : P.primary;
  const node = (x: number, n: {icon?: string; label: string}, d: number, side: 1 | -1) => (
    <Fly delay={d} side={side} bob={x}>
      <Card x={x} y={0} w={w} h={h} shadow={shadow} />
      <circle cx={x + w / 2} cy={92} r={46} fill={`${P.primary}1f`} />
      <g transform={`translate(${x + w / 2} 92)`}><Icon name={n.icon} size={52} color={P.primary} draw={prog(f, d + 8, d + 26)} /></g>
      <text x={x + w / 2} y={196} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={TEXT}>{n.label}</text>
    </Fly>
  );
  const flowing = f > delay + 20;
  return (
    <>
      {node(lx, b.from, delay, -1)}
      {node(rx, b.to, delay + 8, 1)}
      <line x1={a} y1={y} x2={a + (z - a) * p * reach} y2={y} stroke={lineCol} strokeWidth={8} strokeLinecap="round" strokeDasharray={b.broken ? "2 16" : undefined} opacity={0.95} />
      {flowing &&
        Array.from({length: 6}).map((_, i) => {
          const tt = (f * 0.026 + i / 6) % 1;
          const x = a + (bx - a) * tt;
          const spark = b.broken && f > brokenAt && tt < 0.14 ? tt / 0.14 : -1;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={7} fill={P.accent} opacity={Math.sin(Math.PI * tt) * (b.broken && f > brokenAt + 6 ? 0.9 : 1)} />
              {spark >= 0 && b.broken && (
                <g transform={`translate(${bx} ${y})`} opacity={1 - spark}>
                  {Array.from({length: 7}).map((_, k) => {
                    const ang = (k / 7) * Math.PI * 2;
                    return <line key={k} x1={Math.cos(ang) * (8 + spark * 8)} y1={Math.sin(ang) * (8 + spark * 8)} x2={Math.cos(ang) * (18 + spark * 34)} y2={Math.sin(ang) * (18 + spark * 34)} stroke="#ff6b6b" strokeWidth={4} strokeLinecap="round" />;
                  })}
                </g>
              )}
            </g>
          );
        })}
      {b.broken && (
        <g transform={`translate(${bx + 16} ${y}) scale(${interpolate(bs, [0, 1], [0.2, 1])})`} opacity={interpolate(bs, [0, 0.3], [0, 1], clamp)}>
          <circle r={30} fill={TONES_L.bad} filter={`url(#${shadow})`} />
          <Icon name="cross" size={34} color="#fff" sw={5} draw={prog(f, brokenAt + 4, brokenAt + 16)} />
        </g>
      )}
    </>
  );
};

/** Closing-card path: pills joined by arrows, e.g. Assessment → MVP → Production. */
const CtaPath: React.FC<{chips: string[]; y: number}> = ({chips, y}) => {
  const P = usePalette();
  const widths = chips.map((c) => c.length * 17 + 56);
  const arrow = 46;
  const total = widths.reduce((a, b) => a + b, 0) + arrow * (chips.length - 1);
  let x = 540 - total / 2;
  return (
    <g>
      {chips.map((c, i) => {
        const w = widths[i];
        const px = x;
        x += w + arrow;
        const d = 22 + i * 9;
        const s = useSpring(d, 12, 170);
        return (
          <g key={i} opacity={interpolate(s, [0, 0.3], [0, 1], clamp)} transform={`translate(0 ${(1 - s) * 24})`}>
            <rect x={px} y={y - 32} width={w} height={64} rx={32} fill={i === chips.length - 1 ? P.primary : "#fff"} stroke={P.primary} strokeWidth={3} />
            <text x={px + w / 2} y={y + 11} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill={i === chips.length - 1 ? "#fff" : P.primary}>{c}</text>
            {i < chips.length - 1 && <g transform={`translate(${px + w + arrow / 2} ${y})`}><Icon name="play" size={30} color={P.primary} sw={3.5} /></g>}
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------ the shot ------------------------------ */
export const BriefView: React.FC<{s: BriefShot}> = ({s}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const theme = useTheme();
  const bt = useBrandText();
  const id = useId().replace(/:/g, "");
  const dark = (s.bg ?? "dark") === "dark";
  return (
    <Scene.Provider value={{dark}}>
      <BriefInner s={s} f={f} cf={cf} theme={theme} bt={bt} id={id} dark={dark} />
    </Scene.Provider>
  );
};

const BriefInner: React.FC<{s: BriefShot; f: number; cf: (c: any) => number; theme: ReturnType<typeof useTheme>; bt: ReturnType<typeof useBrandText>; id: string; dark: boolean}> = ({s, f, cf, theme, bt, id, dark}) => {
  const P = usePalette();
  const blocks = s.blocks ?? [];
  const total = blocks.reduce((sum, b) => sum + heightOf(b), 0) + GAP * Math.max(0, blocks.length - 1);
  let y = REGION[0] + (REGION[1] - REGION[0] - total) / 2;
  const push = interpolate(f, [0, 200], [1, 1.035], clamp);
  const [num, ...rest] = (s.tab ?? "").split("·").map((t) => t.trim());
  const label = rest.join(" · ");
  const video = s.broll && typeof s.broll === "object" ? s.broll.video : undefined;
  const kind = s.broll && typeof s.broll === "string" ? s.broll : undefined;
  const bx = 540 + Math.sin(f * 0.012) * 200;
  const by = 520 + Math.cos(f * 0.009) * 120;

  return (
    <AbsoluteFill style={{background: dark ? "#0a2744" : "#f4f8fc"}}>
      {video && <OffthreadVideo src={staticFile(video)} muted style={{position: "absolute", width: "100%", height: "100%", objectFit: "cover"}} />}
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: "absolute"}}>
        <defs>
          <linearGradient id={id + "bg"} x1="0" y1="0" x2="0" y2="1">
            {dark ? (
              <>
                <stop offset="0" stopColor="#0a2744" />
                <stop offset="0.5" stopColor="#12508a" />
                <stop offset="1" stopColor="#0a2744" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#dfeaf6" />
              </>
            )}
          </linearGradient>
          <radialGradient id={id + "glow"}>
            <stop offset="0" stopColor={dark ? P.accent : P.primary} stopOpacity={dark ? 0.34 : 0.16} />
            <stop offset="1" stopColor={dark ? P.accent : P.primary} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={id + "scrim"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#06182b" stopOpacity={0} />
            <stop offset={dark ? 0.35 : 0.04} stopColor="#06182b" stopOpacity={dark ? 0.82 : 0.97} />
            <stop offset="1" stopColor="#06182b" stopOpacity={0.97} />
          </linearGradient>
          <filter id={id + "sh"} x="-25%" y="-80%" width="150%" height="270%">
            <feDropShadow dx={0} dy={12} stdDeviation={14} floodColor="#020c18" floodOpacity={dark ? 0.45 : 0.18} />
          </filter>
        </defs>

        {video ? <rect width={1080} height={1920} fill="#06182b" opacity={0.62} /> : <rect width={1080} height={1920} fill={`url(#${id}bg)`} />}
        <circle cx={bx} cy={by} r={560} fill={`url(#${id}glow)`} />
        {!video && (
          <g transform={`translate(540 700) rotate(${f * 0.1})`} opacity={dark ? 0.1 : 0.06}>
            {Array.from({length: 34}).map((_, i) => {
              const a = (i / 34) * Math.PI * 2;
              return <circle key={i} cx={Math.cos(a) * 470} cy={Math.sin(a) * 470} r={8 + ((i * 7) % 5) * 6} fill={dark ? "#fff" : P.primary} />;
            })}
          </g>
        )}
        {kind && <Broll kind={kind} dark={dark} accent={P.accent} primary={P.primary} />}

        <g transform={`translate(540 800) scale(${push}) translate(-540 -800)`}>
          {blocks.map((b, i) => {
            const h = heightOf(b);
            const top = y;
            y += h + GAP;
            const delay = b.at !== undefined ? cf(b.at) : 8 + i * 12;
            return (
              <g key={i} transform={`translate(0 ${top})`}>
                {b.kind === "text" && <TextBlock b={b} delay={delay} />}
                {b.kind === "counter" && <CounterBlock b={b} delay={delay} />}
                {b.kind === "cards" && <CardsBlock b={b} delay={delay} shadow={id + "sh"} />}
                {b.kind === "steps" && <StepsBlock b={b} delay={delay} />}
                {b.kind === "list" && <ListBlock b={b} delay={delay} shadow={id + "sh"} />}
                {b.kind === "badge" && <BadgeBlock b={b} delay={delay} shadow={id + "sh"} />}
                {b.kind === "link" && <LinkBlock b={b} delay={delay} shadow={id + "sh"} />}
              </g>
            );
          })}

          {s.cta && (
            <g>
              <g opacity={prog(f, 6, 22)} transform={`translate(0 ${(1 - prog(f, 6, 22)) * 30})`}>
                {theme.logoLight ? (
                  <image href={staticFile(theme.logoLight)} x={140} y={480} width={800} height={218} preserveAspectRatio="xMidYMid meet" />
                ) : (
                  <text x={540} y={620} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={96} fill={P.primary}>{bt.name}</text>
                )}
                <text x={540} y={760} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={34} fill={P.deep}>{bt.tagline}</text>
              </g>
              {s.ctaChips && <CtaPath chips={s.ctaChips} y={850} />}
              <g opacity={prog(f, 44, 58)} transform={`translate(540 1010) scale(${1 + Math.sin(f * 0.2) * 0.025})`}>
                <rect x={-190} y={-52} width={380} height={104} rx={52} fill={P.primary} filter={`url(#${id}sh)`} />
                <text x={0} y={19} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} letterSpacing={3} fill="#fff">{bt.ctaButton.toUpperCase()}</text>
              </g>
              <g opacity={prog(f, 62, 76)}>
                <text x={540} y={1150} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={TEXT}>{bt.ctaQuestion}</text>
              </g>
            </g>
          )}
        </g>

        {/* scrim for the subtitles and the logo */}
        <rect y={dark ? 1250 : 1330} width={1080} height={dark ? 670 : 590} fill={`url(#${id}scrim)`} />

        {/* chapter tab */}
        {s.tab && (
          <g opacity={prog(f, 2, 14)} transform={`translate(0 ${(1 - prog(f, 2, 14)) * -24})`}>
            <rect x={70} y={136} width={96 + label.length * 20 + 50} height={72} rx={36} fill="#fff" filter={`url(#${id}sh)`} />
            <circle cx={106} cy={172} r={26} fill={P.primary} />
            <text x={106} y={181} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#fff">{num}</text>
            <text x={148} y={181} fontFamily={SANS} fontWeight={800} fontSize={28} letterSpacing={3} fill={P.primary}>{label.toUpperCase()}</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
