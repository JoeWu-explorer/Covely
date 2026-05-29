// Floating search: a top-left icon button opens an overlay (command-palette
// style). The user picks an engine (Google / 百度, default Google, remembered);
// Enter searches in the current tab. Press "/" to open from anywhere.

import { icon } from "../lib/icons.js";
import * as storage from "../lib/storage.js";

const ENGINE_KEY = "covely.search.engine";

const ENGINES = /** @type {const} */ ([
  { key: "google", label: "Google", url: "https://www.google.com/search?q=" },
  { key: "baidu", label: "百度", url: "https://www.baidu.com/s?wd=" },
]);

/** Is the user currently typing somewhere (so "/" should be ignored)? */
function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLElement && (el.isContentEditable || !!el.closest(".cm-editor"));
}

export function mountSearch() {
  /** @type {typeof ENGINES[number]} */
  let engine = ENGINES[0];

  // --- Trigger (top-left, mirrors the theme control) ---
  const control = document.createElement("div");
  control.className = "search-control";
  const trigger = document.createElement("button");
  trigger.className = "search-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-label", "搜索");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.append(icon("search", 18));
  control.append(trigger);

  // --- Overlay ---
  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "搜索");
  overlay.hidden = true;

  const panel = document.createElement("div");
  panel.className = "search-panel";

  // Engine selector (segmented).
  const engines = document.createElement("div");
  engines.className = "search-engines";
  /** @type {Map<string, HTMLButtonElement>} */
  const engineBtns = new Map();
  for (const e of ENGINES) {
    const b = document.createElement("button");
    b.className = "search-engine";
    b.type = "button";
    b.textContent = e.label;
    b.addEventListener("click", () => { void setEngine(e); input.focus(); });
    engineBtns.set(e.key, b);
    engines.append(b);
  }

  // Input row.
  const box = document.createElement("div");
  box.className = "search-box";
  const ico = icon("search", 18);
  ico.classList.add("search-icon");
  const input = document.createElement("input");
  input.className = "search-input";
  input.type = "search";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "搜索");
  box.append(ico, input);

  const form = document.createElement("form");
  form.setAttribute("role", "search");
  form.append(engines, box);
  panel.append(form);
  overlay.append(panel);

  document.body.append(control, overlay);

  /** @param {typeof ENGINES[number]} e */
  async function setEngine(e) {
    engine = e;
    input.placeholder = `用 ${e.label} 搜索`;
    for (const [key, btn] of engineBtns) {
      btn.setAttribute("aria-pressed", String(key === e.key));
    }
    await storage.set(ENGINE_KEY, e.key);
  }

  function open() {
    overlay.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    input.value = "";
    requestAnimationFrame(() => input.focus());
  }
  function close() {
    overlay.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  overlay.addEventListener("pointerdown", (e) => {
    if (e.target === overlay) close(); // click on scrim, not panel
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    location.href = engine.url + encodeURIComponent(q);
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
  });
  // Global "/" shortcut — opens search unless the user is typing.
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && overlay.hidden && !isTyping()) {
      e.preventDefault();
      open();
    }
  });

  // Default engine, then load the remembered choice.
  void setEngine(engine);
  void storage.get(ENGINE_KEY).then((saved) => {
    const found = ENGINES.find((e) => e.key === saved);
    if (found) void setEngine(found);
  });
}
