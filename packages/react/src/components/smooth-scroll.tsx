"use client";

import { useEffect, useRef } from "react";
import { createSmoothScroll } from "@nova-ui/core/smooth-scroll";
import type {
  SmoothScrollOptions,
  SmoothScrollInstance,
} from "@nova-ui/core/smooth-scroll";

export interface SmoothScrollProps extends SmoothScrollOptions {
  children?: React.ReactNode;
}

/**
 * Défilement lissé, sur Lenis. À monter une seule fois, dans le layout racine.
 *
 * Ne rend aucun élément : il installe le défilement et se retire. Trois
 * différences avec un montage direct de Lenis — la boucle est celle de Nova,
 * le tactile reste natif, et rien n'est monté en `prefers-reduced-motion`.
 */
export function SmoothScroll({ children, ...options }: SmoothScrollProps) {
  const instance = useRef<SmoothScrollInstance | null>(null);

  useEffect(() => {
    const cree = createSmoothScroll(options);
    instance.current = cree;
    return () => {
      cree.destroy();
      instance.current = null;
    };
    // Monté une fois : changer le lissage en cours de session n'a pas de sens,
    // et recréer Lenis remettrait le défilement à zéro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
