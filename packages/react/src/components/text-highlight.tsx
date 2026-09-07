"use client";

import type { ElementType, ReactNode } from "react";
import { createTextHighlight } from "@nova-ui/core";
import type { TextHighlightOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type TextHighlightProps<Tag extends ElementType = "div"> =
  PolymorphicProps<Tag, TextHighlightOptions & { children?: ReactNode }>;

/**
 * Surligne un passage dans du contenu déjà rendu, une bande par ligne visuelle.
 *
 * Le passage n'a pas besoin d'être balisé : il est retrouvé dans le DOM, même
 * s'il traverse plusieurs balises ou se casse sur trois lignes.
 *
 * `className` va sur les BANDES, pas sur le conteneur — c'est là que vit la
 * couleur. `onMiss` prévient quand le passage est introuvable : à vous de
 * replier, le moteur ne devine pas à votre place.
 */
export function TextHighlight<Tag extends ElementType = "div">({
  as,
  children,
  text,
  className,
  stagger,
  duration,
  padding,
  trigger,
  rootMargin,
  threshold,
  onMiss,
  ...rest
}: TextHighlightProps<Tag>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useNovaEngine<HTMLElement, TextHighlightOptions>(
    createTextHighlight,
    {
      text,
      className,
      stagger,
      duration,
      padding,
      trigger,
      rootMargin,
      threshold,
      onMiss,
    },
  );

  return (
    <Component ref={ref} {...rest}>
      {children}
    </Component>
  );
}
