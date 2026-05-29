// A gentle line of encouragement under the date. Picks a fresh one on every
// page open; click to shuffle another. Local list only — no network, no
// tracking, works offline (keeps Covely local-first).

const QUOTES = [
  "慢慢来，比较快。",
  "你已经在路上了，这就够了。",
  "专注此刻，其余的交给时间。",
  "一次只做一件事，把它做好。",
  "深呼吸，你比想象中更从容。",
  "今天不必完美，完成就好。",
  "安静下来，好想法自会浮现。",
  "你不需要赶，只需要开始。",
  "把注意力收回来，世界会安静很多。",
  "每一个小进展，都值得被看见。",
  "允许自己慢一点，也允许自己停一下。",
  "此刻的专注，是给未来的礼物。",
  "不焦虑结果，先享受过程。",
  "写下第一行，剩下的会跟上来。",
  "你今天的努力，会在某天回应你。",
  "让心静下来，手自然会快起来。",
  "困住你的往往是念头，不是事情本身。",
  "先完成，再完美。",
  "给自己一点耐心，事情正在变好。",
  "此刻你拥有的，已经足够开始。",
  "把大事拆小，把小事做完。",
  "平静，也是一种生产力。",
  "你做得很好，继续保持这份专注。",
  "喝口水，伸个懒腰，再继续。",
];

/**
 * @param {string} [prev] avoid repeating the current line
 * @returns {string}
 */
function pickQuote(prev) {
  if (QUOTES.length < 2) return QUOTES[0];
  let q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  while (q === prev) q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return q;
}

/** @param {HTMLElement} parent — the clock section, so the line sits under the date */
export function mountQuote(parent) {
  const el = document.createElement("button");
  el.className = "quote";
  el.type = "button";
  el.setAttribute("aria-label", "换一句鼓励的话");
  el.title = "点击换一句";

  let current = "";
  function shuffle() {
    current = pickQuote(current);
    el.style.opacity = "0";
    setTimeout(() => {
      el.textContent = current;
      el.style.opacity = "1";
    }, 180);
  }

  el.addEventListener("click", shuffle);
  parent.appendChild(el);
  shuffle(); // fresh line on every open
}
