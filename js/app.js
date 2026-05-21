import {
  SPIN_COST,
  TOKEN_TOP_UP,
  SEGMENTS,
  ARENAS,
  DEFAULT_ARENA_ID,
  MAX_DISPLAY_PRIZE,
  TOP_PRIZE_MYR,
  CASINO_COLORS,
  getArenaById,
  getSectorBackgroundLayers,
} from "./config.js";
import { loadState, saveState } from "./storage.js";
import { Wheel } from "./wheel.js";
import { getSegmentIconHtml } from "./icons.js";

const $ = (sel) => document.querySelector(sel);

let state = loadState();
let currentWheelTheme = null;

const MOCK_WINNERS = [
  { user: "********971", myr: 18 },
  { user: "********482", myr: 128 },
  { user: "********103", myr: 68 },
  { user: "********556", myr: 28 },
  { user: "********229", myr: 8 },
  { user: "********841", myr: 288 },
];

const els = {
  bgLayer: $("#bgLayer"),
  arenaBadgePrize: $("#arenaBadgePrize"),
  maxPrizeDisplay: $("#maxPrizeDisplay"),
  arenaPickerSegments: $("#arenaPickerSegments"),
  arenaZoneName: $("#arenaZoneName"),
  arenaTicketLeft: $("#arenaTicketLeft"),
  mascotImg: $("#mascotImg"),
  wheelStage: $("#wheelStage"),
  wheelFrameImg: $("#wheelFrameImg"),
  tokens: $("#tokenCount"),
  wallet: $("#walletAmount"),
  spinBtn: $("#spinBtn"),
  skipCheck: $("#skipAnimation"),
  addTokens: $("#addTokens"),
  winnerList: $("#winnerList"),
  missionProgress: $("#missionProgress"),
  winModal: $("#winModal"),
  winAmount: $("#winAmount"),
  winSubtitle: $("#winSubtitle"),
  collectBtn: $("#collectBtn"),
  toast: $("#toast"),
  liveRegion: $("#liveRegion"),
};

const wheel = new Wheel($("#wheelRotor"));

function formatMYR(n) {
  return `MYR ${n.toLocaleString("en-MY", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function maskUsername(seed) {
  const digits = String(Math.abs(seed) % 1000).padStart(3, "0");
  return `********${digits}`;
}

function getArenaJackpotMYR() {
  return Math.max(...SEGMENTS.map((segment) => segment.myr));
}

function getJackpotMarkup(amount) {
  return `
    <span class="arena-card__jackpot-label">Jackpot</span>
    <span class="arena-card__jackpot-amount">
      <span class="arena-card__jackpot-currency">MYR</span>
      <strong>${amount.toLocaleString("en-MY")}</strong>
    </span>`;
}

function isLightSegmentColor(hex) {
  return ["#d4a017", "#f0c85a"].includes(hex.toLowerCase());
}

function buildSectors(theme) {
  const sectorsEl = $("#wheelSectors");
  const container = $("#wheelSegments");
  sectorsEl.style.backgroundColor = "#252038";
  sectorsEl.style.backgroundImage = getSectorBackgroundLayers(theme);
  container.innerHTML = "";

  SEGMENTS.forEach((seg, i) => {
    const el = document.createElement("div");
    el.className = "wheel-segment";
    el.style.setProperty("--i", i);
    el.dataset.index = seg.id;

    const color = theme === "casino" ? CASINO_COLORS[i] : seg.sectorColor;
    const contentClass = isLightSegmentColor(color)
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

function applyWheelTheme(theme, wheelFrame) {
  els.wheelFrameImg.src = wheelFrame;
  if (currentWheelTheme === theme) return;
  currentWheelTheme = theme;
  els.wheelStage.classList.remove("wheel-stage--squid", "wheel-stage--casino");
  els.wheelStage.classList.add(`wheel-stage--${theme}`);
  buildSectors(theme);
}

function applyArenaGame(arena) {
  els.bgLayer.style.backgroundImage = `url("${arena.background}")`;
  els.mascotImg.src = arena.mascot;
  els.mascotImg.alt = `${arena.zoneName} mascot`;
  document.body.classList.remove("arena-1", "arena-2", "arena-3");
  document.body.classList.add(`arena-${arena.id}`);
  applyWheelTheme(arena.wheelTheme, arena.wheelFrame);
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
  const fromState = state.recentWins.map((w, i) => ({
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

function renderWinnerList() {
  const rows = buildWinnerRows();
  els.winnerList.innerHTML = rows
    .map(
      (r) => `
      <li class="winner-list__item${r.isYou ? " winner-list__item--you" : ""}">
        <span class="winner-list__user">${r.user}</span>
        <span class="winner-list__amount">${formatMYR(r.myr)}</span>
      </li>`
    )
    .join("");
}

function render() {
  els.tokens.textContent = state.tokens;
  els.wallet.textContent = formatMYR(state.walletMYR);
  els.arenaTicketLeft.textContent = state.tokens;
  els.skipCheck.checked = state.skipAnimation;
  els.maxPrizeDisplay.textContent = formatMYR(MAX_DISPLAY_PRIZE);
  els.arenaBadgePrize.innerHTML = getJackpotMarkup(getArenaJackpotMYR());

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
  els.winAmount.textContent = formatMYR(myr);
  els.winAmount.classList.toggle("is-big", myr >= 128);
  els.winAmount.classList.toggle("is-zero", myr === 0);

  if (myr === 0) {
    els.winSubtitle.textContent = "Better luck next spin!";
  } else if (myr >= TOP_PRIZE_MYR) {
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
  state.walletMYR += segment.myr;
  state.lastWin = { label: segment.label, myr: segment.myr, at: Date.now() };
  if (segment.myr === TOP_PRIZE_MYR) state.wonTopPrize = true;

  state.recentWins.unshift({
    label: segment.label,
    myr: segment.myr,
    at: Date.now(),
  });
  state.recentWins = state.recentWins.slice(0, 5);
  saveState(state);
  render();
  openWinModal(segment);
}

async function handleSpin() {
  if (wheel.spinning) return;
  if (state.tokens < SPIN_COST) {
    showToast("You need 1 token to spin.");
    return;
  }

  state.tokens -= SPIN_COST;
  saveState(state);
  render();

  els.spinBtn.disabled = true;
  els.spinBtn.setAttribute("aria-busy", "true");

  try {
    const segment = await wheel.spin({ skipAnimation: state.skipAnimation });
    applyWin(segment);
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
