// Clock module: big quiet time + Chinese-style date underneath.
// No seconds — keeps the surface still.

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

/** @param {HTMLElement} container */
export function mountClock(container) {
  const root = document.createElement("section");
  root.className = "clock";
  root.setAttribute("aria-label", "时钟");

  const time = document.createElement("div");
  time.className = "clock-time";
  const date = document.createElement("div");
  date.className = "clock-date";
  root.append(time, date);
  container.appendChild(root);

  function render() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    time.textContent = `${hh}:${mm}`;
    date.textContent = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  }

  render();
  setInterval(render, 30_000);
}
