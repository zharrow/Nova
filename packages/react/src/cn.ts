import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * La fusion de classes de shadcn : `clsx` compose, `tailwind-merge` arbitre.
 *
 * Nova la réexporte pour que les composants copiés s'en servent au lieu de
 * concaténer des chaînes. Sans `twMerge`, une classe passée par l'appelant ne
 * remplace pas celle du composant : les deux restent dans l'attribut, et c'est
 * l'ordre de la feuille de style qui tranche — pas l'intention.
 *
 * Un projet qui a déjà `@/lib/utils` (le cas de tout projet shadcn) peut
 * remplacer cet import par le sien : c'est exactement la même fonction.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
