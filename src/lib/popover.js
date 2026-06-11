// Shared popover wiring: a trigger button toggles a hidden menu; clicking
// outside or pressing Escape closes it (Escape also returns focus to the
// trigger). Used by the atmosphere phase control and the sound variant pickers.

/**
 * @param {{ root: HTMLElement, trigger: HTMLButtonElement, menu: HTMLElement }} parts
 *   root — wraps trigger + menu; clicks inside it don't count as "outside".
 * @returns {{ open: () => void, close: () => void }}
 */
export function wirePopover({ root, trigger, menu }) {
  function open() {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("keydown", onKey, true);
  }
  function close() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutside, true);
    document.removeEventListener("keydown", onKey, true);
  }
  /** @param {PointerEvent} e */
  function onOutside(e) {
    if (!root.contains(/** @type {Node} */ (e.target))) close();
  }
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === "Escape") { close(); trigger.focus(); }
  }

  trigger.addEventListener("click", () => {
    if (menu.hidden) open(); else close();
  });

  return { open, close };
}
