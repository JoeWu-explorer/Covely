// Atmosphere: a calm, copyright-free backdrop built from pure CSS gradients +
// self-drawn hill silhouettes. Sets a time-of-day phase (dawn/day/dusk/night)
// on <html> so the sky, glow, and hills shift gently through the day.
//
// The user can lock a phase (or pick "跟随时间") via the top-right control;
// the choice persists across sessions. No images, no network.
//
// Preview override for testing: ?phase=dawn|day|dusk|night.

import * as storage from "../lib/storage.js";
import { icon } from "../lib/icons.js";

const STORAGE_KEY = "covely.phase";

/** @typedef {"auto"|"dawn"|"day"|"dusk"|"night"} Pref */

const OPTIONS = /** @type {const} */ ([
  { key: "auto", label: "跟随时间", icon: "clock" },
  { key: "dawn", label: "清晨", icon: "sunrise" },
  { key: "day", label: "白昼", icon: "sun" },
  { key: "dusk", label: "黄昏", icon: "sunset" },
  { key: "night", label: "夜晚", icon: "moon" },
]);

/** @returns {"dawn"|"day"|"dusk"|"night"} */
function phaseForHour(hour) {
  if (hour >= 5 && hour < 10) return "dawn";
  if (hour < 17) return "day";
  if (hour < 20) return "dusk";
  return "night";
}

/** @param {Pref} pref */
function effectivePhase(pref) {
  return pref === "auto" ? phaseForHour(new Date().getHours()) : pref;
}

/** Icon name to show on the trigger for a given preference. */
function triggerIcon(/** @type {Pref} */ pref) {
  const p = pref === "auto" ? phaseForHour(new Date().getHours()) : pref;
  return { dawn: "sunrise", day: "sun", dusk: "sunset", night: "moon" }[p];
}

export function mountAtmosphere() {
  const root = document.documentElement;
  const override = new URLSearchParams(location.search).get("phase");

  /** @type {Pref} */
  let pref = "auto";

  function apply() {
    root.dataset.phase = override || effectivePhase(pref);
  }

  // Apply immediately (time-based) to avoid a flash before storage resolves.
  apply();
  // Re-evaluate every 5 min so auto transitions happen on their own.
  setInterval(apply, 5 * 60 * 1000);

  // --- Distant hill silhouettes (two layers for depth) ---
  const hills = document.createElement("div");
  hills.className = "hills";
  hills.setAttribute("aria-hidden", "true");
  const far = document.createElement("span");
  far.className = "hill hill-far";
  const near = document.createElement("span");
  near.className = "hill hill-near";
  hills.append(far, near);
  document.body.prepend(hills);

  // --- Drifting mist (slow horizontal haze — the most perceptible motion) ---
  const mist = document.createElement("div");
  mist.className = "mist";
  mist.setAttribute("aria-hidden", "true");
  document.body.prepend(mist); // sits above the glow, behind the hills

  // --- Phase control (top-right) ---
  const control = buildControl(() => pref, async (next) => {
    pref = next;
    apply();
    await storage.set(STORAGE_KEY, pref);
  });
  document.body.appendChild(control.root);

  // Load saved preference (overrides the time-based default once resolved).
  void storage.get(STORAGE_KEY).then((saved) => {
    if (saved === "auto" || saved === "dawn" || saved === "day" ||
        saved === "dusk" || saved === "night") {
      pref = saved;
      apply();
      control.sync();
    }
  });
}

/**
 * @param {() => Pref} getPref
 * @param {(next: Pref) => void} onPick
 */
function buildControl(getPref, onPick) {
  const root = document.createElement("div");
  root.className = "theme-control";

  const trigger = document.createElement("button");
  trigger.className = "theme-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "切换氛围");

  const menu = document.createElement("div");
  menu.className = "theme-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  /** @type {Map<Pref, HTMLButtonElement>} */
  const items = new Map();
  for (const opt of OPTIONS) {
    const item = document.createElement("button");
    item.className = "theme-item";
    item.type = "button";
    item.setAttribute("role", "menuitemradio");
    item.append(icon(opt.icon, 16));
    const text = document.createElement("span");
    text.textContent = opt.label;
    item.append(text);
    item.append(icon("check", 14)); // shown only when checked (CSS)
    item.addEventListener("click", () => {
      onPick(opt.key);
      sync();
      close();
    });
    items.set(opt.key, item);
    menu.appendChild(item);
  }

  function renderTrigger() {
    trigger.replaceChildren(icon(triggerIcon(getPref()), 18));
  }
  function sync() {
    const cur = getPref();
    for (const [key, el] of items) {
      el.setAttribute("aria-checked", String(key === cur));
    }
    renderTrigger();
  }
  function open() {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("keydown", onKey, true);
  }
  function close() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutside, true);
    document.removeEventListener("keydown", onKey, true);
  }
  /** @param {PointerEvent} e */
  function onOutside(e) {
    if (!root.contains(/** @type {Node} */ (e.target))) close();
  }
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === "Escape") { close(); trigger.focus(); }
  }

  trigger.addEventListener("click", () => {
    if (menu.hidden) open(); else close();
  });

  root.append(trigger, menu);
  sync();
  return { root, sync };
}
