// Idea capture: a CodeMirror markdown editor backed by sessionStorage, with
// copy-to-clipboard, clear, and a leave reminder. Intentionally ephemeral —
// survives refresh, dies on tab close, forces export.

import { createEditor } from "../lib/editor.js";
import { icon } from "../lib/icons.js";

const SESSION_KEY = "covely.memo.draft";

/** @param {HTMLElement} container */
export function mountMemo(container) {
  const root = document.createElement("section");
  root.className = "memo";
  root.setAttribute("aria-label", "灵感速记");

  const editorEl = document.createElement("div");
  editorEl.className = "memo-editor";

  const view = createEditor({
    parent: editorEl,
    doc: sessionStorage.getItem(SESSION_KEY) ?? "",
    placeholder: "记下冒出来的想法…（支持 Markdown）",
    ariaLabel: "灵感速记",
    onChange: (value) => sessionStorage.setItem(SESSION_KEY, value),
  });

  const getText = () => view.state.doc.toString();

  const actions = document.createElement("div");
  actions.className = "memo-actions";

  const hint = document.createElement("span");
  hint.className = "memo-hint";
  hint.textContent = "关页即清空，记得导出";

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
      sessionStorage.removeItem(SESSION_KEY);
      view.focus();
    }
  });

  // beforeunload: warn if there's unsaved content.
  window.addEventListener("beforeunload", (e) => {
    if (getText().trim().length > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}
