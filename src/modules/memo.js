// Idea capture: a CodeMirror markdown editor backed by persistent storage (localStorage
// on web, chrome.storage.local on extension). Survives tab discard, browser crash, and
// mobile eviction — content is auto-saved and restored on next visit.

import { createEditor } from "../lib/editor.js";
import { icon } from "../lib/icons.js";
import * as storage from "../lib/storage.js";

const KEY = "covely.memo.draft";

/** @param {HTMLElement} container */
export function mountMemo(container) {
  const root = document.createElement("section");
  root.className = "memo";
  root.setAttribute("aria-label", "灵感速记");

  const editorEl = document.createElement("div");
  editorEl.className = "memo-editor";

  // --- Debounced write-through ---
  /** @type {ReturnType<typeof setTimeout>} */
  let writeTimer = 0;

  /** @param {string} value */
  function flush(value) {
    clearTimeout(writeTimer);
    void storage.set(KEY, value);
  }

  /** @param {string} value */
  function scheduleWrite(value) {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => void storage.set(KEY, value), 400);
  }

  // Legacy sessionStorage draft (existing tab with a live draft before the upgrade).
  const legacyDraft = sessionStorage.getItem(KEY) ?? "";

  const view = createEditor({
    parent: editorEl,
    doc: legacyDraft,
    placeholder: "记下冒出来的想法…（支持 Markdown）",
    ariaLabel: "灵感速记",
    onChange: scheduleWrite,
  });

  // Migrate legacy sessionStorage draft → persistent storage, then remove it.
  if (legacyDraft) {
    void storage.set(KEY, legacyDraft);
    sessionStorage.removeItem(KEY);
  } else {
    // No legacy draft: load from persistent storage and insert if editor is still empty.
    void storage.get(KEY).then((stored) => {
      if (typeof stored === "string" && stored.length > 0 && view.state.doc.length === 0) {
        view.dispatch({ changes: { from: 0, to: 0, insert: stored } });
      }
    });
  }

  // Flush on tab discard / background — beforeunload doesn't fire reliably on mobile.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush(view.state.doc.toString());
  });

  const actions = document.createElement("div");
  actions.className = "memo-actions";

  const hint = document.createElement("span");
  hint.className = "memo-hint";
  hint.textContent = "已自动保存在本机";

  const buttons = document.createElement("div");
  buttons.className = "memo-buttons";

  const copyBtn = document.createElement("button");
  copyBtn.className = "memo-btn";
  copyBtn.type = "button";
  let copyIcon = icon("copy", 14);
  const copyText = document.createElement("span");
  copyText.textContent = "复制";
  copyBtn.append(copyIcon, copyText);

  const clearBtn = document.createElement("button");
  clearBtn.className = "memo-btn";
  clearBtn.type = "button";
  clearBtn.append(icon("eraser", 14));
  const clearText = document.createElement("span");
  clearText.textContent = "清空";
  clearBtn.append(clearText);

  buttons.append(copyBtn, clearBtn);
  actions.append(hint, buttons);
  root.append(editorEl, actions);
  container.appendChild(root);

  const getText = () => view.state.doc.toString();

  let resetTimer = 0;
  copyBtn.addEventListener("click", async () => {
    const text = getText();
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    copyBtn.dataset.state = "copied";
    const checkIcon = icon("check", 14);
    copyIcon.replaceWith(checkIcon);
    copyIcon = checkIcon;
    copyText.textContent = "已复制";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      delete copyBtn.dataset.state;
      const freshIcon = icon("copy", 14);
      copyIcon.replaceWith(freshIcon);
      copyIcon = freshIcon;
      copyText.textContent = "复制";
    }, 1500);
  });

  clearBtn.addEventListener("click", () => {
    if (!getText().trim()) return;
    if (confirm("清空速记？未复制的内容会丢失。")) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } });
      sessionStorage.removeItem(KEY);
      void storage.remove(KEY);
      view.focus();
    }
  });
}
