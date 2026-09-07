/**
 * Blinds — le dévoilement en claustra.
 *
 * L'image apparaît derrière des lames qui se retirent une à une, comme un
 * calepinage qu'on démonte. Porté de `Claustra` (Bât-et-Verre).
 *
 * C'est un FRÈRE de `Reveal`, pas une de ses formes — voir VARIANTES.md.
 * Reveal ne fait que basculer un attribut sur un élément existant ; ici il
 * faut injecter des lames, les mesurer, les décaler. Personne qui veut un
 * simple fondu ne devrait embarquer ce code.
 *
 * Sans JavaScript, en mouvement réduit, ou pour un bloc déjà à l'écran au
 * montage : AUCUNE lame n'est posée. L'image est simplement visible. C'est la
 * même règle d'or que partout dans Nova — les lames ne couvrent qu'une fois le
 * moteur monté, et seulement pour ce qui est encore sous la ligne de
 * flottaison.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView, isAlreadyInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import type { NovaInstance, Trigger } from "../internal/types";

export interface BlindsOptions {
  /** Nombre de lames. Défaut : 6. */
  count?: number;
  /** Sens des lames. Défaut : `vertical` (des colonnes). */
  orientation?: "vertical" | "horizontal";
  /**
   * Vers où la lame se retire. Une lame verticale se retire vers le haut ou
   * le bas ; une lame horizontale vers la gauche ou la droite.
   * Défaut : `up` en vertical, `left` en horizontal.
   */
  retract?: "up" | "down" | "left" | "right";
  /** Décalage entre deux lames, en ms. Défaut : 55. */
  stagger?: number;
  /** Durée du retrait d'une lame, en ms. Défaut : 650. */
  duration?: number;
  /** Retard avant la première lame, en ms. Défaut : 0. */
  delay?: number;
  /** Timing CSS. Défaut : la courbe expo de Nova. */
  easing?: string;
  /** Couleur des lames. Défaut : la couleur de fond héritée. */
  color?: string;
  /** Quand jouer. Défaut : `view`. */
  trigger?: Trigger;
  rootMargin?: string;
  threshold?: number;
  onReveal?: () => void;
}

const defaults = {
  count: 6,
  orientation: "vertical" as const,
  stagger: 55,
  duration: 650,
  delay: 0,
  trigger: "view" as Trigger,
};

export function createBlinds(
  element: HTMLElement,
  options: BlindsOptions = {},
): NovaInstance<BlindsOptions> & { play(): void } {
  let config = mergeOptions(defaults, options);
  let couche: HTMLElement | null = null;
  let detach: (() => void) | null = null;
  let fin: ReturnType<typeof setTimeout> | null = null;

  function retrait(): "up" | "down" | "left" | "right" {
    if (config.retract) return config.retract;
    return config.orientation === "vertical" ? "up" : "left";
  }

  function build(): void {
    element.dataset.novaBlinds = config.orientation;
    element.dataset.novaBlindsRetract = retrait();

    couche = document.createElement("span");
    couche.className = "nova-blinds";
    couche.setAttribute("aria-hidden", "true");
    couche.style.setProperty("--nova-blinds-duration", `${config.duration}ms`);
    if (config.easing) {
      couche.style.setProperty("--nova-blinds-easing", config.easing);
    }
    if (config.color) {
      couche.style.setProperty("--nova-blinds-color", config.color);
    }

    for (let index = 0; index < config.count; index++) {
      const lame = document.createElement("span");
      lame.className = "nova-blind";
      lame.style.setProperty(
        "--nova-blind-delay",
        `${config.delay + index * config.stagger}ms`,
      );
      couche.appendChild(lame);
    }

    element.appendChild(couche);
  }

  function play(): void {
    element.dataset.novaBlindsState = "shown";
    if (fin) clearTimeout(fin);
    if (config.onReveal) {
      const total =
        config.delay + (config.count - 1) * config.stagger + config.duration;
      fin = setTimeout(() => config.onReveal?.(), total);
    }
  }

  function arm(): void {
    detach?.();
    detach = null;
    if (!isBrowser) return;

    // Rien à poser : le contenu reste visible tel quel.
    if (prefersReducedMotion()) return;
    if (config.trigger === "manual") return;

    if (config.trigger === "mount") {
      build();
      element.dataset.novaBlindsState = "hidden";
      // Une image d'écart pour que les lames soient peintes avant de se
      // retirer : sans elle, rien ne s'anime.
      requestAnimationFrame(() => requestAnimationFrame(play));
      return;
    }

    // Déjà à l'écran : on ne pose pas de lames pour les retirer aussitôt.
    if (isAlreadyInView(element)) return;

    build();
    element.dataset.novaBlindsState = "hidden";
    detach = observeInView(element, (visible) => visible && play(), {
      rootMargin: config.rootMargin,
      threshold: config.threshold,
      once: true,
    });
  }

  if (isBrowser) arm();

  return {
    element,
    play,
    update(next) {
      const rebuilds =
        next.count !== undefined ||
        next.orientation !== undefined ||
        next.retract !== undefined ||
        next.color !== undefined;
      config = mergeOptions(config, next);
      if (rebuilds) {
        couche?.remove();
        couche = null;
        arm();
      }
    },
    destroy() {
      detach?.();
      detach = null;
      if (fin) clearTimeout(fin);
      couche?.remove();
      couche = null;
      for (const cle of [
        "novaBlinds",
        "novaBlindsRetract",
        "novaBlindsState",
      ]) {
        delete element.dataset[cle];
      }
    },
  };
}
