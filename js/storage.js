import { STORAGE_KEY, DEFAULT_ARENA_ID } from "./config.js";

const DEFAULT_STATE = {
  tokens: 12,
  walletMYR: 0,
  skipAnimation: false,
  wonTopPrize: false,
  lastWin: null,
  recentWins: [],
  currentArenaId: DEFAULT_ARENA_ID,
  dailyMissionDate: null,
  dailySpinCount: 0,
  dailyMissionRewardsClaimed: 0,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
