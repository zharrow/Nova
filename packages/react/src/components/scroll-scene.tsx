"use client";

import type { ElementType, ReactNode } from "react";
import { createScrollScene } from "@nova-ui/core";
import type { ScrollSceneOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type ScrollSceneProps<Tag extends ElementType = "section"> =
  PolymorphicProps<Tag, ScrollSceneOptions & { children?: ReactNode }>;

/**
 * Une scène dont le défilement fournit le temps.
 *
 * Le bloc doit être haut de plusieurs écrans — c'est sa traversée qui donne la
 * course. Les enfants sont montés dans un enfant collant qui reste à l'écran
 * pendant tout le trajet.
 *
 * Le moteur ne pose que des variables : `--nova-t`, `--nova-t-eased`, et une
 * par temps nommé. Tout le dessin est à vous.
 *
 * ```tsx
 * <ScrollScene className="h-[300vh]" beats={{ arrivee: [0.1, 0.4] }}>
 *   <div style={{ opacity: "var(--nova-arrivee)" }}>…</div>
 * </ScrollScene>
 * ```
 */
export function ScrollScene<Tag extends ElementType = "section">({
  as,
  children,
  beats,
  pulses,
  easing,
  restingProgress,
  onProgress,
  ...rest
}: ScrollSceneProps<Tag>) {
  const Component = (as ?? "section") as ElementType;
  const ref = useNovaEngine<HTMLElement, ScrollSceneOptions>(createScrollScene, {
    beats,
    pulses,
    easing,
    restingProgress,
    onProgress,
  });

  return (
    <Component ref={ref} {...rest}>
      <div className="nova-scroll-scene__pin">{children}</div>
    </Component>
  );
}
