export const STORAGE_KEY = "squidSpinState";
export const TOKEN_TOP_UP = 5;
export const MISSION_SPINS_PER_REWARD = 10;
export const MISSION_REWARD_TOKENS = 5;
export const MISSION_MAX_DAILY_TOKENS = 20;
export const MISSION_MAX_REWARDS =
  MISSION_MAX_DAILY_TOKENS / MISSION_REWARD_TOKENS;
export const MISSION_MAX_DAILY_SPINS =
  MISSION_MAX_REWARDS * MISSION_SPINS_PER_REWARD;
export const POINTER_ANGLE = 0;
export const SEGMENT_ANGLE = 45;
export const SPIN_DURATION_MS = 4200;
export const DEFAULT_ARENA_ID = 1;

/** Rarity palette: gray (low) → blue → purple → gold (jackpot), two shades per band. */
const RARITY_BANDS = [
  { rarity: "low", sectorColor: "#6b7589" },
  { rarity: "low", sectorColor: "#4f5869" },
  { rarity: "uncommon", sectorColor: "#3b82d6" },
  { rarity: "uncommon", sectorColor: "#2563b5" },
  { rarity: "rare", sectorColor: "#8b4fd9" },
  { rarity: "rare", sectorColor: "#6c35ad" },
  { rarity: "jackpot", sectorColor: "#b8890a" },
  { rarity: "jackpot", sectorColor: "#e8c84a" },
];

const SEGMENT_TEMPLATE = [
  { icon: "circle", weight: 23, ...RARITY_BANDS[0] },
  { icon: "square", weight: 19, ...RARITY_BANDS[1] },
  { icon: "circle", weight: 17, ...RARITY_BANDS[2] },
  { icon: "circle", weight: 14, ...RARITY_BANDS[3] },
  { icon: "triangle", weight: 12, ...RARITY_BANDS[4] },
  { icon: "square", weight: 9, ...RARITY_BANDS[5] },
  { icon: "triangle", weight: 4, ...RARITY_BANDS[6] },
  { icon: "triangle", weight: 2, ...RARITY_BANDS[7] },
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

export function getArenaTopPrizeValues(arenaId, count = 2) {
  const prizes = getArenaById(arenaId).segments.map((s) => s.myr);
  return [...prizes].sort((a, b) => b - a).slice(0, count);
}

export function getWinnerListPrizeValues() {
  const values = new Set();
  for (const arena of ARENAS) {
    for (const myr of getArenaTopPrizeValues(arena.id)) {
      values.add(myr);
    }
  }
  return values;
}

export function isWinnerListPrize(myr) {
  return getWinnerListPrizeValues().has(myr);
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

function getWheelConic(segments) {
  return buildConicFromColors(segments.map((s) => s.sectorColor));
}

export function getSectorBackgroundLayers(theme = "squid", segments) {
  const hub = "#2a2438";
  const conic = getWheelConic(segments);
  return [
    `radial-gradient(circle at 50% 50%, #3d3548 0%, ${hub} 26%, rgba(42, 36, 56, 0) 28%)`,
    "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.28) 0%, rgba(42, 36, 56, 0) 50%)",
    "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.06) 55%, rgba(0, 0, 0, 0.2) 100%)",
    conic,
  ].join(", ");
}
