/**
 * Marquee — bandeau défilant infini.
 *
 * Deux corrections par rapport à la version d'origine (portfolio) :
 *
 *  1. la vitesse est exprimée en pixels par seconde, pas en durée fixe. Avec
 *     une durée fixe, un bandeau court défilait lentement et un bandeau long
 *     filait — deux marquees sur une même page n'étaient jamais d'accord.
 *     Ici la durée est recalculée depuis la largeur mesurée.
 *  2. le contenu est dupliqué autant de fois qu'il en faut pour couvrir la
 *     largeur du conteneur. Une seule copie ne suffit pas si le contenu est
 *     plus étroit que l'écran : la boucle laissait un trou.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface MarqueeOptions {
  /** Vitesse en px/s. Défaut : 60. */
  speed?: number;
  /** Sens de défilement. Défaut : `left`. */
  direction?: "left" | "right";
  /** Suspendre au survol. Défaut : false. */
  pauseOnHover?: boolean;
  /** Espace entre deux copies, unité CSS. Défaut : `0px`. */
  gap?: string;
}

const defaults = {
  speed: 60,
  direction: "left" as const,
  pauseOnHover: false,
  gap: "0px",
};

export function createMarquee(
  element: HTMLElement,
  options: MarqueeOptions = {},
): NovaInstance<MarqueeOptions> {
  let config = mergeOptions(defaults, options);

  // Le contenu d'origine est mis de côté : `destroy` doit pouvoir le rendre.
  const original = Array.from(element.childNodes);
  let track: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function build(): void {
    element.dataset.novaMarquee = "";
    element.textContent = "";

    track = document.createElement("div");
    track.className = "nova-marquee__track";

    const group = document.createElement("div");
    group.className = "nova-marquee__group";
    for (const node of original) group.appendChild(node.cloneNode(true));
    track.appendChild(group);

    element.appendChild(track);
    measure();
  }

  /**
   * Mesure une copie, en déduit combien il en faut et à quelle vitesse animer.
   * L'animation translate de `-100% / copies` : c'est exactement une copie,
   * donc la boucle est invisible quel que soit leur nombre.
   */
  function measure(): void {
    if (!track || !isBrowser) return;

    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return;

    // L'écart est posé AVANT la mesure : il fait partie de la largeur d'une
    // copie (padding interne), sinon le pas de boucle serait faux.
    element.style.setProperty("--nova-marquee-gap", config.gap);

    const groupWidth = first.getBoundingClientRect().width;
    if (groupWidth === 0) return;

    const containerWidth = element.getBoundingClientRect().width;
    // Au moins deux copies (une visible, une qui arrive), et assez pour couvrir
    // le conteneur sans trou.
    const needed = Math.max(2, Math.ceil(containerWidth / groupWidth) + 1);

    while (track.children.length > needed) track.lastElementChild?.remove();
    while (track.children.length < needed) {
      const clone = first.cloneNode(true) as HTMLElement;
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }

    const copies = track.children.length;
    element.style.setProperty("--nova-marquee-shift", `${-100 / copies}%`);
    element.style.setProperty(
      "--nova-marquee-duration",
      `${groupWidth / config.speed}s`,
    );
    element.dataset.novaMarqueeDirection = config.direction;
    element.dataset.novaMarqueePause = config.pauseOnHover ? "hover" : "none";
    // En mouvement réduit, le bandeau se fige : il reste lisible, il ne défile pas.
    element.dataset.novaMarqueeState = prefersReducedMotion()
      ? "paused"
      : "running";
  }

  build();

  if (isBrowser && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(element);
  }

  return {
    element,
    update(next) {
      config = mergeOptions(config, next);
      measure();
    },
    destroy() {
      resizeObserver?.disconnect();
      resizeObserver = null;
      element.textContent = "";
      for (const node of original) element.appendChild(node);
      delete element.dataset.novaMarquee;
      delete element.dataset.novaMarqueeDirection;
      delete element.dataset.novaMarqueePause;
      delete element.dataset.novaMarqueeState;
      for (const prop of [
        "--nova-marquee-gap",
        "--nova-marquee-shift",
        "--nova-marquee-duration",
      ]) {
        element.style.removeProperty(prop);
      }
    },
  };
}
