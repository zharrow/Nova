/**
 * FlipList — le reflux d'une liste, raccordé au lieu d'être subi.
 *
 * ── Le manque ───────────────────────────────────────────────────────────────
 *
 * Nova animait des apparitions, des textes, des défilements, des rideaux. Elle
 * n'animait aucune REMISE EN PAGE. Or c'est le mouvement le plus fréquent d'une
 * interface réelle : on filtre une grille, on trie un tableau, on retire une
 * étiquette, on coche une facette — et vingt éléments sautent d'une position à
 * l'autre en une image. L'œil ne suit pas ; il perd l'objet qu'il regardait, et
 * le rendu se lit comme un rechargement plutôt que comme un tri.
 *
 * Toutes les familles qui manquaient au catalogue s'appuient sur ce même geste :
 * une liste à sélection multiple dont les jetons entrent et sortent, une barre
 * de filtres, une liste réordonnable, des résultats de recherche. Ce moteur est
 * donc une primitive, pas un composant de plus.
 *
 * ── Pourquoi GSAP Flip ──────────────────────────────────────────────────────
 *
 * DEPENDANCES.md nomme Flip en toutes lettres : « mesurer une disposition, en
 * laisser React remplacer une autre, et raccorder les deux. Écrit à la main,
 * c'est plusieurs centaines de lignes et une longue liste de cas limites. » Le
 * cas limite qui coûte le plus cher est celui des éléments qui PARTENT : ils
 * doivent quitter le flux pour que les autres se referment sur leur place, tout
 * en restant visibles là où ils étaient. Flip le fait ; on ne le réécrira pas.
 *
 * Il vit donc dans une ENTRÉE SÉPARÉE — `@nova-ui/core/flip-list` — comme
 * `expand` et `bloom` : un projet qui ne prend pas cette famille n'embarque
 * pas GSAP.
 *
 * ── L'état par défaut reste visible ─────────────────────────────────────────
 *
 * La règle non négociable du dépôt s'applique ici de la façon la plus simple
 * qui soit : le moteur ne pose RIEN tant qu'on ne lui a pas demandé de jouer.
 * Sans `capture()`, sans JavaScript, en SSR, ou en mouvement réduit, la liste
 * se réorganise instantanément — ce qui est exactement son comportement natif.
 * Il n'existe aucun état intermédiaire où un élément serait masqué en attendant
 * une animation qui pourrait ne jamais venir.
 */

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";

gsap.registerPlugin(Flip);

/** Comment une pièce arrive, ou s'en va. */
export type FlipListTransition = "fade" | "scale" | "none";

export interface FlipListOptions {
  /**
   * Ce qui se déplace, en sélecteur CSS relatif au conteneur.
   *
   * Défaut : les enfants directs. Une grille filtrée n'a alors aucun attribut
   * à poser — c'est le cas le plus fréquent, et il doit être gratuit. Un
   * conteneur qui mêle ses items à autre chose (un en-tête, un séparateur)
   * passe un sélecteur, par exemple `"[data-item]"`.
   */
  items?: string;
  /** Durée du raccordement, en s. Défaut : 0.45. */
  duration?: number;
  /**
   * Décalage entre deux pièces, en s. Défaut : 0.02.
   *
   * Volontairement minuscule. Un décalage lisible sur cinq éléments devient
   * une attente sur cinquante : à 0,1 s, une grille de trente pièces met trois
   * secondes à se poser. Ce qu'on cherche ici n'est pas une cascade, c'est
   * juste assez de désynchronisation pour que l'œil distingue les trajets.
   */
  stagger?: number;
  /** Courbe du déplacement. Défaut : la signature de Nova, en vocabulaire GSAP. */
  ease?: string;
  /** Comment une pièce nouvelle paraît. Défaut : `scale`. */
  enter?: FlipListTransition;
  /** Comment une pièce retirée s'en va. Défaut : `fade`. */
  exit?: FlipListTransition;
  /** Appelé quand le raccordement est fini. */
  onSettled?: () => void;
}

const defaults = {
  items: ":scope > *",
  duration: 0.45,
  /* `expo.out` est l'équivalent GSAP de `cubic-bezier(0.16, 1, 0.3, 1)`, la
     courbe signature du dépôt. On la nomme dans le vocabulaire du moteur qui
     l'exécute : GSAP ne sait rien faire d'une chaîne CSS. */
  ease: "expo.out",
  stagger: 0.02,
  enter: "scale" as FlipListTransition,
  exit: "fade" as FlipListTransition,
};

export interface FlipListInstance {
  readonly element: HTMLElement;
  /**
   * Relève la disposition courante. À appeler AVANT la mutation — le tri, le
   * filtre, la suppression.
   *
   * Sans cet appel il n'y a rien à raccorder, et `play()` ne fait rien plutôt
   * que d'inventer un état de départ. C'est ce qui rend le moteur sûr : une
   * liste qui change sans qu'on l'ait annoncé se réorganise normalement.
   */
  capture(): void;
  /** Raccorde l'ancienne disposition à la nouvelle. À appeler APRÈS la mutation. */
  play(): void;
  update(next: Partial<FlipListOptions>): void;
  destroy(): void;
}

/** Les propriétés qu'une transition écrit, et qu'il faudra donc effacer. */
const PROPRIETES_TRANSITION = "opacity,transform,scale";

/** L'état de départ d'une pièce qui arrive, selon la transition demandée. */
function departEntree(transition: FlipListTransition): gsap.TweenVars | null {
  if (transition === "none") return null;
  return transition === "scale"
    ? { opacity: 0, scale: 0.86 }
    : { opacity: 0 };
}

export function createFlipList(
  element: HTMLElement,
  options: FlipListOptions = {},
): FlipListInstance {
  let config = mergeOptions(defaults, options);
  let etat: Flip.FlipState | null = null;
  let courante: gsap.core.Timeline | null = null;

  /**
   * GSAP anime en JavaScript : la règle CSS `prefers-reduced-motion` ne peut
   * rien pour lui. Le réglage se lit donc à la main, à chaque geste — il peut
   * changer pendant la session, et une liste déjà montée doit le suivre.
   */
  const sansMouvement = () => prefersReducedMotion();

  function pieces(): NodeListOf<HTMLElement> {
    return element.querySelectorAll<HTMLElement>(config.items);
  }

  function capture(): void {
    if (!isBrowser || sansMouvement()) return;
    etat = Flip.getState(pieces(), { props: "opacity" });
  }

  function play(): void {
    // Pas d'état relevé : rien à raccorder. La liste a déjà sa nouvelle
    // disposition à l'écran, et c'est un résultat correct — pas un échec.
    if (!isBrowser || sansMouvement() || !etat) {
      etat = null;
      return;
    }

    courante?.kill();

    const cibles = pieces();
    const entree = departEntree(config.enter);

    courante = Flip.from(etat, {
      targets: cibles,
      duration: config.duration,
      ease: config.ease,
      stagger: config.stagger,
      /**
       * Les partants quittent le flux.
       *
       * C'est le cœur du geste, et la raison de la dépendance. Sans
       * `absolute`, une pièce retirée du DOM disparaît d'un coup et les autres
       * se referment sur un trou déjà vide : on voit le saut qu'on cherchait à
       * supprimer. Posée en absolu, elle reste là où elle était pendant que les
       * autres glissent sur sa place.
       */
      absolute: true,
      /* `nested` coûte peu et évite un cas déroutant : une carte qui contient
         elle-même une liste animée verrait ses enfants mesurés deux fois. */
      nested: true,

      onEnter: (elements) => {
        if (!entree) return undefined;
        return gsap.fromTo(
          elements,
          entree,
          {
            opacity: 1,
            scale: 1,
            duration: config.duration,
            ease: config.ease,
            stagger: config.stagger,
            /* On efface ce qu'on a écrit : une pièce laissée avec un
               `opacity: 1` en ligne ne suivrait plus les classes de
               l'appelant, et `destroy()` ne pourrait plus rendre l'élément à
               son état de départ. */
            clearProps: PROPRIETES_TRANSITION,
          },
        );
      },

      onLeave: (elements) => {
        if (config.exit === "none") return undefined;
        return gsap.to(elements, {
          opacity: 0,
          scale: config.exit === "scale" ? 0.86 : 1,
          duration: config.duration * 0.6,
          ease: "power1.in",
        });
      },

      onComplete: () => {
        /* Flip pose des transformations en ligne pour raccorder les trajets.
           Les laisser fige la liste : au redimensionnement de la fenêtre, une
           pièce garderait le décalage calculé pour l'ancienne largeur. */
        gsap.set(cibles, { clearProps: PROPRIETES_TRANSITION });
        config.onSettled?.();
      },
    });

    etat = null;
  }

  return {
    element,
    capture,
    play,
    update(next) {
      config = mergeOptions(config, next);
    },
    destroy() {
      courante?.kill();
      courante = null;
      etat = null;
      /* Rendre l'élément à son état de départ, comme tout moteur du dépôt :
         les pièces encore présentes perdent ce que Flip et les transitions
         leur ont écrit. Les partants, eux, ont déjà quitté le DOM. */
      gsap.killTweensOf(pieces());
      gsap.set(pieces(), { clearProps: PROPRIETES_TRANSITION });
    },
  };
}
