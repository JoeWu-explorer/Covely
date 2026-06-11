// Persistent settings storage. The if-conditions reference process.env.COVELY_TARGET
// directly so esbuild's `define` substitution turns each branch into a pure constant
// comparison (e.g. `"web" === "extension"`) — dead branches are then DCE'd, and the
// web bundle contains no textual reference to `chrome.*`.
//
// Never throws: storage being unavailable (private mode, quota, extension API
// hiccups) degrades to defaults instead of breaking module mount.

/**
 * @param {string} key
 * @returns {Promise<unknown>}
 */
export async function get(key) {
  try {
    if (process.env.COVELY_TARGET === "extension") {
      const chrome = /** @type {any} */ (globalThis).chrome;
      const result = await chrome.storage.local.get(key);
      return result[key];
    }
    const raw = localStorage.getItem(key);
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (err) {
    console.warn("[storage] get failed:", key, err);
    return undefined;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export async function set(key, value) {
  try {
    if (process.env.COVELY_TARGET === "extension") {
      const chrome = /** @type {any} */ (globalThis).chrome;
      await chrome.storage.local.set({ [key]: value });
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[storage] set failed:", key, err);
  }
}

/**
 * @param {string} key
 */
export async function remove(key) {
  try {
    if (process.env.COVELY_TARGET === "extension") {
      const chrome = /** @type {any} */ (globalThis).chrome;
      await chrome.storage.local.remove(key);
      return;
    }
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("[storage] remove failed:", key, err);
  }
}
