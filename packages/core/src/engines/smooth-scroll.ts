/**
 * SmoothScroll — le défilement lissé, sur Lenis.
 *
 * Il revient dans quatre projets sur huit, toujours avec Lenis, et toujours
 * avec les mêmes réglages. C'est la deuxième pièce que la règle du zéro
 * dépendance interdisait : écrire un défilement à inertie qui ne casse ni les
 * ancres, ni le clavier, ni la molette d'un trackpad, c'est un projet à soi
 * tout seul.
 *
 * Trois différences avec un montage direct de Lenis :
 *
 *  - **la boucle est celle de Nova.** Lenis ouvre sa propre `requestAnimationFrame`
 *    par défaut. Ici il partage le ticker de la librairie : une seule boucle
 *    pour le défilement, les compteurs, le curseur et les bandeaux ;
 *  - **le tactile reste natif.** Lisser un défilement au doigt lui retire son
 *    inertie système, celle que l'utilisateur connaît, pour la remplacer par
 *    une autre. On ne la remplace pas ;
 *  - **rien n'est monté en `prefers-reduced-motion`.** Pas « moins lissé » :
 *    absent. Le défilement natif est ce que le réglage demande.
 */

import Lenis from "lenis";
import { isBrowser, prefersReducedMotion } from "../internal/env";
import { subscribe } from "../internal/ticker";
import { mergeOptions } from "../internal/options";

export interface SmoothScrollOptions {
  /**
   * Rattrapage par image, entre 0 et 1. Plus bas, plus glissant.
   * Défaut : 0.1.
   */
  lerp?: number;
  /** Multiplicateur de la molette. Défaut : 1. */
  wheelMultiplier?: number;
  /**
   * Lisser aussi le tactile. Défaut : false — l'inertie du système est celle
   * que l'utilisateur connaît, et elle est meilleure que la nôtre.
   */
  smoothTouch?: boolean;
  /** Sens du défilement. Défaut : `vertical`. */
  orientation?: "vertical" | "horizontal";
}

const defaults = {
  lerp: 0.1,
  wheelMultiplier: 1,
  smoothTouch: false,
  orientation: "vertical" as const,
};

export interface SmoothScrollInstance {
  /** L'instance Lenis, ou `null` si rien n'a été monté. */
  readonly lenis: Lenis | null;
  /** Suspend le défilement — pour une modale, un menu plein écran. */
  stop(): void;
  /** Le reprend. */
  start(): void;
  /** Défile jusqu'à une cible. Sans Lenis, retombe sur le défilement natif. */
  scrollTo(target: string | number | HTMLElement, options?: { offset?: number }): void;
  destroy(): void;
}

export function createSmoothScroll(
  options: SmoothScrollOptions = {},
): SmoothScrollInstance {
  const config = mergeOptions(defaults, options);

  // Rien n'est monté : ni en rendu serveur, ni quand le réglage système
  // demande moins de mouvement.
  if (!isBrowser || prefersReducedMotion()) {
    return {
      lenis: null,
      stop() {},
      start() {},
      scrollTo(target, opts) {
        if (!isBrowser) return;
        if (typeof target === "number") {
          window.scrollTo({ top: target + (opts?.offset ?? 0) });
          return;
        }
        const noeud =
          typeof target === "string"
            ? document.querySelector<HTMLElement>(target)
            : target;
        if (!noeud) return;
        // `scrollIntoView` ne connaît pas de décalage : on passe par la
        // position absolue, sinon un en-tête collant masquerait la cible.
        const haut =
          noeud.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0);
        window.scrollTo({ top: haut, behavior: "smooth" });
      },
      destroy() {},
    };
  }

  const lenis = new Lenis({
    lerp: config.lerp,
    wheelMultiplier: config.wheelMultiplier,
    syncTouch: config.smoothTouch,
    orientation: config.orientation,
    // Nova fournit la boucle : Lenis ne doit pas ouvrir la sienne.
    autoRaf: false,
  });

  // Lenis attend un horodatage en millisecondes — celui de `requestAnimationFrame`,
  // que le ticker de Nova transmet tel quel.
  const unsubscribe = subscribe((now) => lenis.raf(now));

  return {
    lenis,
    stop: () => lenis.stop(),
    start: () => lenis.start(),
    scrollTo: (target, opts) =>
      lenis.scrollTo(target as never, { offset: opts?.offset ?? 0 }),
    destroy() {
      unsubscribe();
      lenis.destroy();
    },
  };
}
