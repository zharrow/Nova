"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createExpand } from "@nova-ui/core/expand";
import type { ExpandInstance, ExpandOptions } from "@nova-ui/core/expand";

/**
 * `useLayoutEffect` n'a pas de sens au rendu serveur, et React le signale. On
 * mesure et on anime avant peinture côté client, on ne fait rien côté serveur.
 */
const useEffetDeMiseEnPage =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseExpandResult<Element_ extends HTMLElement> {
  /** À poser sur le conteneur qui change d'arbre. */
  ref: React.RefObject<Element_ | null>;
  /**
   * À appeler AVANT de basculer l'état — typiquement dans le `onClick`, juste
   * avant le `setState`. C'est le seul moment où la ligne repliée est encore
   * rendue, donc mesurable.
   */
  capture: () => void;
  /**
   * Ce qu'il faut RENDRE. Diffère de `expanded` le temps d'un repli : sans ce
   * sursis, le contenu déplié disparaîtrait d'un coup pendant que la boîte,
   * elle, glisse.
   */
  shown: boolean;
}

/**
 * Le passage d'une ligne à un panneau, sans que la substitution se voie.
 *
 * React remplace un arbre par l'autre en une image. Ce crochet mesure l'état
 * de départ pendant qu'il est là, laisse React faire son échange, puis
 * raccorde les deux — pièces communes replacées, encres basculées au passage
 * du bord d'un voile, nouvelles lignes apparues à leur tour.
 *
 * Le markup porte le contrat :
 *
 * ```tsx
 * <div ref={ref}>
 *   <header>
 *     {shown ? <span data-nova-veil /> : null}
 *     <span data-nova-flip-id="titre">{titre}</span>
 *     {shown ? <p data-nova-reveal>{detail}</p> : null}
 *     <span data-nova-spin><Chevron /></span>
 *   </header>
 * </div>
 * ```
 */
export function useExpand<Element_ extends HTMLElement = HTMLDivElement>(
  expanded: boolean,
  options: ExpandOptions = {},
): UseExpandResult<Element_> {
  const ref = useRef<Element_>(null);
  const moteur = useRef<ExpandInstance | null>(null);
  const [shown, setShown] = useState(expanded);
  const monte = useRef(false);
  const aOuvrir = useRef(false);

  useEffetDeMiseEnPage(() => {
    if (!ref.current) return;
    const cree = createExpand(ref.current, options);
    moteur.current = cree;
    return () => {
      cree.destroy();
      moteur.current = null;
    };
    // Création unique : le geste dure une seconde, il ne se reconfigure pas
    // en cours de route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = useCallback(() => moteur.current?.capture(), []);

  /* Tant que la ligne repliée est là, on relève ce qu'elle est : c'est le
     départ de l'ouverture, et la cible du repli. */
  useEffetDeMiseEnPage(() => {
    if (shown) return;
    moteur.current?.syncCollapsed();
  });

  useEffetDeMiseEnPage(() => {
    // Au montage il n'y a pas de bascule, seulement un état de départ.
    if (!monte.current) {
      monte.current = true;
      return;
    }
    if (expanded === shown) return;

    if (expanded) {
      /* Rien à animer encore : le panneau n'est pas rendu. On le demande, et
         l'effet suivant l'ouvre une fois qu'il est là. */
      aOuvrir.current = true;
      setShown(true);
      return;
    }

    let vivant = true;
    void moteur.current?.close().then(() => {
      if (vivant) setShown(false);
    });
    // Sans moteur — rendu serveur, mouvement réduit — le repli est immédiat.
    if (!moteur.current) setShown(false);
    return () => {
      vivant = false;
    };
  }, [expanded, shown]);

  /** L'ouverture, une fois le panneau rendu. */
  useEffetDeMiseEnPage(() => {
    if (!shown || !aOuvrir.current) return;
    aOuvrir.current = false;
    moteur.current?.open();
  }, [shown]);

  return { ref, capture, shown };
}
