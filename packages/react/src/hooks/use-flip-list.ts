"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createFlipList } from "@nova-ui/core/flip-list";
import type { FlipListInstance, FlipListOptions } from "@nova-ui/core/flip-list";

/**
 * `useLayoutEffect` n'a pas de sens au rendu serveur, et React le signale. On
 * mesure et on anime avant peinture côté client, on ne fait rien côté serveur.
 */
const useEffetDeMiseEnPage =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseFlipListResult<Element_ extends HTMLElement> {
  /** À poser sur le conteneur de la liste. */
  ref: React.RefObject<Element_ | null>;
  /**
   * À appeler AVANT de changer la liste — dans le `onClick`, juste avant le
   * `setState`. C'est le seul moment où l'ancienne disposition est encore à
   * l'écran, donc mesurable.
   */
  capture: () => void;
}

/**
 * Le reflux d'une liste, raccordé au lieu d'être subi.
 *
 * ```tsx
 * const { ref, capture } = useFlipList(filtre);
 *
 * <button onClick={() => { capture(); setFiltre("actifs"); }}>Actifs</button>
 * <ul ref={ref}>
 *   {visibles.map((p) => <li key={p.id}>{p.nom}</li>)}
 * </ul>
 * ```
 *
 * **Pourquoi `capture()` reste explicite.** Il faut mesurer AVANT que React ne
 * remplace les enfants, et aucun crochet de fonction ne s'exécute à ce
 * moment-là : `useLayoutEffect` court après le commit, quand l'ancienne
 * disposition n'existe plus. Mesurer pendant le rendu marcherait, mais lire le
 * DOM pendant un rendu est précisément ce que React interdit — et le jour où le
 * rendu concurrent jette celui-ci, la mesure part avec. On garde donc le
 * contrat de `useExpand`, qui est le même et pour la même raison.
 *
 * **Le rejeu, lui, est automatique.** La `cle` décrit la disposition courante —
 * un filtre, un ordre de tri, la liste des identifiants visibles. Quand elle
 * change, le raccordement se joue tout seul. C'est la moitié du travail qu'on
 * peut enlever à l'appelant sans lui mentir.
 *
 * Oublier `capture()` ne casse rien : sans état relevé, la liste se réorganise
 * instantanément, ce qui est son comportement natif. Le moteur ne masque jamais
 * ce qu'il ne saurait pas révéler.
 */
export function useFlipList<Element_ extends HTMLElement = HTMLDivElement>(
  cle: string | number,
  options: FlipListOptions = {},
): UseFlipListResult<Element_> {
  const ref = useRef<Element_>(null);
  const moteur = useRef<FlipListInstance | null>(null);
  const premiere = useRef(true);

  useEffetDeMiseEnPage(() => {
    if (!ref.current) return;
    const cree = createFlipList(ref.current, options);
    moteur.current = cree;
    return () => {
      cree.destroy();
      moteur.current = null;
    };
    /* Création unique. Les options changeantes passent par `update` ci-dessous
       plutôt que par un remontage : recréer le moteur au milieu d'un geste
       perdrait l'état relevé. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffetDeMiseEnPage(() => {
    moteur.current?.update(options);
  });

  const capture = useCallback(() => moteur.current?.capture(), []);

  useEffetDeMiseEnPage(() => {
    /* Au montage il n'y a pas de disposition précédente : la liste arrive, elle
       ne se réorganise pas. Jouer ici ferait entrer chaque pièce en fondu, ce
       qui contredirait la règle du dépôt — l'état par défaut est visible. */
    if (premiere.current) {
      premiere.current = false;
      return;
    }
    moteur.current?.play();
  }, [cle]);

  return { ref, capture };
}
