// Clock module: a soft time-aware greeting, big quiet time, Chinese-style date.
// No seconds — keeps the surface still.

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

/** @param {number} hour */
function greetingFor(hour) {
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早安";
  if (hour < 14) return "午安";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

/**
 * @param {HTMLElement} container
 * @returns {HTMLElement} the clock section (so siblings like the quote can attach)
 */
export function mountClock(container) {
  const root = document.createElement("section");
  root.className = "clock";
  root.setAttribute("aria-label", "时钟");

  const greeting = document.createElement("div");
  greeting.className = "clock-greeting";
  const time = document.createElement("div");
  time.className = "clock-time";
  const date = document.createElement("div");
  date.className = "clock-date";
  root.append(greeting, time, date);
  container.appendChild(root);

  function render() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    greeting.textContent = greetingFor(now.getHours());
    time.textContent = `${hh}:${mm}`;
    date.textContent = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  }

  render();
  setInterval(render, 30_000);

  return root;
}
