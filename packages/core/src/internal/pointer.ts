/**
 * Suivi du pointeur, mutualisé.
 *
 * Un seul écouteur `pointermove` pour toute la page, quel que soit le nombre
 * de moteurs qui s'en servent — le curseur, mais aussi tout effet magnétique
 * à venir. L'écouteur se détache dès qu'il n'y a plus personne pour l'écouter.
 */

import { isBrowser } from "./env";

export const pointerState = {
  x: 0,
  y: 0,
  /** Faux tant que le pointeur n'a pas bougé une première fois. */
  active: false,
};

let refCount = 0;
let detach: (() => void) | null = null;

function onPointerMove(event: PointerEvent): void {
  pointerState.x = event.clientX;
  pointerState.y = event.clientY;
  pointerState.active = true;
}

function onPointerLeave(): void {
  pointerState.active = false;
}

/** Démarre le suivi (idempotent). Renvoie la fonction de relâchement. */
export function acquirePointerTracking(): () => void {
  if (!isBrowser) return () => {};

  if (refCount === 0) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave, { passive: true });
    detach = () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }
  refCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount--;
    if (refCount === 0) {
      detach?.();
      detach = null;
      pointerState.active = false;
    }
  };
}
