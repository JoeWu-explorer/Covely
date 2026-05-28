// Shared mount logic for both targets. Mounts P0 modules into #app.

import { mountClock } from "./modules/clock.js";
import { mountSearch } from "./modules/search.js";
import { mountMemo } from "./modules/memo.js";
import { mountNoise } from "./modules/noise.js";

const app = document.getElementById("app");
if (!app) throw new Error("Covely: #app element not found");

mountClock(app);
mountSearch(app);
mountMemo(app);
void mountNoise(app);
