/**
 * Dial — la colonne qui roule sous une ligne de sélection.
 *
 * Le geste du sélecteur de date : deux colonnes, les mois et les années, qui
 * défilent sous une ligne fixe. Ce qui est au centre est ce qui est choisi ;
 * ce qui s'en éloigne s'efface et rapetisse, de sorte que la colonne se lit
 * comme une matière qui tourne et non comme une liste qui glisse.
 *
 * Le moteur ne dessine rien et n'écrit aucun libellé : il reçoit une liste
 * déjà rendue et se charge de trois choses seulement.
 *
 *  1. **La géométrie.** Il mesure la vue et un item, et pose le rembourrage
 *     qui permet au PREMIER et au DERNIER d'atteindre le centre. Sans lui, on
 *     ne pourrait jamais choisir janvier.
 *  2. **La position.** Il publie image par image la position courante de la
 *     colonne, en unités d'item, dans `--nova-dial-position`. Le fondu et le
 *     rapetissement sont ensuite du CSS — voir `nova.css`.
 *  3. **Le calage.** Il annonce l'index arrivé sous la ligne, une fois le
 *     défilement arrêté, jamais pendant.
 *
 * L'ACCROCHE EST NATIVE. `scroll-snap-type` fait le calage, l'inertie et le
 * tactile mieux que ce qu'on écrirait, et gratuitement. Le moteur ne la
 * suspend que le temps de ses propres courses, où il écrit `scrollTop` lui-même
 * et où le navigateur, sinon, le contredirait à chaque image.
 *
 * UNE SEULE ÉCRITURE PAR IMAGE. La position est posée sur le CONTENEUR, pas
 * sur chaque item : chacun connaît son propre rang, écrit une fois pour toutes
 * dans `--nova-dial-i`, et calcule son écart en CSS. Un cadran de cent vingt
 * années coûte donc la même chose qu'un cadran de douze mois.
 *
 * L'état par défaut est visible : tant que la mesure n'a rien donné — panneau
 * replié, appel avant la première mise en page — le moteur ne s'arme pas, et
 * la colonne reste une liste ordinaire, entièrement lisible.
 */

import { isBrowser, prefersReducedMotion } from "../internal/env";
import { mergeOptions } from "../internal/options";
import { resolveEasing } from "../internal/easing";
import type { Easing } from "../internal/easing";
import { subscribe } from "../internal/ticker";
import type { NovaInstance } from "../internal/types";

export interface DialOptions {
  /** Index amené sous la ligne de sélection. */
  index?: number;
  /** Durée d'une course programmée, en ms. */
  duration?: number;
  /** Courbe de la course. Défaut : `expoOut`, la signature de Nova. */
  easing?: Easing;
  /**
   * Nombre d'items sur lequel le fondu s'épuise. À 2.6, le troisième voisin
   * est au bout de sa course ; plus bas, la colonne se referme sur le centre.
   */
  falloff?: number;
  /** L'index s'est calé sous la ligne — au repos, jamais pendant la course. */
  onChange?: (index: number) => void;
  /**
   * L'index le plus proche a changé PENDANT le mouvement. C'est ce qui permet
   * à un en-tête de suivre la colonne au lieu d'attendre l'arrêt.
   */
  onScrub?: (index: number) => void;
}

export interface DialInstance extends NovaInstance<DialOptions> {
  /** Index actuellement calé sous la ligne. */
  readonly index: number;
  /** Amène un item sous la ligne. Sans animation, il y saute. */
  select(index: number, options?: { animate?: boolean }): void;
}

/** Silence après le dernier événement de défilement qui vaut arrêt, en ms. */
const REPOS = 120;

const DEFAUTS = {
  index: 0,
  duration: 420,
  falloff: 2.6,
} satisfies DialOptions;

export function createDial(
  element: HTMLElement,
  options: DialOptions = {},
): DialInstance {
  let config = mergeOptions(DEFAUTS, options);

  let items: HTMLElement[] = [];
  let hauteurVue = 0;
  let hauteurItem = 0;
  /** Rembourrage haut et bas — ce qui laisse le premier item monter au centre. */
  let marge = 0;
  let arme = false;
  /**
   * Index sous la ligne, suivi EN DIRECT. Distinct de la position, qui est
   * continue, et distinct de `annonce` : c'est ce que lit `instance.index`,
   * de sorte qu'un appelant qui recopie `onScrub` dans son état ne se voie
   * jamais renvoyer une course vers un index où la colonne est déjà.
   */
  let cale = Math.max(0, Math.round(config.index));
  /** Dernier index passé à `onChange` — la sélection arrêtée. */
  let annonce = cale;

  let desabonner: (() => void) | null = null;
  let observateur: ResizeObserver | null = null;
  let defilementRecu = false;
  let dernierDefilement = 0;
  /**
   * Course programmée en cours. `debut` vaut zéro tant que la première image
   * n'est pas passée : l'horodatage doit venir du ticker, pas de l'horloge de
   * l'appelant, sinon la course démarre déjà entamée.
   */
  let course: {
    depart: number;
    arrivee: number;
    debut: number;
    courbe: (t: number) => number;
  } | null = null;

  function collecte(): boolean {
    const trouves = Array.from(
      element.querySelectorAll<HTMLElement>("[data-nova-dial-item]"),
    );
    const liste = trouves.length
      ? trouves
      : (Array.from(element.children) as HTMLElement[]);
    if (
      liste.length === items.length &&
      liste.every((item, i) => item === items[i])
    ) {
      return false;
    }
    // Le rang est écrit UNE FOIS : c'est ce qui permet ensuite de ne toucher
    // qu'une seule variable par image, sur le conteneur.
    for (const ancien of items) ancien.style.removeProperty("--nova-dial-i");
    items = liste;
    items.forEach((item, i) => item.style.setProperty("--nova-dial-i", `${i}`));
    return true;
  }

  /**
   * Mesure la colonne. Renvoie faux quand elle ne mesure rien — conteneur
   * replié, `display: none`, appel avant la première mise en page. Ce n'est
   * pas un cas théorique : le cadran d'un sélecteur de date vit dans un
   * panneau qui n'existe pas encore quand le moteur est construit.
   */
  function mesure(): boolean {
    /*
     * Le rembourrage précédent est RETIRÉ avant de mesurer.
     *
     * `clientHeight` compte le rembourrage. Sur un élément dont la hauteur
     * suit son contenu — un `h-full` qui ne résout pas, une colonne posée
     * dans une grille sans piste définie — mesurer par-dessus son propre
     * rembourrage le rend divergent : la mesure gonfle le rembourrage, qui
     * gonfle la mesure, et l'observateur de taille rejoue à chaque tour. Vu
     * en vrai sur la vitrine, où la colonne avait atteint deux mille cinq
     * cents pixels. Repartir de zéro rend la mesure idempotente.
     */
    element.style.removeProperty("--nova-dial-pad");
    hauteurVue = element.clientHeight;
    hauteurItem = items[0]?.offsetHeight ?? 0;

    if (hauteurVue <= 0 || hauteurItem <= 0) {
      desarmer();
      return false;
    }

    marge = Math.max(0, (hauteurVue - hauteurItem) / 2);
    element.style.setProperty("--nova-dial-pad", `${marge}px`);
    element.style.setProperty("--nova-dial-falloff", `${config.falloff}`);
    element.dataset.novaDial = "armed";
    arme = true;
    return true;
  }

  function desarmer(): void {
    arme = false;
    element.dataset.novaDial = "";
    element.style.removeProperty("--nova-dial-pad");
  }

  /** Position de la colonne en unités d'item — continue, pas entière. */
  function position(): number {
    if (hauteurItem <= 0) return cale;
    const ligne = element.scrollTop + hauteurVue / 2;
    return (ligne - marge - hauteurItem / 2) / hauteurItem;
  }

  /** Défilement à atteindre pour amener l'item `i` sous la ligne. */
  function ancrage(i: number): number {
    const brut = marge + i * hauteurItem + hauteurItem / 2 - hauteurVue / 2;
    const maximum = Math.max(0, element.scrollHeight - hauteurVue);
    return Math.max(0, Math.min(brut, maximum));
  }

  function borne(i: number): number {
    if (items.length === 0) return 0;
    return Math.max(0, Math.min(Math.round(i), items.length - 1));
  }

  /** Publie la position. Une écriture, sur le conteneur — le CSS fait le reste. */
  function peindre(): void {
    element.style.setProperty("--nova-dial-position", position().toFixed(4));
  }

  /** Suit la colonne image par image, tant qu'aucune course ne la pilote. */
  function suivre(): void {
    const proche = borne(position());
    if (proche === cale) return;
    cale = proche;
    config.onScrub?.(proche);
  }

  /** La colonne s'est arrêtée : la sélection est acquise. */
  function annoncer(): void {
    if (cale === annonce) return;
    annonce = cale;
    config.onChange?.(cale);
  }

  function abonner(): void {
    if (desabonner) return;
    desabonner = subscribe(image);
  }

  function arreter(): void {
    desabonner?.();
    desabonner = null;
  }

  function image(now: number): void {
    if (!arme) {
      arreter();
      return;
    }

    if (course) {
      if (course.debut === 0) course.debut = now;
      const duree = Math.max(0, config.duration);
      const t = duree <= 0 ? 1 : Math.min(1, (now - course.debut) / duree);
      element.scrollTop =
        course.depart + (course.arrivee - course.depart) * course.courbe(t);
      peindre();
      if (t >= 1) {
        course = null;
        // L'accroche native reprend la main : la position est déjà exacte,
        // elle n'a donc rien à corriger.
        delete element.dataset.novaDialState;
        arreter();
      }
      return;
    }

    peindre();
    suivre();

    if (defilementRecu) {
      defilementRecu = false;
      dernierDefilement = now;
      return;
    }
    if (now - dernierDefilement > REPOS) {
      annoncer();
      arreter();
    }
  }

  function auDefilement(): void {
    // La course écrit `scrollTop` elle-même : les événements qu'elle provoque
    // ne sont pas un geste de l'utilisateur, et repousseraient l'arrêt sans fin.
    if (course) return;
    defilementRecu = true;
    abonner();
  }

  function auClavier(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const pas: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
      PageDown: 5,
      PageUp: -5,
    };
    let cible: number | null = null;
    if (event.key in pas) cible = cale + pas[event.key]!;
    else if (event.key === "Home") cible = 0;
    else if (event.key === "End") cible = items.length - 1;
    if (cible === null) return;

    event.preventDefault();
    select(cible);
  }

  function select(index: number, options?: { animate?: boolean }): void {
    const cible = borne(index);
    // Annoncée TOUT DE SUITE : une sélection programmée est une intention, pas
    // un geste dont il faudrait attendre le repos. C'est ce qui permet à
    // `aria-activedescendant` de suivre le clavier sans attendre la course.
    cale = cible;
    if (cible !== annonce) {
      annonce = cible;
      config.onChange?.(cible);
    }
    if (!arme) return;

    const arrivee = ancrage(cible);
    const anime =
      options?.animate !== false &&
      !prefersReducedMotion() &&
      config.duration > 0;

    if (!anime) {
      course = null;
      delete element.dataset.novaDialState;
      element.scrollTop = arrivee;
      peindre();
      return;
    }

    // L'accroche native est suspendue le temps de la course : elle corrigerait
    // chaque `scrollTop` écrit, et la colonne resterait collée à son item.
    element.dataset.novaDialState = "settling";
    course = {
      depart: element.scrollTop,
      arrivee,
      debut: 0,
      courbe: resolveEasing(config.easing),
    };
    abonner();
  }

  function armer(): void {
    collecte();
    if (mesure()) {
      select(cale, { animate: false });
    }
  }

  if (isBrowser) {
    element.dataset.novaDial = "";
    element.addEventListener("scroll", auDefilement, { passive: true });
    element.addEventListener("keydown", auClavier);
    observateur = new ResizeObserver(() => {
      const etaitArme = arme;
      collecte();
      if (mesure() && !etaitArme) select(cale, { animate: false });
      else if (arme) peindre();
    });
    observateur.observe(element);
    armer();
  }

  return {
    element,
    get index() {
      return cale;
    },
    select,
    update(next) {
      const falloffChange =
        next.falloff !== undefined && next.falloff !== config.falloff;
      config = mergeOptions(config, next);
      if (falloffChange) {
        element.style.setProperty("--nova-dial-falloff", `${config.falloff}`);
      }
      if (collecte()) mesure();
      if (next.index !== undefined) select(next.index);
    },
    destroy() {
      arreter();
      course = null;
      observateur?.disconnect();
      observateur = null;
      element.removeEventListener("scroll", auDefilement);
      element.removeEventListener("keydown", auClavier);
      for (const item of items) item.style.removeProperty("--nova-dial-i");
      items = [];
      delete element.dataset.novaDial;
      delete element.dataset.novaDialState;
      element.style.removeProperty("--nova-dial-pad");
      element.style.removeProperty("--nova-dial-falloff");
      element.style.removeProperty("--nova-dial-position");
      arme = false;
    },
  };
}
