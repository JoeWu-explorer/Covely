// A calm, premium glass dialog shown on every visit: it greets the visitor with
// a fresh line, has a small moment with them, and offers to turn on a curated
// soundscape. The greeting is picked at random each load so it never feels stale.

import { dismissDialog } from "../lib/dialog.js";

/** @type {ReadonlyArray<{ title: string, lead: string }>} */
const GREETINGS = [
  { title: "很高兴遇见你", lead: "这里是 Covely —— 一处让你慢下来、安静做事的小角落。" },
  { title: "你来啦", lead: "先放下手里的急事，给自己几秒钟，深呼吸一下。" },
  { title: "欢迎回来", lead: "无论今天过得怎样，这一刻可以只属于你自己。" },
  { title: "嘿，又见面了", lead: "不着急，我们一起慢慢把心静下来。" },
  { title: "今天也辛苦了", lead: "在开始之前，先让自己舒舒服服地坐好。" },
  { title: "停一停，歇口气", lead: "这里没有催促，只有属于你的安静节奏。" },
  { title: "找个地方安顿一下", lead: "把窗外的喧嚣关在门外，留一点空间给自己。" },
];

// The soundscape applied if the visitor says yes — rain (variant 2, gentle),
// fire (variant 1, warmer), and a soft piano bed at half volume.
/** @type {import("./noise.js").SoundPreset} */
const WELCOME_PRESET = {
  rain: { enabled: true, volume: 25, variant: 2 },
  fire: { enabled: true, volume: 60, variant: 1 },
  music: { enabled: true, volume: 50, variant: 1 },
};

/**
 * @param {{ applyPreset: (p: import("./noise.js").SoundPreset) => void }} noise
 */
export function mountWelcome(noise) {
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

  const scrim = document.createElement("div");
  scrim.className = "welcome-scrim";

  const card = document.createElement("div");
  card.className = "welcome-card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-label", "欢迎来到 Covely");

  // Soft breathing halo behind the wordmark — the "premium" touch.
  const halo = document.createElement("div");
  halo.className = "welcome-halo";

  const brand = document.createElement("span");
  brand.className = "welcome-brand";
  brand.setAttribute("role", "img");
  brand.setAttribute("aria-label", "Covely");

  const title = document.createElement("h2");
  title.className = "welcome-title";
  title.textContent = greeting.title;

  const lead = document.createElement("p");
  lead.className = "welcome-text";
  lead.textContent = greeting.lead;

  const ask = document.createElement("p");
  ask.className = "welcome-text";
  ask.textContent =
    "要不要先点上一点背景声？我替你调好了雨声、篝火和一段轻音乐，像有人陪你一起静静待着。";

  const actions = document.createElement("div");
  actions.className = "welcome-actions";
  const yes = document.createElement("button");
  yes.className = "welcome-primary";
  yes.type = "button";
  yes.textContent = "好，给我一点声音";
  const no = document.createElement("button");
  no.className = "welcome-ghost";
  no.type = "button";
  no.textContent = "先安静一会儿";
  actions.append(yes, no);

  const note = document.createElement("p");
  note.className = "welcome-note";
  note.textContent = "随时可以在下方的声音卡片里关闭或调整。";

  card.append(halo, brand, title, lead, ask, actions, note);
  document.body.append(scrim, card);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    dismissDialog({ scrim, card });
  }

  yes.addEventListener("click", () => {
    // click is the gesture that unlocks audio; never let a sound hiccup block close
    try { noise.applyPreset(WELCOME_PRESET); } catch (err) { console.error("[welcome]", err); }
    close();
  });
  no.addEventListener("click", close);
}
