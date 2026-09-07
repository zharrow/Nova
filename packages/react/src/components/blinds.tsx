"use client";

import type { ElementType } from "react";
import { createBlinds } from "@nova-ui/core";
import type { BlindsOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type BlindsProps<Tag extends ElementType = "div"> = PolymorphicProps<
  Tag,
  BlindsOptions & { children?: React.ReactNode }
>;

/**
 * Dévoilement en claustra : le contenu apparaît derrière des lames qui se
 * retirent une à une.
 *
 * Frère de `Reveal`, pas une de ses formes : il faut injecter des lames, ce
 * que personne qui veut un simple fondu ne devrait embarquer.
 *
 * Sans JavaScript, en `prefers-reduced-motion`, ou pour un bloc déjà à
 * l'écran : aucune lame n'est posée, le contenu est simplement visible.
 */
export function Blinds<Tag extends ElementType = "div">({
  as,
  children,
  count,
  orientation,
  retract,
  stagger,
  duration,
  delay,
  easing,
  color,
  trigger,
  rootMargin,
  threshold,
  onReveal,
  ...rest
}: BlindsProps<Tag>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useNovaEngine<HTMLElement, BlindsOptions>(createBlinds, {
    count,
    orientation,
    retract,
    stagger,
    duration,
    delay,
    easing,
    color,
    trigger,
    rootMargin,
    threshold,
    onReveal,
  });

  return (
    <Component ref={ref} {...rest}>
      {children}
    </Component>
  );
}
