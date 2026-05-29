// Clock module: a soft time-aware greeting, big quiet time, Chinese-style date.
// No seconds — keeps the surface still.

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

// Greeting by time of day. Each bucket has a couple of calm variants for a
// little variety; the bucket is chosen by the hour and re-picked only when the
// clock crosses into a new period (so it never flickers between renders).
const GREETINGS = /** @type {const} */ ([
  { until: 5, words: ["夜深了", "愿你安睡"] },
  { until: 9, words: ["早安", "清晨好"] },
  { until: 11, words: ["上午好", "专注的上午"] },
  { until: 13, words: ["午安", "中午好"] },
  { until: 17, words: ["下午好", "午后好"] },
  { until: 19, words: ["傍晚好", "黄昏好"] },
  { until: 23, words: ["晚上好", "夜色温柔"] },
  { until: 24, words: ["夜深了", "愿你安睡"] },
]);

/** @param {number} hour */
function bucketFor(hour) {
  const i = GREETINGS.findIndex((g) => hour < g.until);
  return i === -1 ? GREETINGS.length - 1 : i;
}

/**
 * @param {HTMLElement} container
 * @returns {HTMLElement} the clock section (so siblings like the quote can attach)
 */
export function mountClock(container) {
  const root = document.createElement("section");
  root.className = "clock";
  root.setAttribute("aria-label", "时钟");

  // Brand greeting line: "Covely · <greeting>". The wordmark stays steady;
  // only the greeting text carries the flowing shimmer.
  const greeting = document.createElement("div");
  greeting.className = "clock-greeting";
  const brand = document.createElement("span");
  brand.className = "brand-logo";
  brand.setAttribute("role", "img");
  brand.setAttribute("aria-label", "Covely");
  const sep = document.createElement("span");
  sep.className = "greeting-sep";
  sep.setAttribute("aria-hidden", "true");
  sep.textContent = "·";
  const greetText = document.createElement("span");
  greetText.className = "greeting-text";
  greeting.append(brand, sep, greetText);

  const time = document.createElement("div");
  time.className = "clock-time";
  const date = document.createElement("div");
  date.className = "clock-date";
  root.append(greeting, time, date);
  container.appendChild(root);

  let curBucket = -1;
  function render() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    // Re-pick a greeting only when we cross into a new time period.
    const bucket = bucketFor(now.getHours());
    if (bucket !== curBucket) {
      curBucket = bucket;
      const words = GREETINGS[bucket].words;
      greetText.textContent = words[Math.floor(Math.random() * words.length)];
    }
    time.textContent = `${hh}:${mm}`;
    date.textContent = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  }

  render();
  setInterval(render, 30_000);

  return root;
}
