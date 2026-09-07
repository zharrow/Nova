"use client";

import type { ReactNode } from "react";
import { createMarquee } from "@nova-ui/core";
import type { MarqueeOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface MarqueeProps
  extends MarqueeOptions,
    Omit<React.ComponentPropsWithoutRef<"div">, "dir"> {
  children?: ReactNode;
}

/**
 * Bandeau défilant infini.
 *
 * La vitesse est en pixels par seconde : deux bandeaux réglés sur la même
 * vitesse défilent au même rythme, quelle que soit la longueur de leur contenu.
 *
 * Le contenu passé en enfant est cloné autant de fois qu'il faut pour couvrir
 * la largeur — il doit donc rester purement présentationnel (pas de champ de
 * formulaire, pas d'`id` unique).
 */
export function Marquee({
  children,
  speed,
  direction,
  pauseOnHover,
  gap,
  ...rest
}: MarqueeProps) {
  const ref = useNovaEngine<HTMLDivElement, MarqueeOptions>(createMarquee, {
    speed,
    direction,
    pauseOnHover,
    gap,
  });

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
