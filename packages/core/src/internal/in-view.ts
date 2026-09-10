/**
 * Observation d'entrée en vue, avec mutualisation des `IntersectionObserver`.
 *
 * Un observer est créé par couple (rootMargin, threshold) et partagé par tous
 * les éléments qui demandent les mêmes réglages — au lieu d'un observer par
 * élément comme dans les composants d'origine.
 */

import { isBrowser } from "./env";
import { isPageCovered, whenPageUncovered } from "./curtain";
import type { UncoverOrigin } from "./curtain";

export interface InViewOptions {
  /** Marge d'armement, syntaxe CSS. Défaut : `0px 0px -10% 0px`. */
  rootMargin?: string;
  /** Fraction de l'élément visible pour déclencher. Défaut : `0`. */
  threshold?: number;
  /** Ne déclencher qu'une fois puis se détacher. Défaut : `true`. */
  once?: boolean;
}

type Entry = {
  callback: (visible: boolean) => void;
  once: boolean;
  /** Annulation d'une entrée retenue derrière un rideau. */
  retenue: (() => void) | null;
  /** Minuterie du sillage, quand la découverte a une origine. */
  sillage: ReturnType<typeof setTimeout> | null;
};

/**
 * LE SILLAGE — l'entrée de la page se propage depuis le point où le rideau
 * s'est retiré.
 *
 * Quand le voile se rétracte SUR un point — la marque qui rejoint sa place —
 * libérer toutes les entrées au même instant gâche ce que le geste vient
 * d'établir : il y avait une cause, à un endroit précis, et la page devrait
 * s'ouvrir depuis là. On retarde donc chaque entrée de sa distance à l'origine.
 *
 * 2,6 px par milliseconde : une onde qui traverse un écran de 1400 px en un
 * peu plus d'un demi-tiers de seconde. Plus vite, on ne lit plus une
 * propagation ; plus lentement, le bas de page paraît en panne. Et le retard
 * est PLAFONNÉ, parce qu'un document très long mettrait sinon plusieurs
 * secondes à s'armer entièrement.
 */
const VITESSE_SILLAGE = 2.6;
const SILLAGE_MAX = 420;

function retardDeSillage(cible: Element, depuis: UncoverOrigin | null): number {
  if (!depuis) return 0;
  const boite = cible.getBoundingClientRect();
  const dx = boite.left + boite.width / 2 - depuis.x;
  const dy = boite.top + boite.height / 2 - depuis.y;
  return Math.min(SILLAGE_MAX, Math.hypot(dx, dy) / VITESSE_SILLAGE);
}

const pools = new Map<string, { observer: IntersectionObserver; entries: Map<Element, Entry> }>();

function poolFor(rootMargin: string, threshold: number) {
  const key = `${rootMargin}|${threshold}`;
  let pool = pools.get(key);
  if (pool) return pool;

  const entries = new Map<Element, Entry>();
  const observer = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        const entry = entries.get(record.target);
        if (!entry) continue;
        if (record.isIntersecting) {
          // DERRIÈRE UN RIDEAU, ON RETIENT. L'élément est dans la fenêtre mais
          // personne ne le voit : jouer son entrée maintenant la dépenserait à
          // vide, et le voile se lèverait sur une page déjà entrée. On la garde
          // pour l'instant où elle se verra. Voir `internal/curtain.ts`.
          if (isPageCovered()) {
            entry.retenue ??= whenPageUncovered((depuis) => {
              entry.retenue = null;
              // L'entrée a pu être détachée pendant qu'on attendait.
              if (entries.get(record.target) !== entry) return;
              const retard = retardDeSillage(record.target, depuis);
              if (retard <= 0) {
                declencher(record.target, entry);
                return;
              }
              entry.sillage = setTimeout(() => {
                entry.sillage = null;
                if (entries.get(record.target) !== entry) return;
                declencher(record.target, entry);
              }, retard);
            });
            continue;
          }
          declencher(record.target, entry);
        } else if (!entry.once) {
          entry.callback(false);
        }
      }
    },
    { rootMargin, threshold },
  );

  pool = { observer, entries };
  pools.set(key, pool);
  return pool;

  function declencher(cible: Element, entry: Entry): void {
    entry.callback(true);
    if (!entry.once) return;
    entries.delete(cible);
    observer.unobserve(cible);
  }
}

/**
 * Prévient `callback` quand `element` entre (et, si `once` est faux, sort) du
 * viewport. Renvoie la fonction de détachement.
 */
export function observeInView(
  element: Element,
  callback: (visible: boolean) => void,
  options: InViewOptions = {},
): () => void {
  if (!isBrowser || typeof IntersectionObserver === "undefined") {
    // Pas d'observer disponible (SSR, très vieux navigateur) : on considère
    // l'élément visible d'emblée plutôt que de le laisser caché à jamais.
    callback(true);
    return () => {};
  }

  const rootMargin = options.rootMargin ?? "0px 0px -10% 0px";
  const threshold = options.threshold ?? 0;
  const once = options.once ?? true;

  const pool = poolFor(rootMargin, threshold);
  const entry: Entry = { callback, once, retenue: null, sillage: null };
  pool.entries.set(element, entry);
  pool.observer.observe(element);

  return () => {
    // Une entrée retenue derrière un rideau doit être annulée, sinon elle se
    // déclencherait après le démontage du moteur qui l'a demandée. Le sillage
    // aussi : il tient une minuterie déjà armée.
    entry.retenue?.();
    entry.retenue = null;
    if (entry.sillage !== null) {
      clearTimeout(entry.sillage);
      entry.sillage = null;
    }
    pool.entries.delete(element);
    pool.observer.unobserve(element);
  };
}

/**
 * `true` si l'élément est déjà (presque) à l'écran au montage.
 *
 * Cœur de la règle d'or : on n'arme une animation d'entrée que pour ce qui est
 * réellement sous la ligne de flottaison. Ce qui est déjà visible reste affiché,
 * sans clignotement.
 */
export function isAlreadyInView(element: Element, ratio = 0.92): boolean {
  if (!isBrowser) return true;
  // COUVERT N'EST PAS VU. Sous un rideau, un élément est dans la fenêtre sans
  // que personne le voie : le tenir pour « déjà vu » faisait renoncer tout le
  // haut de page à son entrée, et le voile se levait sur une page qui était
  // simplement LÀ. C'était le geste que le rideau promettait, et qu'on ne
  // pouvait obtenir qu'en câblant un état à la main dans l'application.
  if (isPageCovered()) return false;
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * ratio;
}
