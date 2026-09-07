/**
 * Expand — la substitution de deux arbres DOM, sous un voile.
 *
 * Porté de `useExpandTransition` (CRM Closer). C'est la pièce la plus
 * ambitieuse de la récolte, et celle qui a motivé l'abandon de la règle du
 * zéro dépendance : elle repose sur GSAP Flip, et la réécrire à la main
 * coûterait plusieurs centaines de lignes et une longue liste de cas limites.
 *
 * ── Le problème ─────────────────────────────────────────────────────────────
 *
 * Replié, c'est une ligne ; déplié, un panneau. Ce sont deux arbres
 * différents, et React remplace l'un par l'autre en une image : la ligne
 * DISPARAÎT pendant que l'en-tête APPARAÎT. Animer la seule hauteur ne corrige
 * rien — la boîte glisse, mais la substitution reste visible en son milieu, et
 * c'est elle qu'on lit comme un à-coup.
 *
 * ── Le geste ────────────────────────────────────────────────────────────────
 *
 *   1. la boîte s'étire, et les pièces communes glissent de leur ancienne
 *      place à la nouvelle (Flip) ;
 *   2. un voile de la couleur du repos se retire, découvrant l'état déplié.
 *      Et TOUT LE RESTE SE DÉDUIT DE CE BORD : chaque pièce change d'encre,
 *      chaque ligne nouvelle paraît, au moment précis où le bord la dépasse.
 *
 * Le voile n'est pas un effet, c'est ce qui rend le reste possible. Un fondu
 * du clair vers le sombre passe par le gris — c'est de l'arithmétique, pas un
 * réglage : à mi-chemin le fond et le texte se retrouvent à la même valeur, et
 * le texte disparaît. Un bord ne mélange rien : au-dessus une encre, au-dessous
 * l'autre, et le contraste est juste des deux côtés à chaque image.
 *
 * C'est aussi ce qui donne au geste son calendrier — on ne règle pas dix
 * retards à la main, on les lit sur une règle.
 *
 * ── Un seul geste, joué dans les deux sens ──────────────────────────────────
 *
 * Le repli n'a pas sa propre mécanique : c'est l'ouverture, posée à sa fin et
 * remontée. Tant que les deux divergeaient, le repli ramenait un à un les
 * défauts qu'on venait de retirer de l'ouverture.
 *
 * ── Le contrat, côté markup ─────────────────────────────────────────────────
 *
 *   data-nova-flip-id="…"  une pièce présente dans LES DEUX états, à raccorder
 *   data-nova-reveal       une pièce qui n'existe que déplié : elle paraît
 *   data-nova-spin         une pièce qui ne se déplace pas mais se retourne
 *   data-nova-veil         l'aplat qui se retire, et cadence tout le reste
 */

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";

gsap.registerPlugin(Flip);

const PARTAGE = "[data-nova-flip-id]";
const NOUVEAU = "[data-nova-reveal]";
const PIVOT = "[data-nova-spin]";
const VOILE = "[data-nova-veil]";
/** Tout ce qui change d'encre : les pièces appariées, et le pivot. */
const ENCRES = `${PARTAGE}, ${PIVOT}`;

/** Les deux seules propriétés qui changent d'un état à l'autre. */
const PROPRIETES = ["color", "backgroundColor"] as const;
type Encre = Record<(typeof PROPRIETES)[number], string>;

export interface ExpandOptions {
  /** Durée minimale du geste, en s. Défaut : 0.13. */
  minDuration?: number;
  /** Durée maximale, en s. Elle s'étire avec la distance parcourue. */
  maxDuration?: number;
  /** Où le voile part dans le geste, en fraction. Défaut : 0.2. */
  veilStart?: number;
  /** Durée de la descente du voile, en s. Défaut : 0.1. */
  veilDuration?: number;
  /** Durée du demi-tour du pivot, en s. Défaut : 0.06. */
  spinDuration?: number;
  /**
   * Accélération du repli. Ce qui s'en va n'a pas à se faire attendre.
   * Défaut : 1.6.
   */
  reverseSpeed?: number;
}

const defaults = {
  minDuration: 0.13,
  maxDuration: 0.18,
  veilStart: 0.2,
  veilDuration: 0.1,
  spinDuration: 0.06,
  reverseSpeed: 1.6,
};

export interface ExpandInstance {
  readonly element: HTMLElement;
  /**
   * Relève l'aspect de l'état replié. À appeler PENDANT qu'il est rendu —
   * typiquement au clic, avant que React ne le remplace. Une fois le panneau
   * rendu, ni sa hauteur ni ses encres ne sont mesurables, et ce sont elles
   * que l'ouverture prend pour départ et que le repli prend pour cible.
   */
  capture(): void;
  /** Relève la hauteur et les encres tant que la ligne repliée est là. */
  syncCollapsed(): void;
  /** Joue l'ouverture. Le panneau déplié doit déjà être rendu. */
  open(): void;
  /** Joue le repli. La promesse se résout quand on peut démonter le panneau. */
  close(): Promise<void>;
  update(next: Partial<ExpandOptions>): void;
  destroy(): void;
}

/** L'arbre déplié est le seul à porter un voile : ça suffit à le reconnaître. */
function estDeplie(element: HTMLElement): boolean {
  return Boolean(element.querySelector(VOILE));
}

/** Le pivot n'a pas de `data-nova-flip-id` : il lui faut quand même une clé. */
function cle(piece: HTMLElement): string {
  return piece.dataset.novaFlipId ?? PIVOT;
}

function releverEncres(element: HTMLElement): Map<string, Encre> {
  const encres = new Map<string, Encre>();
  for (const piece of element.querySelectorAll<HTMLElement>(ENCRES)) {
    const style = getComputedStyle(piece);
    encres.set(cle(piece), {
      color: style.color,
      backgroundColor: style.backgroundColor,
    });
  }
  return encres;
}

export function createExpand(
  element: HTMLElement,
  options: ExpandOptions = {},
): ExpandInstance {
  let config = mergeOptions(defaults, options);

  let etatFlip: Flip.FlipState | null = null;
  let encresRepliees: Map<string, Encre> | null = null;
  let hauteurRepliee = 0;
  let courante: gsap.core.Timeline | null = null;

  /**
   * GSAP anime en JavaScript : la règle CSS `prefers-reduced-motion` ne peut
   * rien pour lui. Le réglage se lit donc à la main, à chaque bascule — il
   * peut changer pendant la session.
   */
  const sansMouvement = () => prefersReducedMotion();

  function capture(): void {
    if (!isBrowser || sansMouvement() || estDeplie(element)) return;
    encresRepliees = releverEncres(element);
    etatFlip = Flip.getState(element.querySelectorAll(PARTAGE));
  }

  function syncCollapsed(): void {
    if (!isBrowser || estDeplie(element)) return;
    // Retire la hauteur laissée en ligne par un repli, après la mutation du
    // DOM et avant la peinture : sans quoi la boîte reprendrait sa taille
    // naturelle le temps d'une image.
    gsap.set(element, { clearProps: "height,overflow,pointerEvents" });
    hauteurRepliee = element.offsetHeight;
    if (!encresRepliees) encresRepliees = releverEncres(element);
  }

  /**
   * Le geste, construit une fois pour les deux sens. Il décrit toujours
   * l'OUVERTURE ; le repli le pose à sa fin et le remonte.
   */
  function construire(sens: "ouverture" | "repli"): gsap.core.Timeline {
    const ouvre = sens === "ouverture";
    /* Rendu à étaler, jamais posé tel quel : `clearProps: undefined` fait
       planter GSAP, qui appelle `.split` dessus sans vérifier. La clé doit
       être absente, pas vide. */
    const nettoie = (props: string) => (ouvre ? { clearProps: props } : null);

    const depart = hauteurRepliee;
    /* On mesure une boîte au repos, jamais une boîte en train de bouger : si
       on rebascule au milieu d'un geste, la hauteur en ligne posée par le
       précédent serait prise pour la hauteur naturelle. */
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: "height,overflow" });
    const naturelle = element.offsetHeight;

    const duree = gsap.utils.clamp(config.minDuration, config.maxDuration)(
      Math.abs(naturelle - depart) / 1800,
    );
    const tl = gsap.timeline({ paused: !ouvre });

    /* La boîte d'abord : c'est elle qui fait la place. Sans elle, le panneau
       paraîtrait à pleine hauteur et pousserait la page d'un seul coup. */
    tl.fromTo(
      element,
      { height: depart, overflow: "hidden" },
      {
        height: naturelle,
        duration: duree,
        ease: "power2.out",
        /* La hauteur repart en `auto` : un panneau figé en pixels ne suivrait
           plus son contenu. */
        ...nettoie("height,overflow"),
      },
      0,
    );

    /* Ce qui se retrouve des deux côtés, replacé sans être remplacé. Au repli
       il n'y a rien à raccorder : on anime l'arbre déplié sur lui-même. */
    if (ouvre && etatFlip) {
      tl.add(
        Flip.from(etatFlip, {
          /* Indispensable, et silencieux si on l'oublie : sans `targets`, Flip
             reconstruit l'état d'arrivée à partir des nœuds qu'il avait
             relevés — or ceux-là viennent d'être détachés par React. Il
             compare alors du vide à du vide et n'anime rien, sans erreur. */
          targets: element.querySelectorAll(PARTAGE),
          duration: duree,
          ease: "power2.out",
          /* `absolute` sortirait les pièces du flux : l'en-tête se
             réorganiserait autour d'elles pendant qu'elles glissent. */
          absolute: false,
        }),
        0,
      );
    }

    const entete = element.firstElementChild as HTMLElement | null;
    const voile = element.querySelector<HTMLElement>(VOILE);
    const cadre = entete?.getBoundingClientRect();
    const hautEntete = cadre?.top ?? 0;
    const hauteurEntete = cadre?.height || 1;

    /**
     * Le calendrier de tout ce qui se trouve dans l'en-tête.
     *
     * Une pièce ne change pas d'encre à une heure convenue : elle change quand
     * le bord du voile la dépasse. C'est ce qui fait tenir l'ensemble.
     */
    const decouverte = (piece: Element): number => {
      const boite = piece.getBoundingClientRect();
      // Le milieu de la pièce, pas son bas : le bord met une image et demie à
      // la traverser.
      const milieu = boite.top + boite.height / 2 - hautEntete;
      return (
        duree * config.veilStart +
        config.veilDuration * gsap.utils.clamp(0, 1, milieu / hauteurEntete)
      );
    };

    if (voile) {
      tl.fromTo(
        voile,
        { scaleY: 1 },
        {
          scaleY: 0,
          duration: config.veilDuration,
          /* `none`, et c'est une contrainte, pas un goût : `decouverte` déduit
             l'heure de chaque pièce de sa position, en supposant un bord à
             vitesse constante. Sous une courbe, le bord passe ailleurs qu'au
             moment calculé, et une pièce se retrouve en clair sur du clair. */
          ease: "none",
          ...nettoie("transform"),
        },
        duree * config.veilStart,
      );
    }

    /**
     * Les encres, pièce par pièce. Deux règles.
     *
     * **On ne touche que ce qui change.** Une pièce de même couleur des deux
     * côtés n'a rien à animer — l'animer écrirait une valeur en ligne pour
     * rien, et réveillerait au passage les transitions CSS de ses classes.
     *
     * **À bord franc, bascule franche.** Sous le voile, le fond ne se dégrade
     * pas : il passe d'une encre à l'autre en une image. Une encre qui mettrait
     * cent millisecondes à suivre resterait grise sur un fond déjà sombre.
     * C'est aussi ce qui évacue un piège : Tailwind 4 écrit les couleurs à
     * opacité modifiée en `oklab()`, que GSAP ne sait pas interpoler — une
     * bascule n'a rien à traverser.
     */
    if (encresRepliees) {
      const touchees: HTMLElement[] = [];

      for (const piece of element.querySelectorAll<HTMLElement>(ENCRES)) {
        const repliee = encresRepliees.get(cle(piece));
        if (!repliee) continue;
        const style = getComputedStyle(piece);
        const moment = decouverte(piece);

        for (const prop of PROPRIETES) {
          const ancienne = repliee[prop];
          const actuelle = style[prop];
          if (!ancienne || ancienne === actuelle) continue;
          touchees.push(piece);
          /* Posé deux fois, et il le faut : `gsap.set` écrit tout de suite,
             avant la peinture, sinon l'image qui suit l'échange d'arbres passe
             à l'écran avec la nouvelle encre sur l'ancien fond. Le `set` de la
             timeline, lui, est ce vers quoi le repli revient en marche
             arrière. */
          if (ouvre) gsap.set(piece, { [prop]: ancienne });
          tl.set(piece, { [prop]: ancienne }, 0);
          tl.set(piece, { [prop]: actuelle }, moment);
        }
      }

      if (touchees.length) {
        /* Une transition CSS sur `color` s'empare de toute valeur écrite en
           ligne et la ramène vers la valeur de classe, image après image. Deux
           moteurs sur la même propriété : il faut en couper un. */
        if (ouvre) gsap.set(touchees, { transitionProperty: "none" });
        tl.set(touchees, { transitionProperty: "none" }, 0);
        if (ouvre) {
          tl.set(
            touchees,
            { clearProps: "transitionProperty,color,backgroundColor" },
            duree,
          );
        }
      }
    }

    /**
     * Le pivot, à part de tout le reste. Apparié par Flip comme les autres, il
     * changerait de place ET d'angle en même temps : il passerait par tous les
     * degrés intermédiaires, et une flèche à quarante-cinq degrés n'est plus
     * une flèche — elle a l'air cassée. Il reste donc où il est et ne fait
     * qu'une chose : se retourner, au passage du bord.
     */
    const pivot = element.querySelector<HTMLElement>(PIVOT);
    if (pivot) {
      tl.from(
        pivot,
        {
          rotation: -180,
          duration: config.spinDuration,
          ease: "power2.inOut",
          ...nettoie("rotate,transform"),
        },
        /* Centrée sur le passage du bord, et non calée dessus : une rotation
           est un mouvement, elle a besoin de part et d'autre. */
        Math.max(0, decouverte(pivot) - config.spinDuration / 2),
      );
    }

    /* Ce qui n'existe qu'ouvert n'a pas d'ancienne place : ça ne peut que
       paraître. Chacun à son tour, quand le bord du voile arrive sur lui. */
    for (const neuf of element.querySelectorAll<HTMLElement>(NOUVEAU)) {
      tl.from(
        neuf,
        {
          opacity: 0,
          duration: config.spinDuration * 1.4,
          ease: "power1.out",
          ...nettoie("opacity"),
        },
        decouverte(neuf),
      );
    }

    return tl;
  }

  function open(): void {
    if (!isBrowser || sansMouvement()) return;
    courante?.kill();
    gsap.killTweensOf(element);
    courante = construire("ouverture");
  }

  function close(): Promise<void> {
    if (!isBrowser || sansMouvement()) return Promise.resolve();

    /* Faute d'avoir jamais vu cet état replié — un panneau ouvert au montage,
       refermé sans avoir été rouvert — il n'y a ni hauteur ni encres à viser.
       Le repli ne se joue alors pas. */
    if (!encresRepliees || !hauteurRepliee) return Promise.resolve();

    courante?.kill();
    gsap.killTweensOf(element);
    /* Le panneau s'en va : ses boutons ne doivent plus rien recevoir. */
    gsap.set(element, { pointerEvents: "none" });

    return new Promise((resolve) => {
      const tl = construire("repli");
      courante = tl;
      tl.eventCallback("onReverseComplete", () => resolve());
      tl.progress(1).timeScale(config.reverseSpeed).reverse();
    });
  }

  return {
    element,
    capture,
    syncCollapsed,
    open,
    close,
    update(next) {
      config = mergeOptions(config, next);
    },
    destroy() {
      courante?.kill();
      courante = null;
      gsap.killTweensOf(element);
      gsap.set(element, {
        clearProps: "height,overflow,pointerEvents,color,backgroundColor",
      });
      etatFlip = null;
      encresRepliees = null;
    },
  };
}
