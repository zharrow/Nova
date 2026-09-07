/**
 * Reveal — apparition au scroll, avec garde-fous.
 *
 * Porté de `useReveal` (Bât-et-Verre 3D), qui est la meilleure version du
 * motif dans les projets d'origine. Sa règle d'or :
 *
 *   l'état par défaut est VISIBLE — jamais d'`opacity: 0` orphelin.
 *
 * Concrètement, l'animation ne s'arme que pour le contenu réellement situé
 * sous la ligne de flottaison. Ce qui est déjà à l'écran au montage, le rendu
 * sans JS et `prefers-reduced-motion` restent affichés tels quels. C'est ce
 * qui évite le défaut classique de ces librairies : un bloc resté invisible
 * parce que l'observer n'a jamais tiré.
 *
 * Le moteur ne fait que basculer `data-nova-reveal` entre `hidden` et `shown`
 * et poser quelques variables CSS ; toute la transition vit dans la feuille de
 * style, donc reste surchargeable projet par projet.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView, isAlreadyInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export type RevealVariant =
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  /** Dévoilement par masque, de haut en bas — « le joint qui s'ouvre ». */
  | "mask"
  | "scale";

export interface RevealOptions {
  /** Défaut : `slide-up`. */
  variant?: RevealVariant;
  /** Durée en ms. Défaut : 700 (1100 pour `mask`). */
  duration?: number;
  /** Retard en ms. Défaut : 0. */
  delay?: number;
  /** Amplitude du déplacement, unité CSS. Défaut : `1.5rem`. */
  distance?: string;
  /** Timing CSS. Défaut : la courbe expo de Nova. */
  easing?: string;
  /** Rejouer à chaque entrée en vue. Défaut : false. */
  repeat?: boolean;
  rootMargin?: string;
  threshold?: number;
  /**
   * Sous quelle fraction de hauteur d'écran un élément est considéré « déjà
   * visible » et donc non animé. Défaut : 0.92.
   */
  armRatio?: number;
  onReveal?: () => void;
}

const defaults = {
  variant: "slide-up" as RevealVariant,
  delay: 0,
  distance: "1.5rem",
  repeat: false,
  armRatio: 0.92,
};

export function createReveal(
  element: HTMLElement,
  options: RevealOptions = {},
): NovaInstance<RevealOptions> {
  let config = mergeOptions(defaults, options);
  let detach: (() => void) | null = null;

  function applyStyle(): void {
    element.dataset.novaRevealVariant = config.variant;
    const duration = config.duration ?? (config.variant === "mask" ? 1100 : 700);
    element.style.setProperty("--nova-reveal-duration", `${duration}ms`);
    element.style.setProperty("--nova-reveal-delay", `${config.delay}ms`);
    element.style.setProperty("--nova-reveal-distance", config.distance);
    if (config.easing) {
      element.style.setProperty("--nova-reveal-easing", config.easing);
    }
  }

  function show(): void {
    element.dataset.novaReveal = "shown";
    config.onReveal?.();
  }

  function arm(): void {
    detach?.();
    detach = null;

    if (!isBrowser) return;
    // Mouvement réduit : on n'arme rien, le contenu reste visible.
    if (prefersReducedMotion()) return;
    // Déjà à l'écran : on laisse affiché plutôt que de le cacher pour
    // l'animer aussitôt — ce serait un clignotement, pas une apparition.
    if (!config.repeat && isAlreadyInView(element, config.armRatio)) return;

    element.dataset.novaReveal = "hidden";
    detach = observeInView(
      element,
      (visible) => {
        if (visible) show();
        else if (config.repeat) element.dataset.novaReveal = "hidden";
      },
      {
        rootMargin: config.rootMargin,
        threshold: config.threshold,
        once: !config.repeat,
      },
    );
  }

  applyStyle();
  arm();

  return {
    element,
    update(next) {
      const variantChanged =
        next.variant !== undefined && next.variant !== config.variant;
      config = mergeOptions(config, next);
      applyStyle();
      if (variantChanged || next.repeat !== undefined) arm();
    },
    destroy() {
      detach?.();
      detach = null;
      delete element.dataset.novaReveal;
      delete element.dataset.novaRevealVariant;
      for (const prop of [
        "--nova-reveal-duration",
        "--nova-reveal-delay",
        "--nova-reveal-distance",
        "--nova-reveal-easing",
      ]) {
        element.style.removeProperty(prop);
      }
    },
  };
}

export interface RevealGroupOptions extends RevealOptions {
  /** Sélecteur des enfants à animer. Défaut : enfants directs. */
  selector?: string;
  /** Décalage entre deux enfants, en ms. Défaut : 80. */
  stagger?: number;
}

/**
 * Applique un reveal à une liste d'enfants avec un décalage régulier.
 *
 * Remplace le `RevealGroup` d'origine, qui clonait les enfants React pour leur
 * injecter un index — un motif qui ne survit ni au passage par un composant
 * intermédiaire, ni à un autre framework. Ici on lit le DOM : ça marche
 * partout, y compris sur du contenu rendu par autrui.
 */
export function createRevealGroup(
  container: HTMLElement,
  options: RevealGroupOptions = {},
): NovaInstance<RevealGroupOptions> {
  const { selector, stagger = 80, ...revealOptions } = options;
  let children: HTMLElement[] = [];
  let instances: NovaInstance<RevealOptions>[] = [];

  function build(): void {
    instances.forEach((instance) => instance.destroy());
    children = selector
      ? Array.from(container.querySelectorAll<HTMLElement>(selector))
      : (Array.from(container.children).filter(
          (node): node is HTMLElement => node instanceof HTMLElement,
        ));
    instances = children.map((child, index) =>
      createReveal(child, {
        ...revealOptions,
        delay: (revealOptions.delay ?? 0) + index * stagger,
      }),
    );
  }

  build();

  return {
    element: container,
    update(next) {
      Object.assign(options, next);
      build();
    },
    destroy() {
      instances.forEach((instance) => instance.destroy());
      instances = [];
    },
  };
}
