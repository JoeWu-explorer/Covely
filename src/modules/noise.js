// Sound module: file-based playback with looping + variant switching.
// 3 slots (rain / fire / music). Rain and fire have 3 variants each; music has 1.
// Files live under assets/sounds/ and are loaded on first play via decodeAudioData.

import { getAudioContext } from "../lib/audio.js";
import * as storage from "../lib/storage.js";
import { icon } from "../lib/icons.js";

const STORAGE_KEY = "covely.sound.preset";
const ASSETS = "assets/sounds";

/** @type {Record<"rain"|"fire"|"music", string>} */
const SLOT_ICON = { rain: "droplet", fire: "flame", music: "music" };

/**
 * @typedef {{ enabled: boolean, volume: number, variant: number }} SlotState
 * @typedef {Record<"rain"|"fire"|"music", SlotState>} SoundPreset
 */

// Variant names are surfaced in the dropdown picker. Order matches the on-disk
// `<slot>-<n>.mp3` files; renaming an entry only changes the label, not the audio.
const SLOTS = /** @type {const} */ ([
  {
    id: "rain", label: "雨声", hint: "连绵的雨",
    variantNames: ["Drizzle", "Soft Rain", "Lullaby Rain"],
  },
  {
    id: "fire", label: "篝火", hint: "噼啪的火焰",
    variantNames: ["Hearth", "Bonfire", "Crackle"],
  },
  {
    id: "music", label: "轻音乐", hint: "钢琴小品",
    variantNames: [
      "Calm Mattress", "Calm Mattress II", "Healing Waterfall",
      "Piano Saltwater", "Piano Saltwater II", "Pillow Mercury",
    ],
  },
]);

/** @type {SoundPreset} */
const DEFAULT_PRESET = {
  rain: { enabled: false, volume: 60, variant: 1 },
  fire: { enabled: false, volume: 55, variant: 1 },
  music: { enabled: false, volume: 40, variant: 1 },
};

// ---------- Buffer cache: url → AudioBuffer ----------

/** @type {Map<string, Promise<AudioBuffer>>} */
const bufferCache = new Map();

/**
 * @param {AudioContext} ac
 * @param {string} url
 */
function loadBuffer(ac, url) {
  let promise = bufferCache.get(url);
  if (!promise) {
    promise = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((ab) => ac.decodeAudioData(ab));
    bufferCache.set(url, promise);
  }
  return promise;
}

// ---------- SoundSlot ----------

/**
 * @param {string} slotId
 */
function createSlot(slotId) {
  /** @type {AudioBufferSourceNode | null} */
  let source = null;
  /** @type {GainNode | null} */
  let gain = null;
  let volume = 0.6;
  let variant = 1;
  let running = false;
  // generation counter avoids race: if start() is called twice quickly, the
  // earlier load may resolve after the later one — we only wire up sources
  // whose generation matches the latest.
  let generation = 0;

  function teardown() {
    if (source) {
      try { source.stop(); } catch {}
      try { source.disconnect(); } catch {}
    }
    if (gain) {
      try { gain.disconnect(); } catch {}
    }
    source = null;
    gain = null;
  }

  async function start() {
    if (running) return;
    running = true;
    const myGen = ++generation;
    const ac = getAudioContext();
    const url = `${ASSETS}/${slotId}-${variant}.mp3`;
    let buf;
    try {
      buf = await loadBuffer(ac, url);
    } catch (err) {
      console.error("[noise] load failed", url, err);
      running = false;
      return;
    }
    if (myGen !== generation || !running) return; // got stopped / changed mid-load
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ac.createGain();
    g.gain.value = volume;
    src.connect(g).connect(ac.destination);
    src.start();
    source = src;
    gain = g;
  }

  function stop() {
    if (!running) return;
    running = false;
    generation++;
    teardown();
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (gain) {
      const ac = getAudioContext();
      gain.gain.setTargetAtTime(volume, ac.currentTime, 0.05);
    }
  }

  /**
   * @param {number} n 1-based variant index
   */
  function setVariant(n) {
    if (n === variant) return;
    variant = n;
    if (running) {
      teardown();
      running = false;
      void start();
    }
  }

  return {
    get running() { return running; },
    get variant() { return variant; },
    start,
    stop,
    setVolume,
    setVariant,
  };
}

// ---------- Mount ----------

/**
 * @param {HTMLElement} container
 */
export async function mountNoise(container) {
  const raw = /** @type {Partial<SoundPreset> | undefined} */ (await storage.get(STORAGE_KEY));
  /** @type {SoundPreset} */
  const preset = {
    rain: { ...DEFAULT_PRESET.rain, ...(raw?.rain ?? {}) },
    fire: { ...DEFAULT_PRESET.fire, ...(raw?.fire ?? {}) },
    music: { ...DEFAULT_PRESET.music, ...(raw?.music ?? {}) },
  };

  const root = document.createElement("section");
  root.className = "noise";
  root.setAttribute("aria-label", "声音陪伴");

  /** @typedef {{ setEnabled: (on: boolean, opts?: { play?: boolean }) => void, setVolume: (v: number) => void, setVariant: (v: number) => void }} SlotControl */
  /** @type {Record<string, SlotControl>} */
  const controls = {};
  const save = () => storage.set(STORAGE_KEY, preset);

  for (const slot of SLOTS) {
    const state = preset[slot.id];
    const sound = createSlot(slot.id);
    sound.setVolume(state.volume / 100);
    sound.setVariant(state.variant);

    const card = document.createElement("div");
    card.className = "noise-card";
    card.dataset.id = slot.id;
    if (state.enabled) card.classList.add("on");

    const toggle = document.createElement("button");
    toggle.className = "noise-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", `切换 ${slot.label}`);

    const label = document.createElement("div");
    label.className = "noise-label";
    const nameEl = document.createElement("span");
    nameEl.className = "noise-name";
    nameEl.textContent = slot.label;
    const hintEl = document.createElement("span");
    hintEl.className = "noise-hint";
    hintEl.textContent = slot.hint;
    label.append(nameEl, hintEl);

    const slotIcon = icon(SLOT_ICON[slot.id], 18);
    slotIcon.classList.add("noise-icon");

    const head = document.createElement("div");
    head.className = "noise-head";
    head.append(toggle, slotIcon, label);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(state.volume);
    slider.setAttribute("aria-label", `${slot.label} 音量`);
    // Filled-track look: CSS reads --pct to paint the played portion.
    const paint = () => slider.style.setProperty("--pct", `${slider.value}%`);
    paint();

    card.append(head, slider);

    // Variant picker (only for slots with >1 variants) — dropdown of named options.
    /** @type {ReturnType<typeof createPicker> | null} */
    let picker = null;
    if (slot.variantNames.length > 1) {
      picker = createPicker({
        slotLabel: slot.label,
        names: [...slot.variantNames],
        getCurrent: () => state.variant,
        onPick: (v) => { setVariant(v); void save(); },
      });
      card.appendChild(picker.root);
    }

    root.appendChild(card);

    /** @param {number} v 1-based variant */
    function setVariant(v) {
      state.variant = v;
      sound.setVariant(v);
      picker?.sync();
    }
    /** @param {number} v 0–100 */
    function setVolume(v) {
      slider.value = String(v);
      paint();
      sound.setVolume(v / 100);
      state.volume = v;
    }
    /** @param {boolean} on @param {{ play?: boolean }} [opts] */
    function setEnabled(on, opts) {
      if (on) {
        card.classList.add("on");
        state.enabled = true;
        sound.setVolume(Number(slider.value) / 100);
        if (opts?.play !== false) void sound.start();
      } else {
        sound.stop();
        card.classList.remove("on");
        state.enabled = false;
      }
    }
    controls[slot.id] = { setEnabled, setVolume, setVariant };

    toggle.addEventListener("click", () => {
      setEnabled(!sound.running);
      void save();
    });
    slider.addEventListener("input", () => {
      sound.setVolume(Number(slider.value) / 100);
      state.volume = Number(slider.value);
      paint();
    });
    slider.addEventListener("change", () => void save());
  }

  container.appendChild(root);

  return {
    /**
     * Apply a curated preset (from the welcome modal) and start it playing.
     * Must be called inside a user gesture so the AudioContext can resume.
     * @param {SoundPreset} p
     */
    applyPreset(p) {
      for (const slot of SLOTS) {
        const c = controls[slot.id];
        const ps = p[slot.id];
        if (!c || !ps) continue;
        c.setVariant(ps.variant);
        c.setVolume(ps.volume);
        c.setEnabled(ps.enabled);
      }
      void save();
    },
  };
}

// ---------- Variant picker (dropdown) ----------

/**
 * Self-contained variant picker: a button that shows the current variant name
 * and opens a popover menu. Mirrors the popover style used by atmosphere &
 * search controls (button + role=menu + outside-click close + Escape).
 *
 * @param {{ slotLabel: string, names: string[],
 *           getCurrent: () => number, onPick: (variant: number) => void }} opts
 */
function createPicker(opts) {
  const root = document.createElement("div");
  root.className = "noise-picker";

  const trigger = document.createElement("button");
  trigger.className = "noise-picker-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", `${opts.slotLabel} 音源`);

  const labelEl = document.createElement("span");
  labelEl.className = "noise-picker-label";
  const caret = document.createElement("span");
  caret.className = "noise-picker-caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "▾";
  trigger.append(labelEl, caret);

  const menu = document.createElement("div");
  menu.className = "noise-picker-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  /** @type {HTMLButtonElement[]} */
  const items = [];
  opts.names.forEach((name, i) => {
    const item = document.createElement("button");
    item.className = "noise-picker-item";
    item.type = "button";
    item.setAttribute("role", "menuitemradio");
    item.textContent = name;
    item.addEventListener("click", () => {
      opts.onPick(i + 1); // 1-based variant
      close();
    });
    items.push(item);
    menu.appendChild(item);
  });

  function sync() {
    const cur = opts.getCurrent();
    labelEl.textContent = opts.names[cur - 1] ?? opts.names[0];
    items.forEach((el, i) => el.setAttribute("aria-checked", String(i + 1 === cur)));
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
