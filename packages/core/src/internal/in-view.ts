/**
 * Observation d'entrée en vue, avec mutualisation des `IntersectionObserver`.
 *
 * Un observer est créé par couple (rootMargin, threshold) et partagé par tous
 * les éléments qui demandent les mêmes réglages — au lieu d'un observer par
 * élément comme dans les composants d'origine.
 */

import { isBrowser } from "./env";

export interface InViewOptions {
  /** Marge d'armement, syntaxe CSS. Défaut : `0px 0px -10% 0px`. */
  rootMargin?: string;
  /** Fraction de l'élément visible pour déclencher. Défaut : `0`. */
  threshold?: number;
  /** Ne déclencher qu'une fois puis se détacher. Défaut : `true`. */
  once?: boolean;
}

type Entry = { callback: (visible: boolean) => void; once: boolean };

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
          entry.callback(true);
          if (entry.once) {
            entries.delete(record.target);
            observer.unobserve(record.target);
          }
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
  pool.entries.set(element, { callback, once });
  pool.observer.observe(element);

  return () => {
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
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * ratio;
}
