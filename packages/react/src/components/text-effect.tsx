"use client";

import type { ElementType } from "react";
import { createTextEffect } from "@nova-ui/core";
import type { TextEffectOptions } from "@nova-ui/core";
import { useNovaEngine } from "../hooks/use-nova-engine";
import type { PolymorphicProps } from "../polymorphic";

export type TextEffectProps<Tag extends ElementType = "span"> = PolymorphicProps<
  Tag,
  TextEffectOptions & { text: string }
>;

/**
 * Texte animé — dix-sept traitements sur un même primitif de fragmentation.
 *
 * Rendre un titre : `<TextEffect as="h1" text="Nova en mouvement" effect="line" />`.
 * Le titre reste annoncé d'une seule traite aux lecteurs d'écran, le texte est
 * rendu dès le serveur, et en `prefers-reduced-motion` rien n'est fragmenté du
 * tout — le texte reste brut.
 *
 * Les effets `reading`, `reading-blur` et `highlight` ne se déclenchent pas :
 * ils se pilotent au défilement. `trigger` est sans objet pour eux.
 */
export function TextEffect<Tag extends ElementType = "span">({
  as,
  text,
  effect,
  grain,
  trigger,
  duration,
  easing,
  rootMargin,
  threshold,
  onComplete,
  ...rest
}: TextEffectProps<Tag>) {
  const Component = (as ?? "span") as ElementType;
  const ref = useNovaEngine<HTMLElement, TextEffectOptions>(createTextEffect, {
    text,
    effect,
    grain,
    trigger,
    duration,
    easing,
    rootMargin,
    threshold,
    onComplete,
  });

  // Le texte est rendu côté serveur puis repris par le moteur : il reste
  // lisible sans JavaScript, et l'hydratation ne fait pas clignoter la page.
  return (
    <Component ref={ref} {...rest}>
      {text}
    </Component>
  );
}
