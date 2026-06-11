// Lazy-initialized AudioContext shared across all sound modules.
// Browsers require a user gesture before audio plays, so we only create the
// context on first request and resume() it each time in case it's suspended.

/** @type {AudioContext | null} */
let ctx = null;

export function getAudioContext() {
  // Some browsers close an idle context outright; a closed one can't resume.
  if (ctx && ctx.state === "closed") ctx = null;
  if (!ctx) {
    const Ctor =
      /** @type {typeof AudioContext} */ (
        /** @type {any} */ (window).AudioContext ||
          /** @type {any} */ (window).webkitAudioContext
      );
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Like getAudioContext(), but waits for a suspended context to actually resume
 * before returning, so callers can schedule against a live currentTime.
 * (Scheduling against a suspended context uses its frozen clock — every ramp
 * and stop time lands in the past once it wakes.) Resolves with the context
 * even when resume() is blocked by autoplay policy; playback then stays
 * queued until a user gesture unlocks it.
 */
export async function ensureAudioContext() {
  const ac = getAudioContext();
  if (ac.state === "suspended") {
    try { await ac.resume(); } catch {}
  }
  return ac;
}
