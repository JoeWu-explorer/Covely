// Shared SVG icon set (Lucide-style, 24×24, 1.6 stroke). Built via the SVG
// namespace so it is CSP-safe for the MV3 extension. Color follows currentColor.

const NS = "http://www.w3.org/2000/svg";

/** @type {Record<string, Array<[string, Record<string, string|number>]>>} */
const ICONS = {
  // sound slots
  droplet: [["path", { d: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" }]],
  flame: [["path", { d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" }]],
  music: [
    ["path", { d: "M9 18V5l12-2v13" }],
    ["circle", { cx: 6, cy: 18, r: 3 }],
    ["circle", { cx: 18, cy: 16, r: 3 }],
  ],
  // time-of-day (theme control)
  sunrise: [
    ["path", { d: "M12 2v7" }], ["path", { d: "m4.93 10.93 1.41 1.41" }],
    ["path", { d: "M2 18h2" }], ["path", { d: "M20 18h2" }],
    ["path", { d: "m19.07 10.93-1.41 1.41" }], ["path", { d: "M22 22H2" }],
    ["path", { d: "m8 6 4-4 4 4" }], ["path", { d: "M16 18a4 4 0 0 0-8 0" }],
  ],
  sun: [
    ["circle", { cx: 12, cy: 12, r: 4 }],
    ["path", { d: "M12 2v2" }], ["path", { d: "M12 20v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }], ["path", { d: "m17.66 17.66 1.41 1.41" }],
    ["path", { d: "M2 12h2" }], ["path", { d: "M20 12h2" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }], ["path", { d: "m19.07 4.93-1.41 1.41" }],
  ],
  sunset: [
    ["path", { d: "M12 10V3" }], ["path", { d: "m4.93 10.93 1.41 1.41" }],
    ["path", { d: "M2 18h2" }], ["path", { d: "M20 18h2" }],
    ["path", { d: "m19.07 10.93-1.41 1.41" }], ["path", { d: "M22 22H2" }],
    ["path", { d: "m16 5-4 4-4-4" }], ["path", { d: "M16 18a4 4 0 0 0-8 0" }],
  ],
  moon: [["path", { d: "M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
  clock: [["circle", { cx: 12, cy: 12, r: 9 }], ["path", { d: "M12 7v5l3 2" }]],
  search: [["circle", { cx: 11, cy: 11, r: 8 }], ["path", { d: "m21 21-4.3-4.3" }]],
  message: [["path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }]],
  // memo actions
  copy: [
    ["rect", { width: 13, height: 13, x: 9, y: 9, rx: 2 }],
    ["path", { d: "M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2" }],
  ],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  // pomodoro
  timer: [
    ["line", { x1: 10, x2: 14, y1: 2, y2: 2 }],
    ["line", { x1: 12, x2: 15, y1: 14, y2: 11 }],
    ["circle", { cx: 12, cy: 14, r: 8 }],
  ],
  play: [["polygon", { points: "6 4 19 12 6 20 6 4" }]],
  pause: [
    ["rect", { x: 6, y: 4, width: 4, height: 16, rx: 1 }],
    ["rect", { x: 14, y: 4, width: 4, height: 16, rx: 1 }],
  ],
  reset: [
    ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
    ["path", { d: "M3 3v5h5" }],
  ],
  skip: [
    ["polygon", { points: "5 4 15 12 5 20 5 4" }],
    ["line", { x1: 19, x2: 19, y1: 5, y2: 19 }],
  ],
  sliders: [
    ["line", { x1: 4, x2: 4, y1: 21, y2: 14 }],
    ["line", { x1: 4, x2: 4, y1: 10, y2: 3 }],
    ["line", { x1: 12, x2: 12, y1: 21, y2: 12 }],
    ["line", { x1: 12, x2: 12, y1: 8, y2: 3 }],
    ["line", { x1: 20, x2: 20, y1: 21, y2: 16 }],
    ["line", { x1: 20, x2: 20, y1: 12, y2: 3 }],
    ["line", { x1: 2, x2: 6, y1: 14, y2: 14 }],
    ["line", { x1: 10, x2: 14, y1: 8, y2: 8 }],
    ["line", { x1: 18, x2: 22, y1: 16, y2: 16 }],
  ],
  eraser: [
    ["path", { d: "m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a2 2 0 0 1 2.8 0l5.4 5.4a2 2 0 0 1 0 2.8L13 21" }],
    ["path", { d: "M22 21H7" }], ["path", { d: "m5 11 9 9" }],
  ],
};

/**
 * @param {string} name
 * @param {number} [size]
 * @returns {SVGSVGElement}
 */
export function icon(name, size = 18) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.6");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");
  for (const [tag, attrs] of ICONS[name] ?? []) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, String(attrs[k]));
    svg.appendChild(el);
  }
  return svg;
}
