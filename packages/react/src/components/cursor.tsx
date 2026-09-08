"use client";

import { createCursor } from "@nova-ui/core";
import type { CursorOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface CursorProps
  extends CursorOptions,
    React.ComponentPropsWithoutRef<"div"> {}

/**
 * Curseur additif : un disque qui suit le pointeur et grossit sur les éléments
 * interactifs.
 *
 * Le curseur système reste visible — Nova l'augmente, ne le remplace pas.
 * Inactif au tactile et en `prefers-reduced-motion`. À monter une seule fois,
 * dans le layout racine.
 */
export function Cursor({
  variant,
  lerp,
  hoverScale,
  hoverSelector,
  ...rest
}: CursorProps) {
  const ref = useNovaEngine<HTMLDivElement, CursorOptions>(createCursor, {
    variant,
    lerp,
    hoverScale,
    hoverSelector,
  });

  return <div ref={ref} {...rest} />;
}
