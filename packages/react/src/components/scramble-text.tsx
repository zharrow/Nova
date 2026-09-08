"use client";

import type { ElementType } from "react";
import { createScramble } from "@nova-ui/core";
import type { ScrambleOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type ScrambleTextProps<Tag extends ElementType = "span"> =
  PolymorphicProps<Tag, ScrambleOptions & { text: string }>;

/**
 * Texte qui se brouille puis se décode.
 *
 * Les caractères encore brouillés portent `data-nova-scrambled` : on les
 * colore en CSS via `--nova-accent`, sans que le composant ne connaisse la
 * palette du site.
 */
export function ScrambleText<Tag extends ElementType = "span">({
  as,
  text,
  chars,
  stepMs,
  scrambleSteps,
  spread,
  trigger,
  interval,
  replayOnHover,
  rootMargin,
  threshold,
  onComplete,
  ...rest
}: ScrambleTextProps<Tag>) {
  const Component = (as ?? "span") as ElementType;
  const ref = useNovaEngine<HTMLElement, ScrambleOptions>(createScramble, {
    text,
    chars,
    stepMs,
    scrambleSteps,
    spread,
    trigger,
    interval,
    replayOnHover,
    rootMargin,
    threshold,
    onComplete,
  });

  // Le texte est rendu côté serveur puis repris par le moteur : il reste
  // lisible sans JavaScript et l'hydratation ne fait pas clignoter la page.
  return (
    <Component ref={ref} {...rest}>
      {text}
    </Component>
  );
}
