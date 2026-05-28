// Minimal Google search box. Enter → opens results in the current tab.

/** @param {HTMLElement} container */
export function mountSearch(container) {
  const root = document.createElement("form");
  root.className = "search";
  root.setAttribute("role", "search");

  const input = document.createElement("input");
  input.className = "search-input";
  input.type = "search";
  input.placeholder = "搜索";
  input.autocomplete = "off";
  input.spellcheck = false;

  root.appendChild(input);
  container.appendChild(root);

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    const url = "https://www.google.com/search?q=" + encodeURIComponent(q);
    location.href = url;
  });
}
