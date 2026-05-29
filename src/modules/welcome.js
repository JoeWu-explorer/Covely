// First-visit welcome: a calm, premium glass dialog that says hello, has a
// small moment with the visitor, and offers to turn on a curated soundscape.
// Shown once — a flag in storage keeps it from returning.

import * as storage from "../lib/storage.js";

const ONBOARDED_KEY = "covely.onboarded";

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
export async function mountWelcome(noise) {
  if (await storage.get(ONBOARDED_KEY)) return;

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
  title.textContent = "很高兴遇见你";

  const lead = document.createElement("p");
  lead.className = "welcome-text";
  lead.textContent = "这里是 Covely —— 一处让你慢下来、安静做事的小角落。";

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
    void storage.set(ONBOARDED_KEY, true);
    scrim.classList.add("leaving");
    card.classList.add("leaving");
    const finish = () => {
      scrim.remove();
      card.remove();
    };
    card.addEventListener(
      "animationend",
      (e) => { if (e.animationName === "welcome-out") finish(); },
      { once: true },
    );
    setTimeout(finish, 700); // fallback (also covers reduced-motion)
  }

  yes.addEventListener("click", () => {
    noise.applyPreset(WELCOME_PRESET); // click is the gesture that unlocks audio
    close();
  });
  no.addEventListener("click", close);
}
