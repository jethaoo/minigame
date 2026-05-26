import {
  MISSION_SPINS_PER_REWARD,
  MISSION_REWARD_TOKENS,
  MISSION_MAX_DAILY_TOKENS,
  MISSION_MAX_REWARDS,
  MISSION_MAX_DAILY_SPINS,
} from "./config.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function ensureDailyMission(state) {
  const today = todayKey();
  if (state.dailyMissionDate !== today) {
    state.dailyMissionDate = today;
    state.dailySpinCount = 0;
    state.dailyMissionRewardsClaimed = 0;
  }
  return state;
}

export function recordMissionSpin(state) {
  ensureDailyMission(state);
  state.dailySpinCount = (state.dailySpinCount || 0) + 1;

  const earned = Math.min(
    Math.floor(state.dailySpinCount / MISSION_SPINS_PER_REWARD),
    MISSION_MAX_REWARDS
  );
  const claimed = state.dailyMissionRewardsClaimed || 0;
  const newRewards = earned - claimed;

  let tokensGranted = 0;
  if (newRewards > 0) {
    tokensGranted = newRewards * MISSION_REWARD_TOKENS;
    state.tokens += tokensGranted;
    state.dailyMissionRewardsClaimed = earned;
  }

  return { tokensGranted };
}

function milestonePercent(targetSpins) {
  return (targetSpins / MISSION_MAX_DAILY_SPINS) * 100;
}

function fillPercentForSpins(spins, complete) {
  if (complete) return 100;
  return Math.min(100, (spins / MISSION_MAX_DAILY_SPINS) * 100);
}

export function getMissionProgress(state) {
  ensureDailyMission(state);
  const spins = state.dailySpinCount || 0;
  const claimed = state.dailyMissionRewardsClaimed || 0;
  const tokensEarned = claimed * MISSION_REWARD_TOKENS;
  const complete = claimed >= MISSION_MAX_REWARDS;

  const nextMilestone = complete
    ? MISSION_MAX_DAILY_SPINS
    : Math.min((claimed + 1) * MISSION_SPINS_PER_REWARD, MISSION_MAX_DAILY_SPINS);

  const progressLabel = complete
    ? `${tokensEarned}/${MISSION_MAX_DAILY_TOKENS} tokens`
    : `${Math.min(spins, nextMilestone)}/${nextMilestone} spins`;

  return {
    spins,
    nextMilestone,
    progressLabel,
    tokensEarned,
    maxTokens: MISSION_MAX_DAILY_TOKENS,
    complete,
    fillPercent: fillPercentForSpins(spins, complete),
    milestones: [10, 20, 30, 40].map((target, i) => ({
      target,
      positionPercent: milestonePercent(target),
      reached: spins >= target,
      claimed: i < claimed,
    })),
  };
}
