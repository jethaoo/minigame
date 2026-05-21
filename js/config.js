export const STORAGE_KEY = "squidSpinState";
export const SPIN_COST = 1;
export const TOKEN_TOP_UP = 5;
export const POINTER_ANGLE = 0;
export const SEGMENT_ANGLE = 45;
export const SPIN_DURATION_MS = 4200;
export const DEFAULT_ARENA_ID = 1;
export const MAX_DISPLAY_PRIZE = 2688;
export const TOP_PRIZE_MYR = 288;

export const ARENAS = [
  {
    id: 1,
    zoneName: "Red Light, Green Light",
    background: "assets/background-arena0.png",
    mascot: "assets/mascot-guard0.png",
    wheelFrame: "assets/wheel-frame.png",
    wheelTheme: "squid",
  },
  {
    id: 2,
    zoneName: "Mingle",
    background: "assets/background-arena1.png",
    mascot: "assets/mascot-guard1.png",
    wheelFrame: "assets/wheel-frame1.png",
    wheelTheme: "casino",
  },
  {
    id: 3,
    zoneName: "Jump Rope",
    background: "assets/background-arena2.png",
    mascot: "assets/mascot-guard2.png",
    wheelFrame: "assets/wheel-frame.png",
    wheelTheme: "squid",
  },
];

export const SEGMENTS = [
  { id: 0, label: "MYR 18", myr: 18, sectorColor: "#b11226", icon: "circle", weight: 14 },
  { id: 1, label: "MYR 128", myr: 128, sectorColor: "#d4a017", icon: "triangle", weight: 5 },
  { id: 2, label: "MYR 68", myr: 68, sectorColor: "#0b6f3a", icon: "square", weight: 10 },
  { id: 3, label: "MYR 28", myr: 28, sectorColor: "#151923", icon: "triangle", weight: 12 },
  { id: 4, label: "MYR 8", myr: 8, sectorColor: "#7a1024", icon: "circle", weight: 16 },
  { id: 5, label: "MYR 3", myr: 3, sectorColor: "#005f5b", icon: "square", weight: 18 },
  { id: 6, label: "MYR 0", myr: 0, sectorColor: "#24151b", icon: "circle", weight: 22 },
  { id: 7, label: "MYR 288", myr: 288, sectorColor: "#f0c85a", icon: "triangle", weight: 3 },
];

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

export function getArenaById(id) {
  return ARENAS.find((a) => a.id === id) ?? ARENAS[0];
}

export function pickSegmentIndex() {
  const total = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const segment of SEGMENTS) {
    roll -= segment.weight;
    if (roll <= 0) return segment.id;
  }
  return SEGMENTS[SEGMENTS.length - 1].id;
}

export function getSegmentById(id) {
  return SEGMENTS.find((s) => s.id === id) ?? SEGMENTS[0];
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

function getSquidConic() {
  return buildConicFromColors(SEGMENTS.map((s) => s.sectorColor));
}

function getCasinoConic() {
  return buildConicFromColors(CASINO_COLORS);
}

export function getSectorBackgroundLayers(theme = "squid") {
  const hub = "#2a2438";
  const conic = theme === "casino" ? getCasinoConic() : getSquidConic();
  return [
    `radial-gradient(circle at 50% 50%, #3d3548 0%, ${hub} 26%, rgba(42, 36, 56, 0) 28%)`,
    "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.28) 0%, rgba(42, 36, 56, 0) 50%)",
    "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.06) 55%, rgba(0, 0, 0, 0.2) 100%)",
    conic,
  ].join(", ");
}
