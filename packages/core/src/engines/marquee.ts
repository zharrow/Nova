/**
 * Marquee — bandeau défilant infini, horizontal ou vertical.
 *
 * Trois corrections par rapport aux versions d'origine :
 *
 *  1. la vitesse est en pixels par seconde, pas en durée fixe. Avec une durée
 *     fixe, un bandeau court défile lentement et un bandeau long file — deux
 *     bandeaux sur une même page ne sont jamais d'accord. La durée est donc
 *     recalculée depuis la taille mesurée.
 *  2. le contenu est dupliqué autant de fois qu'il faut pour couvrir le
 *     conteneur. Une seule copie ne suffit pas si le contenu est plus petit
 *     que la fenêtre : la boucle laissait un trou. C'est le défaut que
 *     `ScrollList` documentait sur l'axe vertical — six lignes dans un cadre
 *     de 330 px, et la liste réapparaissait en bloc au lieu de couler.
 *  3. hors écran, l'animation est SUSPENDUE et non coupée. `animation: none`
 *     la ferait repartir du début à chaque retour à l'écran ; une pause
 *     reprend exactement là où elle s'était arrêtée.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export type MarqueeDirection = "left" | "right" | "up" | "down";

export interface MarqueeOptions {
  /** Vitesse en px/s. Défaut : 60. */
  speed?: number;
  /** Sens de défilement. `up` et `down` basculent l'axe. Défaut : `left`. */
  direction?: MarqueeDirection;
  /** Suspendre au survol. Défaut : false. */
  pauseOnHover?: boolean;
  /** Suspendre quand le bandeau sort de l'écran. Défaut : true. */
  pauseOffscreen?: boolean;
  /** Espace entre deux copies, unité CSS. Défaut : `0px`. */
  gap?: string;
}

const defaults = {
  speed: 60,
  direction: "left" as MarqueeDirection,
  pauseOnHover: false,
  pauseOffscreen: true,
  gap: "0px",
};

const VERTICAL = new Set<MarqueeDirection>(["up", "down"]);

export function createMarquee(
  element: HTMLElement,
  options: MarqueeOptions = {},
): NovaInstance<MarqueeOptions> {
  let config = mergeOptions(defaults, options);

  // Le contenu d'origine est mis de côté : `destroy` doit pouvoir le rendre.
  const original = Array.from(element.childNodes);
  let track: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let detachInView: (() => void) | null = null;
  let visible = true;

  function isVertical(): boolean {
    return VERTICAL.has(config.direction);
  }

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
    // Posé ici et non dans `measure` : l'état de lecture dépend de la
    // visibilité et du mouvement réduit, jamais de la géométrie. `measure`
    // renonce quand le bloc n'a pas encore de taille, et emporterait l'état
    // avec lui.
    applyState();
  }

  /**
   * Mesure une copie, en déduit combien il en faut et à quelle vitesse animer.
   * L'animation translate de `-100% / copies` : exactement une copie, donc la
   * boucle est invisible quel que soit leur nombre.
   */
  function measure(): void {
    if (!track || !isBrowser) return;

    const vertical = isVertical();
    element.dataset.novaMarqueeAxis = vertical ? "y" : "x";

    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return;

    // L'écart est posé AVANT la mesure : il fait partie de la taille d'une
    // copie (padding interne), sinon le pas de boucle serait faux.
    element.style.setProperty("--nova-marquee-gap", config.gap);

    const groupBox = first.getBoundingClientRect();
    const groupSize = vertical ? groupBox.height : groupBox.width;
    if (groupSize === 0) return;

    const hostBox = element.getBoundingClientRect();
    const hostSize = vertical ? hostBox.height : hostBox.width;

    // Au moins deux copies (une visible, une qui arrive), et assez pour
    // couvrir le conteneur sans trou.
    const needed = Math.max(2, Math.ceil(hostSize / groupSize) + 1);

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
      `${groupSize / config.speed}s`,
    );
    element.dataset.novaMarqueeDirection = config.direction;
    element.dataset.novaMarqueePause = config.pauseOnHover ? "hover" : "none";
  }

  /**
   * `running` ou `paused`. En mouvement réduit, le bandeau se fige : il reste
   * lisible, il ne défile pas.
   */
  function applyState(): void {
    const running = visible && !prefersReducedMotion();
    element.dataset.novaMarqueeState = running ? "running" : "paused";
  }

  function watchVisibility(): void {
    detachInView?.();
    detachInView = null;
    if (!isBrowser || !config.pauseOffscreen) {
      visible = true;
      applyState();
      return;
    }
    detachInView = observeInView(
      element,
      (inView) => {
        visible = inView;
        applyState();
      },
      { rootMargin: "0px", threshold: 0, once: false },
    );
  }

  build();
  watchVisibility();

  if (isBrowser && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(element);
  }

  return {
    element,
    update(next) {
      const watchChanged =
        next.pauseOffscreen !== undefined &&
        next.pauseOffscreen !== config.pauseOffscreen;
      config = mergeOptions(config, next);
      measure();
      if (watchChanged) watchVisibility();
    },
    destroy() {
      resizeObserver?.disconnect();
      resizeObserver = null;
      detachInView?.();
      detachInView = null;
      element.textContent = "";
      for (const node of original) element.appendChild(node);
      for (const key of [
        "novaMarquee",
        "novaMarqueeAxis",
        "novaMarqueeDirection",
        "novaMarqueePause",
        "novaMarqueeState",
      ]) {
        delete element.dataset[key];
      }
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
