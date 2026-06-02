// Dual-target build: produces build/extension/ and build/web/ from a shared src/.
// Usage: node build.mjs [--target=extension|web] [--watch]

import { build, context } from "esbuild";
import { cp, mkdir, rm, readFile } from "node:fs/promises";
import { join, basename } from "node:path";

// Single source of truth for the app version: the extension manifest. Inlined
// into the bundle via `define` so feedback can stamp reports with it.
const { version } = JSON.parse(await readFile("shell/manifest.json", "utf8"));

const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");
const onlyArg = [...args].find((a) => a.startsWith("--target="));
const only = onlyArg?.split("=")[1];

/** @type {Array<{ name: string, entry: string, outdir: string, htmlIn: string, htmlOut: string, extras?: string[] }>} */
const targets = [
  {
    name: "extension",
    entry: "src/entry-extension.js",
    outdir: "build/extension",
    htmlIn: "shell/newtab.html",
    htmlOut: "newtab.html",
    extras: ["shell/manifest.json"],
  },
  {
    name: "web",
    entry: "src/entry-web.js",
    outdir: "build/web",
    htmlIn: "shell/index.html",
    htmlOut: "index.html",
    extras: ["shell/CNAME"],
  },
];

async function buildOne(t) {
  await rm(t.outdir, { recursive: true, force: true });
  await mkdir(t.outdir, { recursive: true });

  /** @type {import('esbuild').BuildOptions} */
  const opts = {
    entryPoints: [t.entry],
    bundle: true,
    format: "esm",
    target: "chrome120",
    outfile: join(t.outdir, "bundle.js"),
    sourcemap: true,
    legalComments: "none",
    // Full minify keeps the shipped bundle small now that CodeMirror is bundled.
    // It includes minifySyntax, which DCE's the `if (false)` branches from
    // `define` substitution — so the web bundle still has zero chrome.* refs.
    // A sourcemap is emitted for debugging the minified output.
    minify: true,
    define: {
      "process.env.COVELY_TARGET": JSON.stringify(t.name),
      "process.env.COVELY_VERSION": JSON.stringify(version),
    },
  };

  if (watch) {
    const ctx = await context(opts);
    await ctx.watch();
    console.log(`[build] watching ${t.name}`);
  } else {
    await build(opts);
  }

  await cp(t.htmlIn, join(t.outdir, t.htmlOut));
  await cp("newtab.css", join(t.outdir, "newtab.css"));
  // Copy audio assets (preserve directory structure: assets/sounds/*.mp3).
  // SOURCES.md is excluded — it's repo-only documentation.
  await cp("assets/sounds", join(t.outdir, "assets/sounds"), {
    recursive: true,
    filter: (src) => !src.endsWith("SOURCES.md"),
  });
  // Brand wordmark (used as a CSS mask so it follows the theme color).
  await cp("assets/covely-wordmark.svg", join(t.outdir, "assets/covely-wordmark.svg"));
  for (const extra of t.extras ?? []) {
    await cp(extra, join(t.outdir, basename(extra))).catch((err) => {
      // CNAME is optional during local development
      if (err.code !== "ENOENT") throw err;
    });
  }
}

for (const t of targets) {
  if (only && only !== t.name) continue;
  await buildOne(t);
}

if (!watch) console.log(`[build] done${only ? ` (${only})` : " (both targets)"}`);
