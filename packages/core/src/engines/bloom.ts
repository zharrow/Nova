/**
 * Bloom — un panneau qui jaillit d'un point et s'y referme.
 *
 * Une bulle naît là où on a cliqué, grossit en ondulant, se fige en rectangle
 * centré, puis son contenu se résout du flou vers le net. La fermeture rejoue
 * le même geste à l'envers, un peu plus vite.
 *
 * Porté de `VisionneuseVerre` (Bât-et-Verre). La voie WebGL de l'original —
 * un shader de verre avec réfraction — n'est pas reprise : elle appartient à
 * cette maison-là. Ce qui se généralise est le GESTE, et c'est le repli DOM de
 * l'original qui le porte.
 *
 * ── Ce que le moteur fait, et ce qu'il ne fait pas ──────────────────────────
 *
 * Il ne fait QUE le mouvement. Le piège de focus, la fermeture par Échap, le
 * verrou du défilement, l'ARIA, le portail : tout cela est le travail du
 * `Dialog` de Radix, et le composant React de Nova s'y branche. Voir
 * DEPENDANCES.md — Radix la sémantique, Nova le geste.
 *
 * ── Le contrat, côté markup ─────────────────────────────────────────────────
 *
 *   data-nova-bloom-media   ce qui se résout du flou vers le net
 *   data-nova-bloom-late    ce qui arrive en dernier — légende, bouton fermer
 *   data-nova-bloom-veil    le fond, s'il est à animer
 */

import { gsap } from "gsap";
import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";

export interface BloomOptions {
  /** Point de départ, en coordonnées viewport — là où on a cliqué. */
  origin: { x: number; y: number };
  /** Rapport largeur/hauteur du panneau final. Défaut : 3 / 2. */
  aspect?: number;
  /** Fraction de la hauteur de fenêtre occupée au plus. Défaut : 0.82. */
  maxHeight?: number;
  /** Fraction de la largeur de fenêtre occupée au plus. Défaut : 0.86. */
  maxWidth?: number;
  /** Diamètre de la bulle de départ, en px. Défaut : 46. */
  seed?: number;
  /** Rayon du panneau posé, unité CSS. Défaut : `1rem`. */
  radius?: string;
  /** Durée de l'ouverture, en s. Défaut : 0.8. */
  duration?: number;
  /** Accélération de la fermeture. Défaut : 1.5. */
  closeSpeed?: number;
}

const defaults = {
  aspect: 3 / 2,
  maxHeight: 0.82,
  maxWidth: 0.86,
  seed: 46,
  radius: "1rem",
  duration: 0.8,
  closeSpeed: 1.5,
};

export interface BloomInstance {
  readonly element: HTMLElement;
  /** Joue l'ouverture. */
  open(): void;
  /** Rejoue le geste à l'envers. La promesse se résout à la fin. */
  close(): Promise<void>;
  update(next: Partial<BloomOptions>): void;
  destroy(): void;
}

/**
 * Un blob : quatre rayons de coin asymétriques, tirés au hasard.
 *
 * C'est ce qui empêche la bulle de ressembler à un cercle qu'on redimensionne.
 * Tiré à chaque ouverture : deux clics de suite ne donnent jamais la même
 * déformation, et le geste garde l'air d'une matière plutôt que d'une
 * interpolation.
 */
function blob(): string {
  const r = () => Math.round(28 + Math.random() * 44);
  return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`;
}

export function createBloom(
  panel: HTMLElement,
  options: BloomOptions,
): BloomInstance {
  let config = mergeOptions(defaults, options);
  let timeline: gsap.core.Timeline | null = null;

  const q = <T extends HTMLElement>(selecteur: string) =>
    Array.from(panel.querySelectorAll<T>(selecteur));

  /** La géométrie d'arrivée : le plus grand rectangle qui tient à l'écran. */
  function arrivee() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const hauteur = Math.min(
      config.maxHeight * vh,
      (config.maxWidth * vw) / config.aspect,
    );
    const largeur = hauteur * config.aspect;
    return {
      top: (vh - hauteur) / 2,
      left: (vw - largeur) / 2,
      width: largeur,
      height: hauteur,
    };
  }

  /** `gsap.set` sur une liste vide écrit « target not found » dans la console
   *  du consommateur. Une visionneuse sans légende ni voile est parfaitement
   *  légitime : on ne vise que ce qui existe. */
  function poser(elements: HTMLElement[], props: gsap.TweenVars): void {
    if (elements.length) gsap.set(elements, props);
  }

  function poserEtatFinal(): void {
    const fin = arrivee();
    gsap.set(panel, {
      position: "fixed",
      ...fin,
      borderRadius: config.radius,
      autoAlpha: 1,
    });
    poser(q("[data-nova-bloom-media]"), {
      autoAlpha: 1,
      filter: "blur(0px)",
      scale: 1,
    });
    poser(q("[data-nova-bloom-late]"), { autoAlpha: 1, y: 0 });
    poser(q("[data-nova-bloom-veil]"), { autoAlpha: 1 });
  }

  function construire(): gsap.core.Timeline {
    const fin = arrivee();
    const graine = config.seed;
    const media = q("[data-nova-bloom-media]");
    const tardifs = q("[data-nova-bloom-late]");
    const voile = q("[data-nova-bloom-veil]");

    const tl = gsap.timeline();

    tl.set(
      panel,
      {
        position: "fixed",
        top: config.origin.y - graine / 2,
        left: config.origin.x - graine / 2,
        width: graine,
        height: graine,
        borderRadius: "50%",
        autoAlpha: 1,
      },
      0,
    );

    // La bulle est VIDE : le contenu reste caché et flou tant qu'elle n'a pas
    // pris sa place. Le montrer pendant la course donnerait une image qu'on
    // étire, pas une matière qui s'ouvre.
    if (media.length) {
      tl.set(media, { autoAlpha: 0, filter: "blur(26px)", scale: 1.08 }, 0);
    }
    if (voile.length) {
      tl.fromTo(
        voile,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3, ease: "power2.out" },
        0,
      );
    }

    // Elle jaillit : départ franc, arrivée posée.
    tl.to(
      panel,
      { ...fin, duration: config.duration, ease: "power4.out" },
      0.05,
    );

    // …en ondulant, puis se fige en rectangle.
    tl.to(
      panel,
      {
        keyframes: {
          borderRadius: [blob(), blob(), blob(), config.radius],
          easeEach: "sine.inOut",
        },
        duration: config.duration,
      },
      0.05,
    );

    // Démarre tôt : avec `power4.out`, le rectangle est déjà posé à mi-course.
    // Attendre la fin ferait traîner le geste.
    if (media.length) {
      tl.to(
        media,
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.7,
          ease: "power2.out",
        },
        config.duration * 0.62,
      );
    }

    if (tardifs.length) {
      tl.fromTo(
        tardifs,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.05,
          ease: "power4.out",
        },
        config.duration * 1.06,
      );
    }

    return tl;
  }

  return {
    element: panel,
    open() {
      if (!isBrowser) return;
      timeline?.kill();
      // GSAP anime en JavaScript : la règle CSS ne peut rien pour lui.
      if (prefersReducedMotion()) {
        poserEtatFinal();
        return;
      }
      timeline = construire();
    },
    close() {
      if (!isBrowser || prefersReducedMotion() || !timeline) {
        return Promise.resolve();
      }
      const tl = timeline;
      return new Promise((resolve) => {
        tl.eventCallback("onReverseComplete", () => resolve());
        // Ce qui s'en va n'a pas à se faire attendre.
        tl.timeScale(config.closeSpeed).reverse();
      });
    },
    update(next) {
      config = mergeOptions(config, next);
    },
    destroy() {
      timeline?.kill();
      timeline = null;
      /* Les quatre coins nommés un par un : GSAP écrit `border-radius` en
         propriétés longues, et `clearProps: "borderRadius"` ne les efface pas.
         Sans ça, un panneau rouvert repartirait du `50%` de la bulle
         précédente au lieu de son état neuf. */
      gsap.set(panel, {
        clearProps:
          "position,top,left,width,height,opacity,visibility," +
          "borderRadius,borderTopLeftRadius,borderTopRightRadius," +
          "borderBottomLeftRadius,borderBottomRightRadius",
      });
      // Le contenu aussi : il garde sinon son flou et sa transparence.
      poser(
        [
          ...q("[data-nova-bloom-media]"),
          ...q("[data-nova-bloom-late]"),
          ...q("[data-nova-bloom-veil]"),
        ],
        { clearProps: "opacity,visibility,filter,transform" },
      );
    },
  };
}
