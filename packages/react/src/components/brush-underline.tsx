"use client";

import type { ReactNode } from "react";
import { createBrushUnderline } from "@nova-ui/core";
import type { BrushUnderlineOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface BrushUnderlineProps
  extends BrushUnderlineOptions,
    Omit<React.ComponentPropsWithoutRef<"span">, "color"> {
  children?: ReactNode;
}

/**
 * Un trait de marqueur derrière un mot, qui se peint à l'entrée en vue.
 *
 * Le trait est un chemin SVG passé dans un filtre de turbulence : ses bords
 * sont rongés au bruit fractal, ce qui le fait lire comme un vrai coup de
 * pinceau plutôt que comme un rectangle arrondi.
 *
 * Varier `seed` d'une occurrence à l'autre : deux traits de même graine sont
 * identiques au pixel, et la répétition se voit.
 */
export function BrushUnderline({
  children,
  color,
  duration,
  delay,
  seed,
  weight,
  trigger,
  rootMargin,
  threshold,
  ...rest
}: BrushUnderlineProps) {
  const ref = useNovaEngine<HTMLSpanElement, BrushUnderlineOptions>(
    createBrushUnderline,
    { color, duration, delay, seed, weight, trigger, rootMargin, threshold },
  );

  return (
    <span ref={ref} {...rest}>
      {children}
    </span>
  );
}
