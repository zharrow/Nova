import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * La fusion de classes de shadcn : `clsx` compose, `tailwind-merge` arbitre.
 *
 * Sans `twMerge`, une classe passée par l'appelant ne remplace pas celle du
 * composant — les deux restent dans l'attribut, et c'est l'ordre de la feuille
 * de style qui tranche, pas l'intention.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
