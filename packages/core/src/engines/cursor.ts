/**
 * Cursor — curseur additif.
 *
 * Deux formes, récoltées dans deux projets. Elles partagent le même parti pris
 * d'accessibilité : le curseur système reste visible, Nova ne fait que
 * l'augmenter. Le `mix-blend-mode: difference` de la feuille de style les rend
 * lisibles sur fond clair comme sur fond sombre.
 *
 *   `blob`      un disque unique, qui suit en retard et GROSSIT au survol des
 *               éléments interactifs (portfolio) ;
 *   `dot-ring`  un point posé exactement sur le pointeur, et un anneau qui
 *               TRAÎNE derrière lui (Bât-et-Verre 3D). Le point dit où l'on
 *               est, l'anneau dit d'où l'on vient.
 *
 * Le choix n'est pas cosmétique : le blob écrase ce qu'il survole, le point
 * ne masque rien. Sur une interface dense, la seconde forme est la seule
 * lisible.
 *
 * Désactivé au tactile et en `prefers-reduced-motion`.
 */

import { isBrowser, isFinePointer, prefersReducedMotion } from "../internal/env";
import { acquirePointerTracking, pointerState } from "../internal/pointer";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export type CursorVariant = "blob" | "dot-ring";

export interface CursorOptions {
  /** Forme du curseur. Défaut : `blob`. */
  variant?: CursorVariant;
  /** Coefficient de rattrapage par frame, entre 0 et 1. Défaut : 0.2. */
  lerp?: number;
  /** Facteur d'agrandissement au survol d'un élément interactif. Défaut : 2.6. */
  hoverScale?: number;
  /** Ce qui déclenche l'agrandissement. */
  hoverSelector?: string;
}

const defaults = {
  variant: "blob" as CursorVariant,
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
  element.dataset.novaCursorVariant = config.variant;
  element.setAttribute("aria-hidden", "true");

  /* En `dot-ring`, l'élément hôte devient un cadre fixe et porte deux pièces :
     le point suit le pointeur sans retard, l'anneau le rattrape. En `blob`,
     l'hôte EST le disque — c'est lui qu'on transforme. */
  let point: HTMLElement | null = null;
  let anneau: HTMLElement | null = null;
  if (config.variant === "dot-ring" && isBrowser) {
    point = document.createElement("span");
    point.className = "nova-cursor__dot";
    anneau = document.createElement("span");
    anneau.className = "nova-cursor__ring";
    element.append(point, anneau);
  }

  // Pointeur grossier ou mouvement réduit : on ne monte rien du tout.
  if (!isBrowser || !isFinePointer() || prefersReducedMotion()) {
    element.dataset.novaCursorState = "off";
    return {
      element,
      update(next) {
        config = mergeOptions(config, next);
      },
      destroy() {
        point?.remove();
        anneau?.remove();
        delete element.dataset.novaCursor;
        delete element.dataset.novaCursorVariant;
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
    const visible = pointerState.active ? "1" : "0";

    if (point && anneau) {
      // Le point ne lisse rien : il est SUR le pointeur. Tout le retard est
      // dans l'anneau, et c'est ce décalage qui se lit comme une traîne.
      point.style.transform = `translate(${pointerState.x}px, ${pointerState.y}px) translate(-50%, -50%)`;
      anneau.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      point.style.opacity = visible;
      anneau.style.opacity = visible;
      return;
    }

    element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
    element.style.opacity = visible;
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
      point?.remove();
      anneau?.remove();
      element.style.removeProperty("transform");
      element.style.removeProperty("opacity");
      delete element.dataset.novaCursor;
      delete element.dataset.novaCursorVariant;
      delete element.dataset.novaCursorState;
      element.removeAttribute("aria-hidden");
    },
  };
}
