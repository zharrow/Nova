/**
 * ScrollScene — une scène dont le défilement fournit le temps.
 *
 * Un grand bloc « scène » de plusieurs hauteurs d'écran, un enfant collant, et
 * une progression `t` de 0 à 1 qui court pendant la traversée. Tout le reste
 * s'écrit en CSS à partir de `t`.
 *
 * Généralisé depuis `DataStory` et `SessionFlow` (site Champlon), qui
 * calculaient exactement la même chose :
 *
 *     t = -rect.top / (rect.height - innerHeight)
 *
 * ── Ce que le moteur ajoute ────────────────────────────────────────────────
 *
 * Les **temps**. Un récit scrollé n'a jamais une seule progression : il en a
 * dix, chacune sur sa portion de la traversée. Les écrire à la main donne dix
 * `clamp((t - 0.2) / 0.15)` en CSS, illisibles et impossibles à ajuster. Ici
 * chaque temps est nommé et publié comme sa propre variable :
 *
 *     beats: { arrivee: [0.1, 0.35], stockage: [0.4, 0.7] }
 *     → --nova-arrivee, --nova-stockage, chacune de 0 à 1 sur sa plage
 *
 * Les **pulsations**, pour ce qui doit monter puis redescendre — un paquet qui
 * traverse, un halo qui passe :
 *
 *     pulses: { paquet: [0.2, 0.5, 0.8] }   (début, sommet, fin)
 *
 * ── Trois garde-fous ───────────────────────────────────────────────────────
 *
 *  - la mesure se fait DANS l'image d'animation, jamais dans un écouteur de
 *    défilement. Celui-ci tire des dizaines d'événements par image, et chacun
 *    forcerait un calcul de mise en page ;
 *  - la boucle ne tourne que tant que la scène est à l'écran ;
 *  - en mouvement réduit, `t` est posé une fois à sa valeur de repos — 1 par
 *    défaut, l'état d'arrivée — et aucune boucle n'est ouverte. Une scène
 *    figée à 0 serait une page vide.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView } from "../internal/in-view";
import { subscribe } from "../internal/ticker";
import { resolveEasing, type Easing } from "../internal/easing";
import { mergeOptions } from "../internal/options";
import type { NovaInstance } from "../internal/types";

export interface ScrollSceneOptions {
  /** Temps nommés : `[début, fin]` sur la traversée, publiés de 0 à 1. */
  beats?: Record<string, [number, number]>;
  /** Pulsations : `[début, sommet, fin]`, publiées de 0 à 1 à 0. */
  pulses?: Record<string, [number, number, number]>;
  /**
   * Courbe appliquée à `t` pour produire `--nova-t-eased`. Défaut :
   * smootherstep — accélère et décélère, les trajets sont moins robotiques.
   */
  easing?: Easing;
  /**
   * Valeur de `t` en mouvement réduit. Défaut : 1 — l'état d'arrivée. Une
   * scène figée à 0 serait une page vide.
   */
  restingProgress?: number;
  onProgress?: (t: number) => void;
}

const defaults = {
  restingProgress: 1,
};

/** Smootherstep : la courbe des récits scrollés, plus douce que smoothstep. */
const smootherstep = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Progression sur une sous-plage. */
const segment = (a: number, b: number, t: number) =>
  b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a));

/** Rampe triangulaire : monte jusqu'au sommet, redescend. */
const pulse = (a: number, peak: number, b: number, t: number) => {
  if (t <= a || t >= b) return 0;
  return t < peak ? (t - a) / (peak - a) : (b - t) / (b - peak);
};

export function createScrollScene(
  element: HTMLElement,
  options: ScrollSceneOptions = {},
): NovaInstance<ScrollSceneOptions> & { progress(): number } {
  let config = mergeOptions(defaults, options);
  let courbe = config.easing ? resolveEasing(config.easing) : smootherstep;

  let unsubscribeTick: (() => void) | null = null;
  let detachInView: (() => void) | null = null;
  let visible = true;
  let dernier = -1;

  element.dataset.novaScrollScene = "";

  function publier(t: number): void {
    // On n'écrit que si la valeur a bougé d'un millième : réécrire une
    // variable CSS invalide le style de tout le sous-arbre.
    if (Math.abs(t - dernier) < 0.001) return;
    dernier = t;

    element.style.setProperty("--nova-t", t.toFixed(4));
    element.style.setProperty("--nova-t-eased", courbe(t).toFixed(4));

    for (const [nom, [a, b]] of Object.entries(config.beats ?? {})) {
      element.style.setProperty(`--nova-${nom}`, segment(a, b, t).toFixed(4));
    }
    for (const [nom, [a, peak, b]] of Object.entries(config.pulses ?? {})) {
      element.style.setProperty(`--nova-${nom}`, pulse(a, peak, b, t).toFixed(4));
    }

    config.onProgress?.(t);
  }

  function mesurer(): number {
    const rect = element.getBoundingClientRect();
    // La course utile est la hauteur de la scène moins un écran : c'est
    // pendant ce trajet que l'enfant collant reste en place.
    const course = rect.height - window.innerHeight;
    return course > 0 ? clamp(-rect.top / course) : 0;
  }

  function run(): void {
    if (unsubscribeTick) return;
    unsubscribeTick = subscribe(() => publier(mesurer()));
  }

  function halt(): void {
    unsubscribeTick?.();
    unsubscribeTick = null;
  }

  if (isBrowser) {
    if (prefersReducedMotion()) {
      // Posé une fois, et rien ne tourne.
      publier(clamp(config.restingProgress));
    } else {
      detachInView = observeInView(
        element,
        (inView) => {
          visible = inView;
          if (inView) run();
          else halt();
        },
        { rootMargin: "0px", threshold: 0, once: false },
      );
      // Première valeur avant même l'entrée en vue : une scène à moitié
      // traversée au chargement doit s'afficher juste, pas à zéro.
      publier(mesurer());
    }
  }

  return {
    element,
    progress: () => dernier,
    update(next) {
      config = mergeOptions(config, next);
      if (next.easing !== undefined) {
        courbe = config.easing ? resolveEasing(config.easing) : smootherstep;
      }
      // Forcer la réécriture : les plages ont pu changer sans que `t` bouge.
      dernier = -1;
      publier(mesurer());
    },
    destroy() {
      halt();
      detachInView?.();
      detachInView = null;
      delete element.dataset.novaScrollScene;
      element.style.removeProperty("--nova-t");
      element.style.removeProperty("--nova-t-eased");
      for (const nom of [
        ...Object.keys(config.beats ?? {}),
        ...Object.keys(config.pulses ?? {}),
      ]) {
        element.style.removeProperty(`--nova-${nom}`);
      }
      void visible;
    },
  };
}
