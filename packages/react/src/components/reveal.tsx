"use client";

import type { ElementType } from "react";
import { createReveal, createRevealGroup } from "@nova-ui/core";
import type { RevealOptions, RevealGroupOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type RevealProps<Tag extends ElementType = "div"> = PolymorphicProps<
  Tag,
  RevealOptions & { children?: React.ReactNode }
>;

/**
 * Révèle son contenu à l'entrée en vue.
 *
 * L'état par défaut est visible : sans JavaScript, en `prefers-reduced-motion`
 * ou si le bloc est déjà à l'écran au montage, le contenu s'affiche tel quel.
 */
export function Reveal<Tag extends ElementType = "div">({
  as,
  children,
  variant,
  duration,
  delay,
  distance,
  easing,
  repeat,
  rootMargin,
  threshold,
  armRatio,
  onReveal,
  ...rest
}: RevealProps<Tag>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useNovaEngine<HTMLElement, RevealOptions>(createReveal, {
    variant,
    duration,
    delay,
    distance,
    easing,
    repeat,
    rootMargin,
    threshold,
    armRatio,
    onReveal,
  });

  return (
    <Component ref={ref} {...rest}>
      {children}
    </Component>
  );
}

export type RevealGroupProps<Tag extends ElementType = "div"> = PolymorphicProps<
  Tag,
  RevealGroupOptions & { children?: React.ReactNode }
>;

/**
 * Révèle ses enfants un à un, avec un décalage régulier.
 *
 * Le décalage est calculé depuis le DOM, pas en clonant les enfants React :
 * un enfant enveloppé dans un autre composant participe donc au rythme, ce qui
 * n'était pas le cas de la version d'origine.
 */
export function RevealGroup<Tag extends ElementType = "div">({
  as,
  children,
  selector,
  stagger,
  variant,
  duration,
  delay,
  distance,
  easing,
  repeat,
  rootMargin,
  threshold,
  armRatio,
  ...rest
}: RevealGroupProps<Tag>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useNovaEngine<HTMLElement, RevealGroupOptions>(createRevealGroup, {
    selector,
    stagger,
    variant,
    duration,
    delay,
    distance,
    easing,
    repeat,
    rootMargin,
    threshold,
    armRatio,
  });

  return (
    <Component ref={ref} {...rest}>
      {children}
    </Component>
  );
}
