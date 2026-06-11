// Shared dialog exit sequence for the welcome / feedback modals:
// add 'leaving' to scrim + card → wait for the card's exit animation → remove
// both nodes. Runs finish exactly once even though both the animationend
// listener and the reduced-motion fallback timeout can fire; and because
// animationend bubbles up from child elements, the listener filters by
// e.animationName instead of relying on {once:true} (which an unrelated child
// animation could consume).

/**
 * @param {{
 *   scrim: HTMLElement,
 *   card: HTMLElement,
 *   animationName?: string,
 *   fallbackMs?: number,
 *   onDone?: () => void,
 * }} opts — onDone runs after the nodes are removed (e.g. to restore focus).
 */
export function dismissDialog({
  scrim,
  card,
  animationName = "dialog-out",
  fallbackMs = 700,
  onDone,
}) {
  scrim.classList.add("leaving");
  card.classList.add("leaving");

  let done = false;
  /** @param {AnimationEvent} e */
  function onAnimationEnd(e) {
    if (e.animationName === animationName) finish();
  }

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    card.removeEventListener("animationend", onAnimationEnd);
    scrim.remove();
    card.remove();
    onDone?.();
  }

  card.addEventListener("animationend", onAnimationEnd);
  const timer = setTimeout(finish, fallbackMs);
}
