// Shared mount logic for both targets. Mounts P0 modules into #app.

import { mountAtmosphere } from "./modules/atmosphere.js";
import { mountClock } from "./modules/clock.js";
import { mountQuote } from "./modules/quote.js";
import { mountPomodoro } from "./modules/pomodoro.js";
import { mountSearch } from "./modules/search.js";
import { mountMemo } from "./modules/memo.js";
import { mountNoise } from "./modules/noise.js";
import { mountWelcome } from "./modules/welcome.js";

const app = document.getElementById("app");
if (!app) throw new Error("Covely: #app element not found");

mountAtmosphere();
const clockSection = mountClock(app);
mountQuote(clockSection); // encouraging line, tucked under the date
void mountPomodoro(clockSection); // focus timer, tucked under the quote
mountMemo(app);
const noise = await mountNoise(app);
mountSearch(); // floating icon (top-left) + overlay — not part of the column
void mountWelcome(noise); // first-visit greeting; offers to turn on the soundscape
