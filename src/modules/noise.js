// Sound module: file-based playback with looping + variant switching.
// 3 slots (rain / fire / music). Rain and fire have 3 variants each; music has 1.
// Files live under assets/sounds/ and are loaded on first play via decodeAudioData.

import { getAudioContext } from "../lib/audio.js";
import * as storage from "../lib/storage.js";

const STORAGE_KEY = "covely.sound.preset";
const ASSETS = "assets/sounds";

/**
 * @typedef {{ enabled: boolean, volume: number, variant: number }} SlotState
 * @typedef {Record<"rain"|"fire"|"music", SlotState>} SoundPreset
 */

const SLOTS = /** @type {const} */ ([
  { id: "rain", label: "雨声", hint: "连绵的雨", variants: 3 },
  { id: "fire", label: "篝火", hint: "噼啪的火焰", variants: 3 },
  { id: "music", label: "轻音乐", hint: "钢琴小品", variants: 1 },
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

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(state.volume);

    card.append(toggle, label, slider);

    // Variant picker (only for slots with >1 variants)
    if (slot.variants > 1) {
      const variants = document.createElement("div");
      variants.className = "noise-variants";
      for (let v = 1; v <= slot.variants; v++) {
        const dot = document.createElement("button");
        dot.className = "noise-variant";
        dot.type = "button";
        dot.dataset.v = String(v);
        dot.setAttribute("aria-label", `${slot.label} 变体 ${v}`);
        if (v === state.variant) dot.classList.add("on");
        dot.addEventListener("click", async () => {
          state.variant = v;
          sound.setVariant(v);
          for (const sibling of variants.querySelectorAll(".noise-variant")) {
            sibling.classList.toggle("on", sibling === dot);
          }
          await storage.set(STORAGE_KEY, preset);
        });
        variants.appendChild(dot);
      }
      card.appendChild(variants);
    }

    root.appendChild(card);

    toggle.addEventListener("click", async () => {
      if (sound.running) {
        sound.stop();
        card.classList.remove("on");
        state.enabled = false;
      } else {
        card.classList.add("on");
        state.enabled = true;
        sound.setVolume(Number(slider.value) / 100);
        void sound.start();
      }
      await storage.set(STORAGE_KEY, preset);
    });

    slider.addEventListener("input", () => {
      sound.setVolume(Number(slider.value) / 100);
      state.volume = Number(slider.value);
    });
    slider.addEventListener("change", async () => {
      await storage.set(STORAGE_KEY, preset);
    });
  }

  container.appendChild(root);
}
