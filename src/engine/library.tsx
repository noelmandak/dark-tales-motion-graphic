import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {ShotEnv, useBrandText, useCue} from "./env";
import {FolioView} from "./manuscript";
import {BoardView} from "./casefile";
import {PosterView} from "./poster";
import {
  C, Chip, DottedRoute, Facade, Globe, Ground, IdCard, LocationTag, MapArt, Moon, Paper, Person, Pin, QMark, SANS, SERIF, Stage, Stamp, Tree,
  clamp, prog, routeAt, useSpring,
} from "./kit";
import type {
  ChipSpec, ColorName, Cue, GlobeShot, Hat, IdCardShot, MapShot, MarkSpec, ObjectShot, PaperShot, PersonSpec, SceneShot, Shot, SketchShot, StampSpec,
} from "./types";


export {ShotEnv};

const color = (n?: ColorName, fallback: string = C.cream): string => (n ? ((C as Record<string, string>)[n] ?? n) : fallback);

/* ============================== small parts ============================== */
const Cat: React.FC<{y: number; dur: number}> = ({y, dur}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, dur], [-120, 1200], clamp);
  const bob = Math.sin(f * 0.6) * 3;
  return (
    <g transform={`translate(${x} ${y + bob})`} fill={C.ink} stroke={C.rim} strokeOpacity={0.35} strokeWidth={2}>
      <ellipse rx={54} ry={24} />
      <circle cx={58} cy={-14} r={20} />
      <polygon points="46,-30 50,-54 62,-34" />
      <polygon points="64,-34 76,-54 80,-26" />
      <path d={`M-52 -4 Q-100 ${-44 + Math.sin(f * 0.3) * 10} -84 -84`} fill="none" strokeWidth={10} stroke={C.ink} strokeLinecap="round" />
      {[-30, -6, 22, 42].map((lx, i) => (
        <rect key={lx} x={lx} y={12} width={8} height={24 + (Math.sin(f * 0.6 + i * 1.6) > 0 ? 5 : 0)} rx={3} stroke="none" />
      ))}
    </g>
  );
};

const Bulb: React.FC<{x: number; y: number; delay: number}> = ({x, y, delay}) => {
  const f = useCurrentFrame();
  const s = useSpring(delay, 9, 200);
  const glow = 0.6 + Math.sin(f * 0.4) * 0.25;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={interpolate(s, [0, 0.3], [0, 1], clamp)}>
      <circle r={110} fill={C.gold} opacity={glow * 0.18} />
      <circle r={44} fill={C.gold} />
      <rect x={-20} y={40} width={40} height={32} rx={6} fill="#6b5a2a" />
      {Array.from({length: 8}).map((_, i) => (
        <line key={i} x1={0} y1={-66} x2={0} y2={-92} stroke={C.gold} strokeWidth={6} strokeLinecap="round" transform={`rotate(${i * 45})`} opacity={glow} />
      ))}
    </g>
  );
};

const Gauge: React.FC<{label: string; at: Cue; to?: Cue}> = ({label, at, to}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const a = cf(at);
  const b = to !== undefined ? cf(to) : a + 30;
  const bar = prog(f, a + 12, b);
  return (
    <>
      <Chip x={540} y={420} text={label} dot={C.red} delay={a} size={40} />
      <g opacity={prog(f, a + 6, a + 18)}>
        <rect x={290} y={490} width={500} height={26} rx={13} fill="#0b1636" stroke={C.cream} strokeOpacity={0.4} strokeWidth={2.5} />
        <rect x={294} y={494} width={492 * bar} height={18} rx={9} fill={C.red} />
        <text x={540} y={560} textAnchor="middle" fill={C.cream} fontFamily={SANS} fontWeight={800} fontSize={30}>{Math.round(bar * 100)}%</text>
      </g>
    </>
  );
};

const Chips: React.FC<{chips?: ChipSpec[]}> = ({chips}) => {
  const cf = useCue();
  return (
    <>
      {chips?.map((c, i) => (
        <Chip
          key={i}
          x={c.x ?? 540}
          y={c.y ?? 520 + i * 100}
          text={c.text}
          delay={cf(c.at)}
          size={c.size ?? 38}
          color={color(c.color)}
          dot={c.dot === true ? C.red : c.dot ? color(c.dot) : undefined}
        />
      ))}
    </>
  );
};

const Stamps: React.FC<{stamps?: StampSpec[]; defaultY?: number}> = ({stamps, defaultY = 560}) => {
  const cf = useCue();
  return (
    <>
      {stamps?.map((s, i) => (
        <Stamp key={i} x={s.x ?? 540} y={s.y ?? defaultY} text={s.text} delay={cf(s.at)} rot={s.rot ?? -8} size={s.size ?? 64} color={color(s.color, C.red)} />
      ))}
    </>
  );
};

const Marks: React.FC<{marks?: MarkSpec[]}> = ({marks}) => {
  const cf = useCue();
  return (
    <>
      {marks?.map((m, i) => {
        if (m.kind === "q" || m.kind === "!") return <QMark key={i} x={m.x} y={m.y} delay={cf(m.at)} text={m.kind === "q" ? "?" : "!"} color={color(m.color)} />;
        if (m.kind === "bulb") return <Bulb key={i} x={m.x} y={m.y} delay={cf(m.at)} />;
        if (m.kind === "pin") return <Pin key={i} x={m.x} y={m.y} delay={cf(m.at)} label={m.label} pulse={m.pulse} />;
        if (m.kind === "gauge") return <Gauge key={i} label={m.label} at={m.at} to={m.to} />;
        if (m.kind === "cat") return <Cat key={i} y={m.y} dur={m.dur ?? 36} />;
        return null;
      })}
    </>
  );
};

const People: React.FC<{people?: PersonSpec[]; defaultY: number}> = ({people, defaultY}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  return (
    <>
      {people?.map((p, i) => {
        const en = p.enter;
        const d0 = en?.delay ?? 0;
        const t = en ? prog(f, d0, d0 + (en.dur ?? 36)) : 1;
        const x = p.x - (en ? en.dx * (1 - t) : 0);
        const opacity = en ? prog(f, d0, d0 + 10) : 1;
        const belly = p.bellyRamp ? prog(f, cf(p.bellyRamp[0]), cf(p.bellyRamp[1])) : p.belly ?? 0;
        const person = (
          <Person
            key={i}
            x={x}
            y={p.y ?? defaultY}
            s={p.s ?? 1}
            hat={p.hat ?? "none"}
            accent={p.accent ? color(p.accent) : undefined}
            arm={p.arm ?? "down"}
            belly={belly}
            flip={p.flip}
            walk={en?.walk && t < 1 ? 1 : 0}
            opacity={opacity}
          />
        );
        const yy = p.y ?? defaultY;
        return p.tilt ? (
          <g key={i} transform={`rotate(${p.tilt} ${x} ${yy})`}>
            {person}
          </g>
        ) : (
          person
        );
      })}
    </>
  );
};

const Tiers: React.FC<{rows: number; hat?: Hat; accent?: string; dim?: number; baseY?: number}> = ({rows, hat = "none", accent, dim = 1, baseY = 1180}) => (
  <g opacity={dim}>
    {Array.from({length: rows}).map((_, r) => (
      <g key={r}>
        <path d={`M40 ${baseY + r * 130 + 20} Q540 ${baseY + r * 130 - 30} 1040 ${baseY + r * 130 + 20}`} fill="none" stroke="#5a3a30" strokeWidth={14} strokeLinecap="round" />
        {Array.from({length: 5 + r}).map((__, i, arr) => {
          const t = (i + 0.5) / arr.length;
          const x = 90 + t * 900;
          const y = baseY + r * 130 + 10 - Math.sin(t * Math.PI) * 30;
          return <Person key={i} x={x} y={y} s={0.3 + r * 0.05} hat={hat} accent={accent} />;
        })}
      </g>
    ))}
  </g>
);

const River: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <Moon x={820} y={360} />
      <rect x={0} y={1170} width={1080} height={750} fill={C.navy3} opacity={0.35} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${-270 + ((i * 7) % 3) * 90} ${1190 + i * 38} q135 -22 270 0 t270 0 t270 0 t270 0 t270 0 t270 0 t270 0`} transform={`translate(${-((f * (1 + i * 0.3)) % 270)} 0)`} fill="none" stroke={C.rim} strokeOpacity={0.3 + i * 0.05} strokeWidth={5} />
      ))}
    </g>
  );
};

const Plate: React.FC<{x: number; y: number; k: number; vis: number}> = ({x, y, k, vis}) => (
  <g transform={`translate(${x} ${y}) scale(${k * (0.6 + 0.4 * vis)})`} opacity={vis}>
    <ellipse rx={38} ry={13} fill="#d9d4e8" opacity={0.9} />
    <ellipse cy={-5} rx={24} ry={9} fill={C.goldSoft} />
  </g>
);

const Table: React.FC<{vis: (i: number) => number}> = ({vis}) => (
  <g>
    <polygon points="120,1010 960,1010 1040,1240 40,1240" fill="#2a1a24" stroke={C.rim} strokeOpacity={0.2} strokeWidth={3} />
    {Array.from({length: 15}).map((_, i) => {
      const r = Math.floor(i / 5);
      const col = i % 5;
      return <Plate key={i} x={540 + (col - 2) * (150 + r * 30)} y={1050 + r * 62} k={0.78 + r * 0.14} vis={vis(i)} />;
    })}
  </g>
);

/* ============================== shots ============================== */
const GROUND_Y: Record<string, number> = {barracks: 1290, hospital: 1300, basilica: 1300, field: 1210, room: 1320, ground: 1320, court: 1320};
const PERSON_Y: Record<string, number> = {barracks: 1330, hospital: 1350, basilica: 1350, field: 1340, room: 1330, ground: 1320, table: 1030, tiers: 1320, court: 1300, river: 1320, none: 1320};

const SceneView: React.FC<{s: SceneShot}> = ({s}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const b = s.backdrop ?? "ground";
  const tint = s.tint ?? (b === "field" ? "red" : "blue");
  const stepVis = (i: number) => {
    let v = 1;
    if (s.platesIn) {
      const a = cf(s.platesIn[0]);
      const step = Math.max(1, (cf(s.platesIn[1]) - a - 8) / 14);
      v *= prog(f, a + i * step, a + i * step + 8);
    }
    if (s.platesOut) {
      const o = cf(s.platesOut[0]);
      const step = Math.max(1, (cf(s.platesOut[1]) - o - 8) / 14);
      v *= 1 - prog(f, o + i * step, o + i * step + 8);
    }
    return v;
  };
  return (
    <Stage tint={tint} push={s.push ?? [1, 1.08]} origin={s.origin ?? [540, 1000]} stars={b !== "field"}>
      {(b === "barracks" || s.moon) && <Moon x={860} y={360} />}
      {b === "barracks" && (
        <>
          <Tree x={120} base={1290} s={1.2} />
          <Facade cx={560} base={1290} w={700} emblem="none" />
        </>
      )}
      {(b === "hospital" || b === "basilica") && (
        <>
          <Moon x={860} y={330} />
          <Facade cx={640} base={1300} w={640} emblem="cross" />
        </>
      )}
      {b === "field" && (
        <>
          <Moon x={860} y={340} />
          {[200, 540, 900].map((x) => (
            <polygon key={x} points={`${x - 110},1210 ${x},1060 ${x + 110},1210`} fill="#07030a" />
          ))}
        </>
      )}
      {b === "room" && (
        <>
          <rect x={0} y={260} width={1080} height={1060} fill="#12285a" opacity={0.55} />
          <polygon points="640,300 940,300 1020,1340 380,1340" fill="#9fb7e6" opacity={0.07 + Math.sin(f * 0.1) * 0.01} />
          <rect x={640} y={320} width={300} height={420} fill="#0a1530" stroke={C.rim} strokeOpacity={0.5} strokeWidth={6} />
          <line x1={790} y1={320} x2={790} y2={740} stroke={C.rim} strokeOpacity={0.5} strokeWidth={4} />
        </>
      )}
      {b === "court" && (
        <>
          <Tiers rows={s.rows ?? 2} hat="mitre" dim={0.85} baseY={s.baseY ?? 860} />
          <rect x={440} y={1030} width={200} height={270} rx={14} fill="#2a1a24" stroke={C.gold} strokeOpacity={0.5} strokeWidth={4} />
          <rect x={420} y={1290} width={240} height={36} rx={8} fill="#3a2430" stroke={C.gold} strokeOpacity={0.5} strokeWidth={3} />
        </>
      )}
      {b === "river" && <River />}
      {GROUND_Y[b] !== undefined && <Ground y={GROUND_Y[b]} tint={s.groundTint ?? (b === "field" ? "#2a0c18" : b === "room" ? "#1a1428" : undefined)} />}
      {b === "room" && (
        <>
          <rect x={90} y={1230} width={440} height={30} rx={8} fill="#2b3566" />
          <rect x={90} y={1130} width={26} height={160} fill="#2b3566" />
        </>
      )}
      {b === "tiers" && <Tiers rows={s.rows ?? 3} hat={s.hat} accent={s.accent ? color(s.accent) : undefined} dim={s.dim} baseY={s.baseY ?? 1060} />}
      <People people={s.people} defaultY={PERSON_Y[b]} />
      {b === "table" && <Table vis={stepVis} />}
      <Marks marks={s.marks} />
      <Chips chips={s.chips} />
      <Stamps stamps={s.stamps} />
    </Stage>
  );
};

const GlobeView: React.FC<{s: GlobeShot}> = ({s}) => {
  const f = useCurrentFrame();
  const mk = prog(f, 22, 36);
  return (
    <Stage push={[1, 1.12]} origin={[600, 740]}>
      <Globe cx={540} cy={820} r={330} rot={f * 1.4} />
      <DottedRoute d="M70 1230 Q300 760 600 735" progress={prog(f, 6, 34)} />
      {mk > 0 && (
        <g transform="translate(600 735)">
          {[0, 1].map((k) => {
            const p = ((f + k * 20) % 40) / 40;
            return <circle key={k} r={12 + p * 60} fill="none" stroke={C.gold} strokeWidth={4} opacity={(1 - p) * mk} />;
          })}
          <circle r={12 * mk} fill={C.gold} />
        </g>
      )}
      <LocationTag text={s.label} delay={8} y={150} />
    </Stage>
  );
};

const IdCardView: React.FC<{s: IdCardShot}> = ({s}) =>
  s.zoom ? (
    <Stage push={[1.3, 1.85]} origin={[540, 640]}>
      <IdCard x={540} y={380} name={s.name} sub={s.sub} delay={-30} hat={s.hat} wide={s.wide} />
    </Stage>
  ) : (
    <Stage push={[1, 1.06]} origin={[540, 620]}>
      {s.label && <LocationTag text={s.label} delay={4} y={150} />}
      <IdCard x={540} y={380} name={s.name} sub={s.sub} delay={2} hat={s.hat} wide={s.wide} />
    </Stage>
  );

const MapView: React.FC<{s: MapShot}> = ({s}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const stopMode = s.stopAt !== undefined;
  const p = stopMode ? (s.stopAt as number) : s.draw ? prog(f, cf(s.draw[0]), cf(s.draw[1]), (t) => t * t * (3 - 2 * t)) : 1;
  const [px, py] = routeAt(s.stopAt ?? 0.66);
  const xa = s.x !== undefined ? cf(s.x) : 8;
  const d = prog(f, xa, xa + 12);
  return (
    <Stage push={[1, stopMode ? 1.08 : 1.09]} origin={stopMode ? [px, py] : [560, 960]}>
      {s.location && <LocationTag text={s.location.text} delay={cf(s.location.at)} y={380} />}
      <MapArt progress={p} stop={stopMode} labels={s.labels} />
      {stopMode && (
        <g stroke={C.red} strokeWidth={14} strokeLinecap="round" style={{filter: `drop-shadow(0 0 12px ${C.red})`}}>
          <line x1={px - 34} y1={py - 34} x2={px - 34 + 68 * d} y2={py - 34 + 68 * d} />
          <line x1={px + 34} y1={py - 34} x2={px + 34 - 68 * d} y2={py - 34 + 68 * d} />
        </g>
      )}
      {s.pin && <Pin x={800} y={700} delay={cf(s.pin.at)} label={s.pin.label} pulse />}
      <Chips chips={s.chips} />
    </Stage>
  );
};

const PaperView: React.FC<{s: PaperShot}> = ({s}) => {
  const n = s.lines ?? 7;
  return (
    <Stage tint="warm" push={[1, 1.07]} origin={[540, 900]}>
      <polygon points="440,0 640,0 1000,1500 80,1500" fill={C.moon} opacity={0.04} />
      <Paper x={540} y={820} w={620} h={760} rot={-3}>
        {Array.from({length: n}).map((_, i) => (
          <line key={i} x1={-230} x2={i === n - 1 ? 40 : 230} y1={-250 + i * 62} y2={-250 + i * 62} stroke="#7a6a50" strokeWidth={6} />
        ))}
      </Paper>
      <Stamps stamps={s.stamp ? [s.stamp] : []} defaultY={860} />
      <Chips chips={s.chips} />
    </Stage>
  );
};

const SketchView: React.FC<{s: SketchShot}> = ({s}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const ink = {fill: "none", stroke: "#3a2a1a", strokeWidth: 7, strokeLinecap: "round", pathLength: 1, strokeDasharray: 1} as const;
  return (
    <Stage tint="warm" push={[1, 1.1]} origin={[540, 900]}>
      <Paper x={540} y={820} w={760} h={1060} rot={-1.5}>
        <text x={0} y={-440} textAnchor="middle" fill="#3a2a1a" fontFamily={SERIF} fontStyle="italic" fontSize={54}>{s.title}</text>
        {s.ghosts?.map((g, i) => (
          <path key={i} d={g.d} fill="none" stroke="#3a2a1a" strokeOpacity={0.4} strokeWidth={4} strokeDasharray="12 12" opacity={f >= cf(g.at) ? 1 : 0} />
        ))}
        {s.strokes.map((st, i) => (
          <path key={i} d={st.d} {...ink} strokeDashoffset={1 - prog(f, cf(st.from), cf(st.to))} />
        ))}
        {s.labels?.map((l, i) => {
          const o = prog(f, cf(l.at), cf(l.at) + 15);
          return (
            <g key={i} opacity={o}>
              {l.underline && <line x1={l.underline[0]} y1={l.y + 18} x2={l.underline[1]} y2={l.y + 18} stroke="#6b1d1d" strokeWidth={4} />}
              <text x={l.x} y={l.y} fill="#6b1d1d" fontFamily={SERIF} fontStyle="italic" fontSize={36}>{l.text}</text>
            </g>
          );
        })}
      </Paper>
      <Chips chips={s.chips} />
    </Stage>
  );
};

const ObjectView: React.FC<{s: ObjectShot}> = ({s}) => {
  const f = useCurrentFrame();
  const cf = useCue();
  const cue = (k: string, fallback: number) => (s.cues?.[k] !== undefined ? cf(s.cues[k]) : fallback);
  const slideA = cue("letterIn", 20);
  const lidA = cue("lid", slideA + 28);
  const sealA = cue("seal", lidA + 14);
  const slide = prog(f, slideA, slideA + 24);
  const lid = prog(f, lidA, lidA + 12);
  const seal = useSpring(sealA, 9, 220);
  const forkS = useSpring(cue("in", 8), 9, 120);
  const glow = 0.5 + Math.sin(f * 0.2) * 0.2;
  const sp = interpolate(f % 40, [0, 8, 40], [1, 0, 0], clamp);
  if (s.kind === "fork") {
    return (
      <Stage tint="blue" push={[1, 1.1]} origin={[540, 880]}>
        <polygon points="460,0 620,0 900,1500 180,1500" fill={C.gold} opacity={0.05} />
        <circle cx={540} cy={860} r={300} fill={C.gold} opacity={glow * 0.12} />
        <g transform={`translate(540 860) rotate(${-18 + Math.sin(f * 0.05) * 4}) scale(${forkS * 2.1})`} style={{filter: `drop-shadow(0 0 22px ${C.gold})`}}>
          {[-48, -16, 16, 48].map((tx) => (
            <rect key={tx} x={tx - 7} y={-200} width={14} height={110} rx={7} fill={C.gold} />
          ))}
          <path d="M-62 -100 Q-62 -40 -16 -26 L-16 20 L16 20 L16 -26 Q62 -40 62 -100 Z" fill={C.gold} />
          <rect x={-14} y={0} width={28} height={230} rx={14} fill={C.gold} />
        </g>
        <g transform="translate(660 600)" opacity={sp}>
          <path d="M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6 Z" fill="#fff" />
        </g>
        <Chips chips={s.chips} />
      </Stage>
    );
  }
  return (
    <Stage push={[1, 1.1]} origin={[540, 900]}>
      <polygon points="440,0 640,0 960,1500 120,1500" fill={C.moon} opacity={0.05} />
      <g transform={`translate(0 ${interpolate(slide, [0, 1], [-180, 150])})`} opacity={prog(f, slideA - 9, slideA)}>
        <Paper x={540} y={760} w={300} h={220}>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={-110} x2={110} y1={-60 + i * 36} y2={-60 + i * 36} stroke="#7a6a50" strokeWidth={5} />
          ))}
        </Paper>
      </g>
      <rect x={380} y={880} width={320} height={220} rx={14} fill="#6b4423" stroke="#2a180c" strokeWidth={8} />
      <g transform={`rotate(${interpolate(lid, [0, 1], [-42, 0])} 380 880)`}>
        <rect x={370} y={840} width={340} height={46} rx={10} fill="#8a5a30" stroke="#2a180c" strokeWidth={8} />
      </g>
      <g transform={`translate(540 880) scale(${seal})`}>
        <circle r={34} fill={C.red} stroke="#5a0f18" strokeWidth={5} />
        <circle r={16} fill="none" stroke="#5a0f18" strokeWidth={3} />
      </g>
      <Chips chips={s.chips?.map((c, i) => ({...c, y: c.y ?? 330 + i * 100}))} />
    </Stage>
  );
};

const CtaView: React.FC = () => {
  const f = useCurrentFrame();
  const bt = useBrandText();
  const s = useSpring(10, 13, 130);
  const pulse = 1 + Math.sin(f * 0.25) * 0.04;
  return (
    <Stage push={[1, 1.04]} origin={[540, 900]}>
      <Tiers rows={3} dim={0.55} baseY={1040} />
      <g transform={`translate(540 640) scale(${s})`} opacity={interpolate(s, [0, 0.3], [0, 1], clamp)}>
        <Paper x={0} y={0} w={740} h={420}>
          <text x={0} y={-60} textAnchor="middle" fill="#2a1f14" fontFamily={SERIF} fontWeight={700} fontSize={84}>{bt.name}</text>
          <text x={0} y={10} textAnchor="middle" fill="#5a4a30" fontFamily={SANS} fontSize={30}>{bt.tagline}</text>
          <g transform={`translate(0 110) scale(${pulse})`}>
            <rect x={-130} y={-34} width={260} height={68} rx={34} fill={C.red} />
            <text x={0} y={14} textAnchor="middle" fill="#fff" fontFamily={SANS} fontWeight={800} fontSize={38}>{bt.ctaButton}</text>
          </g>
        </Paper>
      </g>
      <Chip x={540} y={1020} text={bt.ctaQuestion} delay={40} size={34} />
    </Stage>
  );
};

export const ShotView: React.FC<{shot: Shot}> = ({shot}) => {
  switch (shot.type) {
    case "scene": return <SceneView s={shot} />;
    case "globe": return <GlobeView s={shot} />;
    case "idcard": return <IdCardView s={shot} />;
    case "map": return <MapView s={shot} />;
    case "paper": return <PaperView s={shot} />;
    case "sketch": return <SketchView s={shot} />;
    case "object": return <ObjectView s={shot} />;
    case "cta": return <CtaView />;
    case "folio": return <FolioView s={shot} />;
    case "board": return <BoardView s={shot} />;
    case "poster": return <PosterView s={shot} />;
  }
};
