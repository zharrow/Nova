/**
 * Identifiants uniques pour les définitions SVG.
 *
 * Un `<filter id="...">` est global au document : deux instances d'un même
 * composant qui partageraient un identifiant se voleraient leur filtre, et la
 * seconde effacerait la première. React a `useId` pour ça — les moteurs de
 * Nova ne connaissent aucun framework, ils comptent donc eux-mêmes.
 */
let compteur = 0;

export function uid(prefixe: string): string {
  compteur += 1;
  return `${prefixe}-${compteur.toString(36)}`;
}
