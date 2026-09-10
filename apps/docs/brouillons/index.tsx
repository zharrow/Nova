"use client";

/**
 * Les brouillons — l'antichambre de la librairie.
 *
 * Un composant qui n'est pas encore dans `packages/core` vit ici. Il apparaît
 * sur `/banc` au même titre qu'une famille du catalogue, ce qui permet de le
 * régler et de le juger AVANT de décider s'il mérite un moteur, une entrée de
 * registry et une fiche.
 *
 * Ajouter un brouillon = écrire le composant dans ce fichier (ou à côté), puis
 * une ligne dans `BROUILLONS`. Rien d'autre.
 *
 * Quand il est jugé bon, il part vers `packages/core/src/engines` en suivant
 * les deux questions de CLAUDE.md — de quelle famille est-ce une forme, et
 * faut-il une librairie. Un brouillon n'est PAS une exception aux règles du
 * dépôt, c'est une étape avant de les appliquer.
 *
 * DEUX BROUILLONS SONT PARTIS PAR CE CHEMIN, et il ne reste rien de leur code.
 *
 * `lames` comparait dix chorégraphies sous une horloge unique ; les dix sont
 * devenues des formes de `Loader`. `aimant` posait une question — faut-il le
 * ticker partagé plutôt qu'un rAF local ? — et la réponse était déjà écrite
 * dans le dépôt : `internal/pointer.ts` annonçait « tout effet magnétique à
 * venir » avant que le moteur existe. Il est devenu `Magnet`, et il y a gagné
 * ce qu'un brouillon isolé ne pouvait pas avoir : un arbitre entre aimants.
 *
 * Les garder aurait fait deux implémentations des mêmes gestes, qui auraient
 * divergé à la première retouche.
 *
 * La liste est donc vide, et c'est un état normal — pas un tableau à remplir.
 * Le banc reste utile sans elle : il sert aussi à régler une famille au-delà
 * des options de sa fiche, et à comparer ses formes.
 */

export interface Brouillon {
  nom: string;
  titre: string;
  /** Ce qu'on cherche à valider. Le brouillon existe pour répondre à ça. */
  note: string;
  Composant: React.ComponentType<Record<string, unknown>>;
  /** Valeurs de départ, et surface d'options à essayer sur le banc. */
  defauts: Record<string, unknown>;
}

export const BROUILLONS: Brouillon[] = [];
