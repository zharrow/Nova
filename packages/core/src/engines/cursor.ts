/**
 * Cursor — curseur additif.
 *
 * Un disque qui suit le pointeur en retard (lerp) et grossit au survol des
 * éléments interactifs. Porté du portfolio, dont le parti pris d'accessibilité
 * est conservé : le curseur système reste visible, Nova ne fait que l'augmenter.
 * Le `mix-blend-mode: difference` de la feuille de style le rend lisible sur
 * fond clair comme sur fond sombre.
 *
 * Désactivé au tactile et en `prefers-reduced-motion`.
 */

import { isBrowser, isFinePointer, prefersReducedMotion } from "../internal/env";
import { acquirePointerTracking, pointerState } from "../internal/pointer";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface CursorOptions {
  /** Coefficient de rattrapage par frame, entre 0 et 1. Défaut : 0.2. */
  lerp?: number;
  /** Facteur d'agrandissement au survol d'un élément interactif. Défaut : 2.6. */
  hoverScale?: number;
  /** Ce qui déclenche l'agrandissement. */
  hoverSelector?: string;
}

const defaults = {
  lerp: 0.2,
  hoverScale: 2.6,
  hoverSelector:
    'a, button, [role="button"], input, textarea, select, label, [data-nova-cursor-hover]',
};

export function createCursor(
  element: HTMLElement,
  options: CursorOptions = {},
): NovaInstance<CursorOptions> {
  let config = mergeOptions(defaults, options);

  element.dataset.novaCursor = "";
  element.setAttribute("aria-hidden", "true");

  // Pointeur grossier ou mouvement réduit : on ne monte rien du tout.
  if (!isBrowser || !isFinePointer() || prefersReducedMotion()) {
    element.dataset.novaCursorState = "off";
    return {
      element,
      update(next) {
        config = mergeOptions(config, next);
      },
      destroy() {
        delete element.dataset.novaCursor;
        delete element.dataset.novaCursorState;
        element.removeAttribute("aria-hidden");
      },
    };
  }

  const releasePointer = acquirePointerTracking();

  let x = pointerState.x;
  let y = pointerState.y;
  let scale = 1;
  let hovering = false;

  const onPointerOver = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    hovering = !!target?.closest?.(config.hoverSelector);
  };
  window.addEventListener("pointerover", onPointerOver, { passive: true });

  const unsubscribeTick = subscribe(() => {
    x += (pointerState.x - x) * config.lerp;
    y += (pointerState.y - y) * config.lerp;
    scale += ((hovering ? config.hoverScale : 1) - scale) * 0.15;
    element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
    element.style.opacity = pointerState.active ? "1" : "0";
  });

  element.dataset.novaCursorState = "on";

  return {
    element,
    update(next) {
      config = mergeOptions(config, next);
    },
    destroy() {
      unsubscribeTick();
      releasePointer();
      window.removeEventListener("pointerover", onPointerOver);
      element.style.removeProperty("transform");
      element.style.removeProperty("opacity");
      delete element.dataset.novaCursor;
      delete element.dataset.novaCursorState;
      element.removeAttribute("aria-hidden");
    },
  };
}
