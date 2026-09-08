/**
 * BrushUnderline — un trait de marqueur derrière un mot.
 *
 * Le trait n'est pas une forme CSS : c'est un chemin SVG passé dans un
 * `feTurbulence` + `feDisplacementMap`, qui ronge ses bords au bruit fractal.
 * C'est ce qui le fait lire comme un vrai coup de pinceau au lieu d'un
 * rectangle arrondi. Une seconde turbulence, plus fine, mange des trous dans
 * la masse : le remplissage devient une brosse sèche, pas un aplat.
 *
 * L'implémentation d'origine était déjà sans dépendance. Deux ajouts :
 *  - le trait se peint par un rognage posé sur l'ENVELOPPE, jamais sur les
 *    chemins. Rogner les chemins ferait re-calculer le filtre à chaque image,
 *    et les bords déchiquetés grésilleraient ;
 *  - la graine du bruit est un réglage. Deux traits sur la même page avec la
 *    même graine sont identiques au pixel — ce qui se voit, et se lit comme
 *    une répétition mécanique.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { observeInView, isAlreadyInView } from "../internal/in-view";
import { mergeOptions } from "../internal/options";
import { uid } from "../internal/uid";
import type { NovaInstance, Trigger } from "../internal/types";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface BrushUnderlineOptions {
  /**
   * Couleur du trait. Défaut : `--nova-brush-color`, un jaune de surligneur.
   *
   * Ce n'est volontairement pas `--nova-accent` : le trait passe DERRIÈRE le
   * texte, il doit rester assez clair pour qu'on lise par-dessus. Une couleur
   * d'accent, faite pour porter du texte, le rend illisible.
   */
  color?: string;
  /** Durée du tracé, en ms. Défaut : 1100. */
  duration?: number;
  /** Retard avant le tracé, en ms. Défaut : 180. */
  delay?: number;
  /**
   * Graine du bruit. Deux traits de même graine sont identiques au pixel :
   * en varier une par occurrence évite l'effet de tampon. Défaut : 9.
   */
  seed?: number;
  /** Épaisseur relative du trait, entre 0 et 1. Défaut : 0.5. */
  weight?: number;
  /** Quand tracer. Défaut : `view`. */
  trigger?: Trigger;
  rootMargin?: string;
  threshold?: number;
}

const defaults = {
  duration: 1100,
  delay: 180,
  seed: 9,
  weight: 0.5,
  trigger: "view" as Trigger,
  threshold: 0.45,
};

/**
 * Corps du trait : effilé aux deux bouts, le plus gros légèrement à gauche du
 * centre — la forme d'un coup de marqueur, où la main décélère à la fin.
 */
const CORPS =
  "M4 40 C 18 24, 40 16, 70 16 C 140 14, 210 22, 250 18 " +
  "C 282 16, 304 22, 316 38 C 308 56, 280 64, 248 66 " +
  "C 200 70, 130 72, 80 68 C 42 65, 18 58, 4 40 Z";

/** Éclaboussures de soies, pour que le trait ait l'air posé à la main. */
const SOIES: Array<[number, number, number, number]> = [
  [30, 9, 3, 2],
  [95, 74, 4, 2.5],
  [180, 6, 2.5, 1.8],
  [245, 74, 3.5, 2.2],
  [298, 11, 2, 1.5],
];

export function createBrushUnderline(
  element: HTMLElement,
  options: BrushUnderlineOptions = {},
): NovaInstance<BrushUnderlineOptions> & { play(): void } {
  let config = mergeOptions(defaults, options);
  const id = uid("nova-brush");

  let couche: HTMLElement | null = null;
  let detach: (() => void) | null = null;

  function svg(nom: string, attributs: Record<string, string | number>) {
    const noeud = document.createElementNS(SVG_NS, nom);
    for (const [cle, valeur] of Object.entries(attributs)) {
      noeud.setAttribute(cle, String(valeur));
    }
    return noeud;
  }

  function build(): void {
    element.dataset.novaBrush = "";

    couche = document.createElement("span");
    couche.className = "nova-brush";
    couche.setAttribute("aria-hidden", "true");

    const dessin = svg("svg", {
      viewBox: "0 0 320 80",
      preserveAspectRatio: "none",
    });

    const defs = svg("defs", {});

    /* Bruit épais : basse fréquence, fort déplacement. Le bord du trait se
       déchire en touffes irrégulières au lieu de rester un rectangle. C'est
       ce qui se lit comme « pinceau ». */
    const filtre = svg("filter", {
      id,
      x: "-8%",
      y: "-20%",
      width: "116%",
      height: "140%",
      filterUnits: "objectBoundingBox",
      primitiveUnits: "userSpaceOnUse",
    });
    filtre.append(
      svg("feTurbulence", {
        type: "fractalNoise",
        baseFrequency: "0.025 0.06",
        numOctaves: 2,
        seed: config.seed,
        result: "gros",
      }),
      svg("feDisplacementMap", {
        in: "SourceGraphic",
        in2: "gros",
        scale: 22,
        xChannelSelector: "R",
        yChannelSelector: "G",
        result: "deplace",
      }),
      /* Bruit fin superposé : il mange de petits trous dans la masse, pour
         que le remplissage ressemble à une brosse sèche et non à un plan. */
      svg("feTurbulence", {
        type: "fractalNoise",
        baseFrequency: "0.9 1.4",
        numOctaves: 2,
        seed: config.seed + 4,
        result: "grain",
      }),
      svg("feComposite", {
        in: "deplace",
        in2: "grain",
        operator: "in",
        result: "grene",
      }),
    );
    const fusion = svg("feMerge", {});
    fusion.append(
      svg("feMergeNode", { in: "deplace" }),
      svg("feMergeNode", { in: "grene" }),
    );
    filtre.appendChild(fusion);

    /* Halo : bruit encore plus gros et déplacement plus large, pour imiter
       l'encre humide qui bave hors du corps du marqueur. */
    const halo = svg("filter", {
      id: `${id}-halo`,
      x: "-15%",
      y: "-30%",
      width: "130%",
      height: "160%",
      filterUnits: "objectBoundingBox",
      primitiveUnits: "userSpaceOnUse",
    });
    halo.append(
      svg("feTurbulence", {
        type: "fractalNoise",
        baseFrequency: "0.015 0.04",
        numOctaves: 2,
        seed: config.seed + 9,
        result: "bruit",
      }),
      svg("feDisplacementMap", {
        in: "SourceGraphic",
        in2: "bruit",
        scale: 30,
        xChannelSelector: "R",
        yChannelSelector: "G",
      }),
      svg("feGaussianBlur", { stdDeviation: 1.2 }),
    );

    defs.append(filtre, halo, svg("path", { id: `${id}-corps`, d: CORPS }));
    dessin.appendChild(defs);

    const couleur = config.color ?? "var(--nova-brush-color, #facc15)";
    const epaisseur = 0.6 + config.weight * 0.9;

    // Le halo d'abord, délibérément plus large.
    dessin.appendChild(
      svg("use", {
        href: `#${id}-corps`,
        fill: couleur,
        opacity: 0.18,
        filter: `url(#${id}-halo)`,
        transform: `scale(1.04 ${1.18 * epaisseur}) translate(-6 -7)`,
      }),
    );
    // Puis le corps, le vrai coup de marqueur.
    dessin.appendChild(
      svg("use", {
        href: `#${id}-corps`,
        fill: couleur,
        opacity: 0.92,
        filter: `url(#${id})`,
        transform: `scale(1 ${epaisseur})`,
      }),
    );

    const soies = svg("g", {
      filter: `url(#${id})`,
      fill: couleur,
      opacity: 0.75,
    });
    for (const [cx, cy, rx, ry] of SOIES) {
      soies.appendChild(svg("ellipse", { cx, cy, rx, ry }));
    }
    dessin.appendChild(soies);

    couche.appendChild(dessin);
    couche.style.setProperty("--nova-brush-duration", `${config.duration}ms`);
    couche.style.setProperty("--nova-brush-delay", `${config.delay}ms`);
    // Le trait est posé AVANT le contenu, mais reste derrière par son
    // `z-index` : l'insérer après ferait passer le pinceau sur le texte.
    element.insertBefore(couche, element.firstChild);
  }

  function play(): void {
    element.dataset.novaBrushState = "shown";
  }

  function arm(): void {
    detach?.();
    detach = null;
    if (!isBrowser) return;

    // Mouvement réduit : le trait est là, il ne se peint simplement pas.
    if (prefersReducedMotion() || config.trigger === "mount") return play();
    if (config.trigger === "manual") return;
    // Même garde-fou que Reveal : un trait déjà lu ne s'efface pas pour se
    // repeindre aussitôt.
    if (isAlreadyInView(element)) return play();

    element.dataset.novaBrushState = "hidden";
    detach = observeInView(element, (visible) => visible && play(), {
      rootMargin: config.rootMargin,
      threshold: config.threshold,
      once: true,
    });
  }

  if (isBrowser) {
    build();
    arm();
  }

  return {
    element,
    play,
    update(next) {
      const rebuilds =
        next.color !== undefined ||
        next.seed !== undefined ||
        next.weight !== undefined;
      config = mergeOptions(config, next);
      if (rebuilds) {
        couche?.remove();
        build();
        arm();
      } else if (couche) {
        couche.style.setProperty("--nova-brush-duration", `${config.duration}ms`);
        couche.style.setProperty("--nova-brush-delay", `${config.delay}ms`);
      }
    },
    destroy() {
      detach?.();
      detach = null;
      couche?.remove();
      couche = null;
      delete element.dataset.novaBrush;
      delete element.dataset.novaBrushState;
    },
  };
}
