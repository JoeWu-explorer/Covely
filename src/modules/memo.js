// Idea capture: sessionStorage-backed textarea, copy-to-clipboard, leave reminder.
// Intentionally ephemeral — survives refresh, dies on tab close, forces export.

const SESSION_KEY = "covely.memo.draft";

/** @param {HTMLElement} container */
export function mountMemo(container) {
  const root = document.createElement("section");
  root.className = "memo";
  root.setAttribute("aria-label", "灵感速记");

  const ta = document.createElement("textarea");
  ta.className = "memo-textarea";
  ta.placeholder = "记下冒出来的想法…（关标签页会清空）";
  ta.value = sessionStorage.getItem(SESSION_KEY) ?? "";

  const actions = document.createElement("div");
  actions.className = "memo-actions";
  const copyBtn = document.createElement("button");
  copyBtn.className = "memo-btn";
  copyBtn.type = "button";
  copyBtn.textContent = "复制";
  const clearBtn = document.createElement("button");
  clearBtn.className = "memo-btn";
  clearBtn.type = "button";
  clearBtn.textContent = "清空";
  actions.append(copyBtn, clearBtn);

  root.append(ta, actions);
  container.appendChild(root);

  ta.addEventListener("input", () => {
    sessionStorage.setItem(SESSION_KEY, ta.value);
  });

  copyBtn.addEventListener("click", async () => {
    const text = ta.value;
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.dataset.state = "copied";
      copyBtn.textContent = "已复制";
      setTimeout(() => {
        delete copyBtn.dataset.state;
        copyBtn.textContent = "复制";
      }, 1500);
    } catch {
      // fallback for non-secure contexts
      ta.select();
      document.execCommand("copy");
    }
  });

  clearBtn.addEventListener("click", () => {
    if (!ta.value.trim()) return;
    if (confirm("清空速记？未复制的内容会丢失。")) {
      ta.value = "";
      sessionStorage.removeItem(SESSION_KEY);
      ta.focus();
    }
  });

  // beforeunload: warn if there's unsaved content
  window.addEventListener("beforeunload", (e) => {
    if (ta.value.trim().length > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}
