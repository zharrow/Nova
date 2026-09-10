/**
 * Le rideau — ce qui couvre la page pendant qu'elle se prépare.
 *
 * Ce module ne dessine rien. C'est un REGISTRE : il dit si quelque chose
 * couvre la page en ce moment, et prévient quand ce n'est plus le cas. Il
 * existe pour une seule raison, et elle vaut d'être écrite en entier.
 *
 * Un moteur d'entrée — révélation, effet de texte, compteur — renonce à
 * s'armer quand son élément est DÉJÀ à l'écran au montage : l'animer aussitôt
 * serait un clignotement, pas une apparition. Cette règle est juste, sauf
 * pendant qu'un rideau couvre la page. Là, l'élément est dans la fenêtre mais
 * personne ne le voit : il est couvert, pas vu. Sans ce registre, tout le haut
 * de page renonce à son entrée pendant que le voile est posé, et quand le voile
 * se lève la page est simplement LÀ — elle n'entre pas. C'est le geste que le
 * rideau promettait et qu'on ne pouvait obtenir qu'en câblant un état à la
 * main dans l'application.
 *
 * Un compteur, et non un booléen : deux rideaux peuvent se superposer — celui
 * d'ouverture et celui d'une transition de page — et le premier qui se retire
 * ne doit pas découvrir ce que le second couvre encore.
 */

import { isBrowser } from "./env";

/**
 * D'où la page a été découverte, en coordonnées de fenêtre.
 *
 * Un rideau qui se retire d'un bloc n'a pas d'origine — il découvre partout à
 * la fois. Mais un rideau qui se rétracte SUR un point en a une, et cette
 * origine vaut d'être transmise : les entrées de la page peuvent alors partir
 * de là, en sillage, au lieu de s'armer toutes au même instant. C'est ce qui
 * fait de l'arrivée de la marque la SOURCE du mouvement de la page, et non un
 * geste qui se termine pendant qu'un autre commence.
 */
export interface UncoverOrigin {
  x: number;
  y: number;
}

let rideaux = 0;
let origine: UncoverOrigin | null = null;
const attentes = new Set<(depuis: UncoverOrigin | null) => void>();

/**
 * Déclare qu'un rideau couvre la page. Renvoie de quoi le retirer.
 *
 * Le retrait est idempotent : un moteur qui appelle sa sortie puis son
 * démontage ne doit pas décrémenter deux fois, sinon la page se croirait
 * découverte alors qu'un second rideau tient encore.
 */
export function coverPage(): (depuis?: UncoverOrigin) => void {
  if (!isBrowser) return () => {};
  rideaux += 1;
  let rendu = false;
  return (depuis) => {
    if (rendu) return;
    rendu = true;
    rideaux -= 1;
    // L'origine du DERNIER rideau retiré est celle qui compte : c'est lui qui
    // a effectivement découvert la page.
    if (depuis) origine = depuis;
    if (rideaux <= 0) {
      rideaux = 0;
      liberer();
    }
  };
}

/** `true` tant qu'au moins un rideau couvre la page. */
export function isPageCovered(): boolean {
  return rideaux > 0;
}

/**
 * Appelle `callback` quand la page est découverte — TOUT DE SUITE si elle
 * l'est déjà, ce qui est le cas normal : la plupart des pages n'ont pas de
 * rideau, et rien ne doit attendre à cause d'un mécanisme qui ne sert pas.
 *
 * Renvoie l'annulation.
 */
export function whenPageUncovered(
  callback: (depuis: UncoverOrigin | null) => void,
): () => void {
  if (!isPageCovered()) {
    callback(origine);
    return () => {};
  }
  attentes.add(callback);
  return () => {
    attentes.delete(callback);
  };
}

function liberer(): void {
  // Copie avant de vider : un callback peut en réenregistrer un autre, et
  // itérer sur l'ensemble qu'on modifie sauterait des entrées.
  const aPrevenir = [...attentes];
  attentes.clear();
  const depuis = origine;
  for (const callback of aPrevenir) callback(depuis);
}
