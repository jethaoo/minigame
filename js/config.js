export const STORAGE_KEY = "squidSpinState";
export const TOKEN_TOP_UP = 5;
export const POINTER_ANGLE = 0;
export const SEGMENT_ANGLE = 45;
export const SPIN_DURATION_MS = 4200;
export const DEFAULT_ARENA_ID = 1;

const SEGMENT_TEMPLATE = [
  { icon: "circle", sectorColor: "#24151b", weight: 23 },
  { icon: "square", sectorColor: "#005f5b", weight: 19 },
  { icon: "circle", sectorColor: "#7a1024", weight: 17 },
  { icon: "circle", sectorColor: "#b11226", weight: 14 },
  { icon: "triangle", sectorColor: "#151923", weight: 12 },
  { icon: "square", sectorColor: "#0b6f3a", weight: 9 },
  { icon: "triangle", sectorColor: "#d4a017", weight: 4 },
  { icon: "triangle", sectorColor: "#f0c85a", weight: 2 },
];

const ARENA_PRIZES = {
  1: [0, 3, 8, 18, 28, 68, 128, 288],
  2: [0, 9, 24, 54, 84, 204, 384, 888],
  3: [0, 28, 75, 168, 260, 630, 1200, 2688],
};

function formatSegmentLabel(myr) {
  return `MYR ${myr.toLocaleString("en-MY")}`;
}

function buildArenaSegments(prizes) {
  return prizes.map((myr, id) => ({
    id,
    myr,
    label: formatSegmentLabel(myr),
    ...SEGMENT_TEMPLATE[id],
  }));
}

export const CASINO_COLORS = [
  "#b11226",
  "#d4a017",
  "#0b6f3a",
  "#151923",
  "#7a1024",
  "#005f5b",
  "#24151b",
  "#f0c85a",
];

export const ARENAS = [
  {
    id: 1,
    zoneName: "Red Light, Green Light",
    background: "assets/background-arena0.png",
    mascot: "assets/mascot-guard0.png",
    wheelFrame: "assets/wheel-frame.png",
    wheelTheme: "squid",
    spinCost: 1,
    maxDisplayPrize: 288,
    segments: buildArenaSegments(ARENA_PRIZES[1]),
  },
  {
    id: 2,
    zoneName: "Mingle",
    background: "assets/background-arena1.png",
    mascot: "assets/mascot-guard1.png",
    wheelFrame: "assets/wheel-frame1.png",
    wheelTheme: "casino",
    spinCost: 2,
    maxDisplayPrize: 888,
    segments: buildArenaSegments(ARENA_PRIZES[2]),
  },
  {
    id: 3,
    zoneName: "Jump Rope",
    background: "assets/background-arena2.png",
    mascot: "assets/mascot-guard2.png",
    wheelFrame: "assets/wheel-frame.png",
    wheelTheme: "squid",
    spinCost: 5,
    maxDisplayPrize: 2688,
    segments: buildArenaSegments(ARENA_PRIZES[3]),
  },
];

export function getArenaById(id) {
  return ARENAS.find((a) => a.id === id) ?? ARENAS[0];
}

export function getArenaSegments(arenaId) {
  return getArenaById(arenaId).segments;
}

export function getArenaTopPrizeMYR(arenaId) {
  return getArenaById(arenaId).maxDisplayPrize;
}

export function pickSegmentIndex(segments) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const segment of segments) {
    roll -= segment.weight;
    if (roll <= 0) return segment.id;
  }
  return segments[segments.length - 1].id;
}

export function getSegmentById(id, segments) {
  return segments.find((s) => s.id === id) ?? segments[0];
}

function shadeHex(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function buildConicFromColors(colors) {
  const stops = [];
  colors.forEach((color, i) => {
    const start = i * SEGMENT_ANGLE;
    const mid = start + SEGMENT_ANGLE / 2;
    const end = (i + 1) * SEGMENT_ANGLE;
    const light = shadeHex(color, 55);
    const dark = shadeHex(color, -18);
    stops.push(
      `${dark} ${start}deg`,
      `${light} ${start + 6}deg`,
      `${color} ${mid}deg`,
      `${light} ${end - 6}deg`,
      `${dark} ${end}deg`
    );
  });
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

function getSquidConic(segments) {
  return buildConicFromColors(segments.map((s) => s.sectorColor));
}

function getCasinoConic() {
  return buildConicFromColors(CASINO_COLORS);
}

export function getSectorBackgroundLayers(theme = "squid", segments) {
  const hub = "#2a2438";
  const conic = theme === "casino" ? getCasinoConic() : getSquidConic(segments);
  return [
    `radial-gradient(circle at 50% 50%, #3d3548 0%, ${hub} 26%, rgba(42, 36, 56, 0) 28%)`,
    "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.28) 0%, rgba(42, 36, 56, 0) 50%)",
    "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.06) 55%, rgba(0, 0, 0, 0.2) 100%)",
    conic,
  ].join(", ");
}
