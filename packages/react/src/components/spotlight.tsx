"use client";

import { createSpotlight } from "@nova-ui/core";
import type { SpotlightOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";

export interface SpotlightProps
  extends SpotlightOptions,
    React.ComponentPropsWithoutRef<"span"> {}

/**
 * Halo de repérage qui suit le curseur dans un panneau.
 *
 * À poser en enfant direct d'un conteneur `position: relative`. Inactif au
 * tactile et en `prefers-reduced-motion`. Le dessin se surcharge en CSS sur
 * `[data-nova-spotlight]` ; les coordonnées restent `--nova-spot-x/y`.
 */
export function Spotlight({ panel, radius, ...rest }: SpotlightProps) {
  const ref = useNovaEngine<HTMLSpanElement, SpotlightOptions>(createSpotlight, {
    panel,
    radius,
  });

  return <span ref={ref} {...rest} />;
}
