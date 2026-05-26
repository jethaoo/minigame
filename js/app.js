import {
  TOKEN_TOP_UP,
  ARENAS,
  DEFAULT_ARENA_ID,
  getArenaById,
  getArenaTopPrizeMYR,
  isWinnerListPrize,
  getSectorBackgroundLayers,
} from "./config.js";
import { loadState, saveState } from "./storage.js";
import { Wheel } from "./wheel.js";
import { getSegmentIconHtml } from "./icons.js";
import {
  ensureDailyMission,
  recordMissionSpin,
  getMissionProgress,
} from "./mission.js";

const $ = (sel) => document.querySelector(sel);

let state = ensureDailyMission(loadState());
saveState(state);
let currentWheelTheme = null;
let currentWheelArenaId = null;

const MOCK_WINNERS = [
  { user: "********841", myr: 288 },
  { user: "********482", myr: 128 },
  { user: "********103", myr: 888 },
  { user: "********556", myr: 384 },
  { user: "********229", myr: 2688 },
  { user: "********971", myr: 1200 },
];

const els = {
  bgLayer: $("#bgLayer"),
  bgLayerImg: $("#bgLayerImg"),
  arenaPromo: $("#arenaPromo"),
  maxPrizeDisplay: $("#maxPrizeDisplay"),
  promoMarqueeTrack: $("#promoMarqueeTrack"),
  arenaPickerSegments: $("#arenaPickerSegments"),
  arenaZoneName: $("#arenaZoneName"),
  arenaTicketLeft: $("#arenaTicketLeft"),
  spinCostDisplay: $("#spinCostDisplay"),
  mascotImg: $("#mascotImg"),
  wheelStage: $("#wheelStage"),
  wheelFrameImg: $("#wheelFrameImg"),
  tokens: $("#tokenCount"),
  wallet: $("#walletAmount"),
  spinBtn: $("#spinBtn"),
  skipCheck: $("#skipAnimation"),
  addTokens: $("#addTokens"),
  winnerList: $("#winnerList"),
  winnerListViewport: $("#winnerListViewport"),
  missionProgress: $("#missionProgress"),
  missionTrackFill: $("#missionTrackFill"),
  missionMilestones: $("#missionMilestones"),
  winModal: $("#winModal"),
  winAmount: $("#winAmount"),
  winSubtitle: $("#winSubtitle"),
  collectBtn: $("#collectBtn"),
  toast: $("#toast"),
  liveRegion: $("#liveRegion"),
};

const wheel = new Wheel($("#wheelRotor"));

function getCurrentArena() {
  return getArenaById(state.currentArenaId ?? DEFAULT_ARENA_ID);
}

function formatMYR(n) {
  return `MYR ${n.toLocaleString("en-MY", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function maskUsername(seed) {
  const digits = String(Math.abs(seed) % 1000).padStart(3, "0");
  return `********${digits}`;
}

function getArenaJackpotMYR() {
  return getArenaTopPrizeMYR(state.currentArenaId ?? DEFAULT_ARENA_ID);
}

function getPromoMarqueeText() {
  return `Jackpot ${formatMYR(getArenaJackpotMYR())}`;
}

function updatePromoMarquee() {
  if (!els.promoMarqueeTrack) return;

  const arena = getCurrentArena();
  const marqueeText = getPromoMarqueeText();
  const amount = getArenaJackpotMYR();
  const item = `<span class="arena-card__promo-item">Jackpot <strong>${formatMYR(amount)}</strong></span>`;
  els.promoMarqueeTrack.innerHTML = item.repeat(4);
  els.promoMarqueeTrack.style.setProperty("--promo-marquee-loop", "25%");

  const staticText = `Spin Now and Win Up To ${formatMYR(arena.maxDisplayPrize)}`;
  if (els.arenaPromo) {
    els.arenaPromo.setAttribute("aria-label", `${staticText}. ${marqueeText}.`);
  }
}

function isLightSegmentColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.52;
}

function buildSectors(theme, segments) {
  const sectorsEl = $("#wheelSectors");
  const container = $("#wheelSegments");
  sectorsEl.style.backgroundColor = "#252038";
  sectorsEl.style.backgroundImage = getSectorBackgroundLayers(theme, segments);
  container.innerHTML = "";

  segments.forEach((seg, i) => {
    const el = document.createElement("div");
    el.className = "wheel-segment";
    el.style.setProperty("--i", i);
    el.dataset.index = seg.id;

    const contentClass = isLightSegmentColor(seg.sectorColor)
      ? "segment-content segment-content--dark"
      : "segment-content";

    el.innerHTML = `
      <div class="${contentClass}">
        <span class="segment-icon">${getSegmentIconHtml(seg.icon)}</span>
        <span class="segment-value">${seg.label}</span>
      </div>`;

    container.appendChild(el);
  });
}

function applyWheelForArena(arena) {
  els.wheelFrameImg.src = arena.wheelFrame;
  const theme = arena.wheelTheme;
  const needsRebuild =
    currentWheelTheme !== theme || currentWheelArenaId !== arena.id;

  if (needsRebuild) {
    currentWheelTheme = theme;
    currentWheelArenaId = arena.id;
    els.wheelStage.classList.remove("wheel-stage--squid", "wheel-stage--casino");
    els.wheelStage.classList.add(`wheel-stage--${theme}`);
    buildSectors(theme, arena.segments);
  }
}

function applyArenaGame(arena) {
  if (els.bgLayerImg) {
    els.bgLayerImg.src = arena.background;
  }
  els.mascotImg.src = arena.mascot;
  els.mascotImg.alt = `${arena.zoneName} mascot`;
  document.body.classList.remove("arena-1", "arena-2", "arena-3");
  document.body.classList.add(`arena-${arena.id}`);
  applyWheelForArena(arena);
}

function updateArenaPickerUI(activeId) {
  els.arenaPickerSegments.querySelectorAll(".arena-segment").forEach((seg) => {
    const id = Number(seg.dataset.arenaId);
    const isActive = id === activeId;
    seg.classList.toggle("is-active", isActive);
    seg.classList.toggle("is-inactive", !isActive);
    const btn = seg.querySelector(".arena-segment__enter");
    if (btn) {
      btn.hidden = isActive;
      btn.setAttribute("aria-hidden", isActive ? "true" : "false");
    }
  });

  els.arenaZoneName.textContent = getArenaById(activeId).zoneName;
}

function selectArena(id) {
  if (wheel.spinning) {
    showToast("Wait for the wheel to stop.");
    return;
  }

  const arena = getArenaById(id);
  state.currentArenaId = id;
  saveState(state);
  updateArenaPickerUI(id);
  applyArenaGame(arena);
  render();
}

function buildArenaPicker() {
  els.arenaPickerSegments.innerHTML = "";

  ARENAS.forEach((arena, index) => {
    const seg = document.createElement("div");
    seg.className = "arena-segment";
    seg.dataset.arenaId = arena.id;
    if (index < ARENAS.length - 1) seg.classList.add("arena-segment--has-divider");

    seg.innerHTML = `
      <div class="arena-segment__bg" style="background-image: url('${arena.background}')"></div>
      <button type="button" class="arena-segment__enter">Pick Arena</button>
    `;

    seg.querySelector(".arena-segment__enter").addEventListener("click", (e) => {
      e.stopPropagation();
      selectArena(arena.id);
    });

    els.arenaPickerSegments.appendChild(seg);
  });
}

function buildWinnerRows() {
  const qualifyingWins = state.recentWins.filter((w) => isWinnerListPrize(w.myr));
  const fromState = qualifyingWins.map((w, i) => ({
    user: maskUsername(w.at ?? i),
    myr: w.myr,
    isYou: i === 0,
  }));

  const rows = [...fromState];
  for (const mock of MOCK_WINNERS) {
    if (rows.length >= 8) break;
    const duplicate = rows.some((r) => r.user === mock.user && r.myr === mock.myr);
    if (!duplicate) rows.push({ ...mock, isYou: false });
  }

  return rows.slice(0, 8);
}

function renderMission() {
  const progress = getMissionProgress(state);

  if (els.missionProgress) {
    els.missionProgress.textContent = progress.progressLabel;
  }

  if (els.missionTrackFill) {
    els.missionTrackFill.style.width = `${progress.fillPercent}%`;
  }

  if (els.missionMilestones) {
    els.missionMilestones
      .querySelectorAll(".mission-milestone")
      .forEach((el, i) => {
        const milestone = progress.milestones[i];
        if (!milestone) return;
        el.style.left = `${milestone.positionPercent}%`;
        el.classList.toggle("is-complete", milestone.claimed);
        el.setAttribute(
          "aria-label",
          milestone.claimed
            ? `${milestone.target} spins — reward claimed`
            : `${milestone.target} spins`
        );
      });
  }
}

const WINNER_SCROLL_SPEED_PX = 28;

function buildWinnerListHtml(rows) {
  return rows
    .map(
      (r) => `
      <li class="winner-list__item${r.isYou ? " winner-list__item--you" : ""}">
        <span class="winner-list__user">${r.user}</span>
        <span class="winner-list__amount">${formatMYR(r.myr)}</span>
      </li>`
    )
    .join("");
}

function renderWinnerList() {
  const rows = buildWinnerRows();
  const list = els.winnerList;
  const viewport = els.winnerListViewport;
  if (!list || !viewport) return;

  const itemsHtml = buildWinnerListHtml(rows);
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  list.innerHTML = itemsHtml;
  list.classList.remove("is-auto-scroll");
  list.style.removeProperty("--winner-scroll-duration");

  requestAnimationFrame(() => {
    const overflows = list.scrollHeight > viewport.clientHeight + 1;
    if (!overflows || reducedMotion) return;

    list.innerHTML = itemsHtml + itemsHtml;
    const halfHeight = list.scrollHeight / 2;
    const duration = Math.max(8, halfHeight / WINNER_SCROLL_SPEED_PX);
    list.style.setProperty("--winner-scroll-duration", `${duration}s`);
    list.classList.add("is-auto-scroll");
  });
}

function render() {
  const arena = getCurrentArena();
  els.tokens.textContent = state.tokens;
  els.wallet.textContent = formatMYR(state.walletMYR);
  els.arenaTicketLeft.textContent = state.tokens;
  els.skipCheck.checked = state.skipAnimation;
  els.maxPrizeDisplay.textContent = formatMYR(arena.maxDisplayPrize);
  if (els.spinCostDisplay) {
    els.spinCostDisplay.textContent = String(arena.spinCost);
  }
  updatePromoMarquee();
  renderMission();
  renderWinnerList();
}

function showToast(msg) {
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  els.toast.setAttribute("aria-hidden", "false");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.toast.classList.remove("show");
    els.toast.setAttribute("aria-hidden", "true");
    els.toast.textContent = "";
  }, 2800);
}

function openWinModal(segment) {
  const { myr, label } = segment;
  const topPrize = getArenaTopPrizeMYR(state.currentArenaId ?? DEFAULT_ARENA_ID);
  const bigWinThreshold = topPrize / 2;

  els.winAmount.textContent = formatMYR(myr);
  els.winAmount.classList.toggle("is-big", myr >= bigWinThreshold);
  els.winAmount.classList.toggle("is-zero", myr === 0);

  if (myr === 0) {
    els.winSubtitle.textContent = "Better luck next spin!";
  } else if (myr >= topPrize) {
    els.winSubtitle.textContent = "Top prize unlocked!";
  } else {
    els.winSubtitle.textContent = "Added to your total winnings.";
  }

  els.winModal.hidden = false;
  els.collectBtn.focus();
  if (els.liveRegion) {
    els.liveRegion.textContent =
      myr === 0 ? "No win this spin." : `You won ${label}.`;
  }
}

function closeWinModal() {
  els.winModal.hidden = true;
  els.spinBtn.focus();
}

function applyWin(segment) {
  const topPrize = getArenaTopPrizeMYR(state.currentArenaId ?? DEFAULT_ARENA_ID);

  state.walletMYR += segment.myr;
  state.lastWin = { label: segment.label, myr: segment.myr, at: Date.now() };
  if (segment.myr >= topPrize) state.wonTopPrize = true;

  state.recentWins.unshift({
    label: segment.label,
    myr: segment.myr,
    at: Date.now(),
    arenaId: state.currentArenaId ?? DEFAULT_ARENA_ID,
  });
  state.recentWins = state.recentWins.slice(0, 5);
  saveState(state);
  render();
  openWinModal(segment);
}

async function handleSpin() {
  if (wheel.spinning) return;

  const arena = getCurrentArena();
  const spinCost = arena.spinCost;

  if (state.tokens < spinCost) {
    const tokenWord = spinCost === 1 ? "token" : "tokens";
    showToast(`You need ${spinCost} ${tokenWord} to spin.`);
    return;
  }

  state.tokens -= spinCost;
  saveState(state);
  render();

  els.spinBtn.disabled = true;
  els.spinBtn.setAttribute("aria-busy", "true");

  try {
    const segment = await wheel.spin({
      segments: arena.segments,
      skipAnimation: state.skipAnimation,
    });
    const { tokensGranted } = recordMissionSpin(state);
    applyWin(segment);
    if (tokensGranted > 0) {
      const rewardWord = tokensGranted === 1 ? "token" : "tokens";
      showToast(`Daily Mission: +${tokensGranted} ${rewardWord}!`);
    }
  } catch {
    showToast("Please wait for the wheel to stop.");
  } finally {
    els.spinBtn.disabled = false;
    els.spinBtn.setAttribute("aria-busy", "false");
  }
}

els.spinBtn.addEventListener("click", handleSpin);
els.spinBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleSpin();
  }
});

els.skipCheck.addEventListener("change", () => {
  state.skipAnimation = els.skipCheck.checked;
  saveState(state);
});

els.addTokens.addEventListener("click", () => {
  state.tokens += TOKEN_TOP_UP;
  saveState(state);
  render();
  showToast(`+${TOKEN_TOP_UP} tokens added!`);
});

els.collectBtn.addEventListener("click", closeWinModal);

els.winModal.addEventListener("click", (e) => {
  if (e.target === els.winModal) closeWinModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.winModal.hidden) closeWinModal();
});

buildArenaPicker();
selectArena(state.currentArenaId ?? DEFAULT_ARENA_ID);
