/**
 * Ticker partagé : une seule boucle `requestAnimationFrame` pour tous les
 * moteurs Nova de la page.
 *
 * Les composants d'origine ouvraient chacun leur propre rAF ; à dix compteurs
 * et trois curseurs sur une page, cela faisait dix boucles concurrentes. Ici,
 * une seule boucle tourne, et elle s'arrête d'elle-même dès qu'il n'y a plus
 * d'abonné — donc zéro coût quand rien n'anime.
 */

import { isBrowser } from "./env";

/** @param now horodatage rAF (ms) @param delta ms écoulées depuis la frame précédente */
export type TickHandler = (now: number, delta: number) => void;

const handlers = new Set<TickHandler>();
let frame = 0;
let previous = 0;

function loop(now: number): void {
  // Première frame : delta nul plutôt qu'un saut arbitraire.
  const delta = previous === 0 ? 0 : now - previous;
  previous = now;

  // Copie défensive : un handler peut se désabonner pendant l'itération.
  for (const handler of [...handlers]) {
    if (handlers.has(handler)) handler(now, delta);
  }

  if (handlers.size > 0) {
    frame = requestAnimationFrame(loop);
  } else {
    frame = 0;
    previous = 0;
  }
}

/** Abonne un handler à la boucle partagée. Renvoie le désabonnement. */
export function subscribe(handler: TickHandler): () => void {
  if (!isBrowser) return () => {};
  handlers.add(handler);
  if (frame === 0) frame = requestAnimationFrame(loop);
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0 && frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    }
  };
}

/** Nombre d'abonnés actifs — utilisé par les tests. */
export function tickerSize(): number {
  return handlers.size;
}
