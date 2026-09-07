/**
 * Détection d'environnement — le socle de toutes les garde-fous de Nova.
 *
 * Règle d'or héritée des projets d'origine : l'état par défaut est VISIBLE.
 * Sans JS, en SSR, ou en `prefers-reduced-motion`, le contenu doit s'afficher
 * tel quel. Aucun moteur ne pose d'`opacity: 0` qu'il ne saurait pas retirer.
 */

export const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

/** `true` si l'utilisateur a demandé à réduire les animations. */
export function prefersReducedMotion(): boolean {
  if (!isBrowser || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** `true` sur un pointeur précis (souris/trackpad) — exclut le tactile. */
export function isFinePointer(): boolean {
  if (!isBrowser || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/**
 * S'abonne aux changements de préférence de mouvement. Renvoie le désabonnement.
 * Permet à un moteur déjà monté de se désarmer si l'utilisateur bascule le
 * réglage système en cours de session.
 */
export function onReducedMotionChange(
  callback: (reduced: boolean) => void,
): () => void {
  if (!isBrowser || typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (event: MediaQueryListEvent) => callback(event.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
