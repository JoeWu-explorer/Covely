// Pomodoro module: a quiet focus timer embedded under the clock.
//
// Cycle: focus → short break → … and every `longEvery` focuses → long break,
// auto-advancing through phases. Timing is timestamp-based (endAt), so it stays
// accurate when the tab is backgrounded and throttled. On each phase change it
// gives a threefold, gentle nudge: a synthesized chime, a soft card flash, and
// a system Notification. Settings + today's tally persist locally.

import { getAudioContext } from "../lib/audio.js";
import * as storage from "../lib/storage.js";
import { icon } from "../lib/icons.js";

const SETTINGS_KEY = "covely.pomodoro.settings";
const TODAY_KEY = "covely.pomodoro.today";
const SESSION_KEY = "covely.pomodoro.session";

/** @typedef {"focus" | "short" | "long"} Phase */

/** @type {Record<Phase, { label: string }>} */
const PHASE_META = {
  focus: { label: "专注" },
  short: { label: "短休" },
  long: { label: "长休" },
};

/** @typedef {{ focus: number, short: number, long: number, longEvery: number }} Settings */

/** @type {Settings} Minutes per phase + focuses between long breaks. */
const DEFAULT_SETTINGS = { focus: 25, short: 5, long: 15, longEvery: 4 };

const RING_C = 2 * Math.PI * 70; // circumference of the r=70 progress ring

const reduceMotion =
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Local YYYY-MM-DD, for resetting the daily tally at midnight. */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * A gentle two-note bell, synthesized so we ship no extra audio asset. Played
 * through the shared AudioContext (already resumed by the start gesture).
 */
function chime() {
  try {
    const ac = getAudioContext();
    const now = ac.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(g).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  } catch {}
}

/** @param {string} body */
function notify(body) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Covely", { body, silent: true });
    }
  } catch {}
}

/** @param {HTMLElement} parent — the clock section, so the timer sits under the quote */
export async function mountPomodoro(parent) {
  /** @type {Settings} */
  let settings = { ...DEFAULT_SETTINGS };
  let count = 0; // focuses completed today
  /** @type {Phase} */
  let phase = "focus";
  let focusDone = 0; // focuses in the current cycle, toward the next long break
  /** @type {"idle" | "running" | "paused"} */
  let status = "idle";
  let endAt = 0; // ms timestamp when running
  let remainingMs = 0; // when idle / paused
  let tickId = 0;

  const durMs = (/** @type {Phase} */ p) => settings[p] * 60_000;

  // ---------- DOM ----------

  const root = document.createElement("section");
  root.className = "pomodoro";
  root.setAttribute("aria-label", "番茄时钟");

  // Collapsed entry: shows live phase + time when a session is active.
  const pill = document.createElement("button");
  pill.className = "pomo-pill";
  pill.type = "button";
  const pillIcon = icon("timer", 16);
  const pillText = document.createElement("span");
  pill.append(pillIcon, pillText);

  // Expanded panel.
  const panel = document.createElement("div");
  panel.className = "pomo-panel";

  const chip = document.createElement("div");
  chip.className = "pomo-phase";

  const dial = document.createElement("div");
  dial.className = "pomo-dial";
  const NS = "http://www.w3.org/2000/svg";
  const ring = document.createElementNS(NS, "svg");
  ring.setAttribute("class", "pomo-ring");
  ring.setAttribute("viewBox", "0 0 160 160");
  const track = document.createElementNS(NS, "circle");
  track.setAttribute("class", "pomo-ring-track");
  track.setAttribute("cx", "80");
  track.setAttribute("cy", "80");
  track.setAttribute("r", "70");
  const prog = document.createElementNS(NS, "circle");
  prog.setAttribute("class", "pomo-ring-prog");
  prog.setAttribute("cx", "80");
  prog.setAttribute("cy", "80");
  prog.setAttribute("r", "70");
  prog.style.strokeDasharray = String(RING_C);
  ring.append(track, prog);
  const timeEl = document.createElement("div");
  timeEl.className = "pomo-time";
  dial.append(ring, timeEl);

  const controls = document.createElement("div");
  controls.className = "pomo-controls";
  const playBtn = mkBtn("play", "开始", true);
  const resetBtn = mkBtn("reset", "重置");
  const skipBtn = mkBtn("skip", "跳过");
  const gearBtn = mkBtn("sliders", "设置");
  controls.append(resetBtn, playBtn, skipBtn, gearBtn);

  const dots = document.createElement("div");
  dots.className = "pomo-dots";
  const meta = document.createElement("div");
  meta.className = "pomo-meta";

  const collapse = document.createElement("button");
  collapse.className = "pomo-collapse";
  collapse.type = "button";
  collapse.textContent = "收起";

  // Settings form (hidden until the gear is tapped).
  const form = document.createElement("div");
  form.className = "pomo-settings";
  /** @type {Record<string, HTMLInputElement>} */
  const inputs = {};
  for (const [key, label, min, max] of /** @type {const} */ ([
    ["focus", "专注", 1, 90],
    ["short", "短休", 1, 30],
    ["long", "长休", 1, 60],
    ["longEvery", "长休间隔", 2, 8],
  ])) {
    const row = document.createElement("label");
    row.className = "pomo-field";
    const name = document.createElement("span");
    name.textContent = label;
    const input = document.createElement("input");
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    inputs[key] = input;
    row.append(name, input);
    form.appendChild(row);
  }

  panel.append(chip, dial, controls, dots, meta, form, collapse);

  // Backdrop: while open, the panel floats centered over a softly blurred page
  // so it never pushes the clock/memo around. Click it to close.
  const scrim = document.createElement("div");
  scrim.className = "pomo-scrim";

  root.append(pill, scrim, panel);
  parent.appendChild(root);

  /**
   * @param {string} name icon name
   * @param {string} aria
   * @param {boolean} [primary]
   */
  function mkBtn(name, aria, primary) {
    const b = document.createElement("button");
    b.className = "pomo-btn" + (primary ? " primary" : "");
    b.type = "button";
    b.setAttribute("aria-label", aria);
    b.title = aria;
    b.appendChild(icon(name, 18));
    return b;
  }

  /** @param {string} name swap an icon button's glyph */
  function setIcon(/** @type {HTMLButtonElement} */ btn, name) {
    btn.replaceChildren(icon(name, 18));
  }

  // ---------- Render ----------

  function fmt(/** @type {number} */ ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function liveRemaining() {
    return status === "running" ? endAt - Date.now() : remainingMs;
  }

  function render() {
    const rem = liveRemaining();
    const total = durMs(phase);
    const frac = total > 0 ? Math.max(0, Math.min(1, rem / total)) : 0;
    const text = fmt(rem);
    timeEl.textContent = text;
    prog.style.strokeDashoffset = String(RING_C * (1 - frac));
    chip.textContent = PHASE_META[phase].label;
    root.dataset.phase = phase;
    root.dataset.status = status;
    setIcon(playBtn, status === "running" ? "pause" : "play");
    playBtn.setAttribute("aria-label", status === "running" ? "暂停" : status === "paused" ? "继续" : "开始");
    pillText.textContent =
      status === "idle" ? "开始专注" : `${PHASE_META[phase].label} · ${text}`;

    // Cycle dots toward the long break + today's running tally.
    const filled = Math.min(focusDone, settings.longEvery);
    if (dots.childElementCount !== settings.longEvery) {
      dots.replaceChildren(
        ...Array.from({ length: settings.longEvery }, () => {
          const d = document.createElement("span");
          d.className = "pomo-dot";
          return d;
        }),
      );
    }
    [...dots.children].forEach((d, i) => d.classList.toggle("on", i < filled));
    meta.textContent = `今天完成 ${count} 个番茄`;
  }

  // ---------- Persistence ----------

  function saveSession() {
    void storage.set(SESSION_KEY, { phase, focusDone, status, endAt, remainingMs });
  }
  function saveToday() {
    void storage.set(TODAY_KEY, { date: todayStr(), count });
  }

  // ---------- Timer engine ----------

  function startTicking() {
    stopTicking();
    tickId = setInterval(tick, 250);
  }
  function stopTicking() {
    if (tickId) clearInterval(tickId);
    tickId = 0;
  }
  function tick() {
    if (status !== "running") return;
    if (Date.now() >= endAt) complete(true);
    else render();
  }

  function start() {
    if (status === "running") return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch {}
    }
    getAudioContext(); // unlock audio within this gesture so the later chime plays
    if (remainingMs <= 0) remainingMs = durMs(phase);
    endAt = Date.now() + remainingMs;
    status = "running";
    saveSession();
    startTicking();
    render();
  }

  function pause() {
    if (status !== "running") return;
    remainingMs = Math.max(0, endAt - Date.now());
    status = "paused";
    stopTicking();
    saveSession();
    render();
  }

  function reset() {
    status = "idle";
    remainingMs = durMs(phase);
    stopTicking();
    saveSession();
    render();
  }

  /** Advance to the next phase. @param {boolean} natural — true on real completion */
  function advance(natural) {
    if (phase === "focus") {
      if (natural) { count++; focusDone++; saveToday(); }
      phase = focusDone >= settings.longEvery && focusDone > 0 ? "long" : "short";
    } else {
      if (phase === "long") focusDone = 0;
      phase = "focus";
    }
    remainingMs = durMs(phase);
  }

  /** @param {boolean} natural */
  function complete(natural) {
    advance(natural);
    if (natural) {
      chime();
      flash();
      notify(phase === "focus" ? "休息结束，回到专注。" : "专注完成，休息一下吧。");
    }
    status = "running";
    endAt = Date.now() + remainingMs;
    saveSession();
    startTicking();
    render();
  }

  function flash() {
    if (reduceMotion) return;
    panel.classList.remove("flash");
    void panel.offsetWidth; // restart the animation
    panel.classList.add("flash");
    setTimeout(() => panel.classList.remove("flash"), 1200);
  }

  // ---------- Wiring ----------

  function openPanel() {
    root.classList.remove("open", "closing");
    void panel.offsetWidth; // restart the entrance animation cleanly
    root.classList.add("open");
  }
  // Play the exit animation, then drop the overlay exactly on animationend — no
  // timer slack that could flash a resting frame before the panel leaves.
  function closePanel() {
    if (!root.classList.contains("open") || root.classList.contains("closing")) return;
    if (reduceMotion) { root.classList.remove("open"); return; }
    root.classList.add("closing");
  }
  panel.addEventListener("animationend", (e) => {
    if (e.animationName === "pomo-sink") root.classList.remove("open", "closing");
  });

  pill.addEventListener("click", () => {
    openPanel();
    if (status === "idle") start();
    render();
  });
  collapse.addEventListener("click", closePanel);
  scrim.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
  playBtn.addEventListener("click", () => (status === "running" ? pause() : start()));
  resetBtn.addEventListener("click", reset);
  skipBtn.addEventListener("click", () => complete(false));
  gearBtn.addEventListener("click", () => panel.classList.toggle("show-settings"));

  for (const key in inputs) {
    inputs[key].addEventListener("change", () => {
      const v = Math.round(Number(inputs[key].value));
      if (!Number.isFinite(v) || v < Number(inputs[key].min) || v > Number(inputs[key].max)) {
        inputs[key].value = String(settings[/** @type {keyof Settings} */ (key)]);
        return;
      }
      settings = { ...settings, [key]: v };
      void storage.set(SETTINGS_KEY, settings);
      if (status !== "running") remainingMs = durMs(phase); // re-arm idle/paused timer
      render();
    });
  }

  // Re-sync from the timestamp whenever the tab regains focus (interval may have
  // been throttled to a crawl while hidden).
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && status === "running") tick();
  });

  // ---------- Restore persisted state ----------

  const sv = /** @type {Partial<Settings> | undefined} */ (await storage.get(SETTINGS_KEY));
  if (sv) settings = { ...DEFAULT_SETTINGS, ...sv };
  for (const key in inputs) inputs[key].value = String(settings[/** @type {keyof Settings} */ (key)]);

  const td = /** @type {{ date: string, count: number } | undefined} */ (await storage.get(TODAY_KEY));
  if (td && td.date === todayStr()) count = td.count;

  const sess = /** @type {any} */ (await storage.get(SESSION_KEY));
  if (sess && (sess.status === "running" || sess.status === "paused")) {
    phase = sess.phase;
    focusDone = sess.focusDone ?? 0;
    if (sess.status === "running" && sess.endAt > Date.now()) {
      // Still mid-phase: resume the live countdown.
      endAt = sess.endAt;
      remainingMs = endAt - Date.now();
      status = "running";
      startTicking();
    } else if (sess.status === "running") {
      // Phase elapsed while the page was closed: settle it once, then wait.
      advance(true);
      status = "paused";
    } else {
      remainingMs = sess.remainingMs ?? durMs(phase);
      status = "paused";
    }
    root.classList.add("open");
  } else {
    remainingMs = durMs(phase);
  }

  render();
}
