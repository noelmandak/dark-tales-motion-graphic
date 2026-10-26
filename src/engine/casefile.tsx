/**
 * "Casefile" look: an investigator's cork evidence board. Polaroids and index cards get pinned up,
 * typewriter text types itself, red string connects clues, ink stamps slam down, and every cut is a
 * camera flash. Same brand family (navy/gold/red, faceless, subtitle style), different visual language.
 */
import React, {useId} from "react";
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from "remotion";
import {clamp, prog, useSpring} from "./kit";
import {useBrandText, useCue, useTheme} from "./env";
import type {BoardItem, BoardShot, StampSpec} from "./types";

const TYPE = "'Courier New', Courier, monospace";
const HAND = "'Segoe Script', 'Bradley Hand', cursive";
const K = {
  cork: "#a67c52",
  cork2: "#8d6740",
  paper: "#f4ecd6",
  paper2: "#e6dab9",
  ink: "#2a2118",
  red: "#c0262f",
  string: "#d12c36",
  navy: "#17305f",
  gold: "#e8b04b",
  grey: "#8a8578",
  blue: "#2d5ea8",
};

/* ------------------------------ geometry helpers ------------------------------ */
const sizeOf = (it: BoardItem): [number, number] => {
  const s = it.s ?? 1;
  if (it.kind === "photo") return [400 * s, 470 * s];
  if (it.kind === "card") return [560 * s, (130 + (it.lines?.length ?? 1) * 54) * s];
  if (it.kind === "clipping") return [520 * s, 560 * s];
  return [360 * s, 220 * s];
};
const pinPoint = (it: BoardItem): [number, number] => {
  const [, h] = sizeOf(it);
  // cards carry their title across the top, so their pin sits to the right of it
  const dx = it.kind === "card" ? 190 * (it.s ?? 1) : 0;
  return [(it.x ?? 540) + dx, (it.y ?? 700) - h / 2 + 16];
};

/* ------------------------------ small parts ------------------------------ */
const Pin: React.FC<{x: number; y: number; color?: string}> = ({x, y, color = K.red}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={5} cy={9} rx={14} ry={7} fill="#000" opacity={0.3} />
    <circle r={14} fill={color} stroke="#5a1015" strokeWidth={2.5} />
    <circle cx={-4} cy={-4} r={4.5} fill="#fff" opacity={0.6} />
  </g>
);

/** Typewriter: reveals characters from frame `start`, ~1.7 frames per character. */
const useTyped = (text: string, start: number) => {
  const f = useCurrentFrame();
  return text.slice(0, Math.max(0, Math.floor((f - start) / 1.7)));
};

const Typed: React.FC<{text: string; start: number; x: number; y: number; size?: number; weight?: number; fill?: string; anchor?: "start" | "middle"; family?: string}> = ({
  text, start, x, y, size = 34, weight = 700, fill = K.ink, anchor = "start", family = TYPE,
}) => {
  const shown = useTyped(text, start);
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={family} fontWeight={weight} fontSize={size} fill={fill} xmlSpace="preserve">
      {shown}
    </text>
  );
};

const Shadow: React.FC<{id: string}> = ({id}) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx={6} dy={14} stdDeviation={9} floodColor="#000" floodOpacity={0.45} />
  </filter>
);

/* ------------------------------ pictograms inside polaroids (360x360, centre 0,0) ------------------------------ */
const Picto: React.FC<{subject: string}> = ({subject}) => {
  const f = useCurrentFrame();
  switch (subject) {
    case "beach":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={170} fill="#e9b27a" />
          <circle cx={90} cy={-70} r={34} fill="#fff2c9" />
          <rect x={-180} y={-10} width={360} height={60} fill="#3f6f9e" />
          <path d="M-180 8 q30 -14 60 0 t60 0 t60 0 t60 0 t60 0 t60 0" stroke="#bcd7ee" strokeWidth={4} fill="none" opacity={0.8} />
          <rect x={-180} y={50} width={360} height={130} fill="#d9bc86" />
          <rect x={-180} y={30} width={360} height={36} fill="#6b6459" />
          <rect x={-180} y={22} width={360} height={14} fill="#8a8478" />
          <g fill="#1f1a14">
            <rect x={-96} y={86} width={150} height={26} rx={12} />
            <circle cx={-110} cy={99} r={17} />
          </g>
        </g>
      );
    case "clothes":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#cfc6b0" />
          <path d="M-120 170 L-110 -60 L-60 -140 L-20 -150 L0 -110 L20 -150 L60 -140 L110 -60 L120 170 Z" fill="#7a6f5e" stroke={K.ink} strokeWidth={5} />
          <path d="M-20 -150 L0 -40 L20 -150 L40 -120 L10 -10 L0 40 L-10 -10 L-40 -120 Z" fill="#efe6cf" stroke={K.ink} strokeWidth={4} />
          <path d="M-8 -60 L8 -60 L14 110 L0 130 L-14 110 Z" fill={K.red} stroke={K.ink} strokeWidth={4} />
          <path d="M-12 -10 L12 0 M-13 30 L13 40 M-14 70 L14 80" stroke="#fff" strokeWidth={6} />
          <rect x={-34} y={-140} width={68} height={18} fill="none" stroke={K.red} strokeWidth={3} strokeDasharray="7 6" />
          <text x={0} y={-150} textAnchor="middle" fontFamily={TYPE} fontWeight={800} fontSize={20} fill={K.red} opacity={0}>x</text>
        </g>
      );
    case "unknown":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#c9c2b0" />
          <path d="M-130 180 Q-120 40 -50 10 L50 10 Q120 40 130 180 Z" fill="#2d2820" />
          <circle cy={-50} r={74} fill="#2d2820" />
          <text x={0} y={-22} textAnchor="middle" fontFamily={TYPE} fontWeight={900} fontSize={110} fill="#efe6cf">?</text>
        </g>
      );
    case "pocket":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#6e5a43" />
          {Array.from({length: 12}).map((_, i) => (
            <line key={i} x1={-180} x2={180} y1={-170 + i * 32} y2={-170 + i * 32} stroke="#5a4833" strokeWidth={3} />
          ))}
          <path d="M-130 -110 L130 -110 L130 80 Q0 150 -130 80 Z" fill="#7d6849" stroke="#2a2118" strokeWidth={5} />
          <path d="M-130 -110 L130 -110" stroke="#2a2118" strokeWidth={9} />
          <path d="M-60 -40 L60 -40 L60 50 L-60 50 Z" fill="#5f4d37" stroke="#2a2118" strokeWidth={4} strokeDasharray="10 6" />
          <g transform={`translate(0 ${-10 - prog(f, 18, 40) * 40}) rotate(${-6})`} opacity={prog(f, 14, 24)}>
            <path d="M-34 -22 L30 -26 L36 -10 L28 6 L34 22 L-30 26 L-38 8 L-30 -6 Z" fill="#f4ecd6" stroke="#2a2118" strokeWidth={3} />
          </g>
        </g>
      );
    case "book":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#cfc6b0" />
          <rect x={-110} y={-150} width={220} height={300} rx={8} fill="#2f5a3f" stroke={K.ink} strokeWidth={6} />
          <rect x={-92} y={-132} width={184} height={264} fill="none" stroke={K.gold} strokeWidth={4} />
          <circle cy={-40} r={46} fill="none" stroke={K.gold} strokeWidth={4} />
          <path d="M0 -76 L10 -46 L40 -40 L10 -34 L0 -4 L-10 -34 L-40 -40 L-10 -46 Z" fill={K.gold} />
          <text x={0} y={70} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={26} fill={K.gold}>RUBÁIYÁT</text>
          <path d="M60 140 L110 120 L110 150 Z" fill="#cfc6b0" />
        </g>
      );
    case "code":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#cfc6b0" />
          <rect x={-120} y={-150} width={240} height={300} rx={6} fill="#2f5a3f" stroke={K.ink} strokeWidth={6} />
          <rect x={-100} y={-128} width={200} height={256} fill="#efe6cf" />
          {[0, 1, 2, 3, 4].map((i) => {
            const y = -90 + i * 44;
            const d = `M-80 ${y} ` + Array.from({length: 8}).map((_, k) => `l${22} ${k % 2 ? -9 : 9}`).join(" ");
            return <path key={i} d={d} fill="none" stroke="#4a4338" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={prog(f, 10 + i * 6, 22 + i * 6)} />;
          })}
          <line x1={-86} y1={-44} x2={86} y2={-44} stroke={K.red} strokeWidth={5} opacity={0.9} />
        </g>
      );
    case "dna":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#1c2e52" />
          {Array.from({length: 14}).map((_, i) => {
            const y = -160 + i * 24;
            const a = f * 0.09 + i * 0.5;
            const x1 = Math.sin(a) * 70;
            const x2 = -x1;
            return (
              <g key={i}>
                <line x1={x1} y1={y} x2={x2} y2={y} stroke="#9fb7e6" strokeWidth={4} opacity={0.6} />
                <circle cx={x1} cy={y} r={9} fill={K.gold} opacity={0.5 + 0.5 * Math.cos(a)} />
                <circle cx={x2} cy={y} r={9} fill="#e9efff" opacity={0.5 - 0.5 * Math.cos(a)} />
              </g>
            );
          })}
        </g>
      );
    case "mask":
      return (
        <g>
          <rect x={-180} y={-180} width={360} height={360} fill="#cfc6b0" />
          <path d="M-90 -110 Q0 -190 90 -110 Q110 20 60 110 Q0 160 -60 110 Q-110 20 -90 -110 Z" fill="#efe9dc" stroke={K.ink} strokeWidth={5} />
          <path d="M-46 -20 q16 -12 32 0 M14 -20 q16 -12 32 0 M-14 20 q14 30 28 0" fill="none" stroke="#b8ad95" strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    default:
      return <rect x={-180} y={-180} width={360} height={360} fill="#cfc6b0" />;
  }
};

/* ------------------------------ board items ------------------------------ */
const Photo: React.FC<{it: BoardItem}> = ({it}) => {
  const f = useCurrentFrame();
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <clipPath id={id}><rect x={-180} y={-215} width={360} height={360} /></clipPath>
      </defs>
      <rect x={-200} y={-235} width={400} height={470} rx={6} fill="#faf6ea" stroke="#cfc6ab" strokeWidth={2} />
      <g transform="translate(0 -35)">
        <g clipPath={`url(#${id})`} transform="translate(0 -0)" opacity={0.25 + 0.75 * prog(f, 6, 30)}>
          <g transform="translate(0 35)">
            <Picto subject={it.subject ?? "unknown"} />
          </g>
        </g>
      </g>
      <rect x={-180} y={-215} width={360} height={360} fill="#fff" opacity={1 - prog(f, 6, 30)} />
      {it.caption && (
        <text x={0} y={202} textAnchor="middle" fontFamily={HAND} fontSize={34} fill="#3a3024">
          {it.caption}
        </text>
      )}
    </g>
  );
};

const Card: React.FC<{it: BoardItem; start: number}> = ({it, start}) => {
  const f = useCurrentFrame();
  const lines = it.lines ?? [];
  const h = 130 + lines.length * 54;
  let t = start + 8;
  return (
    <g>
      <rect x={-280} y={-h / 2} width={560} height={h} rx={6} fill={K.paper} stroke="#cdbf9b" strokeWidth={2} />
      <line x1={-280} x2={280} y1={-h / 2 + 62} y2={-h / 2 + 62} stroke={K.red} strokeWidth={3} opacity={0.7} />
      {lines.map((_, i) => (
        <line key={i} x1={-280} x2={280} y1={-h / 2 + 112 + i * 54} y2={-h / 2 + 112 + i * 54} stroke={K.blue} strokeOpacity={0.35} strokeWidth={2} />
      ))}
      {it.title && <Typed text={it.title} start={t} x={-250} y={-h / 2 + 48} size={36} fill={K.red} />}
      {(() => {
        t += (it.title?.length ?? 0) * 1.7;
        return null;
      })()}
      {lines.map((ln, i) => {
        const s = t;
        t += ln.length * 1.7 + 4;
        const redacted = it.redact?.includes(i);
        return (
          <g key={i}>
            <Typed text={ln} start={s} x={-250} y={-h / 2 + 104 + i * 54} size={32} />
            {redacted && (
              <rect x={-258} y={-h / 2 + 76 + i * 54} width={Math.max(120, ln.length * 19.5)} height={36} fill={K.ink} opacity={prog(f, s + ln.length * 1.7 + 4, s + ln.length * 1.7 + 12)} />
            )}
          </g>
        );
      })}
    </g>
  );
};

const Clipping: React.FC<{it: BoardItem; start: number}> = ({it, start}) => (
  <g>
    <path d="M-260 -270 L250 -280 L262 -120 L252 40 L264 200 L248 276 L-258 268 L-268 100 L-252 -60 Z" fill="#e9e1c9" stroke="#bfb392" strokeWidth={2} />
    <rect x={-236} y={-246} width={470} height={6} fill={K.ink} />
    <Typed text={it.headline ?? ""} start={start + 8} x={-236} y={-196} size={32} weight={900} family="Georgia, serif" />
    {Array.from({length: 11}).map((_, i) => (
      <line key={i} x1={-236} x2={i % 4 === 3 ? 20 : 236} y1={-130 + i * 34} y2={-130 + i * 34} stroke={K.ink} strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" />
    ))}
    <rect x={20} y={20} width={216} height={120} fill="#bdb391" opacity={0.7} />
  </g>
);

const Scrap: React.FC<{it: BoardItem; start: number}> = ({it, start}) => (
  <g>
    <path d="M-170 -80 L-120 -94 L-60 -84 L10 -96 L90 -82 L150 -94 L176 -60 L164 -6 L180 52 L140 80 L70 70 L0 86 L-70 72 L-140 84 L-176 40 L-160 -20 Z" fill="#f2e8cf" stroke="#a89b78" strokeWidth={3} />
    <Typed text={it.text ?? ""} start={start + 8} x={0} y={14} size={50} weight={700} anchor="middle" family="Georgia, serif" />
  </g>
);

const renderItem = (it: BoardItem, start: number) => {
  switch (it.kind) {
    case "photo": return <Photo it={it} />;
    case "card": return <Card it={it} start={start} />;
    case "clipping": return <Clipping it={it} start={start} />;
    case "scrap": return <Scrap it={it} start={start} />;
    default: return null;
  }
};

const ItemSlot: React.FC<{it: BoardItem; index: number; shadowId: string}> = ({it, index, shadowId}) => {
  const cf = useCue();
  const delay = it.at !== undefined ? cf(it.at) : 8 + index * 6;
  const s = useSpring(delay, 14, 150);
  const [px, py] = pinPoint(it);
  const f = useCurrentFrame();
  const sway = Math.sin(f * 0.05 + index) * 0.5;
  return (
    <g opacity={interpolate(s, [0, 0.25], [0, 1], clamp)}>
      <g transform={`translate(${it.x ?? 540} ${(it.y ?? 700) - (1 - s) * 60}) rotate(${(it.rot ?? 0) + sway}) scale(${(it.s ?? 1) * interpolate(s, [0, 1], [1.12, 1])})`} filter={`url(#${shadowId})`}>
        {renderItem(it, delay)}
      </g>
      <Pin x={px} y={py + (1 - s) * -60} />
    </g>
  );
};

const Stencil: React.FC<{spec: StampSpec; delay: number}> = ({spec, delay}) => {
  const s = useSpring(delay, 9, 230);
  const onBlue = !!useTheme().board; // themed boards are dark: give the stamp a paper backing so red/green still read
  const size = spec.size ?? 70;
  const w = spec.text.length * size * 0.66 + 70;
  const col = spec.color === "navy" ? K.navy : spec.color === "green" ? "#2f7a4a" : K.red;
  return (
    <g transform={`translate(${spec.x ?? 540} ${spec.y ?? 900}) rotate(${spec.rot ?? -9}) scale(${interpolate(s, [0, 1], [2.4, 1])})`} opacity={interpolate(s, [0, 0.3], [0, 0.93], clamp)}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.6} fill={onBlue ? "#ffffff" : "none"} fillOpacity={0.94} stroke={col} strokeWidth={9} />
      <text x={0} y={size * 0.3} textAnchor="middle" fill={col} fontFamily={TYPE} fontWeight={900} fontSize={size} letterSpacing={4}>
        {spec.text}
      </text>
    </g>
  );
};

/* ------------------------------ the board ------------------------------ */
export const BoardView: React.FC<{s: BoardShot}> = ({s}) => {
  const f = useCurrentFrame();
  const bt = useBrandText();
  const theme = useTheme();
  const board = theme.board;
  const cf = useCue();
  const id = useId().replace(/:/g, "");
  const items = s.items ?? [];
  const byId = new Map(items.map((it) => [it.id, it] as const));
  const push = interpolate(f, [0, 160], [1, 1.06], clamp);
  const flash = interpolate(f, [0, 9], [0.85, 0], clamp);
  const [ox, oy] = s.focus ?? [540, 900];

  return (
    <AbsoluteFill style={{background: board?.bg2 ?? K.cork2}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <Shadow id={id + "s"} />
          <filter id={id + "n"} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="8" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0.55 0" />
          </filter>
          <radialGradient id={id + "l"} cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor="#ffe9b8" stopOpacity={0.35} />
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill={board?.bg ?? K.cork} />
        {board ? (
          <>
            <pattern id={id + "d"} width={54} height={54} patternUnits="userSpaceOnUse">
              <circle cx={27} cy={27} r={3} fill={board.dots ?? "#ffffff"} opacity={0.16} />
            </pattern>
            <rect width={1080} height={1920} fill={`url(#${id}d)`} />
          </>
        ) : (
          <rect width={1080} height={1920} fill="#000" filter={`url(#${id}n)`} />
        )}

        <g transform={`translate(${ox} ${oy}) scale(${push}) translate(${-ox} ${-oy})`}>
          {/* strings sit under the items but over the cork */}
          {s.strings?.map((st, i) => {
            const a = byId.get(st.from);
            const b = byId.get(st.to);
            if (!a || !b) return null;
            const [x1, y1] = pinPoint(a);
            const [x2, y2] = pinPoint(b);
            const sag = 40 + Math.abs(x2 - x1) * 0.08;
            const d = `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`;
            const p = prog(f, cf(st.at), cf(st.at) + 26);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={6} transform="translate(5 9)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
                <path d={d} fill="none" stroke={K.string} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              </g>
            );
          })}
          {items.map((it, i) => (
            <ItemSlot key={i} it={it} index={i} shadowId={id + "s"} />
          ))}
          {s.stamps?.map((st, i) => (
            <Stencil key={i} spec={st} delay={cf(st.at)} />
          ))}
        </g>

        <rect width={1080} height={1920} fill={`url(#${id}l)`} />

        {/* manila folder tab (the "chapter") */}
        {s.tab && (
          <g opacity={prog(f, 3, 14)} transform={`translate(0 ${(1 - prog(f, 3, 14)) * -40})`}>
            <path d="M80 150 L110 92 L520 92 L552 150 Z" fill={board?.tab ?? "#e1c47c"} stroke={board ? "#0b2b4a" : "#7a5a1c"} strokeWidth={3} />
            <text x={316} y={132} textAnchor="middle" fontFamily={TYPE} fontWeight={800} fontSize={30} letterSpacing={3} fill={board?.tabText ?? "#4a3410"}>
              {s.tab}
            </text>
          </g>
        )}

        {s.cta && (
          <g>
            <g opacity={prog(f, 14, 28)}>
              <rect x={150} y={470} width={780} height={560} rx={10} fill={board?.card ?? "#e1c47c"} stroke={board ? "#0b2b4a" : "#7a5a1c"} strokeWidth={4} />
              <rect x={150} y={430} width={300} height={50} rx={6} fill={board?.card ?? "#e1c47c"} stroke={board ? "#0b2b4a" : "#7a5a1c"} strokeWidth={4} />
              {theme.logoLight ? (
                <image href={staticFile(theme.logoLight)} x={210} y={540} width={660} height={180} preserveAspectRatio="xMidYMid meet" />
              ) : (
                <text x={540} y={640} textAnchor="middle" fontFamily={TYPE} fontWeight={900} fontSize={92} fill="#4a3410">{bt.name.toUpperCase()}</text>
              )}
              <text x={540} y={board ? 790 : 700} textAnchor="middle" fontFamily={TYPE} fontSize={board ? 25 : 21} fill={board?.cardText ?? "#4a3410"}>{bt.tagline}</text>
            </g>
            <g opacity={prog(f, 34, 46)} transform={`translate(540 ${board ? 900 : 860}) scale(${1 + Math.sin(f * 0.25) * 0.04})`}>
              <rect x={-170} y={-46} width={340} height={92} rx={10} fill={board?.tabText ?? K.red} />
              <text x={0} y={20} textAnchor="middle" fontFamily={TYPE} fontWeight={900} fontSize={56} fill="#fff" letterSpacing={4}>{bt.ctaButton.toUpperCase()}</text>
            </g>
            <g opacity={prog(f, 54, 66)}>
              <text x={540} y={1000} textAnchor="middle" fontFamily={TYPE} fontWeight={700} fontSize={28} fill={board?.cardText ?? "#4a3410"}>{bt.ctaQuestion}</text>
            </g>
          </g>
        )}

        {/* camera flash on every cut */}
        <rect width={1080} height={1920} fill="#fff" opacity={flash} />
      </svg>
    </AbsoluteFill>
  );
};
