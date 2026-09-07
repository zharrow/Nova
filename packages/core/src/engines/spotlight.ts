/**
 * Spotlight — halo de repérage qui suit le curseur dans un panneau.
 *
 * Le moteur ne dessine rien : il publie la position du curseur dans le repère
 * du panneau, en `--nova-spot-x` / `--nova-spot-y`. Le dessin appartient au
 * CSS du projet — un dégradé radial, une trame qui se relève, ce qu'on veut.
 *
 * Porté de `RegLight` (KaopyX), dont les deux garde-fous sont conservés :
 *
 *  - pointeur fin uniquement. Au doigt, `pointerenter` reste armé après le
 *    relâchement et le halo se fige au milieu du panneau ;
 *  - le relevé du rectangle se fait DANS l'image d'animation, jamais dans
 *    l'écouteur. `pointermove` tire des dizaines d'événements par image, et
 *    chacun forcerait un calcul de mise en page.
 *
 * Et une troisième règle, moins évidente : le halo s'allume au premier
 * DÉPLACEMENT, pas à l'entrée. Allumé à l'entrée, il apparaîtrait une image à
 * sa position précédente, souvent à l'autre bout du panneau.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface SpotlightOptions {
  /**
   * Sélecteur du panneau suivi. Défaut : le parent direct de l'élément —
   * le halo est une couche posée dans le panneau qu'il éclaire.
   */
  panel?: string;
  /** Rayon du halo, unité CSS. Publié en `--nova-spot-radius`. Défaut : `18rem`. */
  radius?: string;
}

const defaults = { radius: "18rem" };

export function createSpotlight(
  element: HTMLElement,
  options: SpotlightOptions = {},
): NovaInstance<SpotlightOptions> {
  let config = mergeOptions(defaults, options);

  element.dataset.novaSpotlight = "";
  element.setAttribute("aria-hidden", "true");
  element.style.setProperty("--nova-spot-radius", config.radius);

  const panel =
    (config.panel ? element.closest<HTMLElement>(config.panel) : null) ??
    element.parentElement;

  // Pointeur grossier ou mouvement réduit : rien n'est monté du tout.
  const inert =
    !isBrowser ||
    !panel ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
    prefersReducedMotion();

  if (inert) {
    element.dataset.novaSpotlightState = "off";
    return {
      element,
      update(next) {
        config = mergeOptions(config, next);
        element.style.setProperty("--nova-spot-radius", config.radius);
      },
      destroy() {
        delete element.dataset.novaSpotlight;
        delete element.dataset.novaSpotlightState;
        element.removeAttribute("aria-hidden");
        element.style.removeProperty("--nova-spot-radius");
      },
    };
  }

  let clientX = 0;
  let clientY = 0;
  let dirty = false;
  let unsubscribeTick: (() => void) | null = null;

  function paint(): void {
    if (!dirty) return;
    dirty = false;
    const rect = panel!.getBoundingClientRect();
    element.style.setProperty("--nova-spot-x", `${clientX - rect.left}px`);
    element.style.setProperty("--nova-spot-y", `${clientY - rect.top}px`);
  }

  const onMove = (event: PointerEvent) => {
    clientX = event.clientX;
    clientY = event.clientY;
    dirty = true;
    // Le halo ne s'allume qu'ici : à l'entrée, il apparaîtrait une image à sa
    // position précédente, souvent à l'autre bout du panneau.
    element.dataset.novaSpotlightState = "on";
    // La boucle ne tourne QUE pendant que le pointeur est sur le panneau.
    // Un abonnement permanent tiendrait un rAF ouvert pour toute la page,
    // alors que dix panneaux sur neuf n'ont jamais le curseur dessus.
    if (!unsubscribeTick) unsubscribeTick = subscribe(paint);
  };
  const onLeave = () => {
    delete element.dataset.novaSpotlightState;
    unsubscribeTick?.();
    unsubscribeTick = null;
  };

  panel.addEventListener("pointermove", onMove, { passive: true });
  panel.addEventListener("pointerleave", onLeave, { passive: true });

  return {
    element,
    update(next) {
      config = mergeOptions(config, next);
      element.style.setProperty("--nova-spot-radius", config.radius);
    },
    destroy() {
      unsubscribeTick?.();
      unsubscribeTick = null;
      panel.removeEventListener("pointermove", onMove);
      panel.removeEventListener("pointerleave", onLeave);
      delete element.dataset.novaSpotlight;
      delete element.dataset.novaSpotlightState;
      element.removeAttribute("aria-hidden");
      for (const prop of [
        "--nova-spot-radius",
        "--nova-spot-x",
        "--nova-spot-y",
      ]) {
        element.style.removeProperty(prop);
      }
    },
  };
}
