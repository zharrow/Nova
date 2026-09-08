/**
 * RollText — le label qui pivote sur lui-même au survol.
 *
 * Deux exemplaires empilés dans une fenêtre de la hauteur d'une ligne : le
 * premier sort par le haut, le second entre par le bas. À l'arrivée, l'image
 * est identique à l'image de départ.
 *
 * Ce n'est pas le même geste que
 * l'effet `roll` de TextEffect : celui-là joue une fois à l'entrée en vue et
 * lettre par lettre, celui-ci répond au survol et fait pivoter le mot entier.
 *
 * Le survol se lit sur un ANCÊTRE et non sur le mot lui-même : le label d'un
 * bouton doit pivoter quand on survole le bouton, pas seulement les quelques
 * pixels du texte. Par défaut, c'est le parent direct.
 */

import { isBrowser } from "../internal/env";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface RollTextOptions {
  /** Texte du label. Défaut : le `textContent` de l'élément. */
  text?: string;
  /**
   * Sélecteur de l'ancêtre dont le survol déclenche le pivot. Défaut : le
   * parent direct. Passer `"self"` pour n'écouter que l'élément lui-même.
   */
  trigger?: string;
}

export function createRollText(
  element: HTMLElement,
  options: RollTextOptions = {},
): NovaInstance<RollTextOptions> {
  let config = mergeOptions({}, options);
  let text = config.text ?? element.textContent ?? "";

  function build(): void {
    element.textContent = "";
    element.dataset.novaRoll = "";

    const host = document.createElement("span");
    host.className = "nova-roll-text";

    const first = document.createElement("span");
    first.textContent = text;

    // Le second exemplaire est masqué aux lecteurs d'écran : le mot ne doit
    // être annoncé qu'une fois.
    const second = document.createElement("span");
    second.textContent = text;
    second.setAttribute("aria-hidden", "true");

    host.append(first, second);
    element.appendChild(host);
  }

  /**
   * Marque l'ancêtre survolé. Le pivot est piloté en CSS depuis cet attribut :
   * aucun écouteur n'est posé, c'est `:hover` qui travaille.
   */
  function markTrigger(): void {
    if (!isBrowser) return;
    const target =
      config.trigger === "self"
        ? element
        : config.trigger
          ? element.closest(config.trigger)
          : element.parentElement;
    (target ?? element).setAttribute("data-nova-roll-trigger", "");
  }

  function unmarkTrigger(): void {
    if (!isBrowser) return;
    const marked = element.closest("[data-nova-roll-trigger]");
    marked?.removeAttribute("data-nova-roll-trigger");
  }

  build();
  markTrigger();

  return {
    element,
    update(next) {
      const textChanged = next.text !== undefined && next.text !== text;
      const triggerChanged =
        next.trigger !== undefined && next.trigger !== config.trigger;
      config = mergeOptions(config, next);
      if (textChanged) {
        text = config.text ?? text;
        build();
      }
      if (triggerChanged) {
        unmarkTrigger();
        markTrigger();
      }
    },
    destroy() {
      unmarkTrigger();
      element.textContent = text;
      delete element.dataset.novaRoll;
    },
  };
}
