import "./styles.css";
import {
  Board,
  Direction,
  addItem,
  emptyBoard,
  moveItem,
  moveToPosition,
  removeItem,
  sanitizeBoard,
} from "./model";
import { decodeBoard, encodeBoard } from "./url";
import { renderBoard } from "./render";
import { attachChipDrag } from "./drag";

const SOFT_LIMIT = 4000;
const HARD_LIMIT = 10000;
const FALLBACK_KEY = "tiershare-fallback";

// ---------- state ----------

let state: Board = loadInitial();
let loadedFromFallback = false;
let urlStale = false;

function loadInitial(): Board {
  const payload = location.hash.replace(/^#/, "");
  if (payload) {
    const board = decodeBoard(payload);
    if (board) return board;
  }
  try {
    const saved = localStorage.getItem(FALLBACK_KEY);
    if (saved) {
      const board = sanitizeBoard(JSON.parse(saved));
      if (board && board.items.length > 0) {
        loadedFromFallback = true;
        return board;
      }
    }
  } catch {
    // ignore
  }
  return emptyBoard();
}

// ---------- DOM refs ----------

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const titleInput = $("title") as HTMLInputElement;
const addForm = $("add-form") as HTMLFormElement;
const addInput = $("add-input") as HTMLInputElement;
const boardEl = $("board");
const urlStatus = $("url-status");
const toastEl = $("toast");
const copyBtn = $("copy");
const shareBtn = $("share");

// ---------- rendering ----------

function update() {
  renderBoard(boardEl, state, {
    onRemove: (id) => {
      removeItem(state, id);
      update();
    },
  });
  scheduleUrlSync();
}

// ---------- URL sync ----------

let urlTimer: number | undefined;

function scheduleUrlSync() {
  if (urlTimer !== undefined) clearTimeout(urlTimer);
  urlTimer = window.setTimeout(syncUrl, 250);
}

function syncUrl() {
  const enc = encodeBoard(state);
  if (enc.length <= HARD_LIMIT) {
    if (urlStale) {
      urlStale = false;
      try { localStorage.removeItem(FALLBACK_KEY); } catch { /* ignore */ }
    }
    const hash = "#" + enc;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  } else if (!urlStale) {
    urlStale = true;
    try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }
  updateUrlStatus(enc.length);
}

function updateUrlStatus(len: number) {
  const kb = (len / 1024).toFixed(1) + " KB";
  if (urlStale) {
    urlStatus.textContent = `⚠ Link too long (${kb}) — board saved in this browser only`;
    urlStatus.className = "error";
  } else if (len > SOFT_LIMIT) {
    urlStatus.textContent = `Link: ${kb} (long — may be truncated when shared in some apps)`;
    urlStatus.className = "warn";
  } else {
    urlStatus.textContent = `Link: ${kb}`;
    urlStatus.className = "";
  }
}

// If the user pastes/edits a hash manually, reload from it.
window.addEventListener("hashchange", () => {
  const board = decodeBoard(location.hash.replace(/^#/, ""));
  if (board) {
    state = board;
    urlStale = false;
    titleInput.value = state.title;
    update();
  }
});

// ---------- input: title ----------

titleInput.addEventListener("input", () => {
  state.title = titleInput.value;
  scheduleUrlSync();
});

// ---------- input: add item ----------

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[\w-]+(\.[\w-]+)+\.[a-z]{2,}(?:\/[^\s]*)?)/i;

function parseAddInput(raw: string): { text: string; link?: string } {
  const m = raw.trim().match(URL_RE);
  if (!m) return { text: raw.trim() };
  const link = m[0].replace(/[).,;!?]+$/, "");
  const text = raw.replace(m[0], "").trim();
  return { text: text || link, link };
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const { text, link } = parseAddInput(addInput.value);
  if (!text) return;
  addItem(state, text, link);
  addInput.value = "";
  addInput.focus();
  update();
});

// ---------- drag & drop (mouse + touch) ----------

attachChipDrag(boardEl, {
  onDrop: (id, target) => {
    moveToPosition(state, id, target.tier, target.beforeId);
    update();
  },
});

// Keyboard access: focus a chip, then arrows move it, Delete removes it.
const KEY_DIRS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

boardEl.addEventListener("keydown", (e) => {
  const chip = (e.target as HTMLElement).closest(".chip") as HTMLElement | null;
  if (!chip) return;
  const id = chip.dataset.id ?? "";
  const dir = KEY_DIRS[e.key];
  if (dir) {
    e.preventDefault();
    moveItem(state, id, dir);
    update();
    boardEl.querySelector<HTMLElement>(`.chip[data-id="${id}"]`)?.focus();
  } else if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    removeItem(state, id);
    update();
  }
});

// ---------- copy / share ----------

let toastTimer: number | undefined;
function toast(msg: string) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.add("hidden"), 2200);
}

async function copyLink() {
  if (urlStale) {
    toast("Link is too long — board is saved in this browser only");
    return;
  }
  try {
    await navigator.clipboard.writeText(location.href);
    toast("Link copied!");
  } catch {
    window.prompt("Copy this URL:", location.href);
  }
}

copyBtn.addEventListener("click", copyLink);

shareBtn.addEventListener("click", async () => {
  if (urlStale) {
    toast("Link is too long — board is saved in this browser only");
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: state.title || "Tier list", url: location.href });
    } catch {
      // user cancelled
    }
  } else {
    void copyLink();
  }
});

// ---------- init ----------

titleInput.value = state.title;
update();
if (loadedFromFallback) toast("Loaded board from this browser (last link was too long)");
