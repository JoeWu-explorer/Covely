// Lazy-initialized AudioContext shared across all sound modules.
// Browsers require a user gesture before audio plays, so we only create the
// context on first request and resume() it each time in case it's suspended.

/** @type {AudioContext | null} */
let ctx = null;

export function getAudioContext() {
  if (!ctx) {
    const Ctor =
      /** @type {typeof AudioContext} */ (
        /** @type {any} */ (window).AudioContext ||
          /** @type {any} */ (window).webkitAudioContext
      );
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
