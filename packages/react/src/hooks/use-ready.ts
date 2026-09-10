"use client";

import { useEffect, useRef, useState } from "react";
import { createReady } from "@nova-ui/core";
import type { ReadyOptions } from "@nova-ui/core";

export interface ReadyState {
  /** `true` quand l'attente est finie. */
  ready: boolean;
  /** Avancement, de 0 à 1. Monotone, et exactement 1 quand `ready` passe. */
  progress: number;
  /** Termine l'attente immédiatement. */
  skip: () => void;
}

/**
 * Attendre ce qu'il faut, et le dire — sans rideau.
 *
 * `Loader` couvre la page pendant l'attente ; ce crochet ne couvre rien. Il
 * sert quand on veut le SIGNAL sans le voile : retarder l'entrée d'un titre
 * jusqu'à ce que sa fonte soit là, n'afficher une galerie qu'une fois ses
 * images décodées, tenir un bouton inerte le temps d'une promesse.
 *
 * ```tsx
 * const { ready, progress } = useReady({ until: ["fonts", "images"] });
 * return <h1 data-entre={ready}>…</h1>;
 * ```
 *
 * `until` est lu AU MONTAGE et une seule fois. Une promesse construite dans le
 * rendu change d'identité à chaque passage ; la ré-armer relancerait l'attente
 * sans fin. Pour une promesse qui doit naître au démarrage, passer une fonction
 * plutôt que son résultat.
 *
 * En SSR, l'attente est finie d'avance : `ready` vaut `true` au premier rendu
 * serveur, et l'état par défaut reste donc visible. C'est voulu — une page qui
 * arrive sans JavaScript ne doit jamais rester suspendue à un signal que
 * personne n'écoutera.
 */
export function useReady(options: ReadyOptions = {}): ReadyState {
  const [state, setState] = useState<{ ready: boolean; progress: number }>({
    ready: false,
    progress: 0,
  });
  const abreger = useRef<() => void>(() => {});
  // Les rappels changent d'identité à chaque rendu : les comparer relancerait
  // l'attente en boucle. On garde les plus récents derrière une ref, comme
  // `useNovaEngine` le fait pour les moteurs.
  const rappels = useRef(options);
  rappels.current = options;

  useEffect(() => {
    const instance = createReady({
      ...options,
      onProgress(part) {
        setState((avant) =>
          avant.progress === part ? avant : { ...avant, progress: part },
        );
        rappels.current.onProgress?.(part);
      },
      onReady() {
        setState({ ready: true, progress: 1 });
        rappels.current.onReady?.();
      },
    });
    abreger.current = instance.skip;
    // Le moteur peut avoir DÉJÀ fini avant le premier effet — en SSR, ou quand
    // tout est en cache. Sans cette relecture, `ready` resterait faux pour
    // toujours et rien n'entrerait jamais.
    if (instance.done()) setState({ ready: true, progress: 1 });
    return () => {
      abreger.current = () => {};
      instance.destroy();
    };
    // Création unique : `until` est lu au montage, et c'est documenté.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, skip: () => abreger.current() };
}
