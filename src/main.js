// Shared mount logic for both targets. Mounts P0 modules into #app.

import { mountAtmosphere } from "./modules/atmosphere.js";
import { mountClock } from "./modules/clock.js";
import { mountQuote } from "./modules/quote.js";
import { mountPomodoro } from "./modules/pomodoro.js";
import { mountSearch } from "./modules/search.js";
import { mountMemo } from "./modules/memo.js";
import { mountNoise } from "./modules/noise.js";
import { mountWelcome } from "./modules/welcome.js";
import { mountFeedback } from "./modules/feedback.js";

const app = document.getElementById("app");
if (!app) throw new Error("Covely: #app element not found");

mountAtmosphere();
const clockSection = mountClock(app);
mountQuote(clockSection); // encouraging line, tucked under the date
void mountPomodoro(clockSection); // focus timer, tucked under the quote
mountMemo(app);
// If the soundscape fails to mount, keep going — the modules below must not
// disappear with it. mountWelcome degrades to a no-op preset.
const noise = await mountNoise(app).catch((err) => {
  console.error("[covely] mountNoise failed", err);
  return { applyPreset: () => {} };
});
mountSearch(); // floating icon (top-left) + overlay — not part of the column
mountFeedback(); // floating icon (bottom-right) + dialog — user-initiated, sends to dev
void mountWelcome(noise); // first-visit greeting; offers to turn on the soundscape
