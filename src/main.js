// Shared mount logic for both targets. Mounts P0 modules into #app.

import { mountAtmosphere } from "./modules/atmosphere.js";
import { mountClock } from "./modules/clock.js";
import { mountQuote } from "./modules/quote.js";
import { mountSearch } from "./modules/search.js";
import { mountMemo } from "./modules/memo.js";
import { mountNoise } from "./modules/noise.js";

const app = document.getElementById("app");
if (!app) throw new Error("Covely: #app element not found");

mountAtmosphere();
const clockSection = mountClock(app);
mountQuote(clockSection); // encouraging line, tucked under the date
mountMemo(app);
void mountNoise(app);
mountSearch(); // floating icon (top-left) + overlay — not part of the column
