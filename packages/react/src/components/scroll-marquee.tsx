"use client";

import type { ReactNode } from "react";
import { createScrollMarquee } from "@nova-ui/core";
import type { ScrollMarqueeOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface ScrollMarqueeProps
  extends ScrollMarqueeOptions,
    Omit<React.ComponentPropsWithoutRef<"div">, "dir"> {
  children?: ReactNode;
}

/**
 * Bandeau entraîné par le défilement de la page.
 *
 * Il n'a pas de vitesse propre : il a une dérive, et la molette le pousse.
 * Descendre l'accélère, remonter le fait repartir en arrière — c'est ce qui le
 * sort du bandeau décoratif.
 *
 * Un enfant portant `data-nova-marquee-arrow` se retourne avec le sens de
 * marche : une flèche qui pointe devant alors que le bandeau recule se lit
 * comme un défaut.
 */
export function ScrollMarquee({
  children,
  drift,
  push,
  maxSpeed,
  smoothing,
  skew,
  maxSkew,
  hoverFactor,
  gap,
  ...rest
}: ScrollMarqueeProps) {
  const ref = useNovaEngine<HTMLDivElement, ScrollMarqueeOptions>(
    createScrollMarquee,
    { drift, push, maxSpeed, smoothing, skew, maxSkew, hoverFactor, gap },
  );

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
